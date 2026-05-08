(ns frontend.components.graph-v2
  (:require [clojure.string :as string]
            [frontend.components.graph-actions :as graph-actions]
            [frontend.context.i18n :refer [t]]
            [frontend.extensions.graph :as graph]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [rum.core :as rum]))

(def ^:private default-open-groups #{:view-mode :displayed-tags :layout})
(def ^:private default-settings {:view-mode :tags-and-objects
                                 :selected-tag-ids nil
                                 :open-groups default-open-groups})

(defn- storage-key
  [repo]
  (str "logseq.graph-v2.settings." repo))

(defn- valid-view-mode
  [view-mode]
  (if (= view-mode :all-pages)
    :all-pages
    :tags-and-objects))

(defn- encode-settings
  [{:keys [view-mode selected-tag-ids open-groups]}]
  #js {:viewMode (name (valid-view-mode view-mode))
       :selectedTagIds (when selected-tag-ids (clj->js (vec selected-tag-ids)))
       :openGroups (clj->js (mapv name (or open-groups default-open-groups)))})

(defn- decode-settings
  [data]
  (merge default-settings
         (when (map? data)
           (cond->
            {}
             (contains? data :viewMode)
             (assoc :view-mode (valid-view-mode (keyword (:viewMode data))))

             (contains? data :selectedTagIds)
             (assoc :selected-tag-ids (vec (:selectedTagIds data)))

             (contains? data :openGroups)
             (assoc :open-groups (set (map keyword (:openGroups data))))))))

(defn load-graph-settings
  [repo]
  (try
    (if-let [raw (some-> js/localStorage (.getItem (storage-key repo)))]
      (decode-settings (js->clj (js/JSON.parse raw) :keywordize-keys true))
      default-settings)
    (catch :default _e
      default-settings)))

(defn save-graph-settings!
  [repo settings]
  (try
    (some-> js/localStorage
            (.setItem (storage-key repo)
                      (js/JSON.stringify (encode-settings settings))))
    (catch :default _e
      nil)))

