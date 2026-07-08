(ns frontend.components.cmdk.core
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.components.block :as block]
            [frontend.components.cmdk.list-item :as list-item]
            [frontend.components.cmdk.scroll :as scroll]
            [frontend.components.cmdk.state :as cmdk-state]
            [frontend.components.icon :as icon-component]
            [frontend.config :as config]
            [frontend.context.i18n :refer [interpolate-rich-text t t-en t-locale]]
            [frontend.db.async :as db-async]
            [frontend.extensions.pdf.utils :as pdf-utils]
            [frontend.handler.block :as block-handler]
            [frontend.handler.command-palette :as cp-handler]
            [frontend.handler.db-based.recent :as db-recent-handler]
            [frontend.handler.db-based.page :as db-page-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.route :as route-handler]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.modules.shortcut.utils :as shortcut-utils]
            [frontend.search :as search]
            [frontend.rfx :as rfx]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.page :as page-util]
            [frontend.util.ref :as ref]
            [frontend.util.text :as text-util]
            [goog.functions :as gfun]
            [goog.object :as gobj]
            [logseq.common.util :as common-util]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [io.factorhouse.hsx.core :as hsx]))

(defn- get-action
  []
  (:action (state/get-state :search/args)))

(defn translate
  [t-fn {:keys [id desc]}]
  (when id
    (let [desc-i18n (t-fn (shortcut-utils/decorate-namespace id))]
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
        {:filter {:group :current-page} :text (t :cmdk.filter/current-page) :info (t :cmdk.filter/add) :icon-theme :gray :icon "file"})
      {:filter {:group :nodes} :text (t :cmdk.filter/nodes) :info (t :cmdk.filter/add) :icon-theme :gray :icon "point-filled"}
      {:filter {:group :codes} :text (t :cmdk.filter/codes) :info (t :cmdk.filter/add) :icon-theme :gray :icon "code"}
      {:filter {:group :commands} :text (t :cmdk.filter/commands) :info (t :cmdk.filter/add) :icon-theme :gray :icon "command"}
      {:filter {:group :files} :text (t :cmdk.filter/files) :info (t :cmdk.filter/add) :icon-theme :gray :icon "file"}
      {:filter {:group :themes} :text (t :cmdk.filter/themes) :info (t :cmdk.filter/add) :icon-theme :gray :icon "palette"}]
     (remove nil?))))

(defn- group-label
  [group]
  (case group
    :filters (t :cmdk.group/filters)
    :current-page (t :cmdk.group/current-page)
    :nodes (t :cmdk.group/nodes)
    :codes (t :cmdk.group/codes)
    :files (t :cmdk.group/files)
    :create (t :cmdk.group/create)
    :recently-updated-pages (t :cmdk.group/recently-updated)
    :commands (t :cmdk.group/commands)
    :themes (t :cmdk.group/themes)
    (name group)))

;; The results are separated into groups, and loaded/fetched/queried separately
(def default-results
  {:recently-updated-pages {:status :success :show :less :items nil}
   :commands       {:status :success :show :less :items nil}
   :favorites      {:status :success :show :less :items nil}
   :current-page   {:status :success :show :less :items nil}
   :nodes          {:status :success :show :less :items nil}
   :codes          {:status :success :show :less :items nil}
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
          class-name (get-class-from-input q)]
      (->> [{:text (cond
                     class? (t :cmdk.create/tag)
                     :else (t :cmdk.create/page))
             :icon "new-page"
             :icon-theme :gray
             :info (cond
                     class?
                     (t :cmdk.info/create-tag class-name)
                     :else
                     (t :cmdk.info/create-page q))
             :source-create :page
             :class nil}]
           (remove nil?)))))

