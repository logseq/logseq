(ns frontend.worker.undo-redo2-test
  (:require [clojure.test :as t :refer [deftest is testing use-fixtures]]
            [datascript.core :as d]
            [frontend.db :as db]
            [frontend.test.helper :as test-helper]
            [frontend.worker.undo-redo2 :as undo-redo2]
            [frontend.modules.outliner.core-test :as outliner-test]
            [frontend.test.fixtures :as fixtures]
            [frontend.worker.db-listener :as worker-db-listener]
            [frontend.state :as state]))

;; TODO: random property ops test

(def test-db test-helper/test-db)

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
  [conn]
  (loop [i 0]
    (let [r (undo-redo2/undo test-db conn)]
      (if (not= :frontend.worker.undo-redo2/empty-undo-stack r)
        (recur (inc i))
        (prn :undo-count i)))))

(defn- redo-all!
  [conn]
  (loop [i 0]
          (let [r (undo-redo2/redo test-db conn)]
            (if (not= :frontend.worker.undo-redo2/empty-redo-stack r)
              (recur (inc i))
              (prn :redo-count i)))))

(defn- get-datoms
  [db]
  (set (map (fn [d] [(:e d) (:a d) (:v d)]) (d/datoms db :eavt))))

(deftest ^:long undo-redo-test
  (testing "Random mixed operations"
    (set! undo-redo2/max-stack-length 500)
    (let [*random-blocks (atom (outliner-test/get-blocks-ids))]
      (outliner-test/transact-random-tree!)
      (let [conn (db/get-db false)
            _ (outliner-test/run-random-mixed-ops! *random-blocks)
            db-after @conn]

        (undo-all! conn)

        (is (= (get-datoms @conn) #{}))

        (redo-all! conn)

        (is (= (get-datoms @conn) (get-datoms db-after)))))))
