(ns frontend.format.org-mode
  (:require ["mldoc_org" :as org]
            [frontend.format.protocol :as protocol]))

(defrecord OrgMode [content]
  protocol/Format
  (toHtml [this]
    (.parseHtml (.-MldocOrg org) content)))

(defn parse-json
  [content]
  (.parseJson (.-MldocOrg org) content))

(defn json->ast
  [json]
  (.jsonToAst (.-MldocOrg org) json))

(defn json->html
  [json]
  (.jsonToHtmlStr (.-MldocOrg org) json))

(defn inline-list->html
  [json]
  (.inlineListToHtmlStr (.-MldocOrg org) json))

(comment
  (let [text "*** TODO /*great*/ [[https://personal.utdallas.edu/~gupta/courses/acl/papers/datalog-paper.pdf][What You Always Wanted to Know About Datalog]] :datalog:"
        blocks-json (parse-json text)]
    (json->html blocks-json)))
