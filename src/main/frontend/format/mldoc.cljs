(ns frontend.format.mldoc
  "Contains any mldoc code needed by app but not graph-parser. Implements format
  protocol for org and and markdown formats"
  (:require ["mldoc" :as mldoc :refer [Mldoc]]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [frontend.format.protocol :as protocol]
            [frontend.state :as state]
            [goog.object :as gobj]
            [logseq.graph-parser.mldoc :as gp-mldoc]))

(defonce anchorLink (gobj/get Mldoc "anchorLink"))
(defonce parseAndExportMarkdown (gobj/get Mldoc "parseAndExportMarkdown"))
(defonce parseAndExportOPML (gobj/get Mldoc "parseAndExportOPML"))
(defonce export (gobj/get Mldoc "export"))

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

(def block-with-title? gp-mldoc/block-with-title?)

(defn get-default-config
  [format]
  (gp-mldoc/get-default-config (state/get-current-repo) format))

(defn ->edn
  [content format]
  (gp-mldoc/->edn (state/get-current-repo) content format))

(defrecord MldocMode []
  protocol/Format
  (toEdn [_this content config]
    (gp-mldoc/->edn content config))
  (toHtml [_this content config references]
    (export "html" content config references))
  (exportMarkdown [_this content config references]
    (parse-export-markdown content config references))
  (exportOPML [_this content config title references]
    (parse-export-opml content config title references)))

(defn plain->text
  [plains]
  (string/join (map last plains)))

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
