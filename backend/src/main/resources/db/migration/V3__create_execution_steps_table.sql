create table execution_steps (
    id uuid primary key default gen_random_uuid(),
    execution_id uuid not null references executions(id) on delete cascade,
    step_index integer not null,
    node_id varchar(120),
    agent_id uuid,
    status varchar(30) not null,
    input_value text,
    output_value text,
    tool_calls text,
    started_at timestamptz,
    finished_at timestamptz,
    error_message text
);

create index idx_execution_steps_execution_id on execution_steps(execution_id);
