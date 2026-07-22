(ns frontend.handler.page
  "Provides util handler fns for pages"
  (:require [logseq.melange.bridge.common.api :as melange-common]
            [clojure.string :as string]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [frontend.commands :as commands]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.db.conn :as conn]
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
            [frontend.util.page :as page-util]
            [frontend.util.url :as url-util]
            [goog.functions :refer [debounce]]

            [logseq.melange.bridge.db.core :as ldb]
            [logseq.melange.bridge.common.regex :as melange-regex]
            [promesa.core :as p]))

(def <create! page-common-handler/<create!)
(def <delete! page-common-handler/<delete!)
(def edit-page-when-present! page-common-handler/edit-page-when-present!)

(defn get-recycle-page
  []
  (db/get-page melange-common/recycle-page-name))

(defn open-recycle!
  []
  (when-let [page (get-recycle-page)]
    (route-handler/redirect-to-page! (:block/uuid page))))

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
  (p/do!
   (when-let [page-block-uuid (:block/uuid (db/get-page page-name))]
     (page-common-handler/<db-unfavorite-page! page-block-uuid))
   (state/update-favorites-updated!)))

(defn <favorite-page!
  [page-name]
  (p/do!
   (when-let [page-block-uuid (:block/uuid (db/get-page page-name))]
     (page-common-handler/<db-favorite-page! page-block-uuid))
   (state/update-favorites-updated!)))

(defn favorited?
  [page-name]
  (boolean
   (when-let [page-block-uuid (:block/uuid (db/get-page page-name))]
     (page-common-handler/db-favorited? page-block-uuid))))

(defn get-favorites
  "return page-block entities"
  []
  (when-let [db (conn/get-db)]
    (when-let [page (ldb/get-page db melange-common/favorites-page-name)]
      (let [blocks (ldb/sort-by-order (:block/_parent page))]
        (->> blocks
             (keep (fn [block]
                     (when-let [block-db-id (:db/id (:block/link block))]
                       (d/entity db block-db-id))))
             (remove ldb/recycled?))))))

(defn toggle-favorite! []
  ;; NOTE: in journals or settings, current-page is nil
  (when-let [page-name (state/get-current-page)]
    (if (favorited? page-name)
      (<unfavorite-page! page-name)
      (<favorite-page! page-name))))

