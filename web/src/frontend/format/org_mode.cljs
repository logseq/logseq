(ns frontend.format.org-mode
  (:require ["mldoc_org" :as org]
            [frontend.format.protocol :as protocol]
            [frontend.util :as util]
            [clojure.string :as string]))

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

(def Org (.-MldocOrg org))

(defrecord OrgMode [content]
  protocol/Format
  (toHtml [this]
    (.parseHtml Org content default-config))
  (toHtml [this config]
    (.parseHtml Org content config)))

(defn parse-json
  ([content]
   (parse-json content default-config))
  ([content config]
   (.parseJson Org content config)))

(defn ->clj
  [content]
  (if (string/blank? content)
    {}
    (-> content
       (parse-json)
       (util/json->clj))))

(defn inline-list->html
  [json]
  (.inlineListToHtmlStr Org json))

(defn json->html
  [json]
  (.jsonToHtmlStr Org json default-config))
