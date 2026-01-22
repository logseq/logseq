(ns logseq.db-sync.index-test
  (:require [cljs.test :refer [deftest is async]]
            [clojure.string :as string]
            [logseq.db-sync.index :as index]
            [promesa.core :as p]))

(defn- js-key [k]
  (cond
    (keyword? k) (string/replace (name k) "-" "_")
    (string? k) k
    :else (str k)))

(defn- js-row [m]
  (let [o (js-obj)]
    (doseq [[k v] m]
      (aset o (js-key k) v))
    o))

(defn- js-rows [rows]
  (into-array (map js-row rows)))

(defn- record-exec! [state sql]
  (swap! state update :executed conj sql))

(defn- run-sql! [state sql args]
  (record-exec! state sql)
  (cond
    (string/includes? sql "insert into user_rsa_keys")
    (let [[user-id public-key encrypted-private-key created-at updated-at] args]
      (swap! state update :user-keys assoc user-id {:user-id user-id
                                                    :public-key public-key
                                                    :encrypted-private-key encrypted-private-key
                                                    :created-at created-at
                                                    :updated-at updated-at}))

    (string/includes? sql "insert into graph_aes_keys")
    (let [[graph-id user-id encrypted-aes-key created-at updated-at] args]
      (swap! state update :graph-keys assoc [graph-id user-id] {:graph-id graph-id
                                                                :user-id user-id
                                                                :encrypted-aes-key encrypted-aes-key
                                                                :created-at created-at
                                                                :updated-at updated-at}))

    (string/includes? sql "insert into users")
    (let [[user-id email email-verified username] args]
      (swap! state update :users assoc user-id {:id user-id
                                                :email email
                                                :email-verified email-verified
                                                :username username}))

    (string/includes? sql "insert into graph_members")
    (let [[user-id graph-id role invited-by created-at] args]
      (swap! state update :graph-members
             (fn [members]
               (let [k [user-id graph-id]
                     existing (get members k)
                     created-at (or (:created-at existing) created-at)]
                 (assoc members k {:user-id user-id
                                   :graph-id graph-id
                                   :role role
                                   :invited-by invited-by
                                   :created-at created-at})))))

    (string/includes? sql "insert into graphs")
    (let [[graph-id graph-name user-id schema-version created-at updated-at] args]
      (swap! state update :graphs assoc graph-id {:graph-id graph-id
                                                  :graph-name graph-name
                                                  :user-id user-id
                                                  :schema-version schema-version
                                                  :created-at created-at
                                                  :updated-at updated-at}))

    (string/includes? sql "update graph_members set role")
    (let [[role graph-id user-id] args]
      (swap! state update :graph-members assoc-in [[user-id graph-id] :role] role))

    (string/includes? sql "delete from graph_members")
    (let [[graph-id user-id] args]
      (swap! state update :graph-members dissoc [user-id graph-id]))

    (string/includes? sql "delete from graphs")
    (let [[graph-id] args]
      (swap! state update :graphs dissoc graph-id))

    :else
    nil))

(defn- union-access-rows [state sql args]
  (let [[graph-id user-id] args
        graph-owner-id (get-in @state [:graphs graph-id :user-id])
        member (get-in @state [:graph-members [user-id graph-id]])
        manager-required? (string/includes? sql "role = 'manager'")
        has-access? (or (= graph-owner-id user-id)
                        (and member
                             (or (not manager-required?)
                                 (= "manager" (:role member)))))]
    (if has-access?
      (js-rows [{:graph-id graph-id}])
      (js-rows []))))

