create table agents (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade,
    name varchar(120) not null,
    description text,
    system_prompt text not null,
    agent_type varchar(40) not null,
    model_provider varchar(40) not null,
    model_name varchar(120) not null,
    temperature numeric(3, 2) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table agent_allowed_tools (
    agent_id uuid not null references agents(id) on delete cascade,
    tool_name varchar(120) not null,
    primary key (agent_id, tool_name)
);

create table pipelines (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade,
    name varchar(120) not null,
    description text,
    nodes_json text not null default '[]',
    edges_json text not null default '[]',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table executions (
    id uuid primary key default gen_random_uuid(),
    pipeline_id uuid not null references pipelines(id) on delete cascade,
    status varchar(30) not null,
    initial_input text not null,
    final_output text,
    started_at timestamptz,
    finished_at timestamptz,
    error_message text
);

create index idx_agents_project_id on agents(project_id);
create index idx_pipelines_project_id on pipelines(project_id);
create index idx_executions_pipeline_id on executions(pipeline_id);
