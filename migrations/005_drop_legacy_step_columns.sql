-- Drop the old steps_to_reproduce / expected_result columns ("Step Blocks" session 5)
--
-- Test cases and run results now keep their steps in the structured "steps"
-- column. This removes the two old text columns from test_cases and run_results.
--
-- It is built so that it cannot lose anything silently:
--   1. It stops (changing nothing) if any database function still mentions the
--      old columns, because dropping a column does not check function bodies.
--   2. Before dropping, any legacy text that has not been converted yet is turned
--      into structured steps, using the same rules as the CSV import: one step per
--      line (leading "1." / "-" markers removed), the expected result on the last
--      step. Rows that already have structured steps are left alone.
--
-- Run the whole file in the Supabase SQL editor. It runs as one transaction: if
-- anything fails, nothing is changed. Deploy the app version from this session
-- first (or at the same time).

begin;

-- 1. Safety check: no function may still use the old columns ------------------

do $$
declare
  found text;
begin
  select string_agg(p.proname, ', ' order by p.proname) into found
  from pg_proc p
  where p.pronamespace = 'public'::regnamespace
    and p.prokind in ('f', 'p')
    and (p.prosrc ilike '%steps_to_reproduce%' or p.prosrc ilike '%expected_result%');

  if found is not null then
    raise exception 'Not dropping the old columns: these functions still mention them: %. Update them first.', found;
  end if;
end;
$$;

-- 2. Temporary helpers (removed again at the end) -------------------------------

-- Plain text -> a rich text doc, one paragraph per line.
create function public.legacy_text_to_doc(p_text text)
 returns jsonb
 language sql
 immutable
as $function$
  select jsonb_build_object(
    'type', 'doc',
    'content', (
      select jsonb_agg(
        case
          when t.line = '' then jsonb_build_object('type', 'paragraph')
          else jsonb_build_object(
            'type', 'paragraph',
            'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', t.line)))
        end
        order by t.ord)
      from regexp_split_to_table(replace(coalesce(p_text, ''), E'\r', ''), E'\n')
           with ordinality as t(line, ord)
    )
  )
$function$;

-- The old two text columns -> a steps array.
create function public.legacy_text_to_steps(p_steps text, p_expected text)
 returns jsonb
 language sql
 volatile
as $function$
  with raw as (
    select btrim(regexp_replace(l.line, '^\s*(?:\d+[.)]|[-*•])\s+', '')) as txt, l.ord
    from regexp_split_to_table(replace(coalesce(p_steps, ''), E'\r', ''), E'\n')
         with ordinality as l(line, ord)
  ),
  numbered as (
    select txt, row_number() over (order by ord) as n from raw where txt <> ''
  ),
  limited as (select txt, n from numbered where n <= 200),
  total as (select count(*) as c from limited),
  exp as (select btrim(coalesce(p_expected, '')) as txt)
  select case
    when (select c from total) > 0 then (
      select jsonb_agg(
        jsonb_build_object(
          'id', gen_random_uuid()::text,
          'action', public.legacy_text_to_doc(l.txt),
          'data', null,
          'expected', case
            when l.n = (select c from total) and (select txt from exp) <> ''
              then public.legacy_text_to_doc((select txt from exp))
            else null
          end)
        order by l.n)
      from limited l)
    when (select txt from exp) <> '' then jsonb_build_array(jsonb_build_object(
      'id', gen_random_uuid()::text,
      'action', public.legacy_text_to_doc('Check the expected result'),
      'data', null,
      'expected', public.legacy_text_to_doc((select txt from exp))))
    else '[]'::jsonb
  end
$function$;

-- 3. Convert anything not converted yet --------------------------------------------

update public.test_cases
set steps = public.legacy_text_to_steps(steps_to_reproduce, expected_result),
    steps_text = concat_ws(E'\n', nullif(btrim(steps_to_reproduce), ''), nullif(btrim(expected_result), ''))
where steps = '[]'::jsonb
  and (btrim(steps_to_reproduce) <> '' or btrim(expected_result) <> '');

update public.run_results
set steps = public.legacy_text_to_steps(steps_to_reproduce, expected_result)
where steps = '[]'::jsonb
  and (btrim(steps_to_reproduce) <> '' or btrim(expected_result) <> '');

-- 4. Drop the old columns -----------------------------------------------------------

alter table public.test_cases
  drop column steps_to_reproduce,
  drop column expected_result;

alter table public.run_results
  drop column steps_to_reproduce,
  drop column expected_result;

-- 5. Remove the temporary helpers -------------------------------------------------

drop function public.legacy_text_to_steps(text, text);
drop function public.legacy_text_to_doc(text);

commit;
