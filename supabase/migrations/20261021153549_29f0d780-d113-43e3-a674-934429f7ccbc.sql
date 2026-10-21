alter table public.receipts
  add column if not exists original_filename text check (char_length(original_filename) <= 255),
  add column if not exists extraction jsonb,
  add column if not exists field_sources jsonb not null default '{}'::jsonb,
  add column if not exists extraction_error text check (char_length(extraction_error) <= 1000),
  add column if not exists file_size_bytes integer check (file_size_bytes between 1 and 10485760);
alter table public.receipts drop constraint if exists receipts_status_check;
alter table public.receipts add constraint receipts_status_check check (status in ('uploaded','processing','extracted','processed','flagged','approved','rejected','failed'));
create unique index if not exists uq_receipts_user_file on public.receipts(user_id, file_path) where file_path is not null;
alter table public.receipt_items add column if not exists source text not null default 'extracted' check (source in ('extracted','corrected','manual'));