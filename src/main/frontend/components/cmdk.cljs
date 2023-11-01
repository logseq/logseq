(ns frontend.components.cmdk
  (:require
    [clojure.string :as string]
    [frontend.components.block :as block]
    [frontend.components.command-palette :as cp]
    [frontend.components.page :as page]
    [frontend.context.i18n :refer [t]]
    [frontend.date :as date]
    [frontend.db :as db]
    [frontend.db.model :as model]
    [frontend.handler.command-palette :as cp-handler]
    [frontend.handler.editor :as editor-handler]
    [frontend.handler.page :as page-handler]
    [frontend.handler.route :as route-handler]
    [frontend.handler.search :as search-handler]
    [frontend.handler.whiteboard :as whiteboard-handler]
    [frontend.modules.shortcut.core :as shortcut]
    [frontend.modules.shortcut.data-helper :as shortcut-helper]
    [frontend.search :as search]
    [frontend.search.db :as search-db]
    [frontend.shui :refer [make-shui-context]]
    [frontend.state :as state]
    [frontend.ui :as ui]
    [frontend.util :as util]
    [frontend.util.page :as page-util]
    [goog.functions :as gfun]
    [logseq.shui.core :as shui]
    [promesa.core :as p]
    [rum.core :as rum]
    [frontend.mixins :as mixins]))

(def GROUP-LIMIT 5)
(def FILTER-ROW-HEIGHT 81)

;; When CMDK opens, we have some default search actions we make avaialbe for quick access
(def default-search-actions
  [{:text "Search only pages"        :info "Add filter to search" :icon-theme :gray :icon "page" :filter {:group :pages}}
   {:text "Search only current page" :info "Add filter to search" :icon-theme :gray :icon "page" :filter {:group :current-page}}
   {:text "Search only blocks"       :info "Add filter to search" :icon-theme :gray :icon "block" :filter {:group :blocks}}
   {:text "Search only whiteboards"  :info "Add filter to search" :icon-theme :gray :icon "whiteboard" :filter {:group :whiteboards}}
   {:text "Search only files"        :info "Add filter to search" :icon-theme :gray :icon "file" :filter {:group :files}}])

(def default-commands
  [{:text "Open settings" :icon "settings"      :icon-theme :gray}
   {:text "Open settings" :icon "settings"      :icon-theme :gray}
   {:text "Open settings" :icon "settings"      :icon-theme :gray}])

;; The results are separated into groups, and loaded/fetched/queried separately
(def default-results
  {:search-actions {:status :success :show :less :items nil}
   :recents        {:status :success :show :less :items nil}
   :commands       {:status :success :show :less :items nil}
   :favorites      {:status :success :show :less :items nil}
   :current-page   {:status :success :show :less :items nil}
   :pages          {:status :success :show :less :items nil}
   :blocks         {:status :success :show :less :items nil}
   :files          {:status :success :show :less :items nil}
   :filters        {:status :success :show :less :items nil}})

(defn lower-case-str [x]
  (.toLowerCase (str x)))

(defn create-items [q]
  (when-not (string/blank? q)
    [{:text "Create page"       :icon "new-page"       :icon-theme :color :shortcut "cmd+shift+P" :info (str "Create page called '" q "'") :source-create :page}
     {:text "Create whiteboard" :icon "new-whiteboard" :icon-theme :color :shortcut "cmd+shift+W" :info (str "Create whiteboard called '" q "'") :source-create :whiteboard}]))

