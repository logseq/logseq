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
    [rum.core :as rum]))

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
  {:search-actions {:status :success :show-more false :items nil} 
   :recents        {:status :success :show-more false :items nil}
   :commands       {:status :success :show-more false :items nil}
   :favorites      {:status :success :show-more false :items nil}
   :current-page   {:status :success :show-more false :items nil}
   :pages          {:status :success :show-more false :items nil}
   :blocks         {:status :success :show-more false :items nil} 
   :files          {:status :success :show-more false :items nil}})        

(defn lower-case-str [x]
  (.toLowerCase (str x)))

(defn create-items [q]
  (if-not (seq q)
    []
    [{:text "Create page"       :icon "new-page"       :icon-theme :color :shortcut "cmd+shift+P" :info (str "Create page called '" q "'") :source-create :page} 
     {:text "Create whiteboard" :icon "new-whiteboard" :icon-theme :color :shortcut "cmd+shift+W" :info (str "Create whiteboard called '" q "'") :source-create :whiteboard}]))

;; Take the results, decide how many items to show, and order the results appropriately
(defn state->results-ordered [state]
  (let [results @(::results state)
        input @(::input state)
        index (volatile! -1)
        visible-items (fn [group] 
                        (let [{:keys [items show-more]} (get results group)]
                          (if show-more items (take 5 items))))
        results [["Filters"        :filters        (visible-items :filters)]
                 ["Recents"        :recents        (visible-items :recents)]
                 ["Search actions" :search-actions (visible-items :search-actions)]
                 ["Current page"   :current-page   (visible-items :current-page)]
                 ["Commands"       :commands       (visible-items :commands)]
                 ["Pages"          :pages          (visible-items :pages)]
                 ["Whiteboards"    :whiteboards    (visible-items :whiteboards)]
                 ["Blocks"         :blocks         (visible-items :blocks)]
                 ["Create"         :create         (create-items input)]]]
    ; results
    (for [[group-name group-key group-items] results]
      [group-name group-key (mapv #(assoc % :item-index (vswap! index inc)) group-items)])))

(defn state->highlighted-item [state]
  (or (some-> state ::highlighted-item deref)
      (some->> (state->results-ordered state)
               (mapcat last)
               (first))))

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
                                           :value-label (pr-str (:id %))
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
      (swap! !results assoc group {:status :success :items default-search-actions})
      (swap! !results assoc group {:status :success :items nil}))))

;; The commands search uses the command-palette hander
(defmethod load-results :commands [group state]
  (let [!input (::input state)
        !results (::results state)]
    (swap! !results assoc-in [group :status] :loading)
    (if (empty? @!input)
      (swap! !results assoc group {:status :success :items default-commands})
      (->> (cp-handler/top-commands 1000)
           (map #(assoc % :t (cp/translate t %)))
           (filter #(string/includes? (lower-case-str (pr-str %)) (lower-case-str @!input)))
           (map #(hash-map :icon "command" 
                           :icon-theme :gray 
                           :text (cp/translate t %)
                           :value-label (pr-str (:id %))
                           ; :info (pr-str (:id %))
                           ; :info (:desc %) 
                           :shortcut (:shortcut %)
                           :source-command %))
           (hash-map :status :success :items)
           (swap! !results assoc group))))) 

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
      (swap! !results assoc group {:status :success :items non-board-items}
      ; (swap! !results assoc :whiteboards {:status :success :items whiteboard-items}
                            :whiteboards {:status :success :items whiteboard-items}))))

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
            items (map #(hash-map :icon "block" 
                                  :icon-theme :gray 
                                  :text (:block/content %) 
                                  :header (some-> % :block/page db/entity :block/name)
                                  :current-page? (some-> % :block/page #{current-page})
                                  :source-block %) blocks)
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
      (swap! !results assoc group {:status :success :items items-on-other-pages}
                            :current-page {:status :success :items items-on-current-page}))))

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
                                     ; :header (when-let [page-name])
                                     :text (:data %)
                                     :source-recent %
                                     :source-page (when (= :page (:type %)) (:data %))
                                     :source-search (when (= :search (:type %)) (:data %)))))]
      (swap! !results assoc group {:status :success :items items}))))
      
    ; (swap! !results assoc group {:status :success :items recent-items})))

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
    (swap! !results assoc group {:status :success :items items})))

(let [[_ pkey pval] (re-matches #".*?(\S*)::\s?(\S*)" " testing for a ::val")]
  [pkey pval])

(string/includes? "adufghwrjg" "")

; (search/property-search "a")

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
      ; (load-results :files state)
      (load-results :recents state))))
      ; ; (load-results :whiteboards state)

