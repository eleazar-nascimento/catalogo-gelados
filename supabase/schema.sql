create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null check (category in ('Chupa-chupa', 'Picolé', 'Sorvete')),
  price numeric(10, 2) not null default 0,
  stock integer not null default 0 check (stock >= 0),
  emoji text not null default '🍦',
  theme text not null default 'sky',
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Atualiza updated_at automaticamente
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- Ajuste atômico de estoque (evita perder cliques rápidos ou conflitos)
create or replace function public.adjust_product_stock(p_id text, p_delta integer)
returns integer
language plpgsql
security definer
as $$
declare
  new_stock integer;
begin
  update public.products
  set stock = greatest(0, stock + p_delta)
  where id = p_id
  returning stock into new_stock;

  return new_stock;
end;
$$;

-- Habilita Realtime na tabela
alter publication supabase_realtime add table public.products;

-- RLS básico para catálogo simples sem login complexo
alter table public.products enable row level security;

create policy "Leitura publica do catalogo"
on public.products for select
to anon, authenticated
using (true);

create policy "Escrita do balcao"
on public.products for all
to anon, authenticated
using (true)
with check (true);
