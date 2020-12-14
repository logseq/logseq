(ns frontend.handler.route
  (:require [frontend.util :as util]
            [reitit.frontend.easy :as rfe]
            [reitit.frontend.history :as rfh]
            [frontend.state :as state]
            [goog.dom :as gdom]
            [frontend.handler.ui :as ui-handler]

            [frontend.date :as date]
            [clojure.string :as string]
            [medley.core :as medley]
            [frontend.text :as text]
            [frontend.db.simple :as db-simple]
            [frontend.db.utils :as db-utils]))

(defn redirect!
  "If `push` is truthy, previous page will be left in history."
  [{:keys [to path-params query-params push]
    :or {push true}}]
  (if push
    (rfe/push-state to path-params query-params)
    (rfe/replace-state to path-params query-params)))

(defn redirect-to-home!
  []
  (redirect! {:to :home}))

(defn redirect-with-fragment!
  [path]
  (.pushState js/window.history nil "" path)
  (rfh/-on-navigate @rfe/history path))

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
    (str "File " (util/url-decode (:path path-params)))
    :new-page
    "Create a new page"
    :page
    (let [name (:name path-params)
          block? (util/uuid-string? name)]
      (if block?
        (if-let [block (db-utils/entity [:block/uuid (medley/uuid name)])]
          (let [content (text/remove-level-spaces (:block/content block)
                                                  (:block/format block))]
            (if (> (count content) 48)
              (str (subs content 0 48) "...")
              content))
          "Page no longer exists!!")
        (util/capitalize-all (util/url-decode name))))
    :tag
    (str "#" (util/url-decode (:name path-params)))
    :diff
    "Git diff"
    :draw
    "Draw"
    :settings
    "Settings"
    :import
    "Import data into Logseq"
    "Logseq"))

(defn set-route-match!
  [route]
  (swap! state/state assoc :route-match route)
  (let [{:keys [data path-params]} route
        title (get-title (:name data) path-params)]
    (util/set-title! title)
    (if-let [fragment (util/get-fragment)]
      (ui-handler/highlight-element! fragment)
      (util/scroll-to-top))))

(defn go-to-search!
  []
  (when-let [element (gdom/getElement "search_field")]
    (.focus element)))

(defn go-to-journals!
  []
  (state/set-journals-length! 1)
  (let [route (if (state/custom-home-page?)
                :all-journals
                :home)]
    (redirect! {:to route}))
  (util/scroll-to-top))

(defn- redirect-to-file!
  [page]
  (when-let [path (-> (db-simple/get-page-file (string/lower-case page))
                      :db/id
                      (db-utils/entity)
                      :file/path)]
    (redirect! {:to :file
                :path-params {:path path}})))

(defn toggle-between-page-and-file!
  []
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
        (when-let [page (db-simple/get-file-page path)]
          (redirect! {:to :page
                      :path-params {:name page}})))

      nil)))
