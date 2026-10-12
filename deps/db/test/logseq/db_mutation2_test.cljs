(ns logseq.db-mutation2-test
  "Second-run mutation survivors in logseq.db."
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [datascript.storage :as ds-storage :refer [IStorage]]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]))

(defrecord InMemoryStorage [*disk]
  IStorage
  (-store [_ addr+data-seq _delete-addrs]
    (doseq [[addr data] addr+data-seq]
      (vswap! *disk assoc addr data)))
  (-restore [_ addr]
    (get @*disk addr)))

(defn- title->entity
  [db title]
  (d/entity db (d/q '[:find ?b .
                      :in $ ?title
                      :where [?b :block/title ?title]]
                    db title)))

(defn- titles
  [entities]
  (mapv :block/title entities))

(defn- tree-conn
  "A page with three ordinary children and one nested grandchild."
  []
  (let [conn (db-test/create-conn)]
    (d/transact! conn
                 [{:db/id -1 :block/title "page" :block/name "page" :block/uuid (random-uuid)}
                  {:db/id -2 :block/title "first" :block/parent -1 :block/page -1 :block/order "a0" :block/uuid (random-uuid)}
                  {:db/id -3 :block/title "second" :block/parent -1 :block/page -1 :block/order "a1" :block/uuid (random-uuid)}
                  {:db/id -4 :block/title "third" :block/parent -1 :block/page -1 :block/order "a2" :block/uuid (random-uuid)}
                  {:db/id -5 :block/title "grandchild" :block/parent -3 :block/page -1 :block/order "a0" :block/uuid (random-uuid)}])
    conn))

;; transact! / batch plumbing

