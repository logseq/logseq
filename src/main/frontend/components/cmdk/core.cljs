(ns frontend.components.cmdk.core
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.components.block :as block]
            [frontend.components.cmdk.list-item :as list-item]
            [frontend.components.combobox :as combobox]
            [frontend.components.icon :as icon]
            [frontend.components.list-item-icon :as list-item-icon]
            [frontend.components.page :as component-page]
            [frontend.components.wikidata :as wikidata]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.db.model :as model]
            [frontend.extensions.pdf.utils :as pdf-utils]
            [frontend.format.block :as format-block]
            [frontend.handler.block :as block-handler]
            [frontend.handler.command-palette :as cp-handler]
            [frontend.handler.db-based.page :as db-page-handler]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.route :as route-handler]
            [frontend.mixins :as mixins]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.modules.shortcut.utils :as shortcut-utils]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.storage :as storage]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.page :as page-util]
            [frontend.util.ref :as ref]
            [frontend.util.text :as text-util]
            [goog.functions :as gfun]
            [goog.object :as gobj]
            [logseq.common.config :as common-config]
            [logseq.common.path :as path]
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
  (case group
    :nodes 10
    :wikidata-entities 1
    5))

(defn filters
  []
  (let [current-page (state/get-current-page)]
    (->>
     [(when current-page
        {:filter {:group :current-page} :text "Search only current page" :info "Add filter to search" :icon-theme :gray :icon "file"})
      {:filter {:group :nodes} :text "Search only nodes" :info "Add filter to search" :icon-theme :gray :icon "point-filled"}
      {:filter {:group :commands} :text "Search only commands" :info "Add filter to search" :icon-theme :gray :icon "command"}
      {:filter {:group :files} :text "Search only files" :info "Add filter to search" :icon-theme :gray :icon "file"}
      {:filter {:group :themes} :text "Search only themes" :info "Add filter to search" :icon-theme :gray :icon "palette"}]
     (remove nil?))))

;; The results are separated into groups, and loaded/fetched/queried separately
(def default-results
  {:recently-updated-pages {:status :success :show :less :items nil}
   :commands {:status :success :show :less :items nil}
   :favorites {:status :success :show :less :items nil}
   :current-page {:status :success :show :less :items nil}
   :nodes {:status :success :show :less :items nil}
   :wikidata-entities {:status :success :show :less :items nil}
   :files {:status :success :show :less :items nil}
   :themes {:status :success :show :less :items nil}
   :filters {:status :success :show :less :items nil}})

;; Wikidata search state - used for cancellation and debouncing
(defonce ^:private *wikidata-cancel-token (atom nil))
(defonce ^:private *wikidata-last-query (atom nil))

(def ^:private wikidata-search-debounce-ms 400)

