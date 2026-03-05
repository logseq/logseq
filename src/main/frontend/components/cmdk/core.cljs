(ns frontend.components.cmdk.core
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.components.block :as block]
            [frontend.components.cmdk.list-item :as list-item]
            [frontend.components.cmdk.scroll :as scroll]
            [frontend.components.cmdk.state :as cmdk-state]
            [frontend.components.icon :as icon-component]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.db.model :as model]
            [frontend.extensions.pdf.utils :as pdf-utils]
            [frontend.handler.block :as block-handler]
            [frontend.handler.command-palette :as cp-handler]
            [frontend.handler.db-based.page :as db-page-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.route :as route-handler]
            [frontend.mixins :as mixins]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.modules.shortcut.utils :as shortcut-utils]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.page :as page-util]
            [frontend.util.ref :as ref]
            [frontend.util.text :as text-util]
            [goog.functions :as gfun]
            [goog.object :as gobj]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [rum.core :as rum]))

(defn- get-action
  []
  (:action (:search/args @state/state)))

(defn translate [t {:keys [id desc]}]
  (when id
    (let [desc-i18n (t (shortcut-utils/decorate-namespace id))]
      (if (string/starts-with? desc-i18n "{Missing key")
        desc
        desc-i18n))))

(defn- get-group-limit
  [group]
  (if (= group :nodes)
    10
    5))

(defn filters
  []
  (let [current-page (state/get-current-page)]
    (->>
     [(when current-page
        {:filter {:group :current-page} :text "Search only current page" :info "Add filter to search" :icon-theme :gray :icon "file"})
      {:filter {:group :nodes} :text "Search only nodes" :info "Add filter to search" :icon-theme :gray :icon "point-filled"}
      {:filter {:group :code} :text "Search only code" :info "Add filter to search" :icon-theme :gray :icon "code"}
      {:filter {:group :commands} :text "Search only commands" :info "Add filter to search" :icon-theme :gray :icon "command"}
      {:filter {:group :files} :text "Search only files" :info "Add filter to search" :icon-theme :gray :icon "file"}
      {:filter {:group :themes} :text "Search only themes" :info "Add filter to search" :icon-theme :gray :icon "palette"}]
     (remove nil?))))

;; The results are separated into groups, and loaded/fetched/queried separately
(def default-results
  {:recently-updated-pages {:status :success :show :less :items nil}
   :commands       {:status :success :show :less :items nil}
   :favorites      {:status :success :show :less :items nil}
   :current-page   {:status :success :show :less :items nil}
   :nodes          {:status :success :show :less :items nil}
   :code           {:status :success :show :less :items nil}
   :files          {:status :success :show :less :items nil}
   :themes         {:status :success :show :less :items nil}
   :filters        {:status :success :show :less :items nil}})

