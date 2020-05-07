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
        :keep_line_break true}))

(defn loaded? []
  js/window.MldocOrg)

(defn parse-json
  ([content]
   (parse-json content default-config))
  ([content config]
   (when (loaded?)
     (.parseJson js/window.MldocOrg content (or config default-config)))))

(defn ->edn
  ([content]
   (->edn content default-config))
  ([content config]
   (if (string/blank? content)
     {}
     (-> content
         (parse-json (or config default-config))
         (util/json->clj)))))

(defrecord OrgMode []
  protocol/Format
  (toEdn [this content config]
    (->edn content config))
  (toHtml [this content config]
    (.parseHtml js/window.MldocOrg content config))
  (loaded? [this]
    (some? (loaded?)))
  (lazyLoad [this ok-handler]
    (loader/load
     (config/asset-uri "/static/js/mldoc_org.min.js")
     ok-handler)))
