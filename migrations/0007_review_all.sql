alter table parts add column if not exists review text not null default 'live';
alter table services add column if not exists review text not null default 'live';
