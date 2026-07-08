(ns frontend.handler.db-based.recent-test
  (:require [clojure.string :as string]
            [clojure.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.config :as config]
            [frontend.handler.db-based.recent :as db-recent-handler]
            [frontend.state :as state]
            [frontend.test.helper :include-macros true :refer [deftest-async]]
            [frontend.worker.handler.page :as worker-page]
            [frontend.worker.pipeline :as worker-pipeline]
            [logseq.common.config :as common-config]
            [logseq.db :as ldb]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [promesa.core :as p]))

(defn- make-test-env!
  []
  (let [repo (str "recent-test-" (random-uuid))
        db-conn (d/create-conn db-schema/schema)]
    (ldb/register-transact-pipeline-fn! worker-pipeline/transact-pipeline)
    (d/transact! db-conn (sqlite-create-graph/build-db-initial-data config/config-default-content))
    (d/listen! db-conn ::listen-db-changes!
               (fn [tx-report]
                 (worker-pipeline/invoke-hooks db-conn tx-report {})))
    {:repo repo
     :conn db-conn}))

(defn- test-db
  [env]
  @(:conn env))

(defn- test-conn
  [env]
  (:conn env))

(defn- get-page
  [env page-title]
  (ldb/get-page (test-db env) page-title))

(defn- create-page!
  [env title]
  (worker-page/create! (test-conn env) title {:redirect? false}))

(defn- ensure-page!
  [env page-title]
  (or (get-page env page-title)
      (do
        (create-page! env page-title)
        (get-page env page-title))))

(defn- mark-page-recycled!
  [env page-title]
  (d/transact! (test-conn env)
               [[:db/add (:db/id (get-page env page-title)) :logseq.property/deleted-at 1]]))

(defn- add-favorite-link!
  [env page-title order]
  (let [favorite-page (ensure-page! env common-config/favorites-page-name)
        page (get-page env page-title)]
    (d/transact! (test-conn env)
                 [(assoc (ldb/build-favorite-tx (:block/uuid page))
                         :block/uuid (random-uuid)
                         :block/order order
                         :block/page (:db/id favorite-page)
                         :block/parent (:db/id favorite-page))])))

(defn- plain-entity
  [entity]
  (when entity
    (assoc (into {} entity) :db/id (:db/id entity))))

(defn- favorite-pages
  [graph-db]
  (when-let [page (ldb/get-page graph-db common-config/favorites-page-name)]
    (->> (ldb/sort-by-order (:block/_parent page))
         (keep #(some-> (:block/link %) plain-entity))
         (remove ldb/recycled?)
         vec)))

(defn- favorited-page?
  [graph-db page-block-uuid]
  (let [page-block-id (:db/id (d/entity graph-db [:block/uuid page-block-uuid]))]
    (boolean
     (when-let [page (ldb/get-page graph-db common-config/favorites-page-name)]
       (some (fn [block]
               (= page-block-id (:db/id (:block/link block))))
             (ldb/get-page-blocks graph-db (:db/id page)))))))

(defn- test-worker-read
  [env api _repo & args]
  (let [graph-db (test-db env)]
    (case api
      :thread-api/get-recent-pages
      (let [[page-ids] args]
        (p/resolved
         (->> page-ids
              distinct
              (take 20)
              (keep #(some-> (d/entity graph-db %) plain-entity))
              (filter ldb/page?)
              (remove ldb/hidden?)
              (remove (fn [e]
                        (or (and (ldb/property? e)
                                 (true? (:logseq.property/hide? e)))
                            (string/blank? (:block/title e)))))
              vec)))

      :thread-api/get-favorite-pages
      (p/resolved (favorite-pages graph-db))

      :thread-api/favorited-page?
      (let [[page-block-uuid] args]
        (p/resolved (favorited-page? graph-db page-block-uuid)))

      :thread-api/pull
      (let [[selector lookup-ref] args]
        (p/resolved (select-keys (plain-entity (d/entity graph-db lookup-ref)) selector))))))

(defn- with-test-env
  [env f]
  (p/with-redefs [state/state (atom {})
                  state/get-current-repo (constantly (:repo env))
                  state/<invoke-db-worker (partial test-worker-read env)]
    (f)))

(deftest-async recents-test
  (testing "Add some pages to recent"
    (let [env (make-test-env!)
          pages (map (fn [i] (str "Page " i)) (range 15))]
      (with-test-env
        env
        (fn []
          (doseq [page pages]
            (create-page! env page)
            (db-recent-handler/add-page-to-recent! (:db/id (get-page env page)) false))
          (p/let [recent-pages (db-recent-handler/get-recent-pages)]
            (is (= (map :block/title recent-pages) (reverse pages)))
            (testing "Click existing recent item shouldn't update its position"
              (db-recent-handler/add-page-to-recent! (:db/id (get-page env "Page 10")) true)
              (p/let [recent-pages (db-recent-handler/get-recent-pages)]
                (is (= (map :block/title recent-pages) (reverse pages)))))))))))

(deftest-async recents-hide-recycled-pages-without-removing-history-test
  (testing "Recycled recent pages are hidden from display without mutating recents"
    (let [env (make-test-env!)
          active-page "Active page"
          recycled-page "Recycled page"]
      (with-test-env
        env
        (fn []
          (doseq [page [active-page recycled-page]]
            (create-page! env page)
            (db-recent-handler/add-page-to-recent! (:db/id (get-page env page)) false))
          (let [recycled-page-id (:db/id (get-page env recycled-page))]
            (mark-page-recycled! env recycled-page)
            (p/let [recent-pages (db-recent-handler/get-recent-pages)]
              (is (= [active-page]
                     (map :block/title recent-pages)))
              (is (contains? (set (state/get-recent-pages)) recycled-page-id)))))))))

(deftest add-page-to-recent-updates-state-without-renderer-entity-test
  (let [recent-pages (atom [2 3])
        updates (atom [])]
    (with-redefs [state/state (atom {})
                  state/get-recent-pages (fn [] @recent-pages)
                  state/set-recent-pages!
                  (fn [pages]
                    (reset! recent-pages pages)
                    (swap! updates conj pages))]
      (db-recent-handler/add-page-to-recent! 1 false)
      (is (= [1 2 3] @recent-pages))
      (db-recent-handler/add-page-to-recent! 2 true)
      (is (= [1 2 3] @recent-pages)
          "Existing recent page ids keep their current position")
      (with-redefs [state/state (atom {:db/restoring? true})]
        (db-recent-handler/add-page-to-recent! 4 false))
      (is (= [[1 2 3]]
             @updates)
          "Restoring state does not mutate recent pages"))))

(deftest-async favorites-hide-recycled-pages-without-unfavoriting-test
  (let [env (make-test-env!)
        active-page "Active favorite"
        recycled-page "Recycled favorite"]
    (with-test-env
      env
      (fn []
        (create-page! env active-page)
        (create-page! env recycled-page)
        (p/let [_ (add-favorite-link! env active-page "a")
                _ (add-favorite-link! env recycled-page "b")
                recycled-page-uuid (:block/uuid (get-page env recycled-page))
                _ (mark-page-recycled! env recycled-page)
                favorites (test-worker-read env :thread-api/get-favorite-pages (:repo env))
                favorited? (test-worker-read env :thread-api/favorited-page? (:repo env) recycled-page-uuid)]
          (is (= [active-page]
                 (map :block/title favorites)))
          (is (true? favorited?)))))))
