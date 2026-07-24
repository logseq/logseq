(ns frontend.handler.page
  "Provides util handler fns for pages"
  (:require [clojure.string :as string]
            [frontend.commands :as commands]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db.async :as db-async]
            [frontend.handler.common.page :as page-common-handler]
            [frontend.handler.db-based.page :as db-page-handler]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.property :as property-handler]
            [frontend.handler.graph :as graph-handler]
            [frontend.handler.route :as route-handler]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [frontend.util.entity :as entity]
            [frontend.util.page :as page-util]
            [frontend.util.ref :as ref]
            [frontend.util.url :as url-util]
            [goog.functions :refer [debounce]]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.graph-parser.text :as text]
            [promesa.core :as p]))

(def <create! page-common-handler/<create!)
(def <delete! page-common-handler/<delete!)
(def edit-page-when-present! page-common-handler/edit-page-when-present!)

(defn- <recycle-page
  []
  (state/<invoke-db-worker :thread-api/pull
                           (state/get-current-repo)
                           [:block/uuid]
                           [:block/name common-config/recycle-page-name]))

(defn open-recycle!
  []
  (p/let [page (<recycle-page)]
    (when-let [page-id (:block/uuid page)]
      (route-handler/redirect-to-page! page-id))))

(defn- <page-block-uuid
  [page-id-name-or-uuid]
  (when page-id-name-or-uuid
    (let [lookup-ref (cond
                       (uuid? page-id-name-or-uuid)
                       [:block/uuid page-id-name-or-uuid]

                       (util/uuid-string? page-id-name-or-uuid)
                       [:block/uuid (uuid page-id-name-or-uuid)]

                       :else
                       [:block/name (common-util/page-name-sanity-lc page-id-name-or-uuid)])]
      (p/let [page (state/<invoke-db-worker :thread-api/pull
                                            (state/get-current-repo)
                                            [:block/uuid]
                                            lookup-ref)]
        (:block/uuid page)))))

(defn- <today-journal-page
  []
  (db-async/<get-journal-page-by-day (state/get-current-repo) (date/today-journal-day)))

(defn restore-recycled!
  [root-uuid]
  (p/do!
   (ui-outliner-tx/transact!
     {:outliner-op :restore-recycled}
     (outliner-op/restore-recycled! root-uuid))
   true))

(defn delete-recycled-permanently!
  [root-uuid]
  (p/do!
   (ui-outliner-tx/transact!
     {:outliner-op :recycle-delete-permanently}
     (outliner-op/recycle-delete-permanently! root-uuid))
   true))

(defn <unfavorite-page!
  [page-name]
  (p/let [page-block-uuid (<page-block-uuid page-name)]
   (when page-block-uuid
     (page-common-handler/<db-unfavorite-page! page-block-uuid))
   (state/update-favorites-updated!)))

(defn <favorite-page!
  [page-name]
  (p/let [page-block-uuid (<page-block-uuid page-name)]
   (when page-block-uuid
     (page-common-handler/<db-favorite-page! page-block-uuid))
   (state/update-favorites-updated!)))

(defn <favorited?
  [page-name]
  (p/let [page-block-uuid (<page-block-uuid page-name)]
    (if page-block-uuid
      (page-common-handler/<db-favorited? page-block-uuid)
      false)))

(def favorited? <favorited?)

(defn <get-favorites
  "return page-block entities"
  []
  (when-let [repo (state/get-current-repo)]
    (state/<invoke-db-worker :thread-api/get-favorite-pages repo)))

(defn toggle-favorite! []
  ;; NOTE: in journals or settings, current-page is nil
  (when-let [page-name (state/get-current-page)]
    (p/let [page-favorited? (<favorited? page-name)]
      (if page-favorited?
        (<unfavorite-page! page-name)
        (<favorite-page! page-name)))))

(defn rename!
  [page-uuid new-name & {:as _opts}]
  (let [page-uuid (if (util/uuid-string? page-uuid)
                    (uuid page-uuid)
                    (throw (ex-info "Invalid page uuid"
                                    {:page-uuid page-uuid})))]
    (p/do!
     (ui-outliner-tx/transact!
      {:outliner-op :rename-page}
      (outliner-op/rename-page! page-uuid new-name))
     true)))

(defn <reorder-favorites!
  [favorites]
  (when-let [repo (state/get-current-repo)]
    (p/let [_ (state/<invoke-db-worker :thread-api/reorder-favorites repo favorites)]
      (state/update-favorites-updated!))))

(defn update-public-attribute!
  [page value]
  (db-property-handler/set-block-property! (:block/uuid page) :logseq.property/publishing-public? value))

(defn get-page-ref-text
  [page]
  (ref/->page-ref page))

