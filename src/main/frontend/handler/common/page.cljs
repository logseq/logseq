(ns frontend.handler.common.page
  "Common fns for file and db based page handlers, including create!, delete!
  and favorite fns. This ns should be agnostic of file or db concerns but there
  is still some file-specific tech debt to remove from create!"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [dommy.core :as dom]
            [frontend.context.i18n :as i18n :refer [t]]
            [frontend.db :as db]
            [frontend.db.conn :as conn]
            [frontend.handler.config :as config-handler]
            [frontend.handler.db-based.editor :as db-editor-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.state :as state]
            [logseq.melange.bridge.common.api :as melange-common]

            [logseq.melange.bridge.db.core :as ldb]
            [logseq.melange.bridge.db.class-catalog :as class-catalog]
            [promesa.core :as p]))

(defn- wrap-tags
  "Tags might have multiple words"
  [title]
  (let [parts (string/split title #" #")]
    (->>
     (cons (first parts)
           (map (fn [s]
                  (if (and (string/includes? s " ") (not (melange-common/page-ref? s)))
                    (melange-common/to-page-ref s)
                    s))
                (rest parts)))
     (string/join " #"))))

(defn- find-page-add-button
  [page-id]
  (when page-id
    (->> (dom/sel ".block-add-button")
      (filter #(= (str page-id) (dom/attr % "parentblockid")))
      first)))

(defn edit-page!
  [page]
  (letfn [(edit! []
            (if-let [block-add-button (find-page-add-button (:db/id page))]
              (.click block-add-button)
              (when (:block/uuid page)
                (editor-handler/api-insert-new-block! "" {:page (:block/uuid page)
                                                          :container-id :unknown-container}))))
          (poll! [remaining-ms]
            (if (find-page-add-button (:db/id page))
              (edit!)
              (if (pos? remaining-ms)
                (js/setTimeout #(poll! (- remaining-ms 100)) 100)
                (edit!))))]
    (poll! 5000)))

(defn edit-page-when-present!
  [page-id-or-title]
  (letfn [(poll! [remaining-ms]
            (if-let [page (cond
                            (map? page-id-or-title)
                            page-id-or-title

                            page-id-or-title
                            (db/get-page page-id-or-title))]
              (edit-page! page)
              (when (pos? remaining-ms)
                (js/setTimeout #(poll! (- remaining-ms 100)) 100))))]
    (poll! 5000)))

(defn <create!
  ([title]
   (<create! title {}))
  ([title {:keys [redirect? today-journal? class? edit?]
           :or   {redirect? true
                  edit? true}
           :as options}]
   (when (string? title)
     (p/let [title (if (string/includes? title " #") ; tagged page
                     (wrap-tags title)
                     title)
             parsed-result (db-editor-handler/wrap-parse-block {:block/title title})
             has-tags? (seq (:block/tags parsed-result))
             title' (if has-tags?
                      (some-> (first
                               (melange-common/split-first
                                            (str "#" melange-common/left-brackets)
                                            (:block/title parsed-result)))
                              string/trim)
                      title)]
       (cond
         (and has-tags? (nil? title'))
         (notification/show! (t :page.validation/name-no-hash) :error)

         (and has-tags?
              (seq (set/intersection class-catalog/private-tags (set (map :db/ident (:block/tags parsed-result))))))
         (notification/show! (i18n/interpolate-rich-text-node
                              (t :page.validation/cant-set-built-in-tags)
                              [(i18n/locale-join-rich-text-node
                                (keep #(when (class-catalog/private-tags (:db/ident %))
                                         (pr-str (:block/title %)))
                                      (:block/tags parsed-result)))])
                             :error)

         :else
         (when-not (string/blank? title')
           (p/let [existing-page (when-not class? (db/get-page title'))]
             (if (and existing-page (not (ldb/recycled? existing-page)))
               (do
                 (when redirect?
                   (route-handler/redirect-to-page! (:block/uuid existing-page))
                 (when (and edit? (not today-journal?))
                     (js/setTimeout #(some-> (db/get-page title') edit-page!) 100)))
                 existing-page)
               (p/let [options' (cond-> (update options :tags concat (:block/tags parsed-result))
                                  (nil? (:split-namespace? options))
                                  (assoc :split-namespace? true))
                       [_page-name page-uuid] (ui-outliner-tx/transact!
                                               {:outliner-op :create-page}
                                               (outliner-op/create-page! title' options'))
                       page (db/get-page (or page-uuid title'))]
                 (when redirect?
                   (route-handler/redirect-to-page! page-uuid)
                   (when (and edit? (not today-journal?))
                     (js/setTimeout #(some-> (db/get-page (or page-uuid title')) edit-page!) 100)))
                 page)))))))))

;; favorite fns
;; ============
(defn- find-block-in-favorites-page
  [page-block-uuid]
  (let [db (conn/get-db)]
    (when-let [page (db/get-page melange-common/favorites-page-name)]
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
                                  (db/get-page melange-common/favorites-page-name)
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
              (notification/show! (t :settings.features/home-default-page-update-success) :success)))
           (-> (p/let [res (ui-outliner-tx/transact!
                             {:outliner-op :delete-page}
                             (outliner-op/delete-page! page-uuid))]
                 (if res
                   (when ok-handler (ok-handler))
                   (when error-handler (error-handler))))
               (p/catch (fn [error]
                          (js/console.error error))))))))))

;; other fns
;; =========

(defn after-page-deleted!
  [page-name]
  ;; TODO: move favorite && unfavorite to worker too
  (when-let [page-block-uuid (:block/uuid (db/get-page page-name))]
    (<db-unfavorite-page! page-block-uuid)))

(defn after-page-renamed!
  [repo {:keys [page-id old-name new-name]}]
  (let [old-page-name       (melange-common/page-name-sanity-lower old-name)
        redirect? (= (some-> (state/get-current-page) (melange-common/page-name-sanity-lower))
                     (melange-common/page-name-sanity-lower old-page-name))
        page (db/entity repo page-id)]

    ;; Redirect to the newly renamed page
    (when redirect?
      (route-handler/redirect! {:to          :page
                                :push        false
                                :path-params {:name (str (:block/uuid page))}}))

    (let [home (get (state/get-config) :default-home {})]
      (when (= old-page-name (melange-common/page-name-sanity-lower (get home :page "")))
        (config-handler/set-config! :default-home (assoc home :page new-name))))

    (ui-handler/re-render-root!)))
