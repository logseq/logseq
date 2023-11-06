(ns frontend.components.cmdk
  (:require
    [clojure.string :as string]
    [frontend.components.block :as block]
    [frontend.components.command-palette :as cp]
    [frontend.context.i18n :refer [t]]
    [frontend.db :as db]
    [frontend.db.model :as model]
    [frontend.handler.command-palette :as cp-handler]
    [frontend.handler.editor :as editor-handler]
    [frontend.handler.page :as page-handler]
    [frontend.handler.route :as route-handler]
    [frontend.handler.whiteboard :as whiteboard-handler]
    [frontend.modules.shortcut.core :as shortcut]
    [frontend.search :as search]
    [frontend.shui :refer [make-shui-context]]
    [frontend.state :as state]
    [frontend.ui :as ui]
    [frontend.util :as util]
    [frontend.util.page :as page-util]
    [goog.functions :as gfun]
    [logseq.shui.core :as shui]
    [promesa.core :as p]
    [rum.core :as rum]
    [frontend.mixins :as mixins]
    [logseq.graph-parser.util.block-ref :as block-ref]
    [logseq.graph-parser.util :as gp-util]
    [logseq.shui.button.v2 :as button]))

(def GROUP-LIMIT 5)

(def search-actions
  [{:text "Search only pages"        :info "Add filter to search" :icon-theme :gray :icon "page" :filter {:mode "search"
                                                                                                          :group :pages}}
   {:text "Search only current page" :info "Add filter to search" :icon-theme :gray :icon "page" :filter {:mode "search"
                                                                                                          :group :current-page}}
   {:text "Search only blocks"       :info "Add filter to search" :icon-theme :gray :icon "block" :filter {:mode "search"
                                                                                                           :group :blocks}}
   {:text "Search only commands"     :info "Add filter to search" :icon-theme :gray :icon "command" :filter {:mode "search"
                                                                                                             :group :commands}}
   ;; {:text "Search only files"        :info "Add filter to search" :icon-theme :gray :icon "file" :filter {:mode "search"
   ;;                                                                                                        :group :files}}
   ])

(def filters search-actions)

(def default-commands
  [{:text "Open settings" :icon "settings"      :icon-theme :gray}
   {:text "Open settings" :icon "settings"      :icon-theme :gray}
   {:text "Open settings" :icon "settings"      :icon-theme :gray}])

;; The results are separated into groups, and loaded/fetched/queried separately
(def default-results
  {:recents        {:status :success :show :less :items nil}
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
    [{:text "Create page"       :icon "new-page"       :icon-theme :color :info (str "Create page called '" q "'") :source-create :page}
     {:text "Create whiteboard" :icon "new-whiteboard" :icon-theme :color :info (str "Create whiteboard called '" q "'") :source-create :whiteboard}]))

;; Take the results, decide how many items to show, and order the results appropriately
(defn state->results-ordered [state]
  (let [results @(::results state)
        input @(::input state)
        filter @(::filter state)
        index (volatile! -1)
        visible-items (fn [group]
                        (let [{:keys [items show]} (get results group)]
                          (cond
                            (= group (:group filter))
                            items

                            (= :more show)
                            items

                            :else
                            (take 5 items))))
        page-exists? (when-not (string/blank? input)
                       (db/entity [:block/name (string/trim input)]))
        filter-mode? (or (string/includes? input " /")
                         (string/starts-with? input "/"))
        order* (if filter-mode?
                 [["Filters"        :filters        (visible-items :filters)]
                  ["Pages"          :pages          (visible-items :pages)]
                  (when-not page-exists?
                    ["Create"         :create         (create-items input)])]
                 (->>
                  [["Pages"          :pages          (visible-items :pages)]
                   ["Commands"       :commands       (visible-items :commands)]
                   (when-not page-exists?
                     ["Create"         :create         (create-items input)])
                   ["Current page"   :current-page   (visible-items :current-page)]
                   ["Whiteboards"    :whiteboards    (visible-items :whiteboards)]
                   ["Blocks"         :blocks         (visible-items :blocks)]
                   ["Recents"        :recents        (visible-items :recents)]]
                  (remove nil?)))
        order (remove nil? order*)]
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
          (:filter highlighted-item) :filter
          :else nil)))

;; Each result gorup has it's own load-results function
(defmulti load-results (fn [group _state] group))

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
                           (remove (fn [c] (= :window/close (:id c))))
                           (map #(hash-map :icon "command"
                                           :icon-theme :gray
                                           :text (cp/translate t %)
                                           :shortcut (:shortcut %)
                                           :source-command %)))]
    (reset! !results (-> default-results (assoc-in [:recents :items] recent-items)
                         (assoc-in [:commands :items] command-items)))))

