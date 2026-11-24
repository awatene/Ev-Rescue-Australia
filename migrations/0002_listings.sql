create table if not exists cars (
  id text primary key,
  make text not null,
  model text not null,
  year integer not null,
  km integer not null default 0,
  price integer not null default 0,
  state text not null,
  city text not null,
  writeoff boolean not null default false,
  seller text not null default '',
  note text not null default '',
  featured boolean not null default false,
  vin text,
  photos jsonb not null default '[]'::jsonb,
  specs jsonb,
  contact_name text,
  contact_email text,
  contact_phone text,
  owner_email text,
  created_at timestamptz not null default now()
);

create table if not exists parts (
  id text primary key,
  title text not null,
  make text not null,
  model text not null default '',
  year text not null default '',
  state text not null,
  city text not null,
  price integer not null default 0,
  description text not null default '',
  photos jsonb not null default '[]'::jsonb,
  featured boolean not null default false,
  contact_name text,
  contact_email text,
  contact_phone text,
  owner_email text,
  created_at timestamptz not null default now()
);

create table if not exists services (
  id text primary key,
  name text not null,
  service_type text not null,
  state text not null,
  city text not null,
  note text not null default '',
  photos jsonb not null default '[]'::jsonb,
  featured boolean not null default false,
  phone text not null default '',
  email text not null default '',
  owner_email text,
  created_at timestamptz not null default now()
);
