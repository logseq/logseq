(ns frontend.format.org-mode
  (:require [frontend.format.protocol :as protocol]
            [frontend.util :as util]
            [frontend.config :as config]
            [clojure.string :as string]
            [frontend.loader :as loader]))

(def default-config
  (js/JSON.stringify
   #js {:toc false
        :heading_number false
        :keep_line_break false}))

(def config-with-line-break
  (js/JSON.stringify
   #js {:toc false
        :heading_number false
        :keep_line_break true}))

(defn loaded? []
  js/window.MldocOrg)

(defrecord OrgMode []
  protocol/Format
  (toHtml [this content config]
    (when (loaded?)
      (.parseHtml js/window.MldocOrg content config)))
  (loaded? [this]
    (some? (loaded?)))
  (lazyLoad [this ok-handler error-handler]
    (loader/load
     (config/asset-uri "/static/js/mldoc_org.min.js")
     ok-handler
     error-handler)))

(defn parse-json
  ([content]
   (parse-json content default-config))
  ([content config]
   (when (loaded?)
     (.parseJson js/window.MldocOrg content config))))

(defn ->clj
  [content]
  (if (string/blank? content)
    {}
    (-> content
        (parse-json)
        (util/json->clj))))

(defn inline-list->html
  [json]
  (when (loaded?)
    (.inlineListToHtmlStr js/window.MldocOrg json)))

(defn json->html
  [json]
  (when (loaded?)
    (.jsonToHtmlStr js/window.MldocOrg json default-config)))
