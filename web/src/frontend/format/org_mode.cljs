(ns frontend.format.org-mode
  (:require ["mldoc_org" :as org]
            [frontend.format.protocol :as protocol]))

(def config
  (js/JSON.stringify
   #js {:toc false
        :heading_number false}))

(def Org (.-MldocOrg org))

(defrecord OrgMode [content]
  protocol/Format
  (toHtml [this]
    (.parseHtml Org content config)))

(defn parse-json
  [content]
  (.parseJson Org content))

(defn inline-list->html
  [json]
  (.inlineListToHtmlStr Org json))

(defn json->html
  [json]
  (.jsonToHtmlStr Org json config))
