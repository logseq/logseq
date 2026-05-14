(ns frontend.components.graph
  (:require [clojure.string :as string]
            [frontend.components.graph-actions :as graph-actions]
            [frontend.components.svg :as svg]
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
(def ^:private default-depth 1)
(def ^:private default-link-distance 72)
(def ^:private default-grid-layout? false)
(def ^:private default-show-journals? false)
(def ^:private graph-show-arrows? false)
(def ^:private graph-show-edge-labels? true)
(def ^:private default-settings {:view-mode :tags-and-objects
                                 :selected-tag-ids nil
                                 :created-at-filter nil
                                 :depth default-depth
                                 :link-distance default-link-distance
                                 :grid-layout? default-grid-layout?
                                 :show-journals? default-show-journals?
                                 :open-groups default-open-groups})

(defn- storage-key
  [repo]
  (str "logseq.graph.settings." repo))

(defn- valid-view-mode
  [view-mode]
  (if (= view-mode :all-pages)
    :all-pages
    :tags-and-objects))

(defn- clamp-number
  [value min-value max-value default-value]
  (if (number? value)
    (-> value
        (max min-value)
        (min max-value))
    default-value))

(defn- valid-depth
  [value]
  (int (clamp-number value 1 5 default-depth)))

(defn- valid-link-distance
  [value]
  (int (clamp-number value 36 180 default-link-distance)))

(defn encode-settings
  [{:keys [view-mode selected-tag-ids depth link-distance grid-layout? show-journals? open-groups]}]
  (clj->js
   (cond-> {:viewMode (name (valid-view-mode view-mode))
            :depth (valid-depth depth)
            :linkDistance (valid-link-distance link-distance)
            :gridLayout (boolean grid-layout?)
            :showJournals (not (false? show-journals?))
            :openGroups (mapv name (or open-groups default-open-groups))}
     (some? selected-tag-ids)
     (assoc :selectedTagIds (vec selected-tag-ids)))))

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

             (contains? data :depth)
             (assoc :depth (valid-depth (:depth data)))

             (contains? data :linkDistance)
             (assoc :link-distance (valid-link-distance (:linkDistance data)))

             (contains? data :gridLayout)
             (assoc :grid-layout? (true? (:gridLayout data)))

             (contains? data :showJournals)
             (assoc :show-journals? (not (false? (:showJournals data))))

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
        tag-ids (->> (:nodes graph-data)
                     (filter #(= "tag" (:kind %)))
                     (map :id)
                     set)]
    (if (= selected-tag-ids tag-ids)
      graph-data
      (let [selected-links (->> (:links graph-data)
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
               :links selected-links)))))

(defn- settings-toggle
  [settings group-id]
  (update settings :open-groups
          (fn [open-groups]
            (let [open-groups (or open-groups #{})]
              (if (contains? open-groups group-id)
                (disj open-groups group-id)
                (conj open-groups group-id))))))

(defn- settings-close-group
  [settings group-id]
  (update settings :open-groups
          (fn [open-groups]
            (disj (or open-groups #{}) group-id))))

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
     (when open?
       [:div.graph-settings-group-body
        [:div.graph-settings-group-body-inner children]])]))

(defn- view-mode-tab-label
  [label loading?]
  [:span.graph-mode-tab-label
   [:span label]
   (when loading?
     [:span.graph-mode-tab-loading
      {:aria-hidden true}
      (svg/loader-fn {:class "w-3 h-3"})])])

(defn- view-mode-group
  [settings set-settings! view-mode set-view-mode! loading?]
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
       (view-mode-tab-label
        (t :graph/view-mode-tags)
        (and loading? (= view-mode :tags-and-objects))))
      (shui/tabs-trigger
       {:value "all-pages"
        :class "graph-mode-tab"}
       (view-mode-tab-label
        (t :graph/view-mode-all-pages)
        (and loading? (= view-mode :all-pages))))))}))

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

(defn depth-control-disabled?
  [selected-nodes]
  (empty? selected-nodes))