(defn- all-sql [state sql args]
  (record-exec! state sql)
  (cond
    (string/includes? sql "from user_rsa_keys")
    (if (string/includes? sql "left join users")
      (let [[email] args
            user-id (some (fn [[_ row]]
                            (when (= email (:email row))
                              (:id row)))
                          (:users @state))
            row (when user-id (get-in @state [:user-keys user-id]))]
        (if row
          (js-rows [row])
          (js-rows [])))
      (let [[user-id] args
            row (get-in @state [:user-keys user-id])]
        (if row
          (js-rows [row])
          (js-rows []))))

    (string/includes? sql "from graph_aes_keys")
    (let [[graph-id user-id] args
          row (get-in @state [:graph-keys [graph-id user-id]])]
      (if row
        (js-rows [row])
        (js-rows [])))

    (string/includes? sql "from graph_members where graph_id")
    (let [graph-id (first args)
          members (->> (:graph-members @state)
                       vals
                       (filter (fn [row] (= graph-id (:graph-id row))))
                       (sort-by :created-at))]
      (js-rows members))

    (string/includes? sql "union select graph_id from graph_members")
    (union-access-rows state sql args)

    (string/includes? sql "select g.graph_id")
    (let [[user-id] args
          owned (->> (:graphs @state)
                     vals
                     (filter (fn [row] (= user-id (:user-id row)))))
          member-ids (->> (:graph-members @state)
                          vals
                          (filter (fn [row] (= user-id (:user-id row))))
                          (map :graph-id)
                          set)
          member-graphs (->> (:graphs @state)
                             vals
                             (filter (fn [row] (contains? member-ids (:graph-id row)))))
          rows (concat owned member-graphs)
          rows (map (fn [row]
                      (let [member (get-in @state [:graph-members [user-id (:graph-id row)]])]
                        (cond-> row
                          member
                          (assoc :role (:role member)
                                 :invited-by (:invited-by member)))))
                    rows)]
      (js-rows rows))

    (string/includes? sql "select graph_id from graphs where graph_name")
    (let [[graph-name user-id] args
          rows (->> (:graphs @state)
                    vals
                    (filter (fn [row]
                              (and (= graph-name (:graph-name row))
                                   (= user-id (:user-id row)))))
                    (map (fn [row] {:graph-id (:graph-id row)})))]
      (js-rows rows))

    :else
    (js-rows [])))

