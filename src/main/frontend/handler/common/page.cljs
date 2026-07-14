(ns frontend.handler.common.page
  "Common fns for file and db based page handlers, including create!, delete!
  and favorite fns. This ns should be agnostic of file or db concerns but there
  is still some file-specific tech debt to remove from create!"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [dommy.core :as dom]
            [frontend.context.i18n :as i18n :refer [t]]
            [frontend.handler.config :as config-handler]
            [frontend.handler.db-based.editor :as db-editor-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.user :as user-handler]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.state :as state]
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

(defn- page-lookup-ref
  [page-id-or-title]
  (cond
    (uuid? page-id-or-title)
    [:block/uuid page-id-or-title]

    (common-util/uuid-string? page-id-or-title)
    [:block/uuid (uuid page-id-or-title)]

    :else
    [:block/name (common-util/page-name-sanity-lc page-id-or-title)]))

(defn- <page-for-edit
  [page-id-or-title]
  (if (map? page-id-or-title)
    (p/resolved page-id-or-title)
    (when-let [repo (state/get-current-repo)]
      (state/<invoke-db-worker :thread-api/pull
                               repo
                               [:db/id :block/uuid]
                               (page-lookup-ref page-id-or-title)))))

(def ^:private page-for-create-selector
  '[:db/id :block/uuid :block/title :block/name :logseq.property/deleted-at
    {:block/tags [:db/id :db/ident :block/uuid :block/title]}
    {:block/parent ...}])

(defn- <page-for-create
  [page-id-or-title]
  (when-let [repo (state/get-current-repo)]
    (state/<invoke-db-worker :thread-api/pull
                             repo
                             page-for-create-selector
                             (page-lookup-ref page-id-or-title))))

