create table if not exists ad_reports (
  id text primary key,
  kind text not null,
  ad_id text not null,
  ad_title text not null default '',
  reporter_email text not null,
  reporter_name text not null default '',
  reason text not null default '',
  note text not null default '',
  status text not null default 'open',
  created_at bigint not null
);