(defn init-commands!
  []
  (commands/init-commands! get-page-ref-text))

(def rebuild-slash-commands-list!
  (debounce init-commands! 1500))

(defn db-based-save-filter!
  [page filter-page-id {:keys [include? add?]}]
  (let [property-id (if include?
                      :logseq.property.linked-references/includes
                      :logseq.property.linked-references/excludes)]
    (if add?
      (property-handler/set-block-property! (:db/id page) property-id filter-page-id)
      (db-property-handler/delete-property-value! (:db/id page) property-id filter-page-id))))

;; Editor
(defn page-not-exists-handler
  [input]
  (state/clear-editor-action!)
  (let [current-selected (util/get-selected-text)]
    (cursor/move-cursor-forward input (+ 2 (count current-selected)))))

(defn- existing-chosen-result?
  [chosen-result]
  (:db/id chosen-result))

(defn- <chosen-result
  [repo chosen-result]
  (cond
    (:block/uuid chosen-result)
    (p/let [block (db-async/<get-block repo (:block/uuid chosen-result) {:children? false})]
      (or block chosen-result))

    (:db/id chosen-result)
    (p/let [block (state/<invoke-db-worker
                   :thread-api/pull
                   repo
                   [:db/id :block/title :block/name :block/uuid :block/tags
                    :db/ident]
                   (:db/id chosen-result))]
      (or block chosen-result))

    :else
    chosen-result))

(defn- <page-by-title
  [repo page]
  (state/<invoke-db-worker :thread-api/pull
                           repo
                           [:db/id :block/title :block/name :block/uuid :block/tags]
                           [:block/name (util/page-name-sanity-lc page)]))

(defn- labeled-node-ref
  [block]
  (str "[" (:block/title block) "](" (ref/->page-ref (:block/uuid block)) ")"))

