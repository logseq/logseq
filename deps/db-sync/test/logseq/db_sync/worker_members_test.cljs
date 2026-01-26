(ns logseq.db-sync.worker-members-test
  (:require [cljs.test :refer [deftest is async]]
            [clojure.string :as string]
            [logseq.db-sync.index :as index]
            [logseq.db-sync.worker :as worker]
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

    (string/includes? sql "delete from graph_members")
    (let [[graph-id user-id] args]
      (swap! state update :graph-members dissoc [user-id graph-id]))

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
    (string/includes? sql "select role from graph_members")
    (let [[graph-id user-id] args
          role (get-in @state [:graph-members [user-id graph-id] :role])]
      (if role
        (js-rows [{:role role}])
        (js-rows [])))

    (string/includes? sql "union select graph_id from graph_members")
    (union-access-rows state sql args)

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
                            #js {:results (all-sql state (.-_sql stmt) (.-_args stmt))}))
                    stmt))})

(defn- request-delete [graph-id member-id]
  (js/Request. (str "http://localhost/graphs/" graph-id "/members/" member-id)
               #js {:method "DELETE"}))

(defn- response-status [response]
  (.-status response))

(defn- setup-graph! [db graph-id owner-id]
  (index/<index-upsert! db graph-id "graph" owner-id "1"))

(deftest manager-can-remove-member-test
  (async done
         (let [state (atom {:executed []
                            :graph-members {}
                            :graphs {}})
               db (make-d1 state)
               graph-id "graph-1"
               manager-id "manager-1"
               member-id "member-1"
               request (request-delete graph-id member-id)
               self #js {:env #js {} :d1 db}]
           (with-redefs [worker/auth-claims (fn [_ _]
                                              (js/Promise.resolve #js {"sub" manager-id}))]
             (-> (p/do!
                  (setup-graph! db graph-id manager-id)
                  (index/<graph-member-upsert! db graph-id manager-id "manager" manager-id)
                  (index/<graph-member-upsert! db graph-id member-id "member" manager-id))
                 (p/then (fn [_]
                           (let [resp (#'worker/handle-index-fetch self request)
                                 status (response-status resp)
                                 member (get-in @state [:graph-members [member-id graph-id]])]
                             (is (= 200 status))
                             (is (nil? member))
                             (done))))
                 (p/catch (fn [e]
                            (is false (str e))
                            (done))))))))

(deftest manager-cannot-remove-manager-test
  (async done
         (let [state (atom {:executed []
                            :graph-members {}
                            :graphs {}})
               db (make-d1 state)
               graph-id "graph-1"
               manager-id "manager-1"
               other-manager-id "manager-2"
               request (request-delete graph-id other-manager-id)
               self #js {:env #js {} :d1 db}]
           (with-redefs [worker/auth-claims (fn [_ _]
                                              (js/Promise.resolve #js {"sub" manager-id}))]
             (-> (p/do!
                  (setup-graph! db graph-id manager-id)
                  (index/<graph-member-upsert! db graph-id manager-id "manager" manager-id)
                  (index/<graph-member-upsert! db graph-id other-manager-id "manager" manager-id))
                 (p/then (fn [_]
                           (let [resp (#'worker/handle-index-fetch self request)
                                 status (response-status resp)
                                 member (get-in @state [:graph-members [other-manager-id graph-id]])]
                             (is (= 403 status))
                             (is (some? member))
                             (done))))
                 (p/catch (fn [e]
                            (is false (str e))
                            (done))))))))

(deftest member-can-leave-test
  (async done
         (let [state (atom {:executed []
                            :graph-members {}
                            :graphs {}})
               db (make-d1 state)
               graph-id "graph-1"
               manager-id "manager-1"
               member-id "member-1"
               request (request-delete graph-id member-id)
               self #js {:env #js {} :d1 db}]
           (with-redefs [worker/auth-claims (fn [_ _]
                                              (js/Promise.resolve #js {"sub" member-id}))]
             (-> (p/do!
                  (setup-graph! db graph-id manager-id)
                  (index/<graph-member-upsert! db graph-id manager-id "manager" manager-id)
                  (index/<graph-member-upsert! db graph-id member-id "member" manager-id))
                 (p/then (fn [_]
                           (let [resp (#'worker/handle-index-fetch self request)
                                 status (response-status resp)
                                 member (get-in @state [:graph-members [member-id graph-id]])]
                             (is (= 200 status))
                             (is (nil? member))
                             (done))))
                 (p/catch (fn [e]
                            (is false (str e))
                            (done))))))))

(deftest member-cannot-remove-others-test
  (async done
         (let [state (atom {:executed []
                            :graph-members {}
                            :graphs {}})
               db (make-d1 state)
               graph-id "graph-1"
               manager-id "manager-1"
               member-id "member-1"
               other-member-id "member-2"
               request (request-delete graph-id other-member-id)
               self #js {:env #js {} :d1 db}]
           (with-redefs [worker/auth-claims (fn [_ _]
                                              (js/Promise.resolve #js {"sub" member-id}))]
             (-> (p/do!
                  (setup-graph! db graph-id manager-id)
                  (index/<graph-member-upsert! db graph-id manager-id "manager" manager-id)
                  (index/<graph-member-upsert! db graph-id member-id "member" manager-id)
                  (index/<graph-member-upsert! db graph-id other-member-id "member" manager-id))
                 (p/then (fn [_]
                           (let [resp (#'worker/handle-index-fetch self request)
                                 status (response-status resp)
                                 member (get-in @state [:graph-members [other-member-id graph-id]])]
                             (is (= 403 status))
                             (is (some? member))
                             (done))))
                 (p/catch (fn [e]
                            (is false (str e))
                            (done))))))))