; (def search [query]
;   (load-results :search-actions state))
  ; (let [repo (state/get-current-repo)
  ;       limit 5
  ;       current-page-db-id nil 
  ;       opts {:limit limit}]
  ;   (p/let [blocks (search/block-search repo q opts)
  ;           pages (search/page-search q)
  ;           pages-content (when current-page-db-id (search/page-content-search repo q opts))
  ;           files (search/file-search q)
  ;           commands])))

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
  (js/console.log "open" (some-> state state->highlighted-item clj->js))
  (when-let [item (some-> state state->highlighted-item)]
    (let [shift? @(::shift? state)
          page? (boolean (:source-page item))
          block? (boolean (:source-block item))
          search? (boolean (:source-search item))]
      (js/console.log "open" page? block? search? shift?)
      (cond 
        (and shift? block?) (handle-action :open-block-right state event)
        (and shift? page?) (handle-action :open-page-right state event)
        search? (js/alert "TODO: implement search autofill")
        block? (handle-action :open-block state event)
        page? (handle-action :open-page state event)))))

(defmethod handle-action :trigger [_ state event]
  (when-let [action (some-> state state->highlighted-item :source-command :action)]
    (action)
    (close-unless-alt! state)))

(defmethod handle-action :filter [_ state event]
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

(defmethod handle-action :testing [_ state event]
  (let [!filter (::filter state)
        item (some-> state state->highlighted-item)]
    (js/log "TESTING" (clj->js item))
    (when-let [adjustment (:source-adjustment item)]
      (adjustment)
      (load-results :filters state))
    (when-let [group (:source-group item)]
      (swap! !filter assoc :group group))))

(rum/defc result-group < rum/reactive 
  [state title group visible-items first-item]
  (let [{:keys [show-more items]} (some-> state ::results deref group) 
        toggle-show-more #(swap! (::results state) update-in [group :show-more] not)
        highlighted-item (or @(::highlighted-item state) first-item)
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
     [:div {:class "text-xs py-1.5 px-6 flex justify-between items-center gap-2 text-gray-11 bg-gray-02"} 
      [:div {:class "font-bold text-gray-11"} title]
      (when (not= group :create)
       [:div {:class "bg-gray-05 px-1.5 py-px text-gray-12 rounded-full"
              :style {:font-size "0.6rem"}}
        (if (<= 100 (count items))
          (str "99+")
          (count items))])
      [:div {:class "flex-1"}]
      (cond 
        (<= (count items) GROUP-LIMIT) [:div]
        show-more [:div {:class "hover:cursor-pointer" :on-click (fn [] (cap-highlighted-item) (toggle-show-more))} "Show less"]
        :else [:div {:class "hover:cursor-pointer" :on-click (fn [] (toggle-show-more))} "Show more"])]

     [:div {:class ""}
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
                                              (when-let [action (some-> state ::actions deref last)]
                                                (handle-action action state item))
                                              (when-let [on-click (:on-click item)]
                                                (on-click e)))
                                            (reset! (::highlighted-item state) item)))
                              :on-highlight (fn [ref]  
                                              (when (and ref (.-current ref) (< 2 (:item-index item)))
                                                (.. ref -current (scrollIntoView #js {:block "center" 
                                                                                      :inline "nearest"
                                                                                      :behavior "smooth"}))) 
                                              (case group 
                                                :search-actions (reset! (::actions state) [:close :filter])
                                                :filters        (reset! (::actions state) [:testing])
                                                :commands       (reset! (::actions state) [:close :trigger])
                                                :pages          (reset! (::actions state) [:close :copy-page-ref :open-page-right :open-page])
                                                :blocks         (reset! (::actions state) [:close :copy-block-ref :open-block-right :open-block])
                                                :create         (reset! (::actions state) [:close :create])
                                                :recents        (reset! (::actions state) [:close :open])
                                                (reset! (::actions state) [:close]))))
                       (make-shui-context)))]]))

(defn move-highlight [state n]
  (let [items (mapcat last (state->results-ordered state))
        current-item-index (some->> state ::highlighted-item deref (.indexOf items))
        next-item-index (some-> (or current-item-index 0) (+ n) (mod (count items)))]
    (if-let [next-highlighted-item (nth items next-item-index nil)]
      (reset! (::highlighted-item state) next-highlighted-item)
      (reset! (::highglighted-item state) nil))))

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

