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
            [logseq.graph-parser.text :as text]
            [logseq.graph-parser.block :as gp-block]
            [clojure.walk :as walk]
            [frontend.util :as util]))

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

(defn extract-plain
  "Extract plain elements including page refs"
  [content]
  (let [ast (->edn content (gp-mldoc/default-config :markdown))]
    (let [*result (atom [])]
      (walk/prewalk
       (fn [f]
         (cond
           ;; tag
           (and (vector? f)
                (= "Tag" (first f)))
           nil

           ;; nested page ref
           (and (vector? f)
                (= "Nested_link" (first f)))
           (swap! *result conj (:content (second f)))

           ;; page ref
           (and (vector? f)
                (= "Link" (first f))
                (map? (second f))
                (vector? (:url (second f)))
                (= "Page_ref" (first (:url (second f)))))
           (swap! *result conj
                  (:full_text (second f)))

           ;; plain
           (and (vector? f)
                (= "Plain" (first f)))
           (swap! *result conj (second f))

           :else
           f))
       ast)
      (-> (string/trim (apply str @*result))
          text/page-ref-un-brackets!))))

(defn extract-tags
  "Extract tags from content"
  [content]
  (let [ast (->edn content (gp-mldoc/default-config :markdown))
        *result (atom [])]
    (walk/prewalk
     (fn [f]
       (cond
           ;; tag
         (and (vector? f)
              (= "Tag" (first f)))
         (let [tag (-> (gp-block/get-tag f)
                       text/page-ref-un-brackets!)]
           (swap! *result conj tag)
           nil)

         :else
         f))
     ast)
    (->> @*result
         (remove string/blank?)
         (distinct))))

(defn content-without-tags
  "Remove tags from content"
  [content tags]
  (->
   (reduce
    (fn [content tag]
      (let [tag' (str "#" tag)]
        (string/replace content tag' "")))
    content
    tags)
   (string/trim)))
