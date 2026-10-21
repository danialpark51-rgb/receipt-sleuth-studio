create or replace function public.save_receipt_review(
  _receipt_id uuid,
  _fields jsonb,
  _field_sources jsonb,
  _items jsonb
) returns void
language plpgsql
security invoker
set search_path = public
as $$
declare _uid uuid := auth.uid();
begin
  if _uid is null then raise exception 'not authenticated'; end if;

  update public.receipts set
    merchant_name = nullif(_fields->>'merchant_name',''),
    receipt_date = nullif(_fields->>'receipt_date','')::date,
    currency = coalesce(nullif(_fields->>'currency',''), currency),
    subtotal = (_fields->>'subtotal')::numeric,
    tax_amount = (_fields->>'tax_amount')::numeric,
    total_amount = (_fields->>'total_amount')::numeric,
    field_sources = _field_sources,
    status = 'processed',
    extraction_error = null
  where id = _receipt_id and user_id = _uid and status in ('extracted','processed');
  if not found then raise exception 'receipt not found or not ready for review'; end if;

  delete from public.receipt_items where receipt_id = _receipt_id and user_id = _uid;

  insert into public.receipt_items (user_id, receipt_id, description, quantity, unit_price, line_total, source)
  select _uid, _receipt_id, i->>'description', coalesce((i->>'quantity')::numeric, 1),
         (i->>'unit_price')::numeric, (i->>'line_total')::numeric, coalesce(i->>'source','extracted')
  from jsonb_array_elements(coalesce(_items,'[]'::jsonb)) as i;
end;
$$;
revoke execute on function public.save_receipt_review(uuid, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.save_receipt_review(uuid, jsonb, jsonb, jsonb) to authenticated;