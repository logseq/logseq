create index if not exists idx_graph_members_graph_id_created_at
on graph_members (graph_id, created_at);

create index if not exists idx_graphs_user_id_updated_at
on graphs (user_id, updated_at desc);

create index if not exists idx_users_email
on users (email);
