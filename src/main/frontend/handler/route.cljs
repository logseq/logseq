(ns frontend.handler.route
  "Provides fns used for routing throughout the app"
  (:require [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.model :as model]
            [frontend.handler.recent :as recent-handler]
            [frontend.handler.search :as search-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.property.util :as pu]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.extensions.pdf.utils :as pdf-utils]
            [logseq.graph-parser.text :as text]
            [reitit.frontend.easy :as rfe]
            [frontend.context.i18n :refer [t]]
            [clojure.string :as string]
            [logseq.common.util :as common-util]))

(defn redirect!
  "If `push` is truthy, previous page will be left in history."
  [{:keys [to path-params query-params push]
    :or {push true}}]
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

(defn redirect-to-whiteboard-dashboard!
  []
  (redirect! {:to :whiteboards}))

;; Named block links only works on web (and publishing)
(if util/web-platform?
  (defn- default-page-route [page-name-or-block-uuid]
    ;; Only query if in a block context
    (let [block (when (uuid? page-name-or-block-uuid)
                  (model/get-block-by-uuid page-name-or-block-uuid))
          properties (:block/properties block)]
      (if (pu/lookup properties :logseq.property/heading)
        {:to :page-block
         :path-params {:name (get-in block [:block/page :block/name])
                       :block-route-name (model/heading-content->route-name (:block/title block))}}
        {:to :page
         :path-params {:name (if (string? page-name-or-block-uuid)
                               (util/page-name-sanity-lc page-name-or-block-uuid)
                               (str page-name-or-block-uuid))}})))

  (defn- default-page-route [page-name]
    {:to :page
     :path-params {:name (str page-name)}}))

(defn redirect-to-page!
  "`page-name` can be a block uuid or name, prefer to use uuid than name when possible"
  ([page-name]
   (redirect-to-page! page-name {}))
  ([page-name {:keys [anchor push click-from-recent? block-id new-whiteboard?]
               :or {click-from-recent? false}
               :as opts}]
   (when (or (uuid? page-name)
             (and (string? page-name) (not (string/blank? page-name))))
     (let [page (db/get-page page-name)
           whiteboard? (db/whiteboard-page? page)]
       (if-let [source (db/get-alias-source-page (state/get-current-repo) (:db/id page))]
         (redirect-to-page! (:block/uuid source) opts)
         (do
           ;; Always skip onboarding when loading an existing whiteboard
           (when-not new-whiteboard? (state/set-onboarding-whiteboard! true))
           (when-let [db-id (:db/id page)]
             (recent-handler/add-page-to-recent! db-id click-from-recent?))
           (if (and whiteboard?  (= (str page-name) (state/get-current-page)) block-id)
             (state/focus-whiteboard-shape block-id)
             (let [m (cond->
                      (default-page-route (str page-name))

                       block-id
                       (assoc :query-params (if whiteboard?
                                              {:block-id block-id}
                                              {:anchor (str "ls-block-" block-id)}))

                       anchor
                       (assoc :query-params {:anchor anchor})

                       (boolean? push)
                       (assoc :push push))]
               (redirect! m)))))))))

(defn get-title
  [name path-params]
  (case name
    :home
    "Logseq"
    :whiteboards
    (t :whiteboards)
    :graphs
    "Graphs"
    :graph
    (t :graph)
    :all-files
    (t :all-files)
    :all-pages
    (t :all-pages)
    :all-journals
    (t :all-journals)
    :file
    (str "File " (:path path-params))
    :new-page
    "Create a new page"
    :page
    (let [name (:name path-params)
          page (db/get-page name)
          page (and (db/page? page) page)
          block? (util/uuid-string? name)
          block-title (when (and block? (not page))
                        (when-let [block (db/entity [:block/uuid (uuid name)])]
                          (let [content (text/remove-level-spaces (:block/title block)
                                                                  (:block/format block) (config/get-block-pattern (:block/format block)))]
                            (if (> (count content) 48)
                              (str (subs content 0 48) "...")
                              content))))
          block-name (:block/title page)
          block-name' (when block-name
                        (if (common-util/uuid-string? block-name)
                          "Untitled"
                          block-name))]
      (or block-name'
          block-title
          "Logseq"))
    :tag
    (str "#"  (:name path-params))
    :diff
    "Git diff"
    :draw
    "Draw"
    :settings
    "Settings"
    :import
    "Import data into Logseq"
    "Logseq"))

(defn update-page-title!
  [route]
  (let [{:keys [data path-params]} route
        title (get-title (:name data) path-params)
        hls? (pdf-utils/hls-file? title)]
    (util/set-title! (if hls? (pdf-utils/fix-local-asset-pagename title) title))))

(defn update-page-label!
  [route]
  (let [{:keys [data]} route]
    (when-let [data-name (:name data)]
      (set! (. js/document.body.dataset -page) (get-title data-name (:path-params route))))))

(defn update-page-title-and-label!
  [route]
  (update-page-title! route)
  (update-page-label! route))

(defn jump-to-anchor!
  [anchor-text]
  (when anchor-text
    (js/setTimeout #(ui-handler/highlight-element! anchor-text) 200)))

(defn set-route-match!
  [route]
  (swap! state/state assoc :route-match route)
  (update-page-title! route)
  (update-page-label! route)
  (if-let [anchor (get-in route [:query-params :anchor])]
    (jump-to-anchor! anchor)
    (js/setTimeout #(util/scroll-to (util/app-scroll-container-node)
                                    (state/get-saved-scroll-position)
                                    false)
                   100)))

(defn go-to-search!
  [search-mode]
  (search-handler/clear-search! false)
  (when search-mode
    (state/set-search-mode! search-mode))
  (state/pub-event! [:go/search]))

(defn sidebar-journals!
  []
  (state/sidebar-add-block!
   (state/get-current-repo)
   (:db/id (db/get-page (date/today)))
   :page))

(defn go-to-journals!
  []
  (let [route (if (state/custom-home-page?)
                :all-journals
                :home)]
    (redirect! {:to route}))
  (util/scroll-to-top))
