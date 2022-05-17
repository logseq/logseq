(ns frontend.format
  (:require [frontend.format.mldoc :refer [->MldocMode] :as mldoc]
            [frontend.format.adoc :refer [->AdocMode]]
            [frontend.format.protocol :as protocol]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.text :as text]
            [logseq.graph-parser.util :as gp-util]
            [clojure.string :as string]))

;; TODO: Properly fix this circular dependency:
;; mldoc/->edn > text/parse-property > mldoc/link? ->mldoc/inline->edn + mldoc/default-config
(set! gp-mldoc/parse-property text/parse-property)

(defonce mldoc-record (->MldocMode))
(defonce adoc-record (->AdocMode))

(defn get-format-record
  [format]
  (case (gp-util/normalize-format format)
    :org
    mldoc-record
    :markdown
    mldoc-record
    :adoc
    adoc-record
    nil))

;; html
(defn get-default-config
  ([format]
   (gp-mldoc/default-config format))
  ([format options]
   (gp-mldoc/default-config format options)))

(defn to-html
  ([content format]
   (to-html content format (get-default-config format)))
  ([content format config]
   (let [config (if config config (get-default-config format))]
     (if (string/blank? content)
       ""
       (if-let [record (get-format-record format)]
         (protocol/toHtml record content config gp-mldoc/default-references)
         content)))))

(defn to-edn
  ([content format]
   (to-edn content format (get-default-config format)))
  ([content format config]
   (let [config (or config (get-default-config format))]
     (if-let [record (get-format-record format)]
       (protocol/toEdn record content config)
       nil))))

(defn loaded?
  [format]
  (when-let [record (get-format-record format)]
    (protocol/loaded? record)))