;; Take the results, decide how many items to show, and order the results appropriately
(defn state->results-ordered
  [state]
  (let [sidebar? (get-in state [:opts :sidebar?])
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
                 start-with-slash?
                 [[(group-label :filters)        :filters       (visible-items :filters)]
                  [(group-label :current-page)   :current-page  (visible-items :current-page)]
                  [(group-label :nodes)          :nodes         (visible-items :nodes)]]

                 include-slash?
                 [(when-not node-exists?
                    [(group-label :create)       :create        (create-items input)])

                  [(group-label :current-page)   :current-page  (visible-items :current-page)]
                  [(group-label :nodes)          :nodes         (visible-items :nodes)]
                  [(group-label :files)          :files         (visible-items :files)]
                  [(group-label :filters)        :filters       (visible-items :filters)]]

                 filter-group
                 [(when (= filter-group :nodes)
                    [(group-label :current-page) :current-page  (visible-items :current-page)])
                  [(group-label filter-group)
                   filter-group
                   (visible-items filter-group)]
                  (when-not node-exists?
                    [(group-label :create)         :create         (create-items input)])]

                 :else
                 (->>
                  [(when-not node-exists?
                     [(group-label :create)         :create         (create-items input)])
                   [(group-label :current-page)     :current-page   (visible-items :current-page)]
                   [(group-label :nodes)            :nodes          (visible-items :nodes)]
                   [(group-label :recently-updated-pages) :recently-updated-pages (visible-items :recently-updated-pages)]
                   [(group-label :commands)         :commands       (visible-items :commands)]
                   [(group-label :files)            :files          (visible-items :files)]
                   [(group-label :filters)          :filters        (visible-items :filters)]]
                  (remove nil?)))
        order (remove nil? order*)]
    (for [[group-name group-key group-items] order]
      [group-name
       group-key
       (if (= group-key :create)
         (count group-items)
         (or (get-in results [group-key :matched-count])
             (count (get-in results [group-key :items]))))
       (mapv #(assoc % :group group-key :item-index (vswap! index inc)) group-items)])))

(defn state->highlighted-item
  ([state]
   (state->highlighted-item state (::fallback-item state)))
  ([state fallback-item]
   (or (some-> state ::highlighted-item deref)
       fallback-item
       (first @(::all-items-cache state)))))

(defn state->action
  ([state]
   (state->action state nil))
  ([state fallback-item]
   (let [highlighted-item (state->highlighted-item state fallback-item)
        action (get-action)]
     (cond (and (:source-block highlighted-item) (= action :move-blocks)) :trigger
           (:source-block highlighted-item) :open
           (:file-path highlighted-item) :open
           (:source-search highlighted-item) :search
           (:source-command highlighted-item) :trigger
           (:source-create highlighted-item) :create
           (:filter highlighted-item) :filter
           (:source-theme highlighted-item) :theme
           :else nil))))

;; Each result group has it's own load-results function
(defmulti load-results (fn [group _state] group))

(declare <page-uuid)

(defn- recent-page-items
  [pages]
  (map (fn [block]
         (let [text (block-handler/block-unique-title block :truncate? false)
               icon (icon-component/get-node-icon-cp block {:ignore-current-icon? true})]
           {:icon icon
            :icon-theme :gray
            :text text
            :result-type :page
            :source-block block}))
       pages))

(defmethod load-results :initial [_ state]
  (let [!results (::results state)]
    (p/let [recent-pages (db-recent-handler/get-recent-pages)]
      (reset! !results (assoc-in default-results
                                 [:recently-updated-pages :items]
                                 (recent-page-items recent-pages))))))

;; The commands search uses the command-palette handler
(defn- translate-locale
  "Return the locale-only translation for a command.
  Returns nil when the locale is :en or the key has no translation in the
  current locale — no English fallback is applied."
  [{:keys [id]}]
  (when id
    (t-locale (shortcut-utils/decorate-namespace id))))

(defonce ^:private !commands-cache (atom {:lang nil :commands nil}))

(defn- get-commands-for-search
  "Return commands with locale, English, and (for :zh-CN) pinyin-initial fields.
  :locale-t — locale-only translation; nil when locale is :en or key has no
              locale entry (no English fallback).
  :en-t     — English translation; always present.
  :pinyin-t — Simplified Chinese pinyin initials; present only for :zh-CN.
  Cached by language — rebuilt only when preferred-language changes."
  []
  (let [lang (or (some-> (state/get-state :preferred-language) keyword) :en)
        cache @!commands-cache]
    (if (= (:lang cache) lang)
      (:commands cache)
      (let [zh-cn? (= lang :zh-CN)
            cmds   (->> (cp-handler/top-commands 1000)
                        (map (fn [cmd]
                               (let [locale-t (when-not (= lang :en) (translate-locale cmd))
                                     en-t     (translate t-en cmd)]
                                 (cond-> (assoc cmd :en-t en-t)
                                   locale-t              (assoc :locale-t locale-t)
                                   (and zh-cn? locale-t) (assoc :pinyin-t (search/hanzi->initials locale-t)))))))]
        (reset! !commands-cache {:lang lang :commands cmds})
        cmds))))

(defmethod load-results :commands [group state]
  (let [!input   (::input state)
        !results (::results state)]
    (swap! !results assoc-in [group :status] :loading)
    (let [lang        (or (some-> (state/get-state :preferred-language) keyword) :en)
          en?         (= lang :en)
          zh-cn?      (= lang :zh-CN)
          commands    (get-commands-for-search)
          extract-fns (cond
                        en?    [:en-t]
                        zh-cn? [:locale-t :en-t :pinyin-t]
                        :else  [:locale-t :en-t])
          search-results (if (string/blank? @!input)
                           commands
                           (search/fuzzy-search-multi commands @!input
                                                      {:extract-fns extract-fns}))]
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
    (p/let [recent-pages (db-recent-handler/get-recent-pages)
            search-results (if (string/blank? @!input)
                             recent-pages
                             (search/fuzzy-search recent-pages @!input {:extract-fn :block/title}))]
      (->> search-results
           recent-page-items
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
                                [:mark {:style {:padding 0 :border-radius 0}} hl-cut]]
                   hiccups-add (remove nil? hiccups-add)
                   new-result (concat result hiccups-add)]
               (if-not (string/blank? e-cut)
                 (recur e-cut new-result)
                 new-result)))]))

(defn page-item
  [repo page current-page-uuid input]
  (let [entity page
        source-page (:alias page)
        result-page-id (or (:block/uuid source-page)
                           (:block/uuid entity)
                           (:block/uuid page))
        current-page? (and current-page-uuid
                           (= current-page-uuid result-page-id))
        icon (icon-component/get-node-icon-cp entity {:ignore-current-icon? true})
        title (:block.temp/unique-title page)
        plain-title (block-handler/block-unique-title entity
                                                       :alias (:block/title source-page)
                                                       :truncate? false)
        test-title (or (:block.temp/original-title page) plain-title)]
    (hash-map :icon icon
              :icon-theme :gray
              :text [:span {"data-testid" test-title}
                     (if (string/includes? title "$pfts_2lqh>$") ; sqlite matched
                       (highlight-content-query title input)
                       title)]
              :header (when (:block/parent entity)
                        (block/breadcrumb {:disable-preview? true
                                           :search? true} repo (:block/uuid page)
                                          {:disabled? true :variant :search-result}))
              :result-type :page
              :current-page? current-page?
              :alias (:alias page)
              :source-block (or source-page page))))

(defn block-item
  [repo block current-page-uuid input]
  (let [id (:block/uuid block)
        text (:block.temp/unique-title block)
        icon (icon-component/get-node-icon-cp block {:ignore-current-icon? true})]
    {:icon icon
     :icon-theme :gray
     :text (highlight-content-query text input)
     :header (block/breadcrumb {:disable-preview? true
                                :search? true} repo id
                               {:disabled? true :variant :search-result})
     :result-type :block
     :current-page? (when-let [page-id (:block/page block)]
                      (= page-id current-page-uuid))
     :source-block block}))

(defn- block-search-result->items
  [result]
  (if (map? result)
    {:blocks (:items result)
     :matched-count (or (:matched-count result)
                        (count (:items result)))}
    {:blocks result
     :matched-count (count result)}))

;; The blocks search action uses an existing handler
(defmethod load-results :nodes [group state]
  (let [!input (::input state)
        !results (::results state)
        repo (state/get-current-repo)
        current-page (or (state/get-current-page)
                         (page-util/get-current-page-uuid))
        expanded? (::expanded? state)
        opts (cmdk-state/cmdk-block-search-options
              {:filter-group :nodes
               :dev? config/dev?
               :action (get-action)
               :expanded? expanded?})]
    (swap! !results assoc-in [group :status] :loading)
    (swap! !results assoc-in [:current-page :status] :loading)
    (p/let [current-page-uuid (<page-uuid repo current-page)
            search-result (search/block-search repo @!input opts)
            {:keys [blocks matched-count]} (block-search-result->items search-result)
            blocks (remove nil? blocks)
            items (keep (fn [block]
                          (if (:page? block)
                            (page-item repo block current-page-uuid @!input)
                            (block-item repo block current-page-uuid @!input))) blocks)]
      (if (= group :current-page)
        (let [items-on-current-page (filter :current-page? items)]
          (swap! !results update group merge {:status :success
                                              :items items-on-current-page
                                              :matched-count (count items-on-current-page)
                                              :has-more? false}))
        (swap! !results update group merge {:status :success
                                            :items items
                                            :matched-count matched-count
                                            :has-more? (> matched-count (count items))})))))

(defmethod load-results :codes [group state]
  (let [!input (::input state)
        !results (::results state)
        repo (state/get-current-repo)
        current-page (or (state/get-current-page)
                         (page-util/get-current-page-uuid))
        opts (cmdk-state/cmdk-block-search-options
              {:filter-group :codes
               :dev? config/dev?})]
    (swap! !results assoc-in [group :status] :loading)
    (p/let [current-page-uuid (<page-uuid repo current-page)
            blocks (search/block-search repo @!input opts)
            blocks (remove nil? blocks)
            items (map (fn [block]
                         (block-item repo block current-page-uuid @!input))
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

(defmethod load-results :themes [group state]
  (let [!input (::input state)
        !results (::results state)
        themes (state/get-state :plugin/installed-themes)
        themes (if (string/blank? @!input)
                 themes
                 (search/fuzzy-search themes @!input :limit 100 :extract-fn :name))
        themes (cons {:name (t :theme/logseq-default)
                      :pid "logseq-classic-theme"
                      :mode (state/get-state :ui/theme)
                      :url nil} themes)
        selected (state/get-state :plugin/selected-theme)]
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
  (if-let [current-page (or (state/get-current-page)
                            (page-util/get-current-page-uuid))]
    (let [!results (::results state)
          !input (::input state)
          repo (state/get-current-repo)
          expanded? (::expanded? state)
          opts (cmdk-state/cmdk-block-search-options
                {:filter-group :current-page
                 :dev? config/dev?
                 :expanded? expanded?})]
      (swap! !results assoc-in [group :status] :loading)
      (swap! !results assoc-in [:current-page :status] :loading)
      (p/let [current-page-uuid (<page-uuid repo current-page)
              opts (assoc opts :page-uuid current-page-uuid)
              search-result (search/block-search repo @!input opts)
              {:keys [blocks matched-count]} (block-search-result->items search-result)
              blocks (remove nil? blocks)
              items (map (fn [block]
                           (let [id (if (uuid? (:block/uuid block))
                                      (:block/uuid block)
                                      (uuid (:block/uuid block)))]
                             {:icon "node"
                              :icon-theme :gray
                              :text (highlight-content-query (:block/title block) @!input)
                              :header (block/breadcrumb {:search? true} repo id
                                                        {:disabled? true :variant :search-result})
                              :result-type (if (:page? block) :page :block)
                              :current-page? true
                              :source-block block})) blocks)]
        (swap! !results update :current-page merge {:status :success
                                                    :items items
                                                    :matched-count matched-count
                                                    :has-more? (> matched-count (count items))})))
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

(defn- <page-uuid
  [repo page-id-name-or-uuid]
  (cond
    (uuid? page-id-name-or-uuid)
    (p/resolved page-id-name-or-uuid)

    (nil? page-id-name-or-uuid)
    (p/resolved nil)

    :else
    (let [lookup-ref (if (and (string? page-id-name-or-uuid)
                              (common-util/uuid-string? page-id-name-or-uuid))
                       [:block/uuid (uuid page-id-name-or-uuid)]
                       [:block/name (common-util/page-name-sanity-lc page-id-name-or-uuid)])]
      (p/let [page (state/<invoke-db-worker :thread-api/pull
                                            repo
                                            [:block/uuid]
                                            lookup-ref)]
        (:block/uuid page)))))

(defn- block-page-uuid
  [block]
  (let [page (:block/page block)]
    (cond
      (uuid? page) page
      (map? page) (:block/uuid page))))

(defn- <block-parent-page-uuid
  [repo block]
  (or (block-page-uuid block)
      (p/let [block' (state/<invoke-db-worker
                      :thread-api/pull
                      repo
                      [{:block/page [:block/uuid]}]
                      [:block/uuid (:block/uuid block)])]
        (block-page-uuid block'))))

(defmethod handle-action :open-page [_ state _event]
  (when-let [page-name (get-highlighted-page-uuid-or-name state)]
    (p/let [page-uuid (<page-uuid (state/get-current-repo) page-name)]
      (when page-uuid
        (route-handler/redirect-to-page! page-uuid))
      (shui/dialog-close! :ls-dialog-cmdk))))

(defmethod handle-action :open-block [_ state _event]
  (when-let [block-id (some-> state state->highlighted-item :source-block :block/uuid)]
    (p/let [repo (state/get-current-repo)
            block (db-async/<get-block repo block-id :children? false)
            parents (db-async/<get-block-parents repo (:db/id block) 1000)
            created-from-block (some (fn [block']
                                       (when (:logseq.property/created-from-property block')
                                         (:block/parent block'))) parents)
            created-from-block (when created-from-block
                                 (if (:block/uuid created-from-block)
                                   created-from-block
                                   (state/<invoke-db-worker
                                    :thread-api/pull
                                    repo
                                    [:db/id :block/uuid {:block/page [:block/uuid]}]
                                    (:db/id created-from-block))))
            block (or created-from-block block)
            block-id (:block/uuid block)
            page-uuid (<block-parent-page-uuid repo block)]
      (when block
        (cond
          (some util/collapsed? parents)
          (route-handler/redirect-to-page! block-id)

          page-uuid
          (route-handler/redirect-to-page! page-uuid {:anchor (str "ls-block-" block-id)}))
        (shui/dialog-close! :ls-dialog-cmdk)))))

(defmethod handle-action :open-page-right [_ state _event]
  (when-let [page-name (get-highlighted-page-uuid-or-name state)]
    (p/let [page-uuid (<page-uuid (state/get-current-repo) page-name)]
      (when page-uuid
        (editor-handler/open-block-in-sidebar! page-uuid))
      (shui/dialog-close! :ls-dialog-cmdk))))

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
  (or (= :page (:result-type item))
      (true? (:page? (:source-block item)))
      (some? (:block/name (:source-block item)))))

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
          shift-or-sidebar? (or shift? (boolean (:open-sidebar? (:opts state))))]
      (cond
        (:file-path item) (do
                            (open-file (:file-path item))
                            (shui/dialog-close! :ls-dialog-cmdk))
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
        search-args (state/get-state :search/args)
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
        input @!input
        create-class? (string/starts-with? @!input "#")
        create-page? (= :page (:source-create item))
        class (when create-class? (get-class-from-input @!input))]
    (if (:class item)
      (state/pub-event! [:dialog/show-block (:class item) {:tag-dialog? true}])
      (p/let [result (cond
                       create-class?
                       (db-page-handler/<create-class! class
                                                       {:redirect? false})
                       create-page? (page-handler/<create! input {:redirect? true
                                                                  :edit? false}))]
        (shui/dialog-close! :ls-dialog-cmdk)
        (when create-page?
          (page-handler/edit-page-when-present! (or (:block/uuid result) input)))
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
        opts (:opts state)]
    (cmdk-state/persist-last-cmdk-search!
     opts
     (state/get-state :search/mode)
     (state/get-state :search/args)
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

(hsx/defc render-result-list-item
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
                                 (handle-action :default (assoc state ::fallback-item item) e)
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

(defn- show-more-results!
  [state group]
  (swap! (::results state) assoc-in [group :show] :more)
  (when (contains? #{:nodes :current-page} group)
    (load-results group (assoc state ::expanded? true))))

(hsx/defc result-group
  [state title group visible-items first-item sidebar?]
  (let [[results] (hooks/use-atom (::results state))
        [focus-source] (hooks/use-atom (::focus-source state))
        [highlighted-item*] (hooks/use-atom (::highlighted-item state))
        [input] (hooks/use-atom (::input state))
        [filter'] (hooks/use-atom (::filter state))
        {:keys [show items matched-count has-more?]} (some-> results group)
        highlighted-item (or highlighted-item*
                             (when (= :keyboard focus-source) first-item))
        mouse-mode? (= :mouse focus-source)
        can-show-less? (< (get-group-limit group) (count visible-items))
        can-show-more? (or has-more?
                           (< (count visible-items) (count items)))
        show-less #(swap! (::results state) assoc-in [group :show] :less)
        show-more #(show-more-results! state group)]
    [:div {:class         (if (= group :create)
                            "border-b border-gray-06 last:border-b-0"
                            "border-b border-gray-06 pb-1 last:border-b-0")}
     (when-not (= group :create)
       [:div {:class "text-xs py-1.5 px-3 flex justify-between items-center gap-2 text-gray-11 bg-gray-02 h-8"}
        [:div {:class "font-bold text-gray-11 pl-0.5 cursor-pointer select-none"
               :on-click (fn [_e]
                          ;; change :less to :more or :more to :less
                           (if (= show :more)
                             (show-less)
                             (show-more)))}
         title]
        (when (not= group :create)
          (let [display-count (or matched-count (count items))]
            [:div {:class "pl-1.5 text-gray-12 rounded-full"
                   :style {:font-size "0.7rem"}}
             (if (<= 99 display-count)
               "99+"
               display-count)]))

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
              (t :ui/show-less)
              (shui/shortcut "mod up" {:style :compact})]
             [:div.flex.flex-row.gap-1.items-center
              (t :ui/show-more)
              (shui/shortcut "mod down" {:style :compact})])])])

     [:div.search-results
      (for [item visible-items
            :let [highlighted? (= item highlighted-item)
                  page? (= "file" (some-> item :icon))
                  text (some-> item :text)
                  source-block (some-> item :source-block)
                  hls-page? (and page? (pdf-utils/hls-file? (:block/title source-block)))]]
        ^{:key (:item-index item)}
        [render-result-list-item state group highlighted? mouse-mode? item hls-page? text input])]]))

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

(defn- refresh-results!
  [state]
  (persist-cmdk-query-state! state)
  (load-results :default state))

(defn handle-input-change
  ([state e] (handle-input-change state e (.. e -target -value) true))
  ([state e input] (handle-input-change state e input true))
  ([state e input refresh?]
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
     (when (and refresh? (or (not composing?) composing-end?))
       (refresh-results! state)))))

(defn- open-current-item-link
  "Opens a link for the current item if a page or block. For pages, opens the
  first :url property"
  [state]
  (let [item (some-> state state->highlighted-item)
        repo (state/get-current-repo)]
    (cond
      (page-item? item)
      (p/let [page-uuid (<page-uuid repo (get-highlighted-page-uuid-or-name state))
              page (when page-uuid
                     (db-async/<get-block repo page-uuid :children? false))
              link (when-let [page-id (:db/id page)]
                     (state/<invoke-db-worker :thread-api/get-first-url-property-value repo page-id))]
        (if link
          (js/window.open link)
          (notification/show! (t :cmdk.error/no-page-link) :warning)))

      (:source-block item)
      (p/let [block-id (:block/uuid (:source-block item))
              block (or (:source-block item)
                        (db-async/<get-block repo block-id :children? false))
              link (re-find editor-handler/url-regex (:block/title block))]
        (if link
          (js/window.open link)
          (notification/show! (t :cmdk.error/no-block-link) :warning)))
      :else
      (notification/show! (t :cmdk.error/no-search-item-link) :warning))))

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
                      (show-more-results! state highlighted-group)))
        input @(::input state)
        as-keydown? (or (= keyname "ArrowDown") (and ctrl? (= keyname "n")))
        as-keyup? (or (= keyname "ArrowUp") (and ctrl? (= keyname "p")))]
    (when (or as-keydown? as-keyup?)
      (util/stop e))

    (cond
      (cmdk-state/consume-open-search-sidebar-keydown!
       e
       (fn []
         (let [repo (state/get-current-repo)]
           (shui/dialog-close! :ls-dialog-cmdk)
           (state/sidebar-add-block! repo input :search))))
      nil
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
               (state/close-dialog!)

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
  (let [action (get-action)]
    (cond
      (= action :move-blocks)
      (t :cmdk.input/move-blocks-placeholder)

      (= action :new-page)
      (t :cmdk.input/type-page-name-placeholder)

      :else
      (t :cmdk.input/default-placeholder))))

(hsx/defc input-row
  [state all-items opts]
  (let [highlighted-item @(::highlighted-item state)
        input @(::input state)
        input-ref (::input-ref state)
        debounced-refresh-results (hooks/use-callback
                                   (gfun/debounce
                                    (fn []
                                      (refresh-results! state))
                                    150)
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
    [:div.cp__cmdk-input-row {:class "bg-gray-02 border-b border-1 border-gray-07"}
     [:input.cp__cmdk-search-input
      {:class "text-xl bg-transparent !border-none w-full !outline-none !shadow-none px-3 py-3 focus:!border-none focus:!outline-none focus:!shadow-none focus-visible:!outline-none focus-visible:!shadow-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
       :auto-focus true
       :autoComplete "off"
       :autoCapitalize "off"
       :placeholder (input-placeholder)
       :ref #(when-not @input-ref (reset! input-ref %))
       :on-change (fn [e]
                    (let [new-value (.-value (.-target e))
                          composing? (util/native-event-is-composing? e)]
                      (handle-input-change state e new-value false)
                      (when-not composing?
                        (debounced-refresh-results))
                      (when-let [on-change (:on-input-change opts)]
                        (on-change new-value))))
       :on-blur (fn [_e]
                  (when-let [on-blur (:on-input-blur opts)]
                    (on-blur input)))
       :on-composition-end (fn [e]
                             (handle-input-change state e (.. e -target -value) false)
                             (debounced-refresh-results))
       :default-value input}]]))

(defn- tip-with-shortcut
  [template shortcut & [shortcut-opts]]
  (into [:div.flex.flex-row.gap-1.items-center.opacity-50.hover:opacity-100]
        (interpolate-rich-text
         template
         [(shui/shortcut shortcut shortcut-opts)])))

(defn rand-tip
  []
  (rand-nth [:filter-results :open-sidebar]))

(defn- tip-content
  [tip-id]
  (case tip-id
    :open-sidebar (tip-with-shortcut (t :cmdk.tip/open-sidebar) ["mod" "enter"] {:style :combo})
    (tip-with-shortcut (t :cmdk.tip/filter-results) "/")))

(hsx/defc tip
  [state]
  (let [[filter'] (hooks/use-atom (::filter state))
        tip-id (hooks/use-memo rand-tip [])]
    (cond
      filter'
      (tip-with-shortcut (t :cmdk.tip/clear-filter) "esc")

      :else
      (tip-content tip-id))))

(hsx/defc hint-button
  [text shortcut opts]
  (let [props (merge {:class "hint-button [&>span:first-child]:hover:opacity-100 opacity-40 hover:opacity-80"
                      :variant :ghost
                      :size  :sm}
                     opts)
        children (cond-> [[:span.opacity-60 text]]
                   (not-empty shortcut)
                   (conj (let [has-modifier? (and (coll? shortcut)
                                                  (some #(#{"shift" "ctrl" "alt" "cmd" "mod" "⌘" "⌥" "⌃"}
                                                          (string/lower-case (str %)))
                                                        shortcut))
                               style (if (and (> (count shortcut) 1) has-modifier?)
                                       :combo
                                       :auto)]
                           (shui/shortcut shortcut {:style style
                                                    :aria-hidden? true}))))]
    (apply shui/button props children)))

(hsx/defc hints
  [state fallback-item]
  (let [action (state->action state fallback-item)
        button-fn (fn [text shortcut & {:as opts}]
                    (hint-button text shortcut
                                 {:on-click #(handle-action action (assoc state :opts opts) %)
                                  :muted    true}))]
    [:div.hints
     [:div.text-sm.leading-6
      [:div.flex.flex-row.gap-1.items-center
       [:span.font-medium.text-gray-12 (t :cmdk.tip/label)]
       (tip state)]]

     [:div.gap-2.hidden.md:flex {:style {:margin-right -6}}
      (case action
        :open
        [:<>
         (button-fn (t :cmdk.action/open) ["return"])
         (button-fn (t :cmdk.action/open-in-sidebar) ["shift" "return"] {:open-sidebar? true})
         (when (:source-block (state->highlighted-item state fallback-item))
           (button-fn (t :cmdk.action/copy-ref) ["cmd" "c"]))]

        :search
        [:<>
         (button-fn (t :cmdk.action/search) ["return"])]

        :trigger
        [:<>
         (button-fn (t :cmdk.action/trigger) ["return"])]

        :create
        [:<>
         (button-fn (t :cmdk.action/create) ["return"])]

        :filter
        [:<>
         (button-fn (t :cmdk.action/filter) ["return"])]

        :theme
        [:<>
         (button-fn (t :cmdk.action/apply-theme) ["return"])]

        nil)]]))

(hsx/defc search-only
  [state group-name]
  [:div.flex.flex-row.gap-1.items-center
   [:div (t :cmdk.filter/only-label)]
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
  [opts]
  ;; Invalidate the commands cache so that each new CMDK session gets a fresh
  ;; commands list from cp-handler/top-commands (plugins, graph state, etc. may
  ;; have changed since the last session).
  (reset! !commands-cache {:lang nil :commands nil})
  (let [raw-search-mode (state/get-state :search/mode)
        search-mode (or raw-search-mode :global)
        search-args (state/get-state :search/args)
        {input :input filter-group :filter} (cmdk-state/build-initial-cmdk-search
                                             opts
                                             search-mode
                                             search-args
                                             (state/get-current-repo))]
    {::ref (atom nil)
     ::filter (atom filter-group)
     ::input (atom input)
     ::input-ref (atom nil)
     ::all-items-cache (atom [])
     ::scroll-container-ref (atom nil)
     ::pending-scroll-item-idx (atom nil)
     ::accel-start-ts (atom nil)
     ::highlighted-item (atom nil)
     ::focus-source (atom :keyboard)
     ::results (atom default-results)}))

(defn- cmdk-will-unmount
  "Clean up cmdk component: persist state, clear search mode."
  [state]
  (persist-cmdk-query-state! state)
  (state/set-state! :search/mode nil)
  (state/set-state! :search/args nil)
  state)

(hsx/defc cmdk
  [{:keys [sidebar?] :as opts}]
  (let [state (hooks/use-memo #(cmdk-init-state opts) [])
        *input (::input state)
        search-mode (rfx/use-sub [:search/mode])
        search-args (rfx/use-sub [:search/args])
        [filter'] (hooks/use-atom (::filter state))
        [_results] (hooks/use-atom (::results state))
        [_highlighted-item] (hooks/use-atom (::highlighted-item state))
        [_focus-source] (hooks/use-atom (::focus-source state))
        group-filter (or (when (and (not= :global search-mode) (not (:sidebar? opts)))
                           search-mode)
                         (:group filter'))
        results-ordered (state->results-ordered state)
        all-items (mapcat last results-ordered)
        first-item (first all-items)]
    (hooks/use-effect!
     (fn []
       (when (nil? search-mode)
         (state/set-state! :search/mode :global)))
     [])
    (hooks/use-effect!
     (fn []
       (let [{input :input filter-group :filter} (cmdk-state/build-initial-cmdk-search
                                                  opts
                                                  (or search-mode :global)
                                                  search-args
                                                  (state/get-current-repo))]
         (reset! (::input state) input)
         (reset! (::filter state) filter-group)
         (reset! (::highlighted-item state) nil)
         (reset! (::focus-source state) :keyboard)
         (reset! (::results state) default-results)
         (when-let [input-ref @(::input-ref state)]
           (set! (.-value input-ref) input))
         (refresh-results! state)))
     [search-mode search-args])
    (hooks/use-effect!
     (fn []
       (when-not sidebar?
         (shortcut/unlisten-all!))
       #(do
          (cmdk-will-unmount state)
          (when-not sidebar?
            (shortcut/listen-all!))))
     [])
    (hooks/use-effect!
     (fn []
       (when-let [ref @(::ref state)]
         (let [keydown-fn #(keydown-handler state %)
               keyup-fn #(keyup-handler state %)]
           (.addEventListener ref "keydown" keydown-fn)
           (.addEventListener js/window "keyup" keyup-fn)
           #(do
              (.removeEventListener ref "keydown" keydown-fn)
              (.removeEventListener js/window "keyup" keyup-fn)))))
     [])
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
         (search-only state (group-label group-filter))])

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
                ^{:key (str "cmdk-group-" (name group-key))}
                [result-group state title group-key group-items first-item sidebar?]))
          [:div.flex.flex-col.p-4.opacity-50
           (when-not (string/blank? @*input)
             (t :search/no-result))]))]
     (when-not sidebar? (hints state first-item))]))

(hsx/defc cmdk-modal [props]
  [:div {:class "cp__cmdk__modal rounded-lg w-[90dvw] max-w-4xl relative"
         :data-keep-selection true}
   (cmdk props)])

(hsx/defc cmdk-block [props]
  [:div {:class "cp__cmdk__block rounded-md"}
   (cmdk props)])
