-- Structured test case steps ("Step Blocks" session 2)
--
-- Additive migration: it adds the new columns and points the clone / export
-- functions at them. The old steps_to_reproduce / expected_result columns are
-- left in place (and untouched) until a later cleanup, so the running app keeps
-- working while you deploy.
--
-- Run the whole file in the Supabase SQL editor. It runs as one transaction:
-- if anything fails, nothing is changed.

begin;

-- 1. New columns -----------------------------------------------------------

alter table public.test_cases
  add column steps jsonb not null default '[]'::jsonb,
  add column steps_text text not null default '',
  add constraint test_cases_steps_is_array check (jsonb_typeof(steps) = 'array');

alter table public.run_results
  add column steps jsonb not null default '[]'::jsonb,
  add constraint run_results_steps_is_array check (jsonb_typeof(steps) = 'array'),
  -- New run results no longer fill these two, but they are NOT NULL.
  alter column steps_to_reproduce set default '',
  alter column expected_result set default '';

-- 2. Cloning to another project: copy the new columns ------------------------
-- Identical to the current function except for the test_cases insert in step 1.

create or replace function public.clone_to_project(p_kind text, p_id uuid, p_target_project_id uuid)
 returns jsonb
 language plpgsql
 set search_path to 'public'
as $function$
declare
  v_source uuid;
  v_target_archived timestamptz;
  v_case_ids uuid[];
  v_module_ids uuid[];
  v_new_case_ids uuid[] := '{}';
  v_new_module_ids uuid[] := '{}';
  v_modules_created int := 0;
  v_modules_reused int := 0;
  v_top uuid;
  v_new uuid;
  v_new_m uuid;
  v_new_c uuid;
  v_idx int;
  v_pos int;
  r record;
begin
  v_source := clone_source_project(p_kind, p_id);
  if v_source is null then
    raise exception 'That item could not be found.';
  end if;

  select archived_at into v_target_archived from projects where id = p_target_project_id;
  if not found then
    raise exception 'The target project does not exist.';
  end if;
  if v_target_archived is not null then
    raise exception 'The target project is archived.';
  end if;
  if v_source = p_target_project_id then
    raise exception 'Choose a different project from the one this item is already in.';
  end if;

  select cs.case_ids, cs.module_ids
    into v_case_ids, v_module_ids
  from clone_scope(p_kind, p_id) cs;

  -- 1. Copy the test cases, in source order.
  for v_idx in 1 .. coalesce(array_length(v_case_ids, 1), 0) loop
    insert into test_cases (project_id, title, preconditions, steps, steps_text, priority)
    select p_target_project_id, title, preconditions, steps, steps_text, priority
    from test_cases
    where id = v_case_ids[v_idx]
    returning id into v_new;
    v_new_case_ids := v_new_case_ids || v_new;
  end loop;

  -- 2. Create or reuse the modules.
  for v_idx in 1 .. coalesce(array_length(v_module_ids, 1), 0) loop
    v_new := null;
    select t.id into v_new
    from modules t
    where t.project_id = p_target_project_id
      and t.archived_at is null
      and lower(t.name) = (select lower(name) from modules where id = v_module_ids[v_idx])
    order by t.seq_number
    limit 1;

    if v_new is null then
      insert into modules (project_id, name, description)
      select p_target_project_id, name, description
      from modules
      where id = v_module_ids[v_idx]
      returning id into v_new;
      v_modules_created := v_modules_created + 1;
    else
      v_modules_reused := v_modules_reused + 1;
    end if;
    v_new_module_ids := v_new_module_ids || v_new;
  end loop;

  -- 3. Link copied cases to the modules (only links among copied items),
  --    appending after whatever a reused module already contains.
  for r in
    select mc.module_id, mc.test_case_id
    from module_cases mc
    where mc.module_id = any(v_module_ids)
      and mc.test_case_id = any(v_case_ids)
    order by mc.module_id, coalesce(mc.position, 2147483647), mc.created_at
  loop
    v_new_m := v_new_module_ids[array_position(v_module_ids, r.module_id)];
    v_new_c := v_new_case_ids[array_position(v_case_ids, r.test_case_id)];
    select coalesce(max(position), -1) + 1 into v_pos
    from module_cases where module_id = v_new_m;
    insert into module_cases (project_id, module_id, test_case_id, position)
    values (p_target_project_id, v_new_m, v_new_c, v_pos);
  end loop;

  -- 4. Suites: create the suite and link the copied cases in order.
  if p_kind = 'suite' then
    insert into suites (project_id, name, description)
    select p_target_project_id, name, description
    from suites
    where id = p_id
    returning id into v_top;

    for v_idx in 1 .. coalesce(array_length(v_new_case_ids, 1), 0) loop
      insert into suite_cases (project_id, suite_id, test_case_id, position)
      values (p_target_project_id, v_top, v_new_case_ids[v_idx], v_idx - 1);
    end loop;
  elsif p_kind = 'module' then
    v_top := v_new_module_ids[1];
  else
    v_top := v_new_case_ids[1];
  end if;

  return jsonb_build_object(
    'id', v_top,
    'cases', coalesce(array_length(v_new_case_ids, 1), 0),
    'modules_created', v_modules_created,
    'modules_reused', v_modules_reused
  );
end;
$function$;

-- 3. CSV export: return the steps instead of the two text columns ------------
-- The result columns change, so the function has to be dropped and recreated.

drop function if exists public.export_test_cases(uuid, uuid, uuid);

create function public.export_test_cases(p_project_id uuid, p_suite_id uuid default null::uuid, p_module_id uuid default null::uuid)
 returns table(id uuid, seq_number integer, title text, preconditions text, steps jsonb, priority text, module_names text[])
 language sql
 stable
 set search_path to 'public'
as $function$
  select
    tc.id,
    tc.seq_number,
    tc.title,
    tc.preconditions,
    tc.steps,
    tc.priority,
    coalesce(
      (
        select array_agg(m.name order by m.name)
        from module_cases mc
        join modules m on m.id = mc.module_id
        where mc.test_case_id = tc.id and m.archived_at is null
      ),
      '{}'
    ) as module_names
  from test_cases tc
  where tc.project_id = p_project_id
    and tc.archived_at is null
    and (
      p_suite_id is null
      or exists (select 1 from suite_cases sc where sc.test_case_id = tc.id and sc.suite_id = p_suite_id)
    )
    and (
      p_module_id is null
      or exists (select 1 from module_cases mc2 where mc2.test_case_id = tc.id and mc2.module_id = p_module_id)
    );
$function$;

grant execute on function public.export_test_cases(uuid, uuid, uuid) to authenticated, service_role;

commit;
