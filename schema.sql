


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


CREATE TYPE "public"."new_media_metadata_with_tags" AS (
	"id" "uuid",
	"path" "text",
	"alt" "text",
	"type" "text",
	"tag_slugs" "text"[]
);


ALTER TYPE "public"."new_media_metadata_with_tags" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."media_metadata" (
    "id" "uuid" NOT NULL,
    "path" "text" NOT NULL,
    "alt" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "sort_key" numeric(30,15) NOT NULL,
    "type" "text" NOT NULL
);


ALTER TABLE "public"."media_metadata" OWNER TO "postgres";


COMMENT ON TABLE "public"."media_metadata" IS 'metadata for media in the "media" bucket';



CREATE OR REPLACE FUNCTION "public"."create_images_with_tags_bulk"("p_items" "public"."new_image_with_tags"[]) RETURNS SETOF "public"."media_metadata"
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


CREATE OR REPLACE FUNCTION "public"."create_media_metadata"("p_id" "uuid", "p_path" "text", "p_alt" "text", "p_type" "text", "p_tag_slugs" "text"[]) RETURNS "public"."media_metadata"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_media_metadata public.media_metadata;
begin
  insert into public.media_metadata (id, path, alt, type)
  values (p_id, p_path, p_alt, p_type)
  returning * into v_media_metadata;

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
  insert into public.media_tags (image_id, tag_id)
  select v_media_metadata.id, id
  from all_tag_ids
  on conflict do nothing;

  return v_media_metadata;
end;
$$;


