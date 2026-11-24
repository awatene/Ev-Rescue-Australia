create table if not exists temp_passwords (
  email text primary key,
  created_at timestamptz not null default now()
);
