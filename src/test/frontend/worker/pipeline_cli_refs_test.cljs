(ns frontend.worker.pipeline-cli-refs-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.handler.db-based.editor :as db-editor-handler]
            [frontend.state :as state]
            [frontend.worker.input-test-helper :as input-helper]
            [frontend.worker.pipeline :as worker-pipeline]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.op :as outliner-op]
            [logseq.outliner.page :as outliner-page]))

(defn- with-pipeline
  [f]
  (ldb/register-transact-pipeline-fn! worker-pipeline/transact-pipeline)
  (try (f) (finally (ldb/register-transact-pipeline-fn! identity))))

(defn- refs
  [db block-uuid]
  (set (map :db/id (:block/refs (d/entity db [:block/uuid block-uuid])))))

(defn- insert-op
  [block page]
  [:insert-blocks [[block] (:block/uuid page) {:keep-uuid? true :bottom? true}]])

(deftest cli-batch-creates-task-and-tag-refs
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Topic {}}
               :pages-and-blocks [{:page {:block/title "Home"}}
                                  {:page {:block/title "Project A"}}]})
        home (ldb/get-page @conn "Home")
        project (ldb/get-page @conn "Project A")
        topic (d/entity @conn :user.class/Topic)
        tagged-id (random-uuid)
        task-id (random-uuid)]
    (with-pipeline
      (fn []
        (testing "insert plus tag preserves the inline page ref and adds metadata refs"
          (input-helper/apply-ops!
           conn [(insert-op {:block/uuid tagged-id
                             :block/title (str "See " (page-ref/->page-ref (:block/uuid project)))
                             :block/refs [[:block/uuid (:block/uuid project)]]} home)
                 [:batch-set-property [[tagged-id] :block/tags (:db/id topic) {}]]]
           {})
          (is (= #{(:db/id project) (:db/id topic) (d/entid @conn :block/tags)}
                 (refs @conn tagged-id))))
        (testing "insert plus task tag and status builds all public metadata refs"
          (input-helper/apply-ops!
           conn [(insert-op {:block/uuid task-id :block/title "Write brief"} home)
                 [:batch-set-property [[task-id] :block/tags :logseq.class/Task {}]]
                 [:batch-set-property [[task-id] :logseq.property/status :logseq.property/status.todo {}]]]
           {})
          (is (every? (refs @conn task-id)
                      (map #(d/entid @conn %) [:block/tags :logseq.class/Task :logseq.property/status]))))
        (testing "status update keeps task metadata refs"
          (input-helper/apply-ops!
           conn [[:batch-set-property [[task-id] :block/tags :logseq.class/Task {}]]
                 [:batch-set-property [[task-id] :logseq.property/status :logseq.property/status.doing {}]]]
           {})
          (is (every? (refs @conn task-id)
                      (map #(d/entid @conn %) [:block/tags :logseq.class/Task :logseq.property/status]))))))))

(deftest cli-batch-rebuilds-multiple-node-properties-and-retracts-old-refs
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:p1 {:logseq.property/type :node}
                            :p2 {:logseq.property/type :node}}
               :pages-and-blocks [{:page {:block/title "Home"}
                                   :blocks [{:block/title "Existing"}]}
                                  {:page {:block/title "T1"}}
                                  {:page {:block/title "T2"}}]})
        block (db-test/find-block-by-content @conn "Existing")
        block-id (:block/uuid block)
        t1 (ldb/get-page @conn "T1")
        t2 (ldb/get-page @conn "T2")
        expected #{(d/entid @conn :user.property/p1) (d/entid @conn :user.property/p2)
                   (:db/id t1) (:db/id t2)}]
    (with-pipeline
      (fn []
        (input-helper/apply-ops!
         conn [[:batch-set-property [[block-id] :user.property/p1 (:db/id t1) {}]]
               [:batch-set-property [[block-id] :user.property/p2 (:db/id t2) {}]]]
         {})
        (is (= expected (refs @conn block-id)))
        (input-helper/apply-ops!
         conn [[:batch-set-property [[block-id] :user.property/p1 (:db/id t2) {}]]
               [:batch-remove-property [[block-id] :user.property/p2]]]
         {})
        (is (= #{(d/entid @conn :user.property/p1) (:db/id t2)} (refs @conn block-id)))
        (input-helper/apply-ops!
         conn [[:batch-remove-property [[block-id] :user.property/p1]]
               [:save-block [{:block/uuid block-id :block/title "Plain"} {}]]]
         {})
        (is (empty? (refs @conn block-id)))))))

(deftest cli-canonical-links-survive-ref-rebuilding
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Topic {}}
               :pages-and-blocks [{:page {:block/title "Home"}}
                                  {:page {:block/title "Project A"}}]})
        [_ nested-id] (outliner-page/create! conn "Namespace/Child" {:split-namespace? true})
        nested (d/entity @conn [:block/uuid nested-id])
        home (ldb/get-page @conn "Home")
        project (ldb/get-page @conn "Project A")
        block-id (random-uuid)
        topic (d/entid @conn :user.class/Topic)]
    (with-pipeline
      (fn []
        (input-helper/apply-ops!
         conn [(insert-op {:block/uuid block-id
                           :block/title "See [[project a]] and [[Namespace/Child]]"
                           :block/refs [[:block/uuid (:block/uuid project)] [:block/uuid nested-id]]} home)
               [:batch-set-property [[block-id] :block/tags topic {}]]]
         {})
        (is (= #{(:db/id project) (:db/id nested) topic (d/entid @conn :block/tags)}
               (refs @conn block-id)))
        (input-helper/apply-ops!
         conn [[:batch-delete-property-value [[block-id] :block/tags topic]]]
         {})
        (is (= #{(:db/id project) (:db/id nested)} (refs @conn block-id)))
        (is (= (str "See [[" (:block/uuid project) "]] and [[" nested-id "]]")
               (:v (first (d/datoms @conn :eavt (d/entid @conn [:block/uuid block-id]) :block/title)))))
        (input-helper/apply-ops!
         conn [[:save-block [{:block/uuid block-id :block/title "Plain"} {}]]
               [:batch-set-property [[block-id] :block/tags topic {}]]]
         {})
        (is (= #{topic (d/entid @conn :block/tags)} (refs @conn block-id)))))))

(deftest cli-input-matches-desktop-db-editor
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "Home"}}
                                  {:page {:block/title "Alpha"}}]})
        home (ldb/get-page @conn "Home")
        alpha (ldb/get-page @conn "Alpha")
        raw-title (fn [id] (:v (first (d/datoms @conn :eavt (d/entid @conn [:block/uuid id]) :block/title))))
        parsed (fn [title]
                 (with-redefs [state/get-current-repo (constantly "logseq_db_test")
                               state/get-state (constantly [])]
                   (db-editor-handler/wrap-parse-block {:block/title title :block/refs [alpha]})))]
    (with-pipeline
      (fn []
        (doseq [title ["Created [[Alpha]]" "## Heading [[Alpha]]" "```clojure\n[[Alpha]]\n```" "$$E=mc^2$$"]]
          (let [id (random-uuid)
                desktop (parsed title)]
            (input-helper/apply-ops! conn [(insert-op {:block/uuid id :block/title title} home)] {})
            (let [block (d/entity @conn [:block/uuid id])]
              (is (= (:block/title desktop) (raw-title id)) title)
              (doseq [property [:logseq.property/heading :logseq.property.node/display-type :logseq.property.code/lang]]
                (is (= (get desktop property) (get block property)) (str title " " property))))))
        (let [id (random-uuid)]
          (input-helper/apply-ops! conn [(insert-op {:block/uuid id :block/title "note #InlineTag"} home)] {})
          (let [block (d/entity @conn [:block/uuid id])
                tag (first (:block/tags block))]
            (is (= "InlineTag" (:block/title tag)))
            (is (= (str "note #[[" (:block/uuid tag) "]]") (raw-title id)))
            (is (contains? (refs @conn id) (:db/id tag)))))
        (let [id (random-uuid)]
          (input-helper/apply-ops! conn [(insert-op {:block/uuid id :block/title "old"} home)] {})
          (input-helper/apply-ops! conn [[:save-block [{:block/uuid id :block/title "## Updated [[Alpha]]"} {}]]]
                                {})
          (is (= (str "Updated [[" (:block/uuid alpha) "]]") (raw-title id)))
          (is (= 2 (:logseq.property/heading (d/entity @conn [:block/uuid id]))))
          (is (contains? (refs @conn id) (:db/id alpha)))
          (input-helper/apply-ops! conn [[:save-block [{:block/uuid id :block/title "[[Namespace/Child]]"} {}]]]
                                {})
          (let [child (first (filter #(= "Namespace/Child" (ldb/get-title-with-parents %))
                                     (map #(d/entity @conn (:e %)) (d/datoms @conn :avet :block/name "child"))))]
            (is (some? child))
            (is (= (str "[[" (:block/uuid child) "]]") (raw-title id)))
            (is (contains? (refs @conn id) (:db/id child)))))
        (let [id (random-uuid)]
          (input-helper/apply-ops! conn [(insert-op {:block/uuid id :block/title "```\nplain\n```"} home)] {})
          (input-helper/apply-ops! conn [[:save-block [{:block/uuid id :block/title "# shell [[Alpha]]"} {}]]]
                                {})
          (is (= "# shell [[Alpha]]" (raw-title id)))
          (is (= :code (:logseq.property.node/display-type (d/entity @conn [:block/uuid id]))))
          (is (not (contains? (refs @conn id) (:db/id alpha)))))))))

(deftest cli-missing-source-or-target-does-not-materialize-pages
  (doseq [op [:insert-blocks :save-block]]
    (let [conn (db-test/create-conn-with-blocks [{:page {:block/title "Home"}}])
          missing (random-uuid)
          block {:block/uuid (random-uuid) :block/title "[[Must not leak]]"}
          entry (case op
                  :insert-blocks [:insert-blocks [[block] missing {:keep-uuid? true}]]
                  :save-block [:save-block [(assoc block :block/uuid missing) {}]])]
      (with-pipeline
        (fn []
          (is (thrown? js/Error (input-helper/apply-ops! conn [entry] {})))
          (is (nil? (ldb/get-page @conn "Must not leak"))))))))

(deftest cli-updates-preserve-uuid-links-and-display-literals
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "Home"}} {:page {:block/title "Alpha"}}])
        home (ldb/get-page @conn "Home")
        alpha (ldb/get-page @conn "Alpha")
        id (random-uuid)
        title #(-> (d/datoms @conn :eavt (d/entid @conn [:block/uuid id]) :block/title) first :v)]
    (with-pipeline
      (fn []
        (input-helper/apply-ops! conn [(insert-op {:block/uuid id :block/title (str "[[" (:block/uuid alpha) "]]")} home)] {})
        (is (= #{(:db/id alpha)} (refs @conn id)))
        (is (empty? (d/datoms @conn :avet :block/title (str (:block/uuid alpha)))))
        (outliner-op/apply-ops!
         conn [[:save-block [{:block/uuid id
                             :block/title (str "[[" (:block/uuid alpha) "]]")
                             :logseq.property.node/display-type :code} {}]]] {})
        (input-helper/apply-ops! conn [[:save-block [{:block/uuid id :block/title "literal [[Alpha]]"} {}]]] {})
        (is (= "literal [[Alpha]]" (title)))
        (is (not (contains? (refs @conn id) (:db/id alpha))))))))

(deftest cli-dry-run-uses-live-parser-without-committing
  (let [conn (db-test/create-conn-with-blocks [{:page {:block/title "Home"}}])
        home (ldb/get-page @conn "Home")
        id (random-uuid)
        plan (input-helper/apply-ops! conn [(insert-op {:block/uuid id :block/title "note #PreviewTag [[PreviewPage]]"} home)]
                                   {:preview? true})]
    (is (= #{"PreviewTag" "PreviewPage"} (set (:would-create-pages plan))))
    (is (nil? (d/entity @conn [:block/uuid id])))))

(deftest cli-page-block-and-missing-uuid-links
  (let [conn (db-test/create-conn-with-blocks [{:page {:block/title "Home"}
                                              :blocks [{:block/title "Target"}]}
                                             {:page {:block/title "Alpha"}}])
        home (ldb/get-page @conn "Home")
        alpha (ldb/get-page @conn "Alpha")
        target (db-test/find-block-by-content @conn "Target")]
    (with-pipeline
      (fn []
        (doseq [[uuid expected] [[(:block/uuid alpha) #{(:db/id alpha)}]
                                [(:block/uuid target) #{(:db/id target)}]
                                [(random-uuid) #{}]]]
          (let [id (random-uuid)
                title (str "Link [[" uuid "]]")]
            (input-helper/apply-ops! conn [(insert-op {:block/uuid id :block/title title} home)] {})
            (is (= expected (refs @conn id)))
            (is (empty? (d/datoms @conn :avet :block/title (str uuid))))
            (input-helper/apply-ops! conn [[:save-block [{:block/uuid id :block/title (str "Updated " title)} {}]]] {})
            (is (= expected (refs @conn id)))
            (is (= (str "Updated " title)
                   (-> (d/datoms @conn :eavt (d/entid @conn [:block/uuid id]) :block/title) first :v)))))))))

(deftest cli-unfinished-brackets-avoid-full-parser-timeout
  (let [conn (db-test/create-conn-with-blocks [{:page {:block/title "Home"}}])
        home (ldb/get-page @conn "Home")
        id (random-uuid)
        title (apply str (repeat 1024 "["))
        start (js/Date.now)]
    (input-helper/apply-ops! conn [(insert-op {:block/uuid id :block/title title} home)] {})
    (is (= title (-> (d/datoms @conn :eavt (d/entid @conn [:block/uuid id]) :block/title) first :v)))
    (is (< (- (js/Date.now) start) 2000))
    (is (empty? (refs @conn id)))))

(deftest cli-preview-rejects-recycled-named-property-values
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:p {:logseq.property/type :node}}
               :pages-and-blocks [{:page {:block/title "Home"}}
                                  {:page {:block/title "Gone"}}]})
        gone (ldb/get-page @conn "Gone")
        home (ldb/get-page @conn "Home")
        id (random-uuid)
        deleted-at (js/Date.now)]
    (d/transact! conn [[:db/add (:db/id gone) :logseq.property/deleted-at deleted-at]])
    (is (thrown? js/Error
                 (input-helper/apply-ops!
                  conn [(insert-op {:block/uuid id :block/title "Preview"} home)
                        [:batch-set-property [[id] :user.property/p [:block/name "gone"] {}]]]
                  {:preview? true})))
    (is (= deleted-at (:logseq.property/deleted-at (d/entity @conn (:db/id gone)))))
    (is (nil? (d/entity @conn [:block/uuid id])))))