ALTER FUNCTION "public"."create_media_metadata"("p_id" "uuid", "p_path" "text", "p_alt" "text", "p_type" "text", "p_tag_slugs" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_media_metadata_bulk"("p_items" "public"."new_media_metadata_with_tags"[]) RETURNS SETOF "public"."media_metadata"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  return query
  with
  input as (
    select
      row_number() over () as idx,
      (i).id as id,
      (i).path as path,
      (i).alt as alt,
      (i).type as type,
      coalesce((i).tag_slugs, '{}'::text[]) as tag_slugs
    from unnest(p_items) as i
  ),
  inserted_media as (
    insert into public.media_metadata (id, path, alt, type)
    select id, path, alt, type
    from input
    returning *
  ),
  media_with_idx as (
    select
      input.idx,
      m.*
    from input
    join inserted_media m using (id)
  ),
  all_slugs as (
    select distinct slug
    from input
    cross join lateral unnest(input.tag_slugs) as slug
    where slug is not null and slug <> ''
  ),
  upserted_tags as (
    insert into public.tags (slug)
    select slug
    from all_slugs
    on conflict (slug) do update set slug = excluded.slug
    returning id, slug
  ),
  tag_map as (
    select id, slug from upserted_tags
    union
    select id, slug from public.tags where slug in (select slug from all_slugs)
  ),
  inserted_media_tags as (
    insert into public.media_tags (media_metadata_id, tag_id)
    select
      mw.id as media_metadata_id,
      tm.id as tag_id
    from media_with_idx mw
    join input on input.idx = mw.idx
    cross join lateral (
      select distinct slug
      from unnest(input.tag_slugs) as slug
      where slug is not null and slug <> ''
    ) as slugs
    join tag_map tm on tm.slug = slugs.slug
    on conflict do nothing
    returning 1
  )
  select
    mw.id,
    mw.path,
    mw.alt,
    mw.created_at,
    mw.sort_key,
    mw.type
  from media_with_idx mw
  order by mw.idx;
end;
$$;


ALTER FUNCTION "public"."create_media_metadata_bulk"("p_items" "public"."new_media_metadata_with_tags"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."images_autofill_sort_key"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.sort_key is null then
    select coalesce(max(i.sort_key), 0) + 10
      into new.sort_key
    from public.images i;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."images_autofill_sort_key"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."address" (
    "id" bigint NOT NULL,
    "street" "text",
    "city" "text",
    "state" "text",
    "zip" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."address" OWNER TO "postgres";


ALTER TABLE "public"."address" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."address_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" bigint NOT NULL,
    "date" timestamp with time zone NOT NULL,
    "title" "text",
    "venue" "text",
    "description" "text",
    "address_id" bigint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."events" OWNER TO "postgres";


ALTER TABLE "public"."events" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE OR REPLACE VIEW "public"."media_metadata_view" WITH ("security_invoker"='true') AS
 SELECT NULL::"uuid" AS "id",
    NULL::"text" AS "path",
    NULL::"text" AS "type",
    NULL::"text" AS "alt",
    NULL::"text"[] AS "tags";


ALTER VIEW "public"."media_metadata_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."media_tags" (
    "media_metadata_id" "uuid" NOT NULL,
    "tag_id" bigint NOT NULL
);


ALTER TABLE "public"."media_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."songs" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."songs" OWNER TO "postgres";


ALTER TABLE "public"."songs" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."songs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" bigint NOT NULL,
    "slug" "text" NOT NULL
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


COMMENT ON TABLE "public"."tags" IS 'tags for images and more';



ALTER TABLE "public"."tags" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."tags_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."address"
    ADD CONSTRAINT "address_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."media_metadata"
    ADD CONSTRAINT "images_path_key" UNIQUE ("path");



ALTER TABLE ONLY "public"."media_metadata"
    ADD CONSTRAINT "images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."media_tags"
    ADD CONSTRAINT "media_tags_pkey" PRIMARY KEY ("media_metadata_id", "tag_id");



ALTER TABLE ONLY "public"."songs"
    ADD CONSTRAINT "songs_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."songs"
    ADD CONSTRAINT "songs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_slug_key" UNIQUE ("slug");



CREATE OR REPLACE TRIGGER "trg_images_autofill_sort_key" BEFORE INSERT ON "public"."media_metadata" FOR EACH ROW EXECUTE FUNCTION "public"."images_autofill_sort_key"();



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "public"."address"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."media_tags"
    ADD CONSTRAINT "media_tags_media_metadata_id_fkey" FOREIGN KEY ("media_metadata_id") REFERENCES "public"."media_metadata"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."media_tags"
    ADD CONSTRAINT "media_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



CREATE POLICY "Enable read access for all users" ON "public"."address" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."events" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."media_metadata" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."media_tags" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."songs" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."tags" FOR SELECT USING (true);



ALTER TABLE "public"."address" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."media_metadata" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."media_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."songs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TABLE "public"."media_metadata" TO "anon";
GRANT ALL ON TABLE "public"."media_metadata" TO "authenticated";
GRANT ALL ON TABLE "public"."media_metadata" TO "service_role";



GRANT ALL ON FUNCTION "public"."create_images_with_tags_bulk"("p_items" "public"."new_image_with_tags"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."create_images_with_tags_bulk"("p_items" "public"."new_image_with_tags"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_images_with_tags_bulk"("p_items" "public"."new_image_with_tags"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_media_metadata"("p_id" "uuid", "p_path" "text", "p_alt" "text", "p_type" "text", "p_tag_slugs" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."create_media_metadata"("p_id" "uuid", "p_path" "text", "p_alt" "text", "p_type" "text", "p_tag_slugs" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_media_metadata"("p_id" "uuid", "p_path" "text", "p_alt" "text", "p_type" "text", "p_tag_slugs" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_media_metadata_bulk"("p_items" "public"."new_media_metadata_with_tags"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."create_media_metadata_bulk"("p_items" "public"."new_media_metadata_with_tags"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_media_metadata_bulk"("p_items" "public"."new_media_metadata_with_tags"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."images_autofill_sort_key"() TO "anon";
GRANT ALL ON FUNCTION "public"."images_autofill_sort_key"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."images_autofill_sort_key"() TO "service_role";



GRANT ALL ON TABLE "public"."address" TO "anon";
GRANT ALL ON TABLE "public"."address" TO "authenticated";
GRANT ALL ON TABLE "public"."address" TO "service_role";



GRANT ALL ON SEQUENCE "public"."address_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."address_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."address_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."events_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."media_metadata_view" TO "anon";
GRANT ALL ON TABLE "public"."media_metadata_view" TO "authenticated";
GRANT ALL ON TABLE "public"."media_metadata_view" TO "service_role";



GRANT ALL ON TABLE "public"."media_tags" TO "anon";
GRANT ALL ON TABLE "public"."media_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."media_tags" TO "service_role";



GRANT ALL ON TABLE "public"."songs" TO "anon";
GRANT ALL ON TABLE "public"."songs" TO "authenticated";
GRANT ALL ON TABLE "public"."songs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."songs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."songs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."songs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";



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






