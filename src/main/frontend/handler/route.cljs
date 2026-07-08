(ns frontend.handler.route
  "Provides fns used for routing throughout the app"
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db.async :as db-async]
            [frontend.extensions.pdf.utils :as pdf-utils]
            [frontend.handler.graph :as graph-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.recent :as recent-handler]
            [frontend.handler.search :as search-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.graph-parser.text :as text]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [reitit.frontend.easy :as rfe]))

(defn redirect!
  "If `push` is truthy, previous page will be left in history."
  [{:keys [to path-params query-params push]
    :or {push true}}]
  (shui/popup-hide!)
  (let [route-fn (if push rfe/push-state rfe/replace-state)]
    (route-fn to path-params query-params))

  ;; force return nil for usage in render phase of React
  nil)

(defn redirect-to-home!
  ([]
   (redirect-to-home! true))
  ([pub-event?]
   (when pub-event? (state/pub-event! [:redirect-to-home]))
   (redirect! {:to :home})))

(defn redirect-to-all-pages!
  []
  (redirect! {:to :all-pages}))

(defn redirect-to-graph-view!
  []
  (redirect! {:to :graph}))

(defn redirect-to-all-graphs
  []
  (redirect! {:to :graphs}))

;; Named block links only works on web (and publishing)
(if util/web-platform?
  (defn- default-page-route
    ([page-name-or-block-uuid]
     (default-page-route page-name-or-block-uuid nil))
    ([page-name-or-block-uuid route-info]
     (if (:block-route-name route-info)
        {:to :page-block
         :path-params {:name (:block-page-name route-info)
                       :block-route-name (:block-route-name route-info)}}
        {:to :page
         :path-params {:name (if (string? page-name-or-block-uuid)
                               (util/page-name-sanity-lc page-name-or-block-uuid)
                               (str page-name-or-block-uuid))}})))

  (defn- default-page-route
    ([page-name]
     (default-page-route page-name nil))
    ([page-name _route-info]
     {:to :page
      :path-params {:name (str page-name)}})))

(defn- current-graph-query-params
  []
  (when-let [graph-id (graph-handler/current-graph-id)]
    {:graph-id graph-id}))

(defn- merge-query-params
  [route params]
  (update route :query-params merge params))

(defn- <page-route-info
  [page-name]
  (when-let [repo (state/get-current-repo)]
    (state/<invoke-db-worker :thread-api/get-page-route-info repo page-name)))

(defn redirect-to-page!
  "`page-name` can be a block uuid or name, prefer to use uuid than name when possible"
  ([page-name]
   (redirect-to-page! page-name {}))
  ([page-name {:keys [anchor push click-from-recent? block-id ignore-alias?]
               :or {click-from-recent? false}}]
   (when (or (uuid? page-name)
             (and (string? page-name) (not (string/blank? page-name))))
     (p/let [route-info (<page-route-info page-name)]
       (if (and (not config/dev?)
                (not= common-config/recycle-page-name (:page-title route-info))
                (or (and (:hidden? route-info) (not (:property? route-info)))
                    (and (:built-in? route-info) (:private-built-in? route-info))))
         (notification/show! (t :nav/cannot-go-to-internal-page) :warning)
         (if-let [source-uuid (and (not ignore-alias?) (:alias-source-uuid route-info))]
           (p/let [source-route-info (<page-route-info source-uuid)]
             (when-let [source-id (:alias-source-id route-info)]
               (recent-handler/add-page-to-recent! source-id click-from-recent?))
             (let [m (cond->
                      (merge-query-params
                       (default-page-route (str source-uuid) source-route-info)
                       (current-graph-query-params))

                       block-id
                       (merge-query-params {:anchor (str "ls-block-" block-id)})

                       anchor
                       (merge-query-params {:anchor anchor})

                       (boolean? push)
                       (assoc :push push))]
               (redirect! m)))
           (do
             (when-let [db-id (:page-id route-info)]
               (recent-handler/add-page-to-recent! db-id click-from-recent?))
             (let [m (cond->
                      (merge-query-params
                       (default-page-route (str page-name) route-info)
                       (current-graph-query-params))

                       block-id
                       (merge-query-params {:anchor (str "ls-block-" block-id)})

                       anchor
                       (merge-query-params {:anchor anchor})

                       (boolean? push)
                       (assoc :push push))]
              (redirect! m)))))))))

