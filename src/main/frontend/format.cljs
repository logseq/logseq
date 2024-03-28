(ns frontend.format
  "Main ns for providing common operations on file content like conversion to html
and edn. Can handle org-mode and markdown formats"
  (:require [frontend.format.mldoc :refer [->MldocMode] :as mldoc]
            [frontend.format.protocol :as protocol]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.common.util :as common-util]
            [clojure.string :as string]))

(defonce mldoc-record (->MldocMode))

(defn get-format-record
  [format]
  (case (common-util/normalize-format format)
    :org
    mldoc-record
    :markdown
    mldoc-record
    nil))

(defn to-html
  [content format config]
  (if (string/blank? content)
    ""
    (if-let [record (get-format-record format)]
      (protocol/toHtml record content config gp-mldoc/default-references)
      content)))

(defn to-edn
  [content format config]
  (if-let [record (get-format-record format)]
    (protocol/toEdn record content config)
    nil))
