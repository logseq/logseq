(ns frontend.components.cmdk.core
  (:require
   [cljs-bean.core :as bean]
   [clojure.string :as string]
   [frontend.components.block :as block]
   [frontend.components.cmdk.list-item :as list-item]
   [frontend.components.title :as title]
   [frontend.extensions.pdf.utils :as pdf-utils]
   [frontend.context.i18n :refer [t]]
   [frontend.db :as db]
   [frontend.db.model :as model]
   [frontend.handler.command-palette :as cp-handler]
   [frontend.handler.editor :as editor-handler]
   [frontend.handler.page :as page-handler]
   [frontend.handler.route :as route-handler]
   [frontend.handler.whiteboard :as whiteboard-handler]
   [frontend.handler.notification :as notification]
   [frontend.modules.shortcut.core :as shortcut]
   [frontend.search :as search]
   [frontend.state :as state]
   [frontend.ui :as ui]
   [frontend.util :as util]
   [frontend.util.page :as page-util]
   [goog.functions :as gfun]
   [goog.object :as gobj]
   [logseq.shui.ui :as shui]
   [promesa.core :as p]
   [rum.core :as rum]
   [frontend.mixins :as mixins]
   [logseq.common.util.block-ref :as block-ref]
   [logseq.common.util :as common-util]
   [frontend.modules.shortcut.utils :as shortcut-utils]
   [frontend.config :as config]
   [logseq.common.path :as path]
   [electron.ipc :as ipc]
   [frontend.util.text :as text-util]
   [goog.userAgent]
   [frontend.db.async :as db-async]
   [logseq.db :as ldb]))

(defn translate [t {:keys [id desc]}]
  (when id
    (let [desc-i18n (t (shortcut-utils/decorate-namespace id))]
      (if (string/starts-with? desc-i18n "{Missing key")
        desc
        desc-i18n))))

(def GROUP-LIMIT 5)

(def search-actions
  [{:filter {:group :current-page} :text "Search only current page" :info "Add filter to search" :icon-theme :gray :icon "page"}
   {:filter {:group :nodes} :text "Search only nodes" :info "Add filter to search" :icon-theme :gray :icon "letter-n"}
   {:filter {:group :commands} :text "Search only commands" :info "Add filter to search" :icon-theme :gray :icon "command"}
   {:filter {:group :files} :text "Search only files" :info "Add filter to search" :icon-theme :gray :icon "file"}
   {:filter {:group :themes} :text "Search only themes" :info "Add filter to search" :icon-theme :gray :icon "palette"}])

(def filters search-actions)

;; The results are separated into groups, and loaded/fetched/queried separately
(def default-results
  {:commands       {:status :success :show :less :items nil}
   :favorites      {:status :success :show :less :items nil}
   :current-page   {:status :success :show :less :items nil}
   :nodes         {:status :success :show :less :items nil}
   :files          {:status :success :show :less :items nil}
   :themes         {:status :success :show :less :items nil}
   :filters        {:status :success :show :less :items nil}})

