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
                             (filter (fn [row] (contains? member-ids (:graph-id row)))))]
      (js-rows (concat owned member-graphs)))

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
                            :graph-members {}
                            :graphs {}})
               db (make-d1 state)]
           (-> (index/<index-init! db)
               (p/then (fn [_]
                         (let [sqls (:executed @state)]
                           (is (some #(string/includes? % "create table if not exists users") sqls))
                           (is (some #(string/includes? % "create table if not exists graph_members") sqls)))
                         (done)))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))

(deftest user-upsert-test
  (async done
         (let [state (atom {:executed []
                            :users {}
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

(deftest graph-member-upsert-test
  (async done
         (let [state (atom {:executed []
                            :users {}
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
