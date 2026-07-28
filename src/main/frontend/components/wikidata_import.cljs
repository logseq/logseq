(ns frontend.components.wikidata-import
  "Wikidata property import panel.
   Shows a modal after creating a page from Wikidata, allowing users to
   select which properties to import (Author, Publisher, etc.)."
  (:require [clojure.edn :as edn]
            [clojure.string :as string]
            [frontend.components.property :as property]
            [frontend.components.wikidata :as wikidata]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.handler.common.page :as page-handler]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.shui.ui :as shui]
            [logseq.shui.hooks :as hooks]
            [io.factorhouse.hsx.core :as hsx]
            [promesa.core :as p]))

;; =============================================================================
;; Entity Reference Resolution
;; =============================================================================

(defn- <fetch-entity-label
  "Fetch the label for a Wikidata entity Q-ID.
   Returns promise with {:qid \"Q937\" :label \"Albert Einstein\"}"
  [qid]
  (let [user-lang (or (:preferred-language @state/state) "en")]
    (p/let [entity-data (wikidata/<fetch-wikidata-entity qid user-lang)]
      (when entity-data
        (let [labels (get entity-data "labels" {})
              label (or (get-in labels [user-lang "value"])
                        (get-in labels ["en" "value"])
                        qid)] ; Fallback to Q-ID if no label
          {:qid qid :label label})))))

(defn- <resolve-entity-refs
  "Resolve all entity references in a property's values to their labels.
   Resolves sequentially (one request in flight) instead of a p/all burst, so a
   person's many node values don't hammer the Wikidata API in parallel.
   Returns promise with values updated to include labels."
  [values]
  (p/let [resolved (reduce
                    (fn [acc-p value]
                      (p/let [acc acc-p
                              r (if-let [qid (:qid value)]
                                  (<fetch-entity-label qid)
                                  (p/resolved value))]
                        (conj acc r)))
                    (p/resolved [])
                    values)]
    (vec resolved)))

;; =============================================================================
;; Property & Page Creation
;; =============================================================================

(defn- get-or-create-property!
  "Get existing property by ident, or create it with the given title/type.
   Uses the explicit ident (not a title-derived slug, which diverges for e.g.
   \"Country of Origin\") and passes :property-name so the display title
   persists (upsert-property! reads :property-name, not :title).
   Returns the property entity."
  [property-ident property-title property-type]
  (let [existing (db/entity property-ident)]
    (if (and existing (= property-type (:logseq.property/type existing)))
      existing
      ;; Absent, OR exists with the WRONG type (e.g. an earlier import created it as
      ;; :default because the schema key was wrong). upsert-property! reads the type
      ;; from :logseq.property/type (NOT :type); update-property changes the type of an
      ;; existing property that has no data yet, self-healing the bad ones.
      (do
        (db-property-handler/upsert-property! property-ident
                                              {:logseq.property/type property-type}
                                              {:property-name property-title})
        (db/entity property-ident)))))

(defn- <ensure-page-for-entity!
  "Ensure a page exists for an entity reference.
   Creates the page if it doesn't exist.
   Returns the page entity."
  [label]
  (if-let [existing (db/get-case-page label)]
    (p/resolved existing)
    (page-handler/<create! label {:redirect? false})))

(defn- <import-property-value!
  "Import a single property value to the page.
   Handles different value types (string, datetime, entity ref)."
  [page-uuid property-ident value logseq-type]
  (p/let [;; For entity references, create/get the linked page
          final-value (if (and (= logseq-type :node) (:label value))
                        (p/let [linked-page (<ensure-page-for-entity! (:label value))]
                          (:db/id linked-page))
                        ;; For simple values, use directly
                        (if (:qid value)
                          (:label value) ; Use label if it's a resolved entity
                          value))]
    (db-property-handler/set-block-property! page-uuid property-ident final-value)))

(defn- <import-selected-properties!
  "Import all selected properties to the page."
  [page selected-properties all-properties]
  (p/let [page-uuid (:block/uuid page)
          ;; Process each selected property
          results (p/all
                   (for [prop-id selected-properties
                         :let [{:keys [logseq values]} (get all-properties prop-id)
                               {:keys [ident title type]} logseq
                               ;; Use first value for now (TODO: handle multiple values)
                               value (first values)]
                         :when value]
                     (p/let [;; Ensure property exists
                             _ (get-or-create-property! ident title type)
                             ;; Import the value
                             _ (<import-property-value! page-uuid ident value type)]
                       (js/console.log "[wikidata-import] Imported property:" title))))]
    (js/console.log "[wikidata-import] Imported" (count results) "properties")
    results))

;; =============================================================================
;; Type-driven import tiers (auto-commit scalars vs suggest node/multi)
;; =============================================================================

(defonce ^:private *wikidata-suggestions
  ;; {page-uuid {:items [{:pid :ident :title :type :values :status ...}]}}
  (atom {}))

(defn suggestions-atom
  "The page-scoped suggestions atom (for the inline band to subscribe to)."
  []
  *wikidata-suggestions)

(defn clear-suggestions!
  "Drop the stashed suggestions for a page (on undo / dismiss-all)."
  [page-uuid]
  (swap! *wikidata-suggestions dissoc page-uuid))

(defn split-tiers
  "Split extracted properties into {:auto ... :suggest ...}. AUTO = only single
   date facts (:datetime) — the universal essentials safe to write silently
   (birth/death/founded/published); the description writes separately. Everything
   else (website/:url, text, node-typed, multi-valued) is a one-click SUGGEST, so
   situational values like a person's website are never auto-imported."
  [properties]
  (reduce (fn [acc [pid {:keys [logseq values] :as entry}]]
            (if (and (contains? #{:datetime} (:type logseq))
                     (= 1 (count values)))
              (assoc-in acc [:auto pid] entry)
              (assoc-in acc [:suggest pid] entry)))
          {:auto {} :suggest {}}
          properties))

(defn <write-auto-properties!
  "Create (if needed) + set each single-valued scalar property on the page.
   Each write catches its own error so one bad value never aborts the batch.
   Returns a promise resolving to the number of properties written."
  [page-uuid auto-properties]
  (p/let [written (p/all
                   (for [[_pid {:keys [logseq values]}] auto-properties
                         :let [{:keys [ident title type]} logseq
                               value (first values)]
                         :when (some? value)]
                     (-> (p/let [_ (get-or-create-property! ident title type)
                                 _ (<import-property-value! page-uuid ident value type)]
                           true)
                         (p/catch (fn [_] false)))))]
    (count (filter true? written))))

(def ^:private suggestion-priority
  "Display order for suggested person properties (highest value first)."
  {"P106" 0 "P27" 1 "P108" 2 "P19" 3 "P20" 4})

(def ^:private suggestion-collapse-threshold
  "Show every suggestion below this count; larger sets use progressive disclosure." 6)

(def ^:private suggestion-visible-limit
  "How many ranked suggestions to show initially when progressive disclosure applies." 4)

(defn stash-suggestions!
  "Store the SUGGEST-tier properties for a page (ranked, high-value first); the
   inline band reads them and resolves node labels lazily on mount. No suggestions
   clears the entry."
  [page-uuid suggest-properties]
  (if (seq suggest-properties)
    (swap! *wikidata-suggestions assoc page-uuid
           {:fresh? true
            :items (->> suggest-properties
                        (mapv (fn [[pid {:keys [logseq values]}]]
                                {:pid pid
                                 :ident (:ident logseq)
                                 :title (:title logseq)
                                 :type (:type logseq)
                                 :values values
                                 :status :suggested}))
                        (sort-by #(get suggestion-priority (:pid %) 99))
                        vec)})
    (swap! *wikidata-suggestions dissoc page-uuid)))

;; --- Persistence: survive reload / navigation via localStorage ---

(def ^:private suggestions-storage-key "wikidata-suggestions-v1")

(defn- persist-suggestions! [m]
  (try (.setItem js/localStorage suggestions-storage-key (pr-str m))
       (catch :default _ nil)))

(defn- load-persisted []
  (try (some-> (.getItem js/localStorage suggestions-storage-key) edn/read-string)
       (catch :default _ nil)))

(defonce ^:private _persist-watch
  (add-watch *wikidata-suggestions ::persist
             (fn [_ _ _ new-state] (persist-suggestions! new-state))))

(defn- hydrate-suggestions!
  "On opening a wikidata page whose band isn't in memory (reload / navigation),
   restore it from localStorage as a not-fresh entry (shown as a collapsed chip)."
  [page-uuid]
  (when (and page-uuid (not (get @*wikidata-suggestions page-uuid)))
    (when-let [entry (get (load-persisted) page-uuid)]
      (swap! *wikidata-suggestions assoc page-uuid (assoc entry :fresh? false)))))

;; =============================================================================
;; Inline "Suggested from Wikidata" band
;; =============================================================================

(declare format-value-display)

(defn- <resolve-item-labels!
  "Resolve the PRIMARY node value's label for one item, THROUGH the rate-limit
   queue (spaced, one at a time), patching the atom. Only the first value is ever
   shown/accepted, so we resolve just that one instead of the whole vector."
  [page-uuid pid values]
  (let [primary (first values)]
    (if (:qid primary)
      (wikidata/enqueue-wikidata-fetch!
       (fn []
         (p/let [resolved (<fetch-entity-label (:qid primary))]
           (swap! *wikidata-suggestions update-in [page-uuid :items]
                  (fn [items]
                    (mapv (fn [it]
                            (if (= (:pid it) pid)
                              (assoc it :values (assoc (vec values) 0 resolved) :resolved? true)
                              it))
                          items))))))
      (swap! *wikidata-suggestions update-in [page-uuid :items]
             (fn [items]
               (mapv (fn [it] (if (= (:pid it) pid) (assoc it :resolved? true) it)) items))))))

(defn- resolve-pending-labels!
  "Resolve any suggestion whose primary value is an unresolved entity ref
   (a {:qid ...} without a :label), regardless of how the property was typed, so a
   raw Q-id never leaks into the UI."
  [page-uuid]
  (doseq [{:keys [pid values]} (get-in @*wikidata-suggestions [page-uuid :items])]
    (let [primary (first values)]
      (when (and (map? primary) (:qid primary) (not (:label primary)))
        (<resolve-item-labels! page-uuid pid values)))))

(defn- remove-suggestion-item!
  "Drop one suggested row; clear the page entry when the last row is gone."
  [page-uuid pid]
  (swap! *wikidata-suggestions update-in [page-uuid :items]
         (fn [items] (vec (remove #(= (:pid %) pid) items))))
  (when (empty? (get-in @*wikidata-suggestions [page-uuid :items]))
    (swap! *wikidata-suggestions dissoc page-uuid)))

(defn- focus-first-suggestion!
  "After accept/dismiss, move keyboard focus to the next remaining suggestion row."
  []
  (js/setTimeout
   #(some-> (js/document.querySelector ".wikidata-suggestion-row") (.focus))
   60))

(defn- <accept-suggestion!
  "Accept one suggested property: ensure the property exists, write the primary
   value, drop the row, and offer an Undo. Blocks node values whose label did not
   resolve so we never create a page titled Q123."
  [page-uuid {:keys [pid ident title type values]}]
  (let [value (first values)]
    (when value
      (if (and (= type :node)
               (let [label (str (:label value))]
                 (or (string/blank? label) (re-matches #"^Q[0-9]+$" label))))
        (shui/toast! "Couldn't resolve this entity from Wikidata - try again." :warning)
        (p/let [_ (get-or-create-property! ident title type)
                _ (<import-property-value! page-uuid ident value type)]
          (remove-suggestion-item! page-uuid pid)
          (focus-first-suggestion!)
          (shui/toast!
           (fn [{:keys [dismiss!]}]
             [:span (str "Added " title " ")
              (shui/button {:size :sm :variant :text
                            :class "!px-1 !h-6 !text-xs"
                            :on-click (fn []
                                        (dismiss!)
                                        (db-property-handler/remove-block-property! page-uuid ident))}
                           "Undo")])
           :default {:duration 5000}))))))

(defn- suggestion-value-label
  [value type]
  (cond
    (:label value) (:label value)          ; resolved entity ref
    (:qid value) nil                        ; unresolved entity ref -> shimmer
    :else (format-value-display value type)))

(defn- position-add-cue-at-pointer!
  [event]
  (let [row (.-currentTarget event)
        style (.-style row)
        rect (.getBoundingClientRect row)
        max-x (- (.-innerWidth js/window) 132)
        max-y (- (.-innerHeight js/window) 34)
        viewport-x (js/Math.max 8 (js/Math.min (+ (.-clientX event) 10) max-x))
        viewport-y (js/Math.max 8 (js/Math.min (+ (.-clientY event) 14) max-y))
        x (- viewport-x (.-left rect))
        y (- viewport-y (.-top rect))]
    (.setProperty style "--wikidata-add-cue-x" (str x "px"))
    (.setProperty style "--wikidata-add-cue-y" (str y "px"))))

(defn- position-add-cue-at-row!
  [event]
  (let [row (.-currentTarget event)
        style (.-style row)
        rect (.getBoundingClientRect row)
        max-x (- (.-innerWidth js/window) 132)
        max-y (- (.-innerHeight js/window) 34)
        viewport-x (js/Math.max 8 (js/Math.min (- (.-right rect) 116) max-x))
        viewport-y (js/Math.max 8 (js/Math.min (+ (.-bottom rect) 4) max-y))
        x (- viewport-x (.-left rect))
        y (- viewport-y (.-top rect))]
    (.setProperty style "--wikidata-add-cue-x" (str x "px"))
    (.setProperty style "--wikidata-add-cue-y" (str y "px"))))

(defn- suggestion-row
  "One suggested property. The WHOLE row is the add target (click / Enter); the
   value is an INERT node-styled chip (not a live link, so it never spawns a stray
   page), a key icon + value bullet mirror real rows for alignment, and a compact
   cursor-adjacent cue names the action without adding a permanent third column."
  [page-uuid {:keys [pid ident type values] :as item}]
  (let [primary (first values)
        entity-ref? (and (map? primary) (:qid primary))
        pending? (and entity-ref? (not (:label primary)))
        label (suggestion-value-label primary type)
        prop-entity (db/entity ident)
        show-bullet? (not (contains? #{:default :url} type))
        accept! (fn [] (when-not pending? (<accept-suggestion! page-uuid item)))]
    [:div.property-pair.property-panel-row.group.wikidata-suggestion-row.select-none
     {:key (str pid)
      :data-property-type (name type)
      :tab-index 0
      :role "button"
      :aria-label (str "Add " (:title item) " to page" (when label (str " (" label ")")))
      :aria-disabled (when pending? "true")
      :class "rounded cursor-pointer transition-colors hover:bg-gray-05 focus-visible:bg-gray-05 focus-visible:outline-none"
      :on-mouse-move position-add-cue-at-pointer!
      :on-focus position-add-cue-at-row!
      :on-click (fn [e] (util/stop e) (accept!))
      :on-key-down (fn [e]
                     (case (.-key e)
                       ("Enter" " ") (do (util/stop e) (accept!))
                       ("Delete" "Backspace") (do (util/stop e)
                                                  (remove-suggestion-item! page-uuid pid)
                                                  (focus-first-suggestion!))
                       nil))}
     [:div.property-key-panel
      [:div.property-key-inner
       [:span.property-icon (property/property-icon prop-entity type)]
       [:span.property-k (:title item)]]]
     [:div.ls-block.property-value-container.property-value-panel
      (when show-bullet?
        [:div.property-panel-bullet {:aria-hidden true}
         [:span.bullet-container [:span.bullet]]])
      [:div.property-value.property-value-panel-inner.flex.flex-1.items-center
       (cond
         pending?
         [:span.inline-block.w-24.h-4.rounded {:class "bg-gray-04 animate-pulse" :aria-busy "true"}]
         entity-ref?
         [:span.wikidata-suggestion-chip {:style {:color "var(--ls-link-text-color)"}} (or label "")]
         :else
         [:span (str label)])]]
     [:div.wikidata-add-cursor-bubble
      {:aria-hidden true}
      (ui/icon "plus" {:size 12})
      [:span "Add to page"]]]))

(hsx/defc wikidata-suggestions
  "Inline band of SUGGEST-tier Wikidata properties, above 'Add property' on a
   freshly imported page. Rows mirror real property rows (aligned key icon + value
   bullet); the subtle container marks them as not-yet-committed."
  [block]
  (let [page-uuid (:block/uuid block)
        ;; Reactive subscription to the page so the band updates when a property
        ;; is added, and hides any suggestion whose property is already set (so
        ;; nothing shows in both the band and the real properties above).
        page (db/sub-block (:db/id block))
        [all] (hooks/use-atom *wikidata-suggestions)
        entry (get all page-uuid)
        items (remove (fn [{:keys [ident]}] (some? (get page ident)))
                      (:items entry))
        [expanded? set-expanded!] (hooks/use-state false)
        ;; Just-imported pages open the full band; revisited/reloaded pages
        ;; (hydrated from localStorage, not fresh) open as a collapsed chip.
        [band-open? set-band-open!] (hooks/use-state (boolean (:fresh? entry)))
        any-pending? (boolean (some (fn [{:keys [values]}]
                                      (let [p (first values)]
                                        (and (map? p) (:qid p) (not (:label p)))))
                                    items))]
    (hooks/use-effect!
     (fn []
       (hydrate-suggestions! page-uuid)
       (resolve-pending-labels! page-uuid)
       js/undefined)
     [page-uuid])
    (when (seq items)
      (if-not band-open?
        [:button.wikidata-suggestions-chip
         {:class "my-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          :on-click #(set-band-open! true)}
         [:span (str (count items) " suggestions from Wikidata")]
         (ui/icon "chevron-right" {:size 14})]
        (let [collapsed? (and (not expanded?)
                            (>= (count items) suggestion-collapse-threshold))
            visible (if collapsed? (take suggestion-visible-limit items) items)
            hidden-n (- (count items) (count visible))]
        [:div.wikidata-suggestions.rounded-lg.my-1.py-2
         {:role "region"
          :aria-label "Suggested from Wikidata"
          :class "bg-gray-03"
          :style {:margin-left "-12px" :margin-right "-12px"
                  :padding-left "12px" :padding-right "12px"}}
         [:div.flex.items-center.gap-2.mb-1
          ;; Chevron + count: click the header to collapse back to the chip
          ;; (distinct from the X, which dismisses the band entirely).
          [:button.flex.items-center.gap-1
           {:aria-label "Collapse suggestions"
            :class "text-muted-foreground hover:text-foreground"
            :on-click #(set-band-open! false)}
           (ui/icon "chevron-down" {:size 14})
           [:span.text-xs (str "Suggested from Wikidata • " (count items))]]
          [:div.flex-1]
          (shui/button {:variant :text :size :sm
                        :disabled any-pending?
                        :class "!px-1 !h-6 !text-xs text-muted-foreground hover:text-foreground"
                        :on-click (fn [] (when-not any-pending?
                                           (run! #(<accept-suggestion! page-uuid %) items)))}
                       "Add all")
          (shui/button {:variant :ghost :size :sm
                        :title "Dismiss"
                        :aria-label "Dismiss suggestions"
                        :class "!px-1 !h-6 text-muted-foreground opacity-60 hover:opacity-100 hover:text-foreground"
                        :on-click #(clear-suggestions! page-uuid)}
                       (ui/icon "x" {:size 14}))]
         (into [:div] (map #(suggestion-row page-uuid %) visible))
         (when (pos? hidden-n)
           [:button.wikidata-show-more.text-xs.text-muted-foreground.mt-1
            {:class "hover:text-foreground"
             :on-click #(set-expanded! true)}
            (str (t :ui/show-more) " (" hidden-n ")")])])))))

;; =============================================================================
;; UI Components
;; =============================================================================

(defn- format-value-display
  "Format a property value for display in the UI."
  [value logseq-type]
  (cond
    ;; Entity reference with label
    (:label value)
    (:label value)

    ;; Entity reference without label (Q-ID only)
    (:qid value)
    (str "Loading: " (:qid value))

    ;; Datetime (epoch ms)
    (and (= logseq-type :datetime) (number? value))
    (let [date (js/Date. value)]
      (.toLocaleDateString date))

    ;; URL
    (and (= logseq-type :url) (string? value))
    (if (> (count value) 40)
      (str (subs value 0 40) "...")
      value)

    ;; Default string
    :else
    (str value)))

(hsx/defc property-checkbox
  [prop-id prop-info selected? on-toggle]
  (let [{:keys [logseq values]} prop-info
        {:keys [title]} logseq
        display-value (format-value-display (first values) (:type logseq))]
    [:div.flex.items-center.gap-2.py-2.px-1.hover:bg-gray-04.rounded
     {:key prop-id}
     (shui/checkbox
      {:id (str "wikidata-prop-" prop-id)
       :size :sm
       :checked selected?
       :on-checked-change (fn [_] (on-toggle prop-id))})
     [:label.flex-1.flex.items-center.justify-between.cursor-pointer.text-sm
      {:for (str "wikidata-prop-" prop-id)}
      [:span.font-medium title]
      [:span.text-gray-11.truncate.max-w-48 {:title (str (first values))}
       display-value]]]))

(hsx/defc import-panel
  [{:keys [page properties entity-data on-close]}]
  (let [*selected (hooks/use-memo #(atom #{}) [])
        *loading (hooks/use-memo #(atom false) [])
        *resolved-properties (hooks/use-memo #(atom nil) [])
        [selected] (hooks/use-atom *selected)
        [loading?] (hooks/use-atom *loading)
        [resolved-props-val] (hooks/use-atom *resolved-properties)
        _ (hooks/use-effect!
           (fn []
             (p/let [resolved-props
                     (p/all
                      (for [[prop-id prop-info] properties]
                        (p/let [resolved-values (<resolve-entity-refs (:values prop-info))]
                          [prop-id (assoc prop-info :values resolved-values)])))]
               (reset! *resolved-properties (into {} resolved-props)))
             js/undefined)
           [])
        resolved-properties (or resolved-props-val properties)
        page-title (:block/title page)
        toggle-property! (fn [prop-id]
                           (swap! *selected
                                  (fn [s]
                                    (if (contains? s prop-id)
                                      (disj s prop-id)
                                      (conj s prop-id)))))
        select-all! (fn []
                      (reset! *selected (set (keys resolved-properties))))
        select-none! (fn []
                       (reset! *selected #{}))
        handle-import! (fn []
                         (reset! *loading true)
                         (-> (<import-selected-properties! page selected resolved-properties)
                             (p/then (fn [_]
                                       (shui/dialog-close!)
                                       (when on-close (on-close))))
                             (p/catch (fn [err]
                                        (js/console.error "[wikidata-import] Error:" err)
                                        (reset! *loading false)))))]
    [:div.wikidata-import-panel.p-4
     ;; Header
     [:div.mb-4
      [:p.text-sm.text-gray-11.mt-1
       (str "\"" page-title "\" has additional properties available:")]]

     ;; Property list
     [:div.max-h-64.overflow-y-auto.border.rounded.p-2.mb-4
      (if (nil? resolved-props-val)
        [:div.text-center.py-4.text-gray-11 "Loading properties..."]
        (for [[prop-id prop-info] (sort-by (comp :title :logseq second) resolved-properties)]
          (property-checkbox prop-id prop-info
                             (contains? selected prop-id)
                             toggle-property!)))]

     ;; Selection helpers
     [:div.flex.gap-2.mb-4.text-sm
      [:button.text-blue-11.hover:underline
       {:on-click select-all!}
       "Select all"]
      [:span.text-gray-11 "|"]
      [:button.text-blue-11.hover:underline
       {:on-click select-none!}
       "Select none"]
      [:span.flex-1]
      [:span.text-gray-11
       (str (count selected) " of " (count resolved-properties) " selected")]]

     ;; Action buttons
     [:div.flex.justify-end.gap-2
      (shui/button
       {:variant :outline
        :size :sm
        :disabled loading?
        :on-click (fn []
                    (shui/dialog-close!)
                    (when on-close (on-close)))}
       "Skip")
      (shui/button
       {:size :sm
        :disabled (or loading? (empty? selected))
        :on-click handle-import!}
       (if loading?
         "Importing..."
         (str "Import " (count selected) " properties")))]]))

;; =============================================================================
;; Public API
;; =============================================================================

(defn show-import-panel!
  "Show the Wikidata property import panel as a modal dialog.
   Called after creating a page from Wikidata with available properties."
  [{:keys [page properties entity-data] :as opts}]
  (when (seq properties)
    (shui/dialog-open!
     (fn [] (import-panel opts))
     {:id :wikidata-import-panel
      :title "Import from Wikidata"
      :center? true
      :class "lg:max-w-xl"})))
