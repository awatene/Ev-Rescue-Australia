alter table cars add column if not exists featured_until timestamptz;
alter table parts add column if not exists featured_until timestamptz;
alter table services add column if not exists featured_until timestamptz;

create table if not exists messages (
  id text primary key,
  kind text not null,
  ad_id text not null,
  ad_title text not null,
  seller_email text not null,
  buyer_email text not null,
  buyer_name text not null,
  body text not null,
  created_at bigint not null,
  read boolean not null default false,
  reply text,
  reply_at bigint
);

create table if not exists feature_payments (
  id text primary key,
  listing_kind text not null,
  listing_id text not null,
  plan text not null,
  method text not null,
  days integer not null,
  created_at timestamptz not null default now()
);
