(ns frontend.components.icon
  (:require ["@emoji-mart/data" :as emoji-data]
            ["emoji-mart" :refer [SearchIndex]]
            [camel-snake-kebab.core :as csk]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.handler.property.util :as pu]
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
            [rum.core :as rum]))

(defonce emojis (vals (bean/->clj (gobj/get emoji-data "emojis"))))

(defn icon
  [icon' & [opts]]
  (let [icon' (if (or (string? icon') (keyword? icon'))
                {:type :tabler-icon :id (name icon')} icon')
        color? (:color? opts)
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
      item)))

(defn get-node-icon
  [node-entity {:keys [ignore-current-icon?]
                :or {ignore-current-icon? false}}]
  (or (when-not ignore-current-icon?
        (get node-entity (pu/get-pid :logseq.property/icon)))
      (let [asset-type (:logseq.property.asset/type node-entity)
            first-tag-icon (some :logseq.property/icon (sort-by :db/id (:block/tags node-entity)))]
        (cond
          (ldb/class? node-entity)
          "hash"
          (ldb/property? node-entity)
          "letter-p"
          (ldb/whiteboard? node-entity)
          "writing"
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
        node-icon* (if (:link? opts)
                     "arrow-narrow-right"
                     (get-node-icon node-entity opts))
        node-icon (if (config/db-based-graph?)
                    node-icon*
                    (or (when-let [icon' (get-in node-entity [:block/properties :icon])]
                          [:span icon'])
                        node-icon*))]
    (when-not (or (string/blank? node-icon) (and (contains? #{"point-filled" "letter-p" "hash" "file"} node-icon) (:not-text-or-page? opts)))
      [:div.icon-cp-container.flex.items-center
       (merge {:style {:color (or (:color node-icon) "inherit")}}
              (select-keys opts [:class]))
       (icon node-icon opts')])))

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

(rum/defc icons-row
  [items]
  [:div.its.icons-row items])

(rum/defc icon-cp < rum/static
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

(rum/defc emoji-cp < rum/static
  [{:keys [id name] :as emoji} {:keys [on-chosen hover]}]
  [:button.text-2xl.w-9.h-9.transition-opacity
   (cond->
    {:tabIndex "0"
     :title name
     :on-click (fn [e]
                 (on-chosen e (assoc emoji :type :emoji)))}
     (not (nil? hover))
     (assoc :on-mouse-over #(reset! hover emoji)
            :on-mouse-out #()))
   [:em-emoji {:id id
               :style {:line-height 1}}]])

(defn item-render
  [item opts]
  (if (or (string? item)
          (= :tabler-icon (:type item)))
    (icon-cp (if (string? item) item (:id item)) opts)
    (emoji-cp item opts)))

(rum/defc pane-section
  [label items & {:keys [searching? virtual-list?]
                  :or {virtual-list? true}
                  :as opts}]
  (let [*el-ref (rum/use-ref nil)]
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
            (assoc :custom-scroll-parent (some-> (rum/deref *el-ref) (.closest ".bd-scroll"))))))
       [:div.its
        (map #(item-render % opts) items)])]))

(rum/defc emojis-cp < rum/static
  [emojis* opts]
  (pane-section
   (util/format "Emojis (%s)" (count emojis*))
   emojis*
   opts))

(rum/defc icons-cp < rum/static
  [icons opts]
  (pane-section
   (util/format "Icons (%s)" (count icons))
   icons
   opts))

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

(rum/defc all-cp
  [opts]
  (let [used-items (get-used-items)
        emoji-items (take 32 emojis)
        icon-items (take 48 (get-tabler-icons))
        opts (assoc opts :virtual-list? false)]
    [:div.all-pane.pb-10
     (when (count used-items)
       (pane-section "Frequently used" used-items opts))
     (pane-section (util/format "Emojis (%s)" (count emojis))
                   emoji-items
                   opts)
     (pane-section (util/format "Icons (%s)" (count (get-tabler-icons)))
                   icon-items
                   opts)]))

(rum/defc tab-observer
  [tab {:keys [reset-q!]}]
  (hooks/use-effect!
   #(reset-q!)
   [tab])
  nil)

(rum/defc select-observer
  [*input-ref]
  (let [*el-ref (rum/use-ref nil)
        *items-ref (rum/use-ref [])
        *current-ref (rum/use-ref [-1])
        set-current! (fn [idx node] (set! (. *current-ref -current) [idx node]))
        get-cnt #(some-> (rum/deref *el-ref) (.closest ".cp__emoji-icon-picker"))
        focus! (fn [idx dir]
                 (let [items (rum/deref *items-ref)
                       ^js popup (some-> (get-cnt) (.-parentNode))
                       idx (loop [n idx]
                             (if (false? (nth items n nil))
                               (recur (+ n (if (= dir :prev) -1 1))) n))]
                   (if-let [node (nth items idx nil)]
                     (do (.focus node #js {:preventScroll true :focusVisible true})
                         (.scrollIntoView node #js {:block "center"})
                         (when popup (set! (. popup -scrollTop) 0))
                         (set-current! idx node))
                     (do (.focus (rum/deref *input-ref)) (set-current! -1 nil)))))
        down-handler!
        (hooks/use-callback
         (fn [^js e]
           (let []
             (if (= 13 (.-keyCode e))
                ;; enter
               (some-> (second (rum/deref *current-ref)) (.click))
               (let [[idx _node] (rum/deref *current-ref)]
                 (case (.-keyCode e)
                    ;;left
                   37 (focus! (dec idx) :prev)
                    ;; tab & right
                   (9 39) (focus! (inc idx) :next)
                    ;; up
                   38 (do (focus! (- idx 9) :prev) (util/stop e))
                    ;; down
                   40 (do (focus! (+ idx 9) :next) (util/stop e))
                   :dune))))) [])]

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

(rum/defc color-picker
  [*color on-select!]
  (let [[color, set-color!] (rum/use-state @*color)
        *el (rum/use-ref nil)
        content-fn (fn []
                     (let [colors ["#6e7b8b" "#5e69d2" "#00b5ed" "#00b55b"
                                   "#f2be00" "#e47a00" "#f38e81" "#fb434c" nil]]
                       [:div.color-picker-presets
                        (for [c colors]
                          (shui/button
                           {:on-click (fn [] (set-color! c)
                                        (some-> on-select! (apply [c]))
                                        (shui/popup-hide!))
                            :size :sm :variant :outline
                            :class "it" :style {:background-color c}}
                           (if c "" (shui/tabler-icon "minus" {:class "scale-75 opacity-70"}))))]))]
    (hooks/use-effect!
     (fn []
       (when-let [^js picker (some-> (rum/deref *el) (.closest ".cp__emoji-icon-picker"))]
         (let [color (if (string/blank? color) "inherit" color)]
           (.setProperty (.-style picker) "--ls-color-icon-preset" color)
           (storage/set :ls-icon-color-preset color)))
       (reset! *color color))
     [color])

    (shui/button {:size :sm
                  :ref *el
                  :class "color-picker"
                  :on-click (fn [^js e] (shui/popup-show! (.-target e) content-fn {:content-props {:side-offset 6}}))
                  :variant :outline}
                 [:strong {:style {:color (or color "inherit")}}
                  (shui/tabler-icon "palette")])))

(rum/defcs ^:large-vars/cleanup-todo icon-search <
  (rum/local "" ::q)
  (rum/local nil ::result)
  (rum/local false ::select-mode?)
  (rum/local :all ::tab)
  {:init (fn [s]
           (assoc s ::color (atom (storage/get :ls-icon-color-preset))))}
  [state {:keys [on-chosen del-btn? icon-value] :as opts}]
  (let [*q (::q state)
        *result (::result state)
        *tab (::tab state)
        *color (::color state)
        *input-ref (rum/create-ref)
        *result-ref (rum/create-ref)
        result @*result
        opts (assoc opts
                    :on-chosen (fn [e m]
                                 (let [icon? (= (:type m) :tabler-icon)
                                       m (if (and icon? (not (string/blank? @*color)))
                                           (assoc m :color @*color) m)]
                                   (and on-chosen (on-chosen e m))
                                   (when (:type m) (add-used-item! m)))))
        *select-mode? (::select-mode? state)
        reset-q! #(when-let [^js input (rum/deref *input-ref)]
                    (reset! *q "")
                    (reset! *result {})
                    (reset! *select-mode? false)
                    (set! (. input -value) "")
                    (util/schedule
                     (fn []
                       (when (not= js/document.activeElement input)
                         (.focus input))
                       (util/scroll-to (rum/deref *result-ref) 0 false))))]
    [:div.cp__emoji-icon-picker
     {:data-keep-selection true}
     ;; header
     [:div.hd.bg-popover
      (tab-observer @*tab {:reset-q! reset-q!})
      (when @*select-mode?
        (select-observer *input-ref))
      [:div.search-input
       (shui/tabler-icon "search" {:size 16})
       [(shui/input
         {:auto-focus true
          :ref *input-ref
          :placeholder (util/format "Search %s items" (string/lower-case (name @*tab)))
          :default-value ""
          :on-focus #(reset! *select-mode? false)
          :on-key-down (fn [^js e]
                         (case (.-keyCode e)
                            ;; esc
                           27 (do (util/stop e)
                                  (if (string/blank? @*q)
                                   ;(some-> (rum/deref *input-ref) (.blur))
                                    (shui/popup-hide!)
                                    (reset-q!)))
                           38 (do (util/stop e))
                           (9 40) (do
                                    (reset! *select-mode? true)
                                    (util/stop e))
                           :dune))
          :on-change (debounce
                      (fn [e]
                        (reset! *q (util/evalue e))
                        (reset! *select-mode? false)
                        (if (string/blank? @*q)
                          (reset! *result {})
                          (p/let [result (search @*q @*tab)]
                            (reset! *result result))))
                      200)})]
       (when-not (string/blank? @*q)
         [:a.x {:on-click reset-q!} (shui/tabler-icon "x" {:size 14})])]]
     ;; body
     [:div.bd.bd-scroll
      {:ref *result-ref
       :class (or (some-> @*tab (name)) "other")}
      [:div.content-pane
       (if (seq result)
         [:div.flex.flex-1.flex-col.gap-1.search-result
          (let [matched (concat (:emojis result) (:icons result))]
            (when (seq matched)
              (pane-section
               (util/format "Matched (%s)" (count matched))
               matched
               opts)))]
         [:div.flex.flex-1.flex-col.gap-1
          (case @*tab
            :emoji (emojis-cp emojis opts)
            :icon (icons-cp (get-tabler-icons) opts)
            (all-cp opts))])]]

     ;; footer
     [:div.ft
      ;; tabs
      [:<>
       [:div.flex.flex-1.flex-row.items-center.gap-2
        (let [tabs [[:all "All"] [:emoji "Emojis"] [:icon "Icons"]]]
          (for [[id label] tabs
                :let [active? (= @*tab id)]]
            (shui/button
             {:variant :ghost
              :size :sm
              :class (util/classnames [{:active active?} "tab-item"])
              :on-mouse-down (fn [e]
                               (util/stop e)
                               (reset! *tab id))}
             label)))]

       (when (not= :emoji @*tab)
         (color-picker *color (fn [c]
                                (when (= :tabler-icon (some-> icon-value :type))
                                  (on-chosen nil (assoc icon-value :color c) true)))))

       ;; action buttons
       (when del-btn?
         (shui/button {:variant :outline :size :sm :data-action "del"
                       :on-click #(on-chosen nil)}
                      (shui/tabler-icon "trash" {:size 17})))]]]))

(rum/defc icon-picker
  [icon-value {:keys [empty-label disabled? initial-open? del-btn? on-chosen icon-props popup-opts button-opts]}]
  (let [*trigger-ref (rum/use-ref nil)
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
         (js/setTimeout #(some-> (rum/deref *trigger-ref) (.click)) 32)))
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
         (or empty-label "Empty"))))))
