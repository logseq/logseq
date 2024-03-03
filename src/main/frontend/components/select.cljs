(ns frontend.components.select
  "Generic component for fuzzy searching items to select an item. See
  select-config to add a new use or select-type for this component. To use the
  new select-type, set :ui/open-select to the select-type. See
  :graph/open command for an example."
  (:require [frontend.modules.shortcut.core :as shortcut]
            [frontend.context.i18n :refer [t]]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.text :as text-util]
            [rum.core :as rum]
            [frontend.config :as config]
            [frontend.handler.repo :as repo-handler]
            [reitit.frontend.easy :as rfe]))

(rum/defc render-item < rum/reactive
  [result chosen? multiple-choices? *selected-choices]
  (let [value (if (map? result) (:value result) result)
        selected-choices (rum/react *selected-choices)]
    [:div.flex.flex-row.justify-between.w-full {:class (when chosen? "chosen")}
     [:span
      (when multiple-choices? (ui/checkbox {:checked (selected-choices value)
                                            :style {:margin-right 4}
                                            :on-click (fn [e]
                                                        (.preventDefault e))}))
      value]
     (when (and (map? result) (:id result))
       [:div.tip.flex
        [:code.opacity-20.bg-transparent (:id result)]])]))

(rum/defcs select < rum/reactive
  shortcut/disable-all-shortcuts
  (rum/local "" ::input)
  {:init (fn [state]
           (assoc state ::selected-choices
                  (atom (set (:selected-choices (first (:rum/args state)))))))
   :will-unmount (fn [state]
                   (state/set-state! [:ui/open-select] nil)
                   (let [{:keys [multiple-choices? on-chosen]} (first (:rum/args state))]
                     (when (and multiple-choices? on-chosen)
                       (on-chosen @(::selected-choices state))))
                   state)}
  [state {:keys [items limit on-chosen empty-placeholder
                 prompt-key input-default-placeholder close-modal?
                 extract-fn host-opts on-input input-opts
                 item-cp transform-fn tap-*input-val
                 multiple-choices? on-apply _selected-choices]
          :or {limit 100
               prompt-key :select/default-prompt
               empty-placeholder (fn [_t] [:div])
               close-modal? true
               extract-fn :value}}]
  (let [input (::input state)
        *selected-choices (::selected-choices state)]
    (when (fn? tap-*input-val)
      (tap-*input-val input))
    [:div.cp__select
     (merge {:class "cp__select-main"} host-opts)
     [:div.input-wrap
      [:input.cp__select-input.w-full
       (merge {:type        "text"
               :placeholder (or input-default-placeholder (t prompt-key))
               :auto-focus  true
               :value       @input
               :on-change   (fn [e]
                              (let [v (util/evalue e)]
                                (reset! input v)
                                (and (fn? on-input) (on-input v))))}
              input-opts)]]

     [:div.item-results-wrap
      (ui/auto-complete
       (cond-> (search/fuzzy-search items @input :limit limit :extract-fn extract-fn)
         (fn? transform-fn)
         (transform-fn @input))

       {:item-render       (or item-cp (fn [result chosen?]
                                         (render-item result chosen? multiple-choices? *selected-choices)))
        :class             "cp__select-results"
        :on-chosen         (fn [x]
                             (reset! input "")
                             (if multiple-choices?
                               (if (@*selected-choices x)
                                 (swap! *selected-choices disj x)
                                 (swap! *selected-choices conj x))
                               (do
                                 (when close-modal? (state/close-modal!))
                                 (when on-chosen
                                   (on-chosen (if multiple-choices? @*selected-choices x))))))
        :empty-placeholder (empty-placeholder t)})]

     (when multiple-choices?
       [:div.p-4 (ui/button "Apply updates" :on-click on-apply)])]))

(defn select-config
  "Config that supports multiple types (uses) of this component. To add a new
  type, add a key with the value being a map with the following keys:

  * :items-fn - fn that returns items with a :value key that are used for the
    fuzzy search and selection. Items can have an optional :id and are displayed
    lightly for a given item.
  * :on-chosen - fn that is given item when it is chosen.
  * :empty-placeholder (optional) - fn that returns hiccup html to render if no
    matched graphs found.
  * :prompt-key (optional) - dictionary keyword that prompts when components is
    first open. Defaults to :select/default-prompt."
  []
  {:graph-open
   {:items-fn (fn []
                (->>
                 (state/get-repos)
                 (remove (fn [{:keys [url]}]
                           (or (config/demo-graph? url)
                               (= url (state/get-current-repo)))))
                 (map (fn [{:keys [url]}]
                        {:value (text-util/get-graph-name-from-path url)
                         :id (config/get-repo-dir url)
                         :graph url}))))
    :prompt-key :select.graph/prompt
    :on-chosen #(state/pub-event! [:graph/switch (:graph %)])
    :empty-placeholder (fn [t]
                         [:div.px-4.py-2
                          [:div.mb-2 (t :select.graph/empty-placeholder-description)]
                          (ui/button
                           (t :select.graph/add-graph)
                           :href (rfe/href :repo-add)
                           :on-click state/close-modal!)])}
   :graph-remove
   {:items-fn (fn []
                (->> (state/get-repos)
                     (remove (fn [{:keys [url]}]
                               (config/demo-graph? url)))
                     (map (fn [{:keys [url] :as original-graph}]
                            {:value (text-util/get-graph-name-from-path url)
                             :id (config/get-repo-dir url)
                             :graph url
                             :original-graph original-graph}))))
    :on-chosen #(repo-handler/remove-repo! (:original-graph %))}})

(rum/defc select-modal < rum/reactive
  []
  (when-let [select-type (state/sub [:ui/open-select])]
    (let [select-type-config (get (select-config) select-type)]
      (state/set-modal!
       #(select (-> select-type-config
                    (select-keys [:on-chosen :empty-placeholder :prompt-key])
                    (assoc :items ((:items-fn select-type-config)))))
       {:fullscreen? false
        :close-btn?  false}))
    nil))