(defn get-class-from-input
  [input]
  (string/replace input #"^#+" ""))

(defn create-items [q]
  (when (and (not (string/blank? q))
             (not (#{"config.edn" "custom.js" "custom.css"} q))
             (not config/publishing?))
    (let [class? (string/starts-with? q "#")
          has-inline-tag? (and (not class?) (string/includes? q " #"))
          ;; Parse "PageName #Tag1 #Tag2" pattern
          [object-page-name object-tag-names]
          (when has-inline-tag?
            (let [parts (string/split q #" #")
                  pn (string/trim (first parts))
                  tns (->> (rest parts) (map string/trim) (remove string/blank?) vec)]
              (when (and (not (string/blank? pn)) (seq tns))
                [pn tns])))
          create-object? (some? object-page-name)
          class-name (get-class-from-input q)
          class (let [class (db/get-case-page class-name)]
                  (when (ldb/class? class)
                    class))]
      (if create-object?
        [{:text (str "Create as #" (string/join ", #" object-tag-names))
          :icon "new-object"
          :icon-extension? true
          :icon-theme :gray
          :info (str "Create page called '" object-page-name "'")
          :source-create :page
          :create-object? true
          :page-name object-page-name
          :tag-names object-tag-names}]
        (->> [{:text (cond
                       class "Configure tag"
                       class? "Create tag"
                       :else "Create page")
               :icon (cond
                       class "settings"
                       class? "new-class"
                       :else "new-page")
               :icon-extension? (not class)
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
             (remove nil?))))))

;; Take the results, decide how many items to show, and order the results appropriately
(defn state->results-ordered [state search-mode]
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
                                  (= input (util/page-name-sanity-lc (:block.temp/original-title block))))) blocks-result)))
        existing-page-names (let [blocks-result (keep :source-block (get-in results [:nodes :items]))]
                              (->> blocks-result
                                   (filter :page?)
                                   (map #(util/page-name-sanity-lc (:block.temp/original-title %)))
                                   set))
        include-slash? (or (string/includes? input "/")
                           (string/starts-with? input "/"))
        start-with-slash? (string/starts-with? input "/")
        order* (cond
                 (= search-mode :graph)
                 []

                 start-with-slash?
                 [["Filters" :filters (visible-items :filters)]
                  ["Current page" :current-page (visible-items :current-page)]
                  ["Nodes" :nodes (visible-items :nodes)]]

                 include-slash?
                 [(when-not node-exists?
                    ["Create" :create (create-items input)])

                  ["Current page" :current-page (visible-items :current-page)]
                  ["Nodes" :nodes (visible-items :nodes)]
                  ["Files" :files (visible-items :files)]
                  ["Filters" :filters (visible-items :filters)]]

                 filter-group
                 [(when (= filter-group :nodes)
                    ["Current page" :current-page (visible-items :current-page)])
                  [(if (= filter-group :current-page) "Current page" (name filter-group))
                   filter-group
                   (visible-items filter-group)]
                  (when-not node-exists?
                    ["Create" :create (create-items input)])]

                 :else
                 (let [;; "From Web" section - Wikidata entity search results
                       ;; Filter out results that match existing page names (D layer)
                       from-web (let [all-wikidata (get-in results [:wikidata-entities :items])
                                      wikidata-status (get-in results [:wikidata-entities :status])
                                      filtered (remove (fn [item]
                                                         (when-let [label (get-in item [:source-wikidata :label])]
                                                           (contains? existing-page-names
                                                                      (util/page-name-sanity-lc label))))
                                                       all-wikidata)
                                      wikidata-items (if (or sidebar? (= :more (get-in results [:wikidata-entities :show])))
                                                       filtered
                                                       (take (get-group-limit :wikidata-entities) filtered))]
                                  (when (or (seq wikidata-items) (= :loading wikidata-status))
                                    ["From Web" :wikidata-entities
                                     (with-meta (vec wikidata-items) {:filtered-total (count filtered)})]))
                       ;; Show Nodes above From Web when local pages match the query
                       has-local-matches?
                       (if (< (count (string/trim input)) 3)
                         true ;; Short queries: always Nodes first
                         (let [query-words (string/split (string/lower-case (string/trim input)) #"\s+")
                               system-prefix? (fn [title-lc]
                                                (or (string/starts-with? title-lc "wikidata-")
                                                    (string/starts-with? title-lc "avatar-")))]
                           (some (fn [item]
                                   (when-let [block (:source-block item)]
                                     (let [title (str (:block.temp/original-title block))
                                           title-lc (string/lower-case title)]
                                       (and (:page? block)
                                            (not (system-prefix? title-lc))
                                            (let [title-words (string/split title-lc #"[^\w]+")]
                                              (every? (fn [qw]
                                                        (some #(string/starts-with? % qw) title-words))
                                                      query-words))))))
                                 (visible-items :nodes))))]
                   (->>
                    [(when-not node-exists?
                       ["Create" :create (create-items input)])
                     (if has-local-matches?
                       ["Current page" :current-page (visible-items :current-page)]
                       from-web)
                     (if has-local-matches?
                       ["Nodes" :nodes (visible-items :nodes)]
                       ["Current page" :current-page (visible-items :current-page)])
                     (if has-local-matches?
                       from-web
                       ["Nodes" :nodes (visible-items :nodes)])
                     ["Recently updated" :recently-updated-pages (visible-items :recently-updated-pages)]
                     ["Commands" :commands (visible-items :commands)]
                     ["Files" :files (visible-items :files)]
                     ["Filters" :filters (visible-items :filters)]]
                    (remove nil?))))
        order (remove nil? order*)]
    (for [[group-name group-key group-items] order]
      [group-name
       group-key
       (if (= group-key :create)
         (count group-items)
         (or (:filtered-total (meta group-items))
             (count (get-in results [group-key :items]))))
       (mapv #(assoc % :item-index (vswap! index inc)) group-items)])))

(defn state->highlighted-item [state]
  (or (some-> state ::highlighted-item deref)
      (some->> (state->results-ordered state (:search/mode @state/state))
               (mapcat last)
               (first))))

(defn state->action [state]
  (let [highlighted-item (state->highlighted-item state)
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
          :else nil)))

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
      (js/console.log "[preview] source-block:"
                      (pr-str (select-keys source [:db/id :block/uuid :block/name :page?]))
                      "entity:" (some? entity)
                      "entity-name:" (:block/name entity)
                      "entity-title:" (:block/title entity))
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
         [:div.preview-block-content.flex.items-baseline.gap-1
          [:span.preview-bullet]
          [:span.flex-1.min-w-0
           (when-let [ast (:block.temp/ast-title parsed)]
             (block/map-inline preview-config ast))]]])

      ;; Query block — placeholder
      (some->> (:block/tags block) seq
               (some #(= :logseq.class/Query (:db/ident %))))
      [:div.preview-block {:data-block-uuid (str uuid)
                           :style {:padding-left (str (* (dec depth) 20) "px")}}
       [:div.preview-block-content.flex.items-baseline.gap-1.text-gray-11
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
         [:div.preview-block-content.flex.items-baseline.gap-1
          [:span.preview-bullet {:class (when (and has-children? collapsed?) "collapsed")}]
          [:span.flex-1.min-w-0
           (when ast-title (block/map-inline preview-config ast-title))]]
         (when (seq ast-body)
           [:div.preview-block-body
            (keep #(preview-body-element preview-config %) ast-body)])]))))

(defn- preview-page-blocks
  "Renders a lightweight page preview by walking the block tree.
   Uses entity-based lazy traversal — only touches blocks actually rendered.
   Falls back to :block/_raw-parent for object pages whose regular blocks are
   filtered out (property blocks)."
  [page-entity]
  (let [preview-config {:preview? true :disable-preview? true}
        max-blocks 200
        *count (atom 0)
        walk (fn walk [parent depth]
               (when (< @*count max-blocks)
                 (let [children (ldb/sort-by-order
                                 (if (= depth 1)
                                   ;; At page level: try regular blocks first, fall back to raw
                                   (or (seq (:block/_parent parent))
                                       (:block/_raw-parent parent))
                                   ;; Nested: always use regular blocks
                                   (:block/_parent parent)))]
                   (->> children
                        (keep (fn [block]
                                (when (< @*count max-blocks)
                                  (when-not (string/blank? (:block/title block))
                                    (swap! *count inc)
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
        max-items 25
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
          (let [node-icon (icon/get-node-icon obj)
                title (or (:block/title obj) "Untitled")]
            [:div.preview-block {:key (str (:block/uuid obj))}
             [:div.preview-block-content.flex.items-center.gap-2
              [:span.flex-shrink-0.flex.items-center.justify-center
               {:style {:width 18 :height 18}}
               (if (string? node-icon)
                 (shui/tabler-icon node-icon {:size 14})
                 (when (map? node-icon)
                   (icon/icon node-icon {:size 14})))]
              [:span.truncate title]]]))
        (when (pos? remaining)
          [:div.px-3.py-1.text-xs.text-gray-11.italic
           (str "+" remaining " more")])])]))

(rum/defc preview-class-objects
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

(defn- get-page-icon
  "Returns a string icon name for the entity type."
  [entity]
  (cond
    (ldb/class? entity) "hash"
    (ldb/property? entity) "letter-p"
    :else "file"))

;; Each result group has it's own load-results function
(defmulti load-results (fn [group _state] group))

(defmethod load-results :initial [_ state]
  (when-let [db (db/get-db)]
    (let [!results (::results state)
          recent-pages (keep (fn [block]
                               ;; Guard against stale entities from worker→main-thread sync lag
                               ;; (e.g. recently deleted pages whose retraction hasn't arrived yet)
                               (when (and (:block/title block) (:block/uuid block))
                                 (let [tags (block-handler/visible-tags block)
                                       text (block-handler/block-unique-title block {:with-tags? false})
                                       icon (get-page-icon block)]
                                   (cond-> {:icon icon
                                            :icon-theme :gray
                                            :text text
                                            :source-block block}
                                     (seq tags)
                                     (assoc :text-tags (string/join ", " (keep (fn [t] (when-let [title (:block/title t)] (str "#" title))) tags)))))))
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
                  (let [tags (block-handler/visible-tags block)
                        text (block-handler/block-unique-title block {:with-tags? false})
                        icon (get-page-icon block)]
                    (cond-> {:icon icon
                             :icon-theme :gray
                             :text text
                             :source-block block}
                      (seq tags)
                      (assoc :text-tags (string/join ", " (keep (fn [t] (when-let [title (:block/title t)] (str "#" title))) tags)))))))
           (hash-map :status :success :items)
           (swap! !results update group merge)))))

(defn highlight-content-query
  "Return hiccup of highlighted content FTS result"
  [content q]
  (when-not (or (string/blank? content) (string/blank? q))
    [:div (loop [content content ;; why recur? because there might be multiple matches
                 result []]
            (let [[b-cut hl-cut e-cut] (text-util/cut-by content "$pfts_2lqh>$" "$<pfts_2lqh$")
                  hiccups-add [[:span b-cut]
                               [:span {:class "ui__list-item-highlighted-span"} hl-cut]]
                  hiccups-add (remove nil? hiccups-add)
                  new-result (concat result hiccups-add)]
              (if-not (string/blank? e-cut)
                (recur e-cut new-result)
                new-result)))]))

(defn page-item
  [repo page input]
  (let [entity (-> (or (db/entity [:block/uuid (:block/uuid page)]) page)
                   (update :block/tags (fn [tags]
                                         (map (fn [tag]
                                                (if (integer? tag)
                                                  (db/entity tag)
                                                  tag)) tags))))
        source-page (or (model/get-alias-source-page repo (:db/id entity))
                        (:alias page))
        icon (get-page-icon entity)
        alias-title (:block/title source-page)
        full-title (block-handler/block-unique-title entity {:alias alias-title})
        fts? (string/includes? (or full-title "") "$pfts_2lqh>$")
        tags (when-not fts? (block-handler/visible-tags entity))
        base-title (if fts?
                     full-title
                     (block-handler/block-unique-title entity {:with-tags? false :alias alias-title}))]
    (cond-> (hash-map :icon icon
                      :icon-theme :gray
                      :text (if fts?
                              [:span {"data-testid" full-title}
                               (highlight-content-query full-title input)]
                              base-title)
                      :header (when (:block/parent entity)
                                (block/breadcrumb {:disable-preview? true
                                                   :search? true} repo (:block/uuid page)
                                                  {:disabled? true}))
                      :alias (:alias page)
                      :source-block (or source-page page))
      (seq tags)
      (assoc :text-tags (string/join ", " (keep (fn [t] (when-let [title (:block/title t)] (str "#" title))) tags))))))

(defn block-item
  [repo block current-page input]
  (let [id (:block/uuid block)
        text (block-handler/block-unique-title block)
        icon "letter-n"]
    {:icon icon
     :icon-theme :gray
     :text (highlight-content-query text input)
     :header (block/breadcrumb {:disable-preview? true
                                :search? true} repo id
                               {:disabled? true})
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
        opts (cond-> {:limit 100 :dev? config/dev? :built-in? true}
               (contains? #{:move-blocks} (get-action))
               (assoc :page-only? true))]
    (swap! !results assoc-in [group :status] :loading)
    (swap! !results assoc-in [:current-page :status] :loading)
    (p/let [blocks (search/block-search repo @!input opts)
            blocks (remove nil? blocks)
            items (keep (fn [block]
                          (if (:page? block)
                            (page-item repo block @!input)
                            (block-item repo block current-page @!input))) blocks)]
      (if (= group :current-page)
        (let [items-on-current-page (filter :current-page? items)]
          (swap! !results update group merge {:status :success :items items-on-current-page}))
        (swap! !results update group merge {:status :success :items items})))))

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
                              :header (block/breadcrumb {:search? true} repo id {:disabled? true})
                              :current-page? true
                              :source-block block})) blocks)]
        (swap! !results update :current-page merge {:status :success :items items})))
    (reset! (::filter state) nil)))

;; Wikidata entity search - searches Wikidata for matching entities
(defmethod load-results :wikidata-entities [group state]
  (let [!input (::input state)
        !results (::results state)
        input @!input]
    (js/console.log "[wikidata-debug] load-results called, input:" input "last-query:" @*wikidata-last-query)
    ;; Only search if input is non-empty and at least 2 characters
    (if (and (not (string/blank? input)) (>= (count input) 2))
      (do
        ;; Cancel any previous in-flight request
        (when-let [cancel-fn @*wikidata-cancel-token]
          (js/console.log "[wikidata-debug] Cancelling previous search")
          (cancel-fn))
        ;; Also cancel any pending image fetches
        (wikidata/cancel-image-fetches!)

        ;; Only search if query changed (debounced by caller)
        (when (not= input @*wikidata-last-query)
          (reset! *wikidata-last-query input)

          ;; Set loading state
          (swap! !results assoc-in [group :status] :loading)

          ;; Create new cancel token
          (let [cancelled? (atom false)]
            (reset! *wikidata-cancel-token #(reset! cancelled? true))

            ;; Search Wikidata
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
                                                      :source-wikidata {:qid qid
                                                                        :label label
                                                                        :description description}})))]
                              (js/console.log "[wikidata-debug] Search success, setting" (count items) "items")
                              (swap! !results update group merge
                                     {:status :success :items items})
                              ;; Start fetching images in background
                              (wikidata/<enrich-search-results-with-images
                               (mapv (fn [{:keys [qid]}] {:id qid}) results)
                               ;; Callback: update item with image info when it arrives
                               (fn [qid {:keys [image-url class-title icon-type]}]
                                 (when-not @cancelled?
                                   (swap! !results update-in [group :items]
                                          (fn [items]
                                            (mapv (fn [item]
                                                    (if (= qid (get-in item [:source-wikidata :qid]))
                                                      (assoc item
                                                             :preview-image-url image-url
                                                             :preview-icon-type icon-type
                                                             :preview-class-title class-title)
                                                      item))
                                                  items))))))))))
                (p/catch (fn [err]
                           (js/console.error "[wikidata-debug] Search error:" err)
                           (when-not @cancelled?
                             (js/console.log "[wikidata-debug] Setting error state, clearing items")
                             (swap! !results update group merge
                                    {:status :error :items []}))))))))
      ;; Clear results if input is empty or too short
      (do
        (js/console.log "[wikidata-debug] Input too short, clearing results")
        (wikidata/cancel-image-fetches!)
        (swap! !results update group merge {:status :success :items []})))))

;; Debounced version of Wikidata search
(def ^:private load-wikidata-results-debounced
  (gfun/debounce
   (fn [state]
     (load-results :wikidata-entities state))
   wikidata-search-debounce-ms))

;; The default load-results function triggers all the other load-results function
(defmethod load-results :default [_ state]
  (let [filter-group (:group @(::filter state))]
    (if (and (not (some-> state ::input deref seq))
             (not filter-group))
      (do (load-results :initial state)
          (load-results :filters state)
          ;; Clear wikidata results when input is empty
          (js/console.log "[wikidata-debug] Input empty, clearing wikidata from :default")
          (swap! (::results state) update :wikidata-entities merge {:status :success :items []}))
      (if filter-group
        (load-results filter-group state)
        (do
          (load-results :commands state)
          (load-results :nodes state)
          (load-results :filters state)
          (load-results :files state)
          (load-results :recently-updated-pages state)
          ;; Wikidata search (debounced separately for better UX)
          (load-wikidata-results-debounced state))))))

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

(defmethod handle-action :open [_ state event]
  (when-let [item (some-> state state->highlighted-item)]
    (let [page? (page-item? item)
          block? (boolean (:source-block item))
          shift? @(::shift? state)
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
      (when input-ref
        (set! (.-value input-ref) "")
        (.focus input-ref))
      (action)
      (when-not (contains? dont-close-commands (:id command))
        (shui/dialog-close! :ls-dialog-cmdk)))))

(rum/defc hint-tip
  "Renders a tip line: flex row with shortcut badges and trailing text.
   Children should end with a .hints-tip-tail element for ellipsis truncation."
  [& children]
  (into [:div.flex.flex-row.gap-1.items-center.opacity-50.hover:opacity-100]
        children))

(rum/defc contextual-tip []
  (let [[editing _] (hooks/use-atom (:editor/editing? @state/state))
        is-editing? (boolean (seq editing))
        !has-edited (rum/use-ref false)
        !prev-editing (rum/use-ref false)
        !timer (rum/use-ref nil)
        [show-saved? set-show-saved!] (rum/use-state false)]
    (hooks/use-effect!
     (fn []
       (let [was-editing? (.-current !prev-editing)]
         (set! (.-current !prev-editing) is-editing?)
         (when is-editing?
           (set! (.-current !has-edited) true))
         (when (and was-editing? (not is-editing?) (.-current !has-edited))
           (set-show-saved! true)
           (let [t (js/setTimeout #(set-show-saved! false) 3000)]
             (set! (.-current !timer) t)
             #(js/clearTimeout t)))))
     [is-editing?])
    [:div.text-sm.leading-6
     [:div.flex.flex-row.gap-1.items-center
      [:span.font-medium.text-gray-12 "Tip:"]
      [:div.tip-rotate
       {:key (if show-saved? :saved :shortcut)}
       (if show-saved?
         (hint-tip (icon/icon "circle-check" {:size 14})
                   [:span.hints-tip-tail "Changes saved automatically"])
         (hint-tip [:span "Press"]
                   (shui/shortcut ["cmd" "j"] {:style :combo :interactive? false :aria-hidden? true})
                   [:span.hints-tip-tail "to jump to a property"]))]]]))

(rum/defc hint-button
  [text shortcut opts]
  (let [primary? (:primary? opts)
        opts (dissoc opts :primary?)]
    (shui/button
     (merge {:class (if primary?
                      "hint-button"
                      "hint-button text-gray-11 hover:text-gray-12")
             :variant (if primary? :secondary :ghost)
             :depth (when primary? 1)
             :size :sm}
            opts)
     [[:span text]
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
                                   :aria-hidden? true})))])))

(rum/defc hints-more-dropdown
  [items]
  (shui/dropdown-menu
   (shui/dropdown-menu-trigger
    {:asChild true}
    (shui/button {:variant :ghost :size :sm
                  :class "hint-button text-gray-11 hover:text-gray-12"}
                 [[:span.flex.items-center.gap-1
                   (icon/icon "dots-vertical" {:size 15})
                   "More"
                   (icon/icon "chevron-down" {:size 14})]]))
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
         (when icon (icon/icon icon {:size 16 :extension? icon-extension?}))
         text]
        (when shortcut
          (shui/shortcut shortcut {:style :combo :interactive? false :aria-hidden? true}))])))))

(rum/defc action-bar
  "Shared action bar with responsive collapse. Renders a tip on the left,
   primary button (rightmost) and secondary buttons that auto-collapse
   into a 'More' dropdown when space is tight.

   Props:
     :tip        - Rum element for the left side
     :primary    - {:text :shortcut :on-click} for the primary (rightmost) button
     :secondary  - vec of {:text :shortcut :icon :icon-extension? :on-click}
     :cache-key  - optional value; when it changes, the cached expanded width resets"
  [{:keys [tip primary secondary cache-key]}]
  (let [*container-ref (rum/use-ref nil)
        *actions-ref (rum/use-ref nil)
        *expanded-w (rum/use-ref nil)
        *prev-cache-key (rum/use-ref nil)
        [collapsed? set-collapsed!] (rum/use-state false)

        _ (hooks/use-effect!
           (fn []
             (when (not= cache-key (rum/deref *prev-cache-key))
               (rum/set-ref! *expanded-w nil)
               (rum/set-ref! *prev-cache-key cache-key))
             (when-let [container (rum/deref *container-ref)]
               (let [check (fn []
                             (when-let [actions (rum/deref *actions-ref)]
                               (when (and (not collapsed?)
                                          (> (.-offsetWidth actions) 0))
                                 (rum/set-ref! *expanded-w (.-offsetWidth actions))))
                             (let [ew (or (rum/deref *expanded-w) 0)
                                   min-tip-w 300
                                   gap 8
                                   needed (+ min-tip-w ew gap)]
                               (set-collapsed! (> needed (.-clientWidth container)))))
                     ob (js/ResizeObserver. check)]
                 (check)
                 (.observe ob container)
                 #(.disconnect ob))))
           [cache-key collapsed?])]

    [:div.hints {:ref *container-ref}
     ;; Left: tip
     [:div.hints-tip.text-sm.leading-6 tip]

     ;; Right: action buttons
     [:div.hints-actions {:ref *actions-ref}
      (when (seq secondary)
        (if collapsed?
          (hints-more-dropdown secondary)
          [:<>
           (for [b secondary]
             (hint-button (:text b) (:shortcut b)
                          {:key (:text b) :on-click (:on-click b)}))]))
      (hint-button (:text primary) (:shortcut primary)
                   {:primary? true :on-click (:on-click primary)})]]))

(rum/defc page-dialog-footer
  [block {:keys [open-label] :or {open-label "Open tag page"}}]
  ;; Register keyboard shortcuts for footer actions
  (hooks/use-effect!
   (fn []
     (let [handler (fn [e]
                     (let [meta? (util/meta-key? e)
                           shift? (.-shiftKey e)
                           key (.-key e)]
                       (cond
                         (and meta? shift? (= key "o"))
                         (do (.preventDefault e)
                             (.stopPropagation e)
                             (shui/dialog-close!)
                             (route-handler/redirect-to-page! (:block/uuid block)))

                         (and meta? shift? (= key "Enter"))
                         (do (.preventDefault e)
                             (.stopPropagation e)
                             (state/sidebar-add-block! (state/get-current-repo) (:db/id block) :page)
                             (shui/dialog-close!)))))]
       (.addEventListener js/document "keydown" handler)
       #(.removeEventListener js/document "keydown" handler)))
   [])

  (action-bar
   {:tip (contextual-tip)
    :primary {:text "Done" :shortcut "esc"
              :on-click #(shui/dialog-close!)}
    :secondary [{:text open-label
                 :icon "open-as-page" :icon-extension? true
                 :shortcut ["cmd" "shift" "o"]
                 :on-click (fn []
                             (shui/dialog-close!)
                             (route-handler/redirect-to-page! (:block/uuid block)))}
                {:text "Open in sidebar"
                 :icon "move-to-sidebar-right" :icon-extension? true
                 :shortcut ["cmd" "shift" "return"]
                 :on-click (fn []
                             (state/sidebar-add-block! (state/get-current-repo) (:db/id block) :page)
                             (shui/dialog-close!))}]}))
(defn- <ensure-class-exists!
  "Ensure a class with the given title exists. Creates it if not found.
   If creating a new class, sets the default-icon from wikidata/class->default-icon.
   Returns the class entity."
  [class-title]
  (let [existing-class (db/get-case-page class-title)]
    (if (and existing-class (ldb/class? existing-class))
      ;; Class already exists
      (p/resolved existing-class)
      ;; Create new class with default icon
      (p/let [new-class (db-page-handler/<create-class! class-title {:redirect? false})]
        ;; Set default-icon if one is defined for this class
        (when-let [default-icon (get wikidata/class->default-icon class-title)]
          (db-property-handler/set-block-property!
           (:block/uuid new-class)
           :logseq.property.class/default-icon
           default-icon))
        (js/console.log "[wikidata] Created new class:" class-title "with default-icon:" (get wikidata/class->default-icon class-title))
        new-class))))

(defmethod handle-action :create [_ state _event]
  (let [item (state->highlighted-item state)
        !input (::input state)
        create-class? (string/starts-with? @!input "#")
        create-object? (:create-object? item)
        create-page? (and (= :page (:source-create item)) (not create-object?))
        class (when create-class? (get-class-from-input @!input))
        page-dialog-content (fn [block opts]
                              [:div.w-full.h-full.flex.flex-col.bg-gray-02
                               [:div.px-16.py-8.flex-1.min-h-0.overflow-y-auto
                                (component-page/page-container block {:tag-dialog? true})]
                               (page-dialog-footer block opts)])]
    (cond
      ;; Configure existing tag — synchronous morph
      (and (= (:text item) "Configure tag") (:class item))
      (shui/dialog-transition-to! :ls-dialog-cmdk
                                  (page-dialog-content (:class item) {})
                                  {:close-btn? true
                                   :onEscapeKeyDown (fn [_e]
                                                      (shui/dialog-close! :ls-dialog-cmdk))})

      ;; Create object page ("PageName #Tag") — async create, then morph
      create-object?
      (let [page-name (:page-name item)
            tag-names (:tag-names item)]
        (p/let [tag-entities (p/all (mapv <ensure-class-exists! tag-names))
                ;; Pass tags to <create! so page + tags are a single transaction
                page (page-handler/<create! page-name
                                            {:redirect? false
                                             :tags (vec (keep :block/uuid tag-entities))})]
          (when page
            (shui/dialog-transition-to! :ls-dialog-cmdk
                                        (page-dialog-content page {:open-label "Open page"})
                                        {:close-btn? true
                                         :onEscapeKeyDown (fn [_e]
                                                            (shui/dialog-close! :ls-dialog-cmdk))}))))

      ;; Create new tag or page — async
      :else
      (p/let [result (cond
                       create-class?
                       (db-page-handler/<create-class! class
                                                       {:redirect? false})
                       create-page? (page-handler/<create! @!input {:redirect? false}))]
        (if result
          ;; Morph CMD+K into page/tag preview
          (shui/dialog-transition-to! :ls-dialog-cmdk
                                      (page-dialog-content result
                                                           (when create-page? {:open-label "Open page"}))
                                      {:close-btn? true
                                       :onEscapeKeyDown (fn [_e]
                                                          (shui/dialog-close! :ls-dialog-cmdk))})
          (shui/dialog-close! :ls-dialog-cmdk))))))

(defn- get-page-by-wikidata-id
  "Find an existing page that was created from the given Wikidata entity."
  [qid]
  (try
    (when-let [db (db/get-db)]
      (some->> (d/q '[:find [?p ...]
                      :in $ ?qid
                      :where [?p :logseq.property/wikidata-id ?qid]]
                    db qid)
               first
               (db/entity)))
    (catch :default e
      (js/console.warn "[wikidata-create] Dedup query failed, proceeding with creation:" (.-message e))
      nil)))

(defn- <set-wikidata-icon!
  "Download Wikidata image and set as page icon.
   Uses the class's default icon type (:avatar for Person, :image for Company, etc.)"
  [page-id image-info label class-title]
  (when-let [image-url (:url image-info)]
    (p/let [repo (state/get-current-repo)
            asset-name (str "wikidata-" (subs label 0 (min 30 (count label))))
            asset (icon/<save-url-asset! repo image-url asset-name)]
      (when asset
        ;; Determine icon type from class's default-icon (Person→avatar, Company→image)
        (let [icon-spec (wikidata/get-preview-icon-type class-title)
              icon-type (or (:type icon-spec) :image)
              base-data {:asset-uuid (str (:block/uuid asset))
                         :asset-type (:logseq.property.asset/type asset)}
              ;; For avatars, include :value (initials) as fallback text
              ;; The avatar renderer expects :value, not :initials
              icon-data (if (= icon-type :avatar)
                          (assoc base-data :value (wikidata/derive-avatar-initials label))
                          base-data)]
          (db-property-handler/set-block-property!
           page-id
           :logseq.property/icon
           {:type icon-type
            :data icon-data})
          (js/console.log "[wikidata] Set icon for page:" label
                          "type:" icon-type
                          "from" (:property image-info)))))))

(defmethod handle-action :create-from-wikidata [_ state _event]
  (when-let [item (state->highlighted-item state)]
    (let [wikidata-info (:source-wikidata item)
          {:keys [qid label]} wikidata-info]
      (when (and qid label)
        ;; Close the dialog immediately for better UX
        (shui/dialog-close! :ls-dialog-cmdk)
        ;; Check: page already created from this Wikidata entity?
        (if-let [existing-page (get-page-by-wikidata-id qid)]
          (route-handler/redirect-to-page! (:block/uuid existing-page))
          ;; No match — create new page
          (-> (p/let [entity-data (wikidata/<fetch-full-entity qid)]
                (when entity-data
                  (let [{:keys [class image properties]} entity-data
                        class-title (:title class)]
                    (p/let [class-entity (when class-title
                                           (<ensure-class-exists! class-title))
                            page (page-handler/<create! label {:redirect? false})]
                      (when page
                        ;; Store Wikidata Q-ID for future deduplication
                        (db-property-handler/set-block-property!
                         (:block/uuid page)
                         :logseq.property/wikidata-id
                         qid)
                        (when class-entity
                          (db-property-handler/set-block-property!
                           (:block/uuid page)
                           :block/tags
                           (:db/id class-entity)))
                        (swap! icon/*image-fetch-attempted conj (:db/id page))
                        (swap! icon/*avatar-fetch-attempted conj (:db/id page))
                        (route-handler/redirect-to-page! (:block/uuid page))
                        (when image
                          (<set-wikidata-icon! (:db/id page) image label class-title))
                        (when (seq properties)
                          (state/pub-event! [:wikidata/show-import-panel
                                             {:page page
                                              :properties properties
                                              :entity-data entity-data}]))
                        (js/console.log "[wikidata] Created page from Wikidata:" label
                                        "\n  Q-ID:" qid
                                        "\n  Class:" class-title
                                        "\n  Has image:" (boolean image)
                                        "\n  Properties available:" (count properties)))))))
              (p/catch (fn [err]
                         (js/console.error "[wikidata-create] Error in creation flow:" err)))))))))

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
        !input (::input state)
        input-ref @(::input-ref state)]
    (let [value (get-filter-user-input @!input)]
      (reset! !input value)
      (set! (.-value input-ref) value))
    (let [!filter (::filter state)
          group (get-in item [:filter :group])]
      (swap! !filter assoc :group group)
      (load-results group state))))

(defmethod handle-action :theme [_ state]
  (when-let [item (some-> state state->highlighted-item)]
    (js/LSPluginCore.selectTheme (bean/->js (:source-theme item)))
    (shui/dialog-close!)))

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
    (when-not (<= t1 t2 b2 b1) ; not visible
      (.scrollIntoView target
                       #js {:inline "nearest"
                            :behavior "smooth"}))))

(rum/defc mouse-active-effect!
  [*mouse-active? deps]
  (hooks/use-effect!
   #(reset! *mouse-active? false)
   deps)
  nil)

(rum/defcs result-group
  < rum/reactive
  (rum/local false ::mouse-active?)
  [state' state title group total-count visible-items first-item sidebar?]
  (let [{:keys [show]} (some-> state ::results deref group)
        highlighted-item (or @(::highlighted-item state) first-item)
        *mouse-active? (::mouse-active? state')
        filter' @(::filter state)
        can-show-less? (< (get-group-limit group) (count visible-items))
        can-show-more? (< (count visible-items) total-count)
        show-less #(swap! (::results state) assoc-in [group :show] :less)
        show-more #(swap! (::results state) assoc-in [group :show] :more)]
    [:<>
     (mouse-active-effect! *mouse-active? [highlighted-item])
     [:div {:class (if (= title "Create")
                     "border-b border-gray-06 last:border-b-0"
                     "border-b border-gray-06 pb-1 last:border-b-0")
            :on-mouse-move #(reset! *mouse-active? true)}
      (when-not (= title "Create")
        [:div {:class "text-xs py-1.5 px-3 flex justify-between items-center gap-2 bg-gray-02 h-8"}
         [:div {:class (str "flex items-center gap-1 select-none"
                            (when (or can-show-more? can-show-less?) " cursor-pointer"))
                :style {:color "var(--lx-gray-11)"}
                :on-click (fn [_e]
                          ;; change :less to :more or :more to :less
                            (swap! (::results state) update-in [group :show] {:more :less
                                                                              :less :more}))}
          [:span {:class "font-bold"} title]
          (when (not= group :create)
            [:<>
             [:span "·"]
             [:span {:style {:font-size "0.7rem"}}
              (if (<= 100 total-count)
                (str "99+")
                total-count)]
             (when (or can-show-more? can-show-less?)
               (ui/icon (if (= show :more) "chevron-down" "chevron-right") {:size 14}))])]

         [:div {:class "flex-1"}]

         (when (and (or can-show-more? can-show-less?)
                    (= group @(::highlighted-group state))
                    (empty? filter')
                    (not sidebar?))
           [:a.text-link.select-node.opacity-50.hover:opacity-90
            {:on-click (if (= show :more) show-less show-more)}
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
                            :on-click
                            (fn [e]
                              (util/stop-propagation e)
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
         input-ref @(::input-ref state)]

     ;; update the input value in the UI
     (reset! !input input)
     (set! (.-value input-ref) input)

     (reset! (::input-changed? state) true)

     ;; retrieve the load-results function and update all the results
     (when (or (not composing?) composing-end?)
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
        (shui/dialog-close! :ls-dialog-cmdk)
        (state/sidebar-add-block! repo input :search))
      as-keydown? (if meta?
                    (show-more)
                    (move-highlight state 1))
      as-keyup? (if meta?
                  (show-less)
                  (move-highlight state -1))
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
                 (reset! (::filter state) nil)
                 (load-results :default state))

               :else
               (when-not (string/blank? input)
                 (util/stop e)
                 (handle-input-change state nil ""))))
      (and meta? (= keyname "c")) (do
                                    (shui/shortcut-press! (if util/mac? "cmd+c" "ctrl+c") true)
                                    (copy-block-ref state)
                                    (util/stop-propagation e))
      (and meta? (= keyname "o"))
      (open-current-item-link state)
      ;; Cmd+E = switch to capture mode
      (and meta? (= keyname "e"))
      (do (util/stop e)
          (state/pub-event! [:go/capture]))
      (= keyname "/") (do
                        (shui/shortcut-press! "/" true)
                        nil) ; Don't prevent default, allow typing
      :else nil)))

(defn- keyup-handler
  [state e]
  (let [shift? (.-shiftKey e)
        meta? (util/meta-key? e)]
    (reset! (::shift? state) shift?)
    (reset! (::meta? state) meta?)))

(defn- input-placeholder
  [sidebar?]
  (let [search-mode (:search/mode @state/state)
        action (get-action)]
    (cond
      (= action :move-blocks)
      "Move blocks to"

      (and (= search-mode :graph) (not sidebar?))
      "Add graph filter"

      (= action :new-page)
      "Type a page name to create"

      :else
      "What are you looking for?")))

(rum/defc preview-debounce-tracker
  "Debounces the highlighted item to avoid rapid preview show/hide.
   Uses a ref to store the latest value, read at fire time to prevent stale closures."
  [state]
  (let [highlighted-item @(::highlighted-item state)
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

(rum/defc preview-pane
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
        *container (rum/use-ref nil)]
    ;; Async-load entity from worker if not in main-thread DB
    (hooks/use-effect!
     (fn []
       (if sync-entity
         (do (set-page-entity! sync-entity) js/undefined)
         (when-let [id (or source-uuid source-eid)]
           (-> (db-async/<get-block (state/get-current-repo) id
                                    {:children? true})
               (p/then (fn [_]
                         ;; Entity is now transacted into main-thread DB, retry resolution
                         (let [entity (preview-page-entity item)]
                           (when entity
                             ;; Also load children for the resolved page (in case it's
                             ;; a different entity than what we loaded, e.g. block's parent page)
                             (-> (db-async/<get-block (state/get-current-repo)
                                                      (:block/uuid entity)
                                                      {:children? true})
                                 (p/then (fn [_] (set-page-entity! entity)))))))))
           js/undefined)))
     [source-uuid source-eid])
    ;; Auto-scroll to matched block (for block search results).
    ;; The highlight class is applied and never removed -- the CSS animation
    ;; handles the visual pulse (bright → subtle) and the subtle tint persists
    ;; so the user can always see which block matched, even after pausing.
    (hooks/use-effect!
     (fn []
       (when (and block-uuid (rum/deref *container))
         (let [t (js/setTimeout
                  (fn []
                    (when-let [el (.querySelector (rum/deref *container)
                                                  (str "[data-block-uuid='" block-uuid "']"))]
                      (.scrollIntoView el #js {:block "center"})
                      ;; Remove then re-add in the next frame to restart the CSS
                      ;; animation when the same block is highlighted again.
                      (.remove (.-classList el) "cmdk-preview-highlight")
                      (js/requestAnimationFrame
                       #(.add (.-classList el) "cmdk-preview-highlight"))))
                  50)]
           #(js/clearTimeout t)))
       js/undefined)
     [(:db/id page-entity) block-uuid])
    [:div.cmdk-preview-pane {:ref *container}
     (when page-entity
       [:div
        [:div.preview-page-title.px-4.pt-3.pb-2
         [:span.text-lg.font-bold (:block/title page-entity)]]
        (if (ldb/class? page-entity)
          (preview-class-objects page-entity)
          (preview-page-blocks page-entity))])]))

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
                             [])]
    ;; use-effect [results-ordered input] to check whether the highlighted item is still in the results,
    ;; if not then clear that puppy out!
    ;; This was moved to a functional component
    (hooks/use-effect! (fn []
                         (when (and highlighted-item (= -1 (.indexOf all-items (dissoc highlighted-item :mouse-enter-triggered-highlight))))
                           (reset! (::highlighted-item state) nil)))
                       [all-items])
    ;; Auto-set highlighted item to first result when nil (on open & after search)
    (hooks/use-effect! (fn []
                         (when (and (nil? highlighted-item) (seq all-items))
                           (reset! (::highlighted-item state) (first all-items)))
                         js/undefined)
                       [highlighted-item (first all-items)])
    (hooks/use-effect! (fn [] (load-results :default state)) [])
    (let [sidebar? (:sidebar? opts)
          preview-enabled? @(::preview-enabled? state)]
      [:div {:class "bg-gray-02 border-b border-1 border-gray-07 flex items-center"}
       [:input.cp__cmdk-search-input
        {:class "text-xl bg-transparent border-none w-full outline-none px-3 py-3 flex-1"
         :auto-focus true
         :autoComplete "off"
         :autoCapitalize "off"
         :placeholder (input-placeholder false)
         :ref #(when-not @input-ref (reset! input-ref %))
         :on-change debounced-on-change
         :on-blur (fn [_e]
                    (when-let [on-blur (:on-input-blur opts)]
                      (on-blur input)))
         :on-composition-end (gfun/debounce (fn [e] (handle-input-change state e)) 100)
         :on-key-down (fn [e]
                        (case (util/ekey e)
                          "Esc"
                          (when-not @(::filter state)
                            (shui/dialog-close!))
                          nil))
         :default-value input}]
       (when-not sidebar?
         (shui/button
          {:variant (if preview-enabled? :secondary :ghost)
           :size :sm
           :class (str "mr-2 px-1.5"
                       (if preview-enabled?
                         " opacity-100"
                         " opacity-50 hover:opacity-100"))
           :title (if preview-enabled? "Hide preview" "Show preview")
           :on-click (fn []
                       (let [new-val (not @(::preview-enabled? state))]
                         (reset! (::preview-enabled? state) new-val)
                         (storage/set :cmdk-preview-pane? new-val)))
           :data-button "icon"}
          (shui/tabler-icon "layout-sidebar-right"
                            (cond-> {:size 16}
                              preview-enabled?
                              (assoc :style {:color "var(--lx-accent-09, var(--ls-link-text-color))"})))))])))

(defn rand-tip
  []
  (rand-nth
   [(hint-tip [:span "Type"] (shui/shortcut "/") [:span.hints-tip-tail "to filter search results"])
    (hint-tip (shui/shortcut ["mod" "enter"] {:style :combo}) [:span.hints-tip-tail "to open search in the sidebar"])]))

(rum/defcs tip <
  {:init (fn [state]
           (assoc state ::rand-tip (rand-tip)))}
  [inner-state state]
  (let [filter' @(::filter state)]
    (cond
      filter'
      (hint-tip [:span "Type"] (shui/shortcut "esc" {:tiled false}) [:span.hints-tip-tail "to clear search filter"])

      :else
      (::rand-tip inner-state))))

(rum/defc hints
  [state]
  (let [action (state->action state)
        make-button (fn [text shortcut & {:as opts}]
                      {:text text :shortcut shortcut
                       :on-click #(handle-action action (assoc state :opts opts) %)})

        {:keys [primary secondary]}
        (case action
          :open
          {:primary (make-button "Open" ["return"])
           :secondary (cond-> [(make-button "Open in sidebar" ["shift" "return"]
                                            {:open-sidebar? true})]
                        (:source-block (state->highlighted-item state))
                        (conj (make-button "Copy ref" ["cmd" "c"])))}
          :search               {:primary (make-button "Search" ["return"]) :secondary []}
          :trigger              {:primary (make-button "Trigger" ["return"]) :secondary []}
          :create               {:primary (make-button "Create" ["return"]) :secondary []}
          :filter               {:primary (make-button "Filter" ["return"]) :secondary []}
          :create-from-wikidata {:primary (make-button "Create" ["return"]) :secondary []}
          {:primary nil :secondary []})]

    (when (and action primary)
      (action-bar
       {:tip [:div.flex.flex-row.gap-1.items-center
              [:span.font-medium.text-gray-12 "Tip:"]
              (tip state)]
        :primary primary
        :secondary secondary
        :cache-key action}))))

(rum/defc search-only
  [state group-name]
  [:div.flex.flex-row.gap-1.items-center
   [:div "Search only:"]
   [:div group-name]
   (shui/button
    {:variant :ghost
     :size :icon
     :class "p-1 scale-75"
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
           (let [search-mode (or (:search/mode @state/state) :global)
                 opts (last (:rum/args state))]
             (when (nil? search-mode)
               (state/set-state! :search/mode :global))
             (assoc state
                    ::ref (atom nil)
                    ::filter (if (and search-mode
                                      (not (contains? #{:global :graph} search-mode))
                                      (not (:sidebar? opts)))
                               (atom {:group search-mode})
                               (atom nil))
                    ::input (atom (or (:initial-input opts) ""))
                    ::preview-enabled? (atom (boolean (storage/get :cmdk-preview-pane?)))
                    ::preview-debounced-item (atom nil))))
   :will-unmount (fn [state]
                   (state/set-state! :search/mode nil)
                   (state/set-state! :search/args nil)
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
  (rum/local nil ::scroll-container-ref)
  (rum/local nil ::input-ref)
  (rum/local false ::input-changed?)
  [state {:keys [sidebar?] :as opts}]
  (let [*input (::input state)
        search-mode (state/sub :search/mode)
        ;; Explicit rum/react tracking to ensure cmdk re-renders when these atoms change
        _results (rum/react (::results state))
        _highlighted (rum/react (::highlighted-item state))
        group-filter (or (when (and (not (contains? #{:global :graph} search-mode)) (not (:sidebar? opts)))
                           search-mode)
                         (:group (rum/react (::filter state))))
        results-ordered (state->results-ordered state search-mode)
        all-items (mapcat last results-ordered)
        first-item (first all-items)
        preview-enabled? (rum/react (::preview-enabled? state))
        debounced-item (rum/react (::preview-debounced-item state))
        show-preview? (and preview-enabled?
                           (previewable-item? debounced-item)
                           (not sidebar?))]
    [:div.cp__cmdk {:ref #(when-not @(::ref state) (reset! (::ref state) %))
                    :class (cond-> "w-full h-full relative flex flex-col justify-start"
                             (not sidebar?) (str " rounded-lg")
                             show-preview? (str " cmdk-has-preview"))}
     (input-row state all-items opts)
     (preview-debounce-tracker state)
     [:div.cmdk-body
      [:div.cmdk-results-list
       {:class (when-not sidebar? "pb-14")
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
           (for [[group-name group-key group-count group-items] items]
             (let [title (string/capitalize group-name)]
               (result-group state title group-key group-count group-items first-item sidebar?)))
           [:div.flex.flex-col.p-4.opacity-50
            (when-not (string/blank? @*input)
              "No matched results")]))]
      (when show-preview?
        [:div.cmdk-preview-container
         {:on-click (fn [e]
                      (.preventDefault e)
                      (handle-action :open state nil))}
         (preview-pane debounced-item)])]
     (when-not sidebar? (hints state))]))

(rum/defc cmdk-modal [props]
  [:div {:class "cp__cmdk__modal rounded-lg w-[90dvw] max-w-4xl relative h-full"
         :data-keep-selection true}
   (cmdk props)])

(rum/defc cmdk-block [props]
  [:div {:class "cp__cmdk__block rounded-md"}
   (cmdk props)])

;; ============================================================
;; Capture mode — block quick capture inside the CMD+K shell
;; ============================================================

(rum/defc capture-page-blocks
  "Renders the full block editor for the staging page."
  [page]
  (let [[scroll-container set-scroll-container] (rum/use-state nil)
        *ref (rum/use-ref nil)]
    (hooks/use-effect!
     #(set-scroll-container (rum/deref *ref))
     [])
    [:div.capture-editor
     {:ref *ref}
     (when scroll-container
       (component-page/page-blocks-cp page {:scroll-container scroll-container}))]))

(defn- make-target-create-items
  "When input doesn't match an existing page, return a create item for the combobox.
   Supports: plain page, #ClassName tag, PageName #Tag1 #Tag2 object."
  [input]
  (when (and (not (string/blank? input))
             (not (#{"config.edn" "custom.js" "custom.css"} input))
             (not config/publishing?))
    (let [class?          (string/starts-with? input "#")
          has-inline-tag? (and (not class?) (string/includes? input " #"))
          class-name      (when class? (get-class-from-input input))
          [object-page-name object-tag-names]
          (when has-inline-tag?
            (let [parts (string/split input #" #")
                  pn    (string/trim (first parts))
                  tns   (->> (rest parts) (map string/trim) (remove string/blank?) vec)]
              (when (and (not (string/blank? pn)) (seq tns))
                [pn tns])))
          effective-name (cond
                           (and class? (seq class-name)) class-name
                           (some? object-page-name) object-page-name
                           :else input)]
      (when (and (not (string/blank? effective-name))
                 (nil? (db/get-page effective-name)))
        (cond
          (and class? (seq class-name))
          [{:value "create-class"
            :label (str "New tag: \"" class-name "\"")
            :create-label "New tag:"
            :create-quoted (str "\"" class-name "\"")
            :icon "new-class"
            :create-type :class
            :create-name class-name}]

          (some? object-page-name)
          [{:value "create-object"
            :label (str "New page: \"" object-page-name "\" as #" (string/join ", #" object-tag-names))
            :create-label "New page:"
            :create-quoted (str "\"" object-page-name "\" as #" (string/join ", #" object-tag-names))
            :icon "new-object"
            :create-type :object
            :create-name object-page-name
            :create-tags object-tag-names}]

          :else
          [{:value "create-page"
            :label (str "New page: \"" effective-name "\"")
            :create-label "New page:"
            :create-quoted (str "\"" effective-name "\"")
            :icon "new-page"
            :create-type :page
            :create-name effective-name}])))))

(defn- make-target-page-items
  "Build grouped items for the target page picker combobox.
   When input is blank: Dates + Favorites + Recent.
   When searching: flat fuzzy-matched results + optional create item."
  [input]
  (let [blank? (string/blank? input)]
    (if blank?
      (let [today-page (db/get-page (date/today))
            yesterday-page (db/get-page (date/yesterday))
            tomorrow-page (db/get-page (date/tomorrow))
            favorites (page-handler/get-favorites)
            recent-pages (ldb/get-recent-updated-pages (db/get-db))
            date-items (keep (fn [[page label]]
                               (when page
                                 {:value (:db/id page)
                                  :label label
                                  :icon "calendar"
                                  :data page
                                  :group "Dates"}))
                             [[today-page (str "Today \u2014 " (:block/title today-page))]
                              [tomorrow-page (str "Tomorrow \u2014 " (:block/title tomorrow-page))]
                              [yesterday-page (str "Yesterday \u2014 " (:block/title yesterday-page))]])
            fav-items (map (fn [page]
                             {:value (:db/id page)
                              :label (:block/title page)
                              :icon (get-page-icon page)
                              :data page
                              :group "Favorites"})
                           favorites)
            recent-items (map (fn [page]
                                {:value (:db/id page)
                                 :label (:block/title page)
                                 :icon (get-page-icon page)
                                 :data page
                                 :group "Recent"})
                              (take 8 recent-pages))]
        (vec (concat date-items fav-items recent-items)))
      ;; Search mode: fuzzy match all pages + optional create item
      (let [results (search/fuzzy-search (ldb/get-all-pages (db/get-db)) input
                                         {:extract-fn :block/title :limit 12})
            search-items (mapv (fn [page]
                                 {:value (:db/id page)
                                  :label (:block/title page)
                                  :icon (get-page-icon page)
                                  :data page})
                               results)]
        (into search-items (make-target-create-items input))))))

(rum/defc target-page-picker-content
  "Popover content for selecting a target page using the combobox component."
  [set-target-page! popup-id]
  (let [[input set-input!] (rum/use-state "")
        *input-ref (rum/use-ref nil)
        items (make-target-page-items input)]
    ;; Radix dropdown menu steals focus on open, so autoFocus alone doesn't work.
    ;; Delay .focus() to run after Radix's focus management settles.
    (hooks/use-effect!
     (fn []
       (let [t (js/setTimeout #(some-> (rum/deref *input-ref) (.focus)) 50)]
         #(js/clearTimeout t)))
     [])
    [:div.target-page-picker
     [:div.px-1.pt-1
      (shui/input {:ref *input-ref
                   :placeholder "Search pages..."
                   :value input
                   :class "h-8 text-sm bg-transparent border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus:outline-none shadow-none"
                   :on-change #(set-input! (util/evalue %))
                   :on-key-down (fn [e]
                                  (when (= (util/ekey e) "Escape")
                                    (util/stop e)
                                    (shui/popup-hide! popup-id)))})]
     (shui/select-separator)
     (combobox/combobox
      items
      {:grouped? (string/blank? input)
       :show-search-input? false
       :on-chosen (fn [item _e]
                    (if-let [create-type (:create-type item)]
                      (let [name (:create-name item)]
                        (case create-type
                          :page
                          (p/let [page (page-handler/<create! name {:redirect? false})]
                            (when page
                              (set-target-page! page)
                              (shui/popup-hide! popup-id)))

                          :class
                          (-> (p/let [page (db-page-handler/<create-class! name {:redirect? false})]
                                (when page
                                  (set-target-page! page)
                                  (shui/popup-hide! popup-id)))
                              (p/catch (fn [_] nil)))

                          :object
                          (p/let [tag-entities (p/all (mapv #(<ensure-class-exists! %) (:create-tags item)))
                                  page (page-handler/<create! name
                                                              {:redirect? false
                                                               :tags (vec (keep :block/uuid tag-entities))})]
                            (when page
                              (set-target-page! page)
                              (shui/popup-hide! popup-id)))

                          nil))
                      ;; Existing page selected
                      (when-let [page (:data item)]
                        (set-target-page! page)
                        (shui/popup-hide! popup-id))))
       :item-render (fn [item _chosen?]
                      (if (:create-type item)
                        [:div.flex.flex-row.items-center.gap-3
                         (list-item-icon/root {:variant :create
                                               :icon (:icon item)
                                               :extension? true})
                         [:div.flex.flex-row.items-center.whitespace-nowrap.gap-1
                          [:span.text-gray-12 (:create-label item)]
                          [:span.text-gray-11 (:create-quoted item)]]]
                        [:div.flex.items-center.gap-2
                         (icon/icon (or (:icon item) "file") {:size 14})
                         [:span (:label item)]]))
       :empty-placeholder [:div.px-3.py-2.text-sm.text-gray-11
                           "No pages found"]})]))

(rum/defc capture-toolbar
  "Top toolbar for capture mode: mode dropdown + target page picker."
  [target-page set-target-page!]
  (let [target-title (if (string? target-page)
                       target-page
                       (:block/title target-page))
        target-icon (if (string? target-page)
                      "file"
                      (get-page-icon target-page))]
    [:div.capture-toolbar
     ;; Target page picker
     [:div.flex.items-center.gap-1.5
      [:span.target-label "Add to:"]
      (shui/button {:variant :ghost :size :sm :class "target-pill"
                    :on-click (fn [e]
                                (shui/popup-show!
                                 (.-target e)
                                 (fn [{:keys [id]}]
                                   (target-page-picker-content set-target-page! id))
                                 {:id :target-page-picker
                                  :align :start}))}
                   (icon/icon target-icon {:size 14})
                   [:span target-title]
                   (icon/icon "chevron-down" {:size 12}))]]))

(rum/defc capture-action-bar
  "Bottom action bar for capture mode."
  [target-page]
  (action-bar
   {:tip (contextual-tip)
    :primary {:text "Done" :shortcut ["mod" "e"]
              :on-click #(editor-handler/capture-commit-blocks!
                          (or target-page (db/get-page (date/today))))}
    :secondary [{:text "Open target page"
                 :icon "open-as-page" :icon-extension? true
                 :shortcut ["cmd" "shift" "o"]
                 :on-click (fn []
                             (shui/dialog-close! :ls-dialog-cmdk)
                             (when target-page
                               (route-handler/redirect-to-page! (:block/uuid target-page))))}
                {:text "Open in sidebar"
                 :icon "move-to-sidebar-right" :icon-extension? true
                 :shortcut ["cmd" "shift" "return"]
                 :on-click (fn []
                             (when target-page
                               (state/sidebar-add-block! (state/get-current-repo) (:db/id target-page) :page))
                             (shui/dialog-close! :ls-dialog-cmdk))}
                {:text "Discard draft"
                 :icon "trash"
                 :on-click #(editor-handler/discard-capture-draft!)}]}))

(rum/defc capture-mode-content
  "Main capture mode view rendered inside the CMD+K dialog shell.
   Uses dialog-transition-to! to morph the CMD+K content in place."
  []
  (let [[target-page set-target-page!] (rum/use-state nil)
        ;; Wrap in an atom-like for child component reads
        *target-page (rum/use-ref nil)
        _ (rum/set-ref! *target-page target-page)
        add-page (ldb/get-built-in-page (db/get-db) common-config/quick-add-page-name)]

    ;; Initialize target page to today's journal
    (hooks/use-effect!
     (fn []
       (when-not target-page
         (when-let [today (db/get-page (date/today))]
           (set-target-page! today))))
     [])

    ;; NOTE: Unlike CMD+K search mode, capture mode does NOT call
    ;; shortcut/unlisten-all! — the block editor needs shortcuts like
    ;; Enter (new-block), Tab (indent), Shift+Tab (outdent) to work.
    ;; Our capture-phase keydown handler (below) intercepts Cmd+E, Esc,
    ;; etc. before the shortcut system sees them.

    ;; Auto-focus block editor on mount
    (hooks/use-effect!
     (fn []
       (js/setTimeout #(editor-handler/quick-add-open-last-block!) 150))
     [])

    ;; Capture-mode keydown handler
    (hooks/use-effect!
     (fn []
       (let [handler (fn [e]
                       (let [meta? (util/meta-key? e)
                             shift? (.-shiftKey e)
                             key (.-key e)]
                         (cond
                           ;; Cmd+E = Done (commit blocks to target)
                           (and meta? (= key "e"))
                           (do (.preventDefault e)
                               (.stopPropagation e)
                               (editor-handler/capture-commit-blocks!
                                (or (rum/deref *target-page) (db/get-page (date/today)))))

                           ;; Esc = close without committing (draft preserved)
                           (= key "Escape")
                           (do (.preventDefault e)
                               (.stopPropagation e)
                               (shui/dialog-close! :ls-dialog-cmdk))

                           ;; Cmd+Shift+O = open target page
                           (and meta? shift? (= key "o"))
                           (do (.preventDefault e)
                               (.stopPropagation e)
                               (shui/dialog-close! :ls-dialog-cmdk)
                               (when-let [page (rum/deref *target-page)]
                                 (route-handler/redirect-to-page! (:block/uuid page))))

                           ;; Cmd+Shift+Enter = open target in sidebar
                           (and meta? shift? (= key "Enter"))
                           (do (.preventDefault e)
                               (.stopPropagation e)
                               (when-let [page (rum/deref *target-page)]
                                 (state/sidebar-add-block! (state/get-current-repo) (:db/id page) :page))
                               (shui/dialog-close! :ls-dialog-cmdk)))))]
         (.addEventListener js/document "keydown" handler true)
         #(.removeEventListener js/document "keydown" handler true)))
     [])

    ;; Render
    [:div.w-full.h-full.flex.flex-col.bg-gray-02.rounded-lg
     {:data-keep-selection true}
     ;; Toolbar: mode dropdown + "Attached to" + target page
     (capture-toolbar target-page set-target-page!)
     ;; Block editor area
     [:div.flex-1.min-h-0.overflow-y-auto
      (when add-page
        (capture-page-blocks add-page))]
     ;; Action bar
     (capture-action-bar target-page)]))
