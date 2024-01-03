(ns frontend.worker.mldoc
  "Mldoc related fns"
  (:require [logseq.graph-parser.mldoc :as gp-mldoc]
            [cljs-bean.core :as bean]
            [logseq.db.sqlite.util :as sqlite-util]
            [clojure.string :as string]
            [logseq.graph-parser.text :as text]
            [clojure.walk :as walk]
            [logseq.graph-parser.block :as gp-block]
            [logseq.common.util :as common-util]))

(defn get-default-config
  "Gets a mldoc default config for the given format. Works for DB and file graphs"
  [repo format]
  (let [db-based? (sqlite-util/db-based-graph? repo)]
    (->>
     (cond-> (gp-mldoc/default-config-map format)
       db-based?
       (assoc :enable_drawers false))
     bean/->js
     js/JSON.stringify)))

(defn ->edn
  "Wrapper around gp-mldoc/->edn that builds mldoc config given a format"
  [repo content format]
  (gp-mldoc/->edn content (get-default-config repo format)))

(defn properties?
  [ast]
  (contains? #{"Properties" "Property_Drawer"} (ffirst ast)))

(defn block-with-title?
  [type]
  (contains? #{"Paragraph"
               "Raw_Html"
               "Hiccup"
               "Heading"} type))

(defn- has-title?
  [repo content format]
  (let [ast (->edn repo content format)]
    (block-with-title? (ffirst (map first ast)))))

(defn get-title&body
  "parses content and returns [title body]
   returns nil if no title"
  [repo content format]
  (let [lines (string/split-lines content)]
    (if (has-title? repo content format)
      [(first lines) (string/join "\n" (rest lines))]
      [nil (string/join "\n" lines)])))

(defn extract-plain
  "Extract plain elements including page refs"
  [repo content]
  (let [ast (->edn repo content :markdown)
        *result (atom [])]
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
        text/page-ref-un-brackets!)))

(defn extract-refs-from-text
  [repo db text date-formatter]
  (when (string? text)
    (let [ast-refs (gp-mldoc/get-references text (get-default-config repo :markdown))
          page-refs (map #(gp-block/get-page-reference % :markdown) ast-refs)
          block-refs (map #(gp-block/get-block-reference %) ast-refs)
          refs' (->> (concat page-refs block-refs)
                     (remove string/blank?)
                     distinct)]
      (-> (map #(if (common-util/uuid-string? %)
                  {:block/uuid (uuid %)}
                  (gp-block/page-name->map % true db true date-formatter))
               refs')
          set))))
