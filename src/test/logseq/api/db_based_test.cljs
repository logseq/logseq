(ns logseq.api.db-based-test
  (:require [cljs.test :refer [async deftest is use-fixtures]]
            [clojure.string :as string]
            [frontend.db.conn :as conn]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper]
            [logseq.api.db-based :as db-based-api]
            [logseq.api.db-based.cli :as cli-api]
            [logseq.api.editor :as api-editor]
            [logseq.api.test-helper :as api-test]
            [logseq.db :as ldb]
            [logseq.outliner.property :as outliner-property]
            [promesa.core :as p]))

(use-fixtures :each {:before api-test/start-plugin-api-db!
                     :after api-test/destroy-plugin-api-db!})

(deftest cardinality-and-schema-validation
  (is (= :db.cardinality/one (db-based-api/->cardinality "one")))
  (is (= :db.cardinality/many (db-based-api/->cardinality "many")))
  (is (thrown-with-msg?
       js/Error
       #"Invalid cardinality"
       (db-based-api/->cardinality "sometimes")))
  (#'db-based-api/schema-type-check! :number)
  (is (thrown-with-msg?
       js/Error
       #"Invalid type"
       (#'db-based-api/schema-type-check! :color))))

(deftest property-upsert-get-and-remove
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [created (db-based-api/upsert-property "score" #js {:type "number" :cardinality "one"} nil)
                    created-map (api-test/js->clj-kw created)
                    fetched (db-based-api/get-property "score")
                    fetched-map (api-test/js->clj-kw fetched)
                    _ (db-based-api/remove-property "score")
                    removed (db-based-api/get-property "score")]
              (is (= ":plugin.property._test_plugin/score" (:ident created-map)))
              (is (= "number" (or (:type created-map)
                                  (get created-map (keyword ":logseq.property/type")))))
              (is (= (:uuid created-map) (:uuid fetched-map)))
              (is (nil? removed)))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest create-embed-inserts-linked-block-and-derived-reference
  (test-helper/load-test-files
   [{:page {:block/title "Embed Parent Page"}
     :blocks [{:block/title "Embed Parent Block"}]}
    {:page {:block/title "Embed Target Page"}
     :blocks [{:block/title "Embed Target Block"}]}])
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [parent (test-helper/find-block-by-content "Embed Parent Block")
                    parent-page (test-helper/find-page-by-title "Embed Parent Page")
                    target (test-helper/find-page-by-title "Embed Target Page")
                    target-block (test-helper/find-block-by-content "Embed Target Block")
                    block-result (db-based-api/create-embed (str (:block/uuid parent))
                                                           (str (:block/uuid target-block)))
                    block-embed (api-test/js->clj-kw block-result)
                    result (db-based-api/create-embed (str (:block/uuid parent))
                                                     (str (:block/uuid target)))
                    embed (api-test/js->clj-kw result)
                    listed (db-based-api/get-page-block-uuids (str (:block/uuid parent-page)))
                    tree (db-based-api/get-block-tree (str (:block/uuid parent)) 20 100)
                    stats (db-based-api/get-page-stats (str (:block/uuid parent-page)))
                    embeds (db-based-api/list-embeds #js {:page_uuid (str (:block/uuid parent-page))})
                    filtered (db-based-api/list-embeds #js {:target_uuid (str (:block/uuid target)) :limit 1})
                    limited (db-based-api/list-embeds #js {:page_uuid (str (:block/uuid parent-page)) :limit 1})
                    combined (db-based-api/list-embeds #js {:page_uuid (str (:block/uuid parent-page))
                                                          :target_uuid (str (:block/uuid target-block))})
                    page-data (cli-api/get-page-data "Embed Parent Page")
                    backlinks (db-based-api/get-backlinks (str (:block/uuid target)))
                    property-users (db-based-api/get-property-users ":block/title")
                    _ (api-editor/remove_block (or (:uuid embed) (:block/uuid embed)) #js {})
                    after-remove (db-based-api/list-embeds #js {:page_uuid (str (:block/uuid parent-page))})
                    link (or (:block/link embed) (:link embed))
                    link-id (if (map? link) (or (:db/id link) (:id link)) link)
                    refs (or (:block/refs embed) (:refs embed))
                    ref-ids (set (keep #(if (map? %) (or (:db/id %) (:id %)) %) refs))]
                (is (= (:db/id target-block)
                   (or (get-in block-embed [:link :id])
                     (get-in block-embed [:block/link :db/id]))))
              (is (= 2 (count (filter :link (api-test/js->clj-kw listed)))))
              (is (= 2 (count (filter :link (get-in (api-test/js->clj-kw tree) [:block :children])))))
              (is (= 0 (:empty_blocks (api-test/js->clj-kw stats))))
              (is (= 3 (:content_blocks (api-test/js->clj-kw stats))))
              (is (= #{"page" "block"}
                (set (map #(get-in % [:embed :target_type]) (:embeds (api-test/js->clj-kw embeds))))))
              (is (= 1 (:count (api-test/js->clj-kw filtered))))
              (is (true? (:truncated (api-test/js->clj-kw limited))))
              (is (= 1 (:count (api-test/js->clj-kw combined))))
              (is (= 2 (count (filter :embed (tree-seq coll? seq (api-test/js->clj-kw page-data))))))
              (is (= (str (:block/uuid target))
                (get-in (api-test/js->clj-kw backlinks) [:refs 0 :embed :target_uuid])))
              (is (= 2 (count (filter #(get-in % [:holder :embed]) (api-test/js->clj-kw property-users)))))
              (is (= 1 (:count (api-test/js->clj-kw after-remove))))
              (is (some? (test-helper/find-page-by-title "Embed Target Page")))
              (is (some? (test-helper/find-block-by-content "Embed Target Block")))
              (is (= (str (:block/uuid target))
                (get-in (api-test/js->clj-kw filtered) [:embeds 0 :embed :target_uuid])))
                (is (string? (or (:uuid embed) (:block/uuid embed))))
              (is (= "" (or (:title embed) (:block/title embed))))
              (is (= (:db/id target) link-id))
              (is (contains? ref-ids (:db/id target)))
              (is (= (:db/id parent) (or (get-in embed [:parent :id])
                                         (get-in embed [:block/parent :db/id]))))
              (is (= (:db/id parent-page) (or (get-in embed [:page :id])
                                              (get-in embed [:block/page :db/id])))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest create-embed-refuses-parent-ancestor-cycle
  (test-helper/load-test-files
   [{:page {:block/title "Embed Cycle Page"}
     :blocks [{:block/title "Embed Cycle Parent"}]}])
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (let [parent (test-helper/find-block-by-content "Embed Cycle Parent")
                  page (test-helper/find-page-by-title "Embed Cycle Page")]
              (p/then (db-based-api/create-embed (str (:block/uuid parent))
                                                 (str (:block/uuid page)))
                      (fn [_]
                        (is false "Embedding an ancestor must be rejected"))))))
        (p/catch (fn [error]
                   (is (string/includes? (.-message error) "render cycle"))))
        (p/finally done))))

(deftest get-orphan-tags-excludes-tags-with-direct-holders
  (async done
    (test-helper/load-test-files
     [{:page {:block/title "Orphan Tag Holder"}}])
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [unused (db-based-api/create-tag "UnusedTag" nil)
                    used (db-based-api/create-tag "UsedTag" nil)
                    page (test-helper/find-page-by-title "Orphan Tag Holder")
                    _ (db-based-api/add-block-tag (:block/uuid page) "UsedTag")
                    tag-result (db-based-api/get-orphan-tags)
                    tags (api-test/js->clj-kw tag-result)
                    tag-uuids (set (map :uuid tags))
                    unused-uuid (:uuid (api-test/js->clj-kw unused))
                    used-uuid (:uuid (api-test/js->clj-kw used))]
              (is (contains? tag-uuids unused-uuid))
              (is (not (contains? tag-uuids used-uuid)))
              (is (= "UnusedTag" (:title (some #(when (= unused-uuid (:uuid %)) %) tags)))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest get-orphan-properties-excludes-properties-with-values
  (test-helper/load-test-files
   [{:page {:block/title "Orphan Property Holder"}
     :blocks [{:block/title "Property Value Holder"}]}])
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (let [block (test-helper/find-block-by-content "Property Value Holder")]
              (p/let [unused (db-based-api/upsert-property "orphan-unused" #js {:type "number"} nil)
                      used (db-based-api/upsert-property "orphan-used" #js {:type "string"} nil)
                      unused-ident (:ident (api-test/js->clj-kw unused))
                      used-ident (:ident (api-test/js->clj-kw used))
                      _ (db-property-handler/set-block-property!
                         (:db/id block) (keyword (subs used-ident 1)) "value")
                      result (db-based-api/get-orphan-properties)
                      orphans (api-test/js->clj-kw result)
                      by-ident (into {} (map (juxt :ident identity) orphans))]
                (is (= "number" (get-in by-ident [unused-ident :type])))
                (is (not (contains? by-ident used-ident)))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest list-assets-refuses-a-missing-graph
  (with-redefs [state/get-current-repo (constantly nil)]
    (is (thrown-with-msg? js/Error #"No graph is open" (db-based-api/list-assets)))))

(deftest list-assets-returns-registered-assets-and-excludes-recycled-and-probe-properties
  (test-helper/load-test-files
   [{:page {:block/title "Asset Inventory Page"}
     :blocks [{:block/title "Local image"}
              {:block/title "External PDF"}
              {:block/title "Recycled asset"}
              {:block/title "Metadata-only asset"}
              {:block/title "Asset-looking block"}]}])
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (let [local (test-helper/find-block-by-content "Local image")
                  external (test-helper/find-block-by-content "External PDF")
                  recycled (test-helper/find-block-by-content "Recycled asset")
                  metadata-only (test-helper/find-block-by-content "Metadata-only asset")
                  ordinary (test-helper/find-block-by-content "Asset-looking block")]
                    (p/let [empty-result (db-based-api/list-assets)
                      asset-property (db-based-api/upsert-property "asset-probe" #js {:type "string"} nil)
                      asset-ident (:ident (api-test/js->clj-kw asset-property))
                      _ (db-property-handler/set-block-property!
                         (:db/id ordinary) (keyword (subs asset-ident 1)) "not an asset")
                      _ (conn/transact! (state/get-current-repo)
                                        [{:db/id (:db/id local) :block/tags [:logseq.class/Asset]
                                          :logseq.property.asset/type "png" :logseq.property.asset/size 2048
                                          :logseq.property.asset/checksum "fixture-checksum"}
                                         {:db/id (:db/id external) :block/tags [:logseq.class/Asset]
                                          :logseq.property.asset/type "pdf"
                                          :logseq.property.asset/size 4096 :logseq.property.asset/checksum "external-checksum"
                                          :logseq.property.asset/external-url "https://example.com/report.pdf"
                                          :logseq.property.asset/external-file-name "report.pdf"}
                                         {:db/id (:db/id recycled) :block/tags [:logseq.class/Asset]
                                          :logseq.property.asset/type "jpg" :logseq.property/deleted-at 1
                                          :logseq.property.asset/size 1024 :logseq.property.asset/checksum "recycled-checksum"}
                                         {:db/id (:db/id metadata-only) :block/tags [:logseq.class/Asset]}])
                      result (db-based-api/list-assets)
                      assets (api-test/js->clj-kw result)
                      by-title (into {} (map (juxt :title identity) assets))]
                        (is (= [] (api-test/js->clj-kw empty-result)))
                (is (= #{"Local image" "External PDF" "Metadata-only asset"} (set (keys by-title))))
                (is (= (str (:block/uuid local)) (get-in by-title ["Local image" :uuid])))
                (is (= "png" (get-in by-title ["Local image" :type])))
                (is (= 2048 (get-in by-title ["Local image" :size])))
                (is (= "fixture-checksum" (get-in by-title ["Local image" :checksum])))
                (is (nil? (get-in by-title ["Local image" :external_url])))
                (is (= "https://example.com/report.pdf" (get-in by-title ["External PDF" :external_url])))
                (is (= "report.pdf" (get-in by-title ["External PDF" :external_file_name])))
                (is (nil? (get-in by-title ["Metadata-only asset" :type])))
                (is (= (sort (map :uuid assets)) (map :uuid assets)))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest get-property-users-preserves-literals-and-resolves-entities
  (test-helper/load-test-files
   [{:page {:block/title "Property Users Page"}
     :blocks [{:block/title "Property Users Holder"}]}])
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (let [block (test-helper/find-block-by-content "Property Users Holder")]
              (p/let [property (db-based-api/upsert-property "property-users-ref" #js {:type "default"} nil)
                      property-ident (:ident (api-test/js->clj-kw property))
                      _ (db-property-handler/set-block-property!
                         (:db/id block) (keyword (subs property-ident 1)) "Resolved value")
                       ref-result (db-based-api/get-property-users property-ident)
                       ref-users (api-test/js->clj-kw ref-result)
                       literal-result (db-based-api/get-property-users ":block/title")
                       literal-users (api-test/js->clj-kw literal-result)
                      ref-user (some #(when (= "Property Users Holder"
                                               (get-in % [:holder :title])) %)
                                     ref-users)
                      literal-user (some #(when (= "Property Users Holder"
                                                   (get-in % [:holder :title])) %)
                                         literal-users)]
                (is (= "Resolved value" (get-in ref-user [:value_entity :title])))
                (is (number? (:value ref-user)))
                (is (= "Property Users Holder" (:value literal-user)))
                (is (nil? (:value_entity literal-user)))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest get-property-users-rejects-non-ident-input
  (is (thrown-with-msg? js/Error #"exact namespaced property ident"
                        (db-based-api/get-property-users "Flag"))))

(deftest get-properties-by-title-filters-to-property-definitions
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [_ (db-based-api/create-tag "LookupProp" nil)
                    _ (db-based-api/upsert-property "LookupProp" #js {:type "number"} nil)
                  candidates (db-based-api/get-properties-by-title "LookupProp")
                  candidates (api-test/js->clj-kw candidates)
                    missing (db-based-api/get-properties-by-title "MissingProperty")]
              (is (= 1 (count candidates)))
              (is (= ":plugin.property._test_plugin/LookupProp" (:ident (first candidates))))
              (is (= "LookupProp" (:title (first candidates))))
              (is (empty? missing)))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest create-and-lookup-tags
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [tag (db-based-api/create-tag "Book" nil)
                    tag-map (api-test/js->clj-kw tag)
                    by-title (db-based-api/get-tag "Book")
                    by-ident (db-based-api/get-tag ":plugin.class._test_plugin/Book")
                    by-uuid (db-based-api/get-tag (:uuid tag-map))
                    by-uuid-map (api-test/js->clj-kw by-uuid)
                    by-name (db-based-api/get-tags-by-name "book")]
              (is (= ":plugin.class._test_plugin/Book" (:ident tag-map)))
              (is (= (:uuid tag-map) (:uuid (api-test/js->clj-kw by-title))))
              (is (= "Book" (:title (api-test/js->clj-kw by-ident))))
                    (is (= "Book" (:title by-uuid-map)))
                    (is (= (:uuid tag-map) (:uuid by-uuid-map)))
                    (is (= (:name tag-map) (:name by-uuid-map)))
                    (is (= (:ident tag-map) (:ident by-uuid-map)))
              (is (= 1 (count (api-test/js->clj-kw by-name)))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest create-tag-rejects-invalid-titles
  (is (thrown-with-msg? js/Error #"Tag title should be a string"
                        (db-based-api/create-tag 1 nil)))
  (is (thrown-with-msg? js/Error #"Tag title shouldn't be empty"
                        (db-based-api/create-tag "  " nil)))
  (is (thrown-with-msg? js/Error #"forward slash"
                        (db-based-api/create-tag "ns/tag" nil))))

(deftest tag-extends-and-block-tags
  (async done
    (test-helper/load-test-files
     [{:page {:block/title "Tagged Page"}
       :blocks [{:block/title "tagged block"}]}])
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [parent (db-based-api/create-tag "ParentTag" nil)
                    child (db-based-api/create-tag "ChildTag" nil)
                    parent-id (aget parent "id")
                    child-id (aget child "id")
                    child-map (api-test/js->clj-kw child)
                    _ (db-based-api/add-tag-extends child-id parent-id)
                    child-after (db-based-api/get-tag child-id)
                    page (test-helper/find-page-by-title "Tagged Page")
                    block (test-helper/find-block-by-content "tagged block")
                    _ (db-based-api/add-block-tag (:block/uuid page) "ChildTag")
                    tagged-block (db-based-api/add-block-tag (:block/uuid block) "ChildTag")
                    tagged-block-map (api-test/js->clj-kw tagged-block)
                    users (db-based-api/get-tag-users (:uuid child-map))
                    users-map (api-test/js->clj-kw users)
                    block-user (some #(when (= (str (:block/uuid block)) (:uuid %)) %) users-map)
                    parent-users (db-based-api/get-tag-users (:uuid (api-test/js->clj-kw parent)))
                    missing-users (db-based-api/get-tag-users "00000000-0000-4000-8000-000000000999")
                    objects (db-based-api/get-tag-objects "ChildTag")
                    _ (db-based-api/remove-block-tag (:block/uuid block) "ChildTag")
                    objects-after (db-based-api/get-tag-objects "ChildTag")
                    _ (db-based-api/remove-tag-extends child-id parent-id)
                    child-removed (db-based-api/get-tag child-id)]
              (is (= [parent-id] (js->clj (aget child-after ":logseq.property.class/extends"))))
              (is (= (str (:block/uuid block)) (str (:uuid tagged-block-map))))
              (is (= #{(str (:block/uuid page)) (str (:block/uuid block))}
                (set (map #(str (:uuid %)) users-map))))
              (is (= (:db/id page) (get-in block-user [:page :id])))
              (is (empty? parent-users))
              (is (empty? missing-users))
              (is (= 2 (count (api-test/js->clj-kw objects))))
              (is (= 1 (count (api-test/js->clj-kw objects-after))))
              (is (not= [parent-id] (js->clj (aget child-removed ":logseq.property.class/extends")))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest inspect-page-api-preserves-detail-contract
  (test-helper/load-test-files
   [{:page {:block/title "Inspect API Page"}
     :blocks [{:block/title "Inspect API Block"}]}])
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (let [page (test-helper/find-page-by-title "Inspect API Page")
                  block (test-helper/find-block-by-content "Inspect API Block")
                  page-uuid (str (:block/uuid page))
                block-uuid (str (:block/uuid block))]
                    (p/let [tag (db-based-api/create-tag "Inspect API Tag" nil)
                      property (db-based-api/upsert-property "inspect-score" #js {:type "default"} nil)
                      property-map (api-test/js->clj-kw property)
                      property-ident (keyword (subs (:ident property-map) 1))
                  _ (db-based-api/add-block-tag page-uuid (aget tag "uuid"))
                  _ (db-based-api/add-block-tag block-uuid (aget tag "uuid"))
                  _ (db-based-api/tag-add-property (aget tag "uuid") "inspect-score")
                      _ (db-property-handler/set-block-property! (:db/id block) property-ident "zero")
                  page-only (db-based-api/inspect-page page-uuid "page")
                      all-details (db-based-api/inspect-page page-uuid "all")
                      missing (db-based-api/inspect-page "00000000-0000-4000-8000-000000000999" "page")
                      non-page (db-based-api/inspect-page block-uuid "page")
                      page-only (api-test/js->clj-kw page-only)
                      all-details (api-test/js->clj-kw all-details)
                      missing (api-test/js->clj-kw missing)
                      non-page (api-test/js->clj-kw non-page)]
                (is (true? (:found page-only)))
                (is (= page-uuid (:page_uuid page-only)))
                (is (= "Inspect API Page" (get-in page-only [:page :title])))
                (is (not (contains? page-only :blocks)))
                (is (true? (:found all-details)))
                (is (some #(= "Inspect API Block" (:title %)) (:blocks all-details)))
                (is (some #(= "zero" (:title %)) (:blocks all-details)))
                (is (some (fn [holder]
                            (some #(= "Inspect API Tag" (:title %)) (:tags holder)))
                          (:tags all-details)))
                (is (contains? all-details :properties))
                    (is (some #(and (= "inspect-score" (get-in % [:property :title]))
                                    (= "zero" (get-in % [:value_entity :title])))
                      (:properties all-details)))
                (is (some #(= "inspect-score" (get-in % [:property :title]))
                          (:declared_properties all-details)))
                (is (= {:found false :page_uuid "00000000-0000-4000-8000-000000000999" :page nil}
                       missing))
                (is (= "target is a block, not a page" (:reason non-page)))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest get-page-stats-api-counts-page-blocks
  (test-helper/load-test-files
   [{:page {:block/title "Stats API Page"}
     :blocks [{:block/title "Stats API Block"}]}])
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (let [page (test-helper/find-page-by-title "Stats API Page")
                  page-uuid (str (:block/uuid page))]
              (p/let [result (db-based-api/get-page-stats page-uuid)
                      stats (api-test/js->clj-kw result)]
                (is (= page-uuid (:page_uuid stats)))
                (is (= "Stats API Page" (:title stats)))
                (is (= 1 (:own_blocks stats)))
                (is (= 0 (:empty_blocks stats)))
                (is (= 1 (:content_blocks stats)))
                (is (= 1 (:subtree_blocks stats)))
                (is (zero? (:nested_pages stats)))
                (is (zero? (:true_orphans stats)))
                (is (zero? (:refs stats)))
                (is (zero? (:tag_holders stats)))
                (is (zero? (:property_values stats)))
                (is (nil? (:is_alias_of stats)))
                (is (empty? (:aliases stats)))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest get-backlinks-api-validates-target-and-returns-empty-groups
  (is (thrown-with-msg? js/Error #"target_uuid must be a UUID"
                        (db-based-api/get-backlinks "not-a-uuid")))
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [result (db-based-api/get-backlinks "00000000-0000-4000-8000-000000000999")
                    backlinks (api-test/js->clj-kw result)]
              (is (= "00000000-0000-4000-8000-000000000999" (:target_uuid backlinks)))
              (is (zero? (:total backlinks)))
              (is (empty? (:refs backlinks)))
              (is (empty? (:tagged backlinks)))
              (is (empty? (:property_values backlinks)))
              (is (= "Nothing refers to this entity." (:diagnostic backlinks))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest get-backlinks-api-finds-direct-tag-holders
  (test-helper/load-test-files
   [{:page {:block/title "Backlink API Page"}
     :blocks [{:block/title "Backlink API Block"}]}])
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (let [block (test-helper/find-block-by-content "Backlink API Block")]
              (p/let [tag (db-based-api/create-tag "Backlink API Tag" nil)
                      tag-map (api-test/js->clj-kw tag)
                      _ (db-based-api/add-block-tag (:block/uuid block) (:uuid tag-map))
                      result (db-based-api/get-backlinks (:uuid tag-map))
                      backlinks (api-test/js->clj-kw result)]
                (is (= 3 (:total backlinks)))
                (is (= [(str (:block/uuid block))] (mapv :uuid (:tagged backlinks))))
                (is (= [(str (:block/uuid block))] (mapv :uuid (:refs backlinks))))
                (is (= "Tags" (get-in backlinks [:property_values 0 :property :title])))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

      (deftest get-title-holders-api-returns-all-exact-title-entity-kinds
        (test-helper/load-test-files
         [{:page {:block/title "ExactCollision"}}])
        (async done
          (-> (api-test/with-plugin-api
            (fn []
          (p/let [_ (db-based-api/create-tag "ExactCollision" nil)
              _ (db-based-api/upsert-property "ExactCollision" #js {:type "default"} nil)
              entities (db-based-api/get-title-holders "ExactCollision")
                holders (api-test/js->clj-kw entities)
                inventory (db-based-api/get-title-inventory)
                inventory (api-test/js->clj-kw inventory)
                inventory-kinds (set (map :kind inventory))]
              (is (= 3 (count holders)))
              (is (= #{":plugin.class._test_plugin/ExactCollision"
                   ":plugin.property._test_plugin/ExactCollision"}
                 (set (keep :ident holders))))
              (is (= #{"page" "tag"}
                     (set (map :kind (filter #(= "ExactCollision" (:title %)) inventory))))))))
          (p/catch (fn [error]
             (is false (str error))))
          (p/finally done))))

(deftest get-journal-candidates-api-returns-journal-day-entities
  (test-helper/load-test-files
   [{:page {:block/title "Journal Candidate API" :block/journal-day 20250101}}])
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [result (db-based-api/get-journal-candidates)
                    journals (api-test/js->clj-kw result)]
              (is (some #(and (= "Journal Candidate API" (:title %))
                              (= 20250101 (:journal-day %)))
                        journals)))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest list-recycled-api-includes-deleted-page-and-block-entities
  (test-helper/load-test-files
   [{:page {:block/title "Recycled API Page"}
     :blocks [{:block/title "Recycled API Block"}]}])
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (let [page (test-helper/find-page-by-title "Recycled API Page")
                  block (test-helper/find-block-by-content "Recycled API Block")]
              (p/let [_ (conn/transact! (state/get-current-repo)
                                        [{:db/id (:db/id page) :logseq.property/deleted-at 1}
                                         {:db/id (:db/id block) :logseq.property/deleted-at 2}])
                      result (db-based-api/list-recycled)
                      recycled (api-test/js->clj-kw result)
                      titles (set (map :title recycled))]
                  (is (every? titles #{"Recycled API Page" "Recycled API Block"}))
                  (is (= 2 (count (filter (fn [entity]
                                            (some #(= "deleted-at" (name %)) (keys entity)))
                                          recycled))))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest get-status-rows-api-returns-entity-and-status
  (test-helper/load-test-files
   [{:page {:block/title "Status API Page"}
     :blocks [{:build.test/title "TODO Status API Block"}]}])
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [result (db-based-api/get-status-rows)
                    rows (api-test/js->clj-kw result)
                row (some #(when (= "Status API Block" (get-in % [0 :title])) %) rows)]
              (is (some? row))
              (is (= "Status API Block" (get-in row [0 :title])))
              (is (= ":logseq.property/status.todo" (get-in row [1 :ident]))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest get-page-block-uuids-api-returns-flat-page-descendants
  (test-helper/load-test-files
   [{:page {:block/title "UUID API Page"}
     :blocks [{:block/title "UUID API Block"}]}])
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (let [page (test-helper/find-page-by-title "UUID API Page")
                  block (test-helper/find-block-by-content "UUID API Block")
                  page-uuid (str (:block/uuid page))
                  block-uuid (str (:block/uuid block))]
              (p/let [result (db-based-api/get-page-block-uuids page-uuid)
                      blocks (api-test/js->clj-kw result)]
                (is (= [block-uuid] (mapv :uuid blocks)))
                (is (= [page-uuid] (mapv :page_uuid blocks)))
                (is (= (:db/id page) (get-in blocks [0 :page :id])))
                (is (= (:db/id page) (get-in blocks [0 :parent :id])))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest get-block-tree-api-preserves-tree-bounds-and-root-classification
  (test-helper/load-test-files
   [{:page {:block/title "Tree API Page"}
     :blocks [{:block/title "Tree API Parent"
               :build/children [{:block/title "Tree API Child"}]}]}])
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (let [page (test-helper/find-page-by-title "Tree API Page")
                  parent (test-helper/find-block-by-content "Tree API Parent")
                  block-uuid (str (:block/uuid parent))
                  page-uuid (str (:block/uuid page))]
              (p/let [tree (db-based-api/get-block-tree block-uuid 20 10)
                      root-only (db-based-api/get-block-tree block-uuid 0 10)
                      page-result (db-based-api/get-block-tree page-uuid 20 10)
                      missing (db-based-api/get-block-tree "00000000-0000-4000-8000-000000000999" 20 10)
                      tree (api-test/js->clj-kw tree)
                      root-only (api-test/js->clj-kw root-only)
                      page-result (api-test/js->clj-kw page-result)
                      missing (api-test/js->clj-kw missing)]
                (is (true? (:found tree)))
                (is (= "Tree API Parent" (get-in tree [:block :title])))
                (is (= ["Tree API Child"] (mapv :title (get-in tree [:block :children]))))
                (is (= 2 (:node_count tree)))
                (is (= 1 (:node_count root-only)))
                (is (true? (:truncated root-only)))
                (is (= [] (get-in root-only [:block :children])))
                (is (= "target is a page, not a block" (:reason page-result)))
                (is (false? (:found missing)))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest tag-properties-and-node-tags
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [tag (db-based-api/create-tag "HasProps" nil)
                    property (db-based-api/upsert-property "isbn" #js {:type "default"} nil)
                    tag-id (aget tag "uuid")
                    _ (db-based-api/tag-add-property tag-id "isbn")
                    with-prop (db-based-api/get-tag tag-id)
                    _ (db-based-api/tag-remove-property tag-id (aget property "uuid"))
                    without-prop (db-based-api/get-tag tag-id)
                    _ (db-based-api/set-property-node-tags
                       (aget property "uuid")
                       #js [(aget tag "id")])
                    property-after (db-based-api/get-property "isbn")]
              (is (seq (aget with-prop ":logseq.property.class/properties")))
              (is (empty? (or (aget without-prop ":logseq.property.class/properties") #js [])))
              (is (= [(aget tag "id")]
                     (js->clj (aget property-after ":logseq.property/classes")))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest block-icon-set-and-remove
  (async done
    (test-helper/load-test-files
     [{:page {:block/title "Icon Page"}
       :blocks [{:block/title "icon owner"}]}])
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [block (test-helper/find-block-by-content "icon owner")
                    _ (db-based-api/set-block-icon (:block/uuid block) "tabler-icon" "book")
                    with-icon (test-helper/find-block-by-content "icon owner")
                    _ (db-based-api/remove-block-icon (:block/uuid block))
                    without-icon (test-helper/find-block-by-content "icon owner")]
              (is (= :tabler-icon (get-in with-icon [:logseq.property/icon :type])))
              (is (= "book" (get-in with-icon [:logseq.property/icon :id])))
              (is (nil? (:logseq.property/icon without-icon))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest set-block-icon-validates-inputs
  (is (thrown-with-msg? js/Error #"icon-type should be one of"
                        (db-based-api/set-block-icon 1 "unknown" "book")))
  (is (thrown-with-msg? js/Error #"icon-name should be a non-blank string"
                        (db-based-api/set-block-icon 1 "emoji" "  ")))
  (is (thrown-with-msg? js/Error #"Can't find emoji"
                        (db-based-api/set-block-icon 1 "emoji" "not-an-emoji"))))

(deftest get-all-tags-and-properties-include-created-entities
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [_ (db-based-api/create-tag "ListedTag" nil)
                    _ (db-based-api/upsert-property "listed-prop" nil nil)
                    tags (db-based-api/get-all-tags)
                    properties (db-based-api/get-all-properties)
                    tag-idents (set (map :ident (api-test/js->clj-kw tags)))
                    property-idents (set (map :ident (api-test/js->clj-kw properties)))]
              (is (contains? tag-idents ":plugin.class._test_plugin/ListedTag"))
              (is (contains? property-idents ":plugin.property._test_plugin/listed-prop")))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest create-tag-accepts-custom-uuid
  (async done
    (let [custom-uuid "11111111-1111-4111-8111-111111111111"]
      (-> (api-test/with-plugin-api
            (fn []
              (p/let [tag (db-based-api/create-tag "UuidTag" #js {:uuid custom-uuid})
                      missing (db-based-api/get-property "missing-prop")]
                (is (= custom-uuid (:uuid (api-test/js->clj-kw tag))))
                (is (nil? missing)))))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally done)))))

(deftest create-tag-ignores-non-string-uuid
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [tag (db-based-api/create-tag "NilUuidTag" #js {:uuid nil})]
              (is (string? (:uuid (api-test/js->clj-kw tag)))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest get-tag-objects-rejects-non-tag
  (async done
    (test-helper/load-test-files
     [{:page {:block/title "Not A Tag"}
       :blocks [{:block/title "plain"}]}])
    (-> (api-test/with-plugin-api
          (fn []
            (-> (db-based-api/get-tag-objects "Not A Tag")
                (p/then (fn [_]
                          (is false "non-tag should throw")))
                (p/catch (fn [error]
                           (is (re-find #"Not a tag|Tag not exists" (str error))))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest add-block-tag-rejects-missing-tag
  (async done
    (test-helper/load-test-files
     [{:page {:block/title "Need Tag"}
       :blocks [{:block/title "needs tag"}]}])
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [block (test-helper/find-block-by-content "needs tag")]
              (-> (db-based-api/add-block-tag (:block/uuid block) "MissingTag")
                  (p/then (fn [_]
                            (is false "missing tag should throw")))
                  (p/catch (fn [error]
                             (is (re-find #"Not a tag" (str error)))))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest add-property-value-choices
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [property (db-based-api/upsert-property "status" #js {:type "default" :cardinality "many"} nil)
                    property-id (or (aget property "id") (:id (api-test/js->clj-kw property)))]
              (p/with-redefs [db-property-handler/add-existing-values-to-closed-values!
                              (fn [id values]
                                (p/resolved {:property-id id :values values}))]
                (p/let [result (db-based-api/add-property-value-choices property-id #js ["todo" "doing"])]
                  (is (= property-id (:property-id result)))
                  (is (= ["todo" "doing"] (:values result))))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest upsert-property-blank-name-is-nil
  (is (nil? (db-based-api/upsert-property "  " nil nil))))

(defn- property-ident-by-title
  [title ns-prefix]
  (some (fn [property]
          (when (and (= title (:block/title property))
                     (string/starts-with? (namespace (:db/ident property)) ns-prefix))
            (:db/ident property)))
        (ldb/get-all-properties (conn/get-db))))

(defn- property-written-value
  [value]
  (or (when (map? value)
        (or (:logseq.property/value value)
            (:block/title value)
            (:value value)))
      (when (and (object? value) (not (coll? value)))
        (or (aget value "value")
            (aget value ":logseq.property/value")))
      (:logseq.property/value value)
      value))

(defn- create-ui-property!
  [title schema]
  (let [created (outliner-property/upsert-property!
                 (conn/get-db (state/get-current-repo) false)
                 nil
                 schema
                 {:property-name title})
        ident (or (:db/ident created)
                  (property-ident-by-title title "user.property"))]
    (is (some? ident) (str "UI property should exist: " title))
    (is (= "user.property" (namespace ident)))
    ident))

(deftest api-writes-values-on-ui-property-by-ident
  (async done
    (test-helper/load-test-files
     [{:page {:block/title "UI Ident Page"}
       :blocks [{:block/title "ident owner"}]}])
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [user-ident (create-ui-property! "Priority" {:logseq.property/type :number})
                    block (test-helper/find-block-by-content "ident owner")
                    uuid' (str (:block/uuid block))
                    _ (api-editor/upsert_block_property uuid' (str user-ident) 7 nil)
                    fetched-property (db-based-api/get-property (str user-ident))
                    fetched-map (api-test/js->clj-kw fetched-property)
                    read-value (api-editor/get_block_property uuid' (str user-ident))
                    updated (test-helper/find-block-by-content "ident owner")
                    _ (api-editor/remove_block_property uuid' (str user-ident))
                    after-remove (test-helper/find-block-by-content "ident owner")]
              (is (= (str user-ident) (:ident fetched-map)))
              (is (= 7 (property-written-value (get updated user-ident))))
              (is (= 7 (property-written-value read-value)))
              (is (nil? (get after-remove user-ident))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest plugin-short-name-writes-stay-on-plugin-property
  (async done
    (test-helper/load-test-files
     [{:page {:block/title "Plugin Own Page"}
       :blocks [{:block/title "plugin owner"}]}])
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [user-ident (create-ui-property! "Status" {:logseq.property/type :number})
                    block (test-helper/find-block-by-content "plugin owner")
                    uuid' (str (:block/uuid block))
                    _ (api-editor/upsert_block_property uuid' "Status" 42 nil)
                    fetched-property (db-based-api/get-property "Status")
                    fetched-map (api-test/js->clj-kw fetched-property)
                    updated (test-helper/find-block-by-content "plugin owner")]
              (is (= ":plugin.property._test_plugin/Status" (:ident fetched-map)))
              (is (= 42 (property-written-value (get updated :plugin.property._test_plugin/Status))))
              (is (nil? (get updated user-ident))
                  "A short name must not write onto the UI-owned property"))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest plugin-schema-upsert-of-ui-property-is-rejected
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [user-ident (create-ui-property! "Status" {:logseq.property/type :number})]
              (let [original-property (some #(when (= user-ident (:db/ident %)) %)
                                            (ldb/get-all-properties (conn/get-db)))]
                (-> (db-based-api/upsert-property (str user-ident) #js {:type "string" :cardinality "many"} nil)
                    (p/then (fn [_]
                              (is false "schema upsert of a UI property should throw")))
                    (p/catch (fn [error]
                               (is (re-find #"Plugins can only upsert its own properties" (str error)))
                               (let [after (some #(when (= user-ident (:db/ident %)) %)
                                                 (ldb/get-all-properties (conn/get-db)))]
                                 (is (= (:logseq.property/type original-property)
                                        (:logseq.property/type after)))
                                 (is (= (:db/cardinality original-property)
                                        (:db/cardinality after)))))))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))