(defn get-class-from-input
  [input]
  (string/replace input #"^#+" ""))

(defn create-items [q]
  (when-not (string/blank? q)
    (let [class? (string/starts-with? q "#")]
      (->> [{:text (if class? "Create tag" "Create page")       :icon "new-page"
             :icon-theme :gray
             :info (if class?
                     (str "Create class called '" (get-class-from-input q) "'")
                     (str "Create page called '" q "'"))
             :source-create :page}]
        (remove nil?)))))

;; Take the results, decide how many items to show, and order the results appropriately
(defn state->results-ordered [state search-mode]
  (let [sidebar? (:sidebar? (last (:rum/args state)))
        results @(::results state)
        input @(::input state)
        filter @(::filter state)
        filter-group (:group filter)
        index (volatile! -1)
        visible-items (fn [group]
                        (let [{:keys [items show]} (get results group)]
                          (cond
                            (or sidebar? (= group filter-group))
                            items

                            (= :more show)
                            items

                            :else
                            (take 5 items))))
        node-exists? (let [blocks-result (keep :source-block (get-in results [:nodes :items]))]
                       (when-not (string/blank? input)
                         (or (db/get-page (string/trim input))
                             (some (fn [block]
                                     (and
                                      (:block/tags block)
                                      (= input (util/page-name-sanity-lc (:block/title block))))) blocks-result))))
        include-slash? (or (string/includes? input "/")
                           (string/starts-with? input "/"))
        order* (cond
                 (= search-mode :graph)
                 []

                 include-slash?
                 [(when-not node-exists?
                    ["Create"         :create         (create-items input)])

                  ["Current page"   :current-page   (visible-items :current-page)]
                  ["Nodes"         :nodes         (visible-items :nodes)]
                  ["Files"          :files          (visible-items :files)]
                  ["Filters" :filters (visible-items :filters)]]

                 filter-group
                 [(when (= filter-group :nodes)
                    ["Current page"   :current-page   (visible-items :current-page)])
                  [(if (= filter-group :current-page) "Current page" (name filter-group))
                   filter-group
                   (visible-items filter-group)]
                  (when-not node-exists?
                    ["Create"         :create         (create-items input)])]

                 :else
                 (->>
                  [(when-not node-exists?
                     ["Create"         :create       (create-items input)])
                   ["Current page"   :current-page   (visible-items :current-page)]
                   ["Nodes"         :nodes         (visible-items :nodes)]
                   ["Commands"       :commands       (visible-items :commands)]
                   ["Files"          :files          (visible-items :files)]
                   ["Filters"        :filters        (visible-items :filters)]]
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
    (some->> (state->results-ordered state (:search/mode @state/state))
      (mapcat last)
      (first))))

(defn state->action [state]
  (let [highlighted-item (state->highlighted-item state)]
    (cond (:source-page highlighted-item) :open
          (:source-block highlighted-item) :open
          (:file-path highlighted-item) :open
          (:source-search highlighted-item) :search
          (:source-command highlighted-item) :trigger
          (:source-create highlighted-item) :create
          (:filter highlighted-item) :filter
          (:source-theme highlighted-item) :theme
          :else nil)))

;; Each result group has it's own load-results function
(defmulti load-results (fn [group _state] group))

(defmethod load-results :initial [_ state]
  (let [!results (::results state)
        command-items (->> (cp-handler/top-commands 100)
                        (remove (fn [c] (= :window/close (:id c))))
                        (map #(hash-map :icon "command"
                                :icon-theme :gray
                                :text (translate t %)
                                :shortcut (:shortcut %)
                                :source-command %)))]
    (reset! !results (assoc-in default-results [:commands :items] command-items))))

;; The commands search uses the command-palette handler
(defmethod load-results :commands [group state]
  (let [!input (::input state)
        !results (::results state)]
    (swap! !results assoc-in [group :status] :loading)
    (let [commands (->> (cp-handler/top-commands 1000)
                     (map #(assoc % :t (translate t %))))
          search-results (if (string/blank? @!input)
                           commands
                           (search/fuzzy-search commands @!input {:extract-fn :t}))]
      (->> search-results
        (map #(hash-map :icon "command"
                :icon-theme :gray
                :text (translate t %)
                :shortcut (:shortcut %)
                :source-command %))
        (hash-map :status :success :items)
        (swap! !results update group merge)))))

(defn highlight-content-query
  "Return hiccup of highlighted content FTS result"
  [content q]
  (when-not (or (string/blank? content) (string/blank? q))
    [:div (loop [content content ;; why recur? because there might be multiple matches
                 result  []]
            (let [[b-cut hl-cut e-cut] (text-util/cut-by content "$pfts_2lqh>$" "$<pfts_2lqh$")
                  hiccups-add [(when-not (string/blank? b-cut)
                                 [:span b-cut])
                               (when-not (string/blank? hl-cut)
                                 [:mark.p-0.rounded-none hl-cut])]
                  hiccups-add (remove nil? hiccups-add)
                  new-result (concat result hiccups-add)]
              (if-not (string/blank? e-cut)
                (recur e-cut new-result)
                new-result)))]))

(defn- page-item
  [repo page]
  (let [entity (db/entity [:block/uuid (:block/uuid page)])
        source-page (model/get-alias-source-page repo (:db/id entity))
        icon (cond
               (ldb/class? entity)
               "hash"
               (ldb/property? entity)
               "letter-p"
               (ldb/whiteboard? entity)
               "whiteboard"
               :else
               "page")]
    (hash-map :icon icon
              :icon-theme :gray
              :text (title/block-unique-title page)
              :source-page (or source-page page))))

(defn- block-item
  [repo block current-page !input]
  (let [id (:block/uuid block)
        object? (seq (:block/tags block))
        text (title/block-unique-title block)
        icon "letter-n"]
    {:icon icon
     :icon-theme :gray
     :text (highlight-content-query text @!input)
     :header (when-not object? (block/breadcrumb {:search? true} repo id {}))
     :current-page? (when-let [page-id (:block/page block)]
                      (= page-id (:block/uuid current-page)))
     :source-block block}))

;; The blocks search action uses an existing handler
(defmethod load-results :nodes [group state]
  (let [!input (::input state)
        !results (::results state)
        repo (state/get-current-repo)
        current-page (when-let [id (page-util/get-current-page-id)]
                       (db/entity id))
        opts {:limit 100 :built-in? config/dev?}]
    (swap! !results assoc-in [group :status] :loading)
    (swap! !results assoc-in [:current-page :status] :loading)
    (p/let [blocks (search/block-search repo @!input opts)
            blocks (remove nil? blocks)
            items (keep (fn [block]
                          (if (:page? block)
                            (page-item repo block)
                            (block-item repo block current-page !input))) blocks)]
      (if (= group :current-page)
        (let [items-on-current-page (filter :current-page? items)]
          (swap! !results update group         merge {:status :success :items items-on-current-page}))
        (swap! !results update group         merge {:status :success :items items})))))

(defmethod load-results :files [group state]
  (let [!input (::input state)
        !results (::results state)]
    (swap! !results assoc-in [group :status] :loading)
    (p/let [files* (search/file-search @!input 99)
            files (remove
                    (fn [f]
                      (and
                        f
                        (string/ends-with? f ".edn")
                        (or (string/starts-with? f "whiteboards/")
                          (string/starts-with? f "assets/")
                          (string/starts-with? f "logseq/version-files")
                          (contains? #{"logseq/metadata.edn" "logseq/pages-metadata.edn" "logseq/graphs-txid.edn"} f))))
                    files*)
            items (map
                    (fn [file]
                      (hash-map :icon "file"
                        :icon-theme :gray
                        :text file
                        :file-path file))
                    files)]
      (swap! !results update group merge {:status :success :items items}))))

(defmethod load-results :themes [group _state]
  (let [!input (::input _state)
        !results (::results _state)
        themes (state/sub :plugin/installed-themes)
        themes (if (string/blank? @!input)
                 themes
                 (search/fuzzy-search themes @!input :limit 100 :extract-fn :name))
        themes (cons {:name "Logseq Default theme"
                      :pid "logseq-classic-theme"
                      :mode (state/sub :ui/theme)
                      :url nil} themes)
        selected (state/sub :plugin/selected-theme)]
    (swap! !results assoc-in [group :status] :loading)
    (let [items (for [t themes
                      :let [selected? (= (:url t) selected)]]
                  {:icon-theme :gray :text (:name t) :info (str (:mode t) " #" (:pid t))
                   :icon (if selected? "checkbox" "palette") :source-theme t :selected selected?})]
      (swap! !results update group merge {:status :success :items items}))))

(defn- get-filter-q
  [input]
  (or (when (string/starts-with? input "/")
        (subs input 1))
    (last (common-util/split-last "/" input))))

(defmethod load-results :filters [group state]
  (let [!results (::results state)
        !input (::input state)
        input @!input
        q (or (get-filter-q input) "")
        matched-items (if (string/blank? q)
                        filters
                        (search/fuzzy-search filters q {:extract-fn :text}))]
    (swap! !results update group merge {:status :success :items matched-items})))

(defmethod load-results :current-page [group state]
  (if-let [current-page (when-let [id (page-util/get-current-page-id)]
                          (db/entity id))]
    (let [!results (::results state)
          !input (::input state)
          repo (state/get-current-repo)
          opts {:limit 100 :page (str (:block/uuid current-page))}]
      (swap! !results assoc-in [group :status] :loading)
      (swap! !results assoc-in [:current-page :status] :loading)
      (p/let [blocks (search/block-search repo @!input opts)
              blocks (remove nil? blocks)
              items (map (fn [block]
                           (let [id (if (uuid? (:block/uuid block))
                                      (:block/uuid block)
                                      (uuid (:block/uuid block)))]
                             {:icon "node"
                              :icon-theme :gray
                              :text (highlight-content-query (:block/title block) @!input)
                              :header (block/breadcrumb {:search? true} repo id {})
                              :current-page? true
                              :source-block block})) blocks)]
        (swap! !results update :current-page merge {:status :success :items items})))
    (reset! (::filter state) nil)))

;; The default load-results function triggers all the other load-results function
(defmethod load-results :default [_ state]
  (let [filter-group (:group @(::filter state))]
    (if (and (not (some-> state ::input deref seq))
          (not filter-group))
      (do (load-results :initial state)
          (load-results :filters state))
      (if filter-group
        (load-results filter-group state)
        (do
          (load-results :commands state)
          (load-results :nodes state)
          (load-results :filters state)
          (load-results :files state)
          ;; (load-results :recents state)
          )))))

(defn- copy-block-ref [state]
  (when-let [block-uuid (some-> state state->highlighted-item :source-block :block/uuid)]
    (editor-handler/copy-block-ref! block-uuid block-ref/->block-ref)
    (state/close-modal!)))

(defmulti handle-action (fn [action _state _event] action))

(defn- get-highlighted-page-uuid-or-name
  [state]
  (let [highlighted-item (some-> state state->highlighted-item)]
    (or (:block/uuid (:source-block highlighted-item))
        (:block/uuid (:source-page highlighted-item)))))

(defmethod handle-action :open-page [_ state _event]
  (when-let [page-name (get-highlighted-page-uuid-or-name state)]
    (let [page (db/get-page page-name)]
      (route-handler/redirect-to-page! (:block/uuid page)))
    (state/close-modal!)))

(defmethod handle-action :open-block [_ state _event]
  (when-let [block-id (some-> state state->highlighted-item :source-block :block/uuid)]
    (p/let [repo (state/get-current-repo)
            _ (db-async/<get-block repo block-id :children? false)
            block (db/entity [:block/uuid block-id])
            parents (db-async/<get-block-parents (state/get-current-repo) (:db/id block) 1000)
            created-from-block (some (fn [block']
                                       (let [block (db/entity (:db/id block'))]
                                         (when (:logseq.property/created-from-property block)
                                           (:block/parent block)))) parents)
            [block-id block] (if created-from-block
                               (let [block (db/entity (:db/id created-from-block))]
                                 [(:block/uuid block) block])
                               [block-id block])]
      (let [get-block-page (partial model/get-block-page repo)]
        (when block
          (when-let [page (some-> block-id get-block-page)]
            (cond
              (db/whiteboard-page? page)
              (route-handler/redirect-to-page! (:block/uuid page) {:block-id block-id})
              (model/parents-collapsed? (state/get-current-repo) block-id)
              (route-handler/redirect-to-page! block-id)
              :else
              (route-handler/redirect-to-page! (:block/uuid page) {:anchor (str "ls-block-" block-id)}))
            (state/close-modal!)))))))

(defmethod handle-action :open-page-right [_ state _event]
  (when-let [page-name (get-highlighted-page-uuid-or-name state)]
    (let [page (db/get-page page-name)]
      (when page
        (editor-handler/open-block-in-sidebar! (:block/uuid page))))
    (state/close-modal!)))

(defmethod handle-action :open-block-right [_ state _event]
  (when-let [block-uuid (some-> state state->highlighted-item :source-block :block/uuid)]
    (p/let [repo (state/get-current-repo)
            _ (db-async/<get-block repo block-uuid :children? false)]
      (editor-handler/open-block-in-sidebar! block-uuid)
      (state/close-modal!))))

(defn- open-file
  [file-path]
  (if (or (string/ends-with? file-path ".edn")
        (string/ends-with? file-path ".js")
        (string/ends-with? file-path ".css"))
    (route-handler/redirect! {:to :file
                              :path-params {:path file-path}})
    ;; open this file in directory
    (when (util/electron?)
      (let [file-fpath (path/path-join (config/get-repo-dir (state/get-current-repo)) file-path)]
        (ipc/ipc "openFileInFolder" file-fpath)))))

(defn- page-item?
  [item]
  (let [block-uuid (:block/uuid (:source-block item))]
    (or (boolean (:source-page item))
        (and block-uuid (:block/name (db/entity [:block/uuid block-uuid]))))))

(defmethod handle-action :open [_ state event]
  (when-let [item (some-> state state->highlighted-item)]
    (let [page? (page-item? item)
          block? (boolean (:source-block item))
          shift?  @(::shift? state)
          shift-or-sidebar? (or shift? (boolean (:open-sidebar? (:opts state))))
          search-mode (:search/mode @state/state)
          graph-view? (= search-mode :graph)]
      (cond
        (:file-path item) (do
                            (open-file (:file-path item))
                            (state/close-modal!))
        (and graph-view? page? (not shift?)) (do
                                               (state/add-graph-search-filter! @(::input state))
                                               (reset! (::input state) ""))
        (and shift-or-sidebar? block?) (handle-action :open-block-right state event)
        (and shift-or-sidebar? page?) (handle-action :open-page-right state event)
        page? (handle-action :open-page state event)
        block? (handle-action :open-block state event)))))

(defmethod handle-action :search [_ state _event]
  (when-let [item (some-> state state->highlighted-item)]
    (let [search-query (:source-search item)]
      (reset! (::input state) search-query))))

(defmethod handle-action :trigger [_ state _event]
  (let [command (some-> state state->highlighted-item :source-command)]
    (when-let [action (:action command)]
      (action)
      (when-not (contains? #{:graph/open :graph/remove :dev/replace-graph-with-db-file :ui/toggle-settings :go/flashcards} (:id command))
        (state/close-modal!)))))

(defmethod handle-action :create [_ state _event]
  (let [item (state->highlighted-item state)
        !input (::input state)
        create-class? (string/starts-with? @!input "#")
        create-whiteboard? (= :whiteboard (:source-create item))
        create-page? (= :page (:source-create item))
        class (when create-class? (get-class-from-input @!input))]
    (p/do!
      (cond
        create-class?
        (page-handler/<create-class! class
                                     {:redirect? false
                                      :create-first-block? false})
        create-whiteboard? (whiteboard-handler/<create-new-whiteboard-and-redirect! @!input)
        create-page? (page-handler/<create! @!input {:redirect? true}))
      (state/close-modal!)
      (when create-class?
        (state/pub-event! [:class/configure (db/get-case-page class)])))))

(defn- get-filter-user-input
  [input]
  (cond
    (string/includes? input "/")
    (first (common-util/split-last "/" input))
    (string/starts-with? input "/")
    ""
    :else
    input))

(defmethod handle-action :filter [_ state _event]
  (let [item (some-> state state->highlighted-item)
        !input (::input state)]
    (reset! !input (get-filter-user-input @!input))
    (let [!filter (::filter state)
          group (get-in item [:filter :group])]
      (swap! !filter assoc :group group)
      (load-results group state))))

(defmethod handle-action :theme [_ state]
  (when-let [item (some-> state state->highlighted-item)]
    (js/LSPluginCore.selectTheme (bean/->js (:source-theme item)))
    (state/close-modal!)))

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

(rum/defc mouse-active-effect!
  [*mouse-active? deps]
  (rum/use-effect!
    #(reset! *mouse-active? false)
    deps)
  nil)

(rum/defcs result-group
  < rum/reactive
  (rum/local false ::mouse-active?)
  [state' state title group visible-items first-item sidebar?]
  (let [{:keys [show items]} (some-> state ::results deref group)
        highlighted-item (or @(::highlighted-item state) first-item)
        highlighted-group @(::highlighted-group state)
        *mouse-active? (::mouse-active? state')
        filter @(::filter state)
        can-show-less? (< GROUP-LIMIT (count visible-items))
        can-show-more? (< (count visible-items) (count items))
        show-less #(swap! (::results state) assoc-in [group :show] :less)
        show-more #(swap! (::results state) assoc-in [group :show] :more)]
    [:<>
     (mouse-active-effect! *mouse-active? [highlighted-item])
     [:div {:class         (if (= title "Create")
                             "border-b border-gray-06 last:border-b-0"
                             "border-b border-gray-06 pb-1 last:border-b-0")
            :on-mouse-move #(reset! *mouse-active? true)}
      (when-not (= title "Create")
        [:div {:class "text-xs py-1.5 px-3 flex justify-between items-center gap-2 text-gray-11 bg-gray-02 h-8"}
         [:div {:class "font-bold text-gray-11 pl-0.5 cursor-pointer select-none"
                :on-click (fn [_e]
                          ;; change :less to :more or :more to :less
                            (swap! (::results state) update-in [group :show] {:more :less
                                                                              :less :more}))}
          title]
         (when (not= group :create)
           [:div {:class "pl-1.5 text-gray-12 rounded-full"
                  :style {:font-size "0.7rem"}}
            (if (<= 100 (count items))
              (str "99+")
              (count items))])

         [:div {:class "flex-1"}]

         (when (and (= group highlighted-group)
                    (or can-show-more? can-show-less?)
                    (empty? filter)
                    (not sidebar?))
           [:a.text-link.select-node.opacity-50.hover:opacity-90
            {:on-click (if (= show :more) show-less show-more)}
            (if (= show :more)
              [:div.flex.flex-row.gap-1.items-center
               "Show less"
               (shui/shortcut "mod up" nil)]
              [:div.flex.flex-row.gap-1.items-center
               "Show more"
               (shui/shortcut "mod down" nil)])])])

      [:div.search-results
       (for [item visible-items
             :let [highlighted? (= item highlighted-item)
                   page? (= "page" (some-> item :icon))
                   text (some-> item :text)
                   source-page (some-> item :source-page)
                   hls-page? (and page? (pdf-utils/hls-file? (:block/title source-page)))]]
         (let [item (list-item/root
                     (assoc item
                            :group group
                            :query (when-not (= group :create) @(::input state))
                            :text (if hls-page? (pdf-utils/fix-local-asset-pagename text) text)
                            :hls-page? hls-page?
                            :compact true
                            :rounded false
                            :hoverable @*mouse-active?
                            :highlighted highlighted?
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
                     nil)]
           (if (= group :nodes)
             (ui/lazy-visible (fn [] item) {:trigger-once? true})
             item)))]]]))

(defn move-highlight [state n]
  (let [items (mapcat last (state->results-ordered state (:search/mode @state/state)))
        highlighted-item (some-> state ::highlighted-item deref (dissoc :mouse-enter-triggered-highlight))
        current-item-index (some->> highlighted-item (.indexOf items))
        next-item-index (some-> (or current-item-index 0) (+ n) (mod (count items)))]
    (if-let [next-highlighted-item (nth items next-item-index nil)]
      (reset! (::highlighted-item state) next-highlighted-item)
      (reset! (::highlighted-item state) nil))))

(defn handle-input-change
  ([state e] (handle-input-change state e (.. e -target -value)))
  ([state e input]
   (let [composing? (util/native-event-is-composing? e)
         e-type (gobj/getValueByKeys e "type")
         composing-end? (= e-type "compositionend")
         !input (::input state)
         input-ref @(::input-ref state)
         !load-results-throttled (::load-results-throttled state)]

     ;; update the input value in the UI
     (reset! !input input)
     (set! (.-value input-ref) input)

     (reset! (::input-changed? state) true)

     ;; ensure that there is a throttled version of the load-results function
     (when-not @!load-results-throttled
       (reset! !load-results-throttled (gfun/throttle load-results 50)))

     ;; retrieve the load-results function and update all the results
     (when (or (not composing?) composing-end?)
       (when-let [load-results-throttled @!load-results-throttled]
         (load-results-throttled :default state))))))

(defn- open-current-item-link
  "Opens a link for the current item if a page or block. For pages, opens the
  first :url property if a db graph or for file graphs opens first property
  value with a url. For blocks, opens the first url found in the block content"
  [state]
  (let [item (some-> state state->highlighted-item)
        repo (state/get-current-repo)]
    (cond
      (page-item? item)
      (p/let [page (some-> (get-highlighted-page-uuid-or-name state) db/get-page)
              _ (db-async/<get-block repo (:block/uuid page) :children? false)
              page' (db/entity repo [:block/uuid (:block/uuid page)])
              link (if (config/db-based-graph? repo)
                     (some (fn [[k v]]
                             (when (= :url (get-in (db/entity repo k) [:block/schema :type]))
                               (:block/title v)))
                           (:block/properties page'))
                     (some #(re-find editor-handler/url-regex (val %)) (:block/properties page')))]
        (if link
          (js/window.open link)
          (notification/show! "No link found in this page's properties." :warning)))

      (:source-block item)
      (p/let [block-id (:block/uuid (:source-block item))
              _ (db-async/<get-block repo block-id :children? false)
              block (db/entity [:block/uuid block-id])
              link (re-find editor-handler/url-regex (:block/title block))]
        (if link
          (js/window.open link)
          (notification/show! "No link found in this block's content." :warning)))
      :else
      (notification/show! "No link for this search item." :warning))))

(defn- keydown-handler
  [state e]
  (let [shift? (.-shiftKey e)
        meta? (util/meta-key? e)
        ctrl? (.-ctrlKey e)
        keyname (.-key e)
        enter? (= keyname "Enter")
        esc? (= keyname "Escape")
        composing? (util/goog-event-is-composing? e)
        highlighted-group @(::highlighted-group state)
        show-less (fn [] (swap! (::results state) assoc-in [highlighted-group :show] :less))
        show-more (fn [] (swap! (::results state) assoc-in [highlighted-group :show] :more))
        input @(::input state)
        as-keydown? (or (= keyname "ArrowDown") (and ctrl? (= keyname "n")))
        as-keyup? (or (= keyname "ArrowUp") (and ctrl? (= keyname "p")))]
    (reset! (::shift? state) shift?)
    (reset! (::meta? state) meta?)
    (when (or as-keydown? as-keyup?)
      (util/stop e))

    (cond
      (and meta? enter?)
      (let [repo (state/get-current-repo)]
        (state/close-modal!)
        (state/sidebar-add-block! repo input :search))
      as-keydown? (if meta?
                    (show-more)
                    (move-highlight state 1))
      as-keyup? (if meta?
                  (show-less)
                  (move-highlight state -1))
      (and enter? (not composing?)) (do
                                      (handle-action :default state e)
                                      (util/stop-propagation e))
      esc? (let [filter @(::filter state)]
             (when-not (string/blank? input)
               (util/stop e)
               (handle-input-change state nil ""))
             (when (and filter (string/blank? input))
               (util/stop e)
               (reset! (::filter state) nil)
               (load-results :default state)))
      (and meta? (= keyname "c")) (do
                                    (copy-block-ref state)
                                    (util/stop-propagation e))
      (and meta? (= keyname "o"))
      (open-current-item-link state)
      :else nil)))

(defn- keyup-handler
  [state e]
  (let [shift? (.-shiftKey e)
        meta? (util/meta-key? e)]
    (reset! (::shift? state) shift?)
    (reset! (::meta? state) meta?)))

(defn- input-placeholder
  [sidebar?]
  (let [search-mode (:search/mode @state/state)]
    (cond
      (and (= search-mode :graph) (not sidebar?))
      "Add graph filter"

      :else
      "What are you looking for?")))

(rum/defc input-row
  [state all-items opts]
  (let [highlighted-item @(::highlighted-item state)
        input @(::input state)
        input-ref (::input-ref state)]
    ;; use-effect [results-ordered input] to check whether the highlighted item is still in the results,
    ;; if not then clear that puppy out!
    ;; This was moved to a functional component
    (rum/use-effect! (fn []
                       (when (and highlighted-item (= -1 (.indexOf all-items (dissoc highlighted-item :mouse-enter-triggered-highlight))))
                         (reset! (::highlighted-item state) nil)))
      [all-items])
    (rum/use-effect! (fn [] (load-results :default state)) [])
    [:div {:class "bg-gray-02 border-b border-1 border-gray-07"}
     [:input.cp__cmdk-search-input
      {:class "text-xl bg-transparent border-none w-full outline-none px-3 py-3"
       :auto-focus true
       :autoComplete "off"
       :placeholder (input-placeholder false)
       :ref #(when-not @input-ref (reset! input-ref %))
       :on-change (fn [e]
                    (let [new-value (.-value (.-target e))]
                      (handle-input-change state e)
                      (when-let [on-change (:on-input-change opts)]
                        (on-change new-value))))
       :on-blur (fn [_e]
                  (when-let [on-blur (:on-input-blur opts)]
                    (on-blur input)))
       :on-composition-end (fn [e] (handle-input-change state e))
       :on-key-down (fn [e]
                      (p/let [value (.-value @input-ref)
                              last-char (last value)
                              backspace? (= (util/ekey e) "Backspace")
                              filter-group (:group @(::filter state))
                              slash? (= (util/ekey e) "/")
                              namespace-pages (when (and slash? (contains? #{:whiteboards} filter-group))
                                                (search/block-search (state/get-current-repo) (str value "/") {}))
                              namespace-page-matched? (some #(string/includes? % "/") namespace-pages)]
                        (when (and filter-group
                                (or (and slash? (not namespace-page-matched?))
                                  (and backspace? (= last-char "/"))
                                  (and backspace? (= input ""))))
                          (reset! (::filter state) nil)
                          (load-results :default state))))
       :default-value input}]]))

(defn rand-tip
  []
  (rand-nth
    [[:div.flex.flex-row.gap-1.items-center.opacity-50.hover:opacity-100
      [:div "Type"]
      (shui/shortcut "/")
      [:div "to filter search results"]]
     [:div.flex.flex-row.gap-1.items-center.opacity-50.hover:opacity-100
      (shui/shortcut ["mod" "enter"])
      [:div "to open search in the sidebar"]]]))

(rum/defcs tip <
  {:init (fn [state]
           (assoc state ::rand-tip (rand-tip)))}
  [inner-state state]
  (let [filter @(::filter state)]
    (cond
      filter
      [:div.flex.flex-row.gap-1.items-center.opacity-50.hover:opacity-100
       [:div "Type"]
       (shui/shortcut "esc" {:tiled false})
       [:div "to clear search filter"]]

      :else
      (::rand-tip inner-state))))

(rum/defc hint-button
  [text shortcut opts]
  (shui/button
    (merge {:class "hint-button [&>span:first-child]:hover:opacity-100 opacity-40 hover:opacity-80"
            :variant :ghost
            :size  :sm}
      opts)
    [[:span.opacity-60 text]
     ;; shortcut
     (when (not-empty shortcut)
       (for [key shortcut]
         [:div.ui__button-shortcut-key
          (case key
            "cmd" [:div (if goog.userAgent/MAC "⌘" "Ctrl")]
            "shift" [:div "⇧"]
            "return" [:div "⏎"]
            "esc" [:div.tracking-tightest {:style {:transform   "scaleX(0.8) scaleY(1.2) "
                                                   :font-size   "0.5rem"
                                                   :font-weight "500"}} "ESC"]
            (cond-> key (string? key) .toUpperCase))]))]))

(rum/defc hints
  [state]
  (let [action (state->action state)
        button-fn (fn [text shortcut & {:as opts}]
                    (hint-button text shortcut
                      {:on-click #(handle-action action (assoc state :opts opts) %)
                       :muted    true}))]
    (when action
      [:div.hints
       [:div.text-sm.leading-6
        [:div.flex.flex-row.gap-1.items-center
         [:div.font-medium.text-gray-12 "Tip:"]
         (tip state)]]

       [:div.gap-2.hidden.md:flex {:style {:margin-right -6}}
        (case action
          :open
          [:<>
           (button-fn "Open" ["return"])
           (button-fn "Open in sidebar" ["shift" "return"] {:open-sidebar? true})
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
   (shui/button
     {:variant  :ghost
      :size     :icon
      :class    "p-1 scale-75"
      :on-click (fn []
                  (reset! (::filter state) nil))}
     (shui/tabler-icon "x"))])

(rum/defcs cmdk
  < rum/static
    rum/reactive
    {:will-mount
     (fn [state]
       (when-not (:sidebar? (last (:rum/args state)))
         (shortcut/unlisten-all!))
       state)

     :will-unmount
     (fn [state]
       (when-not (:sidebar? (last (:rum/args state)))
         (shortcut/listen-all!))
       state)}
    {:init (fn [state]
             (let [search-mode (:search/mode @state/state)
                   opts (last (:rum/args state))]
               (assoc state
                 ::ref (atom nil)
                 ::filter (if (and search-mode
                                (not (contains? #{:global :graph} search-mode))
                                (not (:sidebar? opts)))
                            (atom {:group search-mode})
                            (atom nil))
                 ::input (atom (or (:initial-input opts) "")))))
     :will-unmount (fn [state]
                     (state/set-state! :search/mode nil)
                     state)}
    (mixins/event-mixin
      (fn [state]
        (let [ref @(::ref state)]
          (mixins/on-key-down state {}
            {:target ref
             :all-handler (fn [e _key] (keydown-handler state e))})
          (mixins/on-key-up state {} (fn [e _key]
                                       (keyup-handler state e))))))
    (rum/local false ::shift?)
    (rum/local false ::meta?)
    (rum/local nil ::highlighted-group)
    (rum/local nil ::highlighted-item)
    (rum/local default-results ::results)
    (rum/local nil ::load-results-throttled)
    (rum/local nil ::scroll-container-ref)
    (rum/local nil ::input-ref)
    (rum/local false ::input-changed?)
  [state {:keys [sidebar?] :as opts}]
  (let [*input (::input state)
        search-mode (:search/mode @state/state)
        group-filter (:group (rum/react (::filter state)))
        results-ordered (state->results-ordered state search-mode)
        all-items (mapcat last results-ordered)
        first-item (first all-items)]
    [:div.cp__cmdk {:ref #(when-not @(::ref state) (reset! (::ref state) %))
                    :class (cond-> "w-full h-full relative flex flex-col justify-start"
                             (not sidebar?) (str " rounded-lg"))}
     (input-row state all-items opts)
     [:div {:class (cond-> "w-full flex-1 overflow-y-auto min-h-[65dvh] max-h-[65dvh]"
                     (not sidebar?) (str " pb-14"))
            :ref #(let [*ref (::scroll-container-ref state)]
                    (when-not @*ref (reset! *ref %)))
            :style {:background "var(--lx-gray-02)"
                    :scroll-padding-block 32}}

      (when group-filter
        [:div.flex.flex-col.px-3.py-1.opacity-70.text-sm
         (search-only state (string/capitalize (name group-filter)))])

      (let [items (filter
                    (fn [[_group-name group-key group-count _group-items]]
                      (and (not= 0 group-count)
                        (if-not group-filter true
                                             (or (= group-filter group-key)
                                               (and (= group-filter :nodes)
                                                 (= group-key :current-page))
                                               (and (contains? #{:create} group-filter)
                                                 (= group-key :create))))))
                    results-ordered)]
        (if (seq items)
          (for [[group-name group-key _group-count group-items] items]
            (let [title (string/capitalize group-name)]
              (result-group state title group-key group-items first-item sidebar?)))
          [:div.flex.flex-col.p-4.opacity-50
           (when-not (string/blank? @*input)
             "No matched results")]))]
     (when-not sidebar? (hints state))]))

(rum/defc cmdk-modal [props]
  [:div {:class "cp__cmdk__modal rounded-lg w-[90dvw] max-w-4xl relative"}
   (cmdk props)])

(rum/defc cmdk-block [props]
  [:div {:class "cp__cmdk__block rounded-md"}
   (cmdk props)])
