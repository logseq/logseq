(ns logseq.outliner.op-test
  (:require [clojure.string :as string]
            [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.op :as outliner-op]
            [logseq.outliner.property :as outliner-property]))

(deftest insert-blocks-preserves-existing-reference-ids
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "Test"}
                :blocks [{:block/title "Target"} {:block/title "Referenced"}]}])
        target (db-test/find-block-by-content @conn "Target")
        referenced (db-test/find-block-by-content @conn "Referenced")
        uuid' (random-uuid)]
    (outliner-core/insert-blocks!
     conn [{:block/uuid uuid'
            :block/title (page-ref/->page-ref (:block/uuid referenced))
            :block/refs [(:db/id referenced)]}]
     target {:sibling? true :keep-uuid? true})
    (is (= #{(:block/uuid referenced)}
           (set (map :block/uuid (:block/refs (d/entity @conn [:block/uuid uuid']))))))))

(deftest toggle-reaction-op
  (testing "toggles reactions via outliner ops"
    (let [user-uuid (random-uuid)
          conn (db-test/create-conn-with-blocks
                [{:page {:block/title "Test"}
                  :blocks [{:block/title "Block"}]}])
          now 1234]
      (ldb/transact! conn
                     [{:block/uuid user-uuid
                       :block/name "user"
                       :block/title "user"
                       :block/created-at now
                       :block/updated-at now
                       :block/tags #{:logseq.class/Page}}]
                     {})
      (let [block (db-test/find-block-by-content @conn "Block")
            target-uuid (:block/uuid block)]
        (outliner-op/apply-ops! conn
                                [[:toggle-reaction [target-uuid "+1" user-uuid]]]
                                {})
        (let [block-entity (d/entity @conn [:block/uuid target-uuid])
              reactions (:logseq.property.reaction/_target block-entity)
              reaction (first reactions)]
          (is (= 1 (count reactions)))
          (is (uuid? (:block/uuid reaction)))
          (is (= "+1" (:logseq.property.reaction/emoji-id reaction)))
          (is (= (:db/id (d/entity @conn [:block/uuid user-uuid]))
                 (:db/id (:logseq.property/created-by-ref reaction)))))
        (outliner-op/apply-ops! conn
                                [[:toggle-reaction [target-uuid "+1" user-uuid]]]
                                {})
        (let [block-entity (d/entity @conn [:block/uuid target-uuid])]
          (is (empty? (:logseq.property.reaction/_target block-entity))))))))

(deftest collapse-expand-blocks-op
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "Test"}
                :blocks [{:block/title "Parent"}]}])
        block (db-test/find-block-by-content @conn "Parent")
        block-id (:block/uuid block)]
    (outliner-op/apply-ops!
     conn
     [[:collapse-expand-blocks [[{:block/uuid block-id
                                  :block/collapsed? true}]
                                {}]]]
     {})
    (is (true? (:block/collapsed? (d/entity @conn [:block/uuid block-id]))))
    (outliner-op/apply-ops!
     conn
     [[:collapse-expand-blocks [[{:block/uuid block-id
                                  :block/collapsed? false}]
                                {}]]]
     {})
    (is (false? (:block/collapsed? (d/entity @conn [:block/uuid block-id]))))))

(deftest resolve-indent-outdent-parent-original-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "Test"}
                :blocks [{:block/title "Original"}]}])
        original (db-test/find-block-by-content @conn "Original")
        opts (#'outliner-op/resolve-indent-outdent-opts
              @conn
              {:parent-original {:block/uuid (:block/uuid original)}})]
    (is (= (:db/id original) (get-in opts [:parent-original :db/id])))))