;; The commands search uses the command-palette hander
(defmethod load-results :commands [group state]
  (let [!input (::input state)
        !results (::results state)]
    (swap! !results assoc-in [group :status] :loading)
    (if (empty? @!input)
      (swap! !results update group merge {:status :success :items default-commands})
      (let [commands (->> (cp-handler/top-commands 1000)
                          (map #(assoc % :t (cp/translate t %))))
            search-results (search/fuzzy-search commands @!input {:extract-fn :t})]
        (->> search-results
             (map #(hash-map :icon "command"
                             :icon-theme :gray
                             :text (cp/translate t %)
                             :shortcut (:shortcut %)
                             :source-command %))
             (hash-map :status :success :items)
             (swap! !results update group merge))))))

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

(defmethod load-results :files [group state]
  (let [!input (::input state)
        !results (::results state)]
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

(defn- get-filter-q
  [input]
  (or (when (string/starts-with? input "/")
        (subs input 1))
      (last (gp-util/split-last " /" input))))

(defmethod load-results :filters [group state]
  (let [!results (::results state)
        !input (::input state)
        input @!input
        q (or (get-filter-q input) "")
        matched-items (if (string/blank? q)
                        filters
                        (search/fuzzy-search filters q {:extract-fn :text}))]
    (swap! !results update group merge {:status :success :items matched-items})))

;; The default load-results function triggers all the other load-results function
(defmethod load-results :default [_ state]
  (js/console.log "load-results/default" @(::input state))
  (if-not (some-> state ::input deref seq)
    (load-results :initial state)
    (do
      (load-results :commands state)
      (load-results :blocks state)
      (load-results :pages state)
      (load-results :filters state)
      (load-results :recents state))))

(defn close-unless-alt! [state]
  (when-not (some-> state ::alt? deref)
    (state/close-modal!)))

(defn- copy-block-ref [state]
  (when-let [block-uuid (some-> state state->highlighted-item :source-block :block/uuid uuid)]
    (editor-handler/copy-block-ref! block-uuid block-ref/->block-ref)
    (close-unless-alt! state)))

(defmulti handle-action (fn [action _state _event] action))

(defmethod handle-action :open-page [_ state event]
  (when-let [page-name (some-> state state->highlighted-item :source-page)]
    (route-handler/redirect-to-page! page-name)
    (close-unless-alt! state)))

(defmethod handle-action :open-block [_ state event]
  (let [block-id (some-> state state->highlighted-item :source-block :block/uuid uuid)
        get-block-page (partial model/get-block-page (state/get-current-repo))]
    (when-let [page (some-> block-id get-block-page :block/name)]
      (route-handler/redirect-to-page! page {:anchor (str "ls-block-" block-id)})
      (close-unless-alt! state))))

(defmethod handle-action :open-page-right [_ state event]
  (when-let [page-name (some-> state state->highlighted-item :source-page)]
    (when-let [page (db/entity [:block/name (util/page-name-sanity-lc page-name)])]
      (editor-handler/open-block-in-sidebar! (:block/uuid page)))
    (close-unless-alt! state)))

(defmethod handle-action :open-block-right [_ state event]
  (when-let [block-uuid (some-> state state->highlighted-item :source-block :block/uuid uuid)]
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

(defn- get-filter-user-input
  [input]
  (cond
    (string/includes? input " /")
    (first (gp-util/split-last " /" input))
    (string/starts-with? input "/")
    ""
    :else
    input))

(defmethod handle-action :filter [_ state event]
  (let [item (some-> state state->highlighted-item)
        !input (::input state)]
    (reset! !input (get-filter-user-input @!input))
    (let [!filter (::filter state)
          group (get-in item [:filter :group])]
      (swap! !filter assoc :group group)
      (load-results group state))))

(defmethod handle-action :default [_ state event]
  (when-let [action (state->action state)]
    (handle-action action state event)))

(defn- scroll-into-view-when-invisible
  [state target]
  (let [*container-ref (::scroll-container-ref state)
        container-rect (.getBoundingClientRect @*container-ref)
        t1 (.-top container-rect)
        b1 (.-bottom container-rect)
        target-rect (.getBoundingClientRect target)
        t2 (.-top target-rect)
        b2 (.-bottom target-rect)]
    (when-not (<= t1 t2 b2 b1)          ; not visible
      (.scrollIntoView target
                       #js {:inline "nearest"
                            :behavior "smooth"}))))

(rum/defc result-group < rum/reactive
  [state title group visible-items first-item]
  (let [{:keys [show items]} (some-> state ::results deref group)
        highlighted-item (or @(::highlighted-item state) first-item)
        filter @(::filter state)
        can-show-less? (< GROUP-LIMIT (count visible-items))
        can-show-more? (< (count visible-items) (count items))
        show-less #(swap! (::results state) assoc-in [group :show] :less)
        show-more #(swap! (::results state) assoc-in [group :show] :more)
        context (make-shui-context)]
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

      (when (and (or can-show-more? can-show-less?) (empty? filter))
        [:a.text-link.select-node.opacity-50.hover:opacity-90
         {:on-click (if (= show :more) show-less show-more)}
         (if (= show :more)
           [:div.flex.flex-row.gap-1.items-center
            "Show less"
            (shui/shortcut "mod up" context)]
           [:div.flex.flex-row.gap-1.items-center
            "Show more"
            (shui/shortcut "mod down" context)])])]

     [:div
      (for [item visible-items
            :let [highlighted? (= item highlighted-item)]]
        (ui/lazy-visible
         (fn []
           (shui/list-item (assoc item
                                  :query (when-not (= group :create) @(::input state))
                                  :compact true
                                  :rounded false
                                  :highlighted highlighted?
                                  :display-shortcut-on-highlight? true
                               ;; for some reason, the highlight effect does not always trigger on a
                               ;; boolean value change so manually pass in the dep
                                  :on-highlight-dep highlighted-item
                                  :on-click (fn [e]
                                              (reset! (::highlighted-item state) item)
                                              (handle-action :default state item)
                                              (when-let [on-click (:on-click item)]
                                                (on-click e)))
                               ;; :on-mouse-enter (fn [e]
                               ;;                   (when (not highlighted?)
                               ;;                     (reset! (::highlighted-item state) (assoc item :mouse-enter-triggered-highlight true))))
                                  :on-highlight (fn [ref]
                                                  (reset! (::highlighted-group state) group)
                                                  (when (and ref (.-current ref)
                                                             (not (:mouse-enter-triggered-highlight @(::highlighted-item state))))
                                                    (scroll-into-view-when-invisible state (.-current ref)))))
                           context))
         {:trigger-once? true}))]]))

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
       (reset! !load-results-throttled (gfun/throttle load-results 50)))

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
        show-more (fn [] (swap! (::results state) assoc-in [highlighted-group :show] :more))
        input @(::input state)]
    (reset! (::shift? state) shift?)
    (reset! (::meta? state) meta?)
    (reset! (::alt? state) alt?)
    (when (get #{"ArrowUp" "ArrowDown"} (.-key e))
      (.preventDefault e))
    (case (.-key e)
      "ArrowDown"   (if meta?
                      (show-more)
                      (move-highlight state 1))
      "ArrowUp"     (if meta?
                      (show-less)
                      (move-highlight state -1))
      "Enter"       (handle-action :default state e)
      "Escape"      (when-not (string/blank? input)
                      (util/stop e)
                      (let [filter @(::filter state)]
                        (reset! (::filter state) nil)
                        (when-not filter (handle-input-change state nil ""))))
      "c"           (copy-block-ref state)
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
    [:div {:style {:background "var(--lx-gray-02)"
                   :border-bottom "1px solid var(--lx-gray-07)"}}
     [:input {:class "text-xl bg-transparent border-none w-full outline-none px-4 py-3"
              :placeholder "What are you looking for?"
              :ref #(when-not @input-ref (reset! input-ref %))
              :on-change (fn [e]
                           (when (= "" (.-value @input-ref))
                             (reset! (::filter state) nil))
                           (handle-input-change state e))
              :on-key-down (fn [e]
                             (let [value (.-value @input-ref)
                                   last-char (last value)]
                               (when (and (some? @(::filter state))
                                          (or (= (util/ekey e) "/")
                                              (and (= (util/ekey e) "Backspace")
                                                   (= last-char "/"))))
                                 (reset! (::filter state) nil))))
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

(rum/defc tip
  [state]
  (let [filter @(::filter state)]
    (cond
      filter
      "type ESC to clear search filter"

      :else
      "type / to filter search results")))

(rum/defc hints
  [state]
  (let [action (state->action state)
        button-fn (fn [text shortcut]
                    (shui/button {:text text
                                  :theme :text
                                  :hover-theme :gray
                                  :on-click #(handle-action action state %)
                                  :shortcut shortcut
                                  :muted true}
                                 (make-shui-context)))]
    (when action
      [:div {:class "flex w-full px-4 py-2 gap-2 justify-between"
             :style {:background "var(--lx-gray-03)"
                     :border-top "1px solid var(--lx-gray-07)"}}
       [:div.text-sm.opacity-30.hover:opacity-90.leading-6
        [:div.flex.flex-row.gap-1.items-center
         [:div "Tip:"]
         [:div (tip state)]]]

       [:div.flex.gap-2
        (case action
          :open
          [:<>
           (button-fn "Open" ["return"])
           (button-fn "Open in sidebar" ["shift" "return"])
           (when (:source-block @(::highlighted-item state)) (button-fn "Copy ref" ["⌘" "c"]))]

          :search
          [:<>
           (button-fn "Search" ["return"])]

          :trigger
          [:<>
           (button-fn "Trigger" ["return"])]

          :create
          [:<>
           (button-fn "Create" ["return"])]

          :filter
          [:<>
           (button-fn "Filter" ["return"])]

          nil)]])))

(rum/defc search-only
  [state group-name]
  [:div.flex.flex-row.gap-1.items-center
   [:div "Search only:"]
   [:div group-name]
   (button/root {:icon "x"
                 :theme :text
                 :hover-theme :gray
                 :size :sm
                 :on-click (fn []
                             (reset! (::filter state) nil))})])
(rum/defcs cmdk <
  shortcut/disable-all-shortcuts
  rum/reactive
  {:init (fn [state]
           (assoc state ::ref (atom nil)))}
  (mixins/event-mixin
   (fn [state]
     (let [ref @(::ref state)]
       (mixins/on-key-down state {}
                           {:target ref
                            :all-handler (fn [e _key] (keydown-handler state e))})
       (mixins/on-key-up state {}
                         {:target ref
                          :all-handler (fn [e _key] (keyup-handler state e))}))))
  (rum/local "" ::input)
  (rum/local false ::shift?)
  (rum/local false ::meta?)
  (rum/local false ::alt?)
  (rum/local nil ::highlighted-group)
  (rum/local nil ::highlighted-item)
  (rum/local nil ::filter)
  (rum/local default-results ::results)
  (rum/local nil ::load-results-throttled)
  (rum/local nil ::scroll-container-ref)
  (rum/local nil ::input-ref)
  [state {:keys [sidebar?]}]
  (let [*input (::input state)
        group-filter (:group @(::filter state))
        results-ordered (state->results-ordered state)
        all-items (mapcat last results-ordered)
        first-item (first all-items)]
    [:div.cp__cmdk {:ref #(when-not @(::ref state) (reset! (::ref state) %))
                    :class (cond-> "w-full h-full relative flex flex-col justify-start"
                             (not sidebar?) (str " rounded-lg"))}
     (if sidebar?
       (input-row-sidebar state all-items)
       (input-row state all-items))
     [:div {:class (cond-> "w-full flex-1 overflow-y-auto max-h-[65dvh]"
                     (not sidebar?) (str " pb-14"))
            :ref #(let [*ref (::scroll-container-ref state)]
                    (when-not @*ref (reset! *ref %)))
            :style {:background "var(--lx-gray-02)"}}
      (let [items (filter
                   (fn [[_group-name group-key group-count _group-items]]
                     (and (not= 0 group-count)
                          (if-not group-filter true
                                  (or (= group-filter group-key)
                                      (and group-filter (= group-key :create))))))
                   results-ordered)]
        (if (seq items)
          (for [[group-name group-key _group-count group-items] items]
            (let [title (if (= group-filter group-key)
                          (search-only state group-name)
                          group-name)]
              (result-group state title group-key group-items first-item)))
          [:div.flex.flex-col.p-4.gap-2.opacity-50
           (when group-filter
             [:div.text-sm
              (search-only state (string/capitalize (name group-filter)))])
           (when-not (string/blank? @*input)
             "No matched results")]))]
     (hints state)]))

(rum/defc cmdk-modal [props]
  [:div {:class "cp__cmdk__modal rounded-lg w-[90dvw] max-w-4xl shadow-xl relative"}
   (cmdk props)])

(comment
  (rum/defc cmdk-block [props]
    [:div {:class "cp__cmdk__block rounded-md"}
     (cmdk props)]))
