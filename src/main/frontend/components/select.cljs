(ns frontend.components.select
  "Generic component for fuzzy searching items to select an item. See
  select-config to add a new use or select-type for this component. To use the
  new select-type, create an event that calls `select/dialog-select!` with the
  select-type. See the :graph/open command for a full example."
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.handler.common.developer :as dev-common-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.text :as text-util]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]))

(rum/defc render-item < rum/reactive
  [result chosen? multiple-choices? *selected-choices]
  (let [value (if (map? result) (or (:label result)
                                    (:value result)) result)
        header (:header result)
        selected-choices (rum/react *selected-choices)
        row [:div.flex.flex-row.justify-between.w-full
             {:class (when chosen? "chosen")
              :on-pointer-down util/stop-propagation}
             [:div.flex.flex-row.items-center.gap-1
              (when multiple-choices?
                (ui/checkbox {:checked (boolean (selected-choices (:value result)))
                              :on-click (fn [e]
                                          (.preventDefault e))
                              :disabled (:disabled? result)}))
              value]
             (when (and (map? result) (:id result))
               [:div.tip.flex
                [:code.opacity-20.bg-transparent (:id result)]])]]
    (if header
      [:div.flex.flex-col.gap-1
       header
       row]
      row)))

(rum/defc search-input
  [*input {:keys [prompt-key input-default-placeholder input-opts on-input]}]
  (let [[input set-input!] (hooks/use-state @*input)]
    (hooks/use-effect!
     (fn []
       (reset! *input input)
       (when (fn? on-input) (on-input input)))
     [(hooks/use-debounced-value input 100)])

    (hooks/use-effect!
     (fn []
       (when (= "" @*input)
         (set-input! "")))
     [(hooks/use-debounced-value @*input 100)])

    [:div.input-wrap
     [:input.cp__select-input.w-full
      (merge {:type        "text"
              :class "!p-1.5"
              :placeholder (or input-default-placeholder (t prompt-key))
              :auto-focus  true
              :value       input
              :on-change   (fn [e]
                             (let [v (util/evalue e)]
                               (set-input! v)))}
             input-opts)]]))

