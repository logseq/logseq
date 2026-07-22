(ns frontend.components.views-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            ["react" :as react]
            ["react-dom/server" :as react-dom-server]
            [cljs.test :refer [async deftest is use-fixtures]]
            [clojure.string :as string]
            [datascript.impl.entity :as de]
            [frontend.components.property.value :as property-value]
            [frontend.components.views :as views]
            [frontend.db.hooks :as db-hooks]
            [frontend.db.subs :as subs]
            [frontend.util :as util]
            [goog.object :as gobj]
            [promesa.core :as p]))

(def ^:private test-graph-id "view-resource-test")

(defn- source-for
  [relative-file]
  (.toString
   (fs/readFileSync (node-path/join (.cwd js/process) relative-file) "utf8")))

(defn- form-source
  [source marker]
  (let [start (string/index-of source marker)
        end (when start
              (or (some->> ["\n(hsx/defc "
                            "\n(defn"
                            "\n(def "
                            "\n(declare "]
                           (keep #(string/index-of source % (inc start)))
                           seq
                           (apply min))
                  (count source)))]
    (when (and start end)
      (subs source start end))))

(defn- hook-names
  [source]
  (set (re-seq #"db-hooks/[a-z-]+" source)))

(defn- render-static
  [element]
  (let [previous-react (gobj/get js/globalThis "React")]
    (gobj/set js/globalThis "React" react)
    (try
      (.renderToStaticMarkup react-dom-server element)
      (finally
        (if (some? previous-react)
          (gobj/set js/globalThis "React" previous-react)
          (js-delete js/globalThis "React"))))))

(defn- with-use-sync-external-store
  [replacement f]
  (let [original-use-ref (gobj/get react "useRef")
        original-use-callback (gobj/get react "useCallback")
        original (gobj/get react "useSyncExternalStore")]
    (gobj/set react "useRef" (fn [value] #js {:current value}))
    (gobj/set react "useCallback" (fn [callback _deps] callback))
    (gobj/set react "useSyncExternalStore" replacement)
    (try
      (f)
      (finally
        (gobj/set react "useRef" original-use-ref)
        (gobj/set react "useCallback" original-use-callback)
        (gobj/set react "useSyncExternalStore" original)))))

(defn- mount-resource!
  [resource-key]
  (let [*mounted? (atom true)
        *unsubscribe (atom nil)
        value (atom nil)]
    (letfn [(listener! []
              (when @*mounted?
                (render!)))
            (render! []
              (when @*mounted?
                (with-use-sync-external-store
                  (fn [subscribe get-snapshot _get-server-snapshot]
                    (when-not @*unsubscribe
                      (reset! *unsubscribe (subscribe listener!)))
                    (get-snapshot))
                  #(reset! value (db-hooks/use-resource resource-key)))))]
      (render!)
      {:value value
       :unmount! (fn []
                   (reset! *mounted? false)
                   (when-let [unsubscribe @*unsubscribe]
                     (unsubscribe)
                     (reset! *unsubscribe nil)))})))

(defn- unmount!
  [mounted]
  ((:unmount! mounted)))

(defn- finish-async!
  [done promise]
  (-> promise
      (p/catch (fn [error]
                 (is false (str error))))
      (p/finally done)))

(defn- delta
  [rev affected-keys]
  {:graph-id test-graph-id
   :rev rev
   :op-id (str "view-operation-" rev)
   :blocks {}
   :deleted {}
   :children {}
   :affected-keys affected-keys})

(use-fixtures :each
  {:before #(subs/reset-graph! test-graph-id)
   :after #(subs/reset-graph! test-graph-id)})

(deftest table-property-value-receives-view-parent
  (let [view-parent {:db/ident :logseq.class/Task}
        property {:db/ident :logseq.property/status
                  :block/title "Status"
                  :logseq.property/type :default}
        row {:db/id 1}
        calls* (atom [])]
    (with-redefs [de/entity? map?
                  property-value/property-value
                  (fn [& args] (swap! calls* conj args))]
      (let [columns (views/build-columns {:view-parent view-parent}
                                         [property]
                                         {:with-object-name? false
                                          :add-tags-column? false})
            column (some #(when (= :logseq.property/status (:id %)) %) columns)]
        ((:cell column) nil row column {})
        (is (= view-parent
               (some #(get-in (vec %) [2 :view-parent]) @calls*))
            (pr-str @calls*))))))

(deftest gallery-property-value-receives-view-parent
  (let [view-parent {:db/ident :logseq.class/Task}]
    (is (= {:view? true
            :gallery-view? true
            :view-parent view-parent}
           (#'views/gallery-property-value-opts {:view-parent view-parent})))))

(deftest references-default-to-list-view
  (is (= :logseq.property.view/type.list
         (#'views/view-display-type {} :linked-references)))
  (is (= :logseq.property.view/type.list
         (#'views/view-display-type {} :unlinked-references)))
  (is (= :logseq.property.view/type.gallery
         (#'views/view-display-type
          {:logseq.property.view/type
           {:db/ident :logseq.property.view/type.gallery}}
          :linked-references)))
  (is (= :logseq.property.view/type.table
         (#'views/view-display-type {} :all-pages))))

(deftest default-view-title-matches-the-feature-type
  (is (= :view/linked-references
         (#'views/default-view-title-key :linked-references)))
  (is (= :view/unlinked-references
         (#'views/default-view-title-key :unlinked-references)))
  (is (= :view/all
         (#'views/default-view-title-key :all-pages)))
  (is (nil? (#'views/default-view-title-key :query-result))))

(deftest built-in-many-properties-use-datascript-cardinality
  (is (= :db.cardinality/many
         (:db/cardinality (#'views/built-in-property :block/tags)))))

(deftest journal-virtualized-items-use-the-master-css-placeholder-height
  (let [source (source-for "src/main/frontend/components/journal.cljs")
        journal-item-source (form-source source "(hsx/defc journal-item")
        css (source-for "src/main/frontend/components/journal.css")]
    (is (some? journal-item-source))
    (is (string/includes? journal-item-source
                          "[:div.journal-item.content.relative"))
    (is (not (string/includes? journal-item-source ":min-height")))
    (is (string/includes? css "min-h-[250px]"))
    (is (string/includes? css "min-h-[500px]"))))

(deftest view-type-button-uses-the-contextual-display-type
  (let [view {:db/id 1}
        all-pages-view (#'views/view-with-display-type
                        view :logseq.property.view/type.table)
        references-view (#'views/view-with-display-type
                         view :logseq.property.view/type.list)]
    (is (= :logseq.property.view/type.table
           (get-in all-pages-view [:logseq.property.view/type :db/ident])))
    (is (= "table"
           (get-in all-pages-view [:logseq.property.view/type :logseq.property/icon :id])))
    (is (= :logseq.property.view/type.list
           (get-in references-view [:logseq.property.view/type :db/ident])))
    (is (= "list"
           (get-in references-view [:logseq.property.view/type :logseq.property/icon :id])))))

(deftest build-columns-should-allow-name-property-when-no-object-name
  "When with-object-name? is false, the user property 'Name' should be kept"
  (let [mock-properties [{:db/ident :user.property/name-abc
                          :block/title "Name"
                          :logseq.property/type :default}]
        columns (views/build-columns {} mock-properties {:with-object-name? false
                                                         :add-tags-column? false})]
    ;; Without built-in title column, user 'Name' property should exist
    (is (some #(= :user.property/name-abc (:id %)) columns))))

(deftest build-columns-should-include-page-column-when-requested
  (let [columns (views/build-columns {} [] {:add-tags-column? false
                                            :add-page-column? true})]
    (is (some #(= :block/page (:id %)) columns))
    (is (false? (:sortable? (some #(when (= :block/page (:id %)) %) columns))))
    (is (not (some #(= :block/page (:id %))
                   (views/build-columns {} [] {:add-tags-column? false}))))))

(deftest sort-columns-should-deduplicate-ordered-ids
  "Reproduces db-test#837 amplification: When ordered-column-ids contains
   duplicates (e.g., from corrupted drag-and-drop state), sort-columns
   should not produce duplicate columns."
  (let [columns [{:id :block/title :name "Name"}
                 {:id :user.property/abc :name "Name"}
                 {:id :user.property/age :name "Age"}]
        ;; Simulates corrupted ordered-column-ids with duplicates
        corrupted-ordered-ids [:block/title :user.property/abc :block/title :user.property/abc]
        sorted (views/sort-columns columns corrupted-ordered-ids)]
    ;; Without deduplication, this would produce 4+ columns
    (is (= 3 (count sorted))
        "sort-columns should deduplicate ordered IDs and produce exactly 3 columns")
    ;; Verify each column appears only once
    (is (= 1 (count (filter #(= :block/title (:id %)) sorted))))
    (is (= 1 (count (filter #(= :user.property/abc (:id %)) sorted))))
    (is (= 1 (count (filter #(= :user.property/age (:id %)) sorted))))))

(deftest sort-columns-should-preserve-order-of-first-occurrence
  "sort-columns deduplication should keep the first occurrence's order"
  (let [columns [{:id :a :name "A"}
                 {:id :b :name "B"}
                 {:id :c :name "C"}]
        ordered-ids [:c :b :a :c :b]
        sorted (views/sort-columns columns ordered-ids)]
    (is (= [:c :b :a] (map :id sorted)))))

(deftest gallery-lazy-item-opts-should-request-view-properties
  (let [properties [:block/title :user.property/cover :block/uuid]]
    (is (= {:properties properties}
           (views/gallery-lazy-item-opts {:properties properties})))))

(deftest gallery-card-asset-block-should-use-row-for-asset-class
  (let [block {:db/id 1
               :block/title "Inception poster"
               :block/uuid #uuid "11111111-1111-1111-1111-111111111111"}]
    (is (= block
           (views/gallery-card-asset-block block :block/uuid)))))

(deftest view-row-ids-flatten-only-typed-uuid-payloads-test
  (let [row-a (random-uuid)
        row-b (random-uuid)
        row-c (random-uuid)
        row-d (random-uuid)]
    (is (= [row-a row-b]
           (vec (views/view-row-ids
                 {:partition :flat
                  :count 2
                  :rows [row-a row-b]}))))
    (is (= [row-a row-b row-c]
           (vec (views/view-row-ids
                 {:partition :grouped
                  :count 3
                  :groups [{:value {:kind :scalar :value "A"}
                            :rows [row-a row-b]}
                           {:value {:kind :empty}
                            :rows [row-c]}]}))))
    (is (= [row-a row-b row-c row-d]
           (vec (views/view-row-ids
                 {:partition :grouped-list
                  :count 4
                  :groups [{:value {:kind :entity :uuid (random-uuid)}
                            :partitions [{:breadcrumb-uuid row-a
                                          :rows [row-a row-b]}
                                         {:breadcrumb-uuid row-c
                                          :rows [row-c row-d]}]}]}))))
    (is (= [row-a row-b row-c]
           (views/grouped-gallery-row-ids
            {:partition :grouped
             :count 4
             :groups [{:value {:kind :scalar :value "A"}
                       :rows [row-a row-b]}
                      {:value {:kind :scalar :value "B"}
                       :rows [row-b row-c]}]})))))

(deftest view-row-hydrates-only-its-uuid-through-use-block-test
  (let [row-uuid (random-uuid)
        block {:block/uuid row-uuid
               :block/tx-id 9
               :block/title "Loaded from the UUID slot"}
        calls (atom [])]
    (with-redefs [db-hooks/use-block
                  (fn [requested-uuid]
                    (swap! calls conj requested-uuid)
                    block)]
      (is (= "<span>Loaded from the UUID slot</span>"
             (render-static
              (views/lazy-item
               [row-uuid]
               0
               {}
               (fn [item]
                 (.createElement react "span" nil (:block/title item)))))))
      (is (= [row-uuid] @calls)
          "A mounted row supplies one UUID and owns no loader closure."))))

(deftest typed-group-values-keep-scalars-plain-and-hydrate-entities-test
  (let [entity-uuid (random-uuid)
        entity {:block/uuid entity-uuid
                :block/tx-id 4
                :block/title "Entity group"}
        block-calls (atom [])
        render-group
        (fn [value readable-property-value]
          (render-static
           (views/group-item
            {:block/uuid (random-uuid)}
            {}
            []
            {:block/title "Status"}
            value
            {}
            {}
            {:list-view? true
             :gallery? false
             :group-by-page? false
             :readable-property-value readable-property-value})))]
    (with-redefs [db-hooks/use-block
                  (fn [requested-uuid]
                    (swap! block-calls conj requested-uuid)
                    entity)
                  util/mobile? (constantly true)
                  views/view-cp (fn [& _] nil)]
      (let [markup (render-group {:kind :scalar :value "Ready"}
                                 (fn [value]
                                   (if (= "Ready" value)
                                     value
                                     (str "wrapped:" (pr-str value)))))]
        (is (string/includes? markup "Ready"))
        (is (not (string/includes? markup "wrapped:")))
        (is (empty? @block-calls)
            "Plain scalar group metadata never opens a block subscription."))
      (let [markup (render-group {:kind :entity :uuid entity-uuid}
                                 :block/title)]
        (is (string/includes? markup "Entity group"))
        (is (= [entity-uuid] @block-calls)
            "Entity-valued group metadata hydrates at its UUID boundary.")))))

(deftest entity-group-items-keep-a-nonzero-shell-while-loading-test
  (let [entity-uuid (random-uuid)]
    (with-redefs [db-hooks/use-block (constantly nil)
                  util/mobile? (constantly true)
                  views/view-cp (fn [& _] nil)]
      (let [markup
            (render-static
             (views/group-item
              {:block/uuid (random-uuid)}
              {}
              []
              {:block/title "Page"}
              {:kind :entity :uuid entity-uuid}
              {}
              {}
              {:list-view? true
               :gallery? false
               :group-by-page? true
               :readable-property-value :block/title}))]
        (is (string/includes? markup "min-height:1px")
            "A virtualized entity group must remain measurable until its page entity loads.")))))

(deftest views-use-only-definition-and-data-resources-test
  (let [source (source-for "src/main/frontend/components/views.cljs")
        view-source (form-source source "(hsx/defc view\n")
        missing-view-source (form-source source "(hsx/defc missing-view")
        selected-view-source (form-source source "(hsx/defc selected-view")
        view-data-source (form-source source "(hsx/defc loaded-view-aux")
        row-source (form-source source "(hsx/defc lazy-item")]
    (is (some? view-source))
    (is (some? missing-view-source))
    (is (some? selected-view-source))
    (is (some? view-data-source))
    (is (some? row-source))
    (when view-source
      (is (string/includes? view-source ":views"))
      (is (string/includes? view-source "view-parent-uuid"))
      (is (= #{"db-hooks/use-resource"}
             (hook-names view-source)))
      (is (string/includes? view-source
                            "(missing-view view-parent-uuid view-feature-type)"))
      (doseq [forbidden ["hooks/use-state"
                         "hooks/use-effect"
                         "rfx/use-entity-tx-id"
                         "<get-or-load-views"
                         "create-view!"]]
        (is (not (string/includes? view-source forbidden))
            (str "View definitions retain an imperative owner: " forbidden))))
    (when missing-view-source
      (is (= #{"db-hooks/use-block"}
             (hook-names missing-view-source)))
      (is (string/includes? missing-view-source "hooks/use-effect!"))
      (is (string/includes? missing-view-source "create-view!")))
    (when selected-view-source
      (is (= #{"db-hooks/use-block"}
             (hook-names selected-view-source)))
      (doseq [forbidden ["hooks/use-effect"
                         "rfx/use-entity-tx-id"
                         "<get-or-load-views"
                         ":db/id"
                         "db-async/"
                         "react/q"
                         "db-hooks/use-query"]]
        (is (not (string/includes? selected-view-source forbidden))
            (str "Selected view retains an imperative definition loader: " forbidden))))
    (when view-data-source
      (is (string/includes? view-data-source ":view-data"))
      (is (= #{"db-hooks/use-resource"}
             (hook-names view-data-source)))
      (doseq [forbidden ["load-view-data"
                         "hooks/use-effect"
                         "db-async/"
                         "react/q"
                         "db-hooks/use-query"
                         ":query-fn"]]
        (is (not (string/includes? view-data-source forbidden))
            (str "View data retains a local loader: " forbidden))))
    (when row-source
      (is (= #{"db-hooks/use-block"} (hook-names row-source)))
      (doseq [forbidden [":db/id"
                         "db-async/"
                         "hooks/use-effect"
                         "hooks/use-state"
                         "loading-db-id"]]
        (is (not (string/includes? row-source forbidden))
            (str "A UUID row retains local hydration state: " forbidden))))
    (is (not (string/includes? source "(defn sub-view-data-changes")))
    (is (not (string/includes? source "[frontend.db.react :as react]")))))

(deftest deferred-view-does-not-mount-its-data-resource-while-collapsed-test
  (let [source (source-for "src/main/frontend/components/views.cljs")
        deferred-source (form-source source "(hsx/defc view-aux")
        placeholder-source (form-source source "(hsx/defc deferred-view-placeholder")]
    (is (string/includes? deferred-source "defer-resource?"))
    (is (string/includes? deferred-source "loaded-view-aux"))
    (is (not (string/includes? deferred-source "db-hooks/use-resource")))
    (is (string/includes? placeholder-source ":default-collapsed? true"))
    (is (string/includes? placeholder-source "activate!"))))

(deftest persisted-table-columns-derive-from-the-subscribed-view-test
  (let [source (source-for "src/main/frontend/components/views.cljs")
        view-inner-source (form-source source "(hsx/defc ^:large-vars/cleanup-todo view-inner")
        setters-source (form-source source "(defn- db-set-table-state!")]
    (is (some? view-inner-source))
    (is (some? setters-source))
    (when view-inner-source
      (is (not (string/includes?
                view-inner-source
                "(if-let [hidden-columns (conj (:logseq.property.table/hidden-columns view-entity) :id)]"))
          "Adding :id before testing persisted hidden columns makes the imported-table fallback unreachable.")
      (is (string/includes?
           view-inner-source
           "(if-let [hidden-columns (:logseq.property.table/hidden-columns view-entity)]")
          "Imported tables without hidden-columns must derive visibility from ordered-columns.")
      (doseq [local-state-binding ["[visible-columns set-visible-columns!] (hooks/use-state"
                                   "[ordered-columns set-ordered-columns!] (hooks/use-state"
                                   "[sized-columns set-sized-columns!] (hooks/use-state"]]
        (is (not (string/includes? view-inner-source local-state-binding))
            (str "Persisted table state still has a local mirror: " local-state-binding)))
      (doseq [property [":logseq.property.table/hidden-columns view-entity"
                        ":logseq.property.table/ordered-columns view-entity"
                        ":logseq.property.table/sized-columns view-entity"]]
        (is (string/includes? view-inner-source property)
            (str "Subscribed view entity no longer owns table state: " property))))
    (when setters-source
      (doseq [local-write ["(set-visible-columns! columns)"
                           "(set-ordered-columns! ordered-columns)"
                           "(set-sized-columns! sized-columns)"]]
        (is (not (string/includes? setters-source local-write))
            (str "Persisted table setter still writes a local mirror: " local-write))))))

(deftest view-partition-readers-do-not-shadow-core-partition-test
  (let [source (source-for "src/main/frontend/components/views.cljs")]
    (is (not (string/includes? source "{:keys [partition rows groups]"))
        "View payload destructuring must give :partition an intent-revealing local name.")))

(deftest view-definition-uuids-hydrate-through-use-block-test
  (let [owner-uuid (random-uuid)
        view-uuid (random-uuid)
        view-entity {:block/uuid view-uuid
                     :block/tx-id 3
                     :logseq.property.view/feature-type :class-objects}
        resource-calls (atom [])
        block-calls (atom [])
        rendered (atom nil)]
    (with-redefs [db-hooks/use-resource
                  (fn [resource-key]
                    (swap! resource-calls conj resource-key)
                    [view-uuid])
                  db-hooks/use-block
                  (fn [requested-uuid]
                    (swap! block-calls conj requested-uuid)
                    view-entity)
                  views/view-aux
                  (fn [view option]
                    (reset! rendered [view option])
                    [:span "view"])]
      (render-static
       (views/view {:view-parent-uuid owner-uuid
                    :view-feature-type :class-objects}))
      (is (= [[:views owner-uuid :class-objects]] @resource-calls))
      (is (= [view-uuid] @block-calls))
      (is (= view-entity (first @rendered)))
      (is (= owner-uuid (get-in @rendered [1 :view-parent-uuid]))))))

(deftest view-and-reaction-membership-reloads-only-while-mounted-test
  (async done
         (let [owner-uuid (random-uuid)
               view-uuid (random-uuid)
               target-uuid (random-uuid)
               user-uuid (random-uuid)
               view-key [:view-data view-uuid
                         {:feature-type :class-objects}]
               reaction-key [:block-reactions target-uuid user-uuid]
               view-watch [:class-membership owner-uuid]
               reaction-watch [:reactions target-uuid]
               calls (atom [])
               load-counts (atom {})]
           (finish-async!
            done
            (p/with-redefs [subs/<load-resource
                            (fn [_graph-id resource-key]
                              (swap! calls conj resource-key)
                              (let [load-number
                                    (get (swap! load-counts update resource-key
                                                (fnil inc 0))
                                         resource-key)
                                    [watch-key value]
                                    (if (= view-key resource-key)
                                      [view-watch
                                       {:partition :flat
                                        :count 0
                                        :rows []}]
                                      [reaction-watch []])]
                                (p/resolved
                                 {:basis-rev (dec load-number)
                                  :key resource-key
                                  :watch-keys #{watch-key}
                                  :value value})))]
              (let [mounted-view (mount-resource! view-key)
                    mounted-reactions (mount-resource! reaction-key)]
                (p/let [_ (p/delay 0)
                        _ (is (= {:partition :flat :count 0 :rows []}
                                 @(:value mounted-view)))
                        _ (unmount! mounted-reactions)
                        _ (subs/apply-delta!
                           (delta 1 #{view-watch reaction-watch}))
                        _ (p/delay 0)]
                  (is (= 2 (count (filter #{view-key} @calls)))
                      "One invalidation starts one mounted view reload.")
                  (is (= 1 (count (filter #{reaction-key} @calls)))
                      "An unmounted reaction resource starts no reload.")
                  (unmount! mounted-view))))))))

(deftest group-by-column-should-exclude-name-and-include-many-properties
  (is (views/group-by-column? {:id :block/page}))
  (is (not (views/group-by-column? {:id :block/title
                                    :property {:logseq.property/type :string}})))
  (is (views/group-by-column? {:id :block/tags
                               :property {:logseq.property/type :class
                                          :db/cardinality :db.cardinality/many}})))
