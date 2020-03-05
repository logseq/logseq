(ns backend.views.home
  (:require [hiccup.page :as html]))

(defn home
  []
  (html/html5
   [:head
    [:meta {:charset "utf-8"}]
    [:meta
     {:content
      "minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no",
      :name "viewport"}]
    [:link {:type "text/css", :href "css/tailwind.min.css", :rel "stylesheet"}]
    [:link {:type "text/css", :href "css/style.css", :rel "stylesheet"}]
    [:link
     {:href
      "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap",
      :rel "stylesheet"}]
    [:link {:href "css/highlight.css", :rel "stylesheet"}]
    [:title "Gitnotes"]]
   [:body
    [:div#root]
    [:script {:src "https://unpkg.com/@isomorphic-git/lightning-fs@3.4.1/dist/lightning-fs.min.js"}]
    [:script {:src "https://unpkg.com/isomorphic-git@0.78.5/dist/bundle.umd.min.js"}]
    [:script
     "window.fs = new LightningFS('gitnotes');git.plugins.set('fs', window.fs);window.pfs = window.fs.promises;"]
    [:script {:src "https://cdn.jsdelivr.net/gh/alpinejs/alpine@v2.0.1/dist/alpine.js" :defer true}]
    [:script {:src "/js/main.js"}]
    [:script {:src "/js/highlight.pack.js"}]]))
