(ns frontend.handler.route
  (:require [clojure.string :as string]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.search :as search-handler]
            [frontend.state :as state]
            [frontend.text :as text]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [medley.core :as medley]
            [reitit.frontend.easy :as rfe]))

(defn redirect!
  "If `push` is truthy, previous page will be left in history."
  [{:keys [to path-params query-params push]
    :or {push true}}]
  (let [route-fn (if push rfe/push-state rfe/replace-state)]
    (state/save-scroll-position! (util/scroll-top))
    (route-fn to path-params query-params)))

(defn redirect-to-home!
  []
  (redirect! {:to :home}))

(defn get-title
  [name path-params]
  (case name
    :home
    "Logseq"
    :repos
    "Repos"
    :repo-add
    "Add another repo"
    :graph
    "Graph"
    :all-files
    "All files"
    :all-pages
    "All pages"
    :all-journals
    "All journals"
    :file
    (str "File " (:path path-params))
    :new-page
    "Create a new page"
    :page
    (let [name (:name path-params)
          block? (util/uuid-string? name)]
      (if block?
        (if-let [block (db/entity [:block/uuid (medley/uuid name)])]
          (let [content (text/remove-level-spaces (:block/content block)
                                                  (:block/format block))]
            (if (> (count content) 48)
              (str (subs content 0 48) "...")
              content))
          "Page no longer exists!!")
        (let [page (db/pull [:block/name (string/lower-case name)])]
          (or (:block/original-name page)
              (:block/name page)
              "Logseq"))))
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
        title (get-title (:name data) path-params)]
    (util/set-title! title)))

(defn update-page-label!
  [route]
  (let [{:keys [data]} route]
    (set! (. js/document.body.dataset -page) (name (:name data)))))

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
      (util/scroll-to (util/app-scroll-container-node)
                      (state/get-saved-scroll-position)
                      false))
    (plugin-handler/hook-plugin-app :route-changed (select-keys route [:template :path :parameters]))))

(defn go-to-search!
  [search-mode]
  (search-handler/clear-search! false)
  (when search-mode
    (state/set-search-mode! search-mode))
  (state/pub-event! [:go/search]))

(defn go-to-journals!
  []
  (state/set-journals-length! 2)
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
          (redirect! {:to :page
                      :path-params {:name page}})))

      nil)))