(defn- layout-slider
  [{:keys [label value step disabled? on-change]
    min-value :min
    max-value :max}]
  [:label.graph-layout-control
   {:class (when disabled? "is-disabled")}
   [:span.graph-layout-control-header
    [:span label]
    [:strong value]]
   [:input.graph-layout-slider
    {:type "range"
     :min min-value
     :max max-value
     :step step
     :value value
     :disabled disabled?
     :aria-label label
     :on-change (fn [event]
                  (on-change (js/parseInt (.. event -target -value) 10)))}]])

(defn- layout-toggle
  [label checked? on-change]
  [:label.graph-layout-toggle
   (ui/checkbox {:checked checked?
                 :aria-label label
                 :on-change #(on-change (not checked?))})
   [:span label]])

(defn- layout-group
  [settings set-settings! graph-data selected-nodes view-mode]
  (let [depth (valid-depth (:depth settings))
        link-distance (valid-link-distance (:link-distance settings))
        grid-layout? (true? (:grid-layout? settings))
        show-journals? (not (false? (:show-journals? settings)))
        depth-disabled? (depth-control-disabled? selected-nodes)]
    (settings-group
     {:settings settings
      :set-settings! set-settings!
      :id :layout
      :title (t :graph/layout)
      :meta (t :graph/layout-force)
      :children [:div.graph-layout-controls
                 [:div.graph-layout-stats
                  [:span (t :graph/node-count (count (:nodes graph-data)))]
                  [:span (t :graph/link-count (count (:links graph-data)))]]
                 (layout-slider
                  {:label (t :graph/layout-depth)
                   :value depth
                   :min 1
                   :max 5
                   :step 1
                   :disabled? depth-disabled?
                   :on-change #(set-settings! (fn [settings]
                                                 (assoc settings :depth (valid-depth %))))})
                 (layout-slider
                  {:label (t :graph/layout-link-distance)
                   :value link-distance
                   :min 36
                   :max 180
                   :step 6
                   :on-change #(set-settings! (fn [settings]
                                                 (assoc settings :link-distance (valid-link-distance %))))})
                 (when (= view-mode :tags-and-objects)
                   [:<>
                    (layout-toggle
                     (t :graph/layout-grid-layout)
                     grid-layout?
                     #(set-settings! (fn [settings]
                                       (assoc settings :grid-layout? %))))])
                 (when (= view-mode :all-pages)
                   (layout-toggle
                    (t :graph/layout-show-journals)
                    show-journals?
                    #(set-settings! (fn [settings]
                                      (assoc settings :show-journals? %)))))]})))

