


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."new_image_with_tags" AS (
	"id" "uuid",
	"path" "text",
	"alt" "text",
	"tag_slugs" "text"[]
);


ALTER TYPE "public"."new_image_with_tags" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."images" (
    "id" "uuid" NOT NULL,
    "path" "text" NOT NULL,
    "alt" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "sort_key" numeric(30,15) NOT NULL
);


ALTER TABLE "public"."images" OWNER TO "postgres";


COMMENT ON TABLE "public"."images" IS 'image meta-data for images in the "images" bucket';



CREATE OR REPLACE FUNCTION "public"."create_image_with_tags"("p_path" "text", "p_alt" "text", "p_tag_slugs" "text"[]) RETURNS "public"."images"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_image public.images;
begin
  insert into public.images (path, alt)
  values (p_path, p_alt)
  returning * into v_image;

  -- upsert tags + junction
  with upserted_tags as (
    insert into public.tags (slug)
    select distinct unnest(p_tag_slugs)
    on conflict (slug) do update set slug = excluded.slug
    returning id, slug
  ), all_tag_ids as (
    -- include existing tags too (in case conflict path doesn't return them in some setups)
    select id from upserted_tags
    union
    select id from public.tags where slug = any(p_tag_slugs)
  )
  insert into public.image_tags (image_id, tag_id)
  select v_image.id, id
  from all_tag_ids
  on conflict do nothing;

  return v_image;
end;
$$;


ALTER FUNCTION "public"."create_image_with_tags"("p_path" "text", "p_alt" "text", "p_tag_slugs" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_image_with_tags"("p_image_id" "uuid", "p_path" "text", "p_alt" "text", "p_tag_slugs" "text"[]) RETURNS "public"."images"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_image public.images;
begin
  insert into public.images (id, path, alt)
  values (p_image_id, p_path, p_alt)
  returning * into v_image;

  -- upsert tags + junction
  with upserted_tags as (
    insert into public.tags (slug)
    select distinct unnest(p_tag_slugs)
    on conflict (slug) do update set slug = excluded.slug
    returning id, slug
  ), all_tag_ids as (
    -- include existing tags too (in case conflict path doesn't return them in some setups)
    select id from upserted_tags
    union
    select id from public.tags where slug = any(p_tag_slugs)
  )
  insert into public.image_tags (image_id, tag_id)
  select v_image.id, id
  from all_tag_ids
  on conflict do nothing;

  return v_image;
end;
$$;


ALTER FUNCTION "public"."create_image_with_tags"("p_image_id" "uuid", "p_path" "text", "p_alt" "text", "p_tag_slugs" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_images_with_tags_bulk"("p_items" "public"."new_image_with_tags"[]) RETURNS SETOF "public"."images"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  return query
  with
  input as (
    select
      row_number() over () as idx,
      (i).path as path,
      nullif((i).alt, '') as alt,
      coalesce((i).tag_slugs, '{}'::text[]) as tag_slugs
    from unnest(p_items) as i
  ),

  -- Upsert images by unique path, always returning a row (new or existing).
  upsert_images as (
    insert into public.images (id, path, alt)
    select id, path, alt
    from input
    on conflict (path) do update
      set
        -- keep existing alt if caller didn't provide one
        alt = coalesce(excluded.alt, public.images.alt)
    returning id, path, alt, created_at
  ),

  images_with_idx as (
    select
      input.idx,
      img.*
    from input
    join upsert_images img using (path)
  ),

  -- Collect all distinct slugs across the whole batch
  all_slugs as (
    select distinct slug
    from input
    cross join lateral unnest(input.tag_slugs) as slug
    where slug is not null and slug <> ''
  ),

  upsert_tags as (
    insert into public.tags (slug)
    select slug from all_slugs
    on conflict (slug) do update set slug = excluded.slug
    returning id, slug
  ),

  tag_map as (
    select id, slug from upsert_tags
    union
    select id, slug from public.tags where slug in (select slug from all_slugs)
  ),

  -- Insert junction rows (dedupe per-image slugs; ignore duplicates)
  ins_junction as (
    insert into public.image_tags (image_id, tag_id)
    select
      iw.id as image_id,
      tm.id as tag_id
    from images_with_idx iw
    join input on input.idx = iw.idx
    cross join lateral (
      select distinct slug
      from unnest(input.tag_slugs) as slug
      where slug is not null and slug <> ''
    ) s
    join tag_map tm on tm.slug = s.slug
    on conflict do nothing
    returning 1
  )

  select * from images_with_idx;
end;
$$;


ALTER FUNCTION "public"."create_images_with_tags_bulk"("p_items" "public"."new_image_with_tags"[]) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."image_tags" (
    "image_id" "uuid" NOT NULL,
    "tag_id" bigint NOT NULL
);


ALTER TABLE "public"."image_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" bigint NOT NULL,
    "slug" "text" NOT NULL
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


COMMENT ON TABLE "public"."tags" IS 'tags for images and more';



CREATE OR REPLACE VIEW "public"."image_metadata" AS
 SELECT "i"."id",
    "i"."path",
    COALESCE("i"."alt", ''::"text") AS "alt",
    COALESCE("array_agg"("t"."slug" ORDER BY "t"."slug") FILTER (WHERE ("t"."slug" IS NOT NULL)), '{}'::"text"[]) AS "tags"
   FROM (("public"."images" "i"
     JOIN "public"."image_tags" "it" ON (("it"."image_id" = "i"."id")))
     JOIN "public"."tags" "t" ON (("t"."id" = "it"."tag_id")))
  GROUP BY "i"."id", "i"."path", "i"."alt";


ALTER VIEW "public"."image_metadata" OWNER TO "postgres";


ALTER TABLE "public"."tags" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."tags_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."image_tags"
    ADD CONSTRAINT "image_tags_pkey" PRIMARY KEY ("image_id", "tag_id");



ALTER TABLE ONLY "public"."images"
    ADD CONSTRAINT "images_path_key" UNIQUE ("path");



ALTER TABLE ONLY "public"."images"
    ADD CONSTRAINT "images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."image_tags"
    ADD CONSTRAINT "image_tags_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."image_tags"
    ADD CONSTRAINT "image_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE "public"."image_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TABLE "public"."images" TO "anon";
GRANT ALL ON TABLE "public"."images" TO "authenticated";
GRANT ALL ON TABLE "public"."images" TO "service_role";



GRANT ALL ON FUNCTION "public"."create_image_with_tags"("p_path" "text", "p_alt" "text", "p_tag_slugs" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."create_image_with_tags"("p_path" "text", "p_alt" "text", "p_tag_slugs" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_image_with_tags"("p_path" "text", "p_alt" "text", "p_tag_slugs" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_image_with_tags"("p_image_id" "uuid", "p_path" "text", "p_alt" "text", "p_tag_slugs" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."create_image_with_tags"("p_image_id" "uuid", "p_path" "text", "p_alt" "text", "p_tag_slugs" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_image_with_tags"("p_image_id" "uuid", "p_path" "text", "p_alt" "text", "p_tag_slugs" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_images_with_tags_bulk"("p_items" "public"."new_image_with_tags"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."create_images_with_tags_bulk"("p_items" "public"."new_image_with_tags"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_images_with_tags_bulk"("p_items" "public"."new_image_with_tags"[]) TO "service_role";



GRANT ALL ON TABLE "public"."image_tags" TO "anon";
GRANT ALL ON TABLE "public"."image_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."image_tags" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";



GRANT ALL ON TABLE "public"."image_metadata" TO "anon";
GRANT ALL ON TABLE "public"."image_metadata" TO "authenticated";
GRANT ALL ON TABLE "public"."image_metadata" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tags_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tags_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tags_id_seq" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