(deftest invalid-tx-calls-the-invalid-callback-and-reports-error-data
  (let [conn (db-test/create-conn)
        callback-args (atom nil)
        original-callback @ldb/*transact-invalid-callback
        error (atom nil)]
    (try
      (ldb/register-transact-invalid-callback-fn! (fn [tx-report errors] (reset! callback-args [tx-report errors])))
      (try
        (db-test/silence-stderr
         (ldb/transact! conn
                        [{:db/ident :logseq.class/Task
                          :block/tags :logseq.class/Property}]
                        {:test-meta true}))
        (catch :default e
          (reset! error e)))
      (finally
        (reset! ldb/*transact-invalid-callback original-callback)))
    (is (some? @error) "The invalid write is refused")
    (let [data (ex-data @error)]
      (is (= {:test-meta true} (:tx-meta data)))
      (is (= 1 (:tx-count data)))
      (is (pos? (:pipeline-tx-count data)))
      (is (pos? (:error-count data)))
      (is (= (:error-count data) (count (:errors data))))
      (is (= (:errors data) (second @callback-args))
          "The callback gets the report and the errors")
      (is (some? (:tx-data (first @callback-args)))))))

(deftest batch-transact-cleans-up-after-itself
  (let [conn (db-test/create-conn)
        listened (atom 0)
        run-batch! (fn []
                     (ldb/batch-transact!
                      conn {}
                      (fn [c] (d/transact! c [{:block/uuid (random-uuid) :block/title "x"}]))
                      {:listen-db (fn [_] (swap! listened inc))}))]
    (run-batch!)
    (is (= 1 @listened))
    (is (nil? (:batch-tx? @conn)) "The batch flag is cleared")
    (is (nil? (:skip-store? @conn)) "The skip-store flag is cleared")
    (d/transact! conn [{:block/uuid (random-uuid) :block/title "y"}])
    (is (= 1 @listened) "The batch listener is removed")
    (run-batch!)
    (is (= 2 @listened) "A finished batch can be followed by another")))

(deftest nested-batch-transact-reports-the-tx-meta
  (let [conn (db-test/create-conn)
        error (atom nil)]
    (try
      (db-test/silence-stderr
       (ldb/batch-transact!
        conn {:outer true}
        (fn [c]
          (ldb/batch-transact! c {:inner true} (fn [_] nil)))))
      (catch :default e
        (reset! error e)))
    (is (= "batch-transact! can't be nested called" (ex-message @error)))
    (is (= {:tx-meta {:inner true}} (ex-data @error)))))

(deftest temp-conn-from-storage-backed-db-starts-with-clean-tail-bookkeeping
  (let [storage (->InMemoryStorage (volatile! {}))
        conn (d/create-conn {:block/uuid {:db/unique :db.unique/identity}} {:storage storage})
        _ (d/transact! conn [[:db/add 1 :filler "x"]])
        temp-conn (ldb/temp-conn-from-db @conn)
        state @(:atom temp-conn)]
    (is (= [] (:tx-tail state)))
    (is (some? (:db-last-stored state)))
    (is (= @conn (:db-last-stored state)))))

;; page / block navigation

(deftest get-page-blocks-count-counts-blocks-of-a-page
  (let [conn (tree-conn)
        page (title->entity @conn "page")]
    (is (= 4 (ldb/get-page-blocks-count @conn (:db/id page))))
    (is (= 0 (ldb/get-page-blocks-count @conn (:db/id (title->entity @conn "first")))))))

(deftest block-children-or-property-children-lists-the-parent-children-of-an-ordinary-block
  (let [conn (tree-conn)
        children-fn #'ldb/get-block-children-or-property-children
        page (title->entity @conn "page")]
    (is (= ["first" "second" "third"]
           (titles (children-fn (title->entity @conn "first") page))))))

(deftest get-down-returns-the-first-child
  (let [conn (tree-conn)]
    (is (= "first" (:block/title (ldb/get-down (title->entity @conn "page")))))
    (is (= "grandchild" (:block/title (ldb/get-down (title->entity @conn "second")))))
    (is (nil? (ldb/get-down (title->entity @conn "third"))))))

(deftest get-pages-lists-visible-page-titles
  (let [conn (db-test/create-conn)]
    (d/transact! conn [{:block/uuid (random-uuid) :block/title "visible" :block/name "visible"}
                       {:block/uuid (random-uuid) :block/title "$$$hidden" :block/name "$$$hidden"}
                       {:block/uuid (random-uuid) :block/title "just a block" :block/order "a0"}])
    (let [pages (ldb/get-pages @conn)]
      (is (every? string? pages) "Pages are titles")
      (is (some #{"visible"} pages))
      (is (not (some #{"$$$hidden"} pages)) "Hidden pages are left out")
      (is (not (some #{"just a block"} pages)) "Only pages are listed"))))

(deftest page-empty-and-first-child-follow-the-page-children
  (let [conn (tree-conn)
        page (title->entity @conn "page")
        leaf (title->entity @conn "first")]
    (is (false? (ldb/page-empty? @conn (:db/id page))))
    (is (true? (ldb/page-empty? @conn (:db/id leaf))))
    (is (= "first" (:block/title (ldb/get-first-child @conn (:db/id page)))))
    (is (nil? (ldb/get-first-child @conn (:db/id leaf))))))

(deftest get-orphaned-pages-finds-unreferenced-pages-without-content
  (let [conn (db-test/create-conn)
        page-tx (fn [id title & [blocks]]
                  (into [{:db/id id :block/title title :block/name title :block/uuid (random-uuid)}]
                        (map-indexed (fn [i [bid btitle parent]]
                                       {:db/id bid :block/title btitle :block/parent (or parent id)
                                        :block/page id :block/order (str "a" i) :block/uuid (random-uuid)})
                                     blocks)))]
    (d/transact! conn
                 (concat (page-tx -1 "empty page")
                         (page-tx -2 "blank page" [[-20 "-"]])
                         (page-tx -3 "nested blank page" [[-30 "-"] [-31 "child" -30]])
                         (page-tx -4 "content page" [[-40 "content"]])
                         (page-tx -5 "referenced empty page")
                         (page-tx -6 "hidden page")))
    (let [referenced (title->entity @conn "referenced empty page")
          content (title->entity @conn "content")
          hidden (title->entity @conn "hidden page")]
      (d/transact! conn [[:db/add (:db/id content) :block/refs (:db/id referenced)]
                         [:db/add (:db/id hidden) :logseq.property/hide? true]]))
    (let [all-titles ["empty page" "blank page" "nested blank page" "content page"
                      "referenced empty page" "hidden page"]
          orphans (ldb/get-orphaned-pages @conn {:pages (concat [nil "missing page"] all-titles)})]
      (is (= #{"empty page" "blank page"} (set (titles orphans))))
      (is (= 2 (count orphans)) "Missing pages and nils are dropped"))))

(deftest has-children-and-last-direct-child-and-get-children
  (let [conn (tree-conn)
        page (title->entity @conn "page")
        second' (title->entity @conn "second")
        leaf (title->entity @conn "third")]
    (is (true? (ldb/has-children? @conn (:db/id page))))
    (is (true? (ldb/has-children? @conn (:block/uuid second'))))
    (is (false? (ldb/has-children? @conn (:db/id leaf))))
    (is (= (:db/id leaf) (ldb/get-block-last-direct-child-id @conn (:db/id page))))
    (is (nil? (ldb/get-block-last-direct-child-id @conn (:db/id leaf))))
    (is (= ["first" "second" "third"] (titles (ldb/get-children page))))
    (is (= ["first" "second" "third"] (titles (ldb/get-children @conn (:db/id page)))))
    (is (= ["first" "second" "third"] (titles (ldb/get-children @conn (:block/uuid page)))))
    (is (= ["grandchild"] (titles (ldb/get-children @conn second'))))))

(deftest sort-page-random-blocks-skips-closed-values-and-repeats
  (let [conn (tree-conn)
        db @conn
        [first' second' third'] (map #(title->entity db %) ["first" "second" "third"])
        grandchild (title->entity db "grandchild")]
    (is (= ["first" "second" "grandchild" "third"]
           (titles (ldb/sort-page-random-blocks db [third' grandchild first' second'])))
        "Blocks come back in page order")
    (is (= ["first" "third"]
           (titles (ldb/sort-page-random-blocks db [third' first' third' first'])))
        "A block given twice is returned once")
    (d/transact! conn [[:db/add (:db/id second') :block/closed-value-property (:db/id (title->entity db "page"))]])
    (is (= ["first" "third"]
           (titles (ldb/sort-page-random-blocks @conn [(title->entity @conn "third")
                                                       (title->entity @conn "second")
                                                       (title->entity @conn "first")])))
        "A closed value is not part of the page order")))

(deftest new-block-id-generates-fresh-uuids
  (let [id-1 (ldb/new-block-id)
        id-2 (ldb/new-block-id)]
    (is (uuid? id-1))
    (is (not= id-1 id-2))))

(deftest page-alias-set-includes-the-page-and-its-aliases
  (let [conn (db-test/create-conn)]
    (d/transact! conn [{:db/id -1 :block/title "page" :block/name "page" :block/uuid (random-uuid) :block/alias [-2 -3]}
                       {:db/id -2 :block/title "alias a" :block/name "alias a" :block/uuid (random-uuid)}
                       {:db/id -3 :block/title "alias b" :block/name "alias b" :block/uuid (random-uuid)}])
    (let [page (title->entity @conn "page")
          alias-ids (set (map :db/id (:block/alias page)))
          result (ldb/page-alias-set @conn (:db/id page))]
      (is (set? result))
      (is (= 2 (count alias-ids)))
      (is (= (conj alias-ids (:db/id page)) result)))))

(deftest get-all-pages-leaves-out-internal-tags
  (let [conn (db-test/create-conn)
        pages (ldb/get-all-pages @conn)
        idents (set (keep :db/ident pages))]
    (is (seq pages))
    (is (not (contains? idents :logseq.class/Tag)))
    (is (not (contains? idents :logseq.class/Property)))
    (is (not (contains? idents :logseq.class/Page)))))

(deftest graph-schema-versions-read-their-own-key-values
  (let [conn (db-test/create-conn)]
    (d/transact! conn [{:db/ident :logseq.kv/schema-version :kv/value {:major 5 :minor 1}}
                       {:db/ident :logseq.kv/remote-schema-version :kv/value {:major 7 :minor 2}}])
    (is (= {:major 5 :minor 1} (ldb/get-graph-schema-version @conn)))
    (is (= {:major 7 :minor 2} (ldb/get-graph-remote-schema-version @conn)))
    (is (nil? (ldb/get-graph-schema-version nil)))
    (is (nil? (ldb/get-graph-remote-schema-version nil)))))

;; bidirectional properties

(defn- bidirectional-conn
  "People (bidirectional) point at Bob through :friend. `created-ats` are the
  :block/created-at of the people, in listing order."
  [created-ats]
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:friend {:logseq.property/type :node
                                     :build/property-classes [:Person]}}
               :classes {:Person {:build/properties {:logseq.property.class/enable-bidirectional? true}}}
               :pages-and-blocks
               (into [{:page {:block/title "Bob"}}]
                     (map-indexed (fn [i _]
                                    {:page {:block/title (str "Person " i)
                                            :build/tags [:Person]
                                            :build/properties {:friend [:build/page {:block/title "Bob"}]}}})
                                  created-ats))})]
    (d/transact! conn (map-indexed (fn [i created-at]
                                     {:db/id (:db/id (db-test/find-page-by-title @conn (str "Person " i)))
                                      :block/created-at created-at})
                                   created-ats))
    conn))

(deftest bidirectional-group-carries-the-class-id-and-sorted-entities
  (let [conn (bidirectional-conn [30 10 50 20 40])
        target (db-test/find-page-by-title @conn "Bob")
        [group :as groups] (ldb/get-bidirectional-properties @conn (:db/id target))]
    (is (= 1 (count groups)))
    (is (= (:db/id (d/entity @conn :user.class/Person))
           (-> group :class :db/id))
        "The group's class map carries the class :db/id")
    (is (= ["Person 1" "Person 3" "Person 0" "Person 4" "Person 2"]
           (titles (:entities group)))
        "Entities are sorted by :block/created-at")))

(deftest bidirectional-groups-are-sorted-by-class-creation
  (doseq [[person-created company-created] [[1 2] [2 1]]]
    (let [conn (db-test/create-conn-with-blocks
                {:properties {:friend {:logseq.property/type :node
                                       :build/property-classes [:Person :Company]}}
                 :classes {:Person {:build/properties {:logseq.property.class/enable-bidirectional? true}}
                           :Company {:build/properties {:logseq.property.class/enable-bidirectional? true}}}
                 :pages-and-blocks
                 [{:page {:block/title "Bob"}}
                  {:page {:block/title "Alice"
                          :build/tags [:Person]
                          :build/properties {:friend [:build/page {:block/title "Bob"}]}}}
                  {:page {:block/title "Acme"
                          :build/tags [:Company]
                          :build/properties {:friend [:build/page {:block/title "Bob"}]}}}]})
          class-id (fn [ident] (:db/id (d/entity @conn ident)))]
      (d/transact! conn [{:db/id (class-id :user.class/Person) :block/created-at person-created}
                         {:db/id (class-id :user.class/Company) :block/created-at company-created}])
      (let [groups (ldb/get-bidirectional-properties @conn (:db/id (db-test/find-page-by-title @conn "Bob")))]
        (is (= (if (< person-created company-created) ["People" "Companies"] ["Companies" "People"])
               (mapv :title groups)))))))

(deftest bidirectional-properties-skip-property-values-and-self-references
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:friend {:logseq.property/type :node
                                     :build/property-classes [:Person]}}
               :classes {:Person {:build/properties {:logseq.property.class/enable-bidirectional? true}}}
               :pages-and-blocks
               [{:page {:block/title "Bob"}}
                {:page {:block/title "Alice"
                        :build/tags [:Person]
                        :build/properties {:friend [:build/page {:block/title "Bob"}]}}}]})
        alice (db-test/find-page-by-title @conn "Alice")
        bob (db-test/find-page-by-title @conn "Bob")
        friend (d/entity @conn :user.property/friend)]
    (is (= 1 (count (ldb/get-bidirectional-properties @conn (:db/id bob)))))
    (d/transact! conn [[:db/add (:db/id bob) :logseq.property/created-from-property (:db/id friend)]])
    (is (empty? (ldb/get-bidirectional-properties @conn (:db/id bob)))
        "A property value block has no bidirectional properties")
    (d/transact! conn [[:db/retract (:db/id bob) :logseq.property/created-from-property (:db/id friend)]
                       [:db/add (:db/id alice) :user.property/friend (:db/id alice)]])
    (is (empty? (ldb/get-bidirectional-properties @conn (:db/id alice)))
        "A node that points at itself is not listed for itself")))

