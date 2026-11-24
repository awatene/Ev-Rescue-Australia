create table if not exists profiles (
  email text primary key,
  name text not null,
  phone text not null default '',
  role text not null default 'private',
  business_name text,
  abn text,
  provider text,
  photo text,
  updated_at bigint not null
);
