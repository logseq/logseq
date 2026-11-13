(ns frontend.handler.db-based.recent-test
  (:require [clojure.test :refer [deftest is testing]]
            [clojure.test.check :as tc]
            [clojure.test.check.generators :as gen]
            [clojure.test.check.properties :as prop :include-macros true]
            [datascript.core :as d]
            [frontend.common.thread-api :as thread-api]
            [frontend.config :as config]
            [frontend.handler.db-based.recent :as db-recent-handler]
            [frontend.state :as state]
            [frontend.test.helper :include-macros true :refer [deftest-async]]
            [frontend.worker.handler.graph]
            [frontend.worker.handler.page :as worker-page]
            [frontend.worker.pipeline :as worker-pipeline]
            [frontend.worker.state :as worker-state]
            [logseq.common.config :as common-config]
            [logseq.db :as ldb]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.test.helper :as db-test]
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
              (keep #(d/entity graph-db %))
              (filter worker-page/eligible-for-recent?)
              (mapv plain-entity))))

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
  (p/with-redefs [state/get-current-repo (constantly (:repo env))
                  state/<invoke-db-worker (partial test-worker-read env)]
    (f)))

(deftest-async recents-test
  (testing "Add some pages to recent"
    (let [env (make-test-env!)
          pages (map (fn [i] (str "Page " i)) (range db-recent-handler/max-recent-pages))]
      (with-test-env
        env
        (fn []
          (doseq [page pages]
            (create-page! env page)
            (db-recent-handler/add-page-to-recent! (:db/id (get-page env page))))
          (p/let [recent-pages (db-recent-handler/get-recent-pages)]
            (is (= (map :block/title recent-pages) (reverse pages)))
            (testing "A visit to a page in the list moves it to the front"
              (db-recent-handler/add-page-to-recent! (:db/id (get-page env "Page 10")))
              (p/let [recent-pages (db-recent-handler/get-recent-pages)]
                (is (= (map :block/title recent-pages)
                       (cons "Page 10" (remove #{"Page 10"} (reverse pages)))))))))))))

(deftest-async recents-hide-recycled-pages-test
  (testing "Recycled recent pages are hidden from display"
    (let [env (make-test-env!)
          active-page "Active page"
          recycled-page "Recycled page"]
      (with-test-env
        env
        (fn []
          (doseq [page [active-page recycled-page]]
            (create-page! env page)
            (db-recent-handler/add-page-to-recent! (:db/id (get-page env page))))
          (mark-page-recycled! env recycled-page)
          (p/let [recent-pages (db-recent-handler/get-recent-pages)]
            (is (= [active-page]
                   (map :block/title recent-pages)))))))))

(deftest add-page-to-recent-updates-state-without-renderer-entity-test
  (let [recent-pages (atom [2 3])
        updates (atom [])]
    (with-redefs [state/get-recent-pages (fn [] @recent-pages)
                  state/set-recent-pages!
                  (fn [pages]
                    (reset! recent-pages pages)
                    (swap! updates conj pages))]
      (db-recent-handler/add-page-to-recent! 1)
      (is (= [1 2 3] @recent-pages))
      (db-recent-handler/add-page-to-recent! 3)
      (is (= [3 1 2] @recent-pages)
          "A visit to a page in the list moves it to the front")
      (db-recent-handler/add-page-to-recent! 3)
      (is (= [3 1 2] @recent-pages)
          "A visit to the front page keeps the list")
      (with-redefs [state/get-state (fn [] {:db/restoring? true})]
        (db-recent-handler/add-page-to-recent! 4))
      (is (= [[1 2 3] [3 1 2] [3 1 2]]
             @updates)
          "Restoring state does not mutate recent pages"))))

(deftest add-page-to-recent-keeps-max-recent-pages-test
  (let [max-recent-pages db-recent-handler/max-recent-pages
        recent-pages (atom (vec (range 1 (inc max-recent-pages))))]
    (with-redefs [state/get-recent-pages (fn [] @recent-pages)
                  state/set-recent-pages! #(reset! recent-pages %)]
      (db-recent-handler/add-page-to-recent! (inc max-recent-pages))
      (is (= (vec (cons (inc max-recent-pages) (range 1 max-recent-pages))) @recent-pages)
          "A visit to a page not in a full list drops the oldest page"))))

(deftest recent-shows-most-recently-visited-eligible-pages-test
  (testing "Recent shows the max-recent-pages most recently visited eligible pages, ordered by their last visit, newest first"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 (into [{:page {:block/title "Page with a block"}
                         :blocks [{:block/title "A block"}]}
                        {:page {:block/title "Hidden page"
                                :build/properties {:logseq.property/hide? true}}}
                        {:page {:block/title "Recycled page"
                                :build/properties {:logseq.property/deleted-at 1712000000000}}}]
                       (map (fn [i] {:page {:block/title (str "Page " i)}}))
                       (range 20))})
          db @conn
          page #(ldb/get-page db %)
          eligible (into [(page "Page with a block")]
                         (map #(page (str "Page " %)))
                         (range 20))
          ineligible [(db-test/find-block-by-content db "A block")
                      (page "Hidden page")
                      (page "Recycled page")
                      (page common-config/recycle-page-name)
                      (d/entity db :logseq.property/hide?)]
          eligible-ids (set (map :db/id eligible))
          ids (mapv :db/id (concat eligible ineligible))
          uuid-of #(:block/uuid (d/entity db %))
          repo "recent-property-test"
          *recent (atom [])
          page-route-info (get @thread-api/*thread-apis :thread-api/get-page-route-info)
          get-recent-pages (get @thread-api/*thread-apis :thread-api/get-recent-pages)
          ;; The same check redirect-to-page! makes before it records a visit
          visit! (fn [id]
                   (let [route-info (page-route-info repo (uuid-of id))]
                     (when (:eligible-for-recent? route-info)
                       (db-recent-handler/add-page-to-recent! (:page-id route-info)))))
          expected (fn [visits]
                     (->> (rseq visits)
                          (filter eligible-ids)
                          distinct
                          (take db-recent-handler/max-recent-pages)
                          (map uuid-of)))
          property (prop/for-all [visits (gen/vector (gen/elements ids) 0 60)]
                     (reset! *recent [])
                     (run! visit! visits)
                     (= (expected visits)
                        (map :block/uuid (get-recent-pages repo @*recent))))]
      (with-redefs [worker-state/get-datascript-conn (constantly conn)
                    state/get-recent-pages (fn [] @*recent)
                    state/set-recent-pages! #(reset! *recent %)]
        (let [result (tc/quick-check 200 property)]
          (is (true? (:pass? result))
              (str "seed " (:seed result) ", smallest failing visits: "
                   (pr-str (first (get-in result [:shrunk :smallest]))))))))))

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
