(ns frontend.handler.route
  (:require [frontend.util :as util]
            [reitit.frontend.easy :as rfe]
            [reitit.frontend.history :as rfh]
            [frontend.state :as state]
            [goog.dom :as gdom]
            [frontend.handler.ui :as ui-handler]
            [frontend.db :as db]
            [medley.core :as medley]
            [frontend.text :as text]))

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
        (if-let [block (db/entity [:block/uuid (medley/uuid name)])]
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
    (ui-handler/scroll-and-highlight! nil)))

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
