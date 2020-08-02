(ns frontend.handler.route
  (:require [frontend.util :as util]
            [reitit.frontend.easy :as rfe]
            [reitit.frontend.history :as rfh]
            [frontend.state :as state]
            [goog.dom :as gdom]
            [frontend.handler.ui :as ui-handler]))

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
    :file
    (str "File " (util/url-decode (:path path-params)))
    :new-page
    "Create a new page"
    :page
    (util/capitalize-all (util/url-decode (:name path-params)))
    :tag
    (str "#" (util/url-decode (:name path-params)))
    :diff
    "Git diff"
    :draw
    "Draw"
    :settings
    "Settings"
    :else
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
  (redirect! {:to :home})
  (util/scroll-to-top))
