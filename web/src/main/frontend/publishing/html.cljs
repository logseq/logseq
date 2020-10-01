(ns frontend.publishing.html
  (:require-macros [hiccups.core :as hiccups :refer [html]])
  (:require [frontend.config :as config]
            [frontend.state :as state]))

(defn publishing-html
  [transit-db app-state]
  (let [{:keys [icon name alias title description url]} (:project (state/get-config))
        icon (or icon (config/asset-uri "/static/img/logo.png"))
        project (or alias name)
        content (html
                  [:head
                   [:meta {:charset "utf-8"}]
                   [:meta
                    {:content
                     "minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no",
                     :name "viewport"}]
                   [:link {:type "text/css", :href (config/asset-uri "/static/css/style.css"), :rel "stylesheet"}]
                   [:link
                    {:href icon
                     :type "image/png",
                     :rel "shortcut icon"}]
                   [:link
                    {:href icon
                     :sizes "192x192",
                     :rel "shortcut icon"}]
                   [:link
                    {:href icon
                     :rel "apple-touch-icon"}]

                   [:meta {:name "apple-mobile-web-app-title" :content project}]
                   [:meta {:name "apple-mobile-web-app-capable" :content "yes"}]
                   [:meta {:name "apple-touch-fullscreen" :content "yes"}]
                   [:meta {:name "apple-mobile-web-app-status-bar-style" :content "black-translucent"}]
                   [:meta {:name "mobile-web-app-capable" :content "yes"}]

                   [:meta {:content title, :property "og:title"}]
                   [:meta {:content "site", :property "og:type"}]
                   (when url [:meta {:content url, :property "og:url"}])
                   [:meta
                    {:content icon
                     :property "og:image"}]
                   [:meta
                    {:content description
                     :property "og:description"}]
                   [:title title]
                   [:meta {:content project, :property "og:site_name"}]
                   [:meta
                    {:description description}]]
                  [:body
                   [:div#root]
                   [:script (str "window.logseq_db=" transit-db)]
                   [:script (str "window.logseq_state=" (js/JSON.stringify app-state))]
                   [:script {:src (config/asset-uri "/static/js/mldoc.min.js")}]
                   [:script {:src (config/asset-uri "/static/js/publishing/main.js")}]
                   ;; TODO: should make this configurable
                   [:script {:src (config/asset-uri "/static/js/highlight.min.js")}]])]
    (str "<!DOCTYPE html>\n" content)))
