(ns frontend.components.cmdk.core
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.components.block :as block]
            [frontend.components.page :as component-page]
            [frontend.components.cmdk.list-item :as list-item]
            [frontend.components.cmdk.scroll :as scroll]
            [frontend.components.cmdk.state :as cmdk-state]
            [frontend.components.icon :as icon-component]
            [frontend.components.wikidata :as wikidata]
            [frontend.components.wikidata-import :as wikidata-import]
            [datascript.core :as d]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.config :as config]
            [frontend.format.block :as format-block]
            [frontend.storage :as storage]
            [logseq.common.config :as common-config]
            [logseq.common.path :as path]
            [frontend.context.i18n :refer [interpolate-rich-text t t-en t-locale]]
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
            [io.factorhouse.hsx.core :as hsx]))

(defn- get-action
  []
  (:action (:search/args @state/state)))

(defn translate
  [t-fn {:keys [id desc]}]
  (when id
    (let [desc-i18n (t-fn (shortcut-utils/decorate-namespace id))]
      (if (string/starts-with? desc-i18n "{Missing key")
        desc
        desc-i18n))))

(defn- get-group-limit
  [group]
  (case group
    :nodes 10
    :wikidata-entities 1
    5))

(defonce ^:private *wikidata-cancel-token (atom nil))
(defonce ^:private *wikidata-last-query (atom nil))
(def ^:private wikidata-search-debounce-ms 400)

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
    :wikidata-entities "From Web"
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
   :filters        {:status :success :show :less :items nil}
   :wikidata-entities {:status :success :show :less :items nil}})

