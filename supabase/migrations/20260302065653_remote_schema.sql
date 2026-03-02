


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


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."media_metadata_input" AS (
	"id" "uuid",
	"path" "text",
	"alt" "text",
	"type" "text",
	"tag_slugs" "text"[]
);


ALTER TYPE "public"."media_metadata_input" OWNER TO "postgres";


CREATE TYPE "public"."new_image_with_tags" AS (
	"id" "uuid",
	"path" "text",
	"alt" "text",
	"tag_slugs" "text"[]
);


ALTER TYPE "public"."new_image_with_tags" OWNER TO "postgres";

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



CREATE OR REPLACE FUNCTION "public"."create_media_metadata"("p_item" "public"."media_metadata_input", "p_upsert" boolean DEFAULT false) RETURNS "public"."media_metadata"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_media_metadata public.media_metadata;
BEGIN
  IF p_upsert THEN
    INSERT INTO public.media_metadata (id, path, alt, type)
    VALUES (p_item.id, p_item.path, p_item.alt, p_item.type)
    ON CONFLICT (id) DO UPDATE
      SET
        path = EXCLUDED.path,
        alt  = EXCLUDED.alt,
        type = EXCLUDED.type
    RETURNING * INTO v_media_metadata;
  ELSE
    INSERT INTO public.media_metadata (id, path, alt, type)
    VALUES (p_item.id, p_item.path, p_item.alt, p_item.type)
    RETURNING * INTO v_media_metadata;
  END IF;

  -- upsert tags + junction
  WITH upserted_tags AS (
    INSERT INTO public.tags (slug)
    SELECT DISTINCT unnest(COALESCE(p_item.tag_slugs, ARRAY[]::text[]))
    ON CONFLICT (slug) DO UPDATE
      SET slug = EXCLUDED.slug
    RETURNING id, slug
  ),
  all_tag_ids AS (
    -- include existing tags too
    SELECT id FROM upserted_tags
    UNION
    SELECT t.id
    FROM public.tags t
    WHERE t.slug = ANY (COALESCE(p_item.tag_slugs, ARRAY[]::text[]))
  )
  INSERT INTO public.media_tags (media_id, tag_id)
  SELECT v_media_metadata.id, id
  FROM all_tag_ids
  ON CONFLICT DO NOTHING;

  RETURN v_media_metadata;
END;
$$;


ALTER FUNCTION "public"."create_media_metadata"("p_item" "public"."media_metadata_input", "p_upsert" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_media_metadata_bulk"("p_items" "public"."media_metadata_input"[], "p_upsert" boolean DEFAULT false) RETURNS SETOF "public"."media_metadata"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF p_upsert THEN
    RETURN QUERY
    WITH items AS (
      SELECT *
      FROM unnest(p_items)
    ),

    ins_media AS (
      INSERT INTO public.media_metadata (id, path, alt, type)
      SELECT id, path, alt, type
      FROM items
      ON CONFLICT (id) DO UPDATE
        SET path = excluded.path,
            alt  = excluded.alt,
            type = excluded.type
      RETURNING *
    ),

    media_slugs AS (
      SELECT
        i.id AS media_id,
        unnest(COALESCE(i.tag_slugs, ARRAY[]::text[])) AS slug
      FROM items i
    ),

    distinct_slugs AS (
      SELECT DISTINCT slug
      FROM media_slugs
      WHERE slug IS NOT NULL AND slug <> ''
    ),

    upsert_tags AS (
      INSERT INTO public.tags (slug)
      SELECT slug
      FROM distinct_slugs
      ON CONFLICT (slug)
        DO UPDATE SET slug = excluded.slug
      RETURNING id, slug
    ),

    all_tags AS (
      SELECT id, slug FROM upsert_tags
      UNION
      SELECT t.id, t.slug
      FROM public.tags t
      JOIN distinct_slugs d USING (slug)
    ),

    ins_junction AS (
      INSERT INTO public.media_tags (media_id, tag_id)
      SELECT ms.media_id, at.id
      FROM media_slugs ms
      JOIN all_tags at USING (slug)
      ON CONFLICT DO NOTHING
    )

    SELECT *
    FROM ins_media;

  ELSE
    RETURN QUERY
    WITH items AS (
      SELECT *
      FROM unnest(p_items)
    ),

    ins_media AS (
      INSERT INTO public.media_metadata (id, path, alt, type)
      SELECT id, path, alt, type
      FROM items
      RETURNING *
    ),

    media_slugs AS (
      SELECT
        i.id AS media_id,
        unnest(COALESCE(i.tag_slugs, ARRAY[]::text[])) AS slug
      FROM items i
    ),

    distinct_slugs AS (
      SELECT DISTINCT slug
      FROM media_slugs
      WHERE slug IS NOT NULL AND slug <> ''
    ),

    upsert_tags AS (
      INSERT INTO public.tags (slug)
      SELECT slug
      FROM distinct_slugs
      ON CONFLICT (slug)
        DO UPDATE SET slug = excluded.slug
      RETURNING id, slug
    ),

    all_tags AS (
      SELECT id, slug FROM upsert_tags
      UNION
      SELECT t.id, t.slug
      FROM public.tags t
      JOIN distinct_slugs d USING (slug)
    ),

    ins_junction AS (
      INSERT INTO public.media_tags (media_id, tag_id)
      SELECT ms.media_id, at.id
      FROM media_slugs ms
      JOIN all_tags at USING (slug)
      ON CONFLICT DO NOTHING
    )

    SELECT *
    FROM ins_media;
  END IF;
END;
$$;


ALTER FUNCTION "public"."create_media_metadata_bulk"("p_items" "public"."media_metadata_input"[], "p_upsert" boolean) OWNER TO "postgres";


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




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON TABLE "public"."media_metadata" TO "anon";
GRANT ALL ON TABLE "public"."media_metadata" TO "authenticated";
GRANT ALL ON TABLE "public"."media_metadata" TO "service_role";



GRANT ALL ON FUNCTION "public"."create_media_metadata"("p_item" "public"."media_metadata_input", "p_upsert" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."create_media_metadata"("p_item" "public"."media_metadata_input", "p_upsert" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_media_metadata"("p_item" "public"."media_metadata_input", "p_upsert" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_media_metadata_bulk"("p_items" "public"."media_metadata_input"[], "p_upsert" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."create_media_metadata_bulk"("p_items" "public"."media_metadata_input"[], "p_upsert" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_media_metadata_bulk"("p_items" "public"."media_metadata_input"[], "p_upsert" boolean) TO "service_role";



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































drop extension if exists "pg_net";


