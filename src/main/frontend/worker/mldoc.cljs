(ns frontend.worker.mldoc
  "Mldoc related fns"
  (:require [logseq.graph-parser.mldoc :as gp-mldoc]
            [cljs-bean.core :as bean]
            [logseq.db.sqlite.util :as sqlite-util]
            [clojure.string :as string]))

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
