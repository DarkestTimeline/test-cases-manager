-- Cloning a Step Block into another project ("Step Blocks" session 5)
--
-- Adds clone_step_block(), used by the "Clone to project..." menu on Step Blocks.
-- It only adds a function; nothing existing is changed. Run the whole file in
-- the Supabase SQL editor (one transaction).

begin;

create function public.clone_step_block(p_id uuid, p_target_project_id uuid)
 returns jsonb
 language plpgsql
 set search_path to 'public'
as $function$
declare
  v_source uuid;
  v_target_archived timestamptz;
  v_new uuid;
begin
  select project_id into v_source from step_blocks where id = p_id;
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

  -- The copy gets the next Step Block number in the target project. A block
  -- holds plain steps only (blocks cannot contain blocks), so nothing else needs
  -- to be copied or resolved.
  insert into step_blocks (project_id, title, steps, steps_text)
  select p_target_project_id, title, steps, steps_text
  from step_blocks
  where id = p_id
  returning id into v_new;

  return jsonb_build_object('id', v_new);
end;
$function$;

grant execute on function public.clone_step_block(uuid, uuid) to authenticated, service_role;

commit;