(defn- tag-on-chosen-handler
  [input id pos format current-pos edit-content q]
  (fn [chosen-result ^js e]
    (util/stop e)
    (state/clear-editor-action!)
    (p/let [repo (state/get-current-repo)
            chosen-result (<chosen-result repo chosen-result)
            _ (when (and (:convert-page-to-tag? chosen-result)
                         (entity/page? chosen-result)
                         (not (entity/class? chosen-result)))
                (db-page-handler/convert-page-to-tag! chosen-result))
            target (when (and (:db/id chosen-result) (not (entity/class? chosen-result)))
                     (db-async/<get-alias-source-page repo (:db/id chosen-result)))
            chosen-result (if (and target (not (entity/class? chosen-result)) (entity/class? target)) target chosen-result)
            chosen (:block/title chosen-result)
            class? (or (string/includes? chosen (str (t :editor/new-tag) " "))
                       (entity/class? chosen-result))
            inline-tag? (and class? (= (.-identifier e) "auto-complete/meta-complete")
                             (not= chosen "Page"))
            chosen (-> chosen
                       (string/replace-first (str (t :editor/new-tag) " ") "")
                       (string/replace-first (str (t :editor/new-page) " ") ""))
            wrapped? (= page-ref/left-brackets (common-util/safe-subs edit-content (- pos 2) pos))
            chosen-last-part (if (text/namespace-page? chosen)
                               (text/get-namespace-last-part chosen)
                               chosen)
            wrapped-tag (if (and (util/safe-re-find #"\s+" chosen-last-part) (not wrapped?))
                          (ref/->page-ref chosen-last-part)
                          chosen-last-part)
            q (if (editor-handler/get-selected-text) "" q)
            last-pattern (if wrapped?
                           q
                           (if (= \# (first q))
                             (subs q 1)
                             q))
            last-pattern (str "#" (when wrapped? page-ref/left-brackets) last-pattern)
            tag-in-page-auto-complete? (= page-ref/right-brackets (common-util/safe-subs edit-content current-pos (+ current-pos 2)))]
      (p/do!
       (editor-handler/insert-command! id
                                       (if (and class? (not inline-tag?)) "" (str "#" wrapped-tag))
                                       format
                                       {:last-pattern last-pattern
                                        :end-pattern (when wrapped? page-ref/right-brackets)
                                        :command :page-ref})
       (when-not tag-in-page-auto-complete?
         (db-page-handler/tag-on-chosen-handler chosen chosen-result class? edit-content current-pos last-pattern))
       (when input (.focus input))))))

(defn- page-on-chosen-handler
  [id format q]
  (fn [chosen-result e]
    (util/stop e)
    (state/clear-editor-action!)
    (p/let [repo (state/get-current-repo)
            chosen-result (<chosen-result repo chosen-result)
            _ (when-not chosen-result
                (throw (ex-info "No chosen item"
                                {:chosen chosen-result})))
            chosen (:block/title chosen-result)
            chosen' (string/replace-first chosen (str (t :editor/new-page) " ") "")
            nlp-title (or (:nlp-original-title chosen-result) chosen')
            [chosen' chosen-result] (or (when (and (:nlp-date? chosen-result) (not (existing-chosen-result? chosen-result)))
                                          (when-let [result (date/nld-parse nlp-title)]
                                            (let [d (doto (goog.date.DateTime.) (.setTime (.getTime result)))
                                                  gd (goog.date.Date. (.getFullYear d) (.getMonth d) (.getDate d))
                                                  page (date/js-date->journal-title gd)]
                                              [page (<page-by-title repo page)])))
                                        [chosen' chosen-result])
            datoms (state/<invoke-db-worker :thread-api/datoms repo :avet :block/name (util/page-name-sanity-lc chosen'))
            multiple-pages-same-name? (> (count datoms) 1)
            ref-text (cond
                       (and (existing-chosen-result? chosen-result)
                            (not (entity/page? chosen-result)))
                       (labeled-node-ref chosen-result)

                       (and (existing-chosen-result? chosen-result)
                            multiple-pages-same-name?)
                       (ref/->page-ref (:block/uuid chosen-result))

                       :else
                       (get-page-ref-text chosen'))
            result (when-not (existing-chosen-result? chosen-result)
                     (<create! chosen'
                               {:redirect? false
                                :split-namespace? true}))
            ref-text' (if result
                        (let [title (:block/title result)]
                          (ref/->page-ref title))
                        ref-text)
            _ (editor-handler/insert-command! id
                                              ref-text'
                                              format
                                              {:last-pattern (str page-ref/left-brackets (if (editor-handler/get-selected-text) "" q))
                                               :end-pattern page-ref/right-brackets
                                               :postfix-fn   (fn [s] (util/replace-first page-ref/right-brackets s ""))
                                               :command :page-ref})
            chosen-result (or result chosen-result)]
      (when (:db/id chosen-result)
        (state/conj-block-ref! chosen-result)))))

(defn on-chosen-handler
  [input id pos format]
  (let [cursor-pos (cursor/pos input)
        input-value (some-> input .-value)
        edit-content (if (nil? input-value)
                       (state/get-edit-content)
                       input-value)
        current-pos (if (and (number? cursor-pos)
                             (number? pos)
                             (< cursor-pos pos))
                      (count edit-content)
                      cursor-pos)
        action (state/get-editor-action)
        hashtag? (= action :page-search-hashtag)
        q (or
           (editor-handler/get-selected-text)
           (when hashtag?
             (common-util/safe-subs edit-content pos current-pos))
           (when (> (count edit-content) current-pos)
             (common-util/safe-subs edit-content pos current-pos)))]
    (if hashtag?
      (tag-on-chosen-handler input id pos format current-pos edit-content q)
      (page-on-chosen-handler id format q))))

(defn create-today-journal!
  []
  (when (and
         ;; FIXME: There are a lot of long-running actions we don't want interrupted by this fn.
         ;; We should implement an app-wide check rather than list them all here
         (not (:graph/loading? @state/state))
         (not (:graph/importing @state/state))
         (not config/publishing?))
    (when-let [title (date/today)]
      (state/set-today! title)
      (p/let [today-page-lc-title (util/page-name-sanity-lc title)
              page (<today-journal-page)]
        (when-not page
          (p/let [result (<create! title {:redirect? false
                                          :split-namespace? false
                                          :today-journal? true})]
            (plugin-handler/hook-plugin-app :today-journal-created {:title today-page-lc-title})
            result))))))

(defonce ^:private *date-watch-interval (atom nil))

(defn watch-for-date!
  []
  (when-some [interval @*date-watch-interval]
    (js/clearInterval interval))
  (let [*last-date (atom nil)
        check-date! (fn []
                      (let [today (date/today)]
                        (when (and today (not= today @*last-date))
                          (reset! *last-date today)
                          (create-today-journal!))))]
    (check-date!)
    (reset! *date-watch-interval
            (js/setInterval check-date! 3000))))

(defn open-today-in-sidebar
  []
  (p/let [page (<today-journal-page)]
    (when-let [page-id (:db/id page)]
      (state/sidebar-add-block!
       (state/get-current-repo)
       page-id
       :page))))

(defn copy-page-url
  ([]
   (let [id (page-util/get-current-page-uuid)]
     (copy-page-url id)))
  ([page-uuid]
   (if page-uuid
     (util/copy-to-clipboard!
      (url-util/get-logseq-web-page-url config/app-website
                                        (graph-handler/current-graph-id)
                                        (str page-uuid)))
     (notification/show! (t :page/no-page-found-to-copy) :warning))))