(defn built-in-page-title
  [page-name]
  (case page-name
    common-config/library-page-name
    (t :library/title)

    common-config/quick-add-page-name
    (t :editor.quick-add/title)

    common-config/recycle-page-name
    (t :storage.recycle/title)

    nil))

(defn- static-title
  [name path-params]
  (case name
    :home
    "Logseq"
    :graphs
    (t :mobile.tab/graphs)
    :graph
    (t :nav/graph)
    :all-files
    (t :nav/all-files)
    :all-pages
    (t :nav.all-pages/title)
    :all-journals
    (t :nav/all-journals)
    :file
    (t :file/title (:path path-params))
    :new-page
    (t :page/create)
    :tag
    (str "#"  (:name path-params))
    :diff
    (t :graph/diff)
    :settings
    (t :nav/settings)
    :import
    (t :import/title)
    "Logseq"))

(defn- format-page-route-title
  [{:keys [page-title block-title]}]
  (or (when page-title
        (if (common-util/uuid-string? page-title)
          (t :ui/untitled)
          (or (built-in-page-title page-title)
              page-title)))
      (when block-title
        (let [content (text/remove-level-spaces block-title :markdown common-config/block-pattern)]
          (if (> (count content) 48)
            (str (subs content 0 48) "...")
            content)))
      "Logseq"))

(defn- <page-route-title
  [route-name]
  (if-let [repo (state/get-current-repo)]
    (p/let [title-info (state/<invoke-db-worker :thread-api/get-route-title repo route-name)]
      (format-page-route-title title-info))
    "Logseq"))

(defn get-title
  [name path-params]
  (if (= :page name)
    (<page-route-title (:name path-params))
    (p/resolved (static-title name path-params))))

(defn update-page-title!
  [route]
  (let [{:keys [data path-params]} route]
    (p/let [title (get-title (:name data) path-params)
            hls? (pdf-utils/hls-file? title)]
      (util/set-title! (if hls? (pdf-utils/fix-local-asset-pagename title) title)))))

(defn update-page-label!
  [route]
  (let [{:keys [data]} route]
    (when-let [data-name (:name data)]
      (p/let [title (get-title data-name (:path-params route))]
        (set! (. js/document.body.dataset -page) title)))))

(defn update-page-title-and-label!
  [route]
  (update-page-title! route)
  (update-page-label! route))

(defn jump-to-anchor!
  [anchor-text]
  (when anchor-text
    (js/setTimeout #(ui-handler/highlight-element! anchor-text) 200)
    (when-let [f (:editor/virtualized-scroll-fn @state/state)]
      (f))))

(defn set-route-match!
  [route]
  (state/swap-state! assoc :route-match route)
  (update-page-title! route)
  (update-page-label! route)
  (when-let [anchor (get-in route [:query-params :anchor])]
    (jump-to-anchor! anchor)))

(defn restore-scroll-pos
  []
  (js/setTimeout #(util/scroll-to (util/app-scroll-container-node)
                                  (state/get-saved-scroll-position)
                                  false)
                 100))

(defn go-to-search!
  ([search-mode] (go-to-search! search-mode nil))
  ([search-mode args]
   (search-handler/clear-search! false)
   (when search-mode
     (state/set-search-mode! search-mode args))
   (state/pub-event! [:go/search])))

(defn sidebar-journals!
  []
  (when-let [repo (state/get-current-repo)]
    (p/let [page (db-async/<get-journal-page-by-day repo (date/today-journal-day))]
      (when-let [page-id (:db/id page)]
        (state/sidebar-add-block! repo page-id :page)))))

(defn go-to-journals!
  []
  (let [route (if (state/custom-home-page?)
                :all-journals
                :home)]
    (redirect! {:to route}))
  (util/scroll-to-top))
