(ns logseq.publishing.html
  "This frontend only ns builds the publishing html including doing all the
necessary db filtering"
  (:require [clojure.string :as string]
            [goog.string :as gstring]
            [goog.string.format]
            [datascript.transit :as dt]
            [logseq.publishing.db :as db]))

;; Copied from hiccup but tweaked for publish usage
;; Any changes here should also be made in frontend.publishing/unescape-html
(defn- escape-html
  "Change special characters into HTML character entities."
  [text]
  (-> text
      (string/replace "&"  "logseq____&amp;")
      (string/replace "<"  "logseq____&lt;")
      (string/replace ">"  "logseq____&gt;")
      (string/replace "\"" "logseq____&quot;")
      (string/replace "'" "logseq____&apos;")))

;; Copied from https://github.com/babashka/babashka/blob/8c1077af00c818ade9e646dfe1297bbe24b17f4d/examples/notes.clj#L21
(defn- html [v]
  (cond (vector? v)
    (let [tag (first v)
          attrs (second v)
          attrs (when (map? attrs) attrs)
          elts (if attrs (nnext v) (next v))
          tag-name (name tag)]
      (gstring/format "<%s%s>%s</%s>\n" tag-name (html attrs) (html elts) tag-name))
    (map? v)
    (string/join ""
                 (keep (fn [[k v]]
                         ;; Skip nil values because some html tags haven't been
                         ;; given values through html-options
                         (when (some? v)
                           (gstring/format " %s=\"%s\"" (name k) v))) v))
    (seq? v)
    (string/join " " (map html v))
    :else (str v)))

(defn- ^:large-vars/html publishing-html
  [transit-db app-state options]
  (let [{:keys [icon name alias title description url]} options
        icon (or icon "static/img/logo.png")
        project (or alias name)]
    (str "<!DOCTYPE html>\n"
         (html
          (list
           [:head
            [:meta {:charset "utf-8"}]
            [:meta
             {:content
              "minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no",
              :name "viewport"}]
            [:link {:type "text/css", :href "static/css/tabler-icons.min.css", :rel "stylesheet"}]
            [:link {:type "text/css", :href "static/css/style.css", :rel "stylesheet"}]
            [:link {:type "text/css", :href "static/css/custom.css", :rel "stylesheet"}]
            [:link {:type "text/css", :href "static/css/export.css", :rel "stylesheet"}]
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
            [:div {:id "root"}]
            [:script (gstring/format "window.logseq_db=%s" (js/JSON.stringify (escape-html transit-db)))]
            [:script (str "window.logseq_state=" (js/JSON.stringify (pr-str app-state)))]
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
      }(window.location))"]
            ;; TODO: should make this configurable
            [:script {:src "static/js/main.js"}]
            [:script {:src "static/js/interact.min.js"}]
            [:script {:src "static/js/highlight.min.js"}]
            [:script {:src "static/js/katex.min.js"}]
            [:script {:src "static/js/html2canvas.min.js"}]
            [:script {:src "static/js/code-editor.js"}]])))))

(defn build-html
  "Given the graph's db, filters the db using the given options and returns the
generated index.html string and assets used by the html"
  [db* {:keys [app-state repo-config html-options]}]
  (let [[db asset-filenames'] (if (:publishing/all-pages-public? repo-config)
                                (db/clean-export! db*)
                                (db/filter-only-public-pages-and-blocks db*))
        asset-filenames (remove nil? asset-filenames')
        db-str (dt/write-transit-str db)
        state (assoc app-state
                     :config {"local" repo-config})
        raw-html-str (publishing-html db-str state html-options)]
    {:html raw-html-str
     :asset-filenames asset-filenames}))
