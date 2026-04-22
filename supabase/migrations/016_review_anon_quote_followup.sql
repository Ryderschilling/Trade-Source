-- Add anonymous flag to reviews
alter table reviews
  add column if not exists is_anonymous boolean not null default false;

-- Track whether the 2-week follow-up email has been sent for a quote request
alter table quote_requests
  add column if not exists followup_sent_at timestamptz default null;
