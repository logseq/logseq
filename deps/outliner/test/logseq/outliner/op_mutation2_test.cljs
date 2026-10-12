(ns logseq.outliner.op-mutation2-test
  "Tests for survivors of the second mutation run on logseq.outliner.op."
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.sqlite.export :as sqlite-export]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.op :as outliner-op]
            [logseq.outliner.page :as outliner-page]
            [logseq.outliner.template :as outliner-template]))

(deftest toggle-reaction-transacts-with-its-outliner-op-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "Test"}
                :blocks [{:block/title "Block"}]}])
        target-uuid (:block/uuid (db-test/find-block-by-content @conn "Block"))
        metas (atom [])]
    (d/listen! conn ::capture (fn [report] (swap! metas conj (:tx-meta report))))
    (is (true? (#'outliner-op/toggle-reaction! conn target-uuid "+1" nil)) "adds")
    (is (true? (#'outliner-op/toggle-reaction! conn target-uuid "+1" nil)) "removes")
    (d/unlisten! conn ::capture)
    (is (= [:toggle-reaction :toggle-reaction] (mapv :outliner-op @metas)))
    (is (empty? (:logseq.property.reaction/_target (d/entity @conn [:block/uuid target-uuid]))))))

(deftest import-edn-data-reports-errors-test
  (let [conn (db-test/create-conn)]
    (testing "a build that throws"
      (let [*result (atom nil)]
        (with-redefs [sqlite-export/build-import (fn [& _] (throw (js/Error. "build failed")))]
          (#'outliner-op/import-edn-data conn *result {} {}))
        (is (= {:error "An unexpected error occurred building the import. See the javascript console for details."}
               @*result))))
    (testing "validation gets the label and the scope"
      (let [validate-args (atom [])]
        (doseq [import-options [{} {:validate-scope :all}]]
          (let [*result (atom nil)]
            (with-redefs [sqlite-export/build-import (fn [& _] {:tx-data []})
                          sqlite-export/validate-import-txs (fn [_txs _db options]
                                                              (swap! validate-args conj options)
                                                              {:error "invalid import"})]
              (#'outliner-op/import-edn-data conn *result {} import-options))
            (is (= {:error "invalid import"} @*result))))
        (is (= [{:edn-label "Imported EDN"}
                {:edn-label "Imported EDN" :validate-scope :all}]
               @validate-args))))
    (testing "a transact that throws"
      (let [*result (atom nil)]
        (with-redefs [sqlite-export/build-import (fn [& _] {:tx-data []})
                      sqlite-export/validate-import-txs (fn [& _] {:tx-data []})
                      ldb/transact! (fn [& _] (throw (ex-info "transact failed" {})))]
          (#'outliner-op/import-edn-data conn *result {} {}))
        (is (= {:error "Unexpected Import EDN error: \"transact failed\""} @*result))))))

(defn- template-conn
  []
  (db-test/create-conn-with-blocks
   {:pages-and-blocks
    [{:page {:block/title "Target Page"}
      :blocks [{:block/title "target block"}]}
     {:page {:block/title "Templates"}
      :blocks [{:block/title "template root"
                :build/children [{:block/title "template child"
                                  :build/properties {:log-time "noon"}}
                                 {:block/title "template child 2"}]}]}]
    :properties {:log-time {:logseq.property/type :default}}}))

(deftest template-children-blocks-test
  (let [conn (template-conn)
        root (db-test/find-block-by-content @conn "template root")
        blocks (#'outliner-op/template-children-blocks @conn [:block/uuid (:block/uuid root)])
        children (map #(d/entity @conn (:db/id %)) blocks)]
    (is (every? #(some? (:db/id %)) blocks))
    (is (= "template child" (:block/title (first children))))
    (is (= (:db/id root) (:logseq.property/used-template (first blocks))))
    (is (nil? (:logseq.property/used-template (second blocks))))
    (testing "property value blocks are included"
      (is (some :logseq.property/created-from-property blocks)))))

(deftest ensure-template-journal-pages-creates-journals-test
  (let [conn (db-test/create-conn)
        created (atom [])]
    (with-redefs [outliner-template/dynamic-template-journal-days (fn [_blocks] [20260115])
                  outliner-page/create! (fn [_conn title options]
                                          (swap! created conj [title options]))]
      (#'outliner-op/ensure-template-journal-pages! conn []))
    (is (= [[(#'outliner-op/journal-title @conn 20260115) {:journal? true}]]
           @created))))

(defn- titled-blocks-on-page
  [db title page-title]
  (d/q '[:find [?b ...]
         :in $ ?title ?page-title
         :where
         [?b :block/title ?title]
         [?b :block/page ?page]
         [?page :block/title ?page-title]]
       db title page-title))

(deftest apply-template-uses-the-template-when-given-no-blocks-test
  (let [conn (template-conn)
        root (db-test/find-block-by-content @conn "template root")
        target (db-test/find-block-by-content @conn "target block")]
    (outliner-op/apply-ops! conn
                            [[:apply-template [(:block/uuid root) (:block/uuid target)
                                               {:template-blocks []}]]]
                            {})
    (is (= 1 (count (titled-blocks-on-page @conn "template child 2" "Target Page"))))))

(deftest apply-template-accepts-given-blocks-as-a-list-test
  (let [conn (template-conn)
        root (db-test/find-block-by-content @conn "template root")
        target (db-test/find-block-by-content @conn "target block")
        blocks (#'outliner-op/template-children-blocks @conn [:block/uuid (:block/uuid root)])]
    (outliner-op/apply-ops! conn
                            [[:apply-template [(:block/uuid root) (:block/uuid target)
                                               {:template-blocks (apply list blocks)}]]]
                            {})
    (is (= 1 (count (titled-blocks-on-page @conn "template child 2" "Target Page"))))))

(deftest resolve-indent-outdent-opts-reports-a-missing-parent-test
  (let [conn (db-test/create-conn)
        missing (random-uuid)
        error (try
                (#'outliner-op/resolve-indent-outdent-opts @conn {:parent-original {:block/uuid missing}})
                nil
                (catch :default e e))]
    (is (= {:type ::outliner-op/missing-parent-original
            :block/uuid missing}
           (ex-data error)))))

(deftest rename-page-op-rejects-a-blank-title-test
  (let [conn (db-test/create-conn)
        page-uuid (random-uuid)
        error (try
                (#'outliner-op/apply-op! conn {} (atom nil) [:rename-page [page-uuid "  "]])
                nil
                (catch :default e e))]
    (is (= {:block/uuid page-uuid :block/title "  "}
           (ex-data error)))))

(deftest create-property-text-block-op-sets-the-value-on-the-block-test
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:text-prop {:logseq.property/type :default}}
               :pages-and-blocks
               [{:page {:block/title "Test"}
                 :blocks [{:block/title "Block"}]}]})
        block-uuid (:block/uuid (db-test/find-block-by-content @conn "Block"))]
    (outliner-op/apply-ops! conn
                            [[:create-property-text-block [block-uuid :user.property/text-prop "some text" nil]]]
                            {})
    (is (some? (:user.property/text-prop (d/entity @conn [:block/uuid block-uuid]))))))

(deftest import-edn-op-test
  (is (true? (#'outliner-op/import-edn-op? [:batch-import-edn [{} {}]])))
  (is (false? (#'outliner-op/import-edn-op? [:save-block [{} {}]]))))
