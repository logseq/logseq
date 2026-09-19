(ns frontend.components.views-test
  (:require ["react" :as react]
            ["react-dom/server" :as react-dom-server]
            [cljs.test :refer [async deftest is testing use-fixtures]]
            [clojure.string :as string]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [frontend.components.all-pages :as all-pages]
            [frontend.components.property.value :as property-value]
            [frontend.components.views :as views]
            [frontend.db.async :as db-async]
            [frontend.db.hooks :as db-hooks]
            [frontend.db.subs :as subs]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.worker.handler.block :as worker-block]
            [frontend.worker.handler.render-resource.view :as worker-view]
            [goog.object :as gobj]
            [promesa.core :as p]
            [reitit.frontend.easy :as rfe]))

(def ^:private test-graph-id "view-resource-test")

(defn- test-prefetch-window
  [rows start-index end-index window-size]
  (let [rows (vec rows)]
    (if-let [[start end] (#'views/view-prefetch-bounds
                          (count rows) start-index end-index window-size)]
      (subvec rows start (inc end))
      [])))

(defn- test-next-prefetch-window
  [rows current-bounds visible-start visible-end window-size]
  (let [rows (vec rows)
        [start end] (#'views/next-view-prefetch-bounds
                     (count rows) current-bounds visible-start visible-end window-size)]
    (if (and start end)
      (subvec rows start (inc end))
      [])))

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

(deftest all-pages-passes-resolved-view-parent-uuid-test
  (let [view-parent-uuid (random-uuid)
        view-opts (atom nil)]
    (with-redefs [db-hooks/use-resource (fn [resource-key]
                                          (when (= [:page-identity "$$$views"] resource-key)
                                            view-parent-uuid))
                  views/view (fn [opts]
                               (reset! view-opts opts)
                               nil)]
      (render-static (all-pages/all-pages))
      (is (= view-parent-uuid (:view-parent-uuid @view-opts)))
      (is (= :all-pages (:view-feature-type @view-opts))))))