(defn edit-page-when-present!
  [page-id-or-title]
  (letfn [(poll! [remaining-ms]
            (p/let [page (<page-for-edit page-id-or-title)]
              (if page
                (edit-page! page)
                (when (pos? remaining-ms)
                  (js/setTimeout #(poll! (- remaining-ms 100)) 100)))))]
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
                               (common-util/split-first (str "#" page-ref/left-brackets) (:block/title parsed-result)))
                              string/trim)
                      title)]
       (cond
         (and has-tags? (nil? title'))
         (notification/show! (t :page.validation/name-no-hash) :error)

         (and has-tags?
              (seq (set/intersection ldb/private-tags (set (map :db/ident (:block/tags parsed-result))))))
         (notification/show! (i18n/interpolate-rich-text-node
                              (t :page.validation/cant-set-built-in-tags)
                              [(i18n/locale-join-rich-text-node
                                (keep #(when (ldb/private-tags (:db/ident %))
                                         (pr-str (:block/title %)))
                                      (:block/tags parsed-result)))])
                             :error)

         :else
         (when-not (string/blank? title')
           (p/let [existing-page (when-not class? (<page-for-create title'))]
             (if (and existing-page (not (ldb/recycled? existing-page)))
               (do
                 (when redirect?
                   (route-handler/redirect-to-page! (:block/uuid existing-page))
                 (when (and edit? (not today-journal?))
                     (js/setTimeout #(edit-page! existing-page) 100)))
                 existing-page)
               (p/let [options' (cond-> (update options :tags concat (:block/tags parsed-result))
                                  (nil? (:split-namespace? options))
                                  (assoc :split-namespace? true))
                       [_page-name page-uuid] (ui-outliner-tx/transact!
                                               {:outliner-op :create-page}
                                               (outliner-op/create-page! title' options'))
                       page (<page-for-create (or page-uuid title'))]
                 (when redirect?
                   (route-handler/redirect-to-page! page-uuid)
                   (when (and edit? (not today-journal?))
                     (js/setTimeout #(some-> page edit-page!) 100)))
                 page)))))))))

;; favorite fns
;; ============
(defn <db-favorited?
  [page-block-uuid]
  {:pre [(uuid? page-block-uuid)]}
  (when-let [repo (state/get-current-repo)]
    (state/<invoke-db-worker :thread-api/favorited-page?
                             repo
                             page-block-uuid)))

(defn- <apply-favorite-ops!
  [repo ops]
  (when (seq ops)
    (state/<invoke-db-worker :thread-api/apply-outliner-ops repo ops nil)))

(defn <db-favorite-page!
  [page-block-uuid]
  {:pre [(uuid? page-block-uuid)]}
  (when-let [repo (state/get-current-repo)]
    (p/let [ops (state/<invoke-db-worker :thread-api/build-favorite-page-ops repo page-block-uuid)]
      (<apply-favorite-ops! repo ops))))

(defn <db-unfavorite-page!
  [page-block-uuid]
  {:pre [(uuid? page-block-uuid)]}
  (when-let [repo (state/get-current-repo)]
    (p/let [ops (state/<invoke-db-worker :thread-api/build-unfavorite-page-ops repo page-block-uuid)]
      (<apply-favorite-ops! repo ops))))

;; favorites fns end ================

(defn- delete-page-opts
  []
  (if-let [user-uuid (user-handler/user-uuid)]
    {:deleted-by-uuid (uuid user-uuid)}
    {}))

(defn <delete!
  "Deletes a page. If delete is successful calls ok-handler. Otherwise calls error-handler
   if given. Note that error-handler is being called in addition to error messages that worker
   already provides"
  [page-uuid-or-name ok-handler & {:keys [error-handler]}]
  (when page-uuid-or-name
    (assert (or (uuid? page-uuid-or-name) (string? page-uuid-or-name)))
    (when @state/*db-worker
      (when-let [repo (state/get-current-repo)]
        (p/let [page (state/<invoke-db-worker
                      :thread-api/pull
                      repo
                      [:block/uuid :block/title]
                      (page-lookup-ref page-uuid-or-name))]
          (when-let [page-uuid (:block/uuid page)]
            (let [default-home (state/get-default-home)
                  home-page? (= (:block/title page) (:page default-home))]
              (p/do!
               (when home-page?
                 (p/do!
                  (config-handler/set-config! :default-home (dissoc default-home :page))
                  (notification/show! (t :settings.features/home-default-page-update-success) :success)))
               (-> (p/let [res (state/<invoke-db-worker
                                 :thread-api/apply-outliner-ops
                                 repo
                                 [[:delete-page [page-uuid (delete-page-opts)]]]
                                 nil)]
                     (if res
                       (when ok-handler (ok-handler))
                       (when error-handler (error-handler))))
                   (p/catch (fn [error]
                              (js/console.error error))))))))))))

;; other fns
;; =========

(defn after-page-deleted!
  [page-name]
  (when-let [repo (state/get-current-repo)]
    (p/let [page (state/<invoke-db-worker :thread-api/pull repo [:block/uuid] (page-lookup-ref page-name))]
      (when-let [page-block-uuid (:block/uuid page)]
        (<db-unfavorite-page! page-block-uuid)))))

(defn after-page-renamed!
  [repo {:keys [page-id old-name new-name]}]
  (let [old-page-name       (common-util/page-name-sanity-lc old-name)
        redirect? (= (some-> (state/get-current-page) common-util/page-name-sanity-lc)
                     (common-util/page-name-sanity-lc old-page-name))]
    (p/do!
     (when redirect?
       (p/let [page (state/<invoke-db-worker :thread-api/pull repo [:block/uuid] page-id)]
         (when-let [page-uuid (:block/uuid page)]
           (route-handler/redirect! {:to          :page
                                     :push        false
                                     :path-params {:name (str page-uuid)}}))))
     (let [home (get (state/get-config) :default-home {})]
       (when (= old-page-name (common-util/page-name-sanity-lc (get home :page "")))
         (config-handler/set-config! :default-home (assoc home :page new-name))))
     (ui-handler/re-render-root!))))