(deftest apply-ops-plugin-property-sequence-test
  (testing "plugin property ops remain visible after a single apply-ops! batch"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "Test"}
                  :blocks [{:block/title "Block"}]}])
          block (db-test/find-block-by-content @conn "Block")
          block-uuid (:block/uuid block)]
      (outliner-op/apply-ops!
       conn
       [[:upsert-property [:plugin.property._test_plugin/x1 {:logseq.property/type :checkbox
                                                             :db/cardinality :db.cardinality/one}
                           {:property-name :x1}]]
        [:set-block-property [block-uuid :plugin.property._test_plugin/x1 true]]
        [:upsert-property [:plugin.property._test_plugin/x2 {:logseq.property/type :url
                                                             :db/cardinality :db.cardinality/one}
                           {:property-name :x2}]]
        [:set-block-property [block-uuid :plugin.property._test_plugin/x2 "https://logseq.com"]]
        [:upsert-property [:plugin.property._test_plugin/x3 {:logseq.property/type :number
                                                             :db/cardinality :db.cardinality/one}
                           {:property-name :x3}]]
        [:set-block-property [block-uuid :plugin.property._test_plugin/x3 1]]
        [:upsert-property [:plugin.property._test_plugin/x4 {:logseq.property/type :number
                                                             :db/cardinality :db.cardinality/many}
                           {:property-name :x4}]]
        [:set-block-property [block-uuid :plugin.property._test_plugin/x4 1]]
        [:upsert-property [:plugin.property._test_plugin/x5 {:logseq.property/type :json
                                                             :db/cardinality :db.cardinality/one}
                           {:property-name :x5}]]
        [:set-block-property [block-uuid :plugin.property._test_plugin/x5 "{\"foo\":\"bar\"}"]]
        [:upsert-property [:plugin.property._test_plugin/x6 {:logseq.property/type :page
                                                             :db/cardinality :db.cardinality/one}
                           {:property-name :x6}]]
        [:set-block-property [block-uuid :plugin.property._test_plugin/x6 "Page x"]]
        [:upsert-property [:plugin.property._test_plugin/x7 {:logseq.property/type :page
                                                             :db/cardinality :db.cardinality/many}
                           {:property-name :x7}]]
        [:set-block-property [block-uuid :plugin.property._test_plugin/x7 "Page y"]]
        [:set-block-property [block-uuid :plugin.property._test_plugin/x7 "Page z"]]
        [:upsert-property [:plugin.property._test_plugin/x8 {:logseq.property/type :default
                                                             :db/cardinality :db.cardinality/one}
                           {:property-name :x8}]]
        [:set-block-property [block-uuid :plugin.property._test_plugin/x8 "some content"]]]
       {})
      (let [block' (d/entity @conn [:block/uuid block-uuid])]
        (is (true? (:plugin.property._test_plugin/x1 block')))
        (is (= "https://logseq.com"
               (:block/title (:plugin.property._test_plugin/x2 block'))))
        (is (= 1
               (:logseq.property/value (:plugin.property._test_plugin/x3 block'))))
        (is (= #{1}
               (set (map :logseq.property/value (:plugin.property._test_plugin/x4 block')))))
        (is (= "{\"foo\":\"bar\"}" (:plugin.property._test_plugin/x5 block')))
        (is (= "page x"
               (:block/name (:plugin.property._test_plugin/x6 block'))))
        (is (= #{"page y" "page z"}
               (set (map :block/name (:plugin.property._test_plugin/x7 block')))))
        (is (= "some content"
               (:block/title (:plugin.property._test_plugin/x8 block'))))))))

(deftest remove-block-property-op-rejects-lookup-ref-block-id-test
  (testing "remove-block-property rejects lookup-ref block ids"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "Test"}
                  :blocks [{:block/title "Block"}]}])
          block (db-test/find-block-by-content @conn "Block")
          block-uuid (:block/uuid block)]
      (outliner-property/set-block-property! conn
                                             [:block/uuid block-uuid]
                                             :logseq.property/order-list-type
                                             "number")
      (is (some? (:logseq.property/order-list-type
                  (d/entity @conn [:block/uuid block-uuid]))))
      (is (thrown? js/Error
                   (outliner-op/apply-ops!
                    conn
                    [[:remove-block-property [[:block/uuid block-uuid]
                                              :logseq.property/order-list-type]]]
                    {}))))))

(deftest direct-plugin-many-page-property-appends-values-test
  (testing "direct property operations keep both page values"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "Test"}
                  :blocks [{:block/title "Block"}]}])
          block (db-test/find-block-by-content @conn "Block")
          block-id (:db/id block)
          property-id :plugin.property._test_plugin/x7]
      (outliner-property/upsert-property! conn property-id
                                          {:logseq.property/type :page
                                           :db/cardinality :db.cardinality/many}
                                          {:property-name :x7})
      (outliner-property/set-block-property! conn block-id property-id "Page y")
      (outliner-property/set-block-property! conn block-id property-id "Page z")
      (is (= #{"page y" "page z"}
             (set (map :block/name
                       (:plugin.property._test_plugin/x7 (d/entity @conn block-id)))))))))

(deftest apply-template-op-resolves-dynamic-variables-test
  (testing "apply-template resolves dynamic variables in block title and property values"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "Target Page"}
                   :blocks [{:block/title "target block"}]}
                  {:page {:block/title "Templates"}
                   :blocks [{:block/title "template root"
                             :build/children [{:block/title "page is <% current page %>"}
                                              {:block/title "time block"
                                               :build/properties {:log-time "<%time%>"}}]}]}]
                 :properties {:log-time {:logseq.property/type :default}}})
          target-page (ldb/get-page @conn "Target Page")
          template-root (db-test/find-block-by-content @conn "template root")
          target-block (db-test/find-block-by-content @conn "target block")
          template-blocks (->> (ldb/get-block-and-children @conn (:block/uuid template-root)
                                                           {:include-property-block? true})
                               rest)
          blocks-to-insert (cons (assoc (into {} (first template-blocks))
                                        :db/id (:db/id (first template-blocks))
                                        :logseq.property/used-template (:db/id template-root))
                                 (map (fn [block]
                                        (assoc (into {} block) :db/id (:db/id block)))
                                      (rest template-blocks)))
          _ (outliner-op/apply-ops! conn
                                    [[:apply-template [(:block/uuid template-root)
                                                       (:block/uuid target-block)
                                                       {:template-blocks blocks-to-insert}]]]
                                    {})
          page-var-block (db-test/find-block-by-content
                          @conn
                          (str "page is " (page-ref/->page-ref (:block/uuid target-page))))
          time-block (some->> (d/q '[:find [?b ...]
                                     :in $ ?title ?page-title
                                     :where
                                     [?b :block/title ?title]
                                     [?b :block/page ?page]
                                     [?page :block/title ?page-title]]
                                   @conn "time block" "Target Page")
                             first
                             (d/entity @conn))
          time-value (some (fn [[property-id value]]
                             (when (= "log-time" (name property-id))
                               value))
                           (db-test/readable-properties time-block))]
      (is (some? page-var-block))
      (is (string? time-value))
      (is (not (string/blank? time-value)))
      (is (not (string/includes? time-value "<%"))))))

(deftest apply-ops-requires-uuid-block-ids-and-keyword-property-ids-test
  (testing "ops reject integer eids and accept UUID/keyword identifiers"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "Test"}
                  :blocks [{:block/title "Block"}]}])
          block (db-test/find-block-by-content @conn "Block")
          block-id (:db/id block)
          block-uuid (:block/uuid block)
          property-kw :plugin.property._test_plugin/normalized-prop]
      (outliner-property/upsert-property! conn property-kw
                                          {:logseq.property/type :checkbox
                                           :db/cardinality :db.cardinality/one}
                                          {:property-name :normalized-prop})
      (let [property-id (:db/id (d/entity @conn property-kw))]
        (outliner-op/apply-ops!
         conn
         [[:set-block-property [block-uuid property-kw true]]]
         {})
        (is (true? (property-kw (d/entity @conn [:block/uuid block-uuid]))))
        (is (thrown? js/Error
                     (outliner-op/apply-ops!
                      conn
                      [[:set-block-property [block-id property-kw true]]]
                      {})))
        (is (thrown? js/Error
                     (outliner-op/apply-ops!
                      conn
                      [[:set-block-property [block-uuid property-id true]]]
                      {})))))))

(defn- apply-ops-recording!
  "Applies `ops` and returns the outliner ops the committed transactions record."
  [conn ops opts]
  (let [recorded (atom [])]
    (d/listen! conn ::recorded-ops
               (fn [{:keys [tx-meta]}]
                 (swap! recorded into (:outliner-ops tx-meta))))
    (try
      (outliner-op/apply-ops! conn ops opts)
      @recorded
      (finally
        (d/unlisten! conn ::recorded-ops)))))

(defn- block-uuid-by-content
  [db content]
  (:block/uuid (db-test/find-block-by-content db content)))

(deftest selection-delete-keeps-top-level-blocks-in-selection-order-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "Test"}
                :blocks [{:block/title "a"
                          :build/children [{:block/title "a1"
                                            :build/children [{:block/title "a11"}]}]}
                         {:block/title "b"}
                         {:block/title "c"}]}])
        [a a1 a11 b] (map #(block-uuid-by-content @conn %) ["a" "a1" "a11" "b"])
        ;; a1 follows its parent a; a11 comes before its parent a1, but its
        ;; ancestors a1 and a are selected, so it goes with them as the
        ;; window's get-top-level-blocks drops it
        recorded (apply-ops-recording! conn
                                       [[:delete-blocks [[a11 a a1 b] {:selection {}}]]]
                                       {:outliner-op :delete-blocks})]
    (is (= [[:delete-blocks [[a b] {}]]] recorded)
        "The worker records the op the window used to send after its read")
    (is (every? nil? (map #(d/entity @conn [:block/uuid %]) [a a1 a11 b])))
    (is (some? (db-test/find-block-by-content @conn "c")))))

(deftest selection-delete-drops-a-block-under-a-selected-ancestor-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "Test"}
                :blocks [{:block/title "a"
                          :build/children [{:block/title "a1"
                                            :build/children [{:block/title "a11"}]}]}
                         {:block/title "b"}]}])
        [a a1 a11 b] (map #(block-uuid-by-content @conn %) ["a" "a1" "a11" "b"])
        ;; a11's parent a1 is not selected, its grandparent a is: the delete
        ;; of a covers it, as in the window since #13482
        recorded (apply-ops-recording! conn
                                       [[:delete-blocks [[a11 a] {:selection {}}]]]
                                       {:outliner-op :delete-blocks})]
    (is (= [[:delete-blocks [[a] {}]]] recorded))
    (is (every? nil? (map #(d/entity @conn [:block/uuid %]) [a a1 a11])))
    (is (some? (d/entity @conn [:block/uuid b])))))

(deftest selection-delete-skips-a-selection-of-recycle-roots-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "Test"}
                :blocks [{:block/title "recycled"
                          :build/children [{:block/title "inside"}]}
                         {:block/title "live"}]}])
        recycled (db-test/find-block-by-content @conn "recycled")
        [inside live] (map #(block-uuid-by-content @conn %) ["inside" "live"])]
    (d/transact! conn [{:db/id (:db/id recycled)
                        :logseq.property/deleted-at 1}])
    (testing "every top-level block is a recycle root: no op, no change"
      (is (= [] (apply-ops-recording! conn
                                      [[:delete-blocks [[(:block/uuid recycled)] {:selection {}}]]]
                                      {:outliner-op :delete-blocks})))
      (is (some? (d/entity @conn [:block/uuid (:block/uuid recycled)]))))
    (testing "a block under a recycle root is not a root itself, as in the window's check"
      (apply-ops-recording! conn
                            [[:delete-blocks [[inside] {:selection {}}]]]
                            {:outliner-op :delete-blocks})
      (is (nil? (d/entity @conn [:block/uuid inside]))))
    (testing "a recycle root beside a live block is deleted with it"
      (apply-ops-recording! conn
                            [[:delete-blocks [[(:block/uuid recycled) live] {:selection {}}]]]
                            {:outliner-op :delete-blocks})
      (is (nil? (d/entity @conn [:block/uuid (:block/uuid recycled)])))
      (is (nil? (d/entity @conn [:block/uuid live]))))))