;; Take the results, decide how many items to show, and order the results appropriately
(defn state->results-ordered [state]
  (let [results @(::results state)
        input @(::input state)
        index (volatile! -1)
        visible-items (fn [group]
                        (let [{:keys [items show]} (get results group)]
                          (case show
                            :more items
                            :less (take 5 items)
                            (take 2 items))))
        page-exists? (db/entity [:block/name (string/trim input)])
        order (->>
               [["Filters"        :filters        (visible-items :filters)]
                ["Search actions" :search-actions (visible-items :search-actions)]
                ["Commands"       :commands       (visible-items :commands)]
                ["Pages"          :pages          (visible-items :pages)]
                (when-not page-exists?
                  ["Create"         :create         (create-items input)])
                ["Current page"   :current-page   (visible-items :current-page)]
                ["Whiteboards"    :whiteboards    (visible-items :whiteboards)]
                ["Blocks"         :blocks         (visible-items :blocks)]
                ["Recents"        :recents        (visible-items :recents)]]
               (remove nil?))]
    (for [[group-name group-key group-items] order]
      [group-name
       group-key
       (if (= group-key :create)
         (count group-items)
         (count (get-in results [group-key :items])))
       (mapv #(assoc % :item-index (vswap! index inc)) group-items)])))

(defn state->highlighted-item [state]
  (or (some-> state ::highlighted-item deref)
      (some->> (state->results-ordered state)
               (mapcat last)
               (first))))

(defn state->action [state]
  (let [highlighted-item (state->highlighted-item state)]
    (cond (:source-page highlighted-item) :open
          (:source-block highlighted-item) :open
          (:source-search highlighted-item) :search
          (:source-command highlighted-item) :trigger
          (:source-create highlighted-item) :create
          (:source-adjustment highlighted-item) :filter
          (:source-group highlighted-item) :filter
          :else nil)))

;; Take the ordered results and the highlight index and determine which item is highlighted
; (defn state->highlighted-item
;   ([state] (state->highlighted-item state (state->results-ordered state)))
;   ([state results-ordered]
;    (let [highlight-index @(::highlight-index state)
;          items (mapcat last results-ordered)
;          item-count (count items)
;          normalized-index (cond
;                             (zero? item-count) nil
;                             (<= 0 (mod highlight-index item-count)) (mod highlight-index item-count)
;                             :else (- item-count (mod highlight-index item-count)))]
;        (when normalized-index
;          (nth items normalized-index nil)))))

;; Each result gorup has it's own load-results function
(defmulti load-results (fn [group state] group))

;; Initially we want to load the recents into the results
(defmethod load-results :initial [_ state]
  (let [!results (::results state)
        recent-searches (mapv (fn [q] {:type :search :data q}) (db/get-key-value :recent/search))
        recent-pages (mapv (fn [page] {:type :page :data page}) (db/get-key-value :recent/pages))
        recent-items (->> (concat recent-searches recent-pages)
                          (map #(hash-map :icon (if (= :page (:type %)) "page" "history")
                                          :icon-theme :gray
                                          :text (:data %)
                                          :source-recent %
                                          :source-page (when (= :page (:type %)) (:data %))
                                          :source-search (when (= :search (:type %)) (:data %)))))
        command-items (->> (cp-handler/top-commands 1000)
                           (map #(hash-map :icon "command"
                                           :icon-theme :gray
                                           :text (cp/translate t %)
                                           :shortcut (:shortcut %)
                                           :source-command %)))
        favorite-pages nil
        favorite-items nil]
    (reset! !results (-> default-results (assoc-in [:recents :items] recent-items)
                                         (assoc-in [:commands :items] command-items)
                                         (assoc-in [:favorites :items] favorite-items)))))


;; The search-actions are only loaded when there is no query present. It's like a quick access to filters
(defmethod load-results :search-actions [group state]
  (let [!input (::input state)
        !results (::results state)]
    (if (empty? @!input)
      (swap! !results update group merge {:status :success :items default-search-actions})
      (swap! !results update group merge {:status :success :items nil}))))

;; The commands search uses the command-palette hander
(defmethod load-results :commands [group state]
  (let [!input (::input state)
        !results (::results state)]
    (swap! !results assoc-in [group :status] :loading)
    (if (empty? @!input)
      (swap! !results update group merge {:status :success :items default-commands})
      (->> (cp-handler/top-commands 1000)
           (map #(assoc % :t (cp/translate t %)))
           (filter #(string/includes? (lower-case-str (pr-str %)) (lower-case-str @!input)))
           (map #(hash-map :icon "command"
                           :icon-theme :gray
                           :text (cp/translate t %)
                           :shortcut (:shortcut %)
                           :source-command %))
           (hash-map :status :success :items)
           (swap! !results update group merge)))))

;; The pages search action uses an existing handler
(defmethod load-results :pages [group state]
  (let [!input (::input state)
        !results (::results state)]
    (swap! !results assoc-in [group :status] :loading)
    (swap! !results assoc-in [:whiteboards :status] :loading)
    (p/let [pages (search/page-search @!input)
            whiteboards (filter model/whiteboard-page? pages)
            non-boards (remove model/whiteboard-page? pages)
            whiteboard-items (map #(hash-map :icon "page"
                                             :icon-theme :gray
                                             :text %
                                             :source-page %) whiteboards)
            non-board-items (map #(hash-map :icon "page"
                                            :icon-theme :gray
                                            :text %
                                            :source-page %) non-boards)]
      (swap! !results update group        merge {:status :success :items non-board-items})
      (swap! !results update :whiteboards merge {:status :success :items whiteboard-items}))))

;; The blocks search action uses an existing handler
(defmethod load-results :blocks [group state]
  (let [!input (::input state)
        !results (::results state)
        repo (state/get-current-repo)
        current-page (page-util/get-current-page-id)
        opts {:limit 100}]
    (swap! !results assoc-in [group :status] :loading)
    (swap! !results assoc-in [:current-page :status] :loading)
    (p/let [blocks (search/block-search repo @!input opts)
            blocks (remove nil? blocks)
            items (map (fn [block]
                         (let [id (if (uuid? (:block/uuid block))
                                    (:block/uuid block)
                                    (uuid (:block/uuid block)))]
                           {:icon "block"
                            :icon-theme :gray
                            :text (:block/content block)
                            :header (block/breadcrumb {:search? true} repo id {})
                            :current-page? (some-> block :block/page #{current-page})
                            :source-block block})) blocks)
            items-on-other-pages (remove :current-page? items)
            items-on-current-page (filter :current-page? items)]
      ; (js/console.log "blocks" (clj->js items) current-page)
      ; ; (js/console.log "blocks" (clj->js items)
      ; ;                 (pr-str (map (comp pr-str :block/page) blocks))
      ; ;                 (pr-str (map (comp :block/name :block/page) blocks))
      ; ;                 (pr-str (map (comp :block/name db/entity :block/page) blocks)))
      ; ; (js/console.log "load-results/blocks"
      ; ;                 (clj->js blocks)
      ; ;                 (pr-str (first blocks)))
      (swap! !results update group         merge {:status :success :items items-on-other-pages})
      (swap! !results update :current-page merge {:status :success :items items-on-current-page}))))

; (defmethod load-results :whiteboards [group state]
;   (let [!input (::input state)
;         !results (::results state)
;         repo (state/get-current-repo)]
;     (swap! !results assoc-in [group :status] :loading)
;     (p/let [whiteboards ()])))

(defmethod load-results :files [group state]
  (let [!input (::input state)
        !results (::results state)
        repo (state/get-current-repo)]
    (swap! !results assoc-in [group :status] :loading)
    (p/let [files (search/file-search @!input 99)]
      (js/console.log "load-results/files" (clj->js files)))))

(defmethod load-results :recents [group state]
  (let [!input (::input state)
        !results (::results state)
        recent-searches (mapv (fn [q] {:type :search :data q}) (db/get-key-value :recent/search))
        recent-pages (mapv (fn [page] {:type :page :data page}) (db/get-key-value :recent/pages))]
    (js/console.log "recents" (clj->js recent-searches) (clj->js recent-pages))
    (swap! !results assoc-in [group :status] :loading)
    (let [items (->> (concat recent-searches recent-pages)
                     (filter #(string/includes? (lower-case-str (:data %)) (lower-case-str @!input)))
                     (map #(hash-map :icon (if (= :page (:type %)) "page" "history")
                                     :icon-theme :gray
                                     :text (:data %)
                                     :source-recent %
                                     :source-page (when (= :page (:type %)) (:data %))
                                     :source-search (when (= :search (:type %)) (:data %)))))]
      (swap! !results update group merge {:status :success :items items}))))

(defmethod load-results :filters [group state]
  (let [!input (::input state)
        !results (::results state)
        has-double-colon (string/includes? @!input "::")
        [_ pkey pval] (when has-double-colon (re-matches #"^.*?(\S*)::\s?(\S*)" @!input))
        replace-pkey #(swap! (::input state) string/replace #"\S*::" (str % "::"))
        replace-pval #(swap! (::input state) string/replace #"::\s?(\S*)" (str "::" %))
        items (cond
                (not has-double-colon) []
                (empty? pkey) (->> (search/property-search pval)
                                   (map #(hash-map :icon "search" :icon-theme :gray :text % :source-adjustment (partial replace-pkey %))))
                :else (->> (search/property-value-search pval pkey)
                           (map #(hash-map :icon "search" :icon-theme :gray :text % :source-adjustment (partial replace-pval %)))))
                ; [{:icon "search"
                ;   :icon-theme :gray
                ;   :text "Testing search filters"}]
                ; [])\]]
        items (if-not (and has-double-colon (empty? pkey)) items
                (->> [{:icon "search" :icon-theme :gray :text "Filter commands" :value :filter-commands :source-group :commands}
                      {:icon "search" :icon-theme :gray :text "Filter pages" :value :filter-pages :source-group :pages}
                      {:icon "search" :icon-theme :gray :text "Filter blocks" :value :filter-blocks :source-group :blocks}
                      {:icon "search" :icon-theme :gray :text "Filter whiteboards" :value :filter-whiteboards :source-group :whiteboards}]
                     (filter #(string/includes? (lower-case-str (pr-str %)) (lower-case-str pval)))
                     (into items)))]
    (js/console.log "load-results/filters" #js {:pkey pkey :pval pval})
    (swap! !results update group merge {:status :success :items items})))


;; The default load-results function triggers all the other load-results function
(defmethod load-results :default [_ state]
  (js/console.log "load-results/default" @(::input state))
  (if-not (some-> state ::input deref seq)
    (load-results :initial state)
    (do
      (load-results :search-actions state)
      (load-results :commands state)
      (load-results :blocks state)
      (load-results :pages state)
      (load-results :filters state)
      (load-results :recents state))))

(defn close-unless-alt! [state]
  (when-not (some-> state ::alt? deref)
    (state/close-modal!)))

(defmulti handle-action (fn [action _state _event] action))

(defmethod handle-action :close [_ state event]
  (js/console.log :handle-action/cancel)
  (state/close-modal!))

(defmethod handle-action :copy-page-ref [_ state event]
  (when-let [page-name (some-> state state->highlighted-item :source-page)]
    (util/copy-to-clipboard! page-name)
    (close-unless-alt! state)))

(defmethod handle-action :copy-block-ref [_ state event]
  (when-let [block-uuid (some-> state state->highlighted-item :source-block :block/uuid uuid)]
    (editor-handler/copy-block-ref! block-uuid)
    (close-unless-alt! state)))

(defmethod handle-action :open-page [_ state event]
  (when-let [page-name (some-> state state->highlighted-item :source-page)]
    (route-handler/redirect-to-page! page-name)
    (close-unless-alt! state)))

(defmethod handle-action :open-block [_ state event]
  (let [get-block-page (partial model/get-block-page (state/get-current-repo))]
    (when-let [page (some-> state state->highlighted-item :source-block :block/uuid uuid get-block-page :block/name model/get-redirect-page-name)]
      (route-handler/redirect-to-page! page)
      (close-unless-alt! state))))

(defmethod handle-action :open-page-right [_ state event]
  (when-let [page-uuid (some-> state state->highlighted-item :source-page model/get-page :block/uuid uuid)]
    (js/console.log "oepn-page-right" page-uuid)
    (editor-handler/open-block-in-sidebar! page-uuid)
    (close-unless-alt! state)))

(defmethod handle-action :open-block-right [_ state event]
  (when-let [block-uuid (some-> state state->highlighted-item :source-block :block/uuid uuid)]
    (js/console.log "oepn-block-right" block-uuid)
    (editor-handler/open-block-in-sidebar! block-uuid)
    (close-unless-alt! state)))

(defmethod handle-action :open [_ state event]
  (when-let [item (some-> state state->highlighted-item)]
    (let [shift? @(::shift? state)
          page? (boolean (:source-page item))
          block? (boolean (:source-block item))]
      (cond
        (and shift? block?) (handle-action :open-block-right state event)
        (and shift? page?) (handle-action :open-page-right state event)
        block? (handle-action :open-block state event)
        page? (handle-action :open-page state event)))))

(defmethod handle-action :search [_ state event]
  (when-let [item (some-> state state->highlighted-item)]
    (let [search-query (:source-search item)]
      (reset! (::input state) search-query))))

(defmethod handle-action :trigger [_ state event]
  (when-let [action (some-> state state->highlighted-item :source-command :action)]
    (action)
    (close-unless-alt! state)))

(defmethod handle-action :filter-old [_ state event]
  (let [!filter (::filter state)
        filter (some-> state state->highlighted-item :filter)]
    (if filter
      (reset! !filter filter)
      (reset! !filter nil))))

(defmethod handle-action :create [_ state event]
  (let [item (state->highlighted-item state)
        create-whiteboard? (= :whiteboard (:source-create item))
        create-page? (= :page (:source-create item))
        alt? (some-> state ::alt deref)
        !input (::input state)]
    (cond
      (and create-whiteboard? alt?) (whiteboard-handler/create-new-whiteboard-page! @!input)
      (and create-whiteboard? (not alt?)) (whiteboard-handler/create-new-whiteboard-and-redirect! @!input)
      (and create-page? alt?) (page-handler/create! @!input {:redirect? false})
      (and create-page? (not alt?)) (page-handler/create! @!input {:redirect? true}))
    (close-unless-alt! state)))

(defmethod handle-action :filter [_ state event]
  (let [!filter (::filter state)
        item (some-> state state->highlighted-item)]
    (js/log "TESTING" (clj->js item))
    (when-let [adjustment (:source-adjustment item)]
      (adjustment)
      (load-results :filters state))
    (when-let [group (:source-group item)]
      (swap! !filter assoc :group group))))

(defmethod handle-action :default [_ state event]
  (when-let [action (state->action state)]
    (handle-action action state event)))

(rum/defc result-group < rum/reactive
  [state title group visible-items first-item]
  (let [{:keys [show items]} (some-> state ::results deref group)
        highlighted-item (or @(::highlighted-item state) first-item)
        can-show-less? (< GROUP-LIMIT (count visible-items))
        can-show-more? (< (count visible-items) (count items))
        show-less #(swap! (::results state) assoc-in [group :show] :less)
        show-more #(swap! (::results state) assoc-in [group :show] :more)
        cap-highlighted-item (fn []
                               (js/console.log
                                "testing-capping-the-highlighted-item"
                                (count items)
                                (clj->js (drop GROUP-LIMIT items))
                                (clj->js highlighted-item)
                                (.indexOf items highlighted-item))
                               (when (< (dec GROUP-LIMIT) (.indexOf items highlighted-item))
                                 (reset! (::highlighted-item state) (nth items 4 nil))))]
    [:div {:class "border-b border-gray-06 pb-1 last:border-b-0"}
     [:div {:class "text-xs py-1.5 px-3 flex justify-between items-center gap-2 text-gray-11 bg-gray-02"}
      [:div {:class "font-bold text-gray-11 pl-0.5"} title]
      (when (not= group :create)
        [:div {:class "bg-gray-05 px-1.5 py-px text-gray-12 rounded-full"
               :style {:font-size "0.6rem"}}
         (if (<= 100 (count items))
           (str "99+")
           (count items))])
      [:div {:class "flex-1"}]

      (when (or can-show-more? can-show-less?)
        [:a.fade-link.select-node {:on-click (if (= show :more) show-less show-more)}
         (if (= show :more)
           "Show less"
           "Show more")])]

     [:div
      (for [item visible-items
            :let [highlighted? (= item highlighted-item)]]
        (shui/list-item (assoc item
                               :query (when-not (= group :create) @(::input state))
                               :compact true
                               :rounded false
                               :highlighted highlighted?
                              ;; for some reason, the highlight effect does not always trigger on a
                              ;; boolean value change so manually pass in the dep
                               :on-highlight-dep highlighted-item
                               :on-click (fn [e]
                                           (if highlighted?
                                             (do
                                               (handle-action :default state item)
                                               (when-let [on-click (:on-click item)]
                                                 (on-click e)))
                                             (reset! (::highlighted-item state) item)))
                               :on-mouse-enter (fn [e]
                                                 (when (not highlighted?)
                                                   (reset! (::highlighted-item state) (assoc item :mouse-enter-triggered-highlight true))))
                               :on-highlight (fn [ref]
                                               (reset! (::highlighted-group state) group)
                                               (when (and ref (.-current ref)
                                                          (not (:mouse-enter-triggered-highlight @(::highlighted-item state))))
                                                 (.. ref -current (scrollIntoView #js {:block "center"
                                                                                       :inline "nearest"
                                                                                       :behavior "smooth"})))))
                        (make-shui-context)))]]))

(defn move-highlight [state n]
  (js/console.log "move-highlight" n)
  (let [items (mapcat last (state->results-ordered state))
        highlighted-item (some-> state ::highlighted-item deref (dissoc :mouse-enter-triggered-highlight))
        current-item-index (some->> highlighted-item (.indexOf items))
        next-item-index (some-> (or current-item-index 0) (+ n) (mod (count items)))]
    (if-let [next-highlighted-item (nth items next-item-index nil)]
      (reset! (::highlighted-item state) next-highlighted-item)
      (reset! (::highlighted-item state) nil))))

(defn handle-input-change
  ([state e] (handle-input-change state e (.. e -target -value)))
  ([state _ input]
   (let [!input (::input state)
         !load-results-throttled (::load-results-throttled state)]
     ;; update the input value in the UI
     (reset! !input input)

     ;; ensure that there is a throttled version of the load-results function
     (when-not @!load-results-throttled
       (reset! !load-results-throttled (gfun/throttle load-results 1000)))

     ;; retreive the laod-results function and update all the results
     (when-let [load-results-throttled @!load-results-throttled]
       (load-results-throttled :default state)))))

(defn- keydown-handler
  [state e]
  (let [shift? (.-shiftKey e)
        meta? (.-metaKey e)
        alt? (.-altKey e)
        highlighted-group @(::highlighted-group state)
        show-less (fn [] (swap! (::results state) assoc-in [highlighted-group :show] :less))
        show-more (fn [] (swap! (::results state) assoc-in [highlighted-group :show] :more))]
    (reset! (::shift? state) shift?)
    (reset! (::meta? state) meta?)
    (reset! (::alt? state) alt?)
    (when (get #{"ArrowUp" "ArrowDown" "ArrowLeft" "ArrowRight"} (.-key e))
      (.preventDefault e))
    (case (.-key e)
      "ArrowDown"   (if meta?
                      (show-more)
                      (move-highlight state 1))
      "ArrowUp"     (if meta?
                      (show-less)
                      (move-highlight state -1))
      "Enter"       (handle-action :default state e)
      "Escape"      (when (seq @(::input state))
                      (.preventDefault e)
                      (.stopPropagation e)
                      (handle-input-change state nil ""))
      nil)))

(defn keyup-handler
  [state e]
  (let [shift? (.-shiftKey e)
        meta? (.-metaKey e)
        alt? (.-altKey e)]
    (reset! (::shift? state) shift?)
    (reset! (::alt? state) alt?)
    (reset! (::meta? state) meta?)))

(defn print-group-name [group]
  (case group
    :current-page "Current page"
    :blocks "Blocks"
    :pages "Pages"
    :whiteboards "Whiteboards"
    :commands "Commands"
    :recents "Recents"
    (string/capitalize (name group))))

(rum/defc filter-row [state filter]
  [:div {:class "pt-3 border-b flex flex-col gap-2 bg-gray-02 border-gray-07"
         :style {:height (- FILTER-ROW-HEIGHT 4)}}
   [:div {:class "text-xs font-bold px-6"} "Filters"]
   [:div {:class "flex items-center gap-2 overflow-x-auto pb-3"}
    [:div {:class "w-4 h-1 shrink-0"}]
    (for [group [:recents :commands :pages :whiteboards :blocks]]
      (if (or (nil? (:group filter)) (= (:group filter) group))
        [:div {:class "text-xs py-0.5 px-1.5 rounded bg-gray-07 hover:bg-gray-08 hover:cursor-pointer shrink-0"
               :on-click (if (= (:group filter) group)
                           #(swap! (::filter state) dissoc :group)
                           #(swap! (::filter state) assoc :group group))}
          (print-group-name group)]
        [:div {:class "text-xs py-0.5 px-1.5 rounded bg-gray-06 hover:bg-gray-07 opacity-50 hover:opacity-75 hover:cursor-pointer shrink-0"
               :on-click #(swap! (::filter state) assoc :group group)}
          (print-group-name group)]))
    [:div {:class "w-2 h-1 shrink-0"}]]])

(rum/defc input-row
  [state all-items]
  (let [highlighted-item @(::highlighted-item state)
        input @(::input state)
        input-ref (::input-ref state)]
    ;; use-effect [results-ordered input] to check whether the highlighted item is still in the results,
    ;; if not then clear that puppy out!
    ;; This was moved to a fucntional component
    (rum/use-effect! (fn []
                       (when (and highlighted-item (= -1 (.indexOf all-items (dissoc highlighted-item :mouse-enter-triggered-highlight))))
                         (reset! (::highlighted-item state) nil)))
                     [all-items])
    (rum/use-effect! (fn []
                       (load-results :default state))
                     [])
    (rum/use-effect! (fn []
                       (js/setTimeout #(when (some-> input-ref deref) (.focus @input-ref)) 0))
                     [])
    [:div {:class ""
           :style {:background "var(--lx-gray-02)"
                   :border-bottom "1px solid var(--lx-gray-07)"}}
     [:input {:class "text-xl bg-transparent border-none w-full outline-none px-4 py-3"
              :placeholder "What are you looking for?"
              :ref #(when-not @input-ref (reset! input-ref %))
              :on-change (partial handle-input-change state)
              :value input}]]))

(rum/defc input-row-sidebar
  [state all-items]
  (let [highlighted-item @(::highlighted-item state)
        input @(::input state)
        input-ref (::input-ref state)]
    ;; use-effect [results-ordered input] to check whether the highlighted item is still in the results,
    ;; if not then clear that puppy out!
    ;; This was moved to a fucntional component
    (rum/use-effect! (fn []
                       (when (= -1 (.indexOf all-items highlighted-item))
                         (reset! (::highlighted-item state) nil)))
                     [all-items])
    (rum/use-effect! (fn []
                       (load-results :default state))
                     [])
    (rum/use-effect! (fn []
                       (js/setTimeout #(when (some-> input-ref deref) (.focus @input-ref)) 0))
                     [])
    [:div {:class "bg-gray-04 text-white flex items-center px-2 gap-2"}
     (ui/rotating-arrow false)
     (shui/icon "search" {:class "text-gray-12"})
     [:input {:class "text-base bg-transparent border-none w-full outline-none py-2"
              :placeholder "What are you looking for?"
              :ref #(reset! input-ref %)
              :on-change (partial handle-input-change state)
              :value input}]
     (shui/icon "x" {:class "text-gray-11"})]))

(defn render-action-button [state highlighted-item]
  (let [shift? @(::shift? state)
        alt? @(::alt? state)
        action (state->action state)
        text (->> [(case action :open "Open" :search "Search" :trigger "Trigger" :create "Create" :filter "Filter" nil)
                   (when (and shift? (= :open action)) "in sidebar")
                   (when alt? "(keep open)")]
                  (remove nil?)
                  (string/join " "))
        theme (case action :create :color :gray)]
    (when action
      (shui/button {:text text
                    :theme theme
                    :on-click #(handle-action action state %)
                    :shortcut ["return"]}
                   (make-shui-context)))))

(rum/defcs cmdk <
  shortcut/disable-all-shortcuts
  rum/reactive
  (mixins/event-mixin
   (fn [state]
     (mixins/on-key-down state {}
                         {:all-handler (fn [e _key]
                                         (keydown-handler state e))})
     (mixins/on-key-up state {}
                       {:all-handler (fn [e _key]
                                       (keyup-handler state e))})))
  (rum/local "" ::input)
  (rum/local false ::shift?)
  (rum/local false ::meta?)
  (rum/local false ::alt?)
  (rum/local nil ::highlighted-group)
  (rum/local nil ::highlighted-item)
  (rum/local nil ::keydown-handler)
  (rum/local nil ::keyup-handler)
  (rum/local nil ::filter)
  (rum/local default-results ::results)
  (rum/local nil ::load-results-throttled)
  (rum/local [:close :filter] ::actions)
  (rum/local nil ::scroll-container-ref)
  (rum/local nil ::input-ref)
  (rum/local false ::resizing?)
  {:did-mount (fn [state]
                ; (search-db/make-blocks-indice-non-blocking! (state/get-current-repo))
                ; (when-let [ref @(::scroll-container-ref state)]
                ;   (js/console.log "scrolling")
                ;   (js/setTimeout #(set! (.-scrollTop ref) FILTER-ROW-HEIGHT)))
                state)}
                  ; (load-results :initial state)))}
  [state {:keys [sidebar?]}]
  (let [input @(::input state)
        actions @(::actions state)
        ; highlight-index @(::highlight-index state)
        filter (not-empty @(::filter state))
        group-filter (:group filter)
        results-ordered (state->results-ordered state)
        all-items (mapcat last results-ordered)
        first-item (first all-items)
        highlighted-item (or @(::highlighted-item state) first-item)
        shift? @(::shift? state)
        alt? @(::alt? state)
        dark? (= "dark" (state/sub :ui/theme))]
    ; (rum/use-effect! #(load-results :initial state) [])
    [:div.cp__cmdk {:class (cond-> "w-full h-full relative flex flex-col justify-start"
                             (not sidebar?) (str " border border-gray-06 rounded-lg overflow-hidden"))}
     (if sidebar?
       (input-row-sidebar state all-items)
       (input-row state all-items))
     [:div {:class (cond-> "w-full flex-1 overflow-y-auto max-h-[65dvh]"
                     (not sidebar?) (str " pb-14"))
            :ref #(when % (some-> state ::scroll-container-ref (reset! %)))
            :style {:background "var(--lx-gray-02)"}}
      (when filter
        (filter-row state filter))
      (for [[group-name group-key group-count group-items] results-ordered
            :when (not= 0 group-count)
            :when (if-not group-filter true (= group-filter group-key))]
        (result-group state group-name group-key group-items first-item))]
     [:div {:class "absolute right-4 bottom-4 shadow-gray-02 rounded"
            :style {:box-shadow (if dark?
                                  (str "0px 0px 9.7px rgba(8, 9, 10, 0.8), "
                                       "0px 0px 23.3px rgba(8, 9, 10, 0.575), "
                                       "0px 0px 43.8px rgba(8, 9, 10, 0.477), "
                                       "0px 0px 78.2px rgba(8, 9, 10, 0.4), "
                                       "0px 0px 146.2px rgba(8, 9, 10, 0.323), "
                                       "0px 0px 350px rgba(8, 9, 10, 0.255) ")
                                  (str "0px 0px 9.7px 12px rgba(248,249,250, 1), "
                                       "0px 0px 23.3px 12px rgba(248,249,250, 0.75), "
                                       "0px 0px 43.8px 12px rgba(248,249,250, 0.6), "
                                       "0px 0px 78.2px 12px rgba(248,249,250, 0.5), "
                                       "0px 0px 146.2px 12px rgba(248,249,250, 0.4), "
                                       "0px 0px 350px 12px rgba(248,249,250, 0.35), "
                                       "0px 0px 0.5px 0.5px rgba(0,0,0,0.5)"))}}
                                  ; (str "0px 0px 9.7px rgba(0, 0, 0, 0.3), "
                                  ;    "0px 0px 23.3px rgba(0, 0, 0, 0.21), "
                                  ;    "0px 0px 43.8px rgba(0, 0, 0, 0.18), "
                                  ;    "0px 0px 78.2px rgba(0, 0, 0, 0.15), "
                                  ;    "0px 0px 146.2px rgba(0, 0, 0, 0.12), "
                                  ;    "0px 0px 350px rgba(0, 0, 0, 0.9) "))}}
      (render-action-button state highlighted-item)]]))

(rum/defc cmdk-modal [props]
  [:div {:class "cp__cmdk__modal rounded-lg max-h-[75dvh] w-[90dvw] max-w-4xl shadow-xl relative"}
   (cmdk props)
   (ui/icon "x" {:class "absolute -right-[0.6rem] -top-[0.6rem] text-gray-11 hover:text-gray-12 cursor-pointer bg-gray-06 rounded-full p-1 text-sm hover:shadow-lg hover:scale-110 transition-all ease-in duration-100"
                 :size "16"
                 :on-click #(state/close-modal!)})])

(rum/defc cmdk-block [props]
  [:div {:class "cp__cmdk__block rounded-md overflow-hidden"}
   (cmdk props)])
