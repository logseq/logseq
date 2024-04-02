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
            [logseq.common.config :as common-config]
            [frontend.handler.ui :as ui-handler]
            [frontend.config :as config]
            [frontend.fs :as fs]
            [goog.object :as gobj]
            [promesa.core :as p]
            [frontend.handler.block :as block-handler]
            [frontend.handler.file-based.recent :as file-recent-handler]
            [logseq.db :as ldb]
            [frontend.db.conn :as conn]
            [datascript.core :as d]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.modules.outliner.op :as outliner-op]))

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
         [_ page-name] (worker-page/create! repo conn config title options)]
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
           [p page-name] (worker-page/create! repo conn config title options)
           _result p]
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

(defn- find-block-in-favorites-page
  [page-block-uuid]
  (let [db (conn/get-db)]
    (when-let [page-id (ldb/get-first-page-by-name db common-config/favorites-page-name)]
      (let [blocks (ldb/get-page-blocks db page-id {})]
        (when-let [page-block-entity (d/entity db [:block/uuid page-block-uuid])]
          (some (fn [block]
                  (when (= (:db/id (:block/link block)) (:db/id page-block-entity))
                    block))
                blocks))))))

(defn favorited?-v2
  [page-block-uuid]
  {:pre [(uuid? page-block-uuid)]}
  (some? (find-block-in-favorites-page page-block-uuid)))

(defn <favorite-page!-v2
  [page-block-uuid]
  {:pre [(uuid? page-block-uuid)]}
  (let [favorites-page (d/entity (conn/get-db) [:block/name common-config/favorites-page-name])]
    (when (d/entity (conn/get-db) [:block/uuid page-block-uuid])
      (p/do!
       (when-not favorites-page (ldb/create-favorites-page (state/get-current-repo)))
       (ui-outliner-tx/transact!
        {:outliner-op :insert-blocks}
        (outliner-op/insert-blocks! [(ldb/build-favorite-tx page-block-uuid)]
                                    (d/entity (conn/get-db) [:block/name common-config/favorites-page-name])
                                    {}))))))

(defn <unfavorite-page!-v2
  [page-block-uuid]
  {:pre [(uuid? page-block-uuid)]}
  (when-let [block (find-block-in-favorites-page page-block-uuid)]
    (ui-outliner-tx/transact!
     {:outliner-op :delete-blocks}
     (outliner-op/delete-blocks! [block] {}))))


;; favorites fns end ================


(defn <delete!
  "Deletes a page. If delete is successful calls ok-handler. Otherwise calls error-handler
   if given. Note that error-handler is being called in addition to error messages that worker
   already provides"
  [page-uuid-or-name ok-handler & {:keys [error-handler]}]
  (when page-uuid-or-name
    (assert (or (uuid? page-uuid-or-name) (string? page-uuid-or-name)))
    (when-let [page-uuid (or (and (uuid? page-uuid-or-name) page-uuid-or-name)
                             (:block/uuid (db/entity (ldb/get-first-page-by-name (db/get-db) page-uuid-or-name))))]
      (when-let [^Object worker @state/*db-worker]
        (-> (p/let [repo (state/get-current-repo)
                    res (.page-delete worker repo (str page-uuid))
                    res' (gobj/get res "result")]
              (if res'
                (when ok-handler (ok-handler))
                (when error-handler (error-handler))))
            (p/catch (fn [error]
                       (js/console.error error))))))))

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
        redirect? (= (some-> (state/get-current-page) common-util/page-name-sanity-lc)
                     (common-util/page-name-sanity-lc old-page-name))]

    ;; Redirect to the newly renamed page
    (when redirect?
      (route-handler/redirect! {:to          :page
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