(defn- make-d1 [state]
  #js {:prepare (fn [sql]
                  (let [stmt #js {}]
                    (set! (.-_sql stmt) sql)
                    (set! (.-_args stmt) [])
                    (set! (.-bind stmt)
                          (fn [& args]
                            (set! (.-_args stmt) (vec args))
                            stmt))
                    (set! (.-run stmt)
                          (fn []
                            (run-sql! state (.-_sql stmt) (.-_args stmt))
                            #js {}))
                    (set! (.-all stmt)
                          (fn []
                            (all-sql state (.-_sql stmt) (.-_args stmt))))
                    stmt))})

(deftest index-init-schema-test
  (async done
         (let [state (atom {:executed []
                            :users {}
                            :user-keys {}
                            :graph-keys {}
                            :graph-members {}
                            :graphs {}})
               db (make-d1 state)]
           (-> (index/<index-init! db)
               (p/then (fn [_]
                         (let [sqls (:executed @state)]
                           (is (some #(string/includes? % "create table if not exists users") sqls))
                           (is (some #(string/includes? % "create table if not exists graph_members") sqls))
                           (is (some #(string/includes? % "create table if not exists user_rsa_keys") sqls))
                           (is (some #(string/includes? % "create table if not exists graph_aes_keys") sqls)))
                         (done)))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))

(deftest user-upsert-test
  (async done
         (let [state (atom {:executed []
                            :users {}
                            :user-keys {}
                            :graph-keys {}
                            :graph-members {}
                            :graphs {}})
               db (make-d1 state)
               claims #js {"sub" "user-1"
                           "email" "foo@test.com"
                           "email_verified" true
                           "cognito:username" "foo"}]
           (-> (index/<user-upsert! db claims)
               (p/then (fn [_]
                         (let [user (get-in @state [:users "user-1"])]
                           (is (= "foo@test.com" (:email user)))
                           (is (= 1 (:email-verified user)))
                           (is (= "foo" (:username user))))
                         (done)))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))

(deftest graph-name-exists-test
  (async done
         (let [state (atom {:executed []
                            :users {}
                            :user-keys {}
                            :graph-keys {}
                            :graph-members {}
                            :graphs {}})
               db (make-d1 state)]
           (-> (p/do!
                (index/<index-upsert! db "graph-1" "alpha" "user-1" "1")
                (index/<index-upsert! db "graph-2" "beta" "user-2" "1"))
               (p/then (fn [_]
                         (p/let [exists? (index/<graph-name-exists? db "alpha" "user-1")
                                 missing? (index/<graph-name-exists? db "alpha" "user-2")
                                 other? (index/<graph-name-exists? db "beta" "user-1")]
                           (is (true? exists?))
                           (is (false? missing?))
                           (is (false? other?))
                           (done))))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))

(deftest graph-list-includes-role-and-invited-by-test
  (async done
         (let [state (atom {:executed []
                            :users {}
                            :user-keys {}
                            :graph-keys {}
                            :graph-members {}
                            :graphs {}})
               db (make-d1 state)]
           (-> (p/do!
                (index/<index-upsert! db "graph-1" "alpha" "user-1" "1")
                (index/<graph-member-upsert! db "graph-1" "user-1" "manager" "user-2")
                (index/<index-upsert! db "graph-2" "beta" "user-2" "1")
                (index/<graph-member-upsert! db "graph-2" "user-1" "member" "user-2"))
               (p/then (fn [_]
                         (p/let [graphs (index/<index-list db "user-1")
                                 alpha (first (filter (fn [g] (= "graph-1" (:graph-id g))) graphs))
                                 beta (first (filter (fn [g] (= "graph-2" (:graph-id g))) graphs))]
                           (is (= "manager" (:role alpha)))
                           (is (= "user-2" (:invited-by alpha)))
                           (is (= "member" (:role beta)))
                           (is (= "user-2" (:invited-by beta)))
                           (done))))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))

(deftest graph-member-upsert-test
  (async done
         (let [state (atom {:executed []
                            :users {}
                            :user-keys {}
                            :graph-keys {}
                            :graph-members {}
                            :graphs {}})
               db (make-d1 state)]
           (-> (index/<graph-member-upsert! db "graph-1" "user-2" "member" "user-1")
               (p/then (fn [_]
                         (let [member (get-in @state [:graph-members ["user-2" "graph-1"]])]
                           (is (= "member" (:role member)))
                           (is (= "user-1" (:invited-by member))))
                         (done)))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))

(deftest e2ee-user-rsa-key-pair-upsert-test
  (async done
         (let [state (atom {:executed []
                            :users {}
                            :user-keys {}
                            :graph-keys {}
                            :graph-members {}
                            :graphs {}})
               db (make-d1 state)]
           (-> (p/do!
                (index/<user-rsa-key-pair-upsert! db "user-1" "public-1" "private-1")
                (index/<user-rsa-key-pair-upsert! db "user-1" "public-2" "private-2"))
               (p/then (fn [_]
                         (p/let [pair (index/<user-rsa-key-pair db "user-1")]
                           (is (= "public-2" (:public-key pair)))
                           (is (= "private-2" (:encrypted-private-key pair)))
                           (done))))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))

(deftest e2ee-user-public-key-by-email-test
  (async done
         (let [state (atom {:executed []
                            :users {}
                            :user-keys {}
                            :graph-keys {}
                            :graph-members {}
                            :graphs {}})
               db (make-d1 state)
               claims #js {"sub" "user-1"
                           "email" "foo@test.com"
                           "email_verified" true
                           "cognito:username" "foo"}]
           (-> (p/do!
                (index/<user-upsert! db claims)
                (index/<user-rsa-key-pair-upsert! db "user-1" "public-1" "private-1"))
               (p/then (fn [_]
                         (p/let [public-key (index/<user-rsa-public-key-by-email db "foo@test.com")]
                           (is (= "public-1" public-key))
                           (done))))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))

(deftest e2ee-graph-aes-key-upsert-test
  (async done
         (let [state (atom {:executed []
                            :users {}
                            :user-keys {}
                            :graph-keys {}
                            :graph-members {}
                            :graphs {}})
               db (make-d1 state)]
           (-> (p/do!
                (index/<graph-encrypted-aes-key-upsert! db "graph-1" "user-1" "aes-1")
                (index/<graph-encrypted-aes-key-upsert! db "graph-1" "user-1" "aes-2"))
               (p/then (fn [_]
                         (p/let [aes-key (index/<graph-encrypted-aes-key db "graph-1" "user-1")]
                           (is (= "aes-2" aes-key))
                           (done))))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))