(defonce keydown-handler
  (fn [state e]
    (let [shift? (.-shiftKey e)
          alt? (.-altKey e)]
      (reset! (::shift? state) shift?)
      (reset! (::alt? state) alt?)
      (when (#{"ArrowDown" "ArrowUp"} (.-key e))
        (.preventDefault e))
      (case (.-key e)
        "ArrowDown" (move-highlight state 1)
        "ArrowUp"   (move-highlight state -1)
        "Enter" (if shift?
                  (when-let [action (some #{:open-block-right :open-page-right :open} @(::actions state))]
                    (handle-action action state e))
                  (when-let [action (some #{:open-block :open-page :filter :trigger :create :open} @(::actions state))]
                    (handle-action action state e)))
        "Escape" (when (seq @(::input state))
                   (.preventDefault e)
                   (.stopPropagation e)
                   (handle-input-change state nil ""))
        nil))))

(defonce keyup-handler 
  (fn [state e]
    (let [shift? (.-shiftKey e) 
          alt? (.-altKey e)]
      (reset! (::shift? state) shift?)
      (reset! (::alt? state) alt?))))

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
                       (when (= -1 (.indexOf all-items highlighted-item))
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
              :ref #(reset! input-ref %)
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

(rum/defcs cmdk < 
  shortcut/disable-all-shortcuts 
  (rum/local "" ::input)
  (rum/local false ::shift?)
  (rum/local false ::alt?)
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
                (when-not (some-> state :rum/args first :sidebar?)
                  (let [next-keydown-handler (partial keydown-handler state)
                        next-keyup-handler (partial keyup-handler state)]
                    ;; remove pre existing handlers
                    (when-let [prev-keydown-handler @(::keydown-handler state)]
                      (js/window.removeEventListener "keydown" prev-keydown-handler))
                    (when-let [prev-keyup-handler @(::keyup-handler state)]
                      (js/window.removeEventListener "keyup" prev-keyup-handler))
                    ;; add new handlers
                    (js/window.addEventListener "keydown" next-keydown-handler true)
                    (js/window.addEventListener "keyup" next-keyup-handler true)
                    ;; save references to functions for cleanup later
                    (reset! (::keydown-handler state) next-keydown-handler)
                    (reset! (::keyup-handler state) next-keyup-handler)))
                state)
   :will-unmount (fn [state] 
                   ;; remove save references to key handlers
                   (when-let [current-keydown-handler (some-> state ::keydown-handler deref)] 
                     (js/window.removeEventListener "keydown" current-keydown-handler))
                   (when-let [current-keyup-handler (some-> state ::keyup-handler deref)] 
                     (js/window.removeEventListener "keyup" current-keyup-handler))
                   ;; clear references to key handlers
                   (reset! (::keydown-handler state) nil)
                   (reset! (::keyup-handler state) nil)
                   state)}
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
        alt? @(::alt? state)]
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
      (for [[group-name group-key group-items] results-ordered
            :when (not-empty group-items)
            :when (if-not group-filter true (= group-filter group-key))]
        (result-group state group-name group-key group-items first-item))]
     [:div {:class "absolute right-4 bottom-4 shadow-gray-02"
            :style {:box-shadow (str "0px 0px 9.7px rgba(0, 0, 0, 0.8), "
                                     "0px 0px 23.3px rgba(0, 0, 0, 0.575), "
                                     "0px 0px 43.8px rgba(0, 0, 0, 0.477), "
                                     "0px 0px 78.2px rgba(0, 0, 0, 0.4), "
                                     "0px 0px 146.2px rgba(0, 0, 0, 0.323), "
                                     "0px 0px 350px rgba(0, 0, 0, 0.255) ")}}
;
      (shui/button {:text "Open" :theme :color} (make-shui-context))]]))

(rum/defc cmdk-modal [props]
  [:div {:class "cp__cmdk__modal rounded-lg max-h-[75dvh] w-[90dvw] max-w-4xl shadow-xl relative"}
   (cmdk props)
   (ui/icon "x" {:class "absolute -right-[0.6rem] -top-[0.6rem] text-gray-11 hover:text-gray-12 cursor-pointer bg-gray-06 rounded-full p-1 text-sm hover:shadow-lg hover:scale-110 transition-all ease-in duration-100"
                 :size "16"
                 :on-click #(state/close-modal!)})])

(rum/defc cmdk-block [props]
  [:div {:class "cp__cmdk__block rounded-md overflow-hidden"}
   (cmdk props)])

