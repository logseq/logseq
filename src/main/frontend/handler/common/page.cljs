(ns frontend.handler.common.page
  "Common fns for file and db based page handlers, including create!, delete!
  and favorite fns. This ns should be agnostic of file or db concerns but there
  is still some file-specific tech debt to remove from create!"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db.conn :as conn]
            [frontend.fs :as fs]
            [frontend.handler.block :as block-handler]
            [frontend.handler.config :as config-handler]
            [frontend.handler.db-based.editor :as db-editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.user :as user]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.state :as state]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(defn- wrap-tags
  "Tags might have multiple words"
  [title]
  (let [parts (string/split title #" #")]
    (->>
     (cons (first parts)
           (map (fn [s]
                  (if (and (string/includes? s " ") (not (page-ref/page-ref? s)))
                    (page-ref/->page-ref s)
                    s))
                (rest parts)))
     (string/join " #"))))

(defn <create!
  ([title]
   (<create! title {}))
  ([title {:keys [redirect?]
           :or   {redirect? true}
           :as options}]
   (when (string? title)
     (p/let [repo (state/get-current-repo)
             conn (db/get-db repo false)
             db-based? (config/db-based-graph? repo)
             title (if (and db-based? (string/includes? title " #")) ; tagged page
                     (wrap-tags title)
                     title)
             parsed-result (when db-based? (db-editor-handler/wrap-parse-block {:block/title title}))
             has-tags? (and db-based? (seq (:block/tags parsed-result)))
             title' (if has-tags?
                      (some-> (first
                               (common-util/split-first (str "#" page-ref/left-brackets) (:block/title parsed-result)))
                              string/trim)
                      title)]
       (if (and has-tags? (nil? title'))
         (notification/show! "Page name can't include \"#\"." :warning)
         (when-not (string/blank? title')
           (p/let [current-user-id (user/user-uuid)
                   options' (if db-based?
                              (cond-> (update options :tags concat (:block/tags parsed-result))
                                (nil? (:split-namespace? options))
                                (assoc :split-namespace? true)
                                current-user-id
                                (assoc :created-by current-user-id))
                              options)
                   result (ui-outliner-tx/transact!
                           {:outliner-op :create-page}
                           (outliner-op/create-page! title' options'))
                   [_page-name page-uuid] (ldb/read-transit-str result)]
             (when redirect?
               (route-handler/redirect-to-page! page-uuid))
             (let [page (db/get-page (or page-uuid title'))]
               (when-let [first-block (ldb/get-first-child @conn (:db/id page))]
                 (block-handler/edit-block! first-block :max {:container-id :unknown-container}))
               page))))))))

;; favorite fns
;; ============
(defn file-favorited?
  [page-name]
  (let [favorites (->> (:favorites (state/get-config))
                       (filter string?)
                       (map string/lower-case)
                       (set))]
    (contains? favorites (string/lower-case page-name))))

(defn file-favorite-page!
  [page-name]
  (when-not (string/blank? page-name)
    (let [favorites (->
                     (cons
                      page-name
                      (or (:favorites (state/get-config)) []))
                     (distinct)
                     (vec))]
      (config-handler/set-config! :favorites favorites))))

(defn file-unfavorite-page!
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
    (when-let [page (db/get-page common-config/favorites-page-name)]
      (let [blocks (ldb/get-page-blocks db (:db/id page))]
        (when-let [page-block-entity (d/entity db [:block/uuid page-block-uuid])]
          (some (fn [block]
                  (when (= (:db/id (:block/link block)) (:db/id page-block-entity))
                    block))
                blocks))))))

(defn db-favorited?
  [page-block-uuid]
  {:pre [(uuid? page-block-uuid)]}
  (some? (find-block-in-favorites-page page-block-uuid)))

(defn <db-favorite-page!
  [page-block-uuid]
  {:pre [(uuid? page-block-uuid)]}
  (when (d/entity (conn/get-db) [:block/uuid page-block-uuid])
    (p/do!
     (ui-outliner-tx/transact!
      {:outliner-op :insert-blocks}
      (outliner-op/insert-blocks! [(ldb/build-favorite-tx page-block-uuid)]
                                  (db/get-page common-config/favorites-page-name)
                                  {})))))

(defn <db-unfavorite-page!
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
                             (:block/uuid (db/get-page page-uuid-or-name)))]
      (when @state/*db-worker
        (let [page (db/entity [:block/uuid page-uuid])
              default-home (state/get-default-home)
              home-page? (= (:block/title page) (:page default-home))]
          (p/do!
           (when home-page?
             (p/do!
              (config-handler/set-config! :default-home (dissoc default-home :page))
              (config-handler/set-config! :feature/enable-journals? true)
              (notification/show! "Journals enabled" :success)))
           (-> (p/let [res (ui-outliner-tx/transact!
                            {:outliner-op :delete-page}
                            (outliner-op/delete-page! page-uuid))
                       res' (ldb/read-transit-str res)]
                 (if res'
                   (when ok-handler (ok-handler))
                   (when error-handler (error-handler))))
               (p/catch (fn [error]
                          (js/console.error error))))))))))

;; other fns
;; =========

(defn after-page-deleted!
  [repo page-name file-path tx-meta]
  (let [repo-dir (config/get-repo-dir repo)]
      ;; TODO: move favorite && unfavorite to worker too
    (if (config/db-based-graph? repo)
      (when-let [page-block-uuid (:block/uuid (db/get-page page-name))]
        (<db-unfavorite-page! page-block-uuid))
      (file-unfavorite-page! page-name))

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
  [repo {:keys [page-id old-name new-name old-path new-path]}]
  (let [db-based?           (config/db-based-graph? repo)
        old-page-name       (common-util/page-name-sanity-lc old-name)
        new-page-name       (common-util/page-name-sanity-lc new-name)
        redirect? (= (some-> (state/get-current-page) common-util/page-name-sanity-lc)
                     (common-util/page-name-sanity-lc old-page-name))
        page (db/entity repo page-id)]

    ;; Redirect to the newly renamed page
    (when (and redirect? (not (db/whiteboard-page? page)))
      (route-handler/redirect! {:to          :page
                                :push        false
                                :path-params {:name (str (:block/uuid page))}}))

    ;; FIXME: favorites should store db id/uuid instead of page names
    (when (and (config/db-based-graph? repo) (file-favorited? old-page-name))
      (file-unfavorite-page! old-page-name)
      (file-favorite-page! new-page-name))
    (let [home (get (state/get-config) :default-home {})]
      (when (= old-page-name (common-util/page-name-sanity-lc (get home :page "")))
        (config-handler/set-config! :default-home (assoc home :page new-name))))

    (when-not db-based?
      (when (and old-path new-path)
        (rename-file! old-path new-path)))

    (ui-handler/re-render-root!)))
