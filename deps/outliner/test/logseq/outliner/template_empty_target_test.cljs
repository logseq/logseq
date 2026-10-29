(ns logseq.outliner.template-empty-target-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.op :as outliner-op]))

(defn- reachable-titles
  [db page-id]
  (loop [ids [page-id]
         titles #{}]
    (if-let [id (first ids)]
      (let [children (:block/_parent (d/entity db id))]
        (recur (concat (rest ids) (map :db/id children))
               (into titles (keep :block/title children))))
      titles)))

(deftest apply-template-into-empty-block-with-children-keeps-its-parent-test
  (testing "a template replacing an empty block that has children keeps the block under its parent"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "Target Page"}
                  :blocks [{:block/title "before"}
                           {:block/title ""
                            :build/children [{:block/title "existing child"}]}]}
                 {:page {:block/title "Templates"}
                  :blocks [{:block/title "template root"
                            :build/children [{:block/title "tpl one"}
                                             {:block/title "tpl two"}]}]}])
          page (ldb/get-page @conn "Target Page")
          template-root (db-test/find-block-by-content @conn "template root")
          empty-block (->> (:block/_parent page)
                           (some #(when (= "" (:block/title %)) %)))
          _ (outliner-op/apply-ops! conn
                                    [[:apply-template [(:block/uuid template-root)
                                                       (:block/uuid empty-block)
                                                       {:replace-empty-target? true}]]]
                                    {})
          replaced (d/entity @conn [:block/uuid (:block/uuid empty-block)])]
      (is (= "tpl one" (:block/title replaced)))
      (is (= (:db/id page) (:db/id (:block/parent replaced))))
      (is (= #{"before" "tpl one" "tpl two" "existing child"}
             (reachable-titles @conn (:db/id page)))))))
