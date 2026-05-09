(ns frontend.components.graph
  (:require [clojure.string :as string]
            [frontend.components.graph-actions :as graph-actions]
            [frontend.context.i18n :refer [t]]
            [frontend.extensions.graph :as graph]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [lambdaisland.glogi :as log]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [rum.core :as rum]))

(def ^:private default-open-groups #{:view-mode :displayed-tags :layout})
(def ^:private default-settings {:view-mode :tags-and-objects
                                 :selected-tag-ids nil
                                 :created-at-filter nil
                                 :open-groups default-open-groups})

(defn- storage-key
  [repo]
  (str "logseq.graph.settings." repo))

(defn- valid-view-mode
  [view-mode]
  (if (= view-mode :all-pages)
    :all-pages
    :tags-and-objects))

(defn encode-settings
  [{:keys [view-mode selected-tag-ids created-at-filter open-groups]}]
  (clj->js
   (cond-> {:viewMode (name (valid-view-mode view-mode))
            :openGroups (mapv name (or open-groups default-open-groups))}
     (some? selected-tag-ids)
     (assoc :selectedTagIds (vec selected-tag-ids))

     (some? created-at-filter)
     (assoc :createdAtFilter created-at-filter))))

(defn decode-settings
  [data]
  (merge default-settings
         (when (map? data)
           (cond->
            {}
             (contains? data :viewMode)
             (assoc :view-mode (valid-view-mode (keyword (:viewMode data))))

             (and (contains? data :selectedTagIds)
                  (some? (:selectedTagIds data)))
             (assoc :selected-tag-ids (vec (:selectedTagIds data)))

             (and (contains? data :createdAtFilter)
                  (number? (:createdAtFilter data)))
             (assoc :created-at-filter (:createdAtFilter data))

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

(defn- parse-hex-color
  [value]
  (when-let [[_ r g b] (re-matches #"(?i)#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})" value)]
    [(js/parseInt r 16)
     (js/parseInt g 16)
     (js/parseInt b 16)]))

(defn- parse-short-hex-color
  [value]
  (when-let [[_ r g b] (re-matches #"(?i)#([0-9a-f])([0-9a-f])([0-9a-f])" value)]
    [(js/parseInt (str r r) 16)
     (js/parseInt (str g g) 16)
     (js/parseInt (str b b) 16)]))

(defn- parse-rgb-color
  [value]
  (when-let [[_ r g b] (re-find #"rgba?\(\s*([0-9.]+)[,\s]+([0-9.]+)[,\s]+([0-9.]+)" value)]
    [(js/parseFloat r)
     (js/parseFloat g)
     (js/parseFloat b)]))

(defn- parse-css-color
  [value]
  (let [value (string/trim (or value ""))]
    (or (parse-hex-color value)
        (parse-short-hex-color value)
        (parse-rgb-color value))))

(defn- color-dark?
  [[r g b]]
  (< (+ (* 0.2126 r) (* 0.7152 g) (* 0.0722 b)) 128))

(defn- css-var-value
  [^js el var-name]
  (when el
    (some-> (js/getComputedStyle el)
            (.getPropertyValue var-name)
            string/trim
            not-empty)))

(defn- effective-dark-theme?
  [theme _theme-token]
  (let [doc-el (.-documentElement js/document)
        body (.-body js/document)
        bg-color (or (css-var-value body "--ls-primary-background-color")
                     (css-var-value doc-el "--ls-primary-background-color"))]
    (if-let [rgb (parse-css-color bg-color)]
      (color-dark? rgb)
      (contains? #{"dark" :dark} (or (some-> doc-el .-dataset .-theme)
                                      theme)))))

(defn- use-theme-token
  []
  (let [[token set-token!] (hooks/use-state 0)]
    (hooks/use-effect!
     (fn []
       (when (exists? js/MutationObserver)
         (let [observer (js/MutationObserver.
                         (fn [_mutations _observer]
                           (set-token! (.now js/Date))))
               opts #js {:attributes true
                         :attributeFilter #js ["class" "style" "data-theme" "data-color"]}]
           (when-let [doc-el (.-documentElement js/document)]
             (.observe observer doc-el opts))
           (when-let [body (.-body js/document)]
             (.observe observer body opts))
           #(.disconnect observer))))
     [])
    token))

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
  [settings available-tags]
  (let [available-ids (set (map :id available-tags))]
    (if (some? (:selected-tag-ids settings))
      (let [selected-tag-ids (:selected-tag-ids settings)]
        (set (filter available-ids selected-tag-ids)))
      available-ids)))

(defn toggle-selected-tag-id
  [settings available-tags tag-id]
  (let [selected-tag-ids (selected-tag-id-set settings available-tags)]
    (assoc settings
           :selected-tag-ids
           (vec (if (contains? selected-tag-ids tag-id)
                  (disj selected-tag-ids tag-id)
                  (conj selected-tag-ids tag-id))))))

(defn- selected-node-status
  [selected-nodes]
  (let [labels (->> selected-nodes
                    (keep :label)
                    (take 5)
                    (string/join ", "))]
    [:div.graph-a11y-panel
     {:aria-live "polite"}
     [:p (if (seq selected-nodes)
           (t :graph/selected-nodes-status (count selected-nodes) labels)
           (t :graph/no-selected-node))]
     (when (seq selected-nodes)
       (into
        [:ul]
        (map (fn [{:keys [id label] :as node}]
               [:li {:key id}
                [:button
                 {:type "button"
                  :on-click #(graph-actions/redirect-to-node! node)}
                 (t :graph/open-selected-node label)]]))
        selected-nodes))]))

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
    [:section.graph-settings-group
     {:class (when open? "is-open")}
     [:button.graph-settings-group-header
      {:type "button"
       :aria-expanded (str open?)
       :on-click #(set-settings! (settings-toggle settings id))}
      [:span.graph-settings-group-title
       [:span.graph-settings-group-chevron
        (ui/icon "chevron-right" {:size 16})]
       [:span title]]
      (when meta
        [:span.graph-settings-group-meta meta])]
     [:div.graph-settings-group-body
      [:div.graph-settings-group-body-inner children]]]))

(defn- view-mode-group
  [settings set-settings! view-mode set-view-mode!]
  (settings-group
   {:settings settings
    :set-settings! set-settings!
    :id :view-mode
    :title (t :graph/view-mode)
    :children
    (shui/tabs
     {:value (name view-mode)
      :on-value-change #(set-view-mode! (keyword %))
      :class "graph-mode-tabs"}
     (shui/tabs-list
      {:class "graph-mode-tabs-list"}
      (shui/tabs-trigger
       {:value "tags-and-objects"
        :class "graph-mode-tab"}
       (t :graph/view-mode-tags))
      (shui/tabs-trigger
       {:value "all-pages"
        :class "graph-mode-tab"}
       (t :graph/view-mode-all-pages))))}))

(defn- tags-group
  [settings set-settings! available-tags selected-tag-ids tag-query set-tag-query!]
  (let [query (string/lower-case (string/trim (or tag-query "")))
        shown-tags (cond->> available-tags
                     (seq query)
                     (filter #(string/includes? (string/lower-case (:label %)) query)))
        selected-count (count selected-tag-ids)]
    (settings-group
     {:settings settings
      :set-settings! set-settings!
      :id :displayed-tags
      :title (t :graph/displayed-tags)
      :meta (t :graph/displayed-tags-count selected-count (count available-tags))
      :children
      [:div.graph-tags-control
       [:div.graph-tag-search
        (ui/icon "search" {:size 16})
        (shui/input {:value tag-query
                     :placeholder (t :graph/search-tags)
                     :on-change #(set-tag-query! (.. % -target -value))})]
       [:div.graph-tag-actions
        (ui/button (t :graph/select-all-tags)
                   :on-click #(set-settings! (assoc settings :selected-tag-ids nil))
                   :variant :outline
                   :size :xs)
        (ui/button (t :graph/clear-tags)
                   :on-click #(set-settings! (assoc settings :selected-tag-ids []))
                   :variant :outline
                   :size :xs)]
       (into
        [:div.graph-tag-list]
        (map
         (fn [{:keys [id label count]}]
           (let [checked? (contains? selected-tag-ids id)]
             [:label.graph-tag-row
              {:key id
               :class (when checked? "is-selected")}
              (ui/checkbox {:checked checked?
                            :aria-label (t :graph/toggle-tag label)
                            :on-change #(set-settings!
                                         (toggle-selected-tag-id settings available-tags id))})
              [:span.graph-tag-content
               [:span.graph-tag-name label]
               [:span.graph-tag-count count]]])))
        shown-tags)]})))

(defn- graph-error
  [retry!]
  [:div.graph-error
   [:div.graph-error-title (t :graph/build-error)]
   (ui/button (t :graph/retry)
              :on-click retry!
              :variant :outline
              :size :sm)])

(defn- layout-group
  [settings set-settings! graph-data]
  (settings-group
   {:settings settings
    :set-settings! set-settings!
    :id :layout
    :title (t :graph/layout)
    :meta (t :graph/layout-force)
    :children [:div.graph-layout-stats
               [:span (t :graph/node-count (count (:nodes graph-data)))]
               [:span (t :graph/link-count (count (:links graph-data)))]]}))

(defn- time-travel-range
  [graph-data]
  (let [{:keys [created-at-min created-at-max]} (:all-pages graph-data)
        duration (when (and (number? created-at-min)
                            (number? created-at-max))
                   (- created-at-max created-at-min))]
    (when (and duration (pos? duration))
      {:created-at-min created-at-min
       :created-at-max created-at-max
       :duration duration})))

(defn time-travel-slider-value
  [settings graph-data]
  (when-let [{:keys [duration]} (time-travel-range graph-data)]
    (-> (or (:created-at-filter settings) duration)
        (max 0)
        (min duration))))

(defn- format-time-travel-date
  [timestamp]
  (when (number? timestamp)
    (.toLocaleDateString (js/Date. timestamp)
                         js/undefined
                         #js {:year "numeric"
                              :month "short"
                              :day "numeric"})))

(defn- time-travel-control
  [settings set-settings! graph-data]
  (when-let [{:keys [created-at-min created-at-max duration]} (time-travel-range graph-data)]
    (let [value (time-travel-slider-value settings graph-data)
          at-now? (= value duration)
          current-timestamp (+ created-at-min value)]
      [:div.graph-time-travel
       [:button.graph-time-travel-reset
        {:type "button"
         :aria-label (t :graph/time-travel-now)
         :title (t :graph/time-travel-now)
         :on-click #(set-settings! (assoc settings :created-at-filter nil))}
        (ui/icon "player-play" {:size 18})]
       [:div.graph-time-travel-body
        [:div.graph-time-travel-label
         [:span (t :graph/time-travel)]
         [:strong (if at-now?
                    (t :graph/time-travel-now)
                    (format-time-travel-date current-timestamp))]]
        [:input.graph-time-travel-slider
         {:type "range"
          :min 0
          :max duration
          :step (max 1 (js/Math.floor (/ duration 240)))
          :value value
          :aria-label (t :graph/time-travel)
          :on-change (fn [event]
                       (let [next-value (js/parseFloat (.. event -target -value))]
                         (set-settings!
                          (assoc settings
                                 :created-at-filter
                                 (when (< next-value duration)
                                   next-value)))))}]
        [:div.graph-time-travel-ticks
         [:span (format-time-travel-date created-at-min)]
         [:span (format-time-travel-date created-at-max)]]]])))

(defn- settings-panel
  [settings-open? set-settings-open! settings set-settings! view-mode set-view-mode!
   filtered-graph-data available-tags selected-tag-ids tag-query set-tag-query!]
    [:div.graph-settings
     {:class (when settings-open? "is-open")}
     [:button.graph-settings-dot
      {:aria-label (t :graph/settings)
       :title (t :graph/settings)
       :on-click #(set-settings-open! (not settings-open?))}
      [:span.graph-settings-dot-core]]
     (when settings-open?
       [:div.graph-settings-panel
        [:div.graph-settings-panel-header
         [:div
          [:div.graph-settings-title (t :graph/settings)]
          [:div.graph-settings-subtitle (t :graph/settings-saved-per-graph)]]
         [:button.graph-settings-close
          {:type "button"
           :aria-label (t :ui/close)
           :on-click #(set-settings-open! false)}
          (ui/icon "x" {:size 18})]]
        (view-mode-group settings set-settings! view-mode set-view-mode!)
        (when (= view-mode :tags-and-objects)
          (tags-group settings set-settings! available-tags selected-tag-ids tag-query set-tag-query!))
        (layout-group settings set-settings! filtered-graph-data)])])

(rum/defc global-graph
  []
  (let [repo (state/get-current-repo)
        theme (state/sub :ui/theme)
        theme-token (use-theme-token)
        dark? (effective-dark-theme? theme theme-token)
        [settings-state set-settings-state!] (hooks/use-state {:repo repo
                                                               :settings (load-graph-settings repo)})
        [settings-open? set-settings-open!] (hooks/use-state false)
        [tag-query set-tag-query!] (hooks/use-state "")
        [graph-data set-graph-data!] (hooks/use-state nil)
        [loading? set-loading!] (hooks/use-state true)
        [build-error set-build-error!] (hooks/use-state nil)
        [retry-token set-retry-token!] (hooks/use-state 0)
        [selected-nodes set-selected-nodes!] (hooks/use-state [])
        settings (:settings settings-state)
        set-settings! (fn [settings]
                        (set-settings-state! {:repo repo
                                              :settings settings}))
        view-mode (:view-mode settings)
        created-at-filter (:created-at-filter settings)
        switch-view-mode! (fn [mode]
                            (when (not= mode view-mode)
                              (set-graph-data! nil)
                              (set-loading! true)
                              (set-build-error! nil)
                              (set-selected-nodes! [])
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
         (set-graph-data! nil)
         (set-loading! true)
         (set-build-error! nil)
         (set-selected-nodes! [])
         (-> (state/<invoke-db-worker :thread-api/build-graph repo {:type :global
                                                                    :theme theme
                                                                    :view-mode view-mode
                                                                    :created-at-filter (when (= view-mode :all-pages)
                                                                                         created-at-filter)})
             (p/then (fn [result]
                       (when-not @cancelled?
                         (set-graph-data! result)
                         (set-loading! false))))
             (p/catch (fn [error]
                        (log/error :graph/build-failed {:error error})
                        (when-not @cancelled?
                          (set-build-error! error)
                          (set-loading! false)))))
         (fn []
           (reset! cancelled? true))))
     [repo theme view-mode created-at-filter retry-token])

    (let [available-tags (when graph-data (tag-options graph-data))
          selected-tag-ids (selected-tag-id-set settings available-tags)
          filtered-graph-data (when graph-data
                                (if (= view-mode :tags-and-objects)
                                  (filter-tags-and-objects-graph graph-data selected-tag-ids)
                                  graph-data))]
      [:div#global-graph.graph-root
       (selected-node-status selected-nodes)
       (settings-panel settings-open?
                       set-settings-open!
                       settings
                       set-settings!
                       view-mode
                       switch-view-mode!
                       (when-not loading? filtered-graph-data)
                       available-tags
                       selected-tag-ids
                       tag-query
                       set-tag-query!)

       (cond
         loading?
         [:div.graph-loading (t :graph/preparing)]

         build-error
         (graph-error #(set-retry-token! (inc retry-token)))

         (nil? filtered-graph-data)
         [:div.graph-loading (t :graph/preparing)]

         :else
         [:<>
          (graph/graph-2d {:nodes (:nodes filtered-graph-data)
                           :links (:links filtered-graph-data)
                           :dark? dark?
                           :view-mode view-mode
                           :aria-label (t :graph/canvas-label)
                           :on-selection-change set-selected-nodes!
                           :on-node-activate graph-actions/activate-node!})
          (when (= view-mode :all-pages)
            (time-travel-control settings set-settings! filtered-graph-data))])])))
