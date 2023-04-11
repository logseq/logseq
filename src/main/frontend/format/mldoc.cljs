(ns frontend.format.mldoc
  "Contains any mldoc code needed by app but not graph-parser. Implements format
  protocol for org and and markdown formats"
  (:require [clojure.string :as string]
            [frontend.format.protocol :as protocol]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            ["mldoc" :as mldoc :refer [Mldoc]]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.util :as gp-util]
            [clojure.walk :as walk]))

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
  [config content]
  (try
    (if (string/blank? content)
      {}
      (let [[headers blocks] (-> content (parse-opml) (gp-util/json->clj))]
        [headers (gp-mldoc/collect-page-properties blocks config)]))
    (catch :default e
      (log/error :edn/convert-failed e)
      [])))

(defn ->edn
  "Alias to gp-mldoc/->edn but could serve as a wrapper e.g. handle
  gp-mldoc/default-config"
  [content config]
  (gp-mldoc/->edn content config))

(defrecord MldocMode []
  protocol/Format
  (toEdn [_this content config]
    (->edn content config))
  (toHtml [_this content config references]
    (export "html" content config references))
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

(defn extract-first-query-from-ast [ast]
  (let [*result (atom nil)]
    (walk/postwalk
     (fn [f]
       (if (and (vector? f)
                (= "Custom" (first f))
                (= "query" (second f)))
         (reset! *result (last f))
         f))
     ast)
    @*result))