(defn time-travel-range
  [graph-data]
  (let [{:keys [created-at-min created-at-max]} (:all-pages graph-data)
        [created-at-min created-at-max] (if (and (number? created-at-min)
                                                 (number? created-at-max))
                                          [created-at-min created-at-max]
                                          (let [created-ats (keep :block/created-at (:nodes graph-data))]
                                            [(when (seq created-ats) (apply min created-ats))
                                             (when (seq created-ats) (apply max created-ats))]))
        duration (when (and created-at-min created-at-max)
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

(defn filter-graph-by-created-at
  [graph-data created-at-filter]
  (if-let [{:keys [created-at-min duration]} (when (some? created-at-filter)
                                               (time-travel-range graph-data))]
    (let [offset (-> (or created-at-filter duration)
                     (max 0)
                     (min duration))
          cutoff (+ created-at-min offset)
          visible-node-ids (->> (:nodes graph-data)
                                (filter (fn [node]
                                          (let [created-at (:block/created-at node)]
                                            (or (nil? created-at)
                                                (<= created-at cutoff)))))
                                (map :id)
                                set)]
      (assoc graph-data
             :nodes (->> (:nodes graph-data)
                         (filter #(contains? visible-node-ids (:id %)))
                         vec)
             :links (->> (:links graph-data)
                         (filter (fn [{:keys [source target]}]
                                   (and (contains? visible-node-ids source)
                                        (contains? visible-node-ids target))))
                         vec)))
    graph-data))

(defn- filter-all-pages-journals
  [graph-data show-journals?]
  (if show-journals?
    graph-data
    (let [visible-node-ids (->> (:nodes graph-data)
                                (remove #(= "journal" (:kind %)))
                                (map :id)
                                set)]
      (assoc graph-data
             :nodes (->> (:nodes graph-data)
                         (filter #(contains? visible-node-ids (:id %)))
                         vec)
             :links (->> (:links graph-data)
                         (filter (fn [{:keys [source target]}]
                                   (and (contains? visible-node-ids source)
                                        (contains? visible-node-ids target))))
                         vec)))))

(defn- filter-graph-by-layout-settings
  [graph-data view-mode show-journals?]
  (if (= view-mode :all-pages)
    (filter-all-pages-journals graph-data show-journals?)
    graph-data))

(defn graph-visible-node-ids
  [source-graph-data visible-graph-data]
  (when (and visible-graph-data
             (not (identical? source-graph-data visible-graph-data)))
    (set (map :id (:nodes visible-graph-data)))))

(defn- format-time-travel-date
  [timestamp]
  (when (number? timestamp)
    (.toLocaleDateString (js/Date. timestamp)
                         js/undefined
                         #js {:year "numeric"
                              :month "short"
                              :day "numeric"})))

(defn- set-time-travel-filter!
  [set-settings! value duration]
  (set-settings!
   (fn [settings]
     (assoc settings
            :created-at-filter
            (when (< value duration)
              value)))))

(defn- cancel-time-travel-animation!
  [animation-frame-ref]
  (when-let [animation-frame-id (hooks/deref animation-frame-ref)]
    (js/cancelAnimationFrame animation-frame-id)
    (hooks/set-ref! animation-frame-ref nil)))

(def ^:private time-travel-animation-ms 4500)

(defn- animate-time-travel-to-now!
  [settings set-settings! graph-data animation-frame-ref]
  (when-let [{:keys [duration]} (time-travel-range graph-data)]
    (cancel-time-travel-animation! animation-frame-ref)
    (let [start-value (time-travel-slider-value settings graph-data)]
      (if (>= start-value duration)
        (set-time-travel-filter! set-settings! duration duration)
        (let [started-at (.now js/performance)]
          (letfn [(step! [timestamp]
                    (let [progress (-> (/ (- timestamp started-at) time-travel-animation-ms)
                                       (max 0)
                                       (min 1))
                          value (+ start-value (* (- duration start-value) progress))]
                      (if (< progress 1)
                        (do
                          (set-time-travel-filter! set-settings! value duration)
                          (hooks/set-ref! animation-frame-ref
                                          (js/requestAnimationFrame step!)))
                        (do
                          (hooks/set-ref! animation-frame-ref nil)
                          (set-time-travel-filter! set-settings! duration duration)))))]
            (hooks/set-ref! animation-frame-ref
                            (js/requestAnimationFrame step!))))))))

(defn- time-travel-control
  [settings set-settings! graph-data animation-frame-ref open? set-open!]
  (when-let [{:keys [created-at-min created-at-max duration]} (time-travel-range graph-data)]
    (let [value (time-travel-slider-value settings graph-data)
          at-now? (= value duration)
          current-timestamp (+ created-at-min value)]
      [:div.graph-time-travel
       {:class (when open? "is-open")}
       [:button.graph-time-travel-toggle.graph-toolbar-button
        {:type "button"
         :aria-label (t :graph/time-travel)
         :title (t :graph/time-travel)
         :on-click #(set-open! (not open?))}
        (ui/icon (if open? "chevron-down" "history") {:size 18})]
       [:div.graph-time-travel-panel
        {:aria-hidden (not open?)}
        [:button.graph-time-travel-reset
        {:type "button"
         :aria-label (t :graph/time-travel-now)
         :title (t :graph/time-travel-now)
         :tab-index (if open? 0 -1)
         :on-click #(animate-time-travel-to-now!
                     settings
                     set-settings!
                     graph-data
                     animation-frame-ref)}
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
           :tab-index (if open? 0 -1)
           :on-change (fn [event]
                        (cancel-time-travel-animation! animation-frame-ref)
                        (let [next-value (js/parseFloat (.. event -target -value))]
                          (set-time-travel-filter!
                           set-settings!
                           next-value
                           duration)))}]
         [:div.graph-time-travel-ticks
          [:span (format-time-travel-date created-at-min)]
          [:span (format-time-travel-date created-at-max)]]]]])))

(defn- settings-panel
  [settings-open? set-settings-open! settings set-settings! view-mode set-view-mode!
   loading? filtered-graph-data available-tags selected-tag-ids tag-query set-tag-query! selected-nodes]
    [:div.graph-settings
     {:class (when settings-open? "is-open")}
     [:button.graph-settings-toggle.graph-toolbar-button
      {:aria-label (t :graph/settings)
       :title (t :graph/settings)
       :on-click #(set-settings-open! (not settings-open?))}
      (ui/icon (if settings-open? "chevron-down" "settings") {:size 18})]
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
        (view-mode-group settings set-settings! view-mode set-view-mode! loading?)
        (when (= view-mode :tags-and-objects)
          (tags-group settings set-settings! available-tags selected-tag-ids tag-query set-tag-query!))
        (layout-group settings set-settings! filtered-graph-data selected-nodes view-mode)])])

(defn- graph-interaction-reset
  [selected-nodes focused-tag-node on-reset]
  (when (or (seq selected-nodes) focused-tag-node)
    [:button.graph-interaction-reset.graph-toolbar-button
     {:type "button"
      :aria-label (t :graph/reset-view)
      :title (t :graph/reset-view)
      :on-click on-reset}
     (ui/icon "refresh" {:size 18})]))

(defn- graph-bottom-toolbar
  [settings-open? set-settings-open! settings set-settings! view-mode switch-view-mode!
   loading? filtered-graph-data available-tags selected-tag-ids tag-query set-tag-query! selected-nodes
   time-travel-animation-ref time-travel-open? set-time-travel-open! mode-graph-data focused-tag-node on-reset]
  [:div.graph-bottom-toolbar
   (settings-panel settings-open?
                   set-settings-open!
                   settings
                   set-settings!
                   view-mode
                   switch-view-mode!
                   loading?
                   filtered-graph-data
                   available-tags
	                   selected-tag-ids
	                   tag-query
	                   set-tag-query!
	                   selected-nodes)
   (time-travel-control
    settings
    set-settings!
    mode-graph-data
    time-travel-animation-ref
    time-travel-open?
    set-time-travel-open!)
   (graph-interaction-reset selected-nodes focused-tag-node on-reset)])

(defn- global-graph-content
  [{:keys [selected-nodes settings-open? set-settings-open! settings set-settings!
           view-mode switch-view-mode! loading? filtered-graph-data available-tags
           selected-tag-ids tag-query set-tag-query! build-error retry! mode-graph-data
           canvas-settings visible-node-ids background-visible-node-ids dark? graph-view-mode set-selected-nodes!
           focused-tag-node set-focused-tag-node! reset-token on-reset-interaction
           time-travel-animation-ref time-travel-open? set-time-travel-open!]}]
  [:div#global-graph.graph-root
   (selected-node-status selected-nodes)
   [:<>
    (cond
      (and build-error (nil? mode-graph-data))
      (graph-error retry!)

      (nil? mode-graph-data)
      [:div.graph-loading (t :graph/preparing)]

      :else
      (graph/graph-2d {:nodes (:nodes mode-graph-data)
                       :links (:links mode-graph-data)
                       :visible-node-ids visible-node-ids
                       :background-visible-node-ids background-visible-node-ids
                       :depth (valid-depth (:depth canvas-settings))
                       :show-arrows? graph-show-arrows?
                       :link-distance (valid-link-distance (:link-distance canvas-settings))
                       :show-edge-labels? graph-show-edge-labels?
                       :grid-layout? (true? (:grid-layout? canvas-settings))
                       :dark? dark?
                       :view-mode graph-view-mode
                       :aria-label (t :graph/canvas-label)
                       :on-selection-change set-selected-nodes!
                       :on-focus-change set-focused-tag-node!
                       :reset-token reset-token
                       :on-node-activate graph-actions/activate-node!
                       :on-node-preview graph-actions/preview-node!}))
    (when (and loading? mode-graph-data)
      [:div.graph-loading.graph-loading-inline (t :graph/preparing)])
    (graph-bottom-toolbar
     settings-open?
     set-settings-open!
     settings
     set-settings!
     view-mode
     switch-view-mode!
     loading?
     (when-not loading? filtered-graph-data)
     available-tags
     selected-tag-ids
     tag-query
     set-tag-query!
     selected-nodes
     time-travel-animation-ref
     time-travel-open?
     set-time-travel-open!
     mode-graph-data
     focused-tag-node
     on-reset-interaction)]])

(defn- load-global-graph!
  [repo theme view-mode set-graph-data-by-mode! set-loading-modes! set-build-errors! set-selected-nodes!]
  (let [cancelled? (atom false)]
    (set-loading-modes! (fn [loading-modes]
                          (conj (or loading-modes #{}) view-mode)))
    (set-build-errors! (fn [errors]
                         (dissoc (or errors {}) view-mode)))
    (set-selected-nodes! [])
    (-> (state/<invoke-db-worker :thread-api/build-graph repo {:type :global
                                                               :theme theme
                                                               :view-mode view-mode
                                                               :journal? true})
        (p/then (fn [result]
                  (when-not @cancelled?
                    (set-graph-data-by-mode! (fn [data-by-mode]
                                               (assoc (or data-by-mode {}) view-mode result)))
                    (set-loading-modes! (fn [loading-modes]
                                          (disj (or loading-modes #{}) view-mode))))))
        (p/catch (fn [error]
                   (log/error :graph/build-failed {:error error})
                   (when-not @cancelled?
                     (set-build-errors! (fn [errors]
                                          (assoc (or errors {}) view-mode error)))
                     (set-loading-modes! (fn [loading-modes]
                                           (disj (or loading-modes #{}) view-mode)))))))
    #(reset! cancelled? true)))

(defn- use-global-graph-effects!
  [{:keys [repo theme view-mode retry-token settings settings-state graph-data-by-mode
           time-travel-animation-ref set-settings-state! set-graph-data-by-mode!
           set-loading-modes! set-build-errors! set-visible-view-mode!
           set-selected-nodes!]}]
  (hooks/use-effect!
   #(set-settings-state! {:repo repo
                          :settings (load-graph-settings repo)})
   [repo])
  (hooks/use-effect!
   #(do
      (set-graph-data-by-mode! {})
      (set-loading-modes! #{})
      (set-build-errors! {})
      (set-visible-view-mode! view-mode))
   [repo theme])
  (hooks/use-effect!
   (fn []
     #(cancel-time-travel-animation! time-travel-animation-ref))
   [])
  (hooks/use-effect!
   #(when (= repo (:repo settings-state))
      (save-graph-settings! repo settings))
   [repo settings-state])
  (hooks/use-effect!
   (fn []
     (when (nil? (get graph-data-by-mode view-mode))
       (load-global-graph! repo theme view-mode set-graph-data-by-mode! set-loading-modes! set-build-errors! set-selected-nodes!)))
   [repo theme view-mode retry-token graph-data-by-mode])
  (hooks/use-effect!
   #(when (get graph-data-by-mode view-mode)
      (set-visible-view-mode! view-mode))
   [graph-data-by-mode view-mode]))

(defn- global-graph-content-props
  [settings-props graph-props tag-props time-travel-props action-props]
  (let [{:keys [settings-open? set-settings-open! settings set-settings! view-mode switch-view-mode!
                loading? build-error retry!]} settings-props
        {:keys [filtered-graph-data mode-graph-data canvas-settings visible-node-ids
                background-visible-node-ids dark? graph-view-mode]} graph-props
        {:keys [available-tags selected-tag-ids tag-query set-tag-query!]} tag-props
        {:keys [time-travel-animation-ref time-travel-open? set-time-travel-open!]} time-travel-props
        {:keys [selected-nodes set-selected-nodes! focused-tag-node set-focused-tag-node!
                reset-token on-reset-interaction]} action-props]
  {:selected-nodes selected-nodes
   :settings-open? settings-open?
   :set-settings-open! set-settings-open!
   :settings settings
   :set-settings! set-settings!
   :view-mode view-mode
   :switch-view-mode! switch-view-mode!
   :loading? loading?
   :filtered-graph-data filtered-graph-data
   :available-tags available-tags
   :selected-tag-ids selected-tag-ids
   :tag-query tag-query
   :set-tag-query! set-tag-query!
   :build-error build-error
   :retry! retry!
   :mode-graph-data mode-graph-data
   :canvas-settings canvas-settings
   :visible-node-ids visible-node-ids
   :background-visible-node-ids background-visible-node-ids
   :dark? dark?
   :graph-view-mode graph-view-mode
   :set-selected-nodes! set-selected-nodes!
   :focused-tag-node focused-tag-node
   :set-focused-tag-node! set-focused-tag-node!
   :reset-token reset-token
   :on-reset-interaction on-reset-interaction
   :time-travel-animation-ref time-travel-animation-ref
   :time-travel-open? time-travel-open?
   :set-time-travel-open! set-time-travel-open!}))

(defn- make-set-settings!
  [repo set-settings-state!]
  (fn [settings-or-fn]
    (set-settings-state!
     (fn [state]
       (let [current-settings (if (= repo (:repo state))
                                (:settings state)
                                (load-graph-settings repo))
             next-settings (if (fn? settings-or-fn)
                             (settings-or-fn current-settings)
                             settings-or-fn)]
         {:repo repo
          :settings next-settings})))))

(rum/defc global-graph
  []
  (let [repo (state/get-current-repo)
        theme (state/sub :ui/theme)
        theme-token (use-theme-token)
        dark? (effective-dark-theme? theme theme-token)
        [settings-state set-settings-state!] (hooks/use-state {:repo repo :settings (load-graph-settings repo)})
        [settings-open? set-settings-open!] (hooks/use-state false)
        [tag-query set-tag-query!] (hooks/use-state "")
        [graph-data-by-mode set-graph-data-by-mode!] (hooks/use-state {})
        [loading-modes set-loading-modes!] (hooks/use-state #{})
        [build-errors set-build-errors!] (hooks/use-state {})
        [retry-token set-retry-token!] (hooks/use-state 0)
        [selected-nodes set-selected-nodes!] (hooks/use-state [])
        [focused-tag-node set-focused-tag-node!] (hooks/use-state nil)
        [reset-token set-reset-token!] (hooks/use-state 0)
        [time-travel-open? set-time-travel-open!] (hooks/use-state false)
        [visible-view-mode set-visible-view-mode!] (hooks/use-state (:view-mode (:settings settings-state)))
        time-travel-animation-ref (hooks/use-ref nil)
        canvas-settings-ref (hooks/use-ref (:settings settings-state))
        settings (:settings settings-state)
        set-settings! (make-set-settings! repo set-settings-state!)
        view-mode (:view-mode settings)
        switch-view-mode! (fn [mode]
                            (when (not= mode view-mode)
                              (set-selected-nodes! [])
                              (set-focused-tag-node! nil)
                              (set-settings! (fn [settings]
                                               (-> settings
                                                   (assoc :view-mode mode)
                                                   (settings-close-group :displayed-tags))))))]
    (use-global-graph-effects!
     {:repo repo :theme theme :view-mode view-mode :retry-token retry-token
      :settings settings :settings-state settings-state :graph-data-by-mode graph-data-by-mode
      :time-travel-animation-ref time-travel-animation-ref
      :set-settings-state! set-settings-state! :set-graph-data-by-mode! set-graph-data-by-mode!
      :set-loading-modes! set-loading-modes! :set-build-errors! set-build-errors!
      :set-visible-view-mode! set-visible-view-mode! :set-selected-nodes! set-selected-nodes!})
    (hooks/use-effect!
     #(when (= view-mode visible-view-mode)
        (hooks/set-ref! canvas-settings-ref settings))
     [settings view-mode visible-view-mode])

    (let [graph-view-mode visible-view-mode
          switching-view-mode? (not= view-mode graph-view-mode)
          canvas-settings (if switching-view-mode?
                            (hooks/deref canvas-settings-ref)
                            settings)
          show-journals? (not (false? (:show-journals? canvas-settings)))
          graph-data (get graph-data-by-mode graph-view-mode)
          tags-graph-data (get graph-data-by-mode :tags-and-objects)
          loading? (contains? loading-modes view-mode)
          build-error (get build-errors view-mode)
	          available-tags (hooks/use-memo #(when (and (= view-mode :tags-and-objects) tags-graph-data)
	                                            (tag-options tags-graph-data))
	                                         [view-mode tags-graph-data])
	          canvas-available-tags (hooks/use-memo #(when (and (= graph-view-mode :tags-and-objects) graph-data)
	                                                   (tag-options graph-data))
	                                                [graph-view-mode graph-data])
          selected-tag-ids (selected-tag-id-set canvas-settings canvas-available-tags)
          selected-tag-key (if (some? (:selected-tag-ids canvas-settings))
                             (string/join "\u0000" (sort (:selected-tag-ids canvas-settings)))
                             "__all__")
	          mode-graph-data (hooks/use-memo #(when graph-data
	                                             (if (= graph-view-mode :tags-and-objects)
	                                               (filter-tags-and-objects-graph graph-data selected-tag-ids)
	                                               graph-data))
	                                          [graph-data graph-view-mode selected-tag-key])
          layout-filtered-graph-data (hooks/use-memo
                                      #(when mode-graph-data
                                         (filter-graph-by-layout-settings
                                          mode-graph-data
                                          graph-view-mode
                                          show-journals?))
                                      [mode-graph-data graph-view-mode show-journals?])
	          filtered-graph-data (when mode-graph-data
	                                (filter-graph-by-created-at layout-filtered-graph-data
	                                                            (:created-at-filter canvas-settings)))
          visible-node-ids (graph-visible-node-ids mode-graph-data filtered-graph-data)
          background-visible-node-ids visible-node-ids]
	      (global-graph-content
	       (global-graph-content-props
	        {:settings-open? settings-open? :set-settings-open! set-settings-open! :settings settings
	         :set-settings! set-settings! :view-mode view-mode :switch-view-mode! switch-view-mode!
	         :loading? loading? :build-error build-error :retry! #(set-retry-token! (inc retry-token))}
	        {:filtered-graph-data filtered-graph-data :mode-graph-data mode-graph-data :canvas-settings canvas-settings
	         :visible-node-ids visible-node-ids :background-visible-node-ids background-visible-node-ids
	         :dark? dark? :graph-view-mode graph-view-mode}
	        {:available-tags available-tags :selected-tag-ids selected-tag-ids :tag-query tag-query
	         :set-tag-query! set-tag-query!}
	        {:time-travel-animation-ref time-travel-animation-ref :time-travel-open? time-travel-open?
	         :set-time-travel-open! set-time-travel-open!}
	        {:selected-nodes selected-nodes :set-selected-nodes! set-selected-nodes!
	         :focused-tag-node focused-tag-node :set-focused-tag-node! set-focused-tag-node! :reset-token reset-token
	         :on-reset-interaction #(do (set-selected-nodes! [])
	                                    (set-focused-tag-node! nil)
	                                    (set-reset-token! (inc reset-token)))})))))
