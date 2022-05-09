(ns frontend.format.mldoc
  (:require [clojure.string :as string]
            [frontend.format.protocol :as protocol]
            [frontend.state :as state]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            ["mldoc" :as mldoc :refer [Mldoc]]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.util :as gp-util]))

(defonce anchorLink (gobj/get Mldoc "anchorLink"))
(defonce parseOPML (gobj/get Mldoc "parseOPML"))
(defonce parseAndExportMarkdown (gobj/get Mldoc "parseAndExportMarkdown"))
(defonce parseAndExportOPML (gobj/get Mldoc "parseAndExportOPML"))
(defonce export (gobj/get Mldoc "export"))

(defn parse-opml
  [content]
  (parseOPML content))

(defn parse-export-markdown
  [content config references]
  (parseAndExportMarkdown content
                          config
                          (or references gp-mldoc/default-references)))

(defn parse-export-opml
  [content config title references]
  (parseAndExportOPML content
                      config
                      title
                      (or references gp-mldoc/default-references)))

(defn block-with-title?
  [type]
  (contains? #{"Paragraph"
               "Raw_Html"
               "Hiccup"
               "Heading"} type))

(defn opml->edn
  [content]
  (try
    (if (string/blank? content)
      {}
      (let [[headers blocks] (-> content (parse-opml) (gp-util/json->clj))]
        [headers (gp-mldoc/collect-page-properties blocks gp-mldoc/parse-property (state/get-config))]))
    (catch js/Error e
      (log/error :edn/convert-failed e)
      [])))

(defn ->edn
  "Wrapper around gp-mldoc/->edn which provides config state"
  [content config]
  (gp-mldoc/->edn content config (state/get-config)))

(defrecord MldocMode []
  protocol/Format
  (toEdn [_this content config]
    (->edn content config))
  (toHtml [_this content config references]
    (export "html" content config references))
  (loaded? [_this]
    true)
  (lazyLoad [_this _ok-handler]
    true)
  (exportMarkdown [_this content config references]
    (parse-export-markdown content config references))
  (exportOPML [_this content config title references]
    (parse-export-opml content config title references)))

(defn plain->text
  [plains]
  (string/join (map last plains)))

(defn properties?
  [ast]
  (contains? #{"Properties" "Property_Drawer"} (ffirst ast)))

(defn typ-drawer?
  [ast typ]
  (and (contains? #{"Drawer"} (ffirst ast))
       (= typ (second (first ast)))))
