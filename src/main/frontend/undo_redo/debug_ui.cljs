(ns frontend.undo-redo.debug-ui
  "Debug UI for undo/redo history"
  (:require [fipp.edn :as fipp]
            [frontend.handler.history :as history-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.undo-redo :as undo-redo]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

(defn- strip-tx-data
  [x]
  (cond
    (map? x)
    (reduce-kv (fn [m k v]
                 (if (= :tx-data k)
                   m
                   (assoc m k (strip-tx-data v))))
               {}
               x)

    (vector? x)
    (mapv strip-tx-data x)

    (seq? x)
    (map strip-tx-data x)

    (set? x)
    (set (map strip-tx-data x))

    :else
    x))

(defn- entry-title
  [entry]
  (let [entry' (if (vector? entry) entry (vec entry))]
    (->> entry'
         (keep (fn [item]
                 (cond
                   (keyword? item) (name item)
                   (and (vector? item) (keyword? (first item))) (name (first item))
                   :else nil)))
         first
         (or "entry"))))

(def ^:private ui-entry-tags
  #{::undo-redo/ui-state
    ::undo-redo/record-editor-info})

(defn- ui-entry-item?
  [item]
  (and (vector? item)
       (contains? ui-entry-tags (first item))))

(defn- filter-ui-items
  [entry]
  (if (vector? entry)
    (->> entry
         (remove ui-entry-item?)
         vec)
    entry))

(defn- empty-filtered-entry?
  [entry]
  (and (vector? entry)
       (empty? entry)))

(rum/defc payload-entry
  [expanded?* id entry]
  (let [expanded? (contains? @expanded?* id)]
    [:div.rounded-md.border.p-2
     [:button.flex.w-full.items-center.justify-between.text-left
      {:aria-expanded expanded?
       :on-click (fn [_]
                   (swap! expanded?*
                          (fn [expanded]
                            (if (contains? expanded id)
                              (disj expanded id)
                              (conj expanded id)))))}
      [:span.text-sm.font-medium (entry-title entry)]
      [:span.opacity-60 (ui/rotating-arrow (not expanded?))]]
     (when expanded?
       [:pre.select-text.mt-2.text-xs.overflow-auto
        (-> (strip-tx-data entry)
            (fipp/pprint {:width 60})
            with-out-str)])]))

(rum/defc payload-stack
  [expanded?* label entries]
  [:div.flex.flex-col.gap-2
   [:div.text-sm.font-medium label]
   (if (seq entries)
     (for [[idx entry] (map-indexed vector (reverse entries))]
       (rum/with-key
         (payload-entry expanded?* (str label "-" idx) entry)
         (str label "-" idx)))
     [:div.text-sm.opacity-50 "Empty"])])

(rum/defcs undo-redo-debug-ui < rum/reactive
  (rum/local #{} ::expanded)
  (rum/local false ::filter-ui-state?)
  (rum/local nil ::history)
  [state]
  (let [repo (state/sub :git/current-repo)
        history* (::history state)
        _ (rum/react history*)
        refresh! (fn []
                   (when repo
                     (-> (undo-redo/<get-debug-state repo)
                         (.then #(reset! history* %))))
                   nil)
        undo-stack (or (:undo-ops @history*) [])
        redo-stack (or (:redo-ops @history*) [])
        expanded?* (::expanded state)
        filter-ui-state?* (::filter-ui-state? state)
        filter-ui-state? @filter-ui-state?*
        filter-stack (fn [stack]
                       (if filter-ui-state?
                         (->> stack
                              (map filter-ui-items)
                              (remove empty-filtered-entry?))
                         stack))
        undo-stack' (filter-stack undo-stack)
        redo-stack' (filter-stack redo-stack)]
    [:div.flex.flex-col.gap-3
     [:div.flex.gap-2.flex-wrap.items-center
      (shui/button
       {:size :sm
        :disabled (or (nil? repo) (empty? undo-stack))
        :on-click (fn [e]
                    (history-handler/undo! e)
                    (js/setTimeout refresh! 0))}
       (shui/tabler-icon "arrow-back-up") "undo")
      (shui/button
       {:size :sm
        :disabled (or (nil? repo) (empty? redo-stack))
        :on-click (fn [e]
                    (history-handler/redo! e)
                    (js/setTimeout refresh! 0))}
       (shui/tabler-icon "arrow-forward-up") "redo")
      (shui/button
       {:size :sm
        :variant :outline
        :disabled (nil? repo)
        :on-click (fn [_]
                    (undo-redo/clear-history! repo)
                    (js/setTimeout refresh! 0))}
       (shui/tabler-icon "trash") "clear-history")
      (shui/button
       {:size :sm
        :variant :outline
        :disabled (nil? repo)
        :on-click (fn [_] (refresh!))}
       (shui/tabler-icon "refresh") "refresh")
      (shui/button
       {:size :sm
        :variant (if filter-ui-state? :default :outline)
        :on-click (fn [_]
                    (swap! filter-ui-state?* not))}
       (shui/tabler-icon "filter") "filter-ui-entry-global")]

     [:div.text-sm.opacity-70
      (str "undo=" (count undo-stack')
           (when filter-ui-state?
             (str "/" (count undo-stack)))
           " redo=" (count redo-stack')
           (when filter-ui-state?
             (str "/" (count redo-stack))))]

     (payload-stack expanded?* "Undo" undo-stack')
     (payload-stack expanded?* "Redo" redo-stack')]))