;; TODO: rewrite using hooks
(rum/defcs ^:large-vars/cleanup-todo select
  "Provides a select dropdown powered by a fuzzy search. Takes the following options:
   * :items - Vec of things to select from. Assumes a vec of maps with :value key by default. Required option
   * :limit - Limit number of items to search. Default is 100
   * :on-chosen - Optional fn to perform an action with chosen item
   * :extract-fn - Fn applied to each item during fuzzy search. Default is :value
   * :extract-chosen-fn - Fn applied to each item when choosing an item. Default is identity
   * :show-new-when-not-exact-match? - Boolean to allow new values be entered. Default is false
   * :exact-match-exclude-items - A set of strings that can't be added as a new item. Default is #{}
   * :transform-fn - Optional fn to transform search results given results and current input
   * :new-case-sensitive? - Boolean to allow new values to be case sensitive
   * :loading? - whether it's loading the items
   TODO: Describe more options"
  < rum/reactive
  shortcut/disable-all-shortcuts
  (rum/local "" ::input)
  (rum/local nil ::toggle)
  {:init (fn [state]
           (let [choices (:selected-choices (first (:rum/args state)))]
             (assoc state ::selected-choices (atom (set choices)))))
   :will-remount (fn [_old-state new-state]
                   (let [choices (set (:selected-choices (first (:rum/args new-state))))]
                     (when (not= choices @(::selected-choices new-state))
                       (reset! (::selected-choices new-state) choices))
                     new-state))
   :will-unmount (fn [state]
                   (shui/dialog-close! :ls-select-modal)
                   state)}
  [state {:keys [items limit on-chosen empty-placeholder grouped?
                 prompt-key input-default-placeholder close-modal?
                 extract-fn extract-chosen-fn host-opts on-input input-opts
                 item-cp transform-fn tap-*input-val
                 multiple-choices? on-apply new-case-sensitive?
                 dropdown? show-new-when-not-exact-match? exact-match-exclude-items
                 input-container initial-open? loading?
                 clear-input-on-chosen?]
          :or {limit 100
               prompt-key :select/default-prompt
               empty-placeholder (fn [_t] [:div])
               close-modal? true
               extract-fn :value
               extract-chosen-fn identity
               exact-match-exclude-items #{}
               initial-open? true
               clear-input-on-chosen? true}}]
  (let [*input (::input state)
        *toggle (::toggle state)
        *selected-choices (::selected-choices state)
        selected-choices (rum/react *selected-choices)
        full-choices (cond->>
                      (remove nil? items)
                       (seq @*input)
                       (remove :clear?))
        search-result' (->>
                        (cond-> (search/fuzzy-search full-choices @*input :limit limit :extract-fn extract-fn)
                          (fn? transform-fn)
                          (transform-fn @*input))
                        (remove nil?))
        exact-transform-fn (if new-case-sensitive? identity string/lower-case)
        exact-match? (contains? (set (map (comp exact-transform-fn str extract-fn) search-result'))
                                (exact-transform-fn @*input))
        search-result' (if (and multiple-choices? (not (string/blank? @*input)))
                         (sort-by (fn [item]
                                    (not (contains? selected-choices (:value item))))
                                  search-result')
                         search-result')
        search-result (if (and show-new-when-not-exact-match?
                               (not exact-match?)
                               (not (string/blank? @*input))
                               (not (exact-match-exclude-items @*input)))
                        (->>
                         (cons
                          (first search-result')
                          (cons {:value @*input
                                 :label (str "+ New option: " @*input)}
                                (rest search-result')))
                         (remove nil?))
                        search-result')
        input-opts' (if (fn? input-opts) (input-opts (empty? search-result)) input-opts)
        input-container (or
                         input-container
                         (search-input *input
                                       {:prompt-key prompt-key
                                        :input-default-placeholder input-default-placeholder
                                        :input-opts input-opts'
                                        :on-input on-input}))
        results-container-f (fn []
                              (if loading?
                                [:div.px-1.py-2
                                 (ui/loading "Loading ...")]
                                [:div
                                 {:class (when (seq search-result) "py-1")}
                                 [:div.item-results-wrap
                                  (ui/auto-complete
                                   search-result
                                   {:grouped? grouped?
                                    :item-render       (or item-cp (fn [result chosen?]
                                                                     (render-item result chosen? multiple-choices? *selected-choices)))
                                    :class             "cp__select-results"
                                    :on-chosen         (fn [raw-chosen e]
                                                         (when clear-input-on-chosen?
                                                           (reset! *input ""))
                                                         (let [chosen (extract-chosen-fn raw-chosen)]
                                                           (if multiple-choices?
                                                             (if (selected-choices chosen)
                                                               (do
                                                                 (swap! *selected-choices disj chosen)
                                                                 (when on-chosen (on-chosen chosen false @*selected-choices e)))
                                                               (do
                                                                 (swap! *selected-choices conj chosen)
                                                                 (when on-chosen (on-chosen chosen true @*selected-choices e))))
                                                             (do
                                                               (when (and close-modal? (not multiple-choices?))
                                                                 (state/close-modal!))
                                                               (when on-chosen
                                                                 (on-chosen chosen true @*selected-choices e))))))
                                    :empty-placeholder (empty-placeholder t)})]

                                 (when (and multiple-choices? (fn? on-apply))
                                   [:div.p-4 (ui/button "Apply"
                                                        {:small? true
                                                         :on-pointer-down (fn [e]
                                                                            (util/stop e)
                                                                            (when @*toggle (@*toggle))
                                                                            (on-apply selected-choices)
                                                                            (when close-modal? (state/close-modal!)))})])]))]
    (when (fn? tap-*input-val)
      (tap-*input-val *input))
    [:div.cp__select
     (merge {:class "cp__select-main"}
            host-opts)

     (if dropdown?
       (ui/dropdown
        (if (fn? input-container) input-container (fn [] input-container))
        results-container-f
        {:initial-open? initial-open?
         :*toggle-fn *toggle})
       [:<>
        (if (fn? input-container) (input-container) input-container)
        (results-container-f)])]))

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
                           :href (rfe/href :graphs)
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
    :on-chosen #(repo-handler/remove-repo! (:original-graph %))}
   :db-graph-replace
   {:items-fn (fn []
                (let [current-repo (state/get-current-repo)]
                  (->> (state/get-repos)
                       (remove (fn [{:keys [url]}]
                                ;; Can't replace current graph as ui wouldn't reload properly
                                 (or (= url current-repo) (not (config/db-based-graph? url)))))
                       (map (fn [{:keys [url] :as original-graph}]
                              {:value (text-util/get-graph-name-from-path url)
                               :id (config/get-repo-dir url)
                               :graph url
                               :original-graph original-graph})))))
    :on-chosen #(dev-common-handler/import-chosen-graph (:graph %))}})

(defn dialog-select!
  [select-type]
  (when select-type
    (let [select-type-config (get (select-config) select-type)
          on-chosen' (:on-chosen select-type-config)]
      (shui/dialog-open!
       #(select (-> select-type-config
                    (assoc :on-chosen (fn [it]
                                        (on-chosen' it)
                                        (shui/dialog-close-all!)))
                    (select-keys [:on-chosen :empty-placeholder :prompt-key])
                    (assoc :items ((:items-fn select-type-config)))))
       {:id :ls-select-modal
        :close-btn?  false
        :align :top
        :content-props {:class "ls-dialog-select"}}))))
