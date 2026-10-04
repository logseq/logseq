(ns electron.mcp-compat-test
  (:require [clojure.string :as string]
            [cljs.reader :as reader]
            [cljs.test :refer [async deftest is]]
            [datascript.core :as d]
            [electron.mcp-compat :as mcp-compat]
            [electron.mcp-server :as mcp-server]
            [frontend.db.async :as db-async]
            [frontend.state :as state]
            [logseq.api.editor :as api-editor]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.sdk.utils :as sdk-utils]
            [promesa.core :as p]))

(defn- recording-api
  [calls result]
  (fn [method args]
    (swap! calls conj [method args])
    result))

(defn- page-fixture
  []
  (let [page-uuid "00000000-0000-4000-8000-000000000160"
        block-uuid "00000000-0000-4000-8000-000000000161"
        calls (atom [])
        counter (atom 200)
        conn (d/create-conn (merge db-schema/schema {:block/uuid {:db/unique :db.unique/identity}
                            :block/parent {:db/valueType :db.type/ref}
                            :block/page {:db/valueType :db.type/ref}
                            :block/tags {:db/valueType :db.type/ref :db/cardinality :db.cardinality/many}
                            :block/parent+ {:db/valueType :db.type/ref :db/cardinality :db.cardinality/many}
                            :block/refs {:db/valueType :db.type/ref :db/cardinality :db.cardinality/many}
                            :block/alias {:db/valueType :db.type/ref :db/cardinality :db.cardinality/many}
                            :plugin.property/smoke-link {:db/valueType :db.type/ref}
                            :logseq.property/alias {:db/valueType :db.type/ref :db/cardinality :db.cardinality/many}}))
        api (fn [method args]
              (swap! calls conj [method args])
            (.then (js/Promise.resolve nil) (fn [_] (case method
                "logseq.DB.datascriptQuery"
                (clj->js (sdk-utils/normalize-keyword-for-json
                           (apply d/q (reader/read-string (first args)) @conn
                                  (map #(if (and (string? %) (string/starts-with? % "#uuid"))
                                          (reader/read-string %) %) (rest args))) false))
                              "logseq.DB.getBlock"
                              (clj->js (sdk-utils/normalize-keyword-for-json
                                   (d/pull @conn '[*] [:block/uuid (uuid (first args))]) true))
                              "logseq.DB.getPageBlockUUIDs"
                              (let [page-uuid (uuid (first args))
                                    root-id (d/q '[:find ?root . :in $ ?uuid
                                                   :where [?root :block/uuid ?uuid]]
                                                 @conn page-uuid)]
                                (letfn [(descendants [parent-id]
                                          (mapcat (fn [child]
                                                    (cons child (descendants (:db/id child))))
                                                  (d/q '[:find [(pull ?child [:db/id :block/uuid :block/title :block/name :block/order
                                                                                 {:block/parent [:db/id :block/uuid]}
                                                                                 {:block/page [:db/id :block/uuid]}]) ...]
                                                        :in $ ?parent
                                                        :where [?child :block/parent ?parent]]
                                                      @conn parent-id)))]
                                  (let [blocks (descendants root-id)]
                                (clj->js
                                 (sdk-utils/normalize-keyword-for-json
                                  (mapv #(assoc % :page_uuid (str page-uuid))
                                    (sort-by #(str (:block/order %)) blocks))
                                  false)))))
                              "logseq.DB.getTag"
                              (when (d/q '[:find ?tag . :in $ ?uuid
                                           :where [?tag :block/uuid ?uuid] [?tag :block/tags 159]]
                                         @conn (uuid (first args)))
                                (clj->js (sdk-utils/normalize-keyword-for-json
                                          (d/pull @conn '[*] [:block/uuid (uuid (first args))]) true)))
                              "logseq.DB.getTagUsers"
                              (let [tag-uuid (uuid (first args))
                                    users (d/q '[:find [(pull ?holder [:block/uuid :block/title :block/name
                                                                        :block/page]) ...]
                                                :in $ ?tag-uuid
                                                :where [?tag :block/uuid ?tag-uuid] [?holder :block/tags ?tag]]
                                              @conn tag-uuid)]
                                (clj->js (sdk-utils/normalize-keyword-for-json users false)))
                "logseq.DB.deletePage"
                (let [entity (d/entity @conn [:block/uuid (uuid (first args))])]
                  (if (some #(= 159 (:db/id %)) (:block/tags entity))
                    (d/transact! conn [[:db/retractEntity (:db/id entity)]])
                    (d/transact! conn [{:db/id (:db/id entity) :logseq.property/deleted-at 1}]))
                  nil)
                "logseq.DB.createTag"
                (let [id (swap! counter inc)
                      uuid-text (str "00000000-0000-4000-8000-000000000" id)]
                  (d/transact! conn [{:db/id id :block/uuid (uuid uuid-text) :block/title (first args)
                                     :db/ident (keyword "user.class" (str "smoke-" id)) :block/tags [159]}])
                  #js {:uuid uuid-text})
                  "logseq.DB.upsertProperty"
                  (let [id (swap! counter inc)
                      title (string/replace (first args) #"\s+" "")
                      schema (second args)
                      ident (keyword "plugin.property._test_plugin" title)
                      uuid-text (str "00000000-0000-4000-8000-000000000" id)]
                    (d/transact! conn [{:db/id id :db/ident ident :block/uuid (uuid uuid-text)
                             :block/title title :block/tags [157]
                             :logseq.property/type (keyword (aget schema "type"))
                             :db/cardinality (keyword "db.cardinality" (or (aget schema "cardinality") "one"))}])
                    #js {:ident (str ident) :uuid uuid-text})
                      "logseq.DB.getPropertiesByTitle"
                      (let [properties (d/q '[:find [(pull ?property [:db/ident :block/title :logseq.property/type]) ...]
                                  :in $ ?title
                                  :where [?property :block/title ?title]
                                       [?property :block/tags 157]]
                                  @conn (first args))]
                        (clj->js (sdk-utils/normalize-keyword-for-json properties false)))
                "logseq.DB.addBlockTag"
                (do (d/transact! conn [[:db/add [:block/uuid (uuid (first args))] :block/tags
                                       [:block/uuid (uuid (second args))]]]) nil)
                "logseq.DB.removeBlockTag"
                (do (d/transact! conn [[:db/retract [:block/uuid (uuid (first args))] :block/tags
                                       [:block/uuid (uuid (second args))]]]) nil)
                "logseq.DB.renamePage"
                (do (d/transact! conn [{:db/id [:block/uuid (uuid (first args))]
                                       :block/title (second args) :block/name (string/lower-case (second args))}]) nil)
                "logseq.DB.createPage"
                (let [id (swap! counter inc)
                      uuid-text (str "00000000-0000-4000-8000-000000000" id)]
                  (d/transact! conn [{:db/id id :block/uuid (uuid uuid-text)
                                     :block/name (string/lower-case (first args)) :block/title (first args)
                                     :block/tags [158]}])
                  #js {:uuid uuid-text})
                "logseq.DB.updateBlock"
                (let [text (second args)
                      links (map second (re-seq #"(?<!#)\[\[([a-fA-F0-9-]+)\]\]" text))
                    tag-names (map second (re-seq #"#\[\[([^\]]+)\]\]" text))
                    tags (mapv (fn [title]
                           (or (d/q '[:find ?tag . :in $ ?title :where
                                 [?tag :block/title ?title] [?tag :block/tags 159]] @conn title)
                             (let [id (swap! counter inc)
                               tag-uuid (str "00000000-0000-4000-8000-000000000" id)]
                             (d/transact! conn [{:db/id id :block/uuid (uuid tag-uuid)
                                      :block/title title :block/tags [159]}])
                             id))) tag-names)
                    stored-text (reduce (fn [content [title tag-id]]
                              (string/replace content (str "#[[" title "]]")
                                      (str "#[[" (:block/uuid (d/entity @conn tag-id)) "]]")))
                              text (map vector tag-names tags))
                      ids (fn [uuids] (mapv #(:db/id (d/entity @conn [:block/uuid (uuid %)])) uuids))]
                  (d/transact! conn [{:db/id [:block/uuid (uuid (first args))]
                           :block/title stored-text :block/refs (ids links) :block/tags tags}])
                  nil)
                "logseq.DB.removeBlock"
                (do (d/transact! conn [[:db/retractEntity [:block/uuid (uuid (first args))]]]) nil)
                    "logseq.DB.insertBatchBlock"
                    (let [parent (d/entity @conn [:block/uuid (uuid (first args))])
                      parent-id (:db/id parent)
                      page-id (if (:block/name parent) parent-id (:db/id (:block/page parent)))
                      created (mapv (fn [item]
                          (let [id (swap! counter inc)
                            uuid-text (str "00000000-0000-4000-8000-000000000" id)]
                            (d/transact! conn [{:db/id id :block/uuid (uuid uuid-text)
                                   :block/title (aget item "content") :block/order (str id)
                                   :block/parent parent-id :block/page page-id
                                   :block/parent+ (conj (mapv :db/id (:block/parent+ parent)) parent-id)}])
                            {:uuid uuid-text})) (array-seq (second args)))]
                  (clj->js created))
                nil))))]
    (d/transact! conn [{:db/id 157 :db/ident :logseq.class/Property}
              {:db/id 158 :db/ident :logseq.class/Page}
              {:db/id 159 :db/ident :logseq.class/Tag}
              {:db/id 160 :block/uuid (uuid page-uuid) :block/name "fixture" :block/title "Fixture" :block/tags [158]}
                      {:db/id 161 :block/uuid (uuid block-uuid) :block/title "Content" :block/order "a0"
                       :block/parent 160 :block/parent+ [160] :block/page 160}])
    {:page-uuid page-uuid :block-uuid block-uuid :conn conn :api api :calls calls}))

(deftest block-lookups-use-native-uuid-query-inputs
  (let [{:keys [page-uuid block-uuid api]} (page-fixture)]
    (async done
      (-> (p/let [block (mcp-compat/get-block api #js {"block_uuid" block-uuid})
                  blocks (mcp-compat/get-block-uuids api #js {"page_uuid" page-uuid})]
            (is (true? (:found block)))
            (is (= block-uuid (get-in block [:block :uuid])))
            (is (= "Content" (get-in block [:block :title])))
            (is (= [block-uuid] (mapv :uuid blocks)))
            (is (= [page-uuid] (mapv :page_uuid blocks)))
            (js/queueMicrotask done))
          (p/catch (fn [error]
                     (is false (str "UUID lookup regression failed: " (.-message error)))
                     (js/queueMicrotask done)))))))

(deftest block-enumeration-follows-parents-and-preserves-reference-ordering
  (let [{:keys [page-uuid block-uuid conn api]} (page-fixture)
        child-uuid "00000000-0000-4000-8000-000000000163"
        missing-uuid "00000000-0000-4000-8000-000000000164"]
    (d/transact! conn [{:db/id 162 :block/uuid (uuid "00000000-0000-4000-8000-000000000162")
                       :block/name "other-page" :block/title "Other page"}
                      {:db/id 163 :block/uuid (uuid child-uuid) :block/title "Nested child" :block/order "a-1"
                       :block/parent 161 :block/page 162}])
    (async done
      (-> (p/let [blocks (mcp-compat/get-block-uuids api #js {"page_uuid" page-uuid})
                  child (mcp-compat/get-block api #js {"block_uuid" child-uuid})
                  page (mcp-compat/get-block api #js {"block_uuid" page-uuid})
                  missing (mcp-compat/get-block api #js {"block_uuid" missing-uuid})]
            (is (= [child-uuid block-uuid] (mapv :uuid blocks)))
            (is (= 162 (get-in (first blocks) [:page :id])))
            (is (= 161 (get-in (first blocks) [:parent :id])))
            (is (not-any? #(contains? % :_parent) blocks))
            (is (true? (:found child)))
            (is (= 163 (get-in child [:block :id])))
            (is (false? (:found page)))
            (is (false? (:found missing)))
            (js/queueMicrotask done))
          (p/catch (fn [error]
                     (is false (str "Parent traversal regression failed: " (.-message error)))
                     (js/queueMicrotask done)))))))

(deftest get-block-tree-finds-a-childless-uuid-with-and-without-bounds
  (let [{:keys [block-uuid api]} (page-fixture)]
    (async done
      (-> (p/let [bounded (mcp-compat/get-block-tree api #js {"block_uuid" block-uuid "max_depth" 2 "max_nodes" 10})
                  defaults (mcp-compat/get-block-tree api #js {"block_uuid" block-uuid})]
            (doseq [result [bounded defaults]]
              (is (true? (:found result)))
              (is (= block-uuid (get-in result [:block :uuid])))
              (is (= 1 (:node_count result)))
              (is (false? (:truncated result)))
              (is (= [] (get-in result [:block :children]))))
            (js/queueMicrotask done))
          (p/catch (fn [error]
                     (is false (str "Childless tree regression failed: " (.-message error)))
                     (js/queueMicrotask done)))))))

(deftest get-block-tree-follows-nested-parents-and-handles-page-and-missing-roots
  (let [{:keys [page-uuid block-uuid conn api]} (page-fixture)
        child-uuid "00000000-0000-4000-8000-000000000163"
        missing-uuid "00000000-0000-4000-8000-000000000164"]
    (d/transact! conn [{:db/id 163 :block/uuid (uuid child-uuid) :block/title "Only child" :block/order "a1"
                       :block/parent 161 :block/page 161}])
    (async done
      (-> (p/let [tree (mcp-compat/get-block-tree api #js {"block_uuid" block-uuid})
                  root-only (mcp-compat/get-block-tree api #js {"block_uuid" block-uuid "max_depth" 0})
                  page (mcp-compat/get-block-tree api #js {"block_uuid" page-uuid})
                  missing (mcp-compat/get-block-tree api #js {"block_uuid" missing-uuid})]
            (is (true? (:found tree)))
            (is (= 2 (:node_count tree)))
            (is (= [child-uuid] (mapv :uuid (get-in tree [:block :children]))))
            (is (= 161 (get-in tree [:block :children 0 :page :id])))
            (is (= 1 (:node_count root-only)))
            (is (true? (:truncated root-only)))
            (is (= [] (get-in root-only [:block :children])))
            (is (false? (:found page)))
            (is (= "target is a page, not a block" (:reason page)))
            (is (false? (:found missing)))
            (js/queueMicrotask done))
          (p/catch (fn [error]
                     (is false (str "Nested tree regression failed: " (.-message error)))
                     (js/queueMicrotask done)))))))

(deftest block-tree-result-sorts-and-truncates-without-null-children
  (let [rows [{:uuid "late" :title "Late" :order "z" :parent_uuid "root"}
              {:uuid "early" :title "Early" :order "a" :parent_uuid "root"}]
        result (mcp-compat/block-tree-result "root" {:uuid "root" :title "Root"} rows 2 2)]
    (is (= 2 (:node_count result)))
    (is (true? (:truncated result)))
    (is (= ["early"] (mapv :uuid (get-in result [:block :children]))))
    (is (every? map? (get-in result [:block :children])))))

(deftest rename-page-resolves-and-verifies-a-native-uuid
  (let [{:keys [page-uuid api conn]} (page-fixture)]
    (async done
      (-> (p/let [result (mcp-compat/rename-page api #js {"page_uuid" page-uuid "new_title" "Renamed Fixture" "verbose" true})]
            (is (true? (:verified result)))
            (is (= page-uuid (get-in result [:verified_entities 0 :uuid])))
            (is (= "Renamed Fixture" (:block/title (d/entity @conn 160))))
            (js/queueMicrotask done))
          (p/catch (fn [error] (is false (.-message error)) (js/queueMicrotask done)))))))

(deftest uuid-tag-and-reference-queries-resolve-native-entity-ids
  (let [{:keys [page-uuid block-uuid api conn calls]} (page-fixture)
        tag-uuid "00000000-0000-4000-8000-000000000166"]
    (d/transact! conn [{:db/id 166 :block/uuid (uuid tag-uuid) :block/title "Test Tag" :block/tags [159]}
                      {:db/id 160 :block/tags [166]}
                      {:db/id 168 :db/ident :plugin.property/smoke-link :block/title "Link property"}
                      {:db/id 161 :block/refs [160] :plugin.property/smoke-link 160}])
    (async done
      (-> (p/let [tag (mcp-compat/get-tag api #js {"tag_uuid" tag-uuid})
                  holders (mcp-compat/get-tag-users api #js {"tag_uuid" tag-uuid})
                  links (mcp-compat/find-backlinks api #js {"target_uuid" page-uuid})]
            (is (true? (:found tag)))
            (is (= tag-uuid (:uuid tag)))
            (is (= [page-uuid] (mapv :uuid holders)))
            (is (some #(= "logseq.DB.getTagUsers" (first %)) @calls))
            (is (= [block-uuid] (mapv :uuid (:refs links))))
            (is (= block-uuid (get-in links [:property_values 0 :holder :uuid])))
            (js/queueMicrotask done))
          (p/catch (fn [error] (is false (.-message error)) (js/queueMicrotask done)))))))

(deftest tag-mutations-use-native-uuid-preflights-and-readbacks
  (let [{:keys [page-uuid api conn]} (page-fixture)]
    (async done
      (-> (p/let [created (mcp-compat/create-tag api #js {"title" "Audit Tag" "verbose" true})
                  tag-uuid (get-in created [:verified_state :uuid])
                  added (mcp-compat/add-tag api #js {"target_uuid" page-uuid "tag_uuid" tag-uuid})
                  holders (mcp-compat/get-tag-users api #js {"tag_uuid" tag-uuid})
                  removed (mcp-compat/remove-tag api #js {"target_uuid" page-uuid "tag_uuid" tag-uuid})
                  deleted (mcp-compat/delete-tag api #js {"tag_uuid" tag-uuid})]
            (is (true? (:verified created)))
            (is (true? (:verified added)))
            (is (= [page-uuid] (mapv :uuid holders)))
            (is (true? (:verified removed)))
            (is (true? (:verified deleted)))
            (is (nil? (d/entity @conn [:block/uuid (uuid tag-uuid)])))
            (is (= #{158} (set (map :db/id (:block/tags (d/entity @conn 160))))))
            (js/queueMicrotask done))
          (p/catch (fn [error] (is false (.-message error)) (js/queueMicrotask done)))))))

(deftest orphan-query-uses-a-native-page-uuid
  (let [{:keys [page-uuid api conn]} (page-fixture)
        child-uuid "00000000-0000-4000-8000-000000000163"]
    (d/transact! conn [{:db/id 163 :block/uuid (uuid child-uuid) :block/title "Nested" :block/order "a1"
                       :block/parent 161 :block/parent+ [160 161] :block/page 161}])
    (async done
      (-> (p/let [result (mcp-compat/find-orphans api #js {"page_uuid" page-uuid})]
            (is (= 1 (:count result)))
            (is (= [child-uuid] (mapv :uuid (:orphans result))))
            (is (= 161 (:db/id (:block/page (d/entity @conn 163)))))
            (js/queueMicrotask done))
          (p/catch (fn [error] (is false (.-message error)) (js/queueMicrotask done)))))))

(deftest create-property-verifies-sdk-metadata-and-reports-normalized-title
  (let [{:keys [api calls]} (page-fixture)]
    (async done
      (-> (p/let [result (mcp-compat/create-property api #js {"title" "MCP Smoke Prop"
                                                             "schema" #js {"type" "default" "cardinality" "one"}})
                  lookup (mcp-compat/get-property-ident api #js {"title" (get-in result [:verified_state :title])})]
            (is (true? (:verified result)))
            (is (= "MCPSmokeProp" (get-in result [:verified_state :title])))
            (is (= ":plugin.property._test_plugin/MCPSmokeProp" (:ident result)))
            (is (string/includes? (:diagnostic result) "normalized the title"))
            (is (true? (:found lookup)))
            (is (= ":plugin.property._test_plugin/MCPSmokeProp" (:ident lookup)))
            (is (= "default" (:type lookup)))
            (is (some #(= "logseq.DB.getPropertiesByTitle" (first %)) @calls))
            (js/queueMicrotask done))
          (p/catch (fn [error] (is false (.-message error)) (js/queueMicrotask done)))))))

(deftest create-property-still-rejects-a-genuine-serialized-type-mismatch
  (let [{:keys [api conn]} (page-fixture)
        wrapped-api (fn [method args]
                      (api method (if (= method "logseq.DB.upsertProperty")
                                    (assoc args 1 #js {"type" "default"}) args)))]
    (async done
      (-> (p/then (mcp-compat/create-property wrapped-api #js {"title" "Wrong Type" "schema" #js {"type" "number"}})
                  (fn [_] (is false "A genuine type mismatch must be rejected") (js/queueMicrotask done)))
          (p/catch (fn [error]
                     (is (string/includes? (.-message error) "not the requested"))
                     (is (string/includes? (.-message error) "default"))
                     (is (= :default (:logseq.property/type (d/entity @conn 201))))
                     (js/queueMicrotask done)))))))

(deftest add-property-verifies-a-serialized-false-value
  (let [target-uuid "00000000-0000-4000-8000-000000000021"
        ident ":plugin.property._test_plugin/Flag"
        written? (atom false)
        api (fn [method args]
              (case method
                "logseq.DB.upsertBlockProperty" (do (reset! written? true) nil)
                "logseq.DB.datascriptQuery"
                (let [query (first args)]
                  (cond
                    (string/includes? query "block/uuid #uuid")
                    (clj->js (cond-> {"id" 10 "uuid" target-uuid "title" "Target"}
                               @written? (assoc ident {:id 55})))
                    (string/includes? query "?e ?a _") #js [#js {"id" 55 ":logseq.property/value" false}]
                    :else #js {"id" 20 "ident" ident "title" "Flag" ":logseq.property/type" "default"}))
                nil))]
    (async done
      (-> (p/then (mcp-compat/add-property api #js {"target_uuid" target-uuid "property_ident" ident "value" false})
                  (fn [result]
                    (is (true? (:verified result)))
                    (is @written?)
                    (js/queueMicrotask done)))
          (p/catch (fn [error] (is false (.-message error)) (js/queueMicrotask done)))))))

(deftest page-title-read-preserves-compatibility-selection
  (let [{:keys [conn api page-uuid]} (page-fixture)
        page-id (fn [entity-id]
                  (uuid (str "00000000-0000-4000-8000-000000000" entity-id)))]
    (d/transact! conn [{:db/id 156 :db/ident :logseq.class/Journal}
                      {:db/id 162 :block/uuid (page-id 162) :block/title "Exact Title"
                       :block/name "fallback-name" :block/tags [158]}
                      {:db/id 163 :block/uuid (page-id 163) :block/title "Duplicate"
                       :block/name "duplicate-one" :block/tags [158]}
                      {:db/id 164 :block/uuid (page-id 164) :block/title "Duplicate"
                       :block/name "duplicate-two" :block/tags [158]}
                      {:db/id 165 :block/uuid (page-id 165) :block/title "Block only"
                       :block/parent 160 :block/page 160}
                      {:db/id 166 :block/uuid (page-id 166) :block/title "Fixture"
                       :block/name "fixture" :block/tags [158] :logseq.property/deleted-at 1}
                      {:db/id 167 :block/uuid (page-id 167) :block/title "Journal only"
                       :block/name "journal only" :block/tags [156]}
                      {:db/id 168 :block/uuid (page-id 168) :block/title "Class only"
                       :block/name "class only" :block/tags [159]}
                      {:db/id 169 :block/uuid (page-id 169) :block/title "Property only"
                       :block/name "property only" :block/tags [157]}])
    (async done
      (-> (p/let [results (p/all
                             (map (fn [title]
                                    (mcp-compat/get-page-uuid api #js {"title" title}))
                                  ["Fixture" "Exact Title" "FALLBACK-NAME" "Duplicate" "Missing"
                                   "Block only" "Journal only" "Class only" "Property only" ""]))]
              (is (= page-uuid (:page_uuid (first results))))
              (is (= (str (page-id 162)) (:page_uuid (nth results 1))))
              (is (= (str (page-id 162)) (:page_uuid (nth results 2))))
              (is (= 2 (count (:candidates (nth results 3)))))
              (is (false? (:found (nth results 3))))
              (is (every? #(false? (:found %)) (drop 4 results))))
          (p/then (fn [_] (js/queueMicrotask done)))
          (p/catch (fn [error] (is false (.-message error)) (js/queueMicrotask done)))))))

(deftest block-read-uses-existing-db-api
  (let [{:keys [page-uuid block-uuid conn]} (page-fixture)
        child-uuid "00000000-0000-4000-8000-000000000163"
        missing-uuid "00000000-0000-4000-8000-000000000164"
        calls (atom [])
        native-api (fn [method args]
                     (swap! calls conj [method args])
                     (apply api-editor/get_block args))
        get-block (fn [_graph id _opts]
                    (p/resolved (d/pull @conn '[*] (if (number? id) id [:block/uuid (if (uuid? id) id (uuid id))]))))
        get-children (fn [_graph parent-uuid]
                       (p/resolved (d/q '[:find [(pull ?child [*]) ...] :in $ ?uuid
                                         :where [?parent :block/uuid ?uuid] [?child :block/parent ?parent]]
                                       @conn parent-uuid)))]
    (d/transact! conn [{:db/id 163 :block/uuid (uuid child-uuid) :block/title "Nested block" :block/order "a1"
                       :block/parent 161 :block/page 160 :block/collapsed? true}
                      {:db/id 161 :plugin.property/smoke-link 160}])
    (async done
      (-> (p/with-redefs [state/get-current-repo (constantly "fixture")
                         db-async/<get-block get-block
                         db-async/<get-block-immediate-children get-children]
            (p/let [results (p/all (map (fn [uuid]
                                         (mcp-compat/get-block native-api #js {"block_uuid" uuid}))
                                       [block-uuid child-uuid page-uuid missing-uuid]))]
              (is (true? (:found (first results))))
              (is (= block-uuid (get-in (first results) [:block :uuid])))
              (is (= "Content" (get-in (first results) [:block :fullTitle])))
              (is (contains? (:block (first results)) :children))
              (is (true? (get-in (nth results 1) [:block :collapsed?])))
              (is (= "target is a page, not a block" (:reason (nth results 2))))
              (is (false? (:found (nth results 3))))
              (is (every? #(= "logseq.DB.getBlock" (first %)) @calls))
              (is (= 4 (count @calls)))
              (is (every? #(= 2 (count (second %))) @calls))
              (is (every? #(= {:includeChildren false :includePage true}
                             (js->clj (second (second %)) :keywordize-keys true)) @calls))))
          (p/then (fn [_] (js/queueMicrotask done)))
          (p/catch (fn [error] (is false (.-message error)) (js/queueMicrotask done)))))))

(deftest get-tag-uses-existing-db-api
  (let [tag-uuid "00000000-0000-4000-8000-000000000166"
        tag-ident ":plugin.class._test_plugin/SmokeTag"
        calls (atom [])
        api (recording-api calls #js {:id 166 :uuid tag-uuid :title "Smoke Tag"
                                      :name "smoke-tag" :ident tag-ident})]
    (async done
      (-> (mcp-compat/get-tag api #js {"tag_uuid" tag-uuid})
          (p/then (fn [tag]
                    (is (= [["logseq.DB.getTag" [tag-uuid]]] @calls))
                    (is (true? (:found tag)))
                    (is (= tag-uuid (:tag_uuid tag)))
                    (is (= "Smoke Tag" (:title tag)))
                    (is (= 166 (:id tag)))
                    (is (= "smoke-tag" (:name tag)))
                    (is (= tag-ident (:ident tag)))
                    (js/queueMicrotask done)))
          (p/catch (fn [error] (is false (.-message error)) (js/queueMicrotask done)))))))

(deftest block-read-preserves-db-page-classification-and-tagged-blocks
  (let [{:keys [page-uuid block-uuid conn api]} (page-fixture)
        journal-uuid "00000000-0000-4000-8000-000000000165"
        class-uuid "00000000-0000-4000-8000-000000000166"
        property-uuid "00000000-0000-4000-8000-000000000167"]
    (d/transact! conn [{:db/id 156 :db/ident :logseq.class/Journal}
                      {:db/id 165 :block/uuid (uuid journal-uuid) :block/title "Oct 3, 2026"
                       :block/name "oct 3, 2026" :block/journal-day 20261003 :block/tags [156]}
                      {:db/id 166 :block/uuid (uuid class-uuid) :block/title "Project"
                       :block/name "project" :db/ident :user.class/Project :block/tags [159]}
                      {:db/id 167 :block/uuid (uuid property-uuid) :block/title "Priority"
                       :block/name "priority" :db/ident :user.property/Priority :block/tags [157]}
                      {:db/id 161 :block/tags [166] :user.property/Priority false}])
    (async done
      (-> (p/let [pages (p/all (map (fn [page-id]
                                       (is (entity-util/page? (d/entity @conn [:block/uuid (uuid page-id)])))
                                       (mcp-compat/get-block api #js {"block_uuid" page-id}))
                                     [page-uuid journal-uuid class-uuid property-uuid]))
                    block (mcp-compat/get-block api #js {"block_uuid" block-uuid})]
              (doseq [page pages]
                (is (false? (:found page)))
                (is (= "target is a page, not a block" (:reason page))))
              (is (not (entity-util/page? (d/entity @conn [:block/uuid (uuid block-uuid)]))))
              (is (true? (:found block)))
              (is (= [{:id 166}] (get-in block [:block :tags])))
              (is (false? (get-in block [:block (keyword ":user.property/Priority")]))))
          (p/then (fn [_] (js/queueMicrotask done)))
          (p/catch (fn [error] (is false (.-message error)) (js/queueMicrotask done)))))))

(deftest block-read-preserves-application-errors
  (let [block-uuid "00000000-0000-4000-8000-000000000161"]
    (async done
      (-> (p/then (mcp-compat/get-block (fn [& _] #js {"error" "Application read failed"})
                                       #js {"block_uuid" block-uuid})
                  (fn [_] (is false "API errors must reject") (js/queueMicrotask done)))
          (p/catch (fn [error]
                     (is (= "Application read failed" (.-message error)))
                     (js/queueMicrotask done)))))))

(deftest block-read-refuses-a-different-entity-uuid
  (async done
    (-> (p/then (mcp-compat/get-block (fn [& _] #js {"uuid" "00000000-0000-4000-8000-000000000162"})
                                     #js {"block_uuid" "00000000-0000-4000-8000-000000000161"})
                (fn [_] (is false "Wrong UUID must reject") (js/queueMicrotask done)))
        (p/catch (fn [error]
                   (is (string/includes? (.-message error) "different UUID"))
                   (js/queueMicrotask done))))))

(deftest block-read-validates-uuid-before-calling-the-application-api
  (let [calls (atom [])]
    (is (thrown-with-msg? js/Error #"UUID"
                         (mcp-compat/get-block (recording-api calls nil) #js {"block_uuid" "invalid"})))
    (is (empty? @calls))))

(deftest block-read-is-registered-with-the-other-adapters
  (is (= mcp-compat/get-block (get-in mcp-server/data-tools [:getBlock :fn])))
  (is (= mcp-compat/get-page-uuid (get-in mcp-server/data-tools [:getPageUUID :fn])))
  (is (= mcp-compat/update-block (get-in mcp-server/data-tools [:updateBlock :fn]))))

(deftest mcp-server-starts-with-default-settings
  (let [server (mcp-server/create-mcp-api-server (fn [& _] nil))]
    (is (some? server))
    (async done
      (-> (p/then (.close server) (fn [_] (js/queueMicrotask done)))
          (p/catch (fn [error] (is false (.-message error)) (js/queueMicrotask done)))))))

(deftest delete-page-verifies-recycling-with-uuid-and-content-preserved
  (let [{:keys [page-uuid block-uuid conn api]} (page-fixture)]
    (async done
      (-> (p/then (mcp-compat/delete-page api #js {"page_uuid" page-uuid})
                  (fn [result]
                    (is (true? (:verified result)))
                    (is (= page-uuid (get-in result [:verified_entities 0 :uuid])))
                    (is (= 2 (count (:previous_entities result))))
                    (is (some? (d/entity @conn [:block/uuid (uuid block-uuid)])))
                    (done)))
          (p/catch (fn [error] (is false (.-message error)) (done)))))))

(deftest delete-page-refuses-alias-loss-without-writing
  (let [{:keys [page-uuid conn api calls]} (page-fixture)]
    (d/transact! conn [{:db/id 162 :block/uuid (uuid "00000000-0000-4000-8000-000000000162")
                       :block/title "Alias" :block/name "alias" :logseq.property/alias [160]}])
    (async done
      (-> (p/then (mcp-compat/delete-page api #js {"page_uuid" page-uuid "acknowledge_reference_rewrite" true})
                  (fn [result]
                    (is (false? (:verified result)))
                    (is (string/includes? (:diagnostic result) "acknowledge_alias_loss"))
                    (is (not-any? #(= "logseq.DB.deletePage" (first %)) @calls))
                    (done)))
          (p/catch (fn [error] (is false (.-message error)) (done)))))))

(deftest delete-page-refuses-inbound-reference-loss-without-writing
  (let [{:keys [page-uuid conn api calls]} (page-fixture)]
    (d/transact! conn [{:db/id 162 :block/uuid (uuid "00000000-0000-4000-8000-000000000162")
                       :block/title "Referrer" :block/refs [160]}])
    (async done
      (-> (p/then (mcp-compat/delete-page api #js {"page_uuid" page-uuid})
                  (fn [result]
                    (is (false? (:verified result)))
                    (is (string/includes? (:diagnostic result) "acknowledge_reference_rewrite"))
                    (is (= 1 (count (:observed_entities result))))
                    (is (not-any? #(= "logseq.DB.deletePage" (first %)) @calls))
                    (done)))
          (p/catch (fn [error] (is false (.-message error)) (done)))))))

(deftest clear-page-preserves-metadata-and-property-value-subtrees
  (let [{:keys [page-uuid conn api]} (page-fixture)
        value-uuid "00000000-0000-4000-8000-000000000163"]
    (d/transact! conn [{:db/id 160 :plugin.property/test "keep"}
                      {:db/id 163 :block/uuid (uuid value-uuid) :block/title "Property value"
                       :block/parent 160 :block/parent+ [160] :block/page 160
                       :logseq.property/created-from-property true}])
    (async done
      (-> (p/then (mcp-compat/clear-page api #js {"page_uuid" page-uuid})
                  (fn [result]
                    (is (true? (:verified result)))
                    (is (= 1 (:preserved_property_blocks result)))
                    (is (= "keep" (:plugin.property/test (d/entity @conn 160))))
                    (is (some? (d/entity @conn [:block/uuid (uuid value-uuid)])))
                    (is (nil? (d/entity @conn 161)))
                    (done)))
          (p/catch (fn [error] (is false (.-message error)) (done)))))))

(deftest clear-page-refuses-nested-pages-before-writing
  (let [{:keys [page-uuid conn api calls]} (page-fixture)]
    (d/transact! conn [{:db/id 164 :block/uuid (uuid "00000000-0000-4000-8000-000000000164")
                       :block/title "Nested page" :block/name "nested" :block/parent 160 :block/parent+ [160]}])
    (async done
        (-> (p/then (mcp-compat/clear-page api #js {"page_uuid" page-uuid})
              (fn [result]
               (is (false? (:verified result)))
               (is (string/includes? (:diagnostic result) "nested pages"))
                     (is (not-any? #(= "logseq.DB.removeBlock" (first %)) @calls))
               (done)))
          (p/catch (fn [error] (is false (.-message error)) (done)))))))

(deftest retitle-over-duplicate-parks-a-recycled-holder-with-identity-preserved
  (let [{:keys [page-uuid conn api]} (page-fixture)
        holder-uuid "00000000-0000-4000-8000-000000000165"]
    (d/transact! conn [{:db/id 165 :block/uuid (uuid holder-uuid) :block/name "wanted"
                       :block/title "Wanted" :logseq.property/deleted-at 1}])
    (async done
      (-> (p/then (mcp-compat/retitle-over-duplicate api #js {"from_uuid" page-uuid "to_title" "Wanted"})
                  (fn [result]
                    (is (true? (:verified result)))
                    (is (= page-uuid (get-in result [:renamed :uuid])))
                    (is (= holder-uuid (get-in result [:parked :uuid])))
                    (is (= "Wanted (parked)" (:block/title (d/entity @conn 165))))
                    (is (= 1 (:logseq.property/deleted-at (d/entity @conn 165))))
                    (is (= "Wanted" (:block/title (d/entity @conn 160))))
                    (done)))
          (p/catch (fn [error] (is false (.-message error)) (done)))))))

(deftest retitle-over-duplicate-reports-how-to-undo-a-partial-rename
  (let [{:keys [page-uuid conn api]} (page-fixture)
        holder-uuid "00000000-0000-4000-8000-000000000165"
        wrapped-api (fn [method args]
                      (if (and (= method "logseq.DB.renamePage") (= (first args) page-uuid))
                        nil (api method args)))]
    (d/transact! conn [{:db/id 165 :block/uuid (uuid holder-uuid) :block/name "wanted" :block/title "Wanted"}])
    (async done
      (-> (p/then (mcp-compat/retitle-over-duplicate wrapped-api #js {"from_uuid" page-uuid "to_title" "Wanted"})
                  (fn [result]
                    (is (false? (:verified result)))
                    (is (= holder-uuid (get-in result [:parked :uuid])))
                    (is (string/includes? (:diagnostic result) holder-uuid))
                    (is (= "Fixture" (:block/title (d/entity @conn 160))))
                    (done)))
          (p/catch (fn [error] (is false (.-message error)) (done)))))))

(deftest outline-validation-detects-indentation-before-writing
  (is (= [{:path [0] :title "Parent"} {:path [0 0] :title "Child"}
          {:path [1] :title "Sibling"}]
         (mcp-compat/parse-outline "- Parent\n  - Child\n- Sibling")))
  (doseq [outline ["  Starts nested" "Parent\n  Child\n   Broken" "Parent\n  Child\n      Skipped"]]
    (let [calls (atom [])]
      (is (try (mcp-compat/create-page-of-blocks (recording-api calls nil)
                                               #js {"page_uuid" "00000000-0000-4000-8000-000000000160" "outline" outline})
               false (catch :default _ true)))
      (is (empty? @calls)))))

(deftest outline-creation-verifies-batched-parent-and-child-levels
  (let [{:keys [page-uuid api conn calls]} (page-fixture)]
    (async done
      (-> (p/then (mcp-compat/create-page-of-blocks
                   api #js {"page_uuid" page-uuid "outline" "- Parent\n  - Child\n- Sibling"})
                  (fn [result]
                    (is (true? (:verified result)))
                    (is (= 3 (:created_count result)))
                    (is (= 2 (:calls result)))
                    (is (= 201 (:db/id (:block/parent (d/entity @conn 203)))))
                    (is (= 160 (:db/id (:block/page (d/entity @conn 203)))))
                    (is (= 2 (count (filter #(= "logseq.DB.insertBatchBlock" (first %)) @calls))))
                    (done)))
          (p/catch (fn [error] (is false (.-message error)) (done)))))))

(deftest outline-dry-run-does-not-insert-any-blocks
  (let [{:keys [page-uuid api calls]} (page-fixture)]
    (async done
      (-> (p/then (mcp-compat/create-page-of-blocks
                   api #js {"page_uuid" page-uuid "outline" "Parent\n  Child" "dry_run" true})
                  (fn [result]
                    (is (false? (:verified result)))
                    (is (= 2 (:block_count result)))
                    (is (= 2 (:estimated_calls result)))
                    (is (every? #(= "logseq.DB.datascriptQuery" (first %)) @calls))
                    (done)))
          (p/catch (fn [error] (is false (.-message error)) (done)))))))

(deftest import-parser-preserves-verbatim-content-and-escapes-references
  (let [parsed (mcp-compat/parse-import ["  manuscript\n\n[[Page]] #[[Multi Tag]] #tag"
                                        {:text "Child" :depth 1}])]
    (is (= "  manuscript\n\n{{link:Page}} {{tag:Multi Tag}} {{tag:tag}}"
           (get-in parsed [:entries 0 :title])))
    (is (= [0 0] (get-in parsed [:entries 1 :path])))
    (is (= ["Page"] (:escaped_links parsed)))
    (is (= ["Multi Tag" "tag"] (:escaped_tags parsed))))
  (is (= "first\ncontinuation" (get-in (mcp-compat/parse-import "type:: note\n- first\ncontinuation") [:entries 0 :title])))
  (doseq [input ["discard me\n- block" [{:text "Skipped" :depth 1}] ["first\n- truncated"]]]
    (is (try (mcp-compat/parse-import input) false (catch :default _ true)))))

(deftest import-parser-distinguishes-markdown-and-verbatim-blank-lines
  (let [text "Multiline first line\nsecond line of same block\n\nthird line after blank"
        markdown (mcp-compat/parse-import (str "- " text))
        block-list (mcp-compat/parse-import #js [#js {"text" text "depth" 0}])
        encoded-list (mcp-compat/parse-import (js/JSON.stringify #js [#js {"text" text "depth" 0}]))]
    (is (= "Multiline first line\nsecond line of same block\nthird line after blank"
           (get-in markdown [:entries 0 :title])))
    (is (false? (get-in markdown [:entries 0 :verbatim])))
    (is (= text (get-in block-list [:entries 0 :title])))
    (is (true? (get-in block-list [:entries 0 :verbatim])))
    (is (= text (get-in encoded-list [:entries 0 :title])))))

(deftest import-page-verifies-verbatim-content-and-inventory-delta
  (let [{:keys [page-uuid api conn]} (page-fixture)]
    (async done
      (-> (p/then (mcp-compat/import-page api #js {"target" page-uuid
                                                 "markdown" #js ["  Text\n\n[[Future Page]]"]})
                  (fn [result]
                    (is (true? (:verified result)))
                    (is (= 1 (:blocks result)))
                    (is (= ["Future Page"] (:escaped_links result)))
                    (is (= "  Text\n\n{{link:Future Page}}" (:block/title (d/entity @conn 201))))
                    (is (some? (d/entity @conn 161)))
                    (done)))
          (p/catch (fn [error] (is false (.-message error)) (done)))))))

(deftest import-page-dry-run-never-resolves-or-creates-a-target
  (let [calls (atom [])]
    (async done
      (-> (p/then (mcp-compat/import-page (recording-api calls nil)
                                         #js {"target" "New Page" "markdown" "- Content" "dry_run" true})
                  (fn [result]
                    (is (false? (:verified result)))
                    (is (= 1 (:blocks result)))
                    (is (empty? @calls))
                    (done)))
          (p/catch (fn [error] (is false (.-message error)) (done)))))))

(deftest repair-links-verifies-reference-relations-and-leaves-missing-names-and-macros
  (let [{:keys [page-uuid conn api]} (page-fixture)
        linked-uuid "00000000-0000-4000-8000-000000000166"
        tag-uuid "00000000-0000-4000-8000-000000000167"]
    (d/transact! conn [{:db/id 166 :block/uuid (uuid linked-uuid) :block/name "existing" :block/title "Existing" :block/tags [158]}
                      {:db/id 167 :block/uuid (uuid tag-uuid) :block/name "tag" :block/title "Tag" :block/tags [159]}
                      {:db/id 161 :block/title "{{link:Existing}} {{link:Missing}} {{tag:Tag}} {{Macro}}"}])
    (async done
      (-> (p/then (mcp-compat/repair-links api #js {"page_uuid" page-uuid "include_tags" true})
                  (fn [result]
                    (is (true? (:verified result)))
                    (is (= 1 (:blocks_updated result)))
                    (is (= ["Missing"] (:missing result)))
                    (is (= (str "[[" linked-uuid "]] {{link:Missing}} #[[" tag-uuid "]] {{Macro}}")
                           (:block/title (d/entity @conn 161))))
                    (is (= #{166} (set (map :db/id (:block/refs (d/entity @conn 161))))))
                    (is (= #{167} (set (map :db/id (:block/tags (d/entity @conn 161))))))
                    (done)))
          (p/catch (fn [error] (is false (.-message error)) (done)))))))

(deftest repair-links-uses-tag-titles-without-minting-uuid-named-tags
  (let [{:keys [page-uuid conn api calls]} (page-fixture)
        tag-uuid "00000000-0000-4000-8000-000000000167"
        tag-title "Multi Word Ref Tag"]
    (d/transact! conn [{:db/id 167 :block/uuid (uuid tag-uuid) :block/title tag-title :block/tags [159]}
                      {:db/id 161 :block/title (str "{{tag:" tag-title "}}") }])
    (async done
      (-> (p/let [result (mcp-compat/repair-links api #js {"page_uuid" page-uuid "include_tags" true "create_missing" false})
                  tag-count (d/q '[:find (count ?tag) . :where [?tag :block/tags 159]] @conn)
                  writes (filter #(= "logseq.DB.updateBlock" (first %)) @calls)
                  _ (reset! calls [])
                  rerun (mcp-compat/repair-links api #js {"page_uuid" page-uuid "include_tags" true "create_missing" false})]
            (is (true? (:verified result)))
            (is (= 1 (:blocks_updated result)))
            (is (= "#[[Multi Word Ref Tag]]" (second (second (first writes)))))
            (is (= #{167} (set (map :db/id (:block/tags (d/entity @conn 161))))))
            (is (= 1 tag-count))
            (is (nil? (d/q '[:find ?tag . :in $ ?title :where [?tag :block/title ?title]] @conn tag-uuid)))
            (is (true? (:verified rerun)))
            (is (= 0 (:blocks_updated rerun)))
            (is (every? #(= "logseq.DB.datascriptQuery" (first %)) @calls))
            (js/queueMicrotask done))
          (p/catch (fn [error] (is false (.-message error)) (js/queueMicrotask done)))))))

(deftest repair-links-page-approval-does-not-approve-missing-tags
  (let [{:keys [page-uuid conn api calls]} (page-fixture)]
    (d/transact! conn [{:db/id 161 :block/title "{{tag:MissingTag}}"}])
    (async done
      (-> (p/then (mcp-compat/repair-links api #js {"page_uuid" page-uuid "include_tags" true
                                                  "create_missing" true "acknowledge_page_creation" true})
                  (fn [result]
                    (is (false? (:verified result)))
                    (is (= ["MissingTag"] (:would_create_tags result)))
                    (is (every? #(= "logseq.DB.datascriptQuery" (first %)) @calls))
                    (is (= "{{tag:MissingTag}}" (:block/title (d/entity @conn 161))))
                    (done)))
          (p/catch (fn [error] (is false (.-message error)) (done)))))))

(deftest repair-links-creates-an-acknowledged-missing-page-then-verifies-its-reference
  (let [{:keys [page-uuid conn api]} (page-fixture)]
    (d/transact! conn [{:db/id 161 :block/title "{{link:New Page}}"}])
    (async done
      (-> (p/then (mcp-compat/repair-links api #js {"page_uuid" page-uuid "create_missing" true
                                                  "acknowledge_page_creation" true "max_pages_to_create" 1})
                  (fn [result]
                    (is (true? (:verified result)) (pr-str (:unverified result)))
                    (is (= 1 (count (:created_pages result))))
                    (is (= [] (:missing result)))
                    (is (= "New Page" (:block/title (d/entity @conn 201))))
                    (is (= #{201} (set (map :db/id (:block/refs (d/entity @conn 161))))))
                    (done)))
          (p/catch (fn [error] (is false (.-message error)) (done)))))))

(deftest repair-links-global-scan-finds-tag-only-placeholders
  (let [{:keys [conn api]} (page-fixture)
        tag-uuid "00000000-0000-4000-8000-000000000167"]
    (d/transact! conn [{:db/id 167 :block/uuid (uuid tag-uuid) :block/name "tag" :block/title "Tag" :block/tags [159]}
                      {:db/id 161 :block/title "{{tag:Tag}}"}])
    (async done
      (-> (p/then (mcp-compat/repair-links api #js {"include_tags" true})
                  (fn [result]
                    (is (true? (:verified result)))
                    (is (= 1 (:pages_scanned result)))
                    (is (= 1 (:blocks_updated result)))
                    (is (= (str "#[[" tag-uuid "]]") (:block/title (d/entity @conn 161))))
                    (done)))
          (p/catch (fn [error] (is false (.-message error)) (done)))))))

(deftest repair-links-ambiguous-targets-are-not-guessed
  (let [{:keys [page-uuid conn api calls]} (page-fixture)]
    (d/transact! conn [{:db/id 166 :block/uuid (uuid "00000000-0000-4000-8000-000000000166")
                       :block/name "duplicate1" :block/title "Duplicate" :block/tags [158]}
                      {:db/id 167 :block/uuid (uuid "00000000-0000-4000-8000-000000000167")
                       :block/name "duplicate2" :block/title "Duplicate" :block/tags [158]}
                      {:db/id 161 :block/title "{{link:Duplicate}}"}])
    (async done
      (-> (p/then (mcp-compat/repair-links api #js {"page_uuid" page-uuid "create_missing" true
                                                  "acknowledge_page_creation" true})
                  (fn [result]
                    (is (= ["Duplicate"] (:ambiguous result)))
                    (is (= 0 (:blocks_updated result)))
                    (is (every? #(= "logseq.DB.datascriptQuery" (first %)) @calls))
                    (done)))
          (p/catch (fn [error] (is false (.-message error)) (done)))))))

(deftest repair-links-dry-run-and-creation-cap-make-no-writes
  (let [{:keys [page-uuid conn api calls]} (page-fixture)]
    (d/transact! conn [{:db/id 161 :block/title "{{link:Missing}}"}])
    (async done
      (-> (p/let [dry (mcp-compat/repair-links api #js {"page_uuid" page-uuid "dry_run" true})
                  capped (mcp-compat/repair-links api #js {"page_uuid" page-uuid "create_missing" true
                                                           "acknowledge_page_creation" true "max_pages_to_create" 0})]
            (is (false? (:verified dry)))
            (is (false? (:verified capped)))
            (is (= ["Missing"] (:would_create capped)))
            (is (every? #(= "logseq.DB.datascriptQuery" (first %)) @calls))
            (js/queueMicrotask done))
          (p/catch (fn [error] (is false (.-message error)) (js/queueMicrotask done)))))))

(deftest repair-links-is-idempotent-after-a-verified-repair
  (let [{:keys [page-uuid conn api calls]} (page-fixture)]
    (d/transact! conn [{:db/id 161 :block/title "{{link:Fixture}}"}])
    (async done
      (-> (p/let [first-result (mcp-compat/repair-links api #js {"page_uuid" page-uuid})
                  _ (reset! calls [])
                  second-result (mcp-compat/repair-links api #js {"page_uuid" page-uuid})]
            (is (true? (:verified first-result)))
            (is (true? (:verified second-result)))
            (is (= 0 (:blocks_updated second-result)))
            (is (every? #(= "logseq.DB.datascriptQuery" (first %)) @calls))
            (js/queueMicrotask done))
          (p/catch (fn [error] (is false (.-message error)) (js/queueMicrotask done)))))))

(deftest move-block-queries-use-native-uuid-types-and-json-normalization
  (let [page-uuid "00000000-0000-4000-8000-000000000150"
        source-uuid "00000000-0000-4000-8000-000000000151"
        child-uuid "00000000-0000-4000-8000-000000000152"
        conn (d/create-conn {:block/uuid {:db/unique :db.unique/identity}
                             :block/parent {:db/valueType :db.type/ref}
                             :block/page {:db/valueType :db.type/ref}
                             :block/parent+ {:db/valueType :db.type/ref :db/cardinality :db.cardinality/many}})
        api (fn [method args]
              (case method
                "logseq.DB.datascriptQuery"
                (clj->js (sdk-utils/normalize-keyword-for-json
                           (apply d/q (reader/read-string (first args)) @conn
                                  (map #(if (string? %) (reader/read-string %) %) (rest args))) false))
                "logseq.DB.moveBlock"
                (do (d/transact! conn [{:db/id 151 :block/parent 150 :block/page 150 :block/order "a1"}
                                      {:db/id 152 :block/page 150}]) nil)
                nil))]
    (d/transact! conn [{:db/id 149 :block/uuid (uuid "00000000-0000-4000-8000-000000000149")
                       :block/title "Old page" :block/name "old"}
                      {:db/id 150 :block/uuid (uuid page-uuid) :block/title "Target" :block/name "target"}
                      {:db/id 151 :block/uuid (uuid source-uuid) :block/title "Source"
                       :block/parent 149 :block/page 149 :block/order "a0"}
                      {:db/id 152 :block/uuid (uuid child-uuid) :block/title "Child"
                       :block/parent 151 :block/parent+ [151] :block/page 149 :block/order "a0"}])
    (async done
      (-> (p/then (mcp-compat/move-block api #js {"block_uuid" source-uuid "target_uuid" page-uuid})
                  (fn [result]
                    (is (true? (:verified result)))
                    (is (= source-uuid (get-in result [:verified_entities 0 :uuid])))
                    (is (= 150 (get-in result [:verified_entities 0 :parent :id])))
                    (is (= 150 (:db/id (:block/page (d/entity @conn 152)))))
                    (done)))
          (p/catch (fn [error]
                     (is false (str "Native-shaped query test failed: " (.-message error)))
                     (done)))))))

    (deftest split-block-parts-preserves-literal-delimiters-and-unicode-offsets
      (is (= ["one" "two" "three"] (mcp-compat/split-block-parts "one.*two.*three" nil ".*")))
      (is (= ["a" "b"] (mcp-compat/split-block-parts "ab" 1 nil)))
      (is (= [(js/String.fromCodePoint 128512) "x"]
        (mcp-compat/split-block-parts (str (js/String.fromCodePoint 128512) "x") 1 nil)))
      (doseq [[title offset delimiter] [["a b" 1 nil] ["a::" nil "::"] ["ab" nil "z"]
              ["ab" nil nil] ["ab" 1 "b"]]]
        (is (try (mcp-compat/split-block-parts title offset delimiter) false
            (catch :default _ true)))))

(deftest move-blocks-validates-before-reading-or-writing
  (let [uuid "00000000-0000-4000-8000-000000000110"
        target "00000000-0000-4000-8000-000000000111"
        calls (atom [])
        api (recording-api calls nil)]
    (doseq [args [#js {"block_uuids" #js [] "target_uuid" target}
                 #js {"block_uuids" #js [uuid uuid] "target_uuid" target}
                 #js {"block_uuids" #js [uuid] "target_uuid" uuid}]]
      (is (try (mcp-compat/move-blocks api args) false (catch :default _ true))))
    (is (empty? @calls))))

(defn- split-fixture
  [move-succeeds?]
  (let [root-uuid "00000000-0000-4000-8000-000000000110"
        calls (atom [])
        counter (atom 110)
        entities (atom {root-uuid {:id 110 :uuid root-uuid :title "head|tail|end" :order "A"
                                   :parent {:id 90} :page {:id 90}}})
        api (fn [method args]
              (swap! calls conj [method args])
              (case method
                "logseq.DB.datascriptQuery"
                (let [query (first args)]
                  (cond
                    (string/includes? query "block/uuid #uuid") (get @entities root-uuid)
                    (string/includes? query "pull ?child")
                    (vec (filter #(= (second args) (get-in % [:parent :id])) (vals @entities)))
                    (string/includes? query "?descendant") []
                    :else (get @entities (str (reader/read-string (second args))))))
                "logseq.DB.insertBlock"
                (let [id (swap! counter inc)
                      uuid (str "00000000-0000-4000-8000-000000000" id)]
                  (swap! entities assoc uuid {:id id :uuid uuid :title (second args) :order (str id)
                                             :parent {:id 110} :page {:id 90}})
                  #js {:uuid uuid})
                "logseq.DB.moveBlock"
                (do
                  (when move-succeeds?
                    (swap! entities update (first args) assoc
                           :parent {:id 90} :order (str (:order (get @entities (second args))) "V")))
                  nil)
                "logseq.DB.updateBlock"
                (do (swap! entities update (first args) assoc :title (second args)) nil)
                nil))]
    {:root_uuid root-uuid :entities entities :calls calls :api api}))

(defn- batch-fixture
  []
  (let [fixture (split-fixture true)
        uuids (mapv #(str "00000000-0000-4000-8000-000000000" %) [111 112 113])]
    (doseq [[uuid id] (map vector uuids [111 112 113])]
      (swap! (:entities fixture) assoc uuid
             {:id id :uuid uuid :title (str id) :order (str id)
              :parent {:id 110 :uuid (:root_uuid fixture)} :page {:id 90}}))
    (assoc fixture :uuids uuids)))

(deftest move-blocks-chains-moves-in-supplied-order
  (let [{:keys [root_uuid uuids api calls]} (batch-fixture)]
    (async done
      (-> (p/then (mcp-compat/move-blocks
                   api #js {"block_uuids" (clj->js uuids) "target_uuid" root_uuid "placement" "after"})
                  (fn [result]
                    (is (true? (:verified result)))
                    (is (true? (:order_preserved result)))
                    (is (= 3 (get-in result [:summary :landed])))
                    (is (= [root_uuid (first uuids) (second uuids)]
                           (mapv #(second (second %)) (filter #(= "logseq.DB.moveBlock" (first %)) @calls))))
                    (done)))
          (p/catch (fn [error]
                     (is false (str "moveBlocks failed: " (.-message error)))
                     (done)))))))

(deftest migrate-page-dry-run-selects-only-literal-top-level-matches
  (let [{:keys [root_uuid uuids api calls entities]} (batch-fixture)
        target-uuid "00000000-0000-4000-8000-000000000140"]
    (swap! entities update root_uuid assoc :name "source")
    (swap! entities assoc target-uuid {:id 140 :uuid target-uuid :name "target" :title "Target"})
    (async done
      (-> (p/then (mcp-compat/migrate-page api #js {"source_uuid" root_uuid "target_uuid" target-uuid
                                                  "contains" "112" "dry_run" true})
                  (fn [result]
                    (is (false? (:verified result)))
                    (is (= [(second uuids)] (mapv :uuid (:planned result))))
                    (is (= 3 (:remaining result)))
                    (is (every? #(= "logseq.DB.datascriptQuery" (first %)) @calls))
                    (done)))
          (p/catch (fn [error]
                     (is false (str "migratePage failed: " (.-message error)))
                     (done)))))))

(deftest move-blocks-stops-and-reports-the-unattempted-remainder
  (let [{:keys [root_uuid uuids api]} (batch-fixture)
        wrapped-api (fn [method args]
                      (if (and (= method "logseq.DB.moveBlock") (= (first args) (second uuids)))
                        nil
                        (api method args)))]
    (async done
      (-> (p/then (mcp-compat/move-blocks
                   wrapped-api #js {"block_uuids" (clj->js uuids) "target_uuid" root_uuid "placement" "after"})
                  (fn [result]
                    (is (false? (:verified result)))
                    (is (= [true false] (mapv :verified (:moved result))))
                    (is (= [(last uuids)] (:not_attempted result)))
                    (is (= 1 (get-in result [:summary :landed])))
                    (done)))
          (p/catch (fn [error]
                     (is false (str "moveBlocks failed: " (.-message error)))
                     (done)))))))

(deftest split-block-truncates-only-after-verified-tail-placement
  (let [{:keys [root_uuid entities calls api]} (split-fixture true)]
    (async done
      (-> (p/then (mcp-compat/split-block api #js {"block_uuid" root_uuid "delimiter" "|"})
                  (fn [result]
                    (is (true? (:verified result)))
                    (is (= 3 (:parts result)))
                    (is (= 2 (count (:created result))))
                    (is (every? #(= 90 (:parent %)) (:created result)))
                    (is (= "head" (:title (get @entities root_uuid))))
                    (is (every? #(= 90 (get-in % [:parent :id])) (vals @entities)))
                    (let [writes (filter #(not= "logseq.DB.datascriptQuery" (first %)) @calls)]
                      (is (= ["logseq.DB.insertBlock" "logseq.DB.insertBlock"
                              "logseq.DB.moveBlock" "logseq.DB.moveBlock" "logseq.DB.updateBlock"]
                             (mapv first writes))))
                    (done)))
          (p/catch (fn [error]
                     (is false (str "splitBlock failed: " (.-message error)))
                     (done)))))))

(deftest split-block-preserves-original-when-a-tail-move-does-not-verify
  (let [{:keys [root_uuid entities calls api]} (split-fixture false)]
    (async done
      (-> (p/then (mcp-compat/split-block api #js {"block_uuid" root_uuid "delimiter" "|"})
                  (fn [result]
                    (is (false? (:verified result)))
                    (is (= "head|tail|end" (:title (get @entities root_uuid))))
                    (is (not-any? #(= "logseq.DB.updateBlock" (first %)) @calls))
                    (done)))
          (p/catch (fn [error]
                     (is false (str "splitBlock failed: " (.-message error)))
                     (done)))))))

(deftest compatibility-routes-preserve-api-contracts
  (let [calls (atom [])
  api (recording-api calls :ok)]
    (is (= :ok (mcp-compat/get-page api #js {"pageName" "Inbox"})))
    (is (= :ok (mcp-compat/list-pages api #js {"expand" true})))
    (is (= :ok (mcp-compat/list-tags api #js {"expand" false})))
    (is (= :ok (mcp-compat/list-properties api #js {"expand" true})))
    (is (= :ok (mcp-compat/search-blocks api #js {"searchTerm" "needle"})))
    (is (= ["logseq.cli.getPageData" ["Inbox"]]
           (first @calls)))
    (is (= "logseq.DB.listPages" (first (second @calls))))
    (is (= true (aget (first (second (second @calls))) "expand")))
    (is (= "logseq.DB.listTags" (first (nth @calls 2))))
    (is (= false (aget (first (second (nth @calls 2))) "expand")))
    (is (= "logseq.DB.listProperties" (first (nth @calls 3))))
    (is (= true (aget (first (second (nth @calls 3))) "expand")))
    (is (= ["logseq.app.search" "needle"]
          [(first (nth @calls 4)) (first (second (nth @calls 4)))]))))

(deftest capabilities-reports-only-the-registered-reference-routes
  (let [calls (atom [])
        api (fn [method args]
              (swap! calls conj [method args])
              (case method
                "logseq.App.getAppInfo" #js {"version" "2.0.1" "supportDb" true}
                "logseq.App.checkCurrentIsDbGraph" true
                "logseq.DB.getTagsByName" nil
                #js []))]
    (async done
      (-> (p/then (mcp-compat/capabilities api #js {"include_diagnostics" true})
                  (fn [result]
                    (is (= "2.0.1" (get-in result [:graph :version])))
                    (is (true? (get-in result [:graph :version_matches])))
                    (is (= "unknown" (get-in result [:tools :getTagUUID :state])))
                    (is (some #{"getTagUUID"} (:unknown result)))
                    (is (some #(= "logseq.DB.getTag" (first %)) @calls))
                    (is (some #(= "logseq.DB.getBlock" (first %)) @calls))
                    (is (some #(= "logseq.DB.listPages" (first %)) @calls))
                    (is (some #(= "logseq.DB.listTags" (first %)) @calls))
                    (is (some #(= "logseq.DB.listProperties" (first %)) @calls))
                    (is (some #(= "logseq.DB.inspectPage" (first %)) @calls))
                    (is (some #(= "logseq.DB.getPropertiesByTitle" (first %)) @calls))
                    (is (some #(= "logseq.DB.getPageStats" (first %)) @calls))
                    (is (some #(= "logseq.DB.getPageBlockUUIDs" (first %)) @calls))
                    (is (not (contains? (:tools result) :upsertNodes)))
                    (is (not (contains? (get-in result [:diagnostics :routes]) "upsertNodes")))
                    (is (not-any? #(= "logseq.cli.upsertNodes" (first %)) @calls))
                      (is (some #(and (= "logseq.DB.upsertProperty" (first %))
                                (= "__mcp_capability_probe__/invalid"
                                  (first (second %))))
                            @calls))
                    (is (= 2 (count (filter #(string/starts-with? (first %) "logseq.App.") @calls))))
                    (done)))
          (p/catch (fn [error]
                     (is false (str error))
                    (done)))))))

(deftest capabilities-refuses-non-db-graphs
  (let [api (fn [method _args]
              (js/Promise.resolve (case method
                "logseq.App.getAppInfo" #js {"version" "2.0.1" "supportDb" true}
                "logseq.App.checkCurrentIsDbGraph" false
                #js [])))]
    (async done
      (-> (p/then (mcp-compat/capabilities api #js {})
                  (fn [_]
                    (is false "capabilities should reject a non-DB graph")
                    (done)))
          (p/catch (fn [error]
                     (is (string/includes? (.-message error) "not a DB graph"))
                     (done)))))))

(deftest capability-rejection-does-not-contaminate-an-independent-read
  (let [{:keys [block-uuid api]} (page-fixture)
        denied-calls (atom [])
        denied-api (fn [method args]
                     (swap! denied-calls conj [method args])
                     (case method
                       "logseq.App.getAppInfo" #js {"version" "2.0.1" "supportDb" true}
                       "logseq.App.checkCurrentIsDbGraph" false
                       nil))]
    (async done
      (-> (p/let [results (p/all [(p/catch (mcp-compat/capabilities denied-api #js {})
                                          (fn [error] (.-message error)))
                                  (mcp-compat/get-block api #js {"block_uuid" block-uuid})])]
            (is (string/includes? (first results) "not a DB graph"))
            (is (true? (:found (second results))))
            (is (= block-uuid (get-in (second results) [:block :uuid])))
            (is (= ["logseq.App.getAppInfo" "logseq.App.checkCurrentIsDbGraph"]
                   (mapv first @denied-calls)))
            (js/queueMicrotask done))
          (p/catch (fn [error] (is false (.-message error)) (js/queueMicrotask done)))))))

(deftest create-page-refuses-title-collisions-before-writing
  (let [calls (atom [])
        api (fn [method args]
              (swap! calls conj [method args])
              (if (string/includes? (first args) "block/title ?title")
                [{:uuid "existing-page" :title "Taken" :name "taken"
                  :tags [{:ident :logseq.class/Page}]}]
                nil))]
    (async done
      (-> (p/then (mcp-compat/create-page api #js {"title" "Taken"})
                  (fn [_]
                    (is false "createPage should reject a held title")
                    (done)))
          (p/catch (fn [error]
                     (is (string/includes? (.-message error) "already exists"))
                     (is (not-any? #(= "logseq.DB.createPage" (first %)) @calls))
                     (done)))))))

(deftest create-page-verifies-its-uuid-and-dry-run-does-not-write
  (let [title "Fresh Test Page"
        page-uuid "00000000-0000-4000-8000-000000000081"
        calls (atom [])
        api (fn [method args]
              (swap! calls conj [method args])
              (case method
                "logseq.DB.createPage" #js {:uuid page-uuid}
                "logseq.DB.datascriptQuery"
                (let [query (first args)]
                  (cond
                    (string/includes? query "where [?entity :block/title ?title]") []
                    (string/includes? query "?class :db/ident :logseq.class/Page")
                    {:id 81 :uuid page-uuid :name "fresh test page" :title title}
                    :else nil))
                nil))]
    (async done
      (-> (p/then (mcp-compat/create-page api #js {"title" title "verbose" true})
                  (fn [result]
                    (is (true? (:verified result)))
                    (is (= page-uuid (get-in result [:verified_entities 0 :uuid])))
                    (is (some #(= "logseq.DB.createPage" (first %)) @calls))
                    (reset! calls [])
                    (p/then (mcp-compat/create-page api #js {"title" "Dry Run Page" "dry_run" true})
                            (fn [dry-run]
                              (is (false? (:verified dry-run)))
                              (is (empty? (filter #(= "logseq.DB.createPage" (first %)) @calls)))
                              (done)))))
          (p/catch (fn [error]
                     (is false (str "createPage unexpectedly failed: " (.-message error)))
                     (done)))))))

(deftest rename-page-verifies-the-original-uuid
  (let [page-uuid "00000000-0000-4000-8000-000000000085"
        title (atom "Before")
        calls (atom [])
        api (fn [method args]
              (swap! calls conj [method args])
              (case method
                "logseq.DB.renamePage" (do (reset! title (second args)) nil)
                "logseq.DB.datascriptQuery"
                (let [query (first args)]
                  (if (string/includes? query "block/title ?title")
                    []
                    {:id 85 :uuid page-uuid :name (string/lower-case @title) :title @title}))
                nil))]
    (async done
      (-> (p/then (mcp-compat/rename-page api #js {"page_uuid" page-uuid "new_title" "After" "verbose" true})
                  (fn [result]
                    (is (true? (:verified result)))
                    (is (= page-uuid (get-in result [:verified_entities 0 :uuid])))
                    (is (= "After" (get-in result [:verified_entities 0 :title])))
                    (is (= 1 (count (filter #(= "logseq.DB.renamePage" (first %)) @calls))))
                    (done)))
          (p/catch (fn [error]
                     (is false (str "renamePage unexpectedly failed: " (.-message error)))
                     (done)))))))

    (deftest page-uuid-result-resolves-one-live-page
      (is (= {:found true :title "Inbox" :page_uuid "page-1"}
        (mcp-compat/page-uuid-result "Inbox" [{:uuid "page-1"}])))
      (is (= {:found false :title "Missing" :page_uuid nil}
        (mcp-compat/page-uuid-result "Missing" []))))

    (deftest page-uuid-result-refuses-ambiguous-title
      (let [result (mcp-compat/page-uuid-result
          "Twin" [{:uuid "page-1"} {:uuid "page-2"}])]
        (is (= false (:found result)))
        (is (= ["page-1" "page-2"] (:candidates result)))
        (is (= "2 pages share this title; use a UUID" (:reason result)))))

        (deftest tag-uuid-result-preserves-ambiguity
          (is (= {:found true :title "Project" :tag_uuid "tag-1"}
            (mcp-compat/tag-uuid-result "Project" [{:uuid "tag-1"}])))
          (let [result (mcp-compat/tag-uuid-result
              "Project" [{:uuid "tag-1"} {:uuid "tag-2"}])]
            (is (= false (:found result)))
            (is (= ["tag-1" "tag-2"] (:candidates result)))))

            (deftest tag-result-reports-missing-entities
              (is (= {:found true :tag_uuid "tag-1" :uuid "tag-1" :title "Project"}
                (mcp-compat/tag-result "tag-1"
                        [{:uuid "tag-1" :title "Project"}])))
              (is (= {:found false :tag_uuid "missing"}
                (mcp-compat/tag-result "missing" []))))

              (deftest property-ident-result-refuses-ambiguous-definitions
                (is (= {:found true :title "Effort" :ident "plugin.property/Effort"
                  :type "number"}
                 (mcp-compat/property-ident-result
                  "Effort" [{:ident "plugin.property/Effort" :type "number"}])))
                (let [result (mcp-compat/property-ident-result
                  "Effort" [{:ident "plugin.property/Effort"}
                       {:ident "user.property/Effort"}])]
                  (is (= false (:found result)))
                  (is (= ["plugin.property/Effort" "user.property/Effort"]
                   (:candidates result)))))

                  (deftest block-result-rejects-pages-and-missing-uuids
                    (is (= {:found true :block_uuid "block-1"
                      :block {:uuid "block-1" :title "A block"}}
                     (mcp-compat/block-result
                      "block-1" [{:uuid "block-1" :title "A block"}])))
                    (is (= {:found false :block_uuid "page-1" :block nil
                      :reason "target is a page, not a block"}
                     (mcp-compat/block-result
                      "page-1" [{:uuid "page-1" :name "page"}])))
                    (is (= {:found false :block_uuid "missing" :block nil}
                          (mcp-compat/block-result "missing" []))))

                    (deftest duplicate-title-grouping-modes-preserve-their-contracts
                      (is (= "Loom-Weaver" (mcp-compat/grouping-key "Loom-Weaver" "exact")))
                      (is (not= (mcp-compat/grouping-key "Loom-Weaver" "exact")
                           (mcp-compat/grouping-key "Loom Weaver" "exact")))
                      (is (= (mcp-compat/grouping-key "Loom-Weaver" "loose")
                        (mcp-compat/grouping-key "loom weaver" "loose")))
                      (is (= (mcp-compat/grouping-key "Threads" "loose")
                        (mcp-compat/grouping-key "Thread" "loose")))
                      (is (= "class" (mcp-compat/grouping-key "Classes" "loose")))
                      (is (= "its" (mcp-compat/grouping-key "Its" "loose"))))

                    (deftest duplicate-title-fuzzy-groups-near-misses-only-in-fuzzy-mode
                      (let [candidates [{:title "Persuade" :uuid "one"}
                              {:title "Presuade" :uuid "two"}]]
                        (is (= [] (#'mcp-compat/group-title-candidates candidates "loose")))
                        (is (= 1 (count (#'mcp-compat/group-title-candidates candidates "fuzzy"))))))

  (deftest block-tree-result-applies-bounds
    (let [result (mcp-compat/block-tree-result
                  "root"
                  {:uuid "root" :title "Root"}
                  [{:uuid "child" :title "Child" :parent_uuid "root"}]
                  0 10)]
      (is (= true (:found result)))
      (is (= 1 (:node_count result)))
      (is (= true (:truncated result)))
      (is (= [] (get-in result [:block :children])))))

(deftest title-availability-result-classifies-holders
  (is (= {:title "Inbox" :available true :held_by []}
         (mcp-compat/title-availability-result "Inbox" [])))
  (let [result (mcp-compat/title-availability-result
                "Inbox" [{:uuid "page-1" :name "inbox"}])]
    (is (= false (:available result)))
    (is (= "page" (:kind (first (:held_by result)))))))

(deftest list-orphan-tags-queries-unused-tag-entities
  (let [calls (atom [])
        tags #js [#js {"db/id" 17
                       "db/ident" "plugin.tag/Unused"
                       "block/uuid" "tag-1"
                       "block/title" "Unused"}]
        api (fn [method args]
              (swap! calls conj [method args])
              tags)
        operation (mcp-compat/list-orphan-tags api #js {})]
    (async done
      (p/then operation
              (fn [result]
                (let [[method [query]] (first @calls)]
                  (is (= [{:db/id 17
                           :db/ident "plugin.tag/Unused"
                           :block/uuid "tag-1"
                           :block/title "Unused"}]
                         result))
                  (is (= "logseq.DB.datascriptQuery" method))
                  (is (string/includes? query ":block/_tags)")))
                (done))))))

(deftest list-orphan-properties-validates-query-idents
  (let [calls (atom [])
     properties #js [#js {"ident" ":plugin.property/Unused"
              "title" "Unused"
              "logseq.property/type" "number"}
            #js {"ident" ":plugin.property/Used"
              "title" "Used"
              "logseq.property/type" "string"}
            #js {"ident" "unqualified"
              "title" "Unsafe"}]
        api (fn [method args]
              (swap! calls conj [method args])
              (if (= "logseq.DB.getAllProperties" method)
                properties
                (if (string/includes? (first args) ":plugin.property/Used")
                  #js [#js {:uuid "holder-1"}]
                  #js [])))]
    (async done
      (p/then (mcp-compat/list-orphan-properties api #js {})
              (fn [result]
                (is (= [{:ident ":plugin.property/Unused"
                         :title "Unused"
                         :type "number"}]
                       result))
                (is (= ["logseq.DB.getAllProperties"
                        "logseq.DB.datascriptQuery"
                        "logseq.DB.datascriptQuery"]
                       (mapv first @calls)))
                (is (not-any? #(string/includes? (first (second %)) "unqualified")
                              (rest @calls)))
                (done))))))

(deftest list-assets-uses-unverified-attribute-discovery-query
  (let [calls (atom [])
        attributes #js [":logseq.property/asset/url" ":logseq.property/asset/remote-metadata"]
        api (fn [method args]
              (swap! calls conj [method args])
              attributes)]
    (async done
      (p/then (mcp-compat/list-assets api #js {})
              (fn [result]
                (let [[method [query]] (first @calls)]
                  (is (= [":logseq.property/asset/url"
                           ":logseq.property/asset/remote-metadata"]
                         result))
                  (is (= "logseq.DB.datascriptQuery" method))
                  (is (= 1 (count (second (first @calls)))))
                  (is (string/includes? query "clojure.string/includes?"))
                  (is (string/includes? query "\"asset\"")))
                (done))))))

(deftest list-journals-sorts-and-limits-the-cheap-listing
  (let [calls (atom [])
        journals #js [#js {"id" 1 "title" "Older" "journal-day" 20250101}
                      #js {"id" 2 "title" "Newest" "journal-day" 20260101}
                      #js {"id" 3 "title" "Middle" "journal-day" 20250601}]
        api (fn [method args]
              (swap! calls conj [method args])
              journals)]
    (async done
      (p/then (mcp-compat/list-journals api #js {"limit" 2})
              (fn [result]
                (is (= ["Newest" "Middle"] (mapv :title result)))
                (is (= 1 (count @calls)))
                (is (= "logseq.DB.datascriptQuery" (first (first @calls))))
                (done))))))

(deftest list-journals-counts-in-four-queries-and-zero-fills
  (let [calls (atom [])
        journals #js [#js {"id" 1 "title" "Older" "journal-day" 20250101}
                      #js {"id" 2 "title" "Newest" "journal-day" 20260101}]
        api (fn [method args]
              (swap! calls conj [method args])
              (case (count @calls)
                1 journals
                2 #js [#js [1 2]]
                3 #js [#js [1 1]]
                4 #js [#js [1 3]]))]
    (async done
      (p/then (mcp-compat/list-journals api #js {"with_counts" true})
              (fn [result]
                (let [by-title (into {} (map (juxt :title identity) (:journals result)))]
                  (is (= 4 (count @calls)))
                  (is (= 2 (:total result)))
                  (is (= 2 (:counted result)))
                  (is (false? (:truncated result)))
                  (is (= 1 (:content_blocks (by-title "Older"))))
                  (is (= 0 (:own_blocks (by-title "Newest"))))
                  (is (= 0 (:refs (by-title "Newest")))))
                (done))))))

(deftest list-journals-counted-limit-reports-truncation
  (let [calls (atom [])
        journals #js [#js {"id" 1 "title" "Oldest" "journal-day" 20240101}
                      #js {"id" 2 "title" "Middle" "journal-day" 20250101}
                      #js {"id" 3 "title" "Newest" "journal-day" 20260101}]
        api (fn [method args]
              (swap! calls conj [method args])
              (case (count @calls)
                1 journals
                #js []))]
    (async done
      (p/then (mcp-compat/list-journals api #js {"with_counts" true "limit" 1})
              (fn [result]
                (is (= 3 (:total result)))
                (is (= 1 (:counted result)))
                (is (true? (:truncated result)))
                (is (= ["Newest"] (mapv :title (:journals result))))
                (is (= [3] (js->clj (second (second (second @calls))))))
                (done))))))

(deftest list-journals-rejects-non-positive-limits
  (is (thrown-with-msg? js/Error #"limit must be a positive integer"
                        (mcp-compat/list-journals (fn [& _] nil) #js {"limit" 0}))))

(deftest page-stats-counts-subtree-references-and-aliases
  (let [page-uuid "00000000-0000-4000-8000-000000000001"
        calls (atom [])
        result #js {"page_uuid" page-uuid
                    "title" "Page"
                    "own_blocks" 4
                    "empty_blocks" 1
                    "content_blocks" 3
                    "subtree_blocks" 4
                    "nested_pages" 1
                    "true_orphans" 1
                    "refs" 2
                    "tag_holders" 1
                    "property_values" 1
                    "is_alias_of" "00000000-0000-4000-8000-000000000002"
                    "aliases" #js ["00000000-0000-4000-8000-000000000003"]
                    "diagnostic" "ALIAS RELATION: diagnostic fixture"}
        api (fn [method args]
              (swap! calls conj [method args])
              result)]
    (async done
      (p/then (mcp-compat/page-stats api #js {"page_uuid" page-uuid})
              (fn [result]
                (is (= page-uuid (:page_uuid result)))
                (is (= "Page" (:title result)))
                (is (= 4 (:own_blocks result)))
                (is (= 1 (:empty_blocks result)))
                (is (= 3 (:content_blocks result)))
                (is (= 4 (:subtree_blocks result)))
                (is (= 1 (:nested_pages result)))
                (is (= 1 (:true_orphans result)))
                (is (= 2 (:refs result)))
                (is (= 1 (:tag_holders result)))
                (is (= 1 (:property_values result)))
                (is (= "00000000-0000-4000-8000-000000000002" (:is_alias_of result)))
                (is (= ["00000000-0000-4000-8000-000000000003"] (:aliases result)))
                (is (string/includes? (:diagnostic result) "ALIAS RELATION"))
                (is (= [["logseq.DB.getPageStats" [page-uuid]]] @calls))
                (done))))))

(deftest page-stats-validates-page-uuid-before-querying
  (is (thrown-with-msg? js/Error #"page_uuid must be a UUID"
                        (mcp-compat/page-stats (fn [& _] nil) #js {"page_uuid" "not-a-uuid"}))))

(deftest inspect-page-reports-missing-page-and-block
  (let [page-uuid "00000000-0000-4000-8000-000000000012"
        calls (atom [])
        responses (atom [#js {"found" false "page_uuid" page-uuid "page" nil}
                         #js {"found" false "page_uuid" page-uuid "page" nil
                              "reason" "target is a block, not a page"}])
        api (fn [method args]
              (swap! calls conj [method args])
              (let [result (first @responses)]
                (swap! responses subvec 1)
                result))]
    (async done
      (-> (p/let [missing (mcp-compat/inspect-page api #js {"page_uuid" page-uuid})
                  block (mcp-compat/inspect-page api #js {"page_uuid" page-uuid})]
            [missing block])
          (p/then (fn [[missing block]]
                    (is (= {:found false :page_uuid page-uuid :page nil} missing))
                    (is (= "target is a block, not a page" (:reason block)))
                    (is (every? #(= "logseq.DB.inspectPage" (first %)) @calls))
                    (is (every? #(= [page-uuid "page"] (second %)) @calls))
                    (done)))
          (p/catch (fn [_error]
                     (is false "inspectPage lookup rejected")
                     (done)))))))

(deftest inspect-page-rejects-invalid-detail
  (is (thrown-with-msg? js/Error #"detail must be one of"
                        (mcp-compat/inspect-page (fn [& _] nil)
                                                #js {"page_uuid" "00000000-0000-4000-8000-000000000012"
                                       "detail" "everything"}))))

(deftest find-duplicate-titles-reports-dead-stubs-aliases-and-recycled-pages
  (let [calls (atom [])
        aliases (atom #js [])
        inventory #js [#js {"id" 10
                            "uuid" "00000000-0000-4000-8000-000000000010"
                            "title" "Creativity"
                            "name" "creativity"
                            "tags" #js [#js {"id" 1}]}
                       #js {"id" 11
                            "uuid" "00000000-0000-4000-8000-000000000011"
                            "title" "Creativity"
                            "name" "creativity"
                            "logseq.property/deleted-at" 100
                            "tags" #js [#js {"id" 1}]}]
        api (fn [method args]
              (swap! calls conj [method args])
              (let [query (first args)]
                (cond
                  (string/includes? query ":logseq.class/Page") 1
                  (string/includes? query ":logseq.class/Tag") 2
                  (string/includes? query "pull ?e") inventory
                  (string/includes? query "or-join") @aliases
                  (string/includes? query ":block/title \"\"") #js []
                  (string/includes? query "(count ?block)") #js [#js [10 2] #js [11 0]]
                  (string/includes? query "(count ?holder)") #js []
                  :else nil)))]
    (async done
      (-> (p/let [dead-stub (mcp-compat/find-duplicate-titles api #js {"normalize" "exact"})
                  _ (reset! aliases #js [#js [9 11]])
                  alias-group (mcp-compat/find-duplicate-titles api #js {"normalize" "exact"})
                  _ (reset! aliases #js [])
                  live-only (mcp-compat/find-duplicate-titles
                             api #js {"normalize" "exact" "include_recycled" false})]
            [dead-stub alias-group live-only])
          (p/then (fn [[dead-stub alias-group live-only]]
                    (let [stub-group (first (:groups dead-stub))
                          alias-group (first (:groups alias-group))]
                      (is (= "dead_stub" (:classification stub-group)))
                      (is (= 0 (:rank stub-group)))
                      (is (true? (some :recycled (:members stub-group))))
                      (is (= "alias" (:classification alias-group)))
                      (is (= 5 (:rank alias-group)))
                      (is (= 1 (:titles_examined live-only)))
                      (is (= [] (:groups live-only)))
                      (is (every? #(= "logseq.DB.datascriptQuery" (first %)) @calls)))
                    (done)))
          (p/catch (fn [error]
                     (is false (str error))
                     (done)))))))

(deftest find-duplicate-titles-rejects-unknown-normalization
  (is (thrown-with-msg? js/Error #"normalize must be exact, loose, or fuzzy"
                        (mcp-compat/find-duplicate-titles
                         (fn [& _] nil) #js {"normalize" "aggressive"}))))

(deftest get-property-users-preserves-literals-and-resolves-entities
  (let [calls (atom [])
        api (fn [method args]
              (swap! calls conj [method args])
              (if (string/includes? (first args) "pull ?holder")
                #js [#js [#js {"uuid" "holder-1"} true]
                     #js [#js {"uuid" "holder-2"} 99]
                     #js [#js {"uuid" "holder-3"} "literal"]]
                #js [#js {"id" 99 "title" "Resolved value" "value" "green"}]))]
    (async done
      (p/then (mcp-compat/get-property-users api
                                             #js {"property_ident" ":user.property/flag"})
              (fn [users]
                (is (= 3 (count users)))
                (is (true? (:value (first users))))
                (is (nil? (:value_entity (first users))))
                (is (= "Resolved value" (get-in users [1 :value_entity :title])))
                (is (= "literal" (:value (nth users 2))))
                (is (nil? (:value_entity (nth users 2))))
                (is (= 2 (count @calls)))
                (is (every? #(= "logseq.DB.datascriptQuery" (first %)) @calls))
                (done))))))

(deftest get-property-users-rejects-non-ident-input
  (is (thrown-with-msg? js/Error #"exact namespaced property ident"
                        (mcp-compat/get-property-users (fn [& _] nil)
                                                      #js {"property_ident" "Flag"}))))

(deftest create-property-verifies-assigned-ident-and-stored-type
  (let [calls (atom [])
        response #js {"ident" ":plugin.property._test_plugin/Budget"}
        property #js {"id" 19
                      "uuid" "property-uuid"
                      "ident" ":plugin.property._test_plugin/Budget"
                      "title" "Budget"
                      "logseq.property/type" "number"
                      "db/cardinality" "db.cardinality/one"}
        api (fn [method args]
              (swap! calls conj [method args])
              (if (= method "logseq.DB.upsertProperty") response property))]
    (async done
      (p/then (mcp-compat/create-property api
                                          #js {"title" "Budget"
                                               "schema" #js {"type" "number"}
                                               "options" #js {}
                                               "verbose" true})
              (fn [result]
                (is (true? (:verified result)))
                (is (= ":plugin.property._test_plugin/Budget"
                       (get-in result [:verified_state :ident])))
                (is (= "number" (get-in result [:verified_state :logseq.property/type])))
                (is (= "cardinality is db.cardinality/one" (:diagnostic result)))
                (is (= ["logseq.DB.upsertProperty" "logseq.DB.datascriptQuery"]
                       (mapv first @calls)))
                (done))))))

(deftest create-property-terse-response-retains-ident
  (let [api (fn [method _args]
              (if (= method "logseq.DB.upsertProperty")
                #js {"ident" ":plugin.property._test_plugin/Count"}
                #js {"uuid" "property-uuid"
                     "ident" ":plugin.property._test_plugin/Count"
                     "title" "Count"
                     "logseq.property/type" "number"}))]
    (async done
      (p/then (mcp-compat/create-property api
                                          #js {"title" "Count"
                                               "schema" #js {"type" "number"}
                                               "verbose" false})
              (fn [result]
                (is (true? (:verified result)))
                (is (= ":plugin.property._test_plugin/Count" (:ident result)))
                (is (= "property-uuid" (:uuid result)))
                (is (not (contains? result :verified_state)))
                (done))))))

(deftest create-property-rejects-namespaced-title-before-writing
  (let [calls (atom [])]
    (is (thrown-with-msg? js/Error #"plain title"
                          (mcp-compat/create-property
                           (fn [method args]
                             (swap! calls conj [method args]))
                           #js {"title" "user.property/Budget"
                                "schema" #js {"type" "number"}})))
    (is (empty? @calls))))

(deftest delete-property-refuses-value-loss-without-acknowledgement
  (let [ident ":plugin.property._test_plugin/Flag"
        calls (atom [])
        property #js {"id" 41 "ident" ident "title" "Flag"}
        api (fn [method args]
              (swap! calls conj [method args])
              (when (and (= method "logseq.DB.datascriptQuery")
                         (string/includes? (first args) "pull ?property"))
                property)
              (if (and (= method "logseq.DB.datascriptQuery")
                       (string/includes? (first args) "pull ?holder"))
                #js [#js [#js {"uuid" "holder-1"} true]]
                (when (and (= method "logseq.DB.datascriptQuery")
                           (string/includes? (first args) "pull ?property"))
                  property)))]
    (async done
      (p/then (mcp-compat/delete-property api #js {"property_ident" ident})
              (fn [result]
                (is (false? (:verified result)))
                (is (string/includes? (:diagnostic result) "acknowledge_value_loss=true"))
                (is (some? (:previous_state result)))
                (is (not-any? #(contains? #{"logseq.DB.removeProperty"
                                            "logseq.DB.removeBlock"}
                                          (first %))
                              @calls))
                (done))))))

(deftest delete-property-verifies-removal-and-sweeps-value-blocks
  (let [ident ":plugin.property._test_plugin/Flag"
  value-uuid "00000000-0000-4000-8000-000000000170"
        calls (atom [])
        property-present (atom true)
        usage-reads (atom 0)
        property #js {"id" 41 "ident" ident "title" "Flag"}
        api (fn [method args]
              (swap! calls conj [method args])
              (case method
                "logseq.DB.removeProperty" (do (reset! property-present false) nil)
                "logseq.DB.removeBlock" nil
                "logseq.DB.datascriptQuery"
                (let [query (first args)]
                  (cond
                    (string/includes? query "created-from-property") #js [value-uuid]
                    (string/includes? query "pull ?holder")
                    (if (= 1 (swap! usage-reads inc))
                      #js [#js [#js {"uuid" "holder-1"} true]]
                      #js [])
                    (string/includes? query "pull ?property")
                    (when @property-present property)
                    :else nil))
                nil))]
    (async done
      (p/then (mcp-compat/delete-property
               api #js {"property_ident" ident "acknowledge_value_loss" true})
              (fn [result]
                (is (true? (:verified result)))
                (is (string/includes? (:diagnostic result) "swept 1 orphaned value block"))
                (is (some #(= "logseq.DB.removeProperty" (first %)) @calls))
                (is (some #(= "logseq.DB.removeBlock" (first %)) @calls))
                (is (some #(and (= "logseq.DB.datascriptQuery" (first %))
                                (= (str "#uuid " (pr-str value-uuid)) (second (second %)))) @calls))
                (done))))))

(deftest delete-property-rejects-non-ident-before-querying
  (let [calls (atom [])]
    (is (thrown-with-msg? js/Error #"exact namespaced property ident"
                          (mcp-compat/delete-property
                           (fn [method args] (swap! calls conj [method args]))
                           #js {"property_ident" "Flag"})))
    (is (empty? @calls))))

(deftest remove-property-clears-only-the-target-value-and-verifies
  (let [target-uuid "00000000-0000-4000-8000-000000000031"
        ident ":plugin.property._test_plugin/Score"
        calls (atom [])
        present? (atom true)
        api (fn [method args]
              (swap! calls conj [method args])
              (case method
                "logseq.DB.removeBlockProperty" (do (reset! present? false) nil)
                "logseq.DB.datascriptQuery"
                (let [query (first args)]
                  (cond
                    (string/includes? query "block/uuid #uuid")
                    (cond-> {:id 10 :uuid target-uuid :title "Target"}
                      @present? (assoc (keyword ident) 7))
                    (string/includes? query "db/ident")
                    {:id 20 :ident ident :title "Score"}
                    :else nil))
                nil))]
    (async done
      (-> (p/then (mcp-compat/remove-property api
                                             #js {"target_uuid" target-uuid
                                                  "property_ident" ident})
                  (fn [result]
                    (is (true? (:verified result)))
                    (is (= target-uuid (get-in result [:verified_state :uuid])))
                    (is (some #(= "logseq.DB.removeBlockProperty" (first %)) @calls))))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally done)))))

(deftest remove-property-reports-a-no-op-removal
  (let [target-uuid "00000000-0000-4000-8000-000000000032"
        ident ":plugin.property._test_plugin/Score"
        api (fn [_method args]
              (if (string/includes? (first args) "db/ident")
                {:id 20 :ident ident :title "Score"}
                (assoc {:id 10 :uuid target-uuid :title "Target"}
                       (keyword ident) 7)))]
    (async done
      (-> (p/then (mcp-compat/remove-property api
                                             #js {"target_uuid" target-uuid
                                                  "property_ident" ident})
                  (fn [_]
                    (is false "removeProperty should fail when the value remains")))
          (p/catch (fn [error]
                     (is (string/includes? (.-message error) "still set on the target"))))
          (p/finally done)))))

(deftest add-property-verifies-a-materialized-literal-value
  (let [target-uuid "00000000-0000-4000-8000-000000000021"
        ident ":plugin.property._test_plugin/Score"
        calls (atom [])
        written? (atom false)
        target (fn []
                 (cond-> {"id" 10 "uuid" target-uuid "title" "Target"}
                   @written? (assoc ident {:id 55})))
        api (fn [method args]
              (swap! calls conj [method args])
              (case method
                "logseq.DB.upsertBlockProperty" (do (reset! written? true) #js {"ok" true})
                "logseq.DB.datascriptQuery"
                (let [query (first args)]
                  (cond
                    (string/includes? query "block/uuid #uuid") (clj->js (target))
                    (string/includes? query "?e ?a _")
                    #js [#js {"id" 55 ":logseq.property/value" 5}]
                    (string/includes? query ":db/ident")
                    #js {"id" 20 "ident" ident "title" "Score"
                         ":logseq.property/type" "number"
                         ":db/cardinality" "db.cardinality/one"}
                    :else nil))
                nil))]
    (async done
            (-> (p/then (mcp-compat/add-property api
                   #js {"target_uuid" target-uuid
                        "property_ident" ident
                        "value" 5})
              (fn [result]
                (is (true? (:verified result)))
                (is (= target-uuid (get-in result [:verified_state :uuid])))
                (is (= "logseq.DB.upsertBlockProperty"
                  (first (nth @calls 2))))
                (done)))
           (p/catch (fn [error]
            (is false (str error))
            (done)))))))

(deftest reference-property-values-must-be-entity-ids
  (is (false? (mcp-compat/valid-reference-property-value? "not-an-entity")))
  (is (true? (mcp-compat/valid-reference-property-value? 859)))
  (is (true? (mcp-compat/valid-reference-property-value? {:id 859})))
  (is (false? (mcp-compat/valid-reference-property-value? true))))

(deftest add-property-skips-a-duplicate-many-value
  (let [target-uuid "00000000-0000-4000-8000-000000000023"
        ident ":plugin.property._test_plugin/Labels"
        calls (atom [])
        api (fn [method args]
              (swap! calls conj [method args])
                  (let [query (first args)]
                 (cond
                   (string/includes? query "block/uuid #uuid")
                   #js {"id" 10 "uuid" target-uuid "title" "Target"
                     ":plugin.property._test_plugin/Labels" #js {"id" 55}}
                   (string/includes? query "?e ?a _")
                   #js [#js {"id" 55 ":logseq.property/value" "alpha"}]
                   (string/includes? query "db/ident")
                   #js {"id" 20 "ident" ident "title" "Labels"
                     ":logseq.property/type" "default"
                     ":db/cardinality" "db.cardinality/many"}
                   :else nil)))]
    (async done
      (-> (p/then (mcp-compat/add-property api
                                           #js {"target_uuid" target-uuid
                                                "property_ident" ident
                                                "value" "alpha"})
                  (fn [result]
                    (is (true? (:verified result)))
                    (is (string/includes? (:diagnostic result) "duplicate"))
                    (is (not-any? #(= "logseq.DB.upsertBlockProperty" (first %)) @calls))
                    (done)))
          (p/catch (fn [error]
                     (is false (str error))
                     (done)))))))

(deftest creat-tag-verifies-the-generated-identity
  (let [calls (atom [])
        tag-uuid "00000000-0000-4000-8000-000000000041"
        response #js {"uuid" tag-uuid "ident" ":plugin.class._test_plugin/Topic"}
        tag #js {"id" 41 "uuid" tag-uuid "ident" ":plugin.class._test_plugin/Topic"
                 "title" "Topic" "tags" #js [#js {"ident" "logseq.class/Tag"}]}
        api (fn [method args]
              (swap! calls conj [method args])
              (case method
                "logseq.DB.createTag" response
                (if (string/includes? (first args) "block/name")
                  #js []
                  tag)))]
    (async done
      (p/then (mcp-compat/create-tag api #js {"title" "Topic"})
              (fn [result]
                (is (true? (:verified result)))
                (is (= tag-uuid (get-in result [:verified_state :uuid])))
                (is (= ":plugin.class._test_plugin/Topic"
                       (get-in result [:verified_state :ident])))
                (is (= ["logseq.DB.datascriptQuery" "logseq.DB.createTag"
                        "logseq.DB.datascriptQuery"]
                       (mapv first @calls)))
                (done))))))

(deftest creat-tag-refuses-an-existing-page-title-before-writing
  (let [calls (atom [])
        api (fn [method args]
              (swap! calls conj [method args])
              #js [#js {"uuid" "existing-page" "title" "Topic" "name" "topic"}])]
    (async done
      (-> (p/then (mcp-compat/create-tag api #js {"title" "Topic"})
                  (fn [_]
                    (is false "creatTag should refuse title collisions")
                    (done)))
          (p/catch (fn [error]
                     (is (string/includes? (.-message error) "already exists"))
                     (is (= 1 (count @calls)))
                     (done)))))))

(deftest delete-tag-requires-detach-acknowledgement-before-writing
  (let [tag-uuid "00000000-0000-4000-8000-000000000051"
        calls (atom [])
        api (fn [method args]
              (swap! calls conj [method args])
              (let [query (first args)]
                (cond
                  (string/includes? query "pull ?tag")
                  {:id 51 :uuid tag-uuid :ident ":plugin.class._test_plugin/Topic"
                   :title "Topic"}
                  (string/includes? query "pull ?child") []
                  (string/includes? query "pull ?holder")
                  [{:uuid "holder-1" :title "Uses Topic"}]
                  :else [])))]
    (async done
      (p/then (mcp-compat/delete-tag api #js {"tag_uuid" tag-uuid})
              (fn [result]
                (is (false? (:verified result)))
                (is (string/includes? (:diagnostic result) "acknowledge_detach=true"))
                (is (some? (:previous_state result)))
                (is (not-any? #(= "logseq.DB.deletePage" (first %)) @calls))
                (done))))))

(deftest delete-tag-requires-child-reparent-acknowledgement
  (let [tag-uuid "00000000-0000-4000-8000-000000000052"
        api (fn [_method args]
              (let [query (first args)]
                (if (string/includes? query "pull ?tag")
                  {:id 52 :uuid tag-uuid :ident ":plugin.class._test_plugin/Parent"
                   :title "Parent"}
                  [{:uuid "child-tag" :title "Child"}])))]
    (async done
      (-> (p/then (mcp-compat/delete-tag api #js {"tag_uuid" tag-uuid})
                  (fn [_]
                    (is false "deleteTag should require child reparent acknowledgement")
                    (done)))
          (p/catch (fn [error]
                     (is (string/includes? (.-message error) "acknowledge_child_reparent=true"))
                     (done)))))))

(deftest delete-tag-verifies-deletion-and-reference-cleanup
  (let [tag-uuid "00000000-0000-4000-8000-000000000053"
        calls (atom [])
        present? (atom true)
        api (fn [method args]
              (swap! calls conj [method args])
              (case method
                "logseq.DB.deletePage" (do (reset! present? false) nil)
                "logseq.DB.datascriptQuery"
                (let [query (first args)]
                  (cond
                    (string/includes? query "pull ?tag")
                    (when @present?
                      {:id 53 :uuid tag-uuid :ident ":plugin.class._test_plugin/Leaf"
                       :title "Leaf"})
                    (string/includes? query "pull ?child") []
                    :else []))
                nil))]
    (async done
      (p/then (mcp-compat/delete-tag
               api #js {"tag_uuid" tag-uuid
                        "acknowledge_child_reparent" true
                        "acknowledge_detach" true
                        "verbose" false})
              (fn [result]
                (is (true? (:verified result)))
                (is (= tag-uuid (:uuid result)))
                (is (some #(= "logseq.DB.deletePage" (first %)) @calls))
                (done))))))

(deftest add-tag-verifies-the-tag-relation-and-preserves-page-identity
  (let [target-uuid "00000000-0000-4000-8000-000000000061"
        tag-uuid "00000000-0000-4000-8000-000000000062"
        calls (atom [])
        added? (atom false)
        target (fn []
                 {:id 61 :uuid target-uuid :name "inbox" :title "Inbox"
                  :tags (cond-> [{:id 1 :ident :logseq.class/Page}]
                          @added? (conj {:id 62 :ident :plugin.class/topic}))})
        api (fn [method args]
              (swap! calls conj [method args])
              (case method
                "logseq.DB.addBlockTag" (do (reset! added? true) nil)
                "logseq.DB.datascriptQuery"
                (let [query (first args)]
                  (cond
                    (string/includes? query "block/uuid #uuid") (target)
                    (string/includes? query "db/ident :logseq.class/Tag") 1
                    (string/includes? query "?tag")
                    {:id 62 :uuid tag-uuid :ident ":plugin.class._test_plugin/topic"
                     :title "Topic" :tags [{:id 1 :ident :logseq.class/Tag}]}
                    :else nil))
                nil))]
            (is (thrown? js/Error
                   (mcp-compat/add-tag api #js {"target_uuid" "invalid" "tag_uuid" tag-uuid})))
            (is (thrown? js/Error
                   (mcp-compat/add-tag api #js {"target_uuid" target-uuid "tag_uuid" "invalid"})))
            (is (empty? @calls))
    (async done
      (-> (p/then (mcp-compat/add-tag api #js {"target_uuid" target-uuid "tag_uuid" tag-uuid})
                  (fn [result]
                    (is (true? (:verified result)))
                    (is (= "inbox" (get-in result [:verified_state :name])))
                    (is (some #(= "logseq.DB.addBlockTag" (first %)) @calls))
                    (done)))
          (p/catch (fn [error]
                     (is false (str "addTag unexpectedly failed: " (.-message error)))
                     (done)))))))

(deftest remove-tag-preserves-other-tags-and-page-identity
  (let [target-uuid "00000000-0000-4000-8000-000000000071"
        tag-uuid "00000000-0000-4000-8000-000000000072"
        calls (atom [])
        removed? (atom false)
        target (fn []
                 {:id 71 :uuid target-uuid :name "inbox" :title "Inbox"
                  :tags (cond-> [{:id 1 :ident :logseq.class/Page}
                                 {:id 73 :ident :plugin.class/keepme}]
                          (not @removed?) (conj {:id 72 :ident :plugin.class/topic}))})
        api (fn [method args]
              (swap! calls conj [method args])
              (case method
                "logseq.DB.removeBlockTag" (do (reset! removed? true) nil)
                "logseq.DB.datascriptQuery"
                (let [query (first args)]
                  (cond
                    (string/includes? query "block/uuid #uuid") (target)
                    (string/includes? query "db/ident :logseq.class/Tag") 1
                    (string/includes? query "?tag")
                    {:id 72 :uuid tag-uuid :ident ":plugin.class._test_plugin/topic"
                     :title "Topic" :tags [{:id 1 :ident :logseq.class/Tag}]}
                    :else nil))
                nil))]
    (is (thrown? js/Error
                 (mcp-compat/remove-tag api #js {"target_uuid" "invalid" "tag_uuid" tag-uuid})))
    (is (thrown? js/Error
                 (mcp-compat/remove-tag api #js {"target_uuid" target-uuid "tag_uuid" "invalid"})))
    (is (empty? @calls))
    (async done
      (-> (p/then (mcp-compat/remove-tag api #js {"target_uuid" target-uuid "tag_uuid" tag-uuid
                                                   "verbose" true})
                  (fn [result]
                    (let [tag-ids (set (map :id (get-in result [:verified_state :tags])))]
                      (is (true? (:verified result)))
                      (is (= "inbox" (get-in result [:verified_state :name])))
                      (is (not (contains? tag-ids 72)))
                      (is (contains? tag-ids 73))
                      (is (some #(= "logseq.DB.removeBlockTag" (first %)) @calls)))
                    (done)))
          (p/catch (fn [error]
                     (is false (str "removeTag unexpectedly failed: " (.-message error)))
                     (done)))))))

(deftest create-block-verifies-parent-page-and-content
  (let [page-uuid "00000000-0000-4000-8000-000000000091"
        block-uuid "00000000-0000-4000-8000-000000000092"
        calls (atom [])
        inserted? (atom false)
        page {:id 91 :uuid page-uuid :name "fixture" :title "Fixture"}
        block {:id 92 :uuid block-uuid :title "Fixture block"
               :parent {:id 91} :page {:id 91}}
        api (fn [method args]
              (swap! calls conj [method args])
              (case method
                "logseq.DB.insertBlock" (do (reset! inserted? true) #js {:uuid block-uuid})
                "logseq.DB.datascriptQuery"
                (let [query (first args)]
                  (cond
                    (string/includes? query "block/uuid #uuid") page
                    (string/includes? query ":block/parent ?parent-id")
                    (if @inserted? [block] [])
                    (string/includes? query ":in $ ?uuid") block
                    :else []))
                nil))]
    (async done
      (-> (p/then (mcp-compat/create-block
                   api #js {"parent_uuid" page-uuid "title" "Fixture block" "verbose" true})
                  (fn [result]
                    (is (true? (:verified result)))
                    (is (= 91 (get-in result [:verified_entities 0 :parent :id])))
                    (is (= 91 (get-in result [:verified_entities 0 :page :id])))
                    (is (some #(= "logseq.DB.insertBlock" (first %)) @calls))
                    (done)))
          (p/catch (fn [error]
                     (is false (str "createBlock failed: " (.-message error)))
                     (done)))))))

(deftest update-block-verifies-the-original-uuid-and-content
  (let [block-uuid "00000000-0000-4000-8000-000000000094"
        title (atom "Before")
        calls (atom [])
        block (fn [] {:id 94 :uuid block-uuid :title @title
                      :parent {:id 91} :page {:id 90}})
        api (fn [method args]
              (swap! calls conj [method args])
              (case method
                "logseq.DB.updateBlock" (do (reset! title (second args)) nil)
                "logseq.DB.datascriptQuery" (block)
                nil))]
    (async done
      (-> (p/then (mcp-compat/update-block
                   api #js {"block_uuid" block-uuid "title" "After" "verbose" true})
                  (fn [result]
                    (is (true? (:verified result)))
                    (is (= block-uuid (get-in result [:verified_entities 0 :uuid])))
                    (is (= "After" (get-in result [:verified_entities 0 :title])))
                    (is (= "Before" (get-in result [:previous_entities 0 :title])))
                    (done)))
          (p/catch (fn [error]
                     (is false (str "updateBlock failed: " (.-message error)))
                     (done)))))))

(deftest move-block-verifies-child-placement-and-page
  (let [block-uuid "00000000-0000-4000-8000-000000000095"
        page-uuid "00000000-0000-4000-8000-000000000096"
        calls (atom [])
        moved? (atom false)
        source (fn [] {:id 95 :uuid block-uuid :title "Source" :order "A"
                 :parent {:id (if @moved? 96 94)}
                 :page {:id (if @moved? 96 94)}})
        target {:id 96 :uuid page-uuid :name "target" :title "Target"}
        api (fn [method args]
              (swap! calls conj [method args])
              (case method
                "logseq.DB.moveBlock" (do (reset! moved? true) nil)
                "logseq.DB.datascriptQuery"
                (let [query (first args)]
                  (cond
                    (string/includes? query "pull ?entity")
                    (if (= (str (reader/read-string (second args))) page-uuid) target (source))
                    (string/includes? query "pull ?child") [(source)]
                    :else []))
                nil))]
    (async done
      (-> (p/then (mcp-compat/move-block
                   api #js {"block_uuid" block-uuid "target_uuid" page-uuid "verbose" true})
                  (fn [result]
                    (let [move-call (some #(when (= "logseq.DB.moveBlock" (first %)) %) @calls)
                          options (nth (second move-call) 2)]
                      (is @moved?)
                      (is (true? (:verified result)))
                      (is (= 96 (get-in result [:verified_entities 0 :parent :id])))
                      (is (= 96 (get-in result [:verified_entities 0 :page :id])))
                      (is (true? (aget options "children")))
                      (done))))
          (p/catch (fn [error]
                     (is false (str "moveBlock failed: " (.-message error)))
                     (done)))))))

(deftest move-block-appends-after-the-current-last-child
  (let [block-uuid "00000000-0000-4000-8000-000000000097"
        page-uuid "00000000-0000-4000-8000-000000000098"
        last-child-uuid "00000000-0000-4000-8000-000000000099"
        moved? (atom false)
        calls (atom [])
        source (fn [] {:id 97 :uuid block-uuid :title "Source" :order (if @moved? "B" "A")
                       :parent {:id (if @moved? 98 94)} :page {:id (if @moved? 98 94)}})
        existing-child {:id 99 :uuid last-child-uuid :order "A"}
        target {:id 98 :uuid page-uuid :name "target" :title "Target"}
        api (fn [method args]
              (swap! calls conj [method args])
              (case method
                "logseq.DB.moveBlock" (do (reset! moved? true) nil)
                "logseq.DB.datascriptQuery"
                (let [query (first args)]
                  (cond
                    (string/includes? query "pull ?entity")
                    (if (= (str (reader/read-string (second args))) page-uuid) target (source))
                    (string/includes? query "pull ?child")
                    (if @moved? [existing-child (source)] [existing-child])
                    :else []))
                nil))]
    (async done
      (-> (p/then (mcp-compat/move-block
                   api #js {"block_uuid" block-uuid "target_uuid" page-uuid "placement" "last-child"})
                  (fn [result]
                    (let [move-call (some #(when (= "logseq.DB.moveBlock" (first %)) %) @calls)
                          move-args (second move-call)]
                      (is (true? (:verified result)))
                      (is (= last-child-uuid (second move-args)))
                      (is (false? (aget (nth move-args 2) "before")))
                      (done))))
          (p/catch (fn [error]
                     (is false (str "last-child move failed: " (.-message error)))
                     (done)))))))

(deftest move-block-refuses-a-descendant-target
  (let [block-uuid "00000000-0000-4000-8000-000000000100"
        target-uuid "00000000-0000-4000-8000-000000000101"
        calls (atom [])
        entity (fn [uuid id]
                 {:id id :uuid uuid :title "Block" :parent {:id 90} :page {:id 90}})
        api (fn [method args]
              (swap! calls conj [method args])
              (if (and (= method "logseq.DB.datascriptQuery")
                       (string/includes? (first args) "?descendant :block/parent+"))
                [[target-uuid]]
                (let [uuid (str (reader/read-string (second args)))]
                  (entity uuid (if (= uuid block-uuid) 100 101)))))]
    (async done
      (-> (p/then (mcp-compat/move-block
                   api #js {"block_uuid" block-uuid "target_uuid" target-uuid})
                  (fn [_]
                    (is false "A descendant target should be rejected")
                    (done)))
          (p/catch (fn [error]
                     (is (string/includes? (.-message error) "own subtree"))
                     (is (not-any? #(= "logseq.DB.moveBlock" (first %)) @calls))
                     (done)))))))

(deftest remove-block-refuses-incomplete-inventory-before-deleting
  (let [root-uuid "00000000-0000-4000-8000-000000000102"
        calls (atom [])
        api (fn [method args]
              (swap! calls conj [method args])
              (if (string/includes? (first args) "pull ?entity")
                {:id 102 :uuid root-uuid :title "Root" :parent {:id 90} :page {:id 90}}
                (if (= 102 (second args)) [{:id 103 :title "Child without UUID"}] [])))]
    (async done
      (-> (p/then (mcp-compat/remove-block api #js {"block_uuid" root-uuid})
                  (fn [_] (is false "Incomplete recovery inventory must refuse deletion") (done)))
          (p/catch (fn [error]
                     (is (string/includes? (.-message error) "UUID"))
                     (is (not-any? #(= "logseq.DB.removeBlock" (first %)) @calls))
                     (done)))))))

(deftest remove-block-inventories-and-verifies-the-subtree
  (let [root-uuid "00000000-0000-4000-8000-000000000102"
        child-uuid "00000000-0000-4000-8000-000000000103"
        entities (atom {root-uuid {:id 102 :uuid root-uuid :title "Root"
                                   :parent {:id 90 :uuid "00000000-0000-4000-8000-000000000090"}
                                   :page {:id 90 :uuid "00000000-0000-4000-8000-000000000090"}}
                        child-uuid {:id 103 :uuid child-uuid :title "Child"
                                    :parent {:id 102 :uuid root-uuid}
                                    :page {:id 90 :uuid "00000000-0000-4000-8000-000000000090"}}})
        api (fn [method args]
              (case method
                "logseq.DB.removeBlock" (do (reset! entities {}) nil)
                "logseq.DB.datascriptQuery"
                (let [query (first args)]
                  (cond
                    (string/includes? query "pull ?entity")
                    (get @entities (str (reader/read-string (second args))))
                    (string/includes? query "pull ?child")
                    (->> (vals @entities)
                         (filter #(= (second args) (get-in % [:parent :id])))
                         vec)
                    :else []))
                nil))]
    (async done
      (-> (p/then (mcp-compat/remove-block api #js {"block_uuid" root-uuid "verbose" true})
                  (fn [result]
                    (is (true? (:verified result)))
                    (is (= 2 (:previous_count result)))
                    (is (= #{root-uuid child-uuid}
                           (set (map :uuid (:previous_entities result)))))
                    (is (nil? (get @entities root-uuid)))
                    (is (nil? (get @entities child-uuid)))
                    (done)))
          (p/catch (fn [error]
                     (is false (str "removeBlock failed: " (.-message error)))
                     (done)))))))

