drop trigger if exists "trg_images_autofill_sort_key" on "public"."media_metadata";

drop policy "Enable read access for all users" on "public"."media_metadata";

drop policy "Enable read access for all users" on "public"."media_tags";

drop policy "Enable read access for all users" on "public"."tags";

revoke delete on table "public"."media_metadata" from "anon";

revoke insert on table "public"."media_metadata" from "anon";

revoke references on table "public"."media_metadata" from "anon";

revoke select on table "public"."media_metadata" from "anon";

revoke trigger on table "public"."media_metadata" from "anon";

revoke truncate on table "public"."media_metadata" from "anon";

revoke update on table "public"."media_metadata" from "anon";

revoke delete on table "public"."media_metadata" from "authenticated";

revoke insert on table "public"."media_metadata" from "authenticated";

revoke references on table "public"."media_metadata" from "authenticated";

revoke select on table "public"."media_metadata" from "authenticated";

revoke trigger on table "public"."media_metadata" from "authenticated";

revoke truncate on table "public"."media_metadata" from "authenticated";

revoke update on table "public"."media_metadata" from "authenticated";

revoke delete on table "public"."media_metadata" from "service_role";

revoke insert on table "public"."media_metadata" from "service_role";

revoke references on table "public"."media_metadata" from "service_role";

revoke select on table "public"."media_metadata" from "service_role";

revoke trigger on table "public"."media_metadata" from "service_role";

revoke truncate on table "public"."media_metadata" from "service_role";

revoke update on table "public"."media_metadata" from "service_role";

revoke delete on table "public"."media_tags" from "anon";

revoke insert on table "public"."media_tags" from "anon";

revoke references on table "public"."media_tags" from "anon";

revoke select on table "public"."media_tags" from "anon";

revoke trigger on table "public"."media_tags" from "anon";

revoke truncate on table "public"."media_tags" from "anon";

revoke update on table "public"."media_tags" from "anon";

revoke delete on table "public"."media_tags" from "authenticated";

revoke insert on table "public"."media_tags" from "authenticated";

revoke references on table "public"."media_tags" from "authenticated";

revoke select on table "public"."media_tags" from "authenticated";

revoke trigger on table "public"."media_tags" from "authenticated";

revoke truncate on table "public"."media_tags" from "authenticated";

revoke update on table "public"."media_tags" from "authenticated";

revoke delete on table "public"."media_tags" from "service_role";

revoke insert on table "public"."media_tags" from "service_role";

revoke references on table "public"."media_tags" from "service_role";

revoke select on table "public"."media_tags" from "service_role";

revoke trigger on table "public"."media_tags" from "service_role";

revoke truncate on table "public"."media_tags" from "service_role";

revoke update on table "public"."media_tags" from "service_role";

revoke delete on table "public"."tags" from "anon";

revoke insert on table "public"."tags" from "anon";

revoke references on table "public"."tags" from "anon";

revoke select on table "public"."tags" from "anon";

revoke trigger on table "public"."tags" from "anon";

revoke truncate on table "public"."tags" from "anon";

revoke update on table "public"."tags" from "anon";

revoke delete on table "public"."tags" from "authenticated";

revoke insert on table "public"."tags" from "authenticated";

revoke references on table "public"."tags" from "authenticated";

revoke select on table "public"."tags" from "authenticated";

revoke trigger on table "public"."tags" from "authenticated";

revoke truncate on table "public"."tags" from "authenticated";

revoke update on table "public"."tags" from "authenticated";

revoke delete on table "public"."tags" from "service_role";

revoke insert on table "public"."tags" from "service_role";

revoke references on table "public"."tags" from "service_role";

revoke select on table "public"."tags" from "service_role";

revoke trigger on table "public"."tags" from "service_role";

revoke truncate on table "public"."tags" from "service_role";

revoke update on table "public"."tags" from "service_role";

alter table "public"."media_metadata" drop constraint "images_path_key";

alter table "public"."media_tags" drop constraint "media_tags_media_metadata_id_fkey";

alter table "public"."media_tags" drop constraint "media_tags_tag_id_fkey";

alter table "public"."tags" drop constraint "tags_slug_key";

drop function if exists "public"."create_media_metadata"(p_item public.media_metadata_input, p_upsert boolean);

drop function if exists "public"."create_media_metadata_bulk"(p_items public.media_metadata_input[], p_upsert boolean);

drop function if exists "public"."images_autofill_sort_key"();

drop view if exists "public"."media_metadata_view";

alter table "public"."media_metadata" drop constraint "images_pkey";

alter table "public"."media_tags" drop constraint "media_tags_pkey";

alter table "public"."tags" drop constraint "tags_pkey";

drop index if exists "public"."images_path_key";

drop index if exists "public"."images_pkey";

drop index if exists "public"."media_tags_pkey";

drop index if exists "public"."tags_pkey";

drop index if exists "public"."tags_slug_key";

drop table "public"."media_metadata";

drop table "public"."media_tags";

drop table "public"."tags";

set check_function_bodies = off;

create or replace view "public"."media_bucket_data" as  SELECT name AS path,
    (metadata ->> 'mimetype'::text) AS "mimeType",
    (user_metadata ->> 'alt'::text) AS alt,
    ARRAY( SELECT jsonb_array_elements_text(((objects.user_metadata ->> 'tags'::text))::jsonb) AS jsonb_array_elements_text) AS tags
   FROM storage.objects
  WHERE (name !~ '(^|/)\.[^/]+$'::text);


CREATE OR REPLACE FUNCTION public.media_metadata_autofill_sort_key()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.sort_key is null then
    select coalesce(max(i.sort_key), 0) + 10
      into new.sort_key
    from public.media_metadata i;
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.on_storage_objects_write()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
begin



  return new;
end;
$function$
;