(deftest selection-delete-deletes-the-linking-block-of-a-rendered-link-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "Test"}
                :blocks [{:block/title "target"}
                         {:block/title "linking"}]}])
        target (db-test/find-block-by-content @conn "target")
        linking (db-test/find-block-by-content @conn "linking")]
    (d/transact! conn [{:db/id (:db/id linking) :block/link (:db/id target)}])
    (is (= [[:delete-blocks [[(:block/uuid linking)] {}]]]
           (apply-ops-recording! conn
                                 [[:delete-blocks [[(:block/uuid target)]
                                                   {:selection {:original-ids {(:block/uuid target)
                                                                               (:block/uuid linking)}}}]]]
                                 {:outliner-op :delete-blocks})))
    (is (nil? (d/entity @conn [:block/uuid (:block/uuid linking)])))
    (is (some? (d/entity @conn [:block/uuid (:block/uuid target)]))
        "The row renders the target for the linking block; the target stays")))

(deftest selection-delete-deletes-journal-pages-as-pages-on-request-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:build/journal 20260101}
                :blocks [{:block/title "journal content"}]}
               {:page {:block/title "Test"}
                :blocks [{:block/title "block"}]}])
        journal (db-test/find-journal-by-journal-day @conn 20260101)
        block (block-uuid-by-content @conn "block")
        user-opts {:deleted-by-uuid (random-uuid)}]
    (is (= [[:delete-blocks [[block] user-opts]]
            [:delete-page [(:block/uuid journal) user-opts]]]
           (apply-ops-recording! conn
                                 [[:delete-blocks [[(:block/uuid journal) block]
                                                   (assoc user-opts :selection {:delete-journals? true})]]]
                                 {:outliner-op :delete-blocks})))
    (is (nil? (d/entity @conn [:block/uuid block])))
    (is (some? (:logseq.property/deleted-at (d/entity @conn [:block/uuid (:block/uuid journal)])))
        "The journal page goes to the recycle bin, as a page delete does")))