(defn get-class-from-input
  [input]
  (string/replace input #"^#+" ""))

(defn create-items [q]
  (when (and (not (string/blank? q))
             (not (#{"config.edn" "custom.js" "custom.css"} q))
             (not config/publishing?))
    (let [class? (string/starts-with? q "#")
          class-name (get-class-from-input q)
          class (let [class (db/get-case-page class-name)]
                  (when (ldb/class? class)
                    class))]
      (->> [{:text (cond
                     class "Configure tag"
                     class? "Create tag"
                     :else "Create page")
             :icon (if class "settings" "new-page")
             :icon-theme :gray
             :info (cond
                     class
                     (str "Configure #" class-name)
                     class?
                     (str "Create tag called '" class-name "'")
                     :else
                     (str "Create page called '" q "'"))
             :source-create :page
             :class class}]
           (remove nil?)))))

;; Take the results, decide how many items to show, and order the results appropriately
(defn state->results-ordered
  [state search-mode]
  (let [sidebar? (:sidebar? (last (:rum/args state)))
        results @(::results state)
        input @(::input state)
        filter' @(::filter state)
        filter-group (:group filter')
        index (volatile! -1)
        visible-items (fn [group]
                        (let [{:keys [items show]} (get results group)]
                          (cond
                            (or sidebar? (= group filter-group))
                            items

                            (= :more show)
                            items

                            :else
                            (take (get-group-limit group) items))))
        node-exists? (let [blocks-result (keep :source-block (get-in results [:nodes :items]))]
                       (when-not (string/blank? input)
                         (some (fn [block]
                                 (and
                                  (:page? block)
                                  (= (util/page-name-sanity-lc input) (util/page-name-sanity-lc (:block.temp/original-title block))))) blocks-result)))
        include-slash? (string/includes? input "/")
        start-with-slash? (string/starts-with? input "/")
        order* (cond
                 (= search-mode :graph)
                 []

                 start-with-slash?
                 [["Filters" :filters (visible-items :filters)]
                  ["Current page"   :current-page   (visible-items :current-page)]
                  ["Nodes"          :nodes         (visible-items :nodes)]]

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
                  [(cond
                     (= filter-group :current-page) "Current page"
                     (= filter-group :code) "Code"
                     :else (name filter-group))
                   filter-group
                   (visible-items filter-group)]
                  (when-not node-exists?
                    ["Create"         :create         (create-items input)])]

                 :else
                 (->>
                  [(when-not node-exists?
                     ["Create"         :create       (create-items input)])
                   ["Current page"     :current-page   (visible-items :current-page)]
                   ["Nodes"            :nodes         (visible-items :nodes)]
                   ["Recently updated" :recently-updated-pages (visible-items :recently-updated-pages)]
                   ["Commands"         :commands       (visible-items :commands)]
                   ["Files"            :files          (visible-items :files)]
                   ["Filters"          :filters        (visible-items :filters)]]
                  (remove nil?)))
        order (remove nil? order*)]
    (for [[group-name group-key group-items] order]
      [group-name
       group-key
       (if (= group-key :create)
         (count group-items)
         (count (get-in results [group-key :items])))
       (mapv #(assoc % :group group-key :item-index (vswap! index inc)) group-items)])))

(defn state->highlighted-item [state]
  (or (some-> state ::highlighted-item deref)
      (first @(::all-items-cache state))))

(defn state->action [state]
  (let [highlighted-item (state->highlighted-item state)
        action (get-action)]
    (cond (and (:source-block highlighted-item) (= action :move-blocks)) :trigger
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
  (when-let [db (db/get-db)]
    (let [!results (::results state)
          recent-pages (map (fn [block]
                              (let [text (block-handler/block-unique-title block :truncate? false)
                                    icon (icon-component/get-node-icon-cp block {:ignore-current-icon? true})]
                                {:icon icon
                                 :icon-theme :gray
                                 :text text
                                 :source-block block}))
                            (ldb/get-recent-updated-pages db))]
      (reset! !results (assoc-in default-results [:recently-updated-pages :items] recent-pages)))))

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

(defmethod load-results :recently-updated-pages [group state]
  (let [!input (::input state)
        !results (::results state)]
    (swap! !results assoc-in [group :status] :loading)
    (let [recent-pages (ldb/get-recent-updated-pages (db/get-db))
          search-results (if (string/blank? @!input)
                           recent-pages
                           (search/fuzzy-search recent-pages @!input {:extract-fn :block/title}))]
      (->> search-results
           (map (fn [block]
                  (let [text (block-handler/block-unique-title block :truncate? false)
                        icon (icon-component/get-node-icon-cp block {:ignore-current-icon? true})]
                    {:icon icon
                     :icon-theme :gray
                     :text text
                     :source-block block})))
           (hash-map :status :success :items)
           (swap! !results update group merge)))))

(defn highlight-content-query
  "Return hiccup of highlighted content FTS result"
  [content q]
  (when-not (or (string/blank? content) (string/blank? q))
    [:span (loop [content content ;; why recur? because there might be multiple matches
                  result  []]
             (let [[b-cut hl-cut e-cut] (text-util/cut-by content "$pfts_2lqh>$" "$<pfts_2lqh$")
                   hiccups-add [[:span b-cut]
                                [:mark.p-0.rounded-none hl-cut]]
                   hiccups-add (remove nil? hiccups-add)
                   new-result (concat result hiccups-add)]
               (if-not (string/blank? e-cut)
                 (recur e-cut new-result)
                 new-result)))]))

(defn page-item
  [repo page current-page-uuid input]
  (let [entity (-> (or (db/entity [:block/uuid (:block/uuid page)]) page)
                   (update :block/tags (fn [tags]
                                         (map (fn [tag]
                                                (if (integer? tag)
                                                  (db/entity tag)
                                                  tag)) tags))))
        source-page (or (model/get-alias-source-page repo (:db/id entity))
                        (:alias page))
        result-page-id (or (:block/uuid source-page)
                           (:block/uuid entity)
                           (:block/uuid page))
        current-page? (and current-page-uuid
                           (= current-page-uuid result-page-id))
        icon (icon-component/get-node-icon-cp entity {:ignore-current-icon? true})
        title (block-handler/block-unique-title entity
                                                :alias (:block/title source-page)
                                                :truncate? false)]
    (hash-map :icon icon
              :icon-theme :gray
              :text (if (string/includes? title "$pfts_2lqh>$") ; sqlite matched
                      [:span {"data-testid" title}
                       (highlight-content-query title input)]
                      title)
              :header (when (:block/parent entity)
                        (block/breadcrumb {:disable-preview? true
                                           :search? true} repo (:block/uuid page)
                                          {:disabled? true}))
              :result-type :page
              :current-page? current-page?
              :alias (:alias page)
              :source-block (or source-page page))))

(defn block-item
  [repo block current-page-uuid input]
  (let [id (:block/uuid block)
        text (block-handler/block-unique-title block :truncate? false)
        icon (icon-component/get-node-icon-cp block {:ignore-current-icon? true})]
    {:icon icon
     :icon-theme :gray
     :text (highlight-content-query text input)
     :header (block/breadcrumb {:disable-preview? true
                                :search? true} repo id
                               {:disabled? true})
     :result-type :block
     :current-page? (when-let [page-id (:block/page block)]
                      (= page-id current-page-uuid))
     :source-block block}))

;; The blocks search action uses an existing handler
(defmethod load-results :nodes [group state]
  (let [!input (::input state)
        !results (::results state)
        repo (state/get-current-repo)
        current-page-uuid (page-util/get-current-page-uuid)
        opts (cmdk-state/cmdk-block-search-options
              {:filter-group :nodes
               :dev? config/dev?
               :action (get-action)})]
    (swap! !results assoc-in [group :status] :loading)
    (swap! !results assoc-in [:current-page :status] :loading)
    (p/let [blocks (search/block-search repo @!input opts)
            blocks (remove nil? blocks)
            items (keep (fn [block]
                          (if (:page? block)
                            (page-item repo block current-page-uuid @!input)
                            (block-item repo block current-page-uuid @!input))) blocks)]
      (if (= group :current-page)
        (let [items-on-current-page (filter :current-page? items)]
          (swap! !results update group merge {:status :success :items items-on-current-page}))
        (swap! !results update group merge {:status :success :items items})))))

(defmethod load-results :code [group state]
  (let [!input (::input state)
        !results (::results state)
        repo (state/get-current-repo)
        current-page (when-let [id (page-util/get-current-page-id)]
                       (db/entity id))
        opts (cmdk-state/cmdk-block-search-options
              {:filter-group :code
               :dev? config/dev?})]
    (swap! !results assoc-in [group :status] :loading)
    (p/let [blocks (search/block-search repo @!input opts)
            blocks (remove nil? blocks)
            items (map (fn [block]
                         (block-item repo block current-page @!input))
                       blocks)]
      (swap! !results update group merge {:status :success :items items}))))

(defmethod load-results :files [group state]
  (let [!input (::input state)
        !results (::results state)]
    (swap! !results assoc-in [group :status] :loading)
    (p/let [files (search/file-search @!input 99)
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
                        (filters)
                        (search/fuzzy-search (filters) q {:extract-fn :text}))]
    (swap! !results update group merge {:status :success :items matched-items})))

(defmethod load-results :current-page [group state]
  (if-let [current-page (when-let [id (page-util/get-current-page-id)]
                          (db/entity id))]
    (let [!results (::results state)
          !input (::input state)
          repo (state/get-current-repo)
          opts (cmdk-state/cmdk-block-search-options
                {:filter-group :current-page
                 :dev? config/dev?
                 :page-uuid (:block/uuid current-page)})]
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
                              :header (block/breadcrumb {:search? true} repo id {:disabled? true})
                              :result-type (if (:page? block) :page :block)
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
          (load-results :recently-updated-pages state)
          ;; (load-results :recents state)
          )))))

(defn- copy-block-ref [state]
  (when-let [block-uuid (some-> state state->highlighted-item :source-block :block/uuid)]
    (editor-handler/copy-block-ref! block-uuid ref/->block-ref)
    (shui/dialog-close! :ls-dialog-cmdk)))

(defmulti handle-action (fn [action _state _event] action))

(defn- get-highlighted-page-uuid-or-name
  [state]
  (let [highlighted-item (some-> state state->highlighted-item)
        block (or (:alias highlighted-item)
                  (:source-block highlighted-item))]
    (:block/uuid block)))

(defmethod handle-action :open-page [_ state _event]
  (when-let [page-name (get-highlighted-page-uuid-or-name state)]
    (let [page-uuid (get (db/get-page page-name) :block/uuid
                         (when (uuid? page-name) page-name))]
      (route-handler/redirect-to-page! page-uuid))
    (shui/dialog-close! :ls-dialog-cmdk)))

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
              (model/parents-collapsed? (state/get-current-repo) block-id)
              (route-handler/redirect-to-page! block-id)
              :else
              (route-handler/redirect-to-page! (:block/uuid page) {:anchor (str "ls-block-" block-id)}))
            (shui/dialog-close! :ls-dialog-cmdk)))))))

(defmethod handle-action :open-page-right [_ state _event]
  (when-let [page-name (get-highlighted-page-uuid-or-name state)]
    (let [page (db/get-page page-name)]
      (when page
        (editor-handler/open-block-in-sidebar! (:block/uuid page))))
    (shui/dialog-close! :ls-dialog-cmdk)))

(defmethod handle-action :open-block-right [_ state _event]
  (when-let [block-uuid (some-> state state->highlighted-item :source-block :block/uuid)]
    (p/let [repo (state/get-current-repo)
            _ (db-async/<get-block repo block-uuid :children? false)]
      (editor-handler/open-block-in-sidebar! block-uuid)
      (shui/dialog-close! :ls-dialog-cmdk))))

(defn- open-file
  [file-path]
  (route-handler/redirect! {:to :file
                            :path-params {:path file-path}}))

(defn- page-item?
  [item]
  (let [block-uuid (:block/uuid (:source-block item))]
    (or (boolean (:source-block item))
        (and block-uuid (:block/name (db/entity [:block/uuid block-uuid]))))))

(defn- event-shift?
  [event]
  (boolean
   (cond
     (map? event) (:shift? event)
     :else (gobj/getValueByKeys event "shiftKey"))))

(defmethod handle-action :open [_ state event]
  (when-let [item (some-> state state->highlighted-item)]
    (let [page? (page-item? item)
          block? (boolean (:source-block item))
          shift? (event-shift? event)
          shift-or-sidebar? (or shift? (boolean (:open-sidebar? (:opts state))))
          search-mode (:search/mode @state/state)
          graph-view? (= search-mode :graph)]
      (cond
        (:file-path item) (do
                            (open-file (:file-path item))
                            (shui/dialog-close! :ls-dialog-cmdk))
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
  (let [highlighted-item (some-> state state->highlighted-item)
        command (:source-command highlighted-item)
        dont-close-commands #{:graph/open :graph/remove :dev/replace-graph-with-db-file :misc/import-edn-data :editor/move-blocks}
        search-args (:search/args @state/state)
        action (or (:action command)
                   (when-let [trigger (:trigger search-args)]
                     #(trigger highlighted-item)))
        input-ref @(::input-ref state)]
    (when action
      (set! (.-value input-ref) "")
      (.focus input-ref)
      (action)
      (when-not (contains? dont-close-commands (:id command))
        (shui/dialog-close! :ls-dialog-cmdk)))))

(defmethod handle-action :create [_ state _event]
  (let [item (state->highlighted-item state)
        !input (::input state)
        create-class? (string/starts-with? @!input "#")
        create-page? (= :page (:source-create item))
        class (when create-class? (get-class-from-input @!input))]
    (if (and (= (:text item) "Configure tag") (:class item))
      (state/pub-event! [:dialog/show-block (:class item) {:tag-dialog? true}])
      (p/let [result (cond
                       create-class?
                       (db-page-handler/<create-class! class
                                                       {:redirect? false})
                       create-page? (page-handler/<create! @!input {:redirect? true}))]
        (shui/dialog-close! :ls-dialog-cmdk)
        (when (and create-class? result)
          (state/pub-event! [:dialog/show-block result {:tag-dialog? true}]))))))

(defn- get-filter-user-input
  [input]
  (cond
    (string/includes? input "/")
    (first (common-util/split-last "/" input))
    (string/starts-with? input "/")
    ""
    :else
    input))

(defn- persist-cmdk-query-state!
  [state]
  (let [input-ref @(::input-ref state)
        input-value (or (some-> input-ref .-value)
                        @(::input state))
        _ (when (not= input-value @(::input state))
            (reset! (::input state) input-value))
        opts (last (:rum/args state))]
    (cmdk-state/persist-last-cmdk-search!
     opts
     (:search/mode @state/state)
     (:search/args @state/state)
     (state/get-current-repo)
     input-value
     @(::filter state))))

(defn- clear-filter-and-refresh!
  [state]
  (let [filter-group (:group @(::filter state))]
    (reset! (::filter state) nil)
    (reset! (::focus-source state) :keyboard)
    (state/set-state! :search/mode :global)
    (swap! (::results state) assoc-in [filter-group :items] nil)
    (persist-cmdk-query-state! state)
    (load-results :default state)
    (.focus @(::input-ref state))))

(defmethod handle-action :filter [_ state _event]
  (let [item (some-> state state->highlighted-item)
        !input (::input state)
        input-ref @(::input-ref state)]
    (let [value (get-filter-user-input @!input)]
      (reset! !input value)
      (set! (.-value input-ref) value))
    (let [!filter (::filter state)
          group (get-in item [:filter :group])]
      (swap! !filter assoc :group group)
      (reset! (::focus-source state) :keyboard)
      (persist-cmdk-query-state! state)
      (load-results group state)
      (.focus input-ref))))

(defmethod handle-action :theme [_ state _event]
  (when-let [item (some-> state state->highlighted-item)]
    (js/LSPluginCore.selectTheme (bean/->js (:source-theme item)))
    (shui/dialog-close!)))

(defmethod handle-action :default [_ state event]
  (when-let [action (state->action state)]
    (handle-action action state event)))

(def ^:private scroll-padding
  "Pixel clearance reserved at the top and bottom of the scroll container."
  32)

;; --- Synchronous keyboard highlight DOM manipulation ---
;; React/Rum re-renders asynchronously (via rAF). When a keydown fires,
;; scrollTop is set synchronously but the highlight attribute is only updated in
;; the next frame when React reconciles - producing a visible 1-frame gap.
;; `sync-keyboard-highlight!` toggles [data-kb-highlighted] directly so
;; both changes land in the same browser paint frame.

(defn- sync-keyboard-highlight!
  "Synchronously toggles [data-kb-highlighted] on the DOM, with CSS
  transition suppressed to prevent flicker."
  [container old-item-idx new-item-idx]
  ;; Clear old highlight - suppress transition, remove attribute, restore transition.
  (when-let [old-el (if (some? old-item-idx)
                      (.querySelector container (str "[data-item-index='" old-item-idx "'] [data-cmdk-item]"))
                      (.querySelector container "[data-kb-highlighted]"))]
    (set! (.-transition (.-style old-el)) "none")
    (.removeAttribute old-el "data-kb-highlighted")
    (js/requestAnimationFrame #(set! (.-transition (.-style old-el)) "")))
  ;; Set new highlight - suppress transition for instant appearance, restore after.
  (when-let [new-el (.querySelector container (str "[data-item-index='" new-item-idx "'] [data-cmdk-item]"))]
    (set! (.-transition (.-style new-el)) "none")
    (.setAttribute new-el "data-kb-highlighted" "true")
    (js/requestAnimationFrame #(set! (.-transition (.-style new-el)) ""))))

(defn- scroll-to-highlight!
  "Updates the scroll position to bring the highlighted row into view.

  - Row not yet rendered (lazy-visible placeholder, no [data-cmdk-item] child)
    -> defers scrolling until item mount callback re-enters this function.
    No scroll is attempted until the item is present.
    (`focus-height <= 4` serves as a structural fallback for edge cases.)

  - Row outside viewport -> instant snap (`scrollTop` assignment).
    During rapid key-repeat (~30 ms) even native smooth scroll cannot converge
    before the next event fires, leaving the row partially or fully out of view.

  - Row inside viewport but within scroll-padding zone -> browser-native smooth
    scroll via `scrollTo {behavior: 'smooth'}` for a small (<=32 px) nudge.

  - Wrap-around (first -> last): in long lists the target is outside the current
    viewport and instant snap applies. In short lists where all items are visible
    the item may remain in viewport; logic is unified via item-in-viewport?."
  [state row-el]
  (when-let [container @(::scroll-container-ref state)]
    (when row-el
      (let [highlighted-item-idx (some-> state state->highlighted-item :item-index)
            row-item-idx (some-> (.closest row-el "[data-item-index]")
                                 (.getAttribute "data-item-index"))
            stale-row? (and (some? highlighted-item-idx)
                            (some? row-item-idx)
                            (not= (str highlighted-item-idx) row-item-idx))]
        (when-not stale-row?
          (when-let [rect (scroll/focus-row-visible-rect container row-el)]
            (let [focus-height (:focus-height rect)
                  not-rendered? (or (not (.querySelector row-el "[data-cmdk-item]"))
                                    (<= focus-height 4))]
              (when-not not-rendered?
                (let [current-top (.-scrollTop container)
                      viewport-h (.-clientHeight container)
                      focus-top (:focus-top rect)
                      focus-bottom (+ focus-top focus-height)
                      item-in-viewport? (and (>= focus-top current-top)
                                             (<= focus-bottom (+ current-top viewport-h)))
                      target-top (scroll/ensure-focus-visible-scroll-top
                                  (assoc rect
                                         :scroll-padding-top    scroll-padding
                                         :scroll-padding-bottom scroll-padding))]
                  (reset! (::pending-scroll-item-idx state) nil)
                  (when (not= target-top (js/Math.round current-top))
                    (if item-in-viewport?
                      (.scrollTo container #js {:top target-top :behavior "smooth"})
                      (set! (.-scrollTop container) target-top))))))))))))

(defn- on-item-mounted-scroll!
  "Runs deferred keyboard scroll correction when the highlighted row mounts."
  [state item-idx item-el]
  (when (and item-el
             (scroll/should-scroll-on-item-mounted?
              @(::focus-source state)
              @(::pending-scroll-item-idx state)
              (some-> state state->highlighted-item :item-index)
              item-idx))
    (when-let [row-el (.closest item-el "[data-item-index]")]
      (scroll-to-highlight! state row-el))))

(rum/defc render-result-list-item < rum/static
  [state group highlighted? mouse-mode? item hls-page? text input]
  (let [item-idx (:item-index item)
        scroll-root @(::scroll-container-ref state)
        item (list-item/root
              (assoc item
                     :group group
                     :query (when-not (= group :create) input)
                     :text (if hls-page? (pdf-utils/fix-local-asset-pagename text) text)
                     :hls-page? hls-page?
                     :compact true
                     :rounded true
                     :hoverable mouse-mode?
                     :highlighted highlighted?
                     :on-mounted (fn [item-el]
                                   (on-item-mounted-scroll! state item-idx item-el))
                     :on-click (fn [e]
                                 (util/stop-propagation e)
                                 (reset! (::highlighted-item state) item)
                                 (handle-action :default state e)
                                 (when-let [on-click (:on-click item)]
                                   (on-click e)))
                     :on-mouse-move (fn [e]
                                      (let [dx (or (.-movementX e) 0)
                                            dy (or (.-movementY e) 0)
                                            real-pointer-move? (or (not (zero? dx))
                                                                   (not (zero? dy)))]
                                        (when real-pointer-move?
                                          (when-not (= :mouse @(::focus-source state))
                                            (reset! (::focus-source state) :mouse))
                                          (when (not= item @(::highlighted-item state))
                                            (reset! (::highlighted-item state) item))))))
              nil)]
    [:div {:data-item-index item-idx}
     (if (= group :nodes)
       (ui/lazy-visible (fn [] item) {:root scroll-root
                                      :root-margin "500px 0px"})
       item)]))

(rum/defcs result-group
  < rum/reactive
  [state' state title group visible-items first-item sidebar?]
  (let [{:keys [show items]} (some-> state ::results deref group)
        focus-source @(::focus-source state)
        highlighted-item (or @(::highlighted-item state)
                             (when (= :keyboard focus-source) first-item))
        mouse-mode? (= :mouse focus-source)
        input @(::input state)
        filter' @(::filter state)
        can-show-less? (< (get-group-limit group) (count visible-items))
        can-show-more? (< (count visible-items) (count items))
        show-less #(swap! (::results state) assoc-in [group :show] :less)
        show-more #(swap! (::results state) assoc-in [group :show] :more)]
    [:div {:class         (if (= title "Create")
                            "border-b border-gray-06 last:border-b-0"
                            "border-b border-gray-06 pb-1 last:border-b-0")}
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
             "99+"
             (count items))])

        [:div {:class "flex-1"}]

        (when (and (or can-show-more? can-show-less?)
                   (empty? filter')
                   (not sidebar?))
          [:a.text-link.select-node.opacity-50.hover:opacity-90
           {:on-click (fn [e]
                        (util/stop e)
                        (reset! (::focus-source state) :mouse)
                        (.focus @(::input-ref state))
                        ((if (= show :more) show-less show-more)))}
           (if (= show :more)
             [:div.flex.flex-row.gap-1.items-center
              "Show less"
              (shui/shortcut "mod up" {:style :compact})]
             [:div.flex.flex-row.gap-1.items-center
              "Show more"
              (shui/shortcut "mod down" {:style :compact})])])])

     [:div.search-results
      (for [item visible-items
            :let [highlighted? (= item highlighted-item)
                  page? (= "file" (some-> item :icon))
                  text (some-> item :text)
                  source-block (some-> item :source-block)
                  hls-page? (and page? (pdf-utils/hls-file? (:block/title source-block)))]]
        (rum/with-key
          (render-result-list-item state group highlighted? mouse-mode? item hls-page? text input)
          (:item-index item)))]]))

(defn move-highlight
  [state n]
  (let [items @(::all-items-cache state)
        focus-source @(::focus-source state)
        highlighted-item (some-> state ::highlighted-item deref)
        old-item-idx (some-> highlighted-item :item-index)
        fallback-highlighted? (and (nil? highlighted-item)
                                   (= :keyboard focus-source)
                                   (seq items))
        cur-item-idx (cond
                       highlighted-item
                       (let [idx (:item-index highlighted-item)]
                         (if (and (some? idx) (= highlighted-item (nth items idx nil)))
                           idx
                           (.indexOf items highlighted-item)))
                       fallback-highlighted? 0
                       :else nil)
        items-count (count items)]
    (if (pos? items-count)
      (let [base-idx (if (some? cur-item-idx)
                       cur-item-idx
                       (if (pos? n) -1 0))
            raw-idx (+ base-idx n)
            next-item-idx (mod raw-idx items-count)
            next-highlighted-item (nth items next-item-idx nil)]
        (if next-highlighted-item
          (let [container @(::scroll-container-ref state)
                next-idx (:item-index next-highlighted-item)]
            (when (and container next-idx)
              (sync-keyboard-highlight! container old-item-idx next-idx))
            (reset! (::highlighted-item state) next-highlighted-item)
            (when (and container next-idx)
              (reset! (::pending-scroll-item-idx state) next-idx)
              (when-let [el (.querySelector container (str "[data-item-index='" next-idx "']"))]
                (scroll-to-highlight! state el))))
          (do
            (reset! (::pending-scroll-item-idx state) nil)
            (reset! (::highlighted-item state) nil))))
      (do
        (reset! (::pending-scroll-item-idx state) nil)
        (reset! (::highlighted-item state) nil)))))

(defn handle-input-change
  ([state e] (handle-input-change state e (.. e -target -value)))
  ([state e input]
   (let [composing? (util/native-event-is-composing? e)
         e-type (gobj/getValueByKeys e "type")
         composing-end? (= e-type "compositionend")
         !input (::input state)
         input-ref @(::input-ref state)
         container @(::scroll-container-ref state)]
     ;; update the input value in the UI
     (reset! !input input)
     (set! (.-value input-ref) input)
     (reset! (::focus-source state) :keyboard)
     (reset! (::highlighted-item state) nil)
     (reset! (::pending-scroll-item-idx state) nil)
     (when container
       (set! (.-scrollTop container) 0))
     ;; retrieve the load-results function and update all the results
     (when (or (not composing?) composing-end?)
       (persist-cmdk-query-state! state)
       (load-results :default state)))))

(defn- open-current-item-link
  "Opens a link for the current item if a page or block. For pages, opens the
  first :url property"
  [state]
  (let [item (some-> state state->highlighted-item)
        repo (state/get-current-repo)]
    (cond
      (page-item? item)
      (p/let [page (some-> (get-highlighted-page-uuid-or-name state) db/get-page)
              _ (db-async/<get-block repo (:block/uuid page) :children? false)
              page' (db/entity repo [:block/uuid (:block/uuid page)])
              link (some (fn [[k v]]
                           (when (= :url (:logseq.property/type (db/entity repo k)))
                             (:block/title v)))
                         (:block/properties page'))]
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
  (let [meta? (util/meta-key? e)
        ctrl? (.-ctrlKey e)
        keyname (.-key e)
        enter? (= keyname "Enter")
        esc? (= keyname "Escape")
        composing? (util/goog-event-is-composing? e)
        shift? (.-shiftKey e)
        highlighted-group (some-> (state->highlighted-item state) :group)
        show-less (fn []
                    (when highlighted-group
                      (swap! (::results state) assoc-in [highlighted-group :show] :less)))
        show-more (fn []
                    (when highlighted-group
                      (swap! (::results state) assoc-in [highlighted-group :show] :more)))
        input @(::input state)
        as-keydown? (or (= keyname "ArrowDown") (and ctrl? (= keyname "n")))
        as-keyup? (or (= keyname "ArrowUp") (and ctrl? (= keyname "p")))]
    (when (or as-keydown? as-keyup?)
      (util/stop e))

    (cond
      (and meta? enter?)
      (let [repo (state/get-current-repo)]
        (shui/dialog-close! :ls-dialog-cmdk)
        (state/sidebar-add-block! repo input :search))
      as-keydown? (if meta?
                    (show-more)
                    (do
                      (reset! (::focus-source state) :keyboard)
                      (move-highlight state 1)))
      as-keyup? (if meta?
                  (show-less)
                  (do
                    (reset! (::focus-source state) :keyboard)
                    (move-highlight state -1)))
      (and enter? (not composing?)) (do
                                      (when shift?
                                        (shui/shortcut-press! "shift+return" true))
                                      (when-not shift?
                                        (shui/shortcut-press! "return" true))
                                      (handle-action :default state e)
                                      (util/stop-propagation e))
      esc? (let [filter' @(::filter state)
                 action (get-action)
                 move-blocks? (= :move-blocks action)]
             (cond
               (and move-blocks? (string/blank? input))
               (state/close-modal!)

               (and filter' (not move-blocks?))
               (do
                 (util/stop e)
                 (clear-filter-and-refresh! state))

               (not (string/blank? input))
               (do
                 (util/stop e)
                 (handle-input-change state nil ""))

               :else
               (shui/dialog-close! :ls-dialog-cmdk)))
      (and meta? (= keyname "c")) (do
                                    (shui/shortcut-press! (if util/mac? "cmd+c" "ctrl+c") true)
                                    (copy-block-ref state)
                                    (util/stop-propagation e))
      (and meta? (= keyname "o"))
      (open-current-item-link state)
      :else nil)))

(defn- keyup-handler
  [state e]
  (let [keyname (.-key e)]
    ;; Reset acceleration when arrow key is released
    (when (or (= keyname "ArrowDown") (= keyname "ArrowUp"))
      (reset! (::accel-start-ts state) nil))))

(defn- input-placeholder
  []
  (let [search-mode (:search/mode @state/state)
        action (get-action)]
    (cond
      (= action :move-blocks)
      "Move blocks to"

      (= search-mode :graph)
      "Add graph filter"

      (= action :new-page)
      "Type a page name to create"

      :else
      "What are you looking for?")))

(rum/defc input-row
  [state all-items opts]
  (let [highlighted-item @(::highlighted-item state)
        input @(::input state)
        input-ref (::input-ref state)
        debounced-on-change (hooks/use-callback
                             (gfun/debounce
                              (fn [e]
                                (let [new-value (.-value (.-target e))]
                                  (handle-input-change state e)
                                  (when-let [on-change (:on-input-change opts)]
                                    (on-change new-value))))
                              200)
                             [])
        debounced-composition-end (hooks/use-callback
                                   (gfun/debounce (fn [e] (handle-input-change state e)) 100)
                                   [])]
    (hooks/use-effect! (fn []
                         (reset! (::all-items-cache state) (vec all-items))
                         (when highlighted-item
                           (let [idx (:item-index highlighted-item)
                                 ;; Fast path via cached :item-index; fall back to .indexOf if stale.
                                 item-present? (or (and (some? idx) (= highlighted-item (nth all-items idx nil)))
                                                   (not= -1 (.indexOf all-items highlighted-item)))]
                             (when-not item-present?
                               (reset! (::highlighted-item state) nil)))))
                       [all-items])
    (hooks/use-effect!
     (fn []
       (let [timeout-id (when-not (:sidebar? opts)
                          (js/setTimeout
                           (fn []
                             (when-let [el @input-ref]
                               (.focus el)
                               (.select el)))
                           0))]
         (load-results :default state)
         (fn []
           (when timeout-id
             (js/clearTimeout timeout-id)))))
     [])
    [:div {:class "bg-gray-02 border-b border-1 border-gray-07"}
     [:input.cp__cmdk-search-input
      {:class "text-xl bg-transparent border-none w-full outline-none px-3 py-3"
       :auto-focus true
       :autoComplete "off"
       :autoCapitalize "off"
       :placeholder (input-placeholder)
       :ref #(when-not @input-ref (reset! input-ref %))
       :on-change debounced-on-change
       :on-blur (fn [_e]
                  (when-let [on-blur (:on-input-blur opts)]
                    (on-blur input)))
       :on-composition-end debounced-composition-end
       :default-value input}]]))

(defn rand-tip
  []
  (rand-nth
   [[:div.flex.flex-row.gap-1.items-center.opacity-50.hover:opacity-100
     [:div "Type"]
     (shui/shortcut "/")
     [:div "to filter search results"]]
    [:div.flex.flex-row.gap-1.items-center.opacity-50.hover:opacity-100
     (shui/shortcut ["mod" "enter"] {:style :combo})
     [:div "to open search in the sidebar"]]]))

(rum/defcs tip <
  {:init (fn [state]
           (assoc state ::rand-tip (rand-tip)))}
  [inner-state state]
  (let [filter' @(::filter state)]
    (cond
      filter'
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
      (let [has-modifier? (and (coll? shortcut)
                               (some #(#{"shift" "ctrl" "alt" "cmd" "mod" "⌘" "⌥" "⌃"}
                                       (string/lower-case (str %)))
                                     shortcut))
            style (if (and (> (count shortcut) 1) has-modifier?)
                    :combo
                    :auto)]
        (shui/shortcut shortcut {:style style
                                 :interactive? false
                                 :aria-hidden? true})))]))

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
           (when (:source-block @(::highlighted-item state)) (button-fn "Copy ref" ["cmd" "c"]))]

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
                 (clear-filter-and-refresh! state))}
    (shui/tabler-icon "x"))])

(defn- cmdk-init-state
  "Initialize cmdk component state atoms."
  [state]
  (let [raw-search-mode (:search/mode @state/state)
        search-mode (or raw-search-mode :global)
        search-args (:search/args @state/state)
        opts (last (:rum/args state))
        {input :input filter-group :filter} (cmdk-state/build-initial-cmdk-search
                                             opts
                                             search-mode
                                             search-args
                                             (state/get-current-repo))]
    (when (nil? raw-search-mode)
      (state/set-state! :search/mode :global))
    (assoc state
           ::ref (atom nil)
           ::filter (atom filter-group)
           ::input (atom input)
           ::input-ref (atom nil)
           ::all-items-cache (atom [])
           ::scroll-container-ref (atom nil)
           ::pending-scroll-item-idx (atom nil)
           ::accel-start-ts (atom nil))))

(defn- cmdk-will-unmount
  "Clean up cmdk component: persist state, clear search mode."
  [state]
  (persist-cmdk-query-state! state)
  (state/set-state! :search/mode nil)
  (state/set-state! :search/args nil)
  state)

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
  {:init cmdk-init-state
   :will-unmount cmdk-will-unmount}
  (mixins/event-mixin
   (fn [state]
     (let [ref @(::ref state)]
       (mixins/on-key-down state {}
                           {:target ref
                            :all-handler (fn [e _key] (keydown-handler state e))})
       (mixins/on-key-up state {} (fn [e _key]
                                    (keyup-handler state e))))))
  (rum/local nil ::highlighted-item)
  (rum/local :keyboard ::focus-source)
  (rum/local default-results ::results)
  [state {:keys [sidebar?] :as opts}]
  (let [*input (::input state)
        search-mode (state/sub :search/mode)
        group-filter (or (when (and (not (contains? #{:global :graph} search-mode)) (not (:sidebar? opts)))
                           search-mode)
                         (:group (rum/react (::filter state))))
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
                    :scroll-padding-block scroll-padding}}

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
  [:div {:class "cp__cmdk__modal rounded-lg w-[90dvw] max-w-4xl relative"
         :data-keep-selection true}
   (cmdk props)])

(rum/defc cmdk-block [props]
  [:div {:class "cp__cmdk__block rounded-md"}
   (cmdk props)])

