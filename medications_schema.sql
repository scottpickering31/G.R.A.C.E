-- Medications domain schema for "Meds Due" and upcoming doses.
-- Run in Supabase SQL Editor.

create type public.medication_dose_status as enum (
  'pending',
  'taken',
  'skipped',
  'missed'
);

create table public.medications (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  name text not null,
  dose text null,
  instructions text null,
  active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table public.medication_doses (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  medication_id uuid not null references public.medications(id) on delete cascade,
  due_at timestamp with time zone not null,
  status public.medication_dose_status not null default 'pending',
  note text null,
  taken_at timestamp with time zone null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone not null default now()
);

create index if not exists idx_medications_patient on public.medications(patient_id);
create index if not exists idx_medications_active on public.medications(active);
create index if not exists idx_medication_doses_patient_due on public.medication_doses(patient_id, due_at);
create index if not exists idx_medication_doses_status_due on public.medication_doses(status, due_at);

alter table public.medications enable row level security;
alter table public.medication_doses enable row level security;

drop policy if exists medications_select_member on public.medications;
drop policy if exists medications_insert_editor on public.medications;
drop policy if exists medications_update_editor on public.medications;
drop policy if exists medications_delete_editor on public.medications;

create policy medications_select_member
on public.medications
for select
to authenticated
using (
  exists (
    select 1
    from public.patient_members pm
    where pm.patient_id = medications.patient_id
      and pm.user_id = auth.uid()
  )
);

create policy medications_insert_editor
on public.medications
for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.patient_members pm
    where pm.patient_id = medications.patient_id
      and pm.user_id = auth.uid()
      and pm.role in ('owner', 'caregiver', 'clinician')
  )
);

create policy medications_update_editor
on public.medications
for update
to authenticated
using (
  exists (
    select 1
    from public.patient_members pm
    where pm.patient_id = medications.patient_id
      and pm.user_id = auth.uid()
      and pm.role in ('owner', 'caregiver', 'clinician')
  )
)
with check (
  exists (
    select 1
    from public.patient_members pm
    where pm.patient_id = medications.patient_id
      and pm.user_id = auth.uid()
      and pm.role in ('owner', 'caregiver', 'clinician')
  )
);

create policy medications_delete_editor
on public.medications
for delete
to authenticated
using (
  exists (
    select 1
    from public.patient_members pm
    where pm.patient_id = medications.patient_id
      and pm.user_id = auth.uid()
      and pm.role in ('owner', 'caregiver', 'clinician')
  )
);

drop policy if exists medication_doses_select_member on public.medication_doses;
drop policy if exists medication_doses_insert_editor on public.medication_doses;
drop policy if exists medication_doses_update_editor on public.medication_doses;
drop policy if exists medication_doses_delete_editor on public.medication_doses;

create policy medication_doses_select_member
on public.medication_doses
for select
to authenticated
using (
  exists (
    select 1
    from public.patient_members pm
    where pm.patient_id = medication_doses.patient_id
      and pm.user_id = auth.uid()
  )
);

create policy medication_doses_insert_editor
on public.medication_doses
for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.patient_members pm
    where pm.patient_id = medication_doses.patient_id
      and pm.user_id = auth.uid()
      and pm.role in ('owner', 'caregiver', 'clinician')
  )
);

create policy medication_doses_update_editor
on public.medication_doses
for update
to authenticated
using (
  exists (
    select 1
    from public.patient_members pm
    where pm.patient_id = medication_doses.patient_id
      and pm.user_id = auth.uid()
      and pm.role in ('owner', 'caregiver', 'clinician')
  )
)
with check (
  exists (
    select 1
    from public.patient_members pm
    where pm.patient_id = medication_doses.patient_id
      and pm.user_id = auth.uid()
      and pm.role in ('owner', 'caregiver', 'clinician')
  )
);

create policy medication_doses_delete_editor
on public.medication_doses
for delete
to authenticated
using (
  exists (
    select 1
    from public.patient_members pm
    where pm.patient_id = medication_doses.patient_id
      and pm.user_id = auth.uid()
      and pm.role in ('owner', 'caregiver', 'clinician')
  )
);