(deftest all-pages-title-cell-keeps-table-row-alignment-test
  (let [title-cell (:cell (first (#'all-pages/columns)))
        page-uuid (random-uuid)
        [wrapper-tag [link-tag attrs title]]
        (with-redefs [rfe/href (fn [_route params]
                                 (str "#/page/" (get params :name)))]
          (title-cell nil
                      {:block/title "Aligned page"
                       :block/uuid page-uuid}
                      nil))]
    (is (string/includes? (name wrapper-tag) "h-full"))
    (is (string/includes? (name wrapper-tag) "items-center"))
    (is (string/includes? (name link-tag) "truncate"))
    (is (string/includes? (:href attrs) (str page-uuid)))
    (is (= "Aligned page" title)
        "All Pages title cells render the worker-provided display title directly.")
    (is (not (string/includes? (name link-tag) "page-reference"))
        "All Pages cells use a plain page link, not page-cp preview DOM.")))

(deftest all-pages-first-window-preview-uses-worker-display-title-test
  (let [page-uuid (random-uuid)
        entity {:db/id 42 :block/uuid page-uuid}
        db ::db]
    (with-redefs [d/entity (fn [db' lookup]
                             (is (= db db'))
                             (is (= [:block/uuid page-uuid] lookup))
                             entity)
                  worker-block/renderer-display-title
                  (fn [db' entity-id]
                    (is (= db db'))
                    (is (= 42 entity-id))
                    "Page with Reference")]
      (is (= {:db/id 42
              :block/uuid page-uuid
              :block/title "Page with Reference"
              :block.temp/first-window-preview? true}
             (#'worker-view/first-window-row-preview db page-uuid))))))

(deftest list-and-gallery-heads-do-not-wait-for-table-paint-test
  (let [rows [(random-uuid)]]
    (is (true? (#'views/view-head-ready-on-mount?
                :logseq.property.view/type.list nil rows))
        "Unlinked-references is a list view and never fires table items-rendered.")
    (is (true? (#'views/view-head-ready-on-mount?
                :logseq.property.view/type.gallery nil rows)))
    (is (true? (#'views/view-head-ready-on-mount?
                :logseq.property.view/type.table :flat rows))
        "Flat table chrome mounts with the view tabs and actions.")
    (is (true? (#'views/view-head-ready-on-mount?
                :logseq.property.view/type.table :grouped rows))
        "Grouped tables never fire table items-rendered. Chrome must mount with the groups.")
    (is (true? (#'views/view-head-ready-on-mount?
                :logseq.property.view/type.table :grouped-list rows)))
    (is (true? (#'views/empty-table-ready-on-mount? []))
        "Empty unused property tables never mount Virtuoso.")
    (is (false? (#'views/empty-table-ready-on-mount? rows)))
    (is (true? (#'views/view-head-ready-on-mount?
                :logseq.property.view/type.table :flat []))
        "Empty tables keep the property column and view-actions on mount.")))

(deftest view-tabs-reserve-a-slot-before-block-hydration-test
  (let [view-parent {:db/id 1}
        view-uuid (random-uuid)
        html (with-redefs [db-hooks/use-block (constantly nil)]
               (render-static
                (views/views-tab view-parent view-uuid
                                 {:view-uuids [view-uuid]
                                  :set-current-view-uuid! (fn [_])
                                  :view-feature-type :all-pages})))]
    (is (string/includes? html (str "view-tab-" view-uuid))
        "Each known view UUID should synchronously reserve a tab slot before the view block hydrates.")))

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

(deftest gallery-and-table-cover-hydration-keeps-asset-render-fields-test
  (let [cover-uuid #uuid "11111111-1111-1111-1111-111111111111"
        cover {:db/id 9
               :block/uuid cover-uuid
               :block/title "poster"
               :block/tags [{:db/ident :logseq.class/Asset}]
               :logseq.property.asset/type "webp"}
        row {:db/id 1
             :block/uuid #uuid "22222222-2222-2222-2222-222222222222"
             :block/title "Inception"
             :user.property/cover cover}
        cover-property {:db/ident :user.property/cover
                        :block/title "Cover"
                        :logseq.property/type :asset}
        columns (views/build-columns
                 {:view-parent {:db/ident :user.class/Movie}}
                 [cover-property]
                 {:with-object-name? false
                  :add-tags-column? false})
        cover-column (some #(when (= :user.property/cover (:id %)) %) columns)]
    (is (= :asset (get-in cover-column [:property :logseq.property/type]))
        "Cover columns keep the :asset type used by Gallery/Table.")
    (is (true? (views/gallery-cover-property-column? cover-column)))
    (is (= :user.property/cover
           (#'views/gallery-asset-property-ident
            {:logseq.property/view-for {:db/ident :user.class/Movie
                                        :block/tags [{:db/ident :logseq.class/Tag}]}
             :logseq.property.view/feature-type :class-objects}
            columns)))
    (is (= cover
           (views/gallery-card-asset-block row :user.property/cover)))
    (is (uuid? (:block/uuid (views/gallery-card-asset-block row :user.property/cover))))
    (is (= "webp"
           (:logseq.property.asset/type
            (views/gallery-card-asset-block row :user.property/cover)))
        "Hydrated Cover must keep the type/filename fields asset-cp needs.")))

(defn- test-gallery-columns
  [properties]
  (views/build-columns
   {:view-parent {:db/ident :user.class/Book}}
   properties
   {:with-object-name? false
    :add-tags-column? false}))

(defn- test-class-view
  []
  {:logseq.property/view-for {:db/ident :user.class/Book
                              :block/tags [{:db/ident :logseq.class/Tag}]}
   :logseq.property.view/feature-type :class-objects})

(deftest gallery-cover-picker-includes-url-properties-test
  (let [url-property {:db/ident :user.property/cover
                      :block/title "Cover"
                      :logseq.property/type :url}
        website-property {:db/ident :user.property/website
                          :block/title "Website"
                          :logseq.property/type :url}
        title-property {:db/ident :user.property/subtitle
                        :block/title "Subtitle"
                        :logseq.property/type :default}
        asset-property {:db/ident :user.property/poster
                        :block/title "Poster"
                        :logseq.property/type :asset}
        url-columns (test-gallery-columns [url-property title-property])
        mixed-columns (test-gallery-columns [url-property asset-property])
        url-column (some #(when (= :user.property/cover (:id %)) %) url-columns)
        website-column (some #(when (= :user.property/website (:id %)) %)
                             (test-gallery-columns [website-property]))
        title-column (some #(when (= :user.property/subtitle (:id %)) %) url-columns)
        asset-column (some #(when (= :user.property/poster (:id %)) %) mixed-columns)]
    (is (true? (views/gallery-cover-property-column? url-column))
        "URL properties are eligible gallery covers.")
    (is (true? (views/gallery-cover-property-column? website-column)))
    (is (true? (views/gallery-cover-property-column? asset-column))
        "Asset properties stay eligible.")
    (is (false? (views/gallery-cover-property-column? title-column))
        "Text properties are not cover sources.")
    (is (= :user.property/cover
           (#'views/gallery-asset-property-ident (test-class-view) url-columns))
        "A lone URL cover property is auto-selected.")
    (is (nil? (#'views/gallery-asset-property-ident (test-class-view) mixed-columns))
        "Asset and URL covers are not auto-selected when both exist.")
    (is (= :user.property/website
           (#'views/gallery-asset-property-ident
            (assoc (test-class-view)
                   :logseq.property.view/gallery-asset-property-ident :user.property/website)
            (test-gallery-columns [website-property title-property])))
        "A configured URL property is used as the cover source.")))

(deftest gallery-card-cover-url-extracts-remote-image-urls-test
  (let [image-url "https://picsum.photos/400/300.jpg"]
    (is (= image-url
           (views/gallery-card-cover-url
            {:user.property/cover image-url}
            :user.property/cover))
        "Plain URL strings can supply the card image.")
    (is (= image-url
           (views/gallery-card-cover-url
            {:user.property/cover {:logseq.property/value image-url}}
            :user.property/cover))
        "Ref URL values use :logseq.property/value.")
    (is (= image-url
           (views/gallery-card-cover-url
            {:user.property/cover {:block/title image-url}}
            :user.property/cover)))
    (is (= image-url
           (views/gallery-card-cover-url
            {:user.property/cover #{{:logseq.property/value image-url}
                                    {:logseq.property/value ""}}}
            :user.property/cover))
        "Many-valued URL properties use the first remote image URL.")
    (is (nil? (views/gallery-card-cover-url
               {:user.property/cover "  "}
               :user.property/cover)))
    (is (nil? (views/gallery-card-cover-url
               {:user.property/cover nil}
               :user.property/cover)))
    (is (nil? (views/gallery-card-cover-url
               {:user.property/cover "javascript:alert(1)"}
               :user.property/cover)))
    (is (nil? (views/gallery-card-cover-url
               {:user.property/cover "file:///tmp/poster.jpg"}
               :user.property/cover)))
    (is (nil? (views/gallery-card-cover-url
               {:user.property/cover {:logseq.property/value "not-a-url"}}
               :user.property/cover)))
    (is (nil? (views/gallery-card-cover-url
               {:block/title "Sample Book"}
               :block/uuid))
        "Asset-class :block/uuid covers are not treated as URL covers.")))

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

(deftest grouped-table-prefetch-uses-group-uuids-not-group-values-test
  (let [row-a (random-uuid)
        row-b (random-uuid)
        breadcrumb-uuid (random-uuid)
        group-rows [row-a row-b]
        grouped-pairs [[{:kind :scalar :value "Open"} group-rows]]
        grouped-list-partitions [[breadcrumb-uuid group-rows]]]
    (is (= group-rows
           (#'views/table-body-row-ids grouped-pairs group-rows nil))
        "A grouped [value rows] all-row-ids list must not be prefetched as block UUIDs.")
    (is (= group-rows
           (#'views/table-body-row-ids group-rows nil nil))
        "Flat windowed tables still prefetch the UUID list.")
    (is (= []
           (#'views/table-body-row-ids nil grouped-list-partitions grouped-list-partitions))
        "List→Table must not treat :grouped-list [breadcrumb rows] partitions as block UUIDs.")))

(deftest view-search-keeps-the-search-icon-button-test
  (let [html (render-static
              (views/search "" {:on-change (fn [_])
                                :set-input! (fn [_])}))]
    (is (string/includes? html "ls-icon-search")
        "table-view-search e2e clicks .view-actions button:has(.ls-icon-search).")))

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

(deftest lazy-item-paints-first-window-title-before-use-block-test
  (let [row-uuid (random-uuid)
        preview {:block/uuid row-uuid
                 :block/title "Æon Flux (2005)"
                 :block.temp/first-window-preview? true}
        calls (atom [])]
    (is (true? (#'views/first-window-title-preview? preview)))
    (is (= "Æon Flux (2005)" (#'views/first-window-title-text preview)))
    (with-redefs [db-hooks/use-block
                  (fn [requested-uuid]
                    (swap! calls conj requested-uuid)
                    nil)]
      (is (string/includes?
           (render-static
            (views/lazy-item
             [row-uuid]
             0
             {:row-previews {row-uuid preview}}
             (fn [item]
               (.createElement react "span" nil (#'views/first-window-title-text item)))))
           "Æon Flux (2005)")
          "First-window titles paint when view-data arrives, before the block snapshot.")
      (is (empty? @calls)
          "Preview paint must not subscribe use-block on the first frame."))))

(deftest list-view-preview-paints-title-before-block-container-test
  (let [row-uuid (random-uuid)
        preview {:block/uuid row-uuid
                 :block/title "Brazil (1985)"
                 :block.temp/first-window-preview? true}
        calls (atom [])]
    (with-redefs [db-hooks/use-block
                  (fn [requested-uuid]
                    (swap! calls conj requested-uuid)
                    nil)]
      (is (string/includes?
           (render-static
            (views/lazy-item
             [row-uuid]
             0
             {:row-previews {row-uuid preview}
              :list-view? true}
             (fn [item]
               (#'views/first-window-list-block item))))
           "Brazil (1985)")
          "List view first paint should show the preview title instead of waiting for the full block container.")
      (is (empty? @calls)))))

(deftest filter-value-renders-referenced-uuid-content-test
  (let [value-uuid (random-uuid)
        table {:data-fns {:set-filters! (fn [_])}
               :state {:filters {:filters [[:user.property/ref :is #{value-uuid}]]}}}
        property {:db/ident :user.property/ref
                  :block/title "Reference"}]
    (with-redefs [db-hooks/use-block
                  (fn [block-uuid]
                    (when (= value-uuid block-uuid)
                      {:block/uuid block-uuid
                       :block/title "Referenced value"}))]
      (is (string/includes?
           (render-static
            (views/filter-value-select {} table property #{value-uuid} :is 0 {}))
           "Referenced value")))))

(deftest view-prefetch-window-holds-row-subscriptions-test
  (let [rows (mapv (fn [_] (random-uuid)) (range 100))
        medium-rows (mapv (fn [_] (random-uuid)) (range 625))
        large-rows (mapv (fn [_] (random-uuid)) (range 2000))
        window-size (#'views/view-prefetch-row-count 990 33)
        subscribed (atom [])
        unsubscribed (atom [])]
    (is (= 30 window-size)
        "A 990px table prefetch window is one screen, not both overscan sides.")
    (is (= (subvec rows 40 70)
           (test-prefetch-window rows 40 40 window-size))
        "A 100-row view still hydrates only one screen around the cursor.")
    (is (= (subvec rows 0 10)
           (test-prefetch-window (subvec rows 0 10) 90 99 window-size))
        "A filtered view can shrink before Virtuoso reports its new range.")
    (is (= (subvec medium-rows 0 window-size)
           (test-prefetch-window medium-rows 0 29 window-size))
        "A medium view only retains a screen-sized hydrate window.")
    (is (= (test-prefetch-window large-rows 1000 1000 window-size)
           (subvec large-rows 1000 1030))
        "Large views retain one screen-sized window around the rendered rows.")
    (with-redefs [subs/subscribe-block!
                  (fn [block-uuid _listener]
                    (swap! subscribed conj block-uuid)
                    #(swap! unsubscribed conj block-uuid))]
      (let [cleanup (atom nil)]
        (with-use-sync-external-store
          (fn [subscribe get-snapshot _get-server-snapshot]
            (reset! cleanup (subscribe (fn [])))
            (get-snapshot))
          (fn []
            (is (false? (db-hooks/use-block-prefetch rows)))))
        (is (= rows @subscribed))
        (@cleanup)
        (is (= rows @unsubscribed))))))

(deftest initial-view-prefetch-count-follows-the-viewport-test
  (is (= 30 (#'views/initial-view-prefetch-count 990 33)))
  (is (= 182 (#'views/initial-view-prefetch-count 6000 33))
      "A tall viewport hydrates enough rows to fill the screen, not a fixed 160.")
  (is (= 304 (#'views/initial-view-prefetch-count 10000 33)))
  (is (= 1 (#'views/initial-view-prefetch-count 0 33)))
  (is (= 30 (#'views/view-prefetch-row-count 990 33)))
  (is (= 182 (#'views/view-prefetch-row-count 6000 33))
      "Prefetch stays one screen. Virtuoso overscan is not hydrated."))

(deftest measured-viewport-height-ignores-unlaid-out-parents-test
  (is (= 990 (#'views/measured-viewport-height 0 990))
      "A 0 clientHeight is pre-layout. Using it hydrates one row.")
  (is (= 990 (#'views/measured-viewport-height nil 990)))
  (is (= 880 (#'views/measured-viewport-height 880 990)))
  (is (= 30 (#'views/initial-view-prefetch-count
             (#'views/measured-viewport-height 0 990)
             33))
      "Opening a table must request one screen, not 1 row.")
  (let [row-uuid (random-uuid)]
    (is (false? (#'views/viewport-filled? true #{}))
        "An empty prefetch is every? true. Do not mount placeholder rows or remaining ids.")
    (is (false? (#'views/viewport-filled? false #{row-uuid})))
    (is (true? (#'views/viewport-filled? true #{row-uuid}))
        "Opening a table mounts Virtuoso only after the viewport hydrate set exists.")
    (is (true? (#'views/table-body-can-paint? false #{} {row-uuid {:block/title "Movie"}}))
        "First-window titles skip the hydrate gate.")
    (is (false? (#'views/table-body-can-paint? false #{} {}))
        "Without titles, an empty table still waits for hydrate.")
    (is (= 3883 (#'views/table-total-count (range 26) 3883))
        "The first window already has the full count. Do not wait for remaining ids.")
    (is (= 26 (#'views/table-total-count (range 26) nil)))))

(deftest windowed-view-feature-covers-tags-and-all-pages-test
  (is (true? (#'views/windowed-view-feature? :all-pages nil)))
  (is (true? (#'views/windowed-view-feature? :class-objects nil)))
  (is (false? (#'views/windowed-view-feature? :class-objects :block/page))
      "Grouped class tables keep a single full query.")
  (is (false? (#'views/windowed-view-feature? :linked-references nil)))
  (let [view-uuid (random-uuid)
        plan (#'views/loaded-view-resource-plan
              view-uuid :class-objects nil nil "" nil nil 990)
        window-context (:window-context plan)
        full-context (:full-context plan)
        single (#'views/loaded-view-resource-plan
                view-uuid :linked-references nil nil "" nil nil 990)]
    (is (= [:view-data view-uuid window-context] (:resource-key plan)))
    (is (= [:view-data view-uuid (:full-context plan)] (:full-key plan))
        "The full rows resource is available after the first table paint for bulk actions.")
    (is (nil? (#'views/offset-view-data-key view-uuid window-context nil))
        "The offset window must not start before the user scrolls.")
    (is (nil? (#'views/offset-view-data-key view-uuid window-context 0)))
    (is (= [:view-data view-uuid (assoc window-context :row-offset 72 :initial-row-count 60)]
           (#'views/offset-view-data-key view-uuid window-context 72))
        "Offset windows fetch two screens so rapid scroll does not run off the current one.")
    (is (= [:view-data view-uuid full-context] (:full-key plan)))
    (is (= [:view-data view-uuid (:full-context single)] (:resource-key single)))
    (is (nil? (:full-key single)))))

(deftest table-virtualization-uses-fixed-row-height
  (is (= {:item-height 33 :overscan-px 66}
         (#'views/table-virtualization-metrics))
      "Overscan is two placeholder rows. 1650px each side was mounting ~127 use-block rows."))

(deftest tags-and-all-pages-paint-as-soon-as-the-first-window-arrives-test
  (doseq [feature-type [:class-objects :all-pages]]
    (testing (str feature-type)
      (let [view-uuid (random-uuid)
            window-rows (mapv (fn [_] (random-uuid)) (range 30))
            window-data {:partition :flat
                         :count 4000
                         :rows window-rows}
            sorting [{:id :block/title :asc? true}]
            plan (#'views/loaded-view-resource-plan
                  view-uuid feature-type sorting nil "" nil nil 990)
            paint (#'views/loaded-view-paint window-data)]
        (is (= 30 (:initial-row-count plan)))
        (is (= 30 (get-in plan [:resource-key 2 :initial-row-count])))
        (is (= (:full-context plan) (get-in plan [:full-key 2]))
            "The full rows resource is separate from the first-paint resource.")
        (is (nil? (#'views/offset-view-data-key
                   view-uuid (get-in plan [:resource-key 2]) 0))
            "The follow-up query is a scrolled offset window, not every remaining id.")
        (is (true? (:ready? paint))
            "Tags and All Pages must paint from the first window without the full id list.")
        (is (= 4000 (:items-count paint)))
        (is (= window-rows (:rows paint)))
        (is (false? (:ready? (#'views/loaded-view-paint nil)))
            "A cold view stays on the short skeleton until that first window exists.")))))

(deftest loaded-view-keeps-previous-paint-while-next-search-loads-test
  (let [ready-view-data {:partition :flat
                         :count 1
                         :rows [(random-uuid)]}]
    (is (= ready-view-data (#'views/view-paint-source ready-view-data nil)))
    (is (= ready-view-data (#'views/view-paint-source nil ready-view-data))
        "Typing into the view search changes the resource key before the worker returns; keep the old view mounted so the input stays open.")))

(deftest first-window-fills-a-tall-viewport-from-screen-height-test
  (let [view-uuid (random-uuid)
        plan (#'views/loaded-view-resource-plan
              view-uuid :class-objects [{:id :block/title :asc? true}]
              nil "" nil nil 6000)]
    (is (= 182 (:initial-row-count plan)))
    (is (= 182 (get-in plan [:resource-key 2 :initial-row-count]))
        "A tall viewport first window is ceil(height / row-height), not a fixed 160.")
    (is (= (:full-context plan) (get-in plan [:full-key 2]))
        "The full rows resource stays separate from the first-paint window.")))

(defn- visible-viewport-row-range
  [scroll-top viewport-height item-height total-count]
  (#'views/viewport-row-range scroll-top viewport-height item-height total-count))

(deftest table-prefetch-matches-one-screen-not-overscan-test
  (let [{:keys [item-height overscan-px]} (#'views/table-virtualization-metrics)
        viewport-height 990
        window-size (#'views/view-prefetch-row-count viewport-height item-height)
        overscan-rows (quot overscan-px item-height)]
    (is (= (#'views/initial-view-prefetch-count viewport-height item-height)
           window-size)
        "Prefetch hydrates the on-screen rows. Overscan placeholders stay empty.")
    (is (= 2 overscan-rows)
        "Virtuoso keeps two placeholder rows, not a 50-row overscan side.")
    (is (= [0 29] (#'views/viewport-row-range 0 viewport-height item-height 40000)))
    (is (= [0 29] (#'views/view-prefetch-bounds 40000 0 29 window-size)))
    (is (= [48 77] (#'views/view-prefetch-bounds 40000 0 126 window-size))
        "A 127-row mounted range would skip the first screen if used as hydrate bounds.")
    (is (= [0 29] (#'views/prefetch-visible-range [0 29]))
        "Table prefetch takes the viewport range, not Virtuoso's mounted list.")
    (is (string/includes?
         (render-static (views/lazy-item-placeholder true false nil nil nil))
         "min-height:33px")
        "Mounted overscan rows stay empty placeholders and skip use-block.")
    (is (string/includes?
         (render-static (views/lazy-item-placeholder true false nil nil nil))
         "height:33px")
        "Table placeholders must keep the same fixed height as hydrated rows.")))

(deftest table-placeholder-rows-keep-cell-borders-test
  (let [table {:state {:pinned-columns [{:id :block/title
                                         :cell (fn [_table _row _column _style])}]
                       :unpinned-columns [{:id :block/updated-at
                                           :cell (fn [_table _row _column _style])}]
                       :sized-columns {:block/title 320
                                       :block/updated-at 180}}}
        html (render-static
              (views/lazy-item-placeholder
               true false table 42 {:show-add-property? false}))]
    (is (string/includes? html "ls-table-row"))
    (is (string/includes? html "ls-table-cell")
        "Loading table slots render empty cells so borders stay visible.")
    (is (string/includes? html "width:320px"))
    (is (string/includes? html "width:180px"))))

(deftest remaining-ids-move-prefetch-off-the-first-window-test
  (let [first-window (mapv (fn [_] (random-uuid)) (range 26))
        offset-window (mapv (fn [_] (random-uuid)) (range 26))]
    (is (= [0 25]
           (#'views/next-view-prefetch-bounds 26 [0 25] 72 97 26))
        "An offset window is one screen of UUIDs. Prefetch that short vector, not 40938 ids.")
    (is (nil? (#'views/table-row-at first-window nil nil 72))
        "Row 72 is unknown before the offset window arrives.")
    (is (= (nth offset-window 0)
           (#'views/table-row-at first-window offset-window 72 72)))
    (is (= (nth first-window 0)
           (#'views/table-row-at first-window offset-window 72 0))
        "The first window stays addressable after the offset window arrives.")
    (is (= 72 (#'views/scrolled-row-offset 2400 0 33))
        "With no chrome, 2400px is row 72.")
    (is (= 66 (#'views/scrolled-row-offset 2400 196 33))
        "Movies chrome is 196px. scrollTop 2400 is row 66, not 72.")
    (is (= 69 (#'views/scrolled-row-offset 2400 98 33))
        "All Pages chrome is 98px. scrollTop 2400 is row 69, not 72.")
    (doseq [idx (range 66 72)]
      (is (nil? (#'views/table-row-at first-window offset-window 72 idx))
          (str "Offset 72 leaves visible Movies row " idx " empty.")))
    (let [movies-offset (mapv (fn [_] (random-uuid)) (range 27))]
      (doseq [idx (range 66 93)]
        (is (some? (#'views/table-row-at first-window movies-offset 66 idx))
            (str "Offset 66 must cover visible Movies row " idx ".")))
      (is (= (nth movies-offset 10)
             (#'views/table-row-at first-window nil 90 movies-offset 66 76))
          "The previous offset window stays addressable until the next one arrives."))
    (let [short-offset (mapv (fn [_] (random-uuid)) (range 11))]
      (is (= 11 (count (#'views/prefetch-rows-in-bounds short-offset [0 25])))
          "A shorter Tags offset window must not throw on stale first-window bounds."))))

(deftest table-row-key-distinguishes-overlapping-windows-test
  (let [row-id (random-uuid)
        first-window [row-id]
        offset-window [row-id]
        keys (mapv #(#'views/table-row-key first-window offset-window 30 nil nil %)
                   [0 30])]
    (is (= 2 (count (distinct keys)))
        "A row UUID can briefly appear in two windows; React keys still need to be unique per virtual row slot.")
    (is (every? #(string/includes? % (str row-id)) keys))))

(deftest windowed-view-row-helpers-use-the-shared-offset-windows-test
  (let [first-window [(random-uuid)]
        offset-window [(random-uuid)]
        option {:all-row-ids first-window
                :items-count 100
                :offset-rows offset-window
                :row-offset 30}]
    (is (= 100 (#'views/windowed-view-total-count first-window option)))
    (is (= (first first-window) (#'views/windowed-view-row first-window option 0)))
    (is (= (first offset-window) (#'views/windowed-view-row first-window option 30)))
    (is (nil? (#'views/windowed-view-row first-window option 29)))
    (is (string/includes?
         (#'views/windowed-view-row-key "list-row" first-window option 30)
         (str (first offset-window))))))

(deftest stale-offset-window-only-applies-to-the-same-resource-context-test
  (let [ctx {:feature-type :class-objects
             :sorting [{:id :block/title :asc? true}]
             :initial-row-count 26}
        stale {:context ctx
               :row-offset 72
               :rows [(random-uuid)]
               :previews {:a :preview}}]
    (is (= stale (#'views/matching-stale-offset-window stale ctx)))
    (is (nil? (#'views/matching-stale-offset-window
               stale
               (assoc ctx :sorting [{:id :block/title :asc? false}])))
        "Stale offset rows from an old sort/filter/input context must not paint in the new view.")))

(deftest scrolled-offset-stays-put-until-the-visible-range-leaves-test
  (is (true? (#'views/offset-window-covers-visible? 26 27 28 51)))
  (is (false? (#'views/offset-window-covers-visible? 26 27 28 53)))
  (is (nil? (#'views/next-scrolled-row-offset nil 27 0 8 26))
      "The top of the first window does not fetch an offset.")
  (is (= 26 (#'views/next-scrolled-row-offset nil 27 0 22 26))
      "The first wheel prefetches the next screen before the first window runs out.")
  (is (= 26 (#'views/next-scrolled-row-offset nil 27 4 30 26))
      "The first wheel past the first window fetches the next screen, not every row.")
  (is (= 26 (#'views/next-scrolled-row-offset 26 27 28 36 26))
      "Keep the same offset window while the visible rows stay inside it.")
  (is (= 30 (#'views/next-scrolled-row-offset 26 27 30 52 26))
      "Start the next offset before the visible range runs off the current window.")
  (is (= 40 (#'views/next-scrolled-row-offset 26 27 40 66 26))
      "Move the window only after the visible range leaves it.")
  (is (= 26 (#'views/next-scrolled-row-offset 26 27 40 66 26 false))
      "An in-flight Movies offset must finish. A new key cancelled the fetch and left 27 empty rows.")
  (is (= 400 (#'views/next-scrolled-row-offset 26 27 400 426 26 false))
      "Continuous fast scroll must replace an obsolete in-flight offset once the visible range leaves it.")
  (is (= 900 (#'views/next-scrolled-row-offset 920 30 900 929 30 false))
      "Repeated scroll can leave an in-flight offset below the viewport top; replace it so the table does not paint a blank band above the rows.")
  (is (= 37609 (#'views/next-scrolled-row-offset nil 48 37609 37632 24))
      "Restoring a deep scroll position starts an offset window even before any offset rows exist.")
  (is (= [66 92] (#'views/viewport-row-range 2400 196 852 33 40000))
      "Movies chrome is 196px. scrollTop 2400 is rows 66-92, not 72-97."))

(deftest continuous-scroll-keeps-the-same-prefetch-window-until-the-range-moves-test
  (let [rows (mapv (fn [_] (random-uuid)) (range 2000))
        window-size 30
        first-bounds (#'views/next-view-prefetch-bounds 2000 nil 0 29 window-size)
        still-inside (#'views/next-view-prefetch-bounds 2000 first-bounds 0 29 window-size)
        moved (#'views/next-view-prefetch-bounds 2000 first-bounds 20 49 window-size)]
    (is (= [0 29] first-bounds))
    (is (= first-bounds still-inside)
        "The same on-screen range keeps the same one-screen window.")
    (is (not= first-bounds moved)
        "The window moves when the visible screen leaves the current rows.")
    (let [jumped (test-next-prefetch-window rows first-bounds 800 829 window-size)]
      (is (not= (subvec rows 0 30) jumped))
      (is (every? (set jumped) (subvec rows 800 830))
          "A jump still keeps the new visible screen subscribed."))))

(deftest consecutive-fast-scroll-keeps-every-visible-row-subscribed-test
  (let [rows (mapv (fn [_] (random-uuid)) (range 2000))
        {:keys [item-height]} (#'views/table-virtualization-metrics)
        viewport-height 990
        ready-title "Scrolled row is ready"]
    (doseq [jump-index [0 30 90 400 800 1500]]
      (let [scroll-top (* jump-index item-height)
            [start end] (visible-viewport-row-range
                         scroll-top viewport-height item-height (count rows))
            prefetched (test-prefetch-window
                        rows start end
                        (#'views/view-prefetch-row-count
                         viewport-height item-height))
            needed (subvec rows start (inc end))]
        (is (every? (set prefetched) needed)
            (str "Jumping to row " jump-index " must keep the visible screen subscribed."))
        (with-redefs [db-hooks/use-block
                      (fn [block-uuid]
                        (when (contains? (set prefetched) block-uuid)
                          {:block/uuid block-uuid
                           :block/title ready-title}))]
          (is (string/includes?
               (render-static
                (views/lazy-item rows jump-index {:table-view? true}
                                 (fn [item]
                                   (.createElement react "span" nil (:block/title item)))))
               ready-title)
              (str "Row " jump-index " must render data immediately after the jump.")))))))

(deftest fast-scroll-keeps-visible-screen-ready-to-render-test
  (let [rows (mapv (fn [_] (random-uuid)) (range 2000))
        {:keys [item-height]} (#'views/table-virtualization-metrics)
        viewport-height 990
        jump-index 800
        scroll-top (* jump-index item-height)
        [start end] (visible-viewport-row-range
                     scroll-top viewport-height item-height (count rows))
        prefetched (test-prefetch-window
                    rows start end
                    (#'views/view-prefetch-row-count viewport-height item-height))
        needed (subvec rows start (inc end))
        ready-title "Scrolled row is ready"]
    (is (pos? (- end start)))
    (is (every? (set prefetched) needed)
        "After a jump scroll, the on-screen rows stay subscribed.")
    (with-redefs [db-hooks/use-block
                  (fn [block-uuid]
                    (when (contains? (set prefetched) block-uuid)
                      {:block/uuid block-uuid
                       :block/title ready-title}))]
      (is (string/includes?
           (render-static
            (views/lazy-item rows jump-index {:table-view? true}
                             (fn [item]
                               (.createElement react "span" nil (:block/title item)))))
           ready-title)
          "A visible row renders its data as soon as the prefetch window has the block.")
      (is (string/includes?
           (render-static
            (views/lazy-item rows start {:table-view? true}
                             (fn [item]
                               (.createElement react "span" nil (:block/title item)))))
           ready-title))
      (is (string/includes?
           (render-static
            (views/lazy-item rows end {:table-view? true}
                             (fn [item]
                               (.createElement react "span" nil (:block/title item)))))
           ready-title))
      (let [blank (render-static
                   (views/lazy-item rows 0 {:table-view? true}
                                    (fn [item]
                                      (.createElement react "span" nil (:block/title item)))))]
        (is (not (string/includes? blank ready-title)))
        (is (string/includes? blank "min-height:33px")
            "Rows outside the scrolled window stay placeholders instead of blocking paint.")))))

(deftest table-cells-render-eagerly-once-rows-are-windowed
  (is (true? (#'views/eager-table-cells? false {:id :block/title} true))
      "The name column is on-screen even when unpinned.")
  (is (true? (#'views/eager-table-cells? false {:id :select} false)))
  (is (false? (#'views/eager-table-cells? false {:id :user.property/actors} true))
      "Unpinned property columns stay lazy. Movies first paint mounted 23 property cells per row.")
  (is (true? (#'views/eager-table-cells? false {:id :user.property/actors} false)))
  (is (false? (#'views/eager-table-cells? true {:id :block/title} false))
      "Grouped tables disable row virtualization and keep per-cell lazy mounts."))

(deftest view-instance-key-survives-pending-entity-hydrate-test
  (let [view-uuid (random-uuid)]
    (is (= (#'views/view-instance-key {:block/uuid view-uuid})
           (#'views/view-instance-key {:block/uuid view-uuid :db/id 78981}))
        "All Pages remounted the painted table when db/id arrived.")))

(deftest first-paint-keeps-pending-view-and-class-properties-test
  (let [view-uuid (random-uuid)
        next-view-uuid (random-uuid)
        pending {:block/uuid view-uuid}
        next-pending {:block/uuid next-view-uuid}
        entity {:block/uuid view-uuid :db/id 78981}]
    (is (= pending (#'views/first-paint-view-entity entity pending false)))
    (is (= entity (#'views/first-paint-view-entity entity pending true)))
    (is (= next-pending (#'views/first-paint-view-entity entity next-pending true))
        "A hydrated entity from the previous selected tab must not render the next tab.")
    (is (= [] (#'views/first-paint-class-properties [{:db/ident :user.property/actors}] false))
        "Movies applied 17 class properties before the first table frame.")
    (is (= [{:db/ident :user.property/actors}]
           (#'views/first-paint-class-properties [{:db/ident :user.property/actors}] true)))
    (is (false? (#'views/lazy-item-should-subscribe? {:block/title "Æon Flux"} false))
        "Preview rows subscribed via use-block before the first title frame committed.")
    (is (true? (#'views/lazy-item-should-subscribe? {:block/title "Æon Flux"} true)))
    (is (true? (#'views/lazy-item-should-subscribe? nil false))
        "Rows without a first-window preview still subscribe immediately.")))

(deftest table-selection-summary-uses-full-data-for-windowed-actions-test
  (let [first-row {:block/uuid (random-uuid)}
        hidden-row {:block/uuid (random-uuid)}
        table {:rows [first-row]
               :full-data [first-row hidden-row]}
        summary (#'views/table-selection-summary table {:selected-all? true})]
    (is (= [first-row hidden-row] (:selected-rows summary))
        "Select-all actions on a windowed table must target the full result, not the visible window.")
    (is (true? (:selected-all? summary)))))

(deftest table-selection-summary-waits-for-full-data-before-windowed-actions-test
  (let [first-row {:block/uuid (random-uuid)}
        table {:rows [first-row]
               :full-data-loading? true}
        summary (#'views/table-selection-summary table {:selected-all? true})]
    (is (empty? (:selected-rows summary))
        "Select-all actions must not silently fall back to the first window while full rows are loading.")
    (is (false? (:selected-some? summary)))))

(deftest first-paint-skips-unpinned-property-columns-test
  (let [columns [{:id :block/title} {:id :user.property/actors} {:id :select}]]
    (is (= [{:id :block/title} {:id :select}]
           (#'views/visible-unpinned-columns columns false))
        "React Doctor counted 290 table-cell-container mounts on first paint.")
    (is (= columns
           (#'views/visible-unpinned-columns columns true))
        "Property columns mount after the name column has painted.")))

(deftest table-cell-plain-value-exposes-clipped-text
  (is (nil? (#'views/table-cell-plain-value {:block/title "Movie"} {:id :select})))
  (is (= "You Can't Say No (2018)"
         (#'views/table-cell-plain-value {:block/title "You Can't Say No (2018)"}
                                         {:id :block/title})))
  (is (= "https://www.imdb.com/title/tt5849986/"
         (#'views/table-cell-plain-value
          {:user.property/imdb-url "https://www.imdb.com/title/tt5849986/"}
          {:id :user.property/imdb-url
           :get-value (fn [row] (:user.property/imdb-url row))}))))

(deftest gallery-loading-row-keeps-the-card-size-test
  (with-redefs [db-hooks/use-block (constantly nil)]
    (let [markup (render-static
                  (views/lazy-item
                   [(random-uuid)]
                   0
                   {:gallery-view? true}
                   (fn [_item] nil)))]
      (is (string/includes? markup "ls-card-item")
          "An unloaded gallery row must use the same CSS height as a loaded card.")
      (is (not (string/includes? markup "min-height:24px"))))))

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
      (is (= [view-uuid] @block-calls)
          "use-block still hydrates the view definition.")
      (is (= {:block/uuid view-uuid} (first @rendered))
          "First static paint keeps the pending view. items-rendered swaps in the hydrated entity.")
      (is (= owner-uuid (get-in @rendered [1 :view-parent-uuid]))))))

(deftest selected-view-starts-view-data-before-the-view-entity-arrives-test
  (let [owner-uuid (random-uuid)
        view-uuid (random-uuid)
        rendered (atom nil)]
    (with-redefs [db-hooks/use-resource
                  (fn [_resource-key]
                    [view-uuid])
                  db-hooks/use-block
                  (fn [_requested-uuid]
                    nil)
                  views/view-aux
                  (fn [view option]
                    (reset! rendered [view option])
                    [:span "view"])]
      (render-static
       (views/view {:view-parent-uuid owner-uuid
                    :view-feature-type :class-objects}))
      (is (= {:block/uuid view-uuid} (first @rendered))
          "Tags/All Pages must request view-data without waiting for the view block snapshot."))))

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
                                  :slots
                                  {[:resource resource-key]
                                   {:watch {:keys #{watch-key} :all? false}
                                    :value value}}})))]
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

(deftest table-tag-cell-click-is-noop-on-current-page-test
  (let [tag-uuid (random-uuid)
        tag {:block/uuid tag-uuid
             :block/title "Book"
             :block/name "book"}
        popup-calls (atom [])
        redirect-calls (atom [])]
    (is (= :noop
           (#'property-value/page-ref-cell-click
            {:entity tag
             :current-page (str tag-uuid)
             :open-popup! #(swap! popup-calls conj :popup)
             :redirect! #(swap! redirect-calls conj :redirect)}))
        "Clicking the current tag page's own tag value should not open a popup or navigate.")
    (is (empty? @popup-calls))
    (is (empty? @redirect-calls))))

(deftest table-tag-cell-click-opens-popup-for-other-tags-test
  (let [current-page (str (random-uuid))
        other-tag {:block/uuid (random-uuid)
                   :block/title "Movie"
                   :block/name "movie"}
        popup-calls (atom [])
        redirect-calls (atom [])]
    (is (= :open
           (#'property-value/page-ref-cell-click
            {:entity other-tag
             :current-page current-page
             :open-popup! #(swap! popup-calls conj :popup)
             :redirect! #(swap! redirect-calls conj :redirect)}))
        "A different tag still opens the popup and navigates.")
    (is (= [:popup] @popup-calls))
    (is (= [:redirect] @redirect-calls))))

(deftest delete-pages-needs-confirm-covers-every-destructive-view
  (let [pages [{:db/id 1 :block/uuid (random-uuid)}]
        tag-parent {:db/ident :user.class/MyTag}
        page-class-parent {:db/ident :logseq.class/Page}]
    (is (true? (views/delete-pages-needs-confirm? tag-parent :class-objects pages))
        "A tag page's trash action deleted pages instantly before this fix (db-test#1211)")
    (is (true? (views/delete-pages-needs-confirm? nil :query-result pages))
        "A query result's trash action deleted pages instantly before this fix")
    (is (true? (views/delete-pages-needs-confirm? nil :all-pages pages))
        "All Pages already confirmed and must keep doing so")
    (is (false? (views/delete-pages-needs-confirm? page-class-parent :class-objects pages))
        "The built-in Page class never deletes its rows, so nothing needs confirming")
    (is (false? (views/delete-pages-needs-confirm? tag-parent :property-objects pages))
        "Property objects only retract a property value, they delete no page")
    (is (false? (views/delete-pages-needs-confirm? tag-parent :unknown-feature pages))
        "An unrecognised view must not be treated as destructive")
    (is (false? (views/delete-pages-needs-confirm? tag-parent :class-objects []))
        "A block-only selection must delete at once, with no page dialog")))

(deftest on-delete-rows-confirms-instead-of-deleting-pages-inline
  (async done
    (let [on-delete-rows #'views/on-delete-rows
          page {:db/id 1
                :block/uuid (random-uuid)
                :block/title "Alpha"
                :block/tags [:logseq.class/Page]}
          deleted-pages (atom [])
          events (atom [])
          cleared (atom 0)
          table {:data-fns {:set-row-selection! (fn [_] (swap! cleared inc))}}
          original-repo state/get-current-repo
          original-get-blocks db-async/<get-blocks
          original-delete-page! outliner-op/delete-page!
          original-pub-event! state/pub-event!]
      (set! state/get-current-repo (fn [] "views-delete-test"))
      (set! db-async/<get-blocks (fn [_repo _ids _opts] (p/resolved [{:block page}])))
      (set! outliner-op/delete-page! (fn [id] (swap! deleted-pages conj id) nil))
      (set! state/pub-event! (fn [event] (swap! events conj event) nil))
      (-> (p/let [_ (on-delete-rows {:db/ident :user.class/MyTag} :class-objects table [1])]
            (is (empty? @deleted-pages)
                "A tag page must not delete pages inline any more (db-test#1211)")
            (is (= 1 (count @events))
                "The trash action raises exactly one event")
            (let [[event-name event-pages] (first @events)]
              (is (= :page/show-delete-dialog event-name)
                  "That event is the page confirmation dialog")
              (is (= [(:block/uuid page)] (mapv :block/uuid event-pages))
                  "The dialog is handed the selected pages"))
            (is (zero? @cleared)
                "The selection is cleared by the dialog's callback, never before it"))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! state/get-current-repo original-repo)
                       (set! db-async/<get-blocks original-get-blocks)
                       (set! outliner-op/delete-page! original-delete-page!)
                       (set! state/pub-event! original-pub-event!)
                       (done)))))))
