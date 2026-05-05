create extension if not exists pgcrypto;

create table projects (
    id uuid primary key default gen_random_uuid(),
    name varchar(120) not null,
    description text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_projects_created_at on projects (created_at);
