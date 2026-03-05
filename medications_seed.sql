-- Seed data for Meds Due testing.
-- Run after medications_schema.sql.
--
-- IMPORTANT:
-- 1) Replace OWNER_USER_ID with a real auth.users.id from your project.
-- 2) Run in Supabase SQL Editor.

do $$
declare
  OWNER_USER_ID uuid := 'cb3eb6b9-399c-4ec0-851d-bc6892bfe1ab';
  v_patient_id uuid;
  v_med_1 uuid;
  v_med_2 uuid;
  v_med_3 uuid;
  v_now timestamp with time zone := now();
begin
  if OWNER_USER_ID = '00000000-0000-0000-0000-000000000000'::uuid then
    raise exception 'Replace OWNER_USER_ID in medications_seed.sql before running.';
  end if;

  -- Reuse most recent patient for this user, or create one for testing.
  select p.id
  into v_patient_id
  from public.patients p
  where p.created_by = OWNER_USER_ID
  order by p.created_at desc
  limit 1;

  if v_patient_id is null then
    insert into public.patients (created_by, display_name, dob, sex)
    values (OWNER_USER_ID, 'Seed Patient', '2011-06-15', 'other')
    returning id into v_patient_id;
  end if;

  -- Ensure membership exists (trigger may already handle this on patient create).
  insert into public.patient_members (patient_id, user_id, role)
  values (v_patient_id, OWNER_USER_ID, 'owner')
  on conflict (patient_id, user_id) do nothing;

  insert into public.medications (patient_id, created_by, name, dose, instructions)
  values
    (v_patient_id, OWNER_USER_ID, 'Levetiracetam', '500mg oral', 'Take with food'),
    (v_patient_id, OWNER_USER_ID, 'Vitamin D3', '1000 IU oral', 'Morning dose'),
    (v_patient_id, OWNER_USER_ID, 'Ibuprofen', '200mg oral', 'As needed for pain');

  -- Fetch IDs for the seeded meds.
  select m.id
  into v_med_1
  from public.medications m
  where m.patient_id = v_patient_id
    and m.name = 'Levetiracetam'
  order by m.created_at desc
  limit 1;

  select m.id
  into v_med_2
  from public.medications m
  where m.patient_id = v_patient_id
    and m.name = 'Vitamin D3'
  order by m.created_at desc
  limit 1;

  select m.id
  into v_med_3
  from public.medications m
  where m.patient_id = v_patient_id
    and m.name = 'Ibuprofen'
  order by m.created_at desc
  limit 1;

  -- Insert upcoming pending doses (next few hours + tomorrow).
  insert into public.medication_doses (patient_id, medication_id, due_at, status, note, created_by)
  values
    (v_patient_id, v_med_1, v_now + interval '30 minutes', 'pending', 'Morning anticonvulsant', OWNER_USER_ID),
    (v_patient_id, v_med_2, v_now + interval '2 hours', 'pending', null, OWNER_USER_ID),
    (v_patient_id, v_med_3, v_now + interval '4 hours', 'pending', 'Only if needed', OWNER_USER_ID),
    (v_patient_id, v_med_1, v_now + interval '1 day', 'pending', 'Evening dose', OWNER_USER_ID);

  raise notice 'Seed complete. patient_id=%', v_patient_id;
end $$;
