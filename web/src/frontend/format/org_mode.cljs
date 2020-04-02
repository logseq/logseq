(ns frontend.format.org-mode
  (:require ["mldoc_org" :as org]
            [frontend.format.protocol :as protocol]))

(defrecord OrgMode [content]
  protocol/Format
  (toHtml [this]
    (.parseHtml (.-MldocOrg org)
                content
                (js/JSON.stringify
                 #js {:toc false
                      :heading_number false}))))

(defn parse-json
  [content]
  (.parseJson (.-MldocOrg org) content))

(defn inline-list->html
  [json]
  (.inlineListToHtmlStr (.-MldocOrg org) json))
