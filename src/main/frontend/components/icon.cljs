(ns frontend.components.icon
  (:require ["@emoji-mart/data" :as emoji-data]
            ["react" :as react]
            ["@tabler/icons-react" :as tabler-icons]
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
            [logseq.common.util :as common-util]
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
    (let [result (->> (keys (bean/->clj tabler-icons))
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
     {:key (str "tabler-icon-" icon')
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
    {:key (str "emoji-" id)
     :tabIndex "0"
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

(defn- item-render-key
  [item idx]
  (str (cond
         (string? item) "tabler-icon"
         (:type item) (name (:type item))
         :else "item")
       "-"
       (or (:id item) item idx)))

(defn- keyed-item-render
  [idx item opts]
  (react/cloneElement
   (item-render item opts)
   #js {:key (item-render-key item idx)}))

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
       (let [items-per-row 9
             rows (vec (partition-all items-per-row items))]
          (ui/virtualized-list
           (cond-> {:total-count (count rows)
                    :item-content (fn [idx]
                                    (icons-row
                                     (map-indexed
                                      (fn [item-idx item]
                                        (keyed-item-render item-idx item opts))
                                      (nth rows idx []))))}

             searching?
             (assoc :custom-scroll-parent (some-> (hooks/deref *el-ref) (.closest ".bd-scroll"))))))
       [:div.its
        (map-indexed (fn [idx item]
                       (keyed-item-render idx item opts))
                     items)])]))

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
                   (common-util/distinct-by #(str (:type %) ":" (:id %)))
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
     (when (seq used-items)
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

(hsx/defc color-picker
  [*color on-select!]
  (let [[color, set-color!] (hooks/use-state @*color)
        [open? set-open!] (hooks/use-state false)
        *el (hooks/use-ref nil)
        content-fn (fn []
                     (let [colors ["#6e7b8b" "#5e69d2" "#00b5ed" "#00b55b"
                                   "#f2be00" "#e47a00" "#f38e81" "#fb434c" nil]]
                       [:div.color-picker-presets.p-2
                        (for [c colors]
                          (shui/button
                           {:on-click (fn [] (set-color! c)
                                        (some-> on-select! (apply [c]))
                                        (set-open! false))
                            :size :sm :variant :outline
                            :class "it" :style {:background-color c}}
                           (if c "" (shui/tabler-icon "minus" {:class "scale-75 opacity-70"}))))]))]
    (hooks/use-effect!
     (fn []
       (when-let [^js picker (some-> (hooks/deref *el) (.closest ".cp__emoji-icon-picker"))]
         (let [color (if (string/blank? color) "inherit" color)]
           (.setProperty (.-style picker) "--ls-color-icon-preset" color)
           (storage/set :ls-icon-color-preset color)))
       (reset! *color color))
     [color])

    (shui/popover
      {:open open?
       :onOpenChange (fn [a] (set-open! a))}
      (shui/popover-trigger
        (shui/button {:size :sm
                      :ref *el
                      :class "color-picker"
                      :variant :outline}
          [:strong {:style {:color (or color "inherit")}}
           (shui/tabler-icon "palette")]))
      (shui/popover-content
        {:id :icons-color-picker}
        (content-fn)))))

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
                       (shui/popup-show! (.-currentTarget e) content-fn
                                         (medley/deep-merge
                                          {:align :start
                                           :id :ls-icon-picker
                                           :force-popover? true
                                           :content-props {:class "ls-icon-picker"
                                                           :onEscapeKeyDown #(.preventDefault %)}}
                                          popup-opts))))}
        button-opts)
       (if has-icon?
         (if (vector? icon-value)       ; hiccup
           icon-value
           (icon icon-value (merge {:color? true} icon-props)))
         (or empty-label (t :ui/empty)))))))
