-- WCD Marketplace v2.2 - sistema de niveles de precio
-- Ejecutar una sola vez en Supabase > SQL Editor.

create unique index if not exists product_prices_item_level_uidx
  on public.product_prices (item_number, price_level);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value)
values ('public_price_level', '"I9"'::jsonb)
on conflict (key) do nothing;

alter table public.app_settings enable row level security;

drop policy if exists "Public can read app settings" on public.app_settings;
create policy "Public can read app settings"
on public.app_settings for select
to anon, authenticated
using (true);

-- product_prices debe ser legible para mostrar el nivel público.
alter table public.product_prices enable row level security;
drop policy if exists "Public can read product prices" on public.product_prices;
create policy "Public can read product prices"
on public.product_prices for select
to anon, authenticated
using (true);