(defn rename!
  [page-uuid new-name & {:as _opts}]
  (let [page-uuid (if (melange-common/uuid-string? page-uuid)
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
  (let [conn (conn/get-db false)]
    (when-let [favorites-page (db/get-page melange-common/favorites-page-name)]
      (let [favorite-page-block-db-id-coll
            (keep (fn [page-uuid]
                    (:db/id (db/get-page page-uuid)))
                  favorites)
            current-blocks (ldb/sort-by-order (ldb/get-page-blocks @conn (:db/id favorites-page)))]
        (p/do!
         (ui-outliner-tx/transact!
          {:outliner-op :reorder-favorites}
          (doseq [[page-block-db-id block] (zipmap favorite-page-block-db-id-coll current-blocks)]
            (when (not= page-block-db-id (:db/id (:block/link block)))
              (outliner-op/save-block! (assoc block :block/link page-block-db-id)))))
         (state/update-favorites-updated!))))))

(defn update-public-attribute!
  [page value]
  (db-property-handler/set-block-property! (:block/uuid page) :logseq.property/publishing-public? value))

(defn get-page-ref-text
  [page]
  (melange-common/to-page-ref page))

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

(defn- tag-on-chosen-handler
  [input id pos format current-pos edit-content q]
  (fn [chosen-result ^js e]
    (util/stop e)
    (state/clear-editor-action!)
    (p/let [_ (when (:convert-page-to-tag? chosen-result)
                (let [entity (db/entity (:db/id chosen-result))]
                  (when (and (ldb/page? entity) (not (ldb/class? entity)))
                    (db-page-handler/convert-page-to-tag! entity))))
            chosen-result (if (:block/uuid chosen-result)
                            (db/entity [:block/uuid (:block/uuid chosen-result)])
                            chosen-result)
            target (first (:block/_alias chosen-result))
            chosen-result (if (and target (not (ldb/class? chosen-result)) (ldb/class? target)) target chosen-result)
            chosen (:block/title chosen-result)
            class? (or (string/includes? chosen (str (t :editor/new-tag) " "))
                       (ldb/class? chosen-result))
            inline-tag? (and class? (= (.-identifier e) "auto-complete/meta-complete")
                             (not= chosen "Page"))
            chosen (-> chosen
                       (string/replace-first (str (t :editor/new-tag) " ") "")
                       (string/replace-first (str (t :editor/new-page) " ") ""))
            wrapped? (= melange-common/left-brackets
                        (melange-common/safe-substring-range
                                             edit-content (- pos 2) pos))
            chosen-last-part (if (melange-common/namespace-page? chosen)
                               (melange-common/get-last-part chosen)
                               chosen)
            wrapped-tag (if (and (melange-regex/safe-re-find #"\s+" chosen-last-part) (not wrapped?))
                          (melange-common/to-page-ref chosen-last-part)
                          chosen-last-part)
            q (if (editor-handler/get-selected-text) "" q)
            last-pattern (if wrapped?
                           q
                           (if (= \# (first q))
                             (subs q 1)
                             q))
            last-pattern (str "#" (when wrapped? melange-common/left-brackets) last-pattern)
            tag-in-page-auto-complete? (= melange-common/right-brackets
                                          (melange-common/safe-substring-range
                                                               edit-content current-pos (+ current-pos 2)))]
      (p/do!
       (editor-handler/insert-command! id
                                       (if (and class? (not inline-tag?)) "" (str "#" wrapped-tag))
                                       format
                                       {:last-pattern last-pattern
                                        :end-pattern (when wrapped? melange-common/right-brackets)
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
            _ (when-let [id (:block/uuid chosen-result)]
                (db-async/<get-block repo id {:children? false}))
            chosen-result (if (:block/uuid chosen-result)
                            (db/entity [:block/uuid (:block/uuid chosen-result)])
                            chosen-result)
            _ (when-not chosen-result
                (throw (ex-info "No chosen item"
                                {:chosen chosen-result})))
            chosen (:block/title chosen-result)
            chosen' (string/replace-first chosen (str (t :editor/new-page) " ") "")
            nlp-title (or (:nlp-original-title chosen-result) chosen')
            [chosen' chosen-result] (or (when (and (:nlp-date? chosen-result) (not (de/entity? chosen-result)))
                                          (when-let [result (date/nld-parse nlp-title)]
                                            (let [d (doto (goog.date.DateTime.) (.setTime (.getTime result)))
                                                  gd (goog.date.Date. (.getFullYear d) (.getMonth d) (.getDate d))
                                                  page (date/js-date->journal-title gd)]
                                              [page (db/get-page page)])))
                                        [chosen' chosen-result])
            datoms (state/<invoke-db-worker :thread-api/datoms repo :avet :block/name (melange-common/page-name-sanity-lower chosen'))
            multiple-pages-same-name? (> (count datoms) 1)
            ref-text (if (and (de/entity? chosen-result)
                              (or multiple-pages-same-name? (not (ldb/page? chosen-result))))
                       (melange-common/to-page-ref (:block/uuid chosen-result))
                       (get-page-ref-text chosen'))
            result (when-not (de/entity? chosen-result)
                     (<create! chosen'
                               {:redirect? false
                                :split-namespace? true}))
            ref-text' (if result
                        (let [title (:block/title result)]
                          (melange-common/to-page-ref title))
                        ref-text)]
      (p/do!
       (editor-handler/insert-command! id
                                       ref-text'
                                       format
                                       {:last-pattern (str melange-common/left-brackets (if (editor-handler/get-selected-text) "" q))
                                        :end-pattern melange-common/right-brackets
                                        :postfix-fn   (fn [s] (util/replace-first melange-common/right-brackets s ""))
                                        :command :page-ref})
       (p/let [chosen-result (or result chosen-result)]
         (when (de/entity? chosen-result)
           (state/conj-block-ref! chosen-result)))))))

(defn on-chosen-handler
  [input id pos format]
  (let [current-pos (cursor/pos input)
        edit-content (state/get-edit-content)
        action (state/get-editor-action)
        hashtag? (= action :page-search-hashtag)
        q (or
           (editor-handler/get-selected-text)
           (when hashtag?
             (melange-common/safe-substring-range
                                  edit-content pos current-pos))
           (when (> (count edit-content) current-pos)
             (melange-common/safe-substring-range
                                  edit-content pos current-pos)))]
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
      (p/let [today-page-lc-title (melange-common/page-name-sanity-lower title)
              page (db/get-today-journal-page)]
        (when-not page
          (p/let [result (<create! title {:redirect? false
                                          :split-namespace? false
                                          :today-journal? true})]
            (plugin-handler/hook-plugin-app :today-journal-created {:title today-page-lc-title})
            result))))))

(defn open-today-in-sidebar
  []
  (when-let [page (db/get-today-journal-page)]
    (state/sidebar-add-block!
     (state/get-current-repo)
     (:db/id page)
     :page)))

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
