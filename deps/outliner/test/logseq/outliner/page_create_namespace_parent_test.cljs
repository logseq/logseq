(ns logseq.outliner.page-create-namespace-parent-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.page :as outliner-page]))

(defn- parent-titles
  [page]
  (loop [page (:block/parent page)
         titles []]
    (if (and page (not= "Library" (:block/title page)))
      (recur (:block/parent page) (conj titles (:block/title page)))
      titles)))

(deftest create-namespace-page-when-same-names-exist-elsewhere-test
  (testing "A/B/C is created under A/B when X/B/C exists"
    (let [conn (db-test/create-conn)
          [_ xbc-uuid] (outliner-page/create! conn "X/B/C" {:split-namespace? true})
          [_ abc-uuid] (outliner-page/create! conn "A/B/C" {:split-namespace? true})
          abc (d/entity @conn [:block/uuid abc-uuid])]
      (is (some? abc))
      (is (not= xbc-uuid abc-uuid))
      (is (= "C" (:block/title abc)))
      (is (= ["B" "A"] (parent-titles abc)))
      (is (= ["B" "X"] (parent-titles (d/entity @conn [:block/uuid xbc-uuid])))))))

(deftest create-existing-namespace-page-test
  (testing "creating a namespaced page that exists returns that page"
    (let [conn (db-test/create-conn)
          [_ bar-uuid] (outliner-page/create! conn "Foo/Bar" {:split-namespace? true})
          [_ bar-uuid'] (outliner-page/create! conn "Foo/Bar" {:split-namespace? true})]
      (is (= bar-uuid bar-uuid')))))
