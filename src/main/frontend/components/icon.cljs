(ns frontend.components.icon
  (:require ["@emoji-mart/data" :as emoji-data]
            ["emoji-mart" :refer [SearchIndex]]
            [camel-snake-kebab.core :as csk]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.search :as search]
            [frontend.storage :as storage]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.functions :refer [debounce]]
            [goog.object :as gobj]
            [logseq.db :as ldb]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [medley.core :as medley]
            [promesa.core :as p]
            [io.factorhouse.hsx.core :as hsx]))

(defonce emojis (vals (bean/->clj (gobj/get emoji-data "emojis"))))

(defn icon
  [icon' & [opts]]
  (let [icon' (if (or (string? icon') (keyword? icon'))
                {:type :tabler-icon :id (name icon')} icon')]
    (if (and (contains? #{:emoji :tabler-icon} (:type icon'))
             (string? (:id icon'))
             (not (string/blank? (:id icon'))))
      (let [color? (:color? opts)
            opts (dissoc opts :color?)
            item (cond
                   (and (= :emoji (:type icon')) (:id icon'))
                   [:span.ui__icon
                    [:em-emoji (merge {:id (:id icon')
                                       :style {:line-height 1}}
                                      opts)]]

                   (and (= :tabler-icon (:type icon')) (:id icon'))
                   (ui/icon (:id icon') opts)

                   :else
                   icon')]
        (if color?
          [:span.inline-flex.items-center.ls-icon-color-wrap
           {:style {:color (or (some-> icon' :color) "inherit")}} item]
          item))
      (do
        (js/console.error "Invalid icon")
        [:span]))))

(defn get-node-icon
  [node-entity {:keys [ignore-current-icon?]
                :or {ignore-current-icon? false}}]
  (or (when-not ignore-current-icon?
        (get node-entity :logseq.property/icon))
      (let [asset-type (:logseq.property.asset/type node-entity)
            first-tag-icon (some :logseq.property/icon (sort-by :db/id (:block/tags node-entity)))]
        (cond
          (ldb/class? node-entity)
          "hash"
          (ldb/property? node-entity)
          "letter-p"
          (ldb/page? node-entity)
          "file"
          (= asset-type "pdf")
          "book"
          (some? first-tag-icon)
          first-tag-icon
          :else
          "point-filled"))))

(defn get-node-icon-cp
  [node-entity opts]
  (let [opts' (merge {:size 14} opts)
        node-icon (if (:link? opts)
                    "arrow-narrow-right"
                    (get-node-icon node-entity opts))]
    (when-not (or (string/blank? node-icon) (and (contains? #{"point-filled" "letter-p" "hash" "file"} node-icon) (:not-text-or-page? opts)))
      [:div.icon-cp-container.flex.items-center
       (merge {:style {:color (or (:color node-icon) "inherit")}}
              (select-keys opts [:class]))
       (icon node-icon (dissoc opts' :not-text-or-page? :link? :ignore-current-icon?))])))

(defn- search-emojis
  [q]
  (p/let [result (.search SearchIndex q)]
    (bean/->clj result)))

(defonce *tabler-icons (atom nil))
(defn- get-tabler-icons
  []
  (if @*tabler-icons
    @*tabler-icons
    (let [result (->> (keys (bean/->clj js/tablerIcons))
                      (map (fn [k]
                             (-> (string/replace (csk/->Camel_Snake_Case (name k)) "_" " ")
                                 (string/replace-first "Icon " ""))))
                   ;; FIXME: somehow those icons don't work
                      (remove #{"Ab" "Ab 2" "Ab Off"}))]
      (reset! *tabler-icons result)
      result)))

(defn- search-tabler-icons
  [q]
  (search/fuzzy-search (get-tabler-icons) q :limit 100))

(defn- search
  [q tab]
  (p/let [icons (when (not= tab :emoji) (search-tabler-icons q))
          emojis' (when (not= tab :icon) (search-emojis q))]
    {:icons icons
     :emojis emojis'}))

(hsx/defc icons-row
  [items]
  [:div.its.icons-row items])

(hsx/defc icon-cp
  [icon' {:keys [on-chosen hover]}]
  [:button.w-9.h-9.transition-opacity
   (when-let [icon' (cond-> icon' (string? icon') (string/replace " " ""))]
     {:key icon'
      :tabIndex "0"
      :title icon'
      :on-click (fn [e]
                  (on-chosen e {:type :tabler-icon
                                :id icon'
                                :name icon'}))
      :on-mouse-over #(some-> hover
                              (reset! {:type :tabler-icon
                                       :id icon'
                                       :name icon'
                                       :icon icon'}))
      :on-mouse-out #()})
   (ui/icon icon' {:size 24})])

(hsx/defc emoji-cp
  [{:keys [id name] :as emoji} {:keys [on-chosen hover]}]
  [:button.text-2xl.w-9.h-9.transition-opacity
   (cond->
    {:tabIndex "0"
     :title name
     :on-click (fn [e]
                 (on-chosen e (assoc emoji :type :emoji)))
     (not (nil? hover))
     (merge
      {:on-mouse-over #(reset! hover emoji)
       :on-mouse-out #()})})
   [:em-emoji {:id id
               :style {:line-height 1
                       :pointer-events "none"}}]])

(defn item-render
  [item opts]
  (if (or (string? item)
          (= :tabler-icon (:type item)))
    (icon-cp (if (string? item) item (:id item)) opts)
    (emoji-cp item opts)))

(hsx/defc pane-section
  [label items & {:keys [searching? virtual-list?]
                  :or {virtual-list? true}
                  :as opts}]
  (let [*el-ref (hooks/use-ref nil)]
    [:div.pane-section
     {:ref *el-ref
      :class (util/classnames
              [{:has-virtual-list virtual-list?
                :searching-result searching?}])}
     [:div.hd.px-1.pb-1.leading-none
      [:strong.text-xs.font-medium.text-gray-07.dark:opacity-80 label]]
     (if virtual-list?
       (let [total (count items)
             step 9
             rows (quot total step)
             mods (mod total step)
             rows (if (zero? mods) rows (inc rows))
             items (vec items)]
         (ui/virtualized-list
          (cond-> {:total-count rows
                   :item-content (fn [idx]
                                   (icons-row
                                    (let [last? (= (dec rows) idx)
                                          start (* idx step)
                                          end (* (inc idx) (if (and last? (not (zero? mods))) mods step))
                                          icons (try (subvec items start end)
                                                     (catch js/Error e
                                                       (js/console.error e)
                                                       nil))]
                                      (mapv #(item-render % opts) icons))))}

            searching?
            (assoc :custom-scroll-parent (some-> (hooks/deref *el-ref) (.closest ".bd-scroll"))))))
       [:div.its
        (map #(item-render % opts) items)])]))

(defn- normalize-tabs
  [tabs default-tab]
  (let [tabs (or tabs [[:all (t :icon/tab-all)]
                       [:emoji (t :icon/tab-emojis)]
                       [:icon (t :icon/tab-icons)]])
        default-tab (or default-tab (ffirst tabs) :all)
        default-tab (if (some #(= (first %) default-tab) tabs)
                      default-tab
                      (ffirst tabs))]
    {:tabs tabs
     :default-tab default-tab
     :has-icon-tab? (boolean (some #(= (first %) :icon) tabs))}))

(defn- emoji-sections
  [emojis* used-items show-used?]
  (let [emoji-used-items (when (seq used-items)
                           (filterv #(= :emoji (:type %)) used-items))
        sections (cond-> []
                   (and show-used? (seq emoji-used-items))
                   (conj {:title (t :ui/frequently-used)
                          :items emoji-used-items
                          :virtual-list? false})
                   true
                   (conj {:title (t :icon/emojis-count (count emojis*))
                          :items emojis*
                          :virtual-list? true}))]
    sections))

(defn get-used-items
  []
  (storage/get :ui/ls-icons-used))

(defn add-used-item!
  [m]
  (let [s (some->> (or (get-used-items) [])
                   (take 24)
                   (filter #(not= m %))
                   (cons m))]
    (storage/set :ui/ls-icons-used s)))

(hsx/defc emojis-cp
  [emojis* opts]
  (let [sections (emoji-sections emojis* (get-used-items) (:show-used? opts))]
    [:div.flex.flex-1.flex-col.gap-1
     (for [{:keys [title items virtual-list?]} sections]
       (pane-section title items (assoc opts :virtual-list? virtual-list?)))]))

(hsx/defc icons-cp
  [icons opts]
  (pane-section
   (t :icon/icons-count (count icons))
   icons
   opts))

(hsx/defc all-cp
  [opts]
  (let [used-items (get-used-items)
        emoji-items (take 32 emojis)
        icon-items (take 48 (get-tabler-icons))
        opts (assoc opts :virtual-list? false)]
    [:div.all-pane.pb-10
     (when (count used-items)
       (pane-section (t :ui/frequently-used) used-items opts))
     (pane-section (t :icon/emojis-count (count emojis))
                   emoji-items
                   opts)
     (pane-section (t :icon/icons-count (count (get-tabler-icons)))
                   icon-items
                   opts)]))

(hsx/defc tab-observer
  [tab {:keys [reset-q!]}]
  (hooks/use-effect!
   #(reset-q!)
   [tab])
  nil)

(hsx/defc select-observer
  [*input-ref]
  (let [*el-ref (hooks/use-ref nil)
        *items-ref (hooks/use-ref [])
        *current-ref (hooks/use-ref [-1])
        set-current! (fn [idx node] (set! (. *current-ref -current) [idx node]))
        get-cnt #(some-> (hooks/deref *el-ref) (.closest ".cp__emoji-icon-picker"))
        focus! (fn [idx dir]
                 (let [items (hooks/deref *items-ref)
                       ^js popup (some-> (get-cnt) (.-parentNode))
                       idx (loop [n idx]
                             (if (false? (nth items n nil))
                               (recur (+ n (if (= dir :prev) -1 1))) n))]
                   (if-let [node (nth items idx nil)]
                     (do (.focus node #js {:preventScroll true :focusVisible true})
                         (.scrollIntoView node #js {:block "center"})
                         (when popup (set! (. popup -scrollTop) 0))
                         (set-current! idx node))
                     (do (.focus (hooks/deref *input-ref)) (set-current! -1 nil)))))
        down-handler!
        (hooks/use-callback
         (fn [^js e]
           (if (= 13 (.-keyCode e))
                ;; enter
             (some-> (second (hooks/deref *current-ref)) (.click))
             (let [[idx _node] (hooks/deref *current-ref)]
               (case (.-keyCode e)
                    ;;left
                 37 (focus! (dec idx) :prev)
                    ;; tab & right
                 (9 39) (focus! (inc idx) :next)
                    ;; up
                 38 (do (focus! (- idx 9) :prev) (util/stop e))
                    ;; down
                 40 (do (focus! (+ idx 9) :next) (util/stop e))
                 :dune)))) [])]

    (hooks/use-effect!
     (fn []
        ;; calculate items
       (let [^js sections (.querySelectorAll (get-cnt) ".pane-section")
             items (map #(some-> (.querySelectorAll % ".its > button") (js/Array.from) (js->clj)) sections)
             step 9
             items (map #(let [count (count %)
                               m (mod count step)]
                           (if (> m 0) (concat % (repeat (- step m) false)) %)) items)]
         (set! (. *items-ref -current) (flatten items))
         (focus! 0 :next))

        ;; handlers
       (let [^js cnt (get-cnt)]
         (.addEventListener cnt "keydown" down-handler! false)
         #(.removeEventListener cnt "keydown" down-handler!)))
     [])
    [:span.absolute.hidden {:ref *el-ref}]))

(def ^:private tailwind-color-palette
  [{:label "Red" :base "#EF4444" :shades ["#fecaca" "#fca5a5" "#f87171" "#ef4444" "#dc2626" "#b91c1c" "#991b1b"]}
   {:label "Orange" :base "#F97316" :shades ["#fed7aa" "#fdba74" "#fb923c" "#f97316" "#ea580c" "#c2410c" "#9a3412"]}
   {:label "Amber" :base "#F59E0B" :shades ["#fde68a" "#fcd34d" "#fbbf24" "#f59e0b" "#d97706" "#b45309" "#92400e"]}
   {:label "Yellow" :base "#EAB308" :shades ["#fef08a" "#fde047" "#facc15" "#eab308" "#ca8a04" "#a16207" "#854d0e"]}
   {:label "Lime" :base "#84CC16" :shades ["#d9f99d" "#bef264" "#a3e635" "#84cc16" "#65a30d" "#4d7c0f" "#3f6212"]}
   {:label "Green" :base "#22C55E" :shades ["#bbf7d0" "#86efac" "#4ade80" "#22c55e" "#16a34a" "#15803d" "#166534"]}
   {:label "Emerald" :base "#10B981" :shades ["#a7f3d0" "#6ee7b7" "#34d399" "#10b981" "#059669" "#047857" "#065f46"]}
   {:label "Teal" :base "#14B8A6" :shades ["#99f6e4" "#5eead4" "#2dd4bf" "#14b8a6" "#0d9488" "#0f766e" "#115e59"]}
   {:label "Cyan" :base "#06B6D4" :shades ["#a5f3fc" "#67e8f9" "#22d3ee" "#06b6d4" "#0891b2" "#0e7490" "#155e75"]}
   {:label "Sky" :base "#0EA5E9" :shades ["#bae6fd" "#7dd3fc" "#38bdf8" "#0ea5e9" "#0284c7" "#0369a1" "#075985"]}
   {:label "Blue" :base "#3B82F6" :shades ["#bfdbfe" "#93c5fd" "#60a5fa" "#3b82f6" "#2563eb" "#1d4ed8" "#1e40af"]}
   {:label "Indigo" :base "#6366F1" :shades ["#c7d2fe" "#a5b4fc" "#818cf8" "#6366f1" "#4f46e5" "#4338ca" "#3730a3"]}
   {:label "Violet" :base "#8B5CF6" :shades ["#ddd6fe" "#c4b5fd" "#a78bfa" "#8b5cf6" "#7c3aed" "#6d28d9" "#5b21b6"]}
   {:label "Purple" :base "#A855F7" :shades ["#e9d5ff" "#d8b4fe" "#c084fc" "#a855f7" "#9333ea" "#7e22ce" "#6b21a8"]}
   {:label "Pink" :base "#EC4899" :shades ["#fbcfe8" "#f9a8d4" "#f472b6" "#ec4899" "#db2777" "#be185d" "#9d174d"]}])

(hsx/defc icon-color-picker-content
  [select-color!]
  (let [[selected-color set-selected-color!] (hooks/use-state nil)]
    [:div.color-picker-presets
     [:div.color-picker-families
      (for [{:keys [label base] :as color} tailwind-color-palette]
        (shui/button
         {:on-click #(set-selected-color! color)
          :title label
          :size :sm :variant :outline
          :class (util/classnames ["it" {:active (= selected-color color)}])
          :style {:background-color base}}
         ""))
      (shui/button
       {:on-click #(select-color! nil)
        :size :sm :variant :outline
        :class "it"}
       (shui/tabler-icon "minus" {:class "scale-75 opacity-70"}))]
     (when selected-color
       [:div.color-picker-shades
        (for [[shade color] (map vector [200 300 400 500 600 700 800] (:shades selected-color))]
          (shui/button
           {:on-click #(select-color! color)
            :title (str (:label selected-color) " " shade)
            :size :sm :variant :outline
            :class "it shade"
            :style {:background-color color}}
           ""))])]))

(hsx/defc color-picker
  [*color on-select!]
  (let [[color, set-color!] (hooks/use-state @*color)
        *el (hooks/use-ref nil)
        select-color! (fn [c]
                        (set-color! c)
                        (some-> on-select! (apply [c]))
                        (shui/popup-hide!))
        content-fn (fn []
                     (icon-color-picker-content select-color!))]
    (hooks/use-effect!
     (fn []
       (when-let [^js picker (some-> (hooks/deref *el) (.closest ".cp__emoji-icon-picker"))]
         (let [color (if (string/blank? color) "inherit" color)]
           (.setProperty (.-style picker) "--ls-color-icon-preset" color)
           (storage/set :ls-icon-color-preset color)))
       (reset! *color color))
     [color])

    (shui/button {:size :sm
                  :ref *el
                  :class "color-picker"
                  :on-pointer-down (fn [^js e]
                                     (util/stop e)
                                     (shui/popup-show! (.-target e) content-fn
                                                       {:id :icons-color-picker
                                                        :content-props {:side-offset 6}}))
                  :variant :outline}
                 [:strong {:style {:color (or color "inherit")}}
                  (shui/tabler-icon "palette")])))

(hsx/defc ^:large-vars/cleanup-todo icon-search
  [{:keys [on-chosen del-btn? color-auto-chosen? icon-value] :as opts}]
  (let [[q set-q!] (hooks/use-state "")
        [result set-result!] (hooks/use-state nil)
        [select-mode? set-select-mode?!] (hooks/use-state false)
        [tab set-tab!] (hooks/use-state nil)
        *color (hooks/use-memo #(atom (storage/get :ls-icon-color-preset)) [])
        *input-ref (hooks/use-ref nil)
        *result-ref (hooks/use-ref nil)
        {:keys [tabs default-tab has-icon-tab?]}
        (normalize-tabs (:tabs opts) (:default-tab opts))
        show-tabs? (if (contains? opts :show-tabs?) (:show-tabs? opts) true)
        tab (if (or (nil? tab)
                    (not (some #(= (first %) tab) tabs)))
              default-tab
              tab)
        opts (assoc opts
                    :on-chosen (fn [e m]
                                 (let [icon? (= (:type m) :tabler-icon)
                                       m (if (and icon? (not (string/blank? @*color)))
                                           (assoc m :color @*color) m)]
                                   (and on-chosen (on-chosen e m))
                                   (when (:type m) (add-used-item! m)))))
        reset-q! #(when-let [^js input (hooks/deref *input-ref)]
                    (set-q! "")
                    (set-result! {})
                    (set-select-mode?! false)
                    (set! (. input -value) "")
                    (util/schedule
                     (fn []
                       (when (not= js/document.activeElement input)
                         (.focus input))
                       (util/scroll-to (hooks/deref *result-ref) 0 false))))]
    (hooks/use-effect!
     (fn []
       (when (not= tab default-tab)
         (set-tab! tab)))
     [tab default-tab])
    [:div.cp__emoji-icon-picker
     {:data-keep-selection true}
     ;; header
     [:div.hd.bg-popover
      (tab-observer tab {:reset-q! reset-q!})
      (when select-mode?
        (select-observer *input-ref))
      [:div.search-input
       (shui/tabler-icon "search" {:size 16})
       (shui/input
        {:auto-focus true
         :ref *input-ref
         :placeholder (case tab
                        :emoji (t :icon/search-emojis)
                        :icon (t :icon/search-icons)
                        (t :icon/search-all))
         :default-value ""
         :on-focus #(set-select-mode?! false)
         :on-key-down (fn [^js e]
                        (case (.-keyCode e)
                           ;; esc
                          27 (do (util/stop e)
                                 (if (string/blank? q)
                                  ;(some-> (hooks/deref *input-ref) (.blur))
                                   (shui/popup-hide!)
                                   (reset-q!)))
                          38 (util/stop e)
                          (9 40) (do
                                   (set-select-mode?! true)
                                   (util/stop e))
                          :dune))
         :on-change (debounce
                     (fn [e]
                       (let [q' (util/evalue e)]
                         (set-q! q')
                         (set-select-mode?! false)
                         (if (string/blank? q')
                           (set-result! {})
                           (p/let [result (search q' tab)]
                             (set-result! result)))))
                     200)})
       (when-not (string/blank? q)
         [:a.x {:on-click reset-q!} (shui/tabler-icon "x" {:size 14})])]]
     ;; body
     [:div.bd.bd-scroll
       {:ref *result-ref
       :class (or (some-> tab (name)) "other")}
      [:div.content-pane
       (if (seq result)
         [:div.flex.flex-1.flex-col.gap-1.search-result
          (let [matched (concat (:emojis result) (:icons result))]
            (when (seq matched)
              (pane-section
               (t :icon/matched-count (count matched))
               matched
               opts)))]
         [:div.flex.flex-1.flex-col.gap-1
          (case tab
            :emoji (emojis-cp emojis opts)
            :icon (icons-cp (get-tabler-icons) opts)
            (all-cp opts))])]]

     ;; footer
     (when (or show-tabs? del-btn? (and has-icon-tab? (not= :emoji tab)))
       [:div.ft
        ;; tabs
        [:<>
         (when show-tabs?
            [:div.flex.flex-1.flex-row.items-center.gap-2
            (for [[id label] tabs
                  :let [active? (= tab id)]]
              (shui/button
               {:variant :ghost
                :size :sm
                :class (util/classnames [{:active active?} "tab-item"])
                :on-mouse-down (fn [e]
                                 (util/stop e)
                                 (set-tab! id))}
               label))])

         (when (and show-tabs? has-icon-tab? (not= :emoji tab))
           (color-picker *color (fn [c]
                                  (when (= :tabler-icon (some-> icon-value :type))
                                    (when (not (false? color-auto-chosen?))
                                      (on-chosen nil (assoc icon-value :color c) true))))))

         ;; action buttons
         (when del-btn?
           (shui/button {:variant :outline :size :sm :data-action "del"
                         :on-click #(on-chosen nil)}
                        (shui/tabler-icon "trash" {:size 17})))]])]))

(hsx/defc icon-picker
  [icon-value {:keys [empty-label disabled? initial-open? del-btn? on-chosen icon-props popup-opts button-opts]}]
  (let [*trigger-ref (hooks/use-ref nil)
        content-fn
        (if config/publishing?
          (constantly [])
          (fn [{:keys [id]}]
            (icon-search
             {:on-chosen (fn [e icon-value keep-popup?]
                           (on-chosen e icon-value)
                           (when-not (true? keep-popup?) (shui/popup-hide! id)))
              :icon-value icon-value
              :del-btn? del-btn?})))]
    (hooks/use-effect!
     (fn []
       (when initial-open?
         (js/setTimeout #(some-> (hooks/deref *trigger-ref) (.click)) 32)))
     [initial-open?])

    ;; trigger
    (let [has-icon? (some? icon-value)]
      (shui/button
       (merge
        {:ref *trigger-ref
         :variant :ghost
         :size :sm
         :class (if has-icon? "px-1 leading-none text-muted-foreground hover:text-foreground"
                    "font-normal text-sm px-[0.5px] text-muted-foreground hover:text-foreground")
         :on-click (fn [^js e]
                     (when-not disabled?
                       (shui/popup-show! (.-target e) content-fn
                                         (medley/deep-merge
                                          {:align :start
                                           :id :ls-icon-picker
                                           :content-props {:class "ls-icon-picker"
                                                           :onEscapeKeyDown #(.preventDefault %)}}
                                          popup-opts))))}
        button-opts)
       (if has-icon?
         (if (vector? icon-value)       ; hiccup
           icon-value
           (icon icon-value (merge {:color? true} icon-props)))
         (or empty-label (t :ui/empty)))))))
