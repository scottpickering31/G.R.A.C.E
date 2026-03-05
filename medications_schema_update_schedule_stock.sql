do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'medication_schedule_type'
      and n.nspname = 'public'
  ) then
    create type public.medication_schedule_type as enum (
      'as_needed',
      'daily_same_time',
      'one_off'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'medication_route'
      and n.nspname = 'public'
  ) then
    create type public.medication_route as enum (
      'oral',
      'sublingual',
      'buccal',
      'enteral_tube',
      'rectal',
      'vaginal',
      'topical',
      'transdermal',
      'inhalation',
      'nebulized',
      'intranasal',
      'ophthalmic',
      'otic',
      'subcutaneous',
      'intramuscular',
      'intravenous',
      'intradermal',
      'other'
    );
  end if;
end $$;

alter table public.medications
  add column if not exists schedule_type public.medication_schedule_type not null default 'as_needed',
  add column if not exists route public.medication_route not null default 'oral',
  add column if not exists one_off_due_at timestamp with time zone null,
  add column if not exists stock_quantity numeric(10,2) null,
  add column if not exists stock_unit text null,
  add column if not exists low_stock_threshold numeric(10,2) null;

create table if not exists public.medication_schedule_times (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.medications(id) on delete cascade,
  time_of_day time not null,
  created_at timestamp with time zone not null default now(),
  constraint medication_schedule_times_unique unique (medication_id, time_of_day)
);

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'medications_stock_non_negative'
      and conrelid = 'public.medications'::regclass
  ) then
    alter table public.medications drop constraint medications_stock_non_negative;
  end if;

  alter table public.medications
    add constraint medications_stock_non_negative
    check (
      (stock_quantity is null or stock_quantity >= 0)
      and (low_stock_threshold is null or low_stock_threshold >= 0)
    );
end $$;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'medications_schedule_consistency'
      and conrelid = 'public.medications'::regclass
  ) then
    alter table public.medications drop constraint medications_schedule_consistency;
  end if;

  alter table public.medications
    add constraint medications_schedule_consistency
    check (
      (schedule_type in ('as_needed', 'daily_same_time') and one_off_due_at is null)
      or (schedule_type = 'one_off' and one_off_due_at is not null)
    );
end $$;

create index if not exists idx_medications_schedule_type on public.medications(schedule_type);
create index if not exists idx_medications_one_off_due on public.medications(one_off_due_at);
create index if not exists idx_medications_route on public.medications(route);
create index if not exists idx_medication_schedule_times_medication on public.medication_schedule_times(medication_id);
create index if not exists idx_medication_schedule_times_time on public.medication_schedule_times(time_of_day);

alter table public.medication_schedule_times enable row level security;

drop policy if exists medication_schedule_times_select_member on public.medication_schedule_times;
drop policy if exists medication_schedule_times_insert_editor on public.medication_schedule_times;
drop policy if exists medication_schedule_times_update_editor on public.medication_schedule_times;
drop policy if exists medication_schedule_times_delete_editor on public.medication_schedule_times;

create policy medication_schedule_times_select_member
on public.medication_schedule_times
for select
to authenticated
using (
  exists (
    select 1
    from public.medications m
    join public.patient_members pm on pm.patient_id = m.patient_id
    where m.id = medication_schedule_times.medication_id
      and pm.user_id = auth.uid()
  )
);

create policy medication_schedule_times_insert_editor
on public.medication_schedule_times
for insert
to authenticated
with check (
  exists (
    select 1
    from public.medications m
    join public.patient_members pm on pm.patient_id = m.patient_id
    where m.id = medication_schedule_times.medication_id
      and pm.user_id = auth.uid()
      and pm.role in ('owner', 'caregiver', 'clinician')
  )
);

create policy medication_schedule_times_update_editor
on public.medication_schedule_times
for update
to authenticated
using (
  exists (
    select 1
    from public.medications m
    join public.patient_members pm on pm.patient_id = m.patient_id
    where m.id = medication_schedule_times.medication_id
      and pm.user_id = auth.uid()
      and pm.role in ('owner', 'caregiver', 'clinician')
  )
)
with check (
  exists (
    select 1
    from public.medications m
    join public.patient_members pm on pm.patient_id = m.patient_id
    where m.id = medication_schedule_times.medication_id
      and pm.user_id = auth.uid()
      and pm.role in ('owner', 'caregiver', 'clinician')
  )
);

create policy medication_schedule_times_delete_editor
on public.medication_schedule_times
for delete
to authenticated
using (
  exists (
    select 1
    from public.medications m
    join public.patient_members pm on pm.patient_id = m.patient_id
    where m.id = medication_schedule_times.medication_id
      and pm.user_id = auth.uid()
      and pm.role in ('owner', 'caregiver', 'clinician')
  )
);
