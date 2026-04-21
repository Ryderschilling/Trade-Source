alter table contractors
  add column if not exists lat double precision,
  add column if not exists lng double precision;
