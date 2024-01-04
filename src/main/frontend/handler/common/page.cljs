(ns frontend.handler.common.page
  "Common fns for file and db based page handlers, including create!, delete!
  and favorite fns. This ns should be agnostic of file or db concerns but there
  is still some file-specific tech debt to remove from create!"
  (:require [clojure.string :as string]
            [frontend.db :as db]
            [frontend.handler.config :as config-handler]
            [frontend.handler.route :as route-handler]
            [frontend.state :as state]
            [frontend.worker.handler.page :as worker-page]
            [logseq.common.util :as common-util]
            [logseq.graph-parser.text :as text]
            [frontend.handler.ui :as ui-handler]
            [frontend.config :as config]
            [frontend.fs :as fs]
            [promesa.core :as p]))

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
         config (state/get-config repo)]
     (when-let [page-name (worker-page/create! repo conn config title options)]
       (when redirect?
         (route-handler/redirect-to-page! page-name))
       page-name))))

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
(defn rename-update-namespace!
  "update :block/namespace of the renamed block"
  [page old-original-name new-name]
  (let [old-namespace? (text/namespace-page? old-original-name)
        new-namespace? (text/namespace-page? new-name)
        repo           (state/get-current-repo)]
    (cond
      new-namespace?
      ;; update namespace
      (let [namespace (first (common-util/split-last "/" new-name))]
        (when namespace
          (create! namespace {:redirect? false}) ;; create parent page if not exist, creation of namespace ref is handled in `create!`
          (let [namespace-block (db/pull [:block/name (common-util/page-name-sanity-lc namespace)])
                page-txs [{:db/id (:db/id page)
                           :block/namespace (:db/id namespace-block)}]]
            (db/transact! repo page-txs))))

      old-namespace?
      ;; retract namespace
      (db/transact! [[:db/retract (:db/id page) :block/namespace]])

      :else
      nil)))

(defn after-page-deleted!
  [repo page-name file-path]
  (let [repo-dir (config/get-repo-dir repo)]
      ;; TODO: move favorite && unfavorite to worker too
    (unfavorite-page! page-name)

    (route-handler/redirect-to-home!)

    ;; TODO: why need this?
    (ui-handler/re-render-root!)

    (when file-path
      (-> (p/let [exists? (fs/file-exists? repo-dir file-path)]
            (when exists? (fs/unlink! repo (config/get-repo-fpath repo file-path) nil)))
          (p/catch (fn [error] (js/console.error error)))))))
