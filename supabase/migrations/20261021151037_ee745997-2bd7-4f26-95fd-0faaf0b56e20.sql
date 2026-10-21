create or replace function public.update_updated_at_column() returns trigger language plpgsql set search_path = public as $$ begin new.updated_at = now(); return new; end; $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text check (char_length(full_name) <= 200),
  company text check (char_length(company) <= 200),
  role_title text check (char_length(role_title) <= 200),
  default_currency char(3) not null default 'INR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create trigger trg_profiles_updated before update on public.profiles for each row execute function public.update_updated_at_column();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, left(coalesce(new.raw_user_meta_data->>'full_name', ''), 200)) on conflict (id) do nothing;
  return new;
end; $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  merchant_name text check (char_length(merchant_name) <= 300),
  receipt_date date,
  subtotal numeric(14,2) check (subtotal >= 0),
  tax_amount numeric(14,2) check (tax_amount >= 0),
  total_amount numeric(14,2) check (total_amount >= 0),
  currency char(3) not null default 'INR',
  category text,
  payment_method text,
  file_path text,
  file_mime_type text,
  status text not null default 'uploaded' check (status in ('uploaded','processing','processed','flagged','approved','rejected','failed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);
create index idx_receipts_user_created on public.receipts(user_id, created_at desc);
create index idx_receipts_user_status on public.receipts(user_id, status);

create table public.receipt_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  receipt_id uuid not null,
  description text not null check (char_length(description) between 1 and 500),
  quantity numeric(12,3) not null default 1 check (quantity > 0),
  unit_price numeric(14,2) check (unit_price >= 0),
  line_total numeric(14,2) check (line_total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (receipt_id, user_id) references public.receipts(id, user_id) on delete cascade
);
create index idx_receipt_items_receipt on public.receipt_items(receipt_id);
create index idx_receipt_items_user on public.receipt_items(user_id);

create table public.audit_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  receipt_id uuid not null,
  risk_score numeric(5,2) check (risk_score between 0 and 100),
  risk_level text check (risk_level in ('low','medium','high','critical')),
  flags jsonb not null default '[]'::jsonb,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (receipt_id, user_id) references public.receipts(id, user_id) on delete cascade
);
create index idx_audit_results_receipt on public.audit_results(receipt_id);
create index idx_audit_results_user_level on public.audit_results(user_id, risk_level);

create table public.investigations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  receipt_id uuid,
  title text not null check (char_length(title) between 1 and 300),
  description text,
  status text not null default 'open' check (status in ('open','in_review','escalated','resolved','closed')),
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  findings text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (receipt_id, user_id) references public.receipts(id, user_id) on delete set null (receipt_id)
);
create index idx_investigations_user_status on public.investigations(user_id, status);
create index idx_investigations_receipt on public.investigations(receipt_id);

create table public.investigation_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  investigation_id uuid not null,
  evidence_type text not null check (evidence_type in ('receipt','document','note','price_check','other')),
  description text,
  file_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (investigation_id, user_id) references public.investigations(id, user_id) on delete cascade
);
create index idx_evidence_investigation on public.investigation_evidence(investigation_id);
create index idx_evidence_user on public.investigation_evidence(user_id);

create table public.price_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  receipt_id uuid,
  item_name text not null check (char_length(item_name) between 1 and 500),
  paid_price numeric(14,2) not null check (paid_price >= 0),
  market_price numeric(14,2) check (market_price >= 0),
  difference_pct numeric(8,2),
  currency char(3) not null default 'INR',
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (user_id) references public.profiles(id) on delete cascade,
  foreign key (receipt_id, user_id) references public.receipts(id, user_id) on delete cascade
);
create index idx_price_checks_user on public.price_checks(user_id, created_at desc);
create index idx_price_checks_receipt on public.price_checks(receipt_id);

do $$ declare t text; begin
  foreach t in array array['receipts','receipt_items','audit_results','investigations','investigation_evidence','price_checks'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%s_select_own" on public.%I for select to authenticated using (auth.uid() = user_id)', t, t);
    execute format('create policy "%s_insert_own" on public.%I for insert to authenticated with check (auth.uid() = user_id)', t, t);
    execute format('create policy "%s_update_own" on public.%I for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', t, t);
    execute format('create policy "%s_delete_own" on public.%I for delete to authenticated using (auth.uid() = user_id)', t, t);
    execute format('create trigger trg_%s_updated before update on public.%I for each row execute function public.update_updated_at_column()', t, t);
  end loop;
end $$;

create policy "receipt_files_select_own" on storage.objects for select to authenticated using (bucket_id = 'receipt-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "receipt_files_insert_own" on storage.objects for insert to authenticated with check (bucket_id = 'receipt-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "receipt_files_update_own" on storage.objects for update to authenticated using (bucket_id = 'receipt-files' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'receipt-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "receipt_files_delete_own" on storage.objects for delete to authenticated using (bucket_id = 'receipt-files' and (storage.foldername(name))[1] = auth.uid()::text);