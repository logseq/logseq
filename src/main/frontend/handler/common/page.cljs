(ns frontend.handler.common.page
  "Common fns for file and db based page handlers, including create!, delete!
  and favorite fns. This ns should be agnostic of file or db concerns but there
  is still some file-specific tech debt to remove from create!"
  (:require [clojure.string :as string]
            [frontend.db :as db]
            [frontend.db.model :as model]
            [frontend.handler.config :as config-handler]
            [frontend.handler.route :as route-handler]
            [frontend.state :as state]
            [frontend.worker.handler.page :as worker-page]
            [logseq.common.util :as common-util]
            [frontend.handler.ui :as ui-handler]
            [frontend.config :as config]
            [frontend.fs :as fs]
            [promesa.core :as p]
            [frontend.handler.block :as block-handler]
            [frontend.handler.file-based.recent :as file-recent-handler]
            [frontend.format.block :as block]
            [logseq.db :as ldb]
            [frontend.db.conn :as conn]
            [datascript.core :as d]
            [frontend.handler.editor :as editor-handler]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [logseq.outliner.core :as outliner-core]))

(defn build-hidden-page-tx-data
  [page-name]
  (let [page-name* (str "$$$" page-name)]
    (assoc (block/page-name->map page-name* false false)
           :block/type #{"hidden"}
           :block/format :markdown)))

;; TODO: return page entity instead
(defn create!
  "Create page. Has the following options:

   * :redirect?           - when true, redirect to the created page, otherwise return sanitized page name.
   * :create-first-block? - when true, create an empty block if the page is empty.
   * :uuid                - when set, use this uuid instead of generating a new one.
   * :class?              - when true, adds a :block/type 'class'
   * :whiteboard?         - when true, adds a :block/type 'whiteboard'
   * :tags                - tag uuids that are added to :block/tags
   * :persist-op?         - when true, add an update-page op
   "
  ([title]
   (create! title {}))
  ([title {:keys [redirect?]
           :or   {redirect? true}
           :as options}]
   (let [repo (state/get-current-repo)
         conn (db/get-db repo false)
         config (state/get-config repo)
         _ (worker-page/create! repo conn config title options)
         [_ page-name] (worker-page/get-title-and-pagename title)]
     (when redirect?
       (route-handler/redirect-to-page! page-name))
     (when-let [first-block (first (:block/_left (db/entity [:block/name page-name])))]
       (block-handler/edit-block! first-block :max nil))
     page-name)))

(defn <create!
  ([title]
   (<create! title {}))
  ([title {:keys [redirect?]
           :or   {redirect? true}
           :as options}]
   (p/let [repo (state/get-current-repo)
           conn (db/get-db repo false)
           config (state/get-config repo)
           _ (worker-page/create! repo conn config title options)
           [_ page-name] (worker-page/get-title-and-pagename title)]
     (when redirect?
       (route-handler/redirect-to-page! page-name))
     (let [page (db/entity [:block/name page-name])]
       (when-let [first-block (first (:block/_left page))]
         (block-handler/edit-block! first-block :max nil))
       page))))

;; favorite fns
;; ============
(defn favorited?
  [page-name]
  (let [favorites (->> (:favorites (state/get-config))
                       (filter string?)
                       (map string/lower-case)
                       (set))]
    (contains? favorites page-name)))

(defn favorite-page!
  [page-name]
  (when-not (string/blank? page-name)
    (let [favorites (->
                     (cons
                      page-name
                      (or (:favorites (state/get-config)) []))
                     (distinct)
                     (vec))]
      (config-handler/set-config! :favorites favorites))))

(defn unfavorite-page!
  [page-name]
  (when-not (string/blank? page-name)
    (let [old-favorites (:favorites (state/get-config))
          new-favorites (->> old-favorites
                             (remove #(= (string/lower-case %) (string/lower-case page-name)))
                             (vec))]
      (when-not (= old-favorites new-favorites)
        (config-handler/set-config! :favorites new-favorites)))))

(def favorites-page-name "$$$favorites")

(defn- find-block-in-favorites-page
  [page-block-uuid]
  (let [db (conn/get-db)
        page-block-uuid-str (str page-block-uuid)
        blocks (ldb/get-page-blocks db favorites-page-name {})]
    (some (fn [block]
            (when (= page-block-uuid-str (:block/content block))
              block))
          blocks)))

(defn favorited?-v2
  [page-block-uuid]
  {:pre [(uuid? page-block-uuid)]}
  (some? (find-block-in-favorites-page page-block-uuid)))

(defn <favorite-page!-v2
  [page-block-uuid]
  {:pre [(uuid? page-block-uuid)]}
  (let [favorites-page (d/entity (conn/get-db) [:block/name favorites-page-name])
        favorites-page-tx-data (build-hidden-page-tx-data "favorites")]
    (p/let [r1 (when-not favorites-page (ldb/transact! nil [favorites-page-tx-data]))
            r2 (editor-handler/api-insert-new-block!
                (str page-block-uuid)
                {:page favorites-page-name :edit-block? false})]
      (prn ::insert-favorite-page r1 r2))))

(defn <unfavorite-page!-v2
  [page-block-uuid]
  {:pre [(uuid? page-block-uuid)]}
  (let [repo (state/get-current-repo)]
    (when-let [block (find-block-in-favorites-page page-block-uuid)]
      (ui-outliner-tx/transact!
       {:outliner-op :delete-blocks}
       (outliner-core/delete-blocks! repo (conn/get-db false) (state/get-date-formatter) [block] {})))))


;; favorites fns end ================


(defn delete!
  "Deletes a page and then either calls the ok-handler or the error-handler if unable to delete"
  [page-name ok-handler & {:keys [_persist-op? _error-handler]
                           :as opts}]
  (when page-name
    (when-let [repo (state/get-current-repo)]
      (let [conn (db/get-db repo false)]
        (worker-page/delete! repo conn page-name ok-handler opts)))))

;; other fns
;; =========


(defn after-page-deleted!
  [repo page-name file-path tx-meta]
  (let [repo-dir (config/get-repo-dir repo)]
      ;; TODO: move favorite && unfavorite to worker too
    (if (config/db-based-graph? repo)
      (when-let [page-block-uuid (:block/uuid
                                  (d/entity (conn/get-db repo)
                                            [:block/name (common-util/page-name-sanity-lc page-name)]))]
        (<unfavorite-page!-v2 page-block-uuid))
      (unfavorite-page! page-name))

    (when (and (not= :rename-page (:real-outliner-op tx-meta))
               (= (some-> (state/get-current-page) common-util/page-name-sanity-lc)
                  (common-util/page-name-sanity-lc page-name)))
      (route-handler/redirect-to-home!))

    ;; TODO: why need this?
    (ui-handler/re-render-root!)

    (when file-path
      (-> (p/let [exists? (fs/file-exists? repo-dir file-path)]
            (when exists? (fs/unlink! repo (config/get-repo-fpath repo file-path) nil)))
          (p/catch (fn [error] (js/console.error error)))))))

(defn rename-file!
  "emit file-rename events to :file/rename-event-chan
   force-fs? - when true, rename file event the db transact is failed."
  [old-path new-path]
  (let [repo (state/get-current-repo)]
    (->
     (p/let [_ (state/offer-file-rename-event-chan! {:repo repo
                                                     :old-path old-path
                                                     :new-path new-path})]
       (fs/rename! repo old-path new-path))
     (p/catch (fn [error]
                (println "file rename failed: " error))))))

(defn after-page-renamed!
  [repo {:keys [old-name new-name old-path new-path]}]
  (let [db-based?           (config/db-based-graph? repo)
        old-page-name       (common-util/page-name-sanity-lc old-name)
        new-page-name       (common-util/page-name-sanity-lc new-name)
        page (db/entity [:block/name new-page-name])
        redirect? (= (some-> (state/get-current-page) common-util/page-name-sanity-lc)
                     (common-util/page-name-sanity-lc old-page-name))]

    ;; Redirect to the newly renamed page
    (when redirect?
      (route-handler/redirect! {:to          (if (model/whiteboard-page? page) :whiteboard :page)
                                :push        false
                                :path-params {:name new-page-name}}))

    (when (and (config/db-based-graph? repo) (favorited? old-page-name))
      (unfavorite-page! old-page-name)
      (favorite-page! new-page-name))
    (let [home (get (state/get-config) :default-home {})]
      (when (= old-page-name (common-util/page-name-sanity-lc (get home :page "")))
        (config-handler/set-config! :default-home (assoc home :page new-name))))

    (when-not db-based?
      (file-recent-handler/update-or-add-renamed-page repo old-page-name new-page-name)

      (when (and old-path new-path)
        (rename-file! old-path new-path)))

    (ui-handler/re-render-root!)))
