(ns frontend.handler.route
  "Provides fns used for routing throughout the app"
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.model :as model]
            [frontend.handler.recent :as recent-handler]
            [frontend.handler.search :as search-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.extensions.pdf.utils :as pdf-utils]
            [logseq.graph-parser.text :as text]
            [reitit.frontend.easy :as rfe]
            [frontend.context.i18n :refer [t]]))

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
  (redirect! {:to :repos}))

(defn redirect-to-whiteboard-dashboard!
  []
  (redirect! {:to :whiteboards}))

;; Named block links only works on web (and publishing)
(if util/web-platform?
  (defn- default-page-route [page-name-or-block-uuid]
    ;; Only query if in a block context
    (let [block (when (uuid? page-name-or-block-uuid)
                  (model/get-block-by-uuid page-name-or-block-uuid))]
      (if (get-in block [:block/properties :heading])
        {:to :page-block
         :path-params {:name (get-in block [:block/page :block/name])
                       :block-route-name (model/heading-content->route-name (:block/content block))}}
        {:to :page
         :path-params {:name (if (string? page-name-or-block-uuid)
                               (util/page-name-sanity-lc page-name-or-block-uuid)
                               (str page-name-or-block-uuid))}})))

  (defn- default-page-route [page-name]
    {:to :page
     :path-params {:name (str page-name)}}))

(defn redirect-to-page!
  "Must ensure `page-name` is dereferenced (not an alias), or it will create a
  wrong new page with that name (#3511). page-name can be a block name or uuid"
  ([page-name]
   (redirect-to-page! page-name {}))
  ([page-name {:keys [anchor push click-from-recent?]
               :or {click-from-recent? false}}]
   (when (or (uuid? page-name) (seq page-name))
     (recent-handler/add-page-to-recent! (state/get-current-repo) page-name
                                         click-from-recent?)
     (let [m (cond->
               (default-page-route page-name)

               anchor
               (assoc :query-params {:anchor anchor})

              (boolean? push)
              (assoc :push push))]
       (redirect! m)))))

(defn redirect-to-whiteboard!
  ([name]
   (redirect-to-whiteboard! name nil))
  ([name {:keys [block-id new-whiteboard? click-from-recent?]}]
   ;; Always skip onboarding when loading an existing whiteboard
   (when-not new-whiteboard? (state/set-onboarding-whiteboard! true))
   (recent-handler/add-page-to-recent! (state/get-current-repo) name click-from-recent?)
   (if (= name (state/get-current-whiteboard))
     (state/focus-whiteboard-shape block-id)
     (redirect! {:to :whiteboard
                 :path-params {:name (str name)}
                 :query-params (merge {:block-id block-id})}))))

(defn get-title
  [name path-params]
  (case name
    :home
    "Logseq"
    :whiteboards
    (t :whiteboards)
    :repos
    "Repos"
    :repo-add
    "Add another repo"
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
          block? (util/uuid-string? name)]
      (if block?
        (if-let [block (db/entity [:block/uuid (uuid name)])]
          (let [content (text/remove-level-spaces (:block/content block)
                                                  (:block/format block) (config/get-block-pattern (:block/format block)))]
            (if (> (count content) 48)
              (str (subs content 0 48) "...")
              content))
          "Page no longer exists!!")
        (let [page (db/pull [:block/name (util/page-name-sanity-lc name)])]
          (or (util/get-page-original-name page)
              "Logseq"))))
    :whiteboard
    (let [name (:name path-params)
          block? (util/uuid-string? name)]
      (str
       (if block?
         (t :untitled)
         (let [page (db/pull [:block/name (util/page-name-sanity-lc name)])]
           (or (util/get-page-original-name page)
               "Logseq"))) " - " (t :whiteboard)))
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
      (set! (. js/document.body.dataset -page) (name data-name)))))

(defn jump-to-anchor!
  [anchor-text]
  (when anchor-text
    (js/setTimeout #(ui-handler/highlight-element! anchor-text) 200)))

(defn set-route-match!
  [route]
  (let [route route]
    (swap! state/state assoc :route-match route)
    (update-page-title! route)
    (update-page-label! route)
    (if-let [anchor (get-in route [:query-params :anchor])]
      (jump-to-anchor! anchor)
      (js/setTimeout #(util/scroll-to (util/app-scroll-container-node)
                                      (state/get-saved-scroll-position)
                                      false)
                     100))))

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
  (state/set-journals-length! 3)
  (let [route (if (state/custom-home-page?)
                :all-journals
                :home)]
    (redirect! {:to route}))
  (util/scroll-to-top))

(defn- redirect-to-file!
  [page]
  (when-let [path (-> (db/get-page-file (string/lower-case page))
                      :db/id
                      (db/entity)
                      :file/path)]
    (redirect! {:to :file
                :path-params {:path path}})))

(defn toggle-between-page-and-file!
  [_e]
  (let [current-route (state/get-current-route)]
    (case current-route
      :home
      (redirect-to-file! (date/today))

      :all-journals
      (redirect-to-file! (date/today))

      :page
      (when-let [page-name (get-in (state/get-route-match) [:path-params :name])]
        (redirect-to-file! page-name))

      :file
      (when-let [path (get-in (state/get-route-match) [:path-params :path])]
        (when-let [page (db/get-file-page path)]
          (redirect-to-page! page)))

      nil)))
