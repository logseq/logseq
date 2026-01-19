(ns frontend.undo-redo-test
  (:require [clojure.test :as t :refer [deftest is testing use-fixtures]]
            [datascript.core :as d]
            [frontend.db :as db]
            [frontend.modules.outliner.core-test :as outliner-test]
            [frontend.state :as state]
            [frontend.test.fixtures :as fixtures]
            [frontend.test.helper :as test-helper]
            [frontend.undo-redo :as undo-redo]
            [frontend.worker.db-listener :as worker-db-listener]))

;; TODO: random property ops test

(def test-db test-helper/test-db)

(defmethod worker-db-listener/listen-db-changes :gen-undo-ops
  [_ {:keys [repo]} tx-report]
  (undo-redo/gen-undo-ops! repo
                           (assoc-in tx-report [:tx-meta :client-id] (:client-id @state/state))))

(defn listen-db-fixture
  [f]
  (let [test-db-conn (db/get-db test-db false)]
    (assert (some? test-db-conn))
    (worker-db-listener/listen-db-changes! test-db test-db-conn
                                           {:handler-keys [:gen-undo-ops]})
    (f)
    (d/unlisten! test-db-conn :frontend.worker.db-listener/listen-db-changes!)))

(defn disable-browser-fns
  [f]
  ;; get-selection-blocks has a js/document reference
  (with-redefs [state/get-selection-blocks (constantly [])]
    (f)))

(use-fixtures :each
  disable-browser-fns
  fixtures/react-components
  fixtures/reset-db
  listen-db-fixture)

(defn- undo-all!
  []
  (loop [i 0]
    (let [r (undo-redo/undo test-db)]
      (if (not= :frontend.undo-redo/empty-undo-stack r)
        (recur (inc i))
        (prn :undo-count i)))))

(defn- redo-all!
  []
  (loop [i 0]
    (let [r (undo-redo/redo test-db)]
      (if (not= :frontend.undo-redo/empty-redo-stack r)
        (recur (inc i))
        (prn :redo-count i)))))

(defn- get-datoms
  [db]
  (set (map (fn [d] [(:e d) (:a d) (:v d)]) (d/datoms db :eavt))))

(deftest ^:long undo-redo-test
  (testing "Random mixed operations"
    (set! undo-redo/max-stack-length 500)
    (let [*random-blocks (atom (outliner-test/get-blocks-ids))]
      (outliner-test/transact-random-tree!)
      (let [conn (db/get-db false)
            _ (outliner-test/run-random-mixed-ops! *random-blocks)
            db-after @conn]

        (undo-all!)

        (is (= (get-datoms @conn) #{}))

        (redo-all!)

        (is (= (get-datoms @conn) (get-datoms db-after)))))))
