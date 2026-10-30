// Catálogo inicial (el de js/catalog.js) en el formato que se guarda en la base de datos
import { NEW_PHONES, COLORS } from "../../js/catalog.js";

export function defaultPhones() {
  return NEW_PHONES.map((phone) => ({
    id: phone.id,
    name: phone.name,
    family: phone.family || "",
    condition: phone.condition || "new",
    tag: phone.tag || "",
    cover: phone.cover || phone.colors[0],
    specs: phone.specs || [],
    colors: phone.colors || [],
    imageTemplate: typeof phone.image === "function" ? phone.image("{color}") : `img/phones/${phone.id}-{color}.webp`,
    imageMap: null,
    singleImage: "",
    variants: phone.variants || [],
  }));
}

export const DEFAULT_COLORS = COLORS;

export const SCHEMA = [
  `create table if not exists phones (
    id text primary key,
    position integer not null default 0,
    data jsonb not null,
    updated_at timestamptz not null default now()
  )`,
  `create table if not exists colors (
    key text primary key,
    name text not null,
    hex text not null
  )`,
  `create table if not exists images (
    id uuid primary key default gen_random_uuid(),
    mime text not null,
    data text not null,
    created_at timestamptz not null default now()
  )`,
  `create table if not exists admin_users (
    username text primary key,
    name text not null default 'Administrador',
    password_hash text not null,
    updated_at timestamptz not null default now()
  )`,
  `create table if not exists settings (
    key text primary key,
    value text not null
  )`,
  `create table if not exists login_attempts (
    ip text primary key,
    failures integer not null default 0,
    last_failure timestamptz not null default now()
  )`,
];
