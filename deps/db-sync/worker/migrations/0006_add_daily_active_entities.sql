create table if not exists daily_active_entities (
  day_utc text,
  entity_type text,
  entity_id text,
  first_seen_at integer,
  primary key (day_utc, entity_type, entity_id),
  check (entity_type in ('user', 'graph'))
);

create index if not exists idx_daily_active_entities_type_day
on daily_active_entities (entity_type, day_utc);
