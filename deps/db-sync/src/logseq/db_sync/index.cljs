(ns logseq.db-sync.index
  (:require [logseq.db-sync.common :as common]
            [promesa.core :as p]))

(defn <index-init! [db]
  (p/do!
   (common/<d1-run db
                   (str "create table if not exists graphs ("
                        "graph_id TEXT primary key,"
                        "graph_name TEXT,"
                        "user_id TEXT,"
                        "schema_version TEXT,"
                        "created_at INTEGER,"
                        "updated_at INTEGER"
                        ");"))
   (common/<d1-run db
                   (str "create table if not exists users ("
                        "id TEXT primary key,"
                        "email TEXT,"
                        "email_verified INTEGER,"
                        "username TEXT"
                        ");"))
   (common/<d1-run db
                   (str "create table if not exists graph_members ("
                        "user_id TEXT,"
                        "graph_id TEXT,"
                        "role TEXT,"
                        "invited_by TEXT,"
                        "created_at INTEGER,"
                        "primary key (user_id, graph_id),"
                        "check (role in ('manager', 'member'))"
                        ");"))))

(defn <index-list [db user-id]
  (if (string? user-id)
    (p/let [result (common/<d1-all db
                                   (str "select g.graph_id, g.graph_name, g.schema_version, g.created_at, g.updated_at, "
                                        "m.role, m.invited_by "
                                        "from graphs g "
                                        "left join graph_members m on g.graph_id = m.graph_id and m.user_id = ? "
                                        "where g.user_id = ? or m.user_id = ? "
                                        "order by g.updated_at desc")
                                   user-id
                                   user-id
                                   user-id)
            rows (common/get-sql-rows result)]
      (mapv (fn [row]
              {:graph-id (aget row "graph_id")
               :graph-name (aget row "graph_name")
               :schema-version (aget row "schema_version")
               :role (aget row "role")
               :invited-by (aget row "invited_by")
               :created-at (aget row "created_at")
               :updated-at (aget row "updated_at")})
            rows))
    []))

(defn <index-upsert! [db graph-id graph-name user-id schema-version]
  (p/let [now (common/now-ms)
          result (common/<d1-run db
                                 (str "insert into graphs (graph_id, graph_name, user_id, schema_version, created_at, updated_at) "
                                      "values (?, ?, ?, ?, ?, ?) "
                                      "on conflict(graph_id) do update set "
                                      "graph_name = excluded.graph_name, "
                                      "user_id = excluded.user_id, "
                                      "schema_version = excluded.schema_version, "
                                      "updated_at = excluded.updated_at")
                                 graph-id
                                 graph-name
                                 user-id
                                 schema-version
                                 now
                                 now)]
    result))

(defn <index-delete! [db graph-id]
  (p/do!
   (common/<d1-run db "delete from graph_members where graph_id = ?" graph-id)
   (common/<d1-run db "delete from graphs where graph_id = ?" graph-id)))

(defn <graph-name-exists?
  [db graph-name user-id]
  (when (and (string? graph-name) (string? user-id))
    (p/let [result (common/<d1-all db
                                   "select graph_id from graphs where graph_name = ? and user_id = ?"
                                   graph-name
                                   user-id)
            rows (common/get-sql-rows result)]
      (boolean (seq rows)))))

(defn <user-upsert! [db claims]
  (let [user-id (aget claims "sub")]
    (when (string? user-id)
      (let [email (aget claims "email")
            email-verified (aget claims "email_verified")
            username (aget claims "cognito:username")
            email-verified (cond
                             (true? email-verified) 1
                             (false? email-verified) 0
                             :else nil)]
        (common/<d1-run db
                        (str "insert into users (id, email, email_verified, username) "
                             "values (?, ?, ?, ?) "
                             "on conflict(id) do update set "
                             "email = excluded.email, "
                             "email_verified = excluded.email_verified, "
                             "username = excluded.username")
                        user-id
                        email
                        email-verified
                        username)))))

(defn <user-id-by-email [db email]
  (when (string? email)
    (p/let [result (common/<d1-all db
                                   "select id from users where email = ?"
                                   email)
            rows (common/get-sql-rows result)
            row (first rows)]
      (when row
        (aget row "id")))))

(defn <graph-member-upsert! [db graph-id user-id role invited-by]
  (let [now (common/now-ms)]
    (common/<d1-run db
                    (str "insert into graph_members (user_id, graph_id, role, invited_by, created_at) "
                         "values (?, ?, ?, ?, ?) "
                         "on conflict(user_id, graph_id) do update set "
                         "role = excluded.role, "
                         "invited_by = excluded.invited_by")
                    user-id
                    graph-id
                    role
                    invited-by
                    now)))

(defn <graph-members-list [db graph-id]
  (p/let [result (common/<d1-all db
                                 (str "select m.user_id, m.graph_id, m.role, m.invited_by, m.created_at, "
                                      "u.email, u.username "
                                      "from graph_members m "
                                      "left join users u on m.user_id = u.id "
                                      "where m.graph_id = ? order by m.created_at asc")
                                 graph-id)
          rows (common/get-sql-rows result)]
    (mapv (fn [row]
            {:user-id (aget row "user_id")
             :graph-id (aget row "graph_id")
             :role (aget row "role")
             :invited-by (aget row "invited_by")
             :created-at (aget row "created_at")
             :email (aget row "email")
             :username (aget row "username")})
          rows)))

(defn <graph-member-update-role! [db graph-id user-id role]
  (common/<d1-run db
                  (str "update graph_members set role = ? "
                       "where graph_id = ? and user_id = ?")
                  role
                  graph-id
                  user-id))

(defn <graph-member-delete! [db graph-id user-id]
  (common/<d1-run db
                  "delete from graph_members where graph_id = ? and user_id = ?"
                  graph-id
                  user-id))

(defn <user-has-access-to-graph? [db graph-id user-id]
  (when (and (string? graph-id) (string? user-id))
    (p/let [result (common/<d1-all db
                                   (str "select graph_id from graphs where graph_id = ? and user_id = ? "
                                        "union select graph_id from graph_members where graph_id = ? and user_id = ?")
                                   graph-id
                                   user-id
                                   graph-id
                                   user-id)
            rows (common/get-sql-rows result)]
      (boolean (seq rows)))))

(defn <user-is-manager? [db graph-id user-id]
  (when (and (string? graph-id) (string? user-id))
    (p/let [result (common/<d1-all db
                                   (str "select graph_id from graphs where graph_id = ? and user_id = ? "
                                        "union select graph_id from graph_members where graph_id = ? and user_id = ? and role = 'manager'")
                                   graph-id
                                   user-id
                                   graph-id
                                   user-id)
            rows (common/get-sql-rows result)]
      (boolean (seq rows)))))