(defn tag-options
  [graph-data]
  (let [tag-ids (->> (:nodes graph-data)
                     (filter #(= "tag" (:kind %)))
                     (map :id)
                     set)
        counts (reduce
                (fn [result {:keys [source target]}]
                  (cond
                    (contains? tag-ids target) (update result target (fnil inc 0))
                    (contains? tag-ids source) (update result source (fnil inc 0))
                    :else result))
                {}
                (:links graph-data))]
    (->> (:nodes graph-data)
         (filter #(= "tag" (:kind %)))
         (map (fn [{:keys [id label]}]
                {:id id
                 :label label
                 :count (get counts id 0)}))
         (sort-by (juxt (comp - :count) (comp string/lower-case :label)))
         vec)))

(defn selected-tag-id-set
  [settings tag-options]
  (let [available-ids (set (map :id tag-options))]
    (if-let [selected-tag-ids (:selected-tag-ids settings)]
      (set (filter available-ids selected-tag-ids))
      available-ids)))

(defn filter-tags-and-objects-graph
  [graph-data selected-tag-ids]
  (let [selected-tag-ids (set selected-tag-ids)
        selected-links (->> (:links graph-data)
                            (filter (fn [{:keys [source target]}]
                                      (or (contains? selected-tag-ids target)
                                          (contains? selected-tag-ids source))))
                            vec)
        linked-node-ids (set (mapcat (juxt :source :target) selected-links))
        visible-node-ids (into selected-tag-ids linked-node-ids)]
    (assoc graph-data
           :nodes (->> (:nodes graph-data)
                       (filter #(contains? visible-node-ids (:id %)))
                       vec)
           :links selected-links)))

(defn- tag-color
  [id]
  (let [colors ["#5eead4" "#60a5fa" "#a78bfa" "#fbbf24" "#fb7185" "#34d399"]
        idx (mod (js/Math.abs (hash id)) (count colors))]
    (nth colors idx)))

(defn- settings-toggle
  [settings group-id]
  (update settings :open-groups
          (fn [open-groups]
            (let [open-groups (or open-groups #{})]
              (if (contains? open-groups group-id)
                (disj open-groups group-id)
                (conj open-groups group-id))))))

(defn- settings-group
  [{:keys [settings set-settings! id title meta children]}]
  (let [open? (contains? (:open-groups settings) id)]
    [:section.graph-v2-settings-group
     {:class (when open? "is-open")}
     [:button.graph-v2-settings-group-header
      {:type "button"
       :aria-expanded (str open?)
       :on-click #(set-settings! (settings-toggle settings id))}
      [:span.graph-v2-settings-group-title
       (ui/icon (if open? "chevron-down" "chevron-right") {:size 16})
       [:span title]]
      (when meta
        [:span.graph-v2-settings-group-meta meta])]
     (when open?
       [:div.graph-v2-settings-group-body children])]))

(defn- mode-button
  [current-mode set-view-mode! mode]
  (let [active? (= current-mode mode)]
    (ui/button
     (if (= mode :all-pages)
       (t :graph/view-mode-all-pages)
       (t :graph/view-mode-tags))
     :on-click #(set-view-mode! mode)
     :variant (if active? :default :outline)
     :class (str "graph-v2-mode-button" (when active? " is-active")))))

(defn- view-mode-group
  [settings set-settings! view-mode set-view-mode!]
  (settings-group
   {:settings settings
    :set-settings! set-settings!
    :id :view-mode
    :title (t :graph/view-mode)
    :children [:div.graph-v2-mode-segment
               (mode-button view-mode set-view-mode! :tags-and-objects)
               (mode-button view-mode set-view-mode! :all-pages)]}))

(defn- tags-group
  [settings set-settings! tag-options selected-tag-ids tag-query set-tag-query!]
  (let [query (string/lower-case (string/trim (or tag-query "")))
        shown-tags (cond->> tag-options
                     (seq query)
                     (filter #(string/includes? (string/lower-case (:label %)) query)))
        all-tag-ids (mapv :id tag-options)
        selected-count (count selected-tag-ids)]
    (settings-group
     {:settings settings
      :set-settings! set-settings!
      :id :displayed-tags
      :title (t :graph/displayed-tags)
      :meta (t :graph/displayed-tags-count selected-count (count tag-options))
      :children
      [:div.graph-v2-tags-control
       [:div.graph-v2-tag-search
        (ui/icon "search" {:size 16})
        (shui/input {:value tag-query
                     :placeholder (t :graph/search-tags)
                     :on-change #(set-tag-query! (.. % -target -value))})]
       [:div.graph-v2-tag-actions
        (ui/button (t :graph/select-all-tags)
                   :on-click #(set-settings! (assoc settings :selected-tag-ids all-tag-ids))
                   :variant :outline
                   :size :xs)
        (ui/button (t :graph/clear-tags)
                   :on-click #(set-settings! (assoc settings :selected-tag-ids []))
                   :variant :outline
                   :size :xs)]
       [:div.graph-v2-tag-list
        (for [{:keys [id label count]} shown-tags
              :let [checked? (contains? selected-tag-ids id)]]
          [:label.graph-v2-tag-row
           {:key id
            :class (when checked? "is-selected")}
           (ui/checkbox {:checked checked?
                         :on-change #(set-settings!
                                      (assoc settings
                                             :selected-tag-ids
                                             (vec (if checked?
                                                    (disj selected-tag-ids id)
                                                    (conj selected-tag-ids id)))))})
           [:span.graph-v2-tag-dot {:style {:background-color (tag-color id)}}]
           [:span.graph-v2-tag-name label]
           [:span.graph-v2-tag-count count]])]]})))

(defn- layout-group
  [settings set-settings! graph-data metrics]
  (let [render-ms (some-> metrics :render-ms js/Math.round)]
    (settings-group
     {:settings settings
      :set-settings! set-settings!
      :id :layout
      :title (t :graph/layout)
      :meta (t :graph/layout-force)
      :children [:div.graph-v2-layout-stats
                 [:span [:i {:style {:background-color "#60a5fa"}}] (t :graph/node-count (count (:nodes graph-data)))]
                 [:span [:i {:style {:background-color "#5eead4"}}] (t :graph/link-count (count (:links graph-data)))]
                 (when render-ms
                   [:span [:i {:style {:background-color "#fbbf24"}}] (t :graph/render-time render-ms)])]})))

(defn- settings-panel
  [settings-open? set-settings-open! settings set-settings! view-mode set-view-mode!
   graph-data filtered-graph-data metrics tag-options selected-tag-ids tag-query set-tag-query!]
    [:div.graph-v2-settings
     {:class (when settings-open? "is-open")}
     [:button.graph-v2-settings-dot
      {:aria-label (t :graph/settings)
       :title (t :graph/settings)
       :on-click #(set-settings-open! (not settings-open?))}
      [:span.graph-v2-settings-dot-core]]
     (when settings-open?
       [:div.graph-v2-settings-panel
        [:div.graph-v2-settings-panel-header
         [:div
          [:div.graph-v2-settings-title (t :graph/settings)]
          [:div.graph-v2-settings-subtitle (t :graph/settings-saved-per-graph)]]
         [:button.graph-v2-settings-close
          {:type "button"
           :aria-label (t :ui/close)
           :on-click #(set-settings-open! false)}
          (ui/icon "x" {:size 18})]]
        (view-mode-group settings set-settings! view-mode set-view-mode!)
        (when (= view-mode :tags-and-objects)
          (tags-group settings set-settings! tag-options selected-tag-ids tag-query set-tag-query!))
        (layout-group settings set-settings! filtered-graph-data metrics)])])

(rum/defc global-graph
  []
  (let [repo (state/get-current-repo)
        theme (state/sub :ui/theme)
        dark? (= theme "dark")
        [settings-state set-settings-state!] (hooks/use-state {:repo repo
                                                               :settings (load-graph-settings repo)})
        [settings-open? set-settings-open!] (hooks/use-state false)
        [tag-query set-tag-query!] (hooks/use-state "")
        [metrics set-metrics!] (hooks/use-state nil)
        [graph-data set-graph-data!] (hooks/use-state nil)
        [loading? set-loading!] (hooks/use-state true)
        settings (:settings settings-state)
        set-settings! (fn [settings]
                        (set-settings-state! {:repo repo
                                              :settings settings}))
        view-mode (:view-mode settings)
        switch-view-mode! (fn [mode]
                            (when (not= mode view-mode)
                              (set-metrics! nil)
                              (set-graph-data! nil)
                              (set-loading! true)
                              (set-settings! (assoc settings :view-mode mode))))]
    (hooks/use-effect!
     #(set-settings-state! {:repo repo
                            :settings (load-graph-settings repo)})
     [repo])
    (hooks/use-effect!
     #(when (= repo (:repo settings-state))
        (save-graph-settings! repo settings))
     [repo settings-state])
    (hooks/use-effect!
     (fn []
       (let [cancelled? (atom false)]
         (set-metrics! nil)
         (set-graph-data! nil)
         (set-loading! true)
         (-> (state/<invoke-db-worker :thread-api/build-graph repo {:type :global
                                                                    :theme theme
                                                                    :view-mode view-mode})
             (p/then (fn [result]
                       (when-not @cancelled?
                         (set-graph-data! result)
                         (set-loading! false))))
             (p/catch (fn [error]
                        (js/console.error "Failed to build graph" error)
                        (when-not @cancelled?
                          (set-loading! false)))))
         (fn []
           (reset! cancelled? true))))
     [repo theme view-mode])

    (let [tag-options (when graph-data (tag-options graph-data))
          selected-tag-ids (selected-tag-id-set settings tag-options)
          filtered-graph-data (when graph-data
                                (if (= view-mode :tags-and-objects)
                                  (filter-tags-and-objects-graph graph-data selected-tag-ids)
                                  graph-data))]
      [:div#global-graph.graph-v2-root
       (settings-panel settings-open?
                       set-settings-open!
                       settings
                       set-settings!
                       view-mode
                       switch-view-mode!
                       (when-not loading? graph-data)
                       (when-not loading? filtered-graph-data)
                       (when-not loading? metrics)
                       tag-options
                       selected-tag-ids
                       tag-query
                       set-tag-query!)

       (if (or loading? (nil? filtered-graph-data))
         [:div.graph-v2-loading (t :graph/preparing)]
         (graph/graph-2d {:nodes (:nodes filtered-graph-data)
                          :links (:links filtered-graph-data)
                          :dark? dark?
                          :view-mode view-mode
                          :on-rendered set-metrics!
                          :on-node-activate graph-actions/activate-node!}))])))
