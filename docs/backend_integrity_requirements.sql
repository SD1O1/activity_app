-- Required data-integrity SQL for secure-backend-refactor.
--
-- 1) Atomic join approval and delete cascade RPCs
-- 2) Unique and foreign-key constraints to prevent orphaned records
-- 3) Performance indexes for high-frequency filters

-- ============================
-- UNIQUE CONSTRAINTS (dedupe)
-- ============================
alter table if exists activity_members
  add constraint if not exists activity_members_activity_user_unique
  unique (activity_id, user_id);

alter table if exists join_requests
  add constraint if not exists join_requests_activity_requester_unique
  unique (activity_id, requester_id);

alter table if exists conversation_participants
  add constraint if not exists conversation_participants_conversation_user_unique
  unique (conversation_id, user_id);

-- ============================
-- FOREIGN KEYS (orphan control)
-- ============================
-- If your schema already has these, keep existing constraints.
alter table if exists activity_members
  add constraint if not exists activity_members_activity_fk
  foreign key (activity_id) references activities(id) on delete cascade;

alter table if exists activity_members
  add constraint if not exists activity_members_user_fk
  foreign key (user_id) references profiles(id) on delete cascade;

alter table if exists join_requests
  add constraint if not exists join_requests_activity_fk
  foreign key (activity_id) references activities(id) on delete cascade;

alter table if exists join_requests
  add constraint if not exists join_requests_requester_fk
  foreign key (requester_id) references profiles(id) on delete cascade;

alter table if exists conversations
  add constraint if not exists conversations_activity_fk
  foreign key (activity_id) references activities(id) on delete cascade;

alter table if exists messages
  add constraint if not exists messages_conversation_fk
  foreign key (conversation_id) references conversations(id) on delete cascade;

alter table if exists conversation_participants
  add constraint if not exists conversation_participants_conversation_fk
  foreign key (conversation_id) references conversations(id) on delete cascade;

alter table if exists conversation_participants
  add constraint if not exists conversation_participants_user_fk
  foreign key (user_id) references profiles(id) on delete cascade;

alter table if exists notifications
  add constraint if not exists notifications_activity_fk
  foreign key (activity_id) references activities(id) on delete set null;

alter table if exists notifications
  add constraint if not exists notifications_user_fk
  foreign key (user_id) references profiles(id) on delete cascade;

alter table if exists notifications
  add constraint if not exists notifications_actor_fk
  foreign key (actor_id) references profiles(id) on delete set null;

-- ============================
-- INDEXES (performance)
-- ============================
create index if not exists notifications_user_is_read_idx
  on notifications (user_id, is_read);

create index if not exists join_requests_activity_requester_idx
  on join_requests (activity_id, requester_id);

create index if not exists activity_members_activity_user_idx
  on activity_members (activity_id, user_id);

create index if not exists notifications_chat_recent_idx
  on notifications (type, actor_id, user_id, activity_id, created_at desc);

-- ============================
-- ATOMIC JOIN APPROVAL
-- ============================
create or replace function approve_join_request_atomic(
  p_join_request_id uuid,
  p_host_id uuid
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_jr join_requests%rowtype;
  v_activity activities%rowtype;
  v_inserted_membership_count integer;
begin
  select * into v_jr
  from join_requests
  where id = p_join_request_id
  for update;

  if v_jr.id is null then
    return jsonb_build_object('ok', false, 'code', 'BAD_REQUEST', 'message', 'Join request not found');
  end if;

  if v_jr.status <> 'pending' then
    return jsonb_build_object('ok', false, 'code', 'BAD_REQUEST', 'message', 'Join request is not pending');
  end if;

  select * into v_activity
  from activities
  where id = v_jr.activity_id and status <> 'deleted'
  for update;

  if v_activity.id is null then
    return jsonb_build_object('ok', false, 'code', 'BAD_REQUEST', 'message', 'Activity not found');
  end if;

  if v_activity.host_id <> p_host_id then
    return jsonb_build_object('ok', false, 'code', 'BAD_REQUEST', 'message', 'Forbidden');
  end if;

  if v_activity.status = 'completed' then
    return jsonb_build_object('ok', false, 'code', 'BAD_REQUEST', 'message', 'Activity has already ended');
  end if;

  if v_activity.member_count >= v_activity.max_members or v_activity.status = 'full' then
    return jsonb_build_object('ok', false, 'code', 'CONFLICT', 'message', 'Activity is full');
  end if;

  insert into activity_members (activity_id, user_id, role, status)
  values (v_jr.activity_id, v_jr.requester_id, 'member', 'active')
  on conflict (activity_id, user_id) do nothing;

  get diagnostics v_inserted_membership_count = row_count;

  if v_inserted_membership_count = 0 then
    return jsonb_build_object('ok', false, 'code', 'CONFLICT', 'message', 'User is already an activity member');
  end if;

  update activities
  set
    member_count = member_count + 1,
    status = case
      when member_count + 1 >= max_members then 'full'
      when status = 'full' then 'open'
      else status
    end
  where id = v_activity.id;

  update join_requests
  set status = 'approved'
  where id = v_jr.id;

  insert into notifications (user_id, actor_id, type, message, activity_id)
  values (
    v_jr.requester_id,
    p_host_id,
    'join_approved',
    'Your request to join "' || coalesce(v_activity.title, 'activity') || '" was approved',
    v_jr.activity_id
  );

  return jsonb_build_object('ok', true, 'code', 'OK', 'message', 'Approved');
exception
  when others then
    return jsonb_build_object('ok', false, 'code', 'INTERNAL', 'message', sqlerrm);
end;
$$;

-- ============================
-- ATOMIC ACTIVITY DELETE CASCADE/CLEANUP
-- ============================
create or replace function delete_activity_cascade_atomic(
  p_activity_id uuid,
  p_actor_id uuid
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_activity activities%rowtype;
  v_conversation_ids uuid[];
begin
  select * into v_activity
  from activities
  where id = p_activity_id
  for update;

  if v_activity.id is null then
    return jsonb_build_object('ok', false, 'code', 'NOT_FOUND', 'message', 'Activity not found');
  end if;

  if v_activity.status = 'deleted' then
    return jsonb_build_object('ok', true, 'code', 'OK', 'message', 'Already deleted');
  end if;

  if v_activity.host_id <> p_actor_id then
    return jsonb_build_object('ok', false, 'code', 'FORBIDDEN', 'message', 'Forbidden');
  end if;

  insert into notifications (user_id, actor_id, type, message, activity_id)
  select am.user_id, p_actor_id, 'activity_deleted', 'An activity you joined was cancelled', p_activity_id
  from activity_members am
  where am.activity_id = p_activity_id
    and am.user_id <> v_activity.host_id;

  select array_agg(id) into v_conversation_ids
  from conversations
  where activity_id = p_activity_id;

  if v_conversation_ids is not null then
    delete from messages where conversation_id = any(v_conversation_ids);
    delete from conversation_participants where conversation_id = any(v_conversation_ids);
  end if;

  delete from conversations where activity_id = p_activity_id;
  delete from activity_members where activity_id = p_activity_id;
  delete from join_requests where activity_id = p_activity_id;
  delete from notifications where activity_id = p_activity_id and type <> 'activity_deleted';

  update activities
  set status = 'deleted'
  where id = p_activity_id;

  return jsonb_build_object('ok', true, 'code', 'OK', 'message', 'Deleted');
exception
  when others then
    return jsonb_build_object('ok', false, 'code', 'INTERNAL', 'message', sqlerrm);
end;
$$;
