(ns frontend.worker.handler.page-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.handler.block :as worker-handler-block]
            [frontend.worker.handler.page :as worker-page]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]))

(defn- page-block-index-api
  []
  (let [api (deref #'worker-page/get-page-block-index)]
    (is (fn? api) "Missing worker page API: get-page-block-index")
    api))

(defn- conn-with-page
  "Creates a conn with a \"PerfPage\" page of `child-count` direct children, each
   having `grandchild-count` children of its own. Returns conn."
  [child-count grandchild-count]
  (db-test/create-conn-with-blocks
   [{:page {:block/title "PerfPage"}
     :blocks (mapv (fn [i]
                     {:block/title (str "b" i)
                      :build/children (mapv (fn [j]
                                              {:block/title (str "b" i "." j)})
                                            (range grandchild-count))})
                   (range child-count))}]))

(defn- page-uuid
  [db]
  (:block/uuid (db-test/find-page-by-title db "PerfPage")))

(deftest get-page-block-index-bounds-work-to-initial-limit-test
  (let [get-page-block-index (page-block-index-api)]
    (testing "returns only the first N visible blocks in pre-order"
      (let [conn (conn-with-page 10 100)
            result (get-page-block-index @conn (page-uuid @conn) 5)
            index (:index result)]
        (is (= 5 (count index)))
        (is (= ["b0" "b0.0" "b0.1" "b0.2" "b0.3"]
               (mapv #(:block/title (d/entity @conn (:db/id %))) index)))
        (is (= [1 2 2 2 2] (mapv :block/level index)))
        (is (= 5 (count (:blocks result))))
        (is (some? (:block result)))))

    (testing "does not descend into collapsed blocks"
      (let [conn (conn-with-page 3 5)
            first-child (:db/id (db-test/find-block-by-content @conn "b0"))]
        (d/transact! conn [[:db/add first-child :block/collapsed? true]])
        (let [index (:index (get-page-block-index @conn (page-uuid @conn) 10))]
          (is (= ["b0" "b1" "b1.0" "b1.1" "b1.2" "b1.3" "b1.4" "b2" "b2.0" "b2.1"]
                 (mapv #(:block/title (d/entity @conn (:db/id %))) index)))
          (is (true? (:block/collapsed? (first index))))
          (is (true? (:block.temp/has-children? (first index)))))))))

;; Reconstruction of the pre-PR index construction: materialize the whole
;; subtree, then build a parent/level index over every descendant before
;; taking the limit. Used to compare total work, not just materialization.
(defn- old-visible-index-entries
  [index]
  (loop [entries index
         collapsed-level nil
         result []]
    (if-let [entry (first entries)]
      (let [level (:block/level entry)
            hidden? (and collapsed-level (> level collapsed-level))
            collapsed-level (cond
                              hidden? collapsed-level
                              (:block/collapsed? entry) level
                              :else nil)]
        (recur (next entries)
               collapsed-level
               (cond-> result (not hidden?) (conj entry))))
      result)))

(defn- old-block-index-entry
  [block parent-ids level]
  {:db/id (:db/id block)
   :block/uuid (:block/uuid block)
   :block/parent {:db/id (:db/id (:block/parent block))}
   :block/order (:block/order block)
   :block/collapsed? (boolean (:block/collapsed? block))
   :block/level level
   :block.temp/has-children? (contains? parent-ids (:db/id block))})

(deftest get-page-block-index-scales-with-limit-not-page-size-test
  (let [get-page-block-index (page-block-index-api)
        get-block-and-children (deref #'worker-handler-block/get-block-and-children)]
    (doseq [child-count [50 500]]
      (let [conn (conn-with-page child-count 10)
            db @conn
            root-uuid (page-uuid db)
            total (* child-count 10)
            _ (dotimes [_ 3] (get-page-block-index db root-uuid 50))
            root (d/entity db [:block/uuid root-uuid])
            ;; --- new implementation, split into index traversal + render fetch
            t0 (system-time)
            result (get-page-block-index db root-uuid 50)
            bounded-total (- (system-time) t0)
            index (:index result)
            ta (system-time)
            _ ((deref #'worker-page/visible-index-entries) root 50)
            traverse-ms (- (system-time) ta)
            ;; old implementation: full materialization + full index build,
            ;; then the same render-data fetches for the first `limit` blocks
            t1 (system-time)
            tree-entities (vec (ldb/get-block-and-children db root-uuid))
            children (subvec tree-entities 1)
            materialize-ms (- (system-time) t1)
            t2 (system-time)
            parent-ids (into #{} (keep #(some-> % :block/parent :db/id)) children)
            levels (volatile! {(:db/id (first tree-entities)) 0})
            full-index (mapv (fn [block]
                               (let [parent-id (:db/id (:block/parent block))
                                     level (inc (get @levels parent-id 0))]
                                 (vswap! levels assoc (:db/id block) level)
                                 (old-block-index-entry block parent-ids level)))
                             children)
            old-initial-ids (->> full-index
                                 old-visible-index-entries
                                 (take 50)
                                 (map :db/id))
            index-ms (- (system-time) t2)
            t3 (system-time)
            _ (mapv (fn [block-id]
                      (:block (get-block-and-children
                               db block-id {:children? false
                                            :render-data? true})))
                    old-initial-ids)
            render-ms (- (system-time) t3)
            old-total (+ materialize-ms index-ms render-ms)]
        (is (= 50 (count index)))
        (is (= old-initial-ids (mapv :db/id index)))
        (is (>= (count tree-entities) (inc total)))
        (println (str "page-size=" total " initial-limit=50"
                      " bounded-total-ms=" bounded-total
                      " (traverse=" traverse-ms ")"
                      " old-total-ms=" old-total
                      " (materialize=" materialize-ms
                      " index-build=" index-ms
                      " render-fetch=" render-ms ")"))))))