(defn get-class-from-input
  [input]
  (string/replace input #"^#+" ""))

(defn create-items [q]
  (when (and (not (string/blank? q))
             (not (#{"config.edn" "custom.js" "custom.css"} q))
             (not config/publishing?))
    (let [class? (string/starts-with? q "#")
          has-inline-tag? (and (not class?) (string/includes? q " #"))
          [object-page-name object-tag-names]
          (when has-inline-tag?
            (let [parts (string/split q #" #")
                  pn (string/trim (first parts))
                  tns (->> (rest parts) (map string/trim) (remove string/blank?) vec)]
              (when (and (not (string/blank? pn)) (seq tns)) [pn tns])))
          create-object? (some? object-page-name)
          class-name (get-class-from-input q)
          class (let [class (db/get-page class-name)]
                  (when (ldb/class? class)
                    class))]
      (if create-object?
        [{:text (t :cmdk.create/as-tags (str "#" (string/join ", #" object-tag-names)))
          :icon "new-object"
          :icon-extension? true
          :icon-theme :gray
          :info (t :cmdk.info/create-page object-page-name)
          :source-create :page
          :create-object? true
          :page-name object-page-name
          :tag-names object-tag-names}]
        (when (or class? class (nil? (db/get-page q)))
          [{:text (cond
                    class (t :cmdk.create/configure-tag)
                    class? (t :cmdk.create/tag)
                    :else (t :cmdk.create/page))
            :icon (cond class "settings" class? "new-class" :else "new-page")
            :icon-theme :gray
            :info (cond
                    class (t :cmdk.info/configure-tag class-name)
                    class? (t :cmdk.info/create-tag class-name)
                    :else (t :cmdk.info/create-page q))
            :source-create :page
            :class class}])))))

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
                 (let [from-web (let [items (visible-items :wikidata-entities)
                                      wikidata-status (get-in results [:wikidata-entities :status])]
                                  (when (or (seq items) (= :loading wikidata-status))
                                    [(group-label :wikidata-entities) :wikidata-entities items]))
                       ;; "From Web" is the top result only when NO local PAGE matches the
                       ;; query (blocks don't count); otherwise graph results come first and
                       ;; web results after. (ported from design-improvements)
                       has-local-matches?
                       (if (< (count (string/trim input)) 3)
                         true
                         (let [query-words (string/split (string/lower-case (string/trim input)) #"\s+")]
                           (boolean
                            (some (fn [item]
                                    (when-let [block (:source-block item)]
                                      (when (:page? block)
                                        (let [title-lc (string/lower-case (str (:block.temp/original-title block)))
                                              title-words (string/split title-lc #"[^\w]+")]
                                          (every? (fn [qw] (some #(string/starts-with? % qw) title-words))
                                                  query-words)))))
                                  (visible-items :nodes)))))]
                   (->>
                    [(when-not node-exists?
                       [(group-label :create)         :create         (create-items input)])
                     (if has-local-matches?
                       [(group-label :current-page)   :current-page   (visible-items :current-page)]
                       from-web)
                     (if has-local-matches?
                       [(group-label :nodes)          :nodes          (visible-items :nodes)]
                       [(group-label :current-page)   :current-page   (visible-items :current-page)])
                     (if has-local-matches?
                       from-web
                       [(group-label :nodes)          :nodes          (visible-items :nodes)])
                     [(group-label :recently-updated-pages) :recently-updated-pages (visible-items :recently-updated-pages)]
                     [(group-label :commands)         :commands       (visible-items :commands)]
                     [(group-label :files)            :files          (visible-items :files)]
                     [(group-label :filters)          :filters        (visible-items :filters)]]
                    (remove nil?))))
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
           (:source-wikidata highlighted-item) :create-from-wikidata
           (:filter highlighted-item) :filter
           (:source-theme highlighted-item) :theme
           :else nil))))

;; Each result group has it's own load-results function
(defmulti load-results (fn [group _state] group))

(defmethod load-results :initial [_ state]
  (when-let [db (db/get-db)]
    (let [!results (::results state)
          recent-pages (map (fn [block]
                              (let [tags (block-handler/visible-tags block)
                                    tag-str (tags->hashtag-str tags)
                                    text (block-handler/block-unique-title block :with-tags? false :truncate? false)
                                    icon (icon-component/get-node-icon-cp block {})]
                                {:icon icon
                                 :icon-theme :gray
                                 :text text
                                 :text-tags tag-str
                                 :source-block block}))
                            (ldb/get-recent-updated-pages db))]
      (reset! !results (assoc-in default-results [:recently-updated-pages :items] recent-pages)))))

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
  (let [lang (or (some-> (:preferred-language @state/state) keyword) :en)
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
    (let [lang        (or (some-> (:preferred-language @state/state) keyword) :en)
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
    (let [recent-pages (ldb/get-recent-updated-pages (db/get-db))
          search-results (if (string/blank? @!input)
                           recent-pages
                           (search/fuzzy-search recent-pages @!input {:extract-fn :block/title}))]
      (->> search-results
           (map (fn [block]
                  (let [tags (block-handler/visible-tags block)
                        tag-str (tags->hashtag-str tags)
                        text (block-handler/block-unique-title block :with-tags? false :truncate? false)
                        icon (icon-component/get-node-icon-cp block {})]
                    {:icon icon
                     :icon-theme :gray
                     :text text
                     :text-tags tag-str
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
                                [:span {:class "ui__list-item-highlighted-span"} hl-cut]]
                   hiccups-add (remove nil? hiccups-add)
                   new-result (concat result hiccups-add)]
               (if-not (string/blank? e-cut)
                 (recur e-cut new-result)
                 new-result)))]))

(defn- tags->hashtag-str
  "Render a node's visible tags as the '#Tag1, #Tag2' string block-unique-title appends."
  [tags]
  (when (seq tags)
    (string/join ", " (keep (fn [t] (when-let [tt (:block/title t)] (str "#" tt))) tags))))

(defn- strip-trailing-tags
  "block-unique-title appends ' #Tag1, #Tag2' to a node's display title; strip that
   suffix so the tags render once as a de-emphasized :text-tags chip instead of being
   duplicated inside the bold title. FTS highlight markers on the base are preserved."
  [title tag-str]
  (if (and (string? title) tag-str (string/ends-with? title (str " " tag-str)))
    (subs title 0 (- (count title) (count tag-str) 1))
    title))

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
        icon (icon-component/get-node-icon-cp entity {})
        tags (block-handler/visible-tags entity)
        tag-str (tags->hashtag-str tags)
        title (strip-trailing-tags (:block.temp/unique-title page) tag-str)
        plain-title (block-handler/block-unique-title entity
                                                      :alias (:block/title source-page)
                                                      :truncate? false)]
    (hash-map :icon icon
              :icon-theme :gray
              :text (if (string/includes? title "$pfts_2lqh>$") ; sqlite matched
                      [:span {"data-testid" plain-title}
                       (highlight-content-query title input)]
                      title)
              :header (when (:block/parent entity)
                        (block/breadcrumb {:disable-preview? true
                                           :search? true} repo (:block/uuid page)
                                          {:disabled? true :variant :search-result}))
              :result-type :page
              :current-page? current-page?
              :alias (:alias page)
              :source-block (or source-page page)
              :text-tags tag-str)))

(defn block-item
  [repo block current-page-uuid input]
  (let [id (:block/uuid block)
        tags (block-handler/visible-tags block)
        tag-str (tags->hashtag-str tags)
        text (strip-trailing-tags (:block.temp/unique-title block) tag-str)
        icon (icon-component/get-node-icon-cp block {})]
    {:icon icon
     :icon-theme :gray
     :text (highlight-content-query text input)
     :header (block/breadcrumb {:disable-preview? true
                                :search? true} repo id
                               {:disabled? true :variant :search-result})
     :result-type :block
     :current-page? (when-let [page-id (:block/page block)]
                      (= page-id current-page-uuid))
     :source-block block
     :text-tags tag-str}))

(defn- previewable-item?
  "Returns true for items that can show a page preview (pages and blocks)."
  [item]
  (and (some? item)
       (some? (:source-block item))
       (nil? (:source-create item))
       (nil? (:source-wikidata item))))

(defn- preview-page-entity
  "Returns the page entity to preview for a given item.
   Resolves the full entity from the source-block, then determines the page to preview.
   For page/object/tag items: returns the entity itself.
   For block items: returns the block's parent page.
   For alias items: returns the original page."
  [item]
  (when (previewable-item? item)
    (let [source (:source-block item)
          alias-page (:alias item)
          ;; Resolve the full entity — prefer :db/id (integer, survives worker serialization)
          ;; then fall back to :block/uuid for items that are already full entities
          entity (or (when-let [eid (:db/id source)]
                       (db/entity eid))
                     (when-let [uuid (:block/uuid source)]
                       (db/entity [:block/uuid uuid])))]
      (or
       ;; Alias: resolve to original page
       (when alias-page
         (or (when-let [uuid (:block/uuid alias-page)] (db/entity [:block/uuid uuid]))
             (when (:block/name alias-page) (db/get-page (:block/name alias-page)))))
       ;; Entity is a page-like thing (has :block/name or no :block/page pointing elsewhere)
       ;; → preview the entity itself
       (when (and entity (:block/name entity)) entity)
       ;; Entity is a block (has :block/page pointing to a parent page)
       ;; → preview the parent page
       (when-let [page (:block/page entity)]
         (when (not= (:db/id page) (:db/id entity))
           page))
       ;; Entity itself as final fallback (objects without :block/name)
       entity))))

;; ---------------------------------------------------------------------------
;; Lightweight preview renderer
;; ---------------------------------------------------------------------------

(defn- preview-body-element
  "Renders a single body AST element for the lightweight preview.
   Intercepts Heading (which normally calls block-container) and Src (CodeMirror)
   with safe lightweight alternatives. All other cases delegate to markup-element-cp."
  [config item]
  (case (first item)
    "Heading" (let [h (second item)]
                (block/->elem (keyword (str "h" (min (:level h) 6)))
                              (block/map-inline config (:title h))))
    "Src"     (let [{:keys [lines language]} (second item)]
                [:div.cp__fenced-code-block
                 {:data-lang (some-> language util/safe-lower-case)}
                 [:pre.code-block.pre-wrap-white-space
                  [:code (apply str lines)]]])
    (block/markup-element-cp config item)))

(defn- preview-asset-block
  "Renders an asset block (image/audio/video) with synchronous file:// URL."
  [block]
  (let [ext    (:logseq.property.asset/type block)
        ext-kw (keyword ext)
        uuid   (:block/uuid block)
        repo-dir (config/get-repo-dir (state/get-current-repo))
        file-url (path/prepend-protocol "file:" (path/path-join repo-dir "assets" (str uuid "." ext)))
        width  (or (get-in block [:logseq.property.asset/resize-metadata :width])
                   (:logseq.property.asset/width block)
                   250)]
    (cond
      (contains? (common-config/img-formats) ext-kw)
      [:img.rounded-sm {:src file-url :loading "lazy" :width width
                        :style {:max-width "100%" :height "auto"}}]

      (contains? config/audio-formats ext-kw)
      [:audio {:src file-url :controls true}]

      (contains? config/video-formats ext-kw)
      [:video {:src file-url :controls true :width width}]

      :else
      [:div.text-sm.text-gray-11 (str (:block/title block) "." ext)])))

(defn- preview-block
  "Renders a single block in the lightweight preview."
  [preview-config block depth]
  (let [uuid (:block/uuid block)]
    (cond
      ;; Asset block (pasted image/audio/video)
      (ldb/asset? block)
      [:div.preview-block {:data-block-uuid (str uuid)
                           :style {:padding-left (str (* (dec depth) 20) "px")}}
       (preview-asset-block block)]

      ;; Embed (block link) — show linked block title only
      (:block/link block)
      (let [linked (:block/link block)
            parsed (format-block/parse-title-and-body
                    (:block/uuid linked) :markdown (:block/title linked))]
        [:div.preview-block {:data-block-uuid (str uuid)
                             :style {:padding-left (str (* (dec depth) 20) "px")}}
         [:div.preview-block-content.flex.items-baseline.gap-2
          [:span.preview-bullet]
          [:span.flex-1.min-w-0
           (when-let [ast (:block.temp/ast-title parsed)]
             (block/map-inline preview-config ast))]]])

      ;; Query block — placeholder
      (some->> (:block/tags block) seq
               (some #(= :logseq.class/Query (:db/ident %))))
      [:div.preview-block {:data-block-uuid (str uuid)
                           :style {:padding-left (str (* (dec depth) 20) "px")}}
       [:div.preview-block-content.flex.items-baseline.gap-2.text-gray-11
        [:span.preview-bullet]
        (shui/tabler-icon "search" {:size 14})
        [:span.italic "Query"]]]

      ;; Regular block
      :else
      (let [parsed (format-block/parse-title-and-body
                    (:block/uuid block) :markdown (:block/title block))
            ast-title (:block.temp/ast-title parsed)
            ast-body (:block.temp/ast-body parsed)
            has-children? (boolean (seq (:block/_parent block)))
            collapsed? (:block/collapsed? block)]
        [:div.preview-block {:data-block-uuid (str uuid)
                             :style {:padding-left (str (* (dec depth) 20) "px")}}
         [:div.preview-block-content.flex.items-baseline.gap-2
          [:span.preview-bullet {:class (when (and has-children? collapsed?) "collapsed")}]
          [:span.flex-1.min-w-0
           (when ast-title (block/map-inline preview-config ast-title))]]
         (when (seq ast-body)
           [:div.preview-block-body
            (keep #(preview-body-element preview-config %) ast-body)])]))))

(def ^:private skeleton-lines
  "Varied widths and indent levels for the preview skeleton."
  [[70 0] [85 0] [55 20] [40 20] [60 20]
   [75 0] [50 0] [90 20] [65 20] [80 0]])

(defn- preview-skeleton
  "Renders an outliner-shaped skeleton placeholder during async entity loading."
  []
  [:div
   [:div.px-4.pt-3.pb-2
    (shui/skeleton {:class "h-5 w-2/5"})]
   [:div.preview-blocks
    (for [[i [width indent]] (map-indexed vector skeleton-lines)]
      [:div.preview-block {:key i
                           :style {:padding-left (str indent "px")}}
       [:div.preview-block-content.flex.items-baseline.gap-2
        [:span.preview-bullet]
        (shui/skeleton {:class "h-3" :style {:width (str width "%")}})]])]])

(defn- preview-page-blocks
  "Renders a lightweight page preview by walking the block tree.
   Uses entity-based lazy traversal — only touches blocks actually rendered.
   Falls back to :block/_raw-parent for object pages whose regular blocks are
   filtered out (property blocks).
   When highlight-block-uuid is provided, the walk continues past the safety cap
   until the target block is found — guaranteeing it is in the DOM for scrollIntoView."
  [page-entity & {:keys [highlight-block-uuid]}]
  (let [preview-config {:preview? true :disable-preview? true}
        max-blocks 2000
        *count (atom 0)
        *found-target? (atom (nil? highlight-block-uuid))
        walk (fn walk [parent depth]
               (when (or (< @*count max-blocks) (not @*found-target?))
                 (let [children (ldb/sort-by-order
                                 (if (= depth 1)
                                   ;; At page level: try regular blocks first, fall back to raw
                                   (or (seq (:block/_parent parent))
                                       (:block/_raw-parent parent))
                                   ;; Nested: always use regular blocks
                                   (:block/_parent parent)))]
                   (->> children
                        (keep (fn [block]
                                (when (or (< @*count max-blocks) (not @*found-target?))
                                  (when-not (string/blank? (:block/title block))
                                    (swap! *count inc)
                                    (when (= (:block/uuid block) highlight-block-uuid)
                                      (reset! *found-target? true))
                                    (let [collapsed? (:block/collapsed? block)
                                          child-elements (when-not collapsed?
                                                           (walk block (inc depth)))]
                                      [:div {:key (str (:block/uuid block))}
                                       (preview-block preview-config block depth)
                                       (when (seq child-elements)
                                         child-elements)])))))
                        seq))))]
    [:div.preview-blocks
     (or (walk page-entity 1)
         [:div.p-4.text-gray-11.text-sm.italic "Empty page"])]))

(defn- preview-class-objects-list
  "Renders the object list once data is available. Pure render function."
  [all-objects]
  (let [total (count all-objects)
        max-items 500
        sorted (->> all-objects
                    (sort-by :block/updated-at >)
                    (take max-items))
        remaining (- total max-items)]
    [:div.preview-blocks
     (if (zero? total)
       [:div.p-4.text-gray-11.text-sm.italic "No objects"]
       [:<>
        [:div.px-3.pt-2.pb-1.text-xs.text-gray-11
         (str total " " (if (= total 1) "object" "objects"))]
        (for [obj sorted]
          (let [node-icon (icon-component/get-node-icon obj)
                title (or (:block/title obj) "Untitled")]
            [:div.preview-block {:key (str (:block/uuid obj))}
             [:div.preview-block-content.flex.items-start.gap-2
              [:span.flex-shrink-0.flex.items-center.justify-center.mt-0.5
               {:style {:width 18 :height 18}}
               (if (string? node-icon)
                 (shui/tabler-icon node-icon (cond-> {:size 14}
                                               (#{"property" "child-node" "page-property" "node"} node-icon)
                                               (assoc :extension? true)))
                 (when (map? node-icon)
                   (icon-component/icon node-icon {:size 14})))]
              [:span.flex-1.min-w-0 title]]]))
        (when (pos? remaining)
          [:div.px-3.py-1.text-xs.text-gray-11.italic
           (str "+" remaining " more")])])]))

(hsx/defc preview-class-objects
  "Async-loads objects tagged with a class from the DB worker, then renders a
   lightweight list. The main-thread DB is a lazy subset, so (:block/_tags class)
   is typically empty until we explicitly fetch from the worker."
  [class-entity]
  (let [class-id (:db/id class-entity)
        [objects set-objects!] (hooks/use-state nil)]
    (hooks/use-effect!
     (fn []
       (-> (db-async/<get-tag-objects (state/get-current-repo) class-id)
           (p/then (fn [_]
                     ;; Objects are now transacted into main-thread DB.
                     ;; Re-query locally for live Datascript entities.
                     (set-objects! (model/get-class-objects
                                    (state/get-current-repo) class-id)))))
       js/undefined)
     [class-id])
    (if (nil? objects)
      [:div.preview-blocks
       [:div.p-4.text-gray-11.text-sm.italic "Loading..."]]
      (preview-class-objects-list objects))))

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
        current-page-uuid (page-util/get-current-page-uuid)
        expanded? (::expanded? state)
        opts (cmdk-state/cmdk-block-search-options
              {:filter-group :nodes
               :dev? config/dev?
               :action (get-action)
               :expanded? expanded?})]
    (swap! !results assoc-in [group :status] :loading)
    (swap! !results assoc-in [:current-page :status] :loading)
    (p/let [search-result (search/block-search repo @!input opts)
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
        current-page (when-let [id (page-util/get-current-page-id)]
                       (db/entity id))
        opts (cmdk-state/cmdk-block-search-options
              {:filter-group :codes
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
  (if-let [current-page (when-let [id (page-util/get-current-page-id)]
                          (db/entity id))]
    (let [!results (::results state)
          !input (::input state)
          repo (state/get-current-repo)
          expanded? (::expanded? state)
          opts (cmdk-state/cmdk-block-search-options
                {:filter-group :current-page
                 :dev? config/dev?
                 :page-uuid (:block/uuid current-page)
                 :expanded? expanded?})]
      (swap! !results assoc-in [group :status] :loading)
      (swap! !results assoc-in [:current-page :status] :loading)
      (p/let [search-result (search/block-search repo @!input opts)
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
          (js/setTimeout #(load-results :wikidata-entities state) wikidata-search-debounce-ms)
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

(declare action-bar contextual-tip <ensure-class-exists!)

(hsx/defc page-dialog-footer
  "Footer for the inline-create → quick-edit morph: Done (Esc), Open page (mod+shift+o),
   Open in sidebar (mod+shift+enter). A document keydown listener handles the shortcuts,
   incl. plain Escape (trunk's modal-inner swallows Escape after the morph)."
  [block {:keys [open-label]}]
  (let [open-label (or open-label (t :cmdk.action/open-tag-page))]
    (hooks/use-effect!
     (fn []
       (let [handler (fn [e]
                       (let [meta? (util/meta-key? e)
                             shift? (.-shiftKey e)
                             key (.-key e)]
                         (cond
                           (and meta? shift? (= key "o"))
                           (do (.preventDefault e) (.stopPropagation e)
                               (shui/dialog-close!)
                               (route-handler/redirect-to-page! (:block/uuid block)))

                           (and meta? shift? (= key "Enter"))
                           (do (.preventDefault e) (.stopPropagation e)
                               (state/sidebar-add-block! (state/get-current-repo) (:db/id block) :page)
                               (shui/dialog-close!))

                           (= key "Escape")
                           (do (.preventDefault e)
                               (shui/dialog-close! :ls-dialog-cmdk)))))]
         (.addEventListener js/document "keydown" handler)
         (fn [] (.removeEventListener js/document "keydown" handler))))
     [])
    (action-bar
     {:tip (contextual-tip)
      :primary {:text (t :cmdk.action/done) :shortcut "esc"
                :on-click #(shui/dialog-close! :ls-dialog-cmdk)}
      :secondary [{:text open-label
                   :icon "open-as-page" :icon-extension? true
                   :shortcut ["cmd" "shift" "o"]
                   :on-click (fn []
                               (shui/dialog-close!)
                               (route-handler/redirect-to-page! (:block/uuid block)))}
                  {:text (t :cmdk.action/open-in-sidebar)
                   :icon "move-to-sidebar-right" :icon-extension? true
                   :shortcut ["cmd" "shift" "return"]
                   :on-click (fn []
                               (state/sidebar-add-block! (state/get-current-repo) (:db/id block) :page)
                               (shui/dialog-close!))}]})))

(defmethod handle-action :create [_ state _event]
  (let [item (state->highlighted-item state)
        !input (::input state)
        create-class? (string/starts-with? @!input "#")
        create-object? (:create-object? item)
        create-page? (and (= :page (:source-create item)) (not create-object?) (not create-class?))
        class (when create-class? (get-class-from-input @!input))
        page-dialog-content (fn [block opts]
                              [:div.w-full.h-full.flex.flex-col.bg-gray-02
                               [:div.px-16.py-8.flex-1.min-h-0.overflow-y-auto
                                (component-page/page-container block {:tag-dialog? true})]
                               (page-dialog-footer block opts)])]
    (cond
      ;; Configure an existing tag — synchronous morph
      (:class item)
      (shui/dialog-transition-to! :ls-dialog-cmdk
                                  (page-dialog-content (:class item) {})
                                  {:close-btn? true})

      ;; Create an object page ("Name #Tag") — async create + tag, then morph
      create-object?
      (let [page-name (:page-name item)
            tag-names (:tag-names item)]
        (p/let [tag-entities (p/all (mapv <ensure-class-exists! tag-names))
                page (page-handler/<create! page-name
                                            {:redirect? false
                                             :tags (vec (keep :block/uuid tag-entities))})]
          (when page
            (shui/dialog-transition-to! :ls-dialog-cmdk
                                        (page-dialog-content page {:open-label (t :cmdk.action/open-page)})
                                        {:close-btn? true}))))

      ;; Create a new tag or page — async
      :else
      (p/let [result (cond
                       create-class? (db-page-handler/<create-class! class {:redirect? false})
                       create-page? (page-handler/<create! @!input {:redirect? false}))]
        (if result
          (shui/dialog-transition-to! :ls-dialog-cmdk
                                      (page-dialog-content result (when create-page? {:open-label (t :cmdk.action/open-page)}))
                                      {:close-btn? true})
          (shui/dialog-close! :ls-dialog-cmdk))))))

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


;; ============================================================================
;; "From Web" — Wikidata entity search & import (ported from design-improvements)
;; ============================================================================

(defn- <ensure-class-exists!
  "Ensure a class with the given title exists, creating it (with its Wikidata
   default-icon) if needed. Returns the class entity."
  [class-title]
  (let [existing-class (db/get-page class-title)]
    (if (and existing-class (ldb/class? existing-class))
      (p/resolved existing-class)
      (p/let [new-class (db-page-handler/<create-class! class-title {:redirect? false})]
        (when-let [default-icon (get wikidata/class->default-icon class-title)]
          (db-property-handler/set-block-property!
           (:block/uuid new-class)
           :logseq.property.class/default-icon
           default-icon))
        new-class))))

(defn- get-page-by-wikidata-id
  "Find an existing page created from the given Wikidata entity (dedup)."
  [qid]
  (try
    (when-let [db (db/get-db)]
      (some->> (d/q '[:find [?p ...]
                      :in $ ?qid
                      :where [?p :logseq.property/wikidata-id ?qid]]
                    db qid)
               first
               (db/entity)))
    (catch :default _e
      nil)))

(defn- <set-wikidata-icon!
  "Download the Wikidata image and set it as the page's icon (avatar for Person,
   image for others)."
  [page-id image-info label class-title]
  (when-let [image-url (:url image-info)]
    (p/let [repo (state/get-current-repo)
            asset-name (str "wikidata-" (subs label 0 (min 30 (count label))))
            asset (icon-component/<save-url-asset! repo image-url asset-name)]
      (when asset
        (let [icon-spec (wikidata/get-preview-icon-type class-title)
              icon-type (or (:type icon-spec) :image)
              base-data {:asset-uuid (str (:block/uuid asset))
                         :asset-type (:logseq.property.asset/type asset)}
              icon-data (if (= icon-type :avatar)
                          (assoc base-data :value (wikidata/derive-avatar-initials label))
                          base-data)]
          (db-property-handler/set-block-property!
           page-id
           :logseq.property/icon
           {:type icon-type
            :data icon-data}))))))

(defmethod load-results :wikidata-entities [group state]
  (let [!input (::input state)
        !results (::results state)
        input @!input]
    (if (and (not (string/blank? input)) (>= (count input) 2))
      (do
        (when-let [cancel-fn @*wikidata-cancel-token]
          (cancel-fn))
        (wikidata/cancel-image-fetches!)
        (when (not= input @*wikidata-last-query)
          (reset! *wikidata-last-query input)
          (swap! !results assoc-in [group :status] :loading)
          (let [cancelled? (atom false)]
            (reset! *wikidata-cancel-token #(reset! cancelled? true))
            (-> (wikidata/<search-and-enrich input)
                (p/then (fn [results]
                          (when-not @cancelled?
                            (let [items (->> results
                                             (mapv (fn [{:keys [qid label description]}]
                                                     {:icon "globe"
                                                      :icon-theme :gray
                                                      :text label
                                                      :info description
                                                      :preview-initials (wikidata/derive-avatar-initials label)
                                                      :source-wikidata {:qid qid :label label :description description}})))]
                              (swap! !results update group merge {:status :success :items items})
                              (wikidata/<enrich-search-results-with-images
                               (mapv (fn [{:keys [qid]}] {:id qid}) results)
                               (fn [qid {:keys [image-url class-title icon-type]}]
                                 (when-not @cancelled?
                                   (swap! !results update-in [group :items]
                                          (fn [items]
                                            (mapv (fn [item]
                                                    (if (= qid (get-in item [:source-wikidata :qid]))
                                                      (assoc item :preview-image-url image-url
                                                             :preview-icon-type icon-type
                                                             :preview-class-title class-title)
                                                      item))
                                                  items))))))))))
                (p/catch (fn [_err]
                           (swap! !results assoc-in [group :status] :success)))))))
      (swap! !results update group merge {:status :success :items nil}))))

(defmethod handle-action :create-from-wikidata [_ state _event]
  (when-let [item (state->highlighted-item state)]
    (let [{:keys [qid label]} (:source-wikidata item)]
      (when (and qid label)
        (shui/dialog-close! :ls-dialog-cmdk)
        (if-let [existing-page (get-page-by-wikidata-id qid)]
          (route-handler/redirect-to-page! (:block/uuid existing-page))
          (-> (p/let [entity-data (wikidata/<fetch-full-entity qid)]
                (when entity-data
                  (let [{:keys [class image properties description]} entity-data
                        class-title (:title class)
                        {:keys [auto suggest]} (wikidata-import/split-tiers properties)]
                    (p/let [class-entity (when class-title (<ensure-class-exists! class-title))
                            page (page-handler/<create! label {:redirect? false})]
                      (when page
                        (let [page-uuid (:block/uuid page)
                              has-description? (not (string/blank? description))]
                          (db-property-handler/set-block-property!
                           page-uuid :logseq.property/wikidata-id qid)
                          (when class-entity
                            (db-property-handler/set-block-property!
                             page-uuid :block/tags (:db/id class-entity)))
                          ;; D1: description (built-in property, no create-first needed).
                          (when has-description?
                            (db-property-handler/set-block-property!
                             page-uuid :logseq.property/description description))
                          ;; R1: suppress the auto-fetcher before the page mounts.
                          (icon-component/mark-fetch-attempted! (:db/id page))
                          (route-handler/redirect-to-page! page-uuid)
                          (when image
                            (<set-wikidata-icon! (:db/id page) image label class-title))
                          ;; SUGGEST tier -> inline band (rendered in Phase C).
                          (wikidata-import/stash-suggestions! page-uuid suggest)
                          ;; AUTO tier -> create+write scalars, then one Undo toast.
                          (p/let [auto-n (wikidata-import/<write-auto-properties! page-uuid auto)]
                            (let [n (+ auto-n (if has-description? 1 0))]
                              (when (pos? n)
                                (shui/toast!
                                 (fn [{:keys [dismiss!]}]
                                   [:span
                                    (str "Added " n " " (if (= 1 n) "detail" "details")
                                         " from Wikidata ")
                                    (shui/button
                                     {:size :sm :variant :secondary
                                      :on-click (fn []
                                                  (dismiss!)
                                                  (wikidata-import/clear-suggestions! page-uuid)
                                                  (page-handler/<delete!
                                                   page-uuid
                                                   (fn [] (route-handler/redirect-to-home!))))}
                                     "Undo")])
                                 :default
                                 {:duration 8000}))))))))))
              (p/catch (fn [_err] nil))))))))

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
      (p/let [page (some-> (get-highlighted-page-uuid-or-name state) db/get-page)
              _ (db-async/<get-block repo (:block/uuid page) :children? false)
              page' (db/entity repo [:block/uuid (:block/uuid page)])
              link (some (fn [[k v]]
                           (when (= :url (:logseq.property/type (db/entity repo k)))
                             (:block/title v)))
                         (:block/properties page'))]
        (if link
          (js/window.open link)
          (notification/show! (t :cmdk.error/no-page-link) :warning)))

      (:source-block item)
      (p/let [block-id (:block/uuid (:source-block item))
              _ (db-async/<get-block repo block-id :children? false)
              block (db/entity [:block/uuid block-id])
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
                                   [])
        [preview-enabled?] (hooks/use-atom (::preview-enabled? state))]
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
    [:div.cp__cmdk-input-row {:class "bg-gray-02 border-b border-1 border-gray-07 flex items-center"}
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
       :default-value input}]
     (when-not (:sidebar? opts)
       (shui/button
        {:variant (if preview-enabled? :secondary :ghost)
         :size :sm
         :class (str "mr-3 px-1.5" (if preview-enabled? " opacity-100" " opacity-50 hover:opacity-100"))
         :title (if preview-enabled? (t :cmdk.preview/hide) (t :cmdk.preview/show))
         :on-click (fn []
                     (let [new-val (not @(::preview-enabled? state))]
                       (reset! (::preview-enabled? state) new-val)
                       (storage/set :cmdk-preview-pane? new-val)))
         :data-button "icon"}
        (shui/tabler-icon "layout-sidebar-right"
                          (cond-> {:size 16}
                            preview-enabled?
                            (assoc :style {:color "var(--lx-accent-09, var(--ls-link-text-color))"})))))]))

(defn hint-tip
  "A tip line: a flex row of shortcut badges + text. Children should end with a
   [:span.hints-tip-tail …] so only the trailing text ellipsis-truncates."
  [& children]
  (into [:div.flex.flex-row.gap-1.items-center.opacity-50.hover:opacity-100]
        children))

(defn- tip-with-shortcut
  "Render an i18n tip template ('… {1} …') as a truncatable hint line: the pre text
   and the shortcut badge stay fixed, only the trailing text ellipsizes."
  [template shortcut & [shortcut-opts]]
  (let [parts (interpolate-rich-text template [(shui/shortcut shortcut shortcut-opts)])
        n (count parts)]
    (apply hint-tip
           (map-indexed
            (fn [i part]
              (if (string? part)
                (if (= i (dec n)) [:span.hints-tip-tail part] [:span part])
                part))
            parts))))

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

(hsx/defc contextual-tip
  "Context-aware footer tip: normally a jump-to-property hint; for ~3s after an edit
   ends it flips to 'Changes saved automatically'."
  []
  (let [[editing] (hooks/use-atom (:editor/editing? @state/state))
        is-editing? (boolean (seq editing))
        !has-edited (hooks/use-ref false)
        !prev-editing (hooks/use-ref false)
        [show-saved? set-show-saved!] (hooks/use-state false)]
    (hooks/use-effect!
     (fn []
       (let [was-editing? (.-current !prev-editing)]
         (set! (.-current !prev-editing) is-editing?)
         (when is-editing?
           (set! (.-current !has-edited) true))
         (if (and was-editing? (not is-editing?) (.-current !has-edited))
           (do (set-show-saved! true)
               (let [t (js/setTimeout #(set-show-saved! false) 3000)]
                 (fn [] (js/clearTimeout t))))
           js/undefined)))
     [is-editing?])
    [:div.text-sm.leading-6
     [:div.flex.flex-row.gap-1.items-center
      [:span.font-medium.text-gray-12 (t :cmdk.tip/label)]
      [:div.tip-rotate {:key (if show-saved? :saved :shortcut)}
       (if show-saved?
         (hint-tip (icon-component/icon "circle-check" {:size 14})
                   [:span.hints-tip-tail (t :cmdk.tip/saved)])
         (tip-with-shortcut (t :cmdk.tip/jump-to-property) ["cmd" "j"]
                            {:style :combo :aria-hidden? true}))]]]))

(hsx/defc hint-button
  [text shortcut opts]
  (let [primary? (:primary? opts)
        opts (dissoc opts :primary?)
        props (merge {:class (if primary?
                               "hint-button"
                               "hint-button text-gray-11 hover:text-gray-12")
                      :variant (if primary? :secondary :ghost)
                      :size :sm}
                     opts)
        children (cond-> [[:span text]]
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

(hsx/defc hints-more-dropdown
  [items]
  (shui/dropdown-menu
   (shui/dropdown-menu-trigger
    {:asChild true}
    (shui/button {:variant :ghost :size :sm
                  :class "hint-button text-gray-11 hover:text-gray-12"}
                 [[:span.flex.items-center.gap-1
                   (icon-component/icon "dots-vertical" {:size 15})
                   (t :cmdk.action/more)
                   (icon-component/icon "chevron-down" {:size 14})]]))
   (shui/dropdown-menu-content
    {:align "end" :side "top"
     :onOpenAutoFocus (fn [e]
                        (.preventDefault e)
                        (when-let [first-item (.. e -currentTarget (querySelector "[role=menuitem]"))]
                          (.focus first-item)))}
    (for [{:keys [text icon icon-extension? shortcut on-click]} items]
      (shui/dropdown-menu-item
       {:key text :on-click on-click}
       [:div.flex.items-center.justify-between.w-full.gap-4
        [:span.flex.items-center.gap-2
         (when icon (icon-component/icon icon {:size 16 :extension? icon-extension?}))
         text]
        (when shortcut
          (shui/shortcut shortcut {:style :combo :aria-hidden? true}))])))))

(hsx/defc action-bar
  "Shared footer action bar with responsive collapse: a tip on the left, a primary
   button (rightmost), and secondary buttons that collapse into a 'More' dropdown
   when space is tight. :cache-key resets the cached expanded width when it changes."
  [{:keys [tip primary secondary cache-key]}]
  (let [*container-ref (hooks/use-ref nil)
        *actions-ref (hooks/use-ref nil)
        *expanded-w (hooks/use-ref nil)
        *prev-cache-key (hooks/use-ref nil)
        [collapsed? set-collapsed!] (hooks/use-state false)
        _ (hooks/use-effect!
           (fn []
             (when (not= cache-key (.-current *prev-cache-key))
               (set! (.-current *expanded-w) nil)
               (set! (.-current *prev-cache-key) cache-key))
             (if-let [container (.-current *container-ref)]
               (let [check (fn []
                             (when-let [actions (.-current *actions-ref)]
                               (when (and (not collapsed?)
                                          (> (.-offsetWidth actions) 0))
                                 (set! (.-current *expanded-w) (.-offsetWidth actions))))
                             (let [ew (or (.-current *expanded-w) 0)
                                   needed (+ 300 ew 8)]
                               (set-collapsed! (> needed (.-clientWidth container)))))
                     ob (js/ResizeObserver. check)]
                 (check)
                 (.observe ob container)
                 (fn [] (.disconnect ob)))
               js/undefined))
           [cache-key collapsed?])]
    [:div.hints {:ref *container-ref}
     [:div.hints-tip.text-sm.leading-6 tip]
     [:div.hints-actions {:ref *actions-ref}
      (when (seq secondary)
        (if collapsed?
          (hints-more-dropdown secondary)
          (into [:<>]
                (map (fn [b]
                       (hint-button (:text b) (:shortcut b)
                                    {:key (:text b) :on-click (:on-click b)}))
                     secondary))))
      (hint-button (:text primary) (:shortcut primary)
                   {:primary? true :on-click (:on-click primary)})]]))

(hsx/defc hints
  [state fallback-item]
  (let [[_highlighted] (hooks/use-atom (::highlighted-item state))
        item (state->highlighted-item state fallback-item)
        action (state->action state fallback-item)
        make-button (fn [text shortcut & {:as opts}]
                      {:text text :shortcut shortcut
                       :on-click #(handle-action action (assoc state :opts opts) %)})
        {:keys [primary secondary]}
        (case action
          :open
          {:primary (make-button (t :cmdk.action/open) ["return"])
           :secondary (cond-> [(make-button (t :cmdk.action/open-in-sidebar) ["shift" "return"] {:open-sidebar? true})]
                        (:source-block (state->highlighted-item state fallback-item))
                        (conj (make-button (t :cmdk.action/copy-ref) ["cmd" "c"])))}
          :search {:primary (make-button (t :cmdk.action/search) ["return"]) :secondary []}
          :trigger {:primary (make-button (t :cmdk.action/trigger) ["return"]) :secondary []}
          :create {:primary (make-button (or (:text item) (t :cmdk.action/create)) ["return"]) :secondary []}
          :filter {:primary (make-button (t :cmdk.action/filter) ["return"]) :secondary []}
          :theme {:primary (make-button (t :cmdk.action/apply-theme) ["return"]) :secondary []}
          :create-from-wikidata {:primary (make-button (or (:text item) (t :cmdk.action/create)) ["return"]) :secondary []}
          {:primary nil :secondary []})]
    (when (and action primary)
      (action-bar
       {:tip [:div.flex.flex-row.gap-1.items-center
              [:span.font-medium.text-gray-12 (t :cmdk.tip/label)]
              (tip state)]
        :primary primary
        :secondary secondary
        :cache-key action}))))

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

(hsx/defc preview-debounce-tracker
  "Debounces the highlighted item to avoid rapid preview show/hide.
   Uses a ref to store the latest value, read at fire time to prevent stale closures."
  [state]
  (let [[highlighted-item] (hooks/use-atom (::highlighted-item state))
        *debounced (::preview-debounced-item state)
        *timer (hooks/use-ref nil)
        *latest (hooks/use-ref highlighted-item)]
    ;; Always keep latest ref in sync
    (set! (.-current *latest) highlighted-item)
    (hooks/use-effect!
     (fn []
       (when-let [t (.-current *timer)] (js/clearTimeout t))
       (set! (.-current *timer)
             (js/setTimeout
              (fn []
                ;; Read the ref at fire time, not closure-creation time
                (let [current (.-current *latest)]
                  (if (previewable-item? current)
                    (reset! *debounced current)
                    (reset! *debounced nil))))
              60))
       #(when-let [t (.-current *timer)] (js/clearTimeout t)))
     [highlighted-item])
    nil))

(hsx/defc preview-pane
  "Renders a lightweight static page preview.
   Tries synchronous entity resolution first, falls back to async loading
   from the DB worker for entities not yet in the main-thread Datascript DB."
  [item]
  (let [source (:source-block item)
        source-uuid (:block/uuid source)
        source-eid (:db/id source)
        ;; Try synchronous resolution (works for entities already in main-thread DB)
        sync-entity (preview-page-entity item)
        [page-entity set-page-entity!] (hooks/use-state sync-entity)
        block-uuid (when (and source (not (:page? source)))
                     (:block/uuid source))
        *container (hooks/use-ref nil)]
    ;; Load the page's FULL descendant tree from the worker so nested child
    ;; blocks render -- not just the page's top-level blocks. {:children? true}
    ;; alone transacts only one level into the lazy main-thread DB, leaving
    ;; grandchildren (e.g. notes nested under a tagged block) missing;
    ;; :include-collapsed-children? true pulls the entire subtree. A
    ;; synchronously-resolvable entity is shown immediately for a snappy first
    ;; paint, then we re-render once the full tree has loaded.
    (hooks/use-effect!
     (fn []
       (when sync-entity (set-page-entity! sync-entity))
       (when-let [id (or source-uuid source-eid)]
         (-> (db-async/<get-block (state/get-current-repo) id
                                  {:children? true :include-collapsed-children? true})
             (p/then (fn [_]
                       ;; Entity is now transacted into main-thread DB, retry resolution
                       (let [entity (preview-page-entity item)]
                         (when entity
                           ;; Load the resolved page's full tree (it may differ from the
                           ;; loaded entity, e.g. a block's parent page) so every level renders.
                           (-> (db-async/<get-block (state/get-current-repo)
                                                    (:block/uuid entity)
                                                    {:children? true :include-collapsed-children? true})
                               (p/then (fn [_] (set-page-entity! entity))))))))))
       js/undefined)
     [source-uuid source-eid])
    ;; Auto-scroll to matched block (for block search results).
    ;; The highlight class is applied and never removed -- the CSS animation
    ;; handles the visual pulse (bright → subtle) and the subtle tint persists
    ;; so the user can always see which block matched, even after pausing.
    (hooks/use-effect!
     (fn []
       (when (and block-uuid (.-current *container))
         (let [t (js/setTimeout
                  (fn []
                    (let [container (.-current *container)
                          ;; Try direct match first; fall back to nearest visible ancestor
                          ;; (handles blocks hidden under a collapsed parent)
                          el (or (.querySelector container
                                                 (str "[data-block-uuid='" block-uuid "']"))
                                 (when-let [block-entity (db/entity [:block/uuid block-uuid])]
                                   (loop [parent (:block/parent block-entity)]
                                     (when (and parent (:block/uuid parent))
                                       (or (.querySelector container
                                                           (str "[data-block-uuid='"
                                                                (:block/uuid parent) "']"))
                                           (recur (:block/parent parent)))))))]
                      (when el
                        (.scrollIntoView el #js {:block "center"})
                        ;; Remove then re-add in the next frame to restart the CSS
                        ;; animation when the same block is highlighted again.
                        (.remove (.-classList el) "cmdk-preview-highlight")
                        (js/requestAnimationFrame
                         #(.add (.-classList el) "cmdk-preview-highlight")))))
                  50)]
           #(js/clearTimeout t)))
       js/undefined)
     [(:db/id page-entity) block-uuid])
    ;; Toggle .has-overflow so the CSS bottom-fade gradient only shows when scrollable
    (hooks/use-effect!
     (fn []
       (when-let [el (.-current *container)]
         (let [check #(let [overflows? (> (.-scrollHeight el) (.-clientHeight el))]
                        (.toggle (.-classList el) "has-overflow" overflows?))
               ro (js/ResizeObserver. check)]
           (check)
           (.observe ro el)
           #(.disconnect ro))))
     [(:db/id page-entity)])
    [:div.cmdk-preview-pane {:ref *container}
     (if page-entity
       [:div.cmdk-preview-content
        [:div.preview-page-title.px-6.pt-3.pb-2
         [:span.text-lg.font-bold (:block/title page-entity)]]
        (if (ldb/class? page-entity)
          (preview-class-objects page-entity)
          (preview-page-blocks page-entity
                               :highlight-block-uuid block-uuid))]
       (preview-skeleton))]))

(defn- cmdk-init-state
  "Initialize cmdk component state atoms."
  [opts]
  ;; Invalidate the commands cache so that each new CMDK session gets a fresh
  ;; commands list from cp-handler/top-commands (plugins, graph state, etc. may
  ;; have changed since the last session).
  (reset! !commands-cache {:lang nil :commands nil})
  (let [raw-search-mode (:search/mode @state/state)
        search-mode (or raw-search-mode :global)
        search-args (:search/args @state/state)
        {input :input filter-group :filter} (cmdk-state/build-initial-cmdk-search
                                             opts
                                             search-mode
                                             search-args
                                             (state/get-current-repo))]
    (when (nil? raw-search-mode)
      (state/set-state! :search/mode :global))
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
     ::results (atom default-results)
     ::preview-enabled? (atom (boolean (storage/get :cmdk-preview-pane?)))
     ::preview-debounced-item (atom nil)}))

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
        search-mode (state/use-sub :search/mode)
        search-args (state/use-sub :search/args)
        [filter'] (hooks/use-atom (::filter state))
        [_results] (hooks/use-atom (::results state))
        [_highlighted-item] (hooks/use-atom (::highlighted-item state))
        [_focus-source] (hooks/use-atom (::focus-source state))
        [preview-enabled?] (hooks/use-atom (::preview-enabled? state))
        [debounced-item] (hooks/use-atom (::preview-debounced-item state))
        group-filter (or (when (and (not= :global search-mode) (not (:sidebar? opts)))
                           search-mode)
                         (:group filter'))
        results-ordered (state->results-ordered state)
        all-items (mapcat last results-ordered)
        first-item (first all-items)
        show-preview? (and preview-enabled? (previewable-item? debounced-item) (not sidebar?))]
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
                             (not sidebar?) (str " rounded-lg")
                             show-preview? (str " cmdk-has-preview"))}
     (input-row state all-items opts)
     (preview-debounce-tracker state)
     [:div.cmdk-body
      [:div.cmdk-results-list {:class (when-not sidebar? "pb-14")
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
              (result-group state title group-key group-items first-item sidebar?)))
          [:div.flex.flex-col.p-4.opacity-50
           (when-not (string/blank? @*input)
             (t :search/no-result))]))]
      (when show-preview?
        [:div.cmdk-preview-container
         {:on-click (fn [e] (handle-action :open state e))}
         (preview-pane debounced-item)])]
     (when-not sidebar? (hints state first-item))]))

(hsx/defc cmdk-modal [props]
  [:div {:class "cp__cmdk__modal rounded-lg w-[90dvw] max-w-4xl relative h-full"
         :data-keep-selection true}
   (cmdk props)])

(hsx/defc cmdk-block [props]
  [:div {:class "cp__cmdk__block rounded-md"}
   (cmdk props)])
