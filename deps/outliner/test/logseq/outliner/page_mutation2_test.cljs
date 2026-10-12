(ns logseq.outliner.page-mutation2-test
  "Second-run mutation survivors in logseq.outliner.page."
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.page :as outliner-page]))

(defn- capture-tx-metas!
  "Collects the tx-meta of every transaction on conn into the returned atom."
  [conn]
  (let [tx-metas (atom [])]
    (d/listen! conn ::capture (fn [tx-report] (swap! tx-metas conj (:tx-meta tx-report))))
    tx-metas))

(defn- thrown-ex-data
  [f]
  (try (f)
       nil
       (catch :default e (ex-data e))))

(deftest delete-page-records-tx-meta-and-recycle-fields
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "D1"}}
               {:page {:block/title "Deleter"}}])
        d1 (ldb/get-page @conn "D1")
        deleter (ldb/get-page @conn "Deleter")
        tx-metas (capture-tx-metas! conn)
        now-ms 1700000000123]
    (is (true? (outliner-page/delete! conn (:block/uuid d1)
                                      {:persist-op? false
                                       :deleted-by-uuid (:block/uuid deleter)
                                       :now-ms now-ms})))
    (let [tx-meta (last @tx-metas)
          d1' (d/entity @conn (:db/id d1))]
      (is (= {:outliner-op :delete-page
              :deleted-page "D1"
              :persist-op? false
              :outliner-ops [[:delete-page [(:block/uuid d1) {:deleted-by-uuid (:block/uuid deleter)
                                                              :now-ms now-ms}]]]}
             (select-keys tx-meta [:outliner-op :deleted-page :persist-op? :outliner-ops])))
      (is (= now-ms (:logseq.property/deleted-at d1'))
          "The recycle tx uses the given :now-ms")
      (is (= (:db/id deleter) (:db/id (:logseq.property/deleted-by-ref d1')))
          "The recycle tx records who deleted the page"))))

(deftest delete-built-in-page-reports-error
  (let [conn (db-test/create-conn)
        library (ldb/get-built-in-page @conn "Library")
        errors (atom [])]
    (is (false? (outliner-page/delete! conn (:block/uuid library)
                                       {:error-handler #(swap! errors conj %)})))
    (is (= [{:msg "Built-in page cannot be deleted"}] @errors))))

(deftest delete-today-journal-page-truncates-it
  (let [today (date-time-util/ms->journal-day (js/Date.))
        conn (db-test/create-conn-with-blocks
              [{:page {:build/journal today}
                :blocks [{:block/title "today block"}]}])
        page-id (d/q '[:find ?e . :in $ ?day :where [?e :block/journal-day ?day]] @conn today)
        page (d/entity @conn page-id)]
    (is (= {:truncated? true} (outliner-page/delete! conn (:block/uuid page))))
    (is (some? (d/entity @conn page-id)) "Today's page itself stays")
    (is (nil? (db-test/find-block-by-content @conn "today block")) "Its content is removed")))

(deftest create-page-with-private-tag-throws-notification
  (let [conn (db-test/create-conn)
        db @conn
        title (:block/title (d/entity db :logseq.class/Whiteboard))
        expected {:type :notification
                  :payload {:message (str "New page can't set built-in tags: " (pr-str title))
                            :i18n-key :page.validation/cant-set-built-in-tags
                            :i18n-args [(pr-str title)]
                            :type :error}}]
    (is (= expected
           (thrown-ex-data #(outliner-page/create db "p" {:tags [:logseq.class/Whiteboard]})))
        "A private tag given as entity")
    (is (= expected
           (thrown-ex-data #(outliner-page/create db "p" {:tags [{:db/ident :logseq.class/Whiteboard}]})))
        "A private tag given as a map naming an existing class")))

(deftest create-page-resolves-tags-to-db-ids
  (let [conn (db-test/create-conn-with-blocks {:classes {:C1 {} :C2 {}}})
        db @conn
        c1 (d/entity db :user.class/C1)
        c2 (d/entity db :user.class/C2)
        page-tags (fn [tags]
                    (vec (:block/tags (first (:tx-data (outliner-page/create db "tagged" {:tags tags}))))))]
    (is (= [:logseq.class/Page (:db/id c1) :logseq.class/Page] (page-tags [:user.class/C1]))
        "keyword")
    (is (= [:logseq.class/Page (:db/id c1) :logseq.class/Page] (page-tags [{:db/ident :user.class/C1}]))
        "map naming an existing class by ident")
    (is (= [:logseq.class/Page (:db/id c1) (:db/id c2) :logseq.class/Page]
           (page-tags [(:block/uuid c1) :user.class/C2]))
        "uuid mixed with another kind of tag")
    (let [tags (page-tags [{:db/ident :user.class/Fresh
                            :block/title "C1"
                            :block/uuid (random-uuid)}])]
      (is (not-any? #{(:db/id c1)} tags)
          "A map with its own ident is not matched to an existing class by title"))))

(deftest sanitize-title-strips-spaces-and-brackets
  (is (= "Foo" (outliner-page/sanitize-title " [[Foo]] "))))

(deftest create-page-title-with-hashtag-throws-with-node
  (let [conn (db-test/create-conn)]
    (is (= {:block/title "a #b"}
           (:node (thrown-ex-data #(outliner-page/create @conn "a #b" {})))))))

(deftest create-page-title-with-slash-throws-with-node
  (let [conn (db-test/create-conn)
        data (thrown-ex-data #(outliner-page/create @conn "a/b" {}))]
    (is (= :page.validation/name-no-slash (get-in data [:payload :i18n-key])))
    (is (= "a/b" (get-in data [:node :block/title])))))

(deftest create-namespace-page-ignores-blank-parts-and-trims
  (let [conn (db-test/create-conn)
        _ (outliner-page/create! conn "foo // bar" {:split-namespace? true})
        library (ldb/get-built-in-page @conn "Library")
        foo (ldb/get-page @conn "foo")
        bar (ldb/get-page @conn "bar")]
    (is (= ["foo"] (map :block/title (:block/_parent library))))
    (is (= ["foo"] (map :block/title [(:block/parent bar)])))
    (is (= ["bar"] (map :block/title (:block/_parent foo))))))

(deftest create-namespace-with-non-page-parent-throws
  (let [conn (db-test/create-conn)
        _ (outliner-page/create! conn "Foo" {:class? true})
        _ (outliner-page/create! conn "Baz" {})]
    (is (= {:type :notification
            :payload {:message "Cannot create this page unless all parents are pages."
                      :i18n-key :page.validation/parents-must-be-pages
                      :type :warning}}
           (thrown-ex-data #(outliner-page/create @conn "Foo/x" {:split-namespace? true}))))
    (is (= {:type :notification
            :payload {:message "Cannot create this tag unless all parents are tags."
                      :i18n-key :class.validation/parents-must-be-tags
                      :type :warning}}
           (thrown-ex-data #(outliner-page/create @conn "Baz/q" {:class? true :split-namespace? true}))))))

(deftest create-class-with-ident-namespace-does-not-reuse-class-of-another-namespace
  (let [conn (db-test/create-conn)
        [_ a-uuid] (outliner-page/create! conn "Thing" {:class? true :class-ident-namespace "ns-a.class"})
        [_ b-uuid] (outliner-page/create! conn "Thing" {:class? true :class-ident-namespace "ns-b.class"})
        [_ a-again] (outliner-page/create! conn "Thing" {:class? true :class-ident-namespace "ns-a.class"})]
    (is (not= a-uuid b-uuid))
    (is (= a-uuid a-again))))

(deftest create-class-tx-data-retracts-the-page-tag
  (let [conn (db-test/create-conn)
        result (outliner-page/create @conn "NewCls" {:class? true})]
    (is (some #(= [:db/retract [:block/uuid (:page-uuid result)] :block/tags :logseq.class/Page] %)
              (:tx-data result)))))

(deftest create-returns-info-of-existing-page
  (let [conn (db-test/create-conn)
        [_ page-uuid] (outliner-page/create! conn "E1" {})]
    (is (= {:page-uuid page-uuid :title "E1"}
           (outliner-page/create @conn "E1" {})))))

(deftest create-new-page-returns-tx-meta-and-title
  (let [conn (db-test/create-conn)
        result (outliner-page/create @conn "N1" {:persist-op? false})]
    (is (= {:persist-op? false
            :outliner-op :create-page
            :outliner-ops [[:create-page ["N1" {:persist-op? false}]]]}
           (:tx-meta result)))
    (is (= "N1" (:title result)))
    (is (uuid? (:page-uuid result)))
    (is (seq (:tx-data result)))))

(deftest create-page-restores-recycled-page
  (let [conn (db-test/create-conn-with-blocks [{:page {:block/title "R1"}}])
        r1 (ldb/get-page @conn "R1")]
    (outliner-page/delete! conn (:block/uuid r1))
    (let [result (outliner-page/create @conn "R1" {:persist-op? false})]
      (is (= {:persist-op? false
              :outliner-op :create-page
              :outliner-ops [[:create-page ["R1" {:persist-op? false
                                                  :uuid (:block/uuid r1)}]]]}
             (:tx-meta result)))
      (is (= (:block/uuid r1) (:page-uuid result)))
      (is (= "R1" (:title result)))
      (is (seq (:tx-data result))))))

(deftest delete-page-rewrites-its-refs-outside-the-page
  ;; :block/raw-title is a virtual attribute of the app's entities (their
  ;; stored :block/title); nbb entities only have it when it is stored
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "Target"}
                                   :blocks [{:block/title "a"
                                             :build/children [{:block/title "nested"}]}]}
                                  {:page {:block/title "Other"}
                                   :blocks [{:block/title "c"}]}
                                  {:page {:block/title "Q"}}]})
        target (ldb/get-page @conn "Target")
        q (ldb/get-page @conn "Q")
        nested-id (:db/id (db-test/find-block-by-content @conn "nested"))
        c (db-test/find-block-by-content @conn "c")
        ref-title (fn [& pages] (str "see " (string/join " " (map #(str "[[" (:block/uuid %) "]]") pages))))
        nested-title (ref-title target)
        c-title (ref-title target q)
        _ (d/transact! conn [{:db/id nested-id :block/title nested-title :block/raw-title nested-title
                              :block/refs [(:db/id target)]}
                             {:db/id (:db/id c) :block/title c-title :block/raw-title c-title
                              :block/refs [(:db/id target) (:db/id q)]}])
        tx-metas (capture-tx-metas! conn)
        c-title' (str "see Target [[" (:block/uuid q) "]]")]
    (is (true? (outliner-page/delete! conn (:block/uuid target) {})))
    (testing "a block of another page"
      (let [c' (d/entity @conn (:db/id c))]
        (is (= c-title' (:block/title c')))
        (is (= #{(:db/id q)} (set (map :db/id (:block/refs c')))))
        (is (= [[(:block/uuid c) c-title' [(:db/id q)]]]
               (->> (:outliner-ops (last @tx-metas))
                    (filter #(= :save-block (first %)))
                    (map (fn [[_ [block _]]]
                           [(:block/uuid block) (:block/title block) (mapv :db/id (:block/refs block))])))))))
    (testing "a nested block of the deleted page keeps its title"
      (is (= nested-title (:block/title (d/entity @conn nested-id)))))))

(deftest create-page-keeps-a-built-in-property-without-ref-value
  (let [conn (db-test/create-conn)
        [_ page-uuid] (outliner-page/create! conn "P1" {:properties {:logseq.property/exclude-from-graph-view true}})]
    (is (true? (:logseq.property/exclude-from-graph-view (d/entity @conn [:block/uuid page-uuid]))))))

(deftest create-page-tagged-with-the-tag-class-by-db-id-creates-a-class
  (let [conn (db-test/create-conn)
        tag-id (:db/id (d/entity @conn :logseq.class/Tag))
        [_ page-uuid] (outliner-page/create! conn "T1" {:tags [tag-id]})
        page (d/entity @conn [:block/uuid page-uuid])]
    (is (ldb/class? page))
    (is (some? (:db/ident page)))
    (is (not (ldb/internal-page? page)))))

(deftest create-journal-in-a-slash-format-unknown-to-the-built-in-formats
  (let [conn (db-test/create-conn)
        _ (d/transact! conn [[:db/add :logseq.class/Journal :logseq.property.journal/title-format "dd/MM/yyyy"]])
        result (try (outliner-page/create! conn "25/12/2026" {}) (catch :default e e))]
    (is (vector? result) (str "create! threw: " (ex-message result)))
    (is (= 20261225 (some->> (second result) (vector :block/uuid) (d/entity @conn) :block/journal-day)))))

(deftest create-namespace-page-finds-an-existing-root-around-spaces
  (let [conn (db-test/create-conn)
        [_ foo-uuid] (outliner-page/create! conn "Foo" {})
        [_ bar-uuid] (outliner-page/create! conn "Foo / Bar" {:split-namespace? true})]
    (is (= foo-uuid (:block/uuid (:block/parent (d/entity @conn [:block/uuid bar-uuid])))))
    (is (= 1 (count (d/datoms @conn :avet :block/name "foo"))))))

(deftest create-slash-formatted-journal-by-title-does-not-split-namespace
  (let [conn (db-test/create-conn)
        _ (d/transact! conn [[:db/add :logseq.class/Journal :logseq.property.journal/title-format "yyyy/MM/dd"]])
        [_ page-uuid] (outliner-page/create! conn "2026/05/18" {:split-namespace? true})
        page (d/entity @conn [:block/uuid page-uuid])]
    (testing "a title that is already in the journal format"
      (is (= "2026/05/18" (:block/title page)))
      (is (nil? (ldb/get-page @conn "2026")))
      (is (nil? (ldb/get-page @conn "05"))))))
