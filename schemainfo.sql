create table public.patient_members (
  patient_id uuid not null,
  user_id uuid not null,
  role public.patient_role not null default 'caregiver'::patient_role,
  created_at timestamp with time zone not null default now(),
  constraint patient_members_pkey primary key (patient_id, user_id),
  constraint patient_members_patient_id_fkey foreign KEY (patient_id) references patients (id) on delete CASCADE,
  constraint patient_members_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_patient_members_user on public.patient_members using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_patient_members_patient on public.patient_members using btree (patient_id) TABLESPACE pg_default;

create table public.patients (
  id uuid not null default gen_random_uuid (),
  created_by uuid not null,
  display_name text not null,
  dob date null,
  sex text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint patients_pkey primary key (id),
  constraint patients_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_patients_created_by on public.patients using btree (created_by) TABLESPACE pg_default;

create trigger on_patient_created_add_owner
after INSERT on patients for EACH row
execute FUNCTION add_patient_owner_member ();

create table public.profiles (
  id uuid not null,
  updated_at timestamp with time zone null,
  username text null,
  full_name text null,
  avatar_url text null,
  website text null,
  onboarding_completed_at timestamp with time zone null,
  email text null,
  constraint profiles_pkey primary key (id),
  constraint profiles_username_key unique (username),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint username_length check ((char_length(username) >= 3))
) TABLESPACE pg_default;