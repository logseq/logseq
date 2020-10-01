(ns frontend.publishing.html
  (:require-macros [hiccups.core :as hiccups :refer [html]])
  (:require [frontend.config :as config]
            [frontend.state :as state]))

(defn publishing-html
  [transit-db app-state]
  (let [{:keys [icon name alias title description url]} (:project (state/get-config))
        icon (or icon "static/img/logo.png")
        project (or alias name)
        content (html
                  [:head
                   [:meta {:charset "utf-8"}]
                   [:meta
                    {:content
                     "minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no",
                     :name "viewport"}]
                   [:link {:type "text/css", :href "static/style.css", :rel "stylesheet"}]
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
                   [:script {:src "static/js/mldoc.min.js"}]
                   [:script {:src "static/js/publishing.js"}]
                   ;; TODO: should make this configurable
                   [:script {:src "static/js/highlight.min.js"}]
                   [:script {:type "text/javascript"}
                    "// Single Page Apps for GitHub Pages
      // https://github.com/rafgraph/spa-github-pages
      // Copyright (c) 2016 Rafael Pedicini, licensed under the MIT License
      // ----------------------------------------------------------------------
      // This script checks to see if a redirect is present in the query string
      // and converts it back into the correct url and adds it to the
      // browser's history using window.history.replaceState(...),
      // which won't cause the browser to attempt to load the new url.
      // When the single page app is loaded further down in this file,
      // the correct url will be waiting in the browser's history for
      // the single page app to route accordingly.
      (function(l) {
        if (l.search) {
          var q = {};
          l.search.slice(1).split('&').forEach(function(v) {
            var a = v.split('=');
            q[a[0]] = a.slice(1).join('=').replace(/~and~/g, '&');
          });
          if (q.p !== undefined) {
            window.history.replaceState(null, null,
              l.pathname.slice(0, -1) + (q.p || '') +
              (q.q ? ('?' + q.q) : '') +
              l.hash
            );
          }
        }
      }(window.location))"]])]
    (str "<!DOCTYPE html>\n" content)))
