(ns frontend.components.wikidata-import
  "Wikidata property import panel.
   Shows a modal after creating a page from Wikidata, allowing users to
   select which properties to import (Author, Publisher, etc.)."
  (:require [clojure.string :as string]
            [frontend.components.wikidata :as wikidata]
            [frontend.db :as db]
            [frontend.handler.common.page :as page-handler]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.state :as state]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [rum.core :as rum]))

;; =============================================================================
;; Entity Reference Resolution
;; =============================================================================

(defn- <fetch-entity-label
  "Fetch the label for a Wikidata entity Q-ID.
   Returns promise with {:qid \"Q937\" :label \"Albert Einstein\"}"
  [qid]
  (let [user-lang (or (state/sub :preferred-language) "en")]
    (p/let [entity-data (wikidata/<fetch-wikidata-entity qid user-lang)]
      (when entity-data
        (let [labels (get entity-data "labels" {})
              label (or (get-in labels [user-lang "value"])
                        (get-in labels ["en" "value"])
                        qid)] ; Fallback to Q-ID if no label
          {:qid qid :label label})))))

(defn- <resolve-entity-refs
  "Resolve all entity references in a property's values to their labels.
   Returns promise with values updated to include labels."
  [values]
  (p/let [resolved (p/all
                    (map (fn [value]
                           (if-let [qid (:qid value)]
                             (<fetch-entity-label qid)
                             (p/resolved value)))
                         values))]
    (vec resolved)))

;; =============================================================================
;; Property & Page Creation
;; =============================================================================

(defn- get-or-create-property!
  "Get existing property or create it with the given schema.
   Returns the property entity."
  [property-title property-type]
  (if-let [existing (db/get-case-page property-title)]
    existing
    ;; Create property with appropriate schema
    (let [schema {:type property-type}
          ident (keyword "user.property" (string/lower-case (string/replace property-title #" " "-")))]
      (db-property-handler/upsert-property! ident schema {:title property-title})
      (db/get-case-page property-title))))

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
                             _ (get-or-create-property! title type)
                             ;; Import the value
                             _ (<import-property-value! page-uuid ident value type)]
                       (js/console.log "[wikidata-import] Imported property:" title))))]
    (js/console.log "[wikidata-import] Imported" (count results) "properties")
    results))

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

(rum/defcs property-checkbox < rum/reactive
  [state prop-id prop-info selected? on-toggle]
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

(rum/defcs import-panel < rum/reactive
  (rum/local #{} ::selected)
  (rum/local false ::loading)
  (rum/local nil ::resolved-properties)
  {:did-mount
   (fn [state]
     ;; Resolve entity references on mount
     (let [[{:keys [properties]}] (:rum/args state)
           *resolved (::resolved-properties state)]
       (p/let [resolved-props
               (p/all
                (for [[prop-id prop-info] properties]
                  (p/let [resolved-values (<resolve-entity-refs (:values prop-info))]
                    [prop-id (assoc prop-info :values resolved-values)])))]
         (reset! *resolved (into {} resolved-props))))
     state)}
  [state {:keys [page properties entity-data on-close]}]
  (let [*selected (::selected state)
        *loading (::loading state)
        *resolved-properties (::resolved-properties state)
        selected @*selected
        loading? @*loading
        resolved-properties (or @*resolved-properties properties)
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
      [:h3.text-lg.font-semibold "Import from Wikidata"]
      [:p.text-sm.text-gray-11.mt-1
       (str "\"" page-title "\" has additional properties available:")]]

     ;; Property list
     [:div.max-h-64.overflow-y-auto.border.rounded.p-2.mb-4
      (if (nil? @*resolved-properties)
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
