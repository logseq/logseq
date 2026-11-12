(ns frontend.worker.input-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [frontend.common.thread-api :as thread-api]
            [frontend.handler.db-based.editor :as db-editor-handler]
            [frontend.state :as state]
            [frontend.worker.handler.transaction]
            [frontend.worker.pipeline :as worker-pipeline]
            [frontend.worker.state :as worker-state]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.op :as outliner-op]
            [logseq.outliner.op.construct :as op-construct]
            [logseq.outliner.page :as outliner-page]))

(defn- fixture []
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:SampleTag {}}
               :pages-and-blocks [{:page {:block/title "Home"} :blocks [{:block/title "source"}]}
                                  {:page {:block/title "Alpha"} :blocks [{:block/title "keep alpha"}]}]})]
    {:conn conn :id (:block/uuid (db-test/find-block-by-content @conn "source"))
     :home (:block/uuid (ldb/get-page @conn "Home"))
     :alpha (:block/uuid (ldb/get-page @conn "Alpha"))}))

(defn- call!
  ([conn ops] (call! conn ops {}))
  ([conn ops options]
   (with-redefs [worker-state/get-datascript-conn (constantly conn)]
     ((get @thread-api/*thread-apis :thread-api/apply-outliner-ops) "logseq_db_input-test" ops options))))

(defn- raw-title [conn id]
  (:v (first (d/datoms @conn :eavt (d/entid @conn [:block/uuid id]) :block/title))))

(defn- with-pipeline [f]
  (ldb/register-transact-pipeline-fn! worker-pipeline/transact-pipeline)
  (try (f) (finally (ldb/register-transact-pipeline-fn! identity))))

(deftest generic-api-saves-raw-editor-content
  (let [{:keys [conn id alpha]} (fixture)
        block {:block/uuid id :block/title "## Heading [[Alpha]] #SampleTag"}]
    (with-pipeline
      (fn []
        (call! conn [[:logseq.outliner/save-block-input [block {}]]])
        (let [updated (d/entity @conn [:block/uuid id])
              tag (ldb/get-page @conn "SampleTag")]
          (is (= (str "Heading [[" alpha "]] #[[" (:block/uuid tag) "]]") (raw-title conn id)))
          (is (= 2 (:logseq.property/heading updated)))
          (is (contains? (set (map :block/uuid (:block/refs updated))) alpha))
          (is (= #{(:block/uuid tag)} (set (map :block/uuid (:block/tags updated))))))))))

(deftest generic-input-batch-rolls-back-derived-pages
  (let [{:keys [conn id]} (fixture)
        before @conn
        block {:block/uuid id :block/title "[[Must not survive failure]]"}]
    (with-pipeline
      (fn []
        (is (thrown? js/Error
                     (call! conn [[:logseq.outliner/save-block-input [block {}]]
                                  [:batch-set-property [[id] :user.property/missing-input-property 1 {}]]])))
        (is (= before @conn))
        (is (nil? (ldb/get-page @conn "Must not survive failure")))))))

(deftest generic-preview-uses-the-same-input-without-committing
  (let [{:keys [conn home]} (fixture)
        before @conn
        id (random-uuid)
        block {:block/uuid id :block/title "[[PreviewPage]] #PreviewTag"}
        ops [[:logseq.outliner/insert-blocks-input [[block] home {:keep-uuid? true}]]]]
    (with-pipeline
      (fn []
        (let [response (call! conn [[:logseq.outliner/preview-ops [ops]]])]
          (is (= #{"PreviewPage" "PreviewTag"} (set (get-in response [:result :would-create-pages]))))
          (is (= before @conn))
          (is (nil? (d/entity @conn [:block/uuid id]))))))))

(deftest preview-reports-only-surviving-new-pages
  (let [{:keys [conn id alpha]} (fixture)
        before @conn
        temporary-id (random-uuid)
        extra-id (random-uuid)]
    (with-pipeline
      (fn []
        (is (= [] (get-in (call! conn [[:logseq.outliner/preview-ops [[]]]])
                         [:result :would-create-pages])))
        (let [response (call! conn
                              [[:logseq.outliner/preview-ops
                                [[[:logseq.outliner/save-block-input
                                   [{:block/uuid id :block/title "[[Alpha]] [[New/Child]] [[New/Child]]"} {}]]]]]]
                              {:additional-tx [{:block/uuid temporary-id :block/name "temporary" :block/title "Temporary"}
                                               [:db/retractEntity [:block/uuid temporary-id]]
                                               {:block/uuid extra-id :block/name "extra" :block/title "Extra"}
                                               [:db/add [:block/uuid alpha] :block/title "Renamed Alpha"]]})]
          (is (= #{"New" "New/Child" "Extra"}
                 (set (get-in response [:result :would-create-pages])))))
        (is (= before @conn))))))

(deftest generic-content-path-retains-existing-transaction-options
  (doseq [raw? [false true]]
    (let [{:keys [conn id alpha]} (fixture)
          title (if raw? "[[Alpha]]" (str "[[" alpha "]]"))
          block {:block/uuid id :block/title title :block/refs [[:block/uuid alpha]]}
          op (if raw? :logseq.outliner/save-block-input :save-block)]
      (with-pipeline
        (fn []
          (call! conn [[op [block {}]]]
                 {:additional-tx [[:db/add [:block/uuid id] :block/collapsed? true]]})
          (is (true? (:block/collapsed? (d/entity @conn [:block/uuid id])))))))))

(deftest malformed-content-and-preview-requests-fail-before-writing
  (let [{:keys [conn id]} (fixture)
        block {:block/uuid id :block/title "must not write"}]
    (with-pipeline
      (fn []
        (doseq [request [[[:logseq.outliner/save-block-input [block {}] :ignored]]
                         [[:logseq.outliner/preview-ops [nil]]]
                         [[:logseq.outliner/preview-ops [[]] :ignored]]
                         nil]]
          (let [before @conn]
            (is (thrown? js/Error (call! conn request)))
            (is (identical? before @conn))))))))

(defn- desktop-save!
  [conn id title known-refs]
  (with-redefs [state/get-current-repo (constantly nil)]
    (let [parsed (db-editor-handler/wrap-parse-block {:block/uuid id :block/title title :block/refs known-refs})]
      (outliner-op/apply-ops! conn [[:save-block [parsed {}]]] nil))))

(deftest raw-input-keeps-distinct-page-and-tag-inventory
  (let [{:keys [conn id]} (fixture)
        [_ page] (outliner-page/create! conn "Foo" {})
        [_ tag] (outliner-page/create! conn "foo" {:class? true})
        desktop (d/conn-from-db @conn)
        known (mapv #(select-keys (d/entity @conn [:block/uuid %]) [:db/id :block/uuid :block/title :block/name :block/tags]) [page tag])
        block {:block/uuid id :block/title "[[Foo]] #foo"}]
    (with-pipeline
      (fn []
        (desktop-save! desktop id (:block/title block) known)
        (call! conn [[:logseq.outliner/save-block-input [block {}]]])
        (is (= 2 (count (d/datoms @conn :avet :block/name "foo"))))
        (is (= (raw-title desktop id) (raw-title conn id)))
        (is (= (set (map :block/uuid (:block/refs (d/entity @desktop [:block/uuid id]))))
               (set (map :block/uuid (:block/refs (d/entity @conn [:block/uuid id]))))))))))

(deftest raw-input-uses-the-desktop-default-journal-format
  (let [{:keys [conn id]} (fixture)
        _ (d/transact! conn [[:db/retract :logseq.class/Journal :logseq.property.journal/title-format]])
        desktop (d/conn-from-db @conn)
        block {:block/uuid id :block/title "[[2026-11-11]]"}]
    (with-pipeline
      (fn []
        (desktop-save! desktop id (:block/title block) [])
        (call! conn [[:logseq.outliner/save-block-input [block {}]]])
        (is (= "[[00000001-2026-1111-0000-000000000000]]" (raw-title conn id)))
        (is (= (raw-title desktop id) (raw-title conn id)))
        (is (some? (ldb/get-page @conn "Nov 11th, 2026")))))))

(deftest generic-input-applies-additional-transactions-once-after-the-whole-batch
  (let [{:keys [conn id]} (fixture)
        first-block {:block/uuid id :block/title "first"}
        second-block {:block/uuid id :block/title "second"}]
    (with-pipeline
      (fn []
        (call! conn [[:logseq.outliner/save-block-input [first-block {}]]
                     [:logseq.outliner/save-block-input [second-block {}]]]
               {:additional-tx [[:db.fn/cas [:block/uuid id] :block/title "second" "after cut/paste"]]})
        (is (= "after cut/paste" (raw-title conn id)))))))

(deftest raw-input-history-persists-only-canonical-operations
  (let [{:keys [conn id alpha]} (fixture)
        reports (atom [])
        forbidden #{:logseq.outliner/save-block-input :logseq.outliner/insert-blocks-input
                    :logseq.outliner/preview-ops :logseq.outliner.input/parse-options}]
    (d/listen! conn ::canonical-history #(swap! reports conj %))
    (try
      (with-pipeline
        (fn []
          (call! conn [[:logseq.outliner/save-block-input [{:block/uuid id :block/title "updated [[Alpha]]"} {}]]])
          (let [{:keys [db-before db-after tx-data tx-meta]} (last @reports)
                history (-> (op-construct/derive-history-outliner-ops db-before db-after tx-data tx-meta)
                            ldb/write-transit-str ldb/read-transit-str)
                forward (:forward-outliner-ops history)
                inverse (:inverse-outliner-ops history)]
            (is (= [:save-block] (mapv first forward)))
            (is (= [:save-block] (mapv first inverse)))
            (is (= (str "updated [[" alpha "]]") (get-in forward [0 1 0 :block/title])))
            (is (= "source" (get-in inverse [0 1 0 :block/title])))
            (is (not-any? forbidden (tree-seq coll? seq history)))
            (is (not (contains? tx-meta :logseq.outliner.input/parse-options)))
            (is (not-any? forbidden (map first (:outliner-ops tx-meta)))))))
      (finally (d/unlisten! conn ::canonical-history)))))
