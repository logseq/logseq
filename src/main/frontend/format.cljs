(ns frontend.format
  "Main ns for providing common operations on markdown file content like conversion to html
and edn"
  (:require [clojure.string :as string]
            [frontend.format.mldoc :refer [->MldocMode] :as mldoc]
            [frontend.format.protocol :as protocol]
            [logseq.graph-parser.mldoc :as gp-mldoc]))

(defonce mldoc-record (->MldocMode))

(defn to-html
  [content config]
  (if (string/blank? content)
    ""
    (protocol/toHtml mldoc-record content config gp-mldoc/default-references)))

(defn to-edn
  [content config]
  (protocol/toEdn mldoc-record content config))
