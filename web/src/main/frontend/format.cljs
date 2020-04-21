(ns frontend.format
  (:require [frontend.format.org-mode :refer [->OrgMode] :as org]
            [frontend.format.markdown :refer [->MdMode]]
            [frontend.format.adoc :refer [->AdocMode]]
            [frontend.format.protocol :as protocol]
            [clojure.string :as string]))

(defonce org-record (->OrgMode))
(defonce markdown-record (->MdMode))
(defonce adoc-record (->AdocMode))

(defn get-format
  [file]
  (when file
    (keyword (string/lower-case (last (string/split file #"\."))))))

(defn normalize
  [format]
  (case (keyword format)
    :md :markdown
    :asciidoc :adoc
    ;; default
    (keyword format)))

(defn get-format-record
  [format]
  (case (normalize format)
    :org
    org-record
    :markdown
    markdown-record
    :adoc
    adoc-record
    nil))

;; html
(defn get-default-config
  []
  ;; TODO
  org/default-config)

(defn to-html
  ([content format]
   (to-html content format (get-default-config)))
  ([content format config]
   (let [config (if config config (get-default-config))]
     (if (string/blank? content)
       ""
       (if-let [record (get-format-record format)]
         (protocol/toHtml record content config)
         content)))))

(defn loaded?
  [format]
  (when-let [record (get-format-record format)]
    (protocol/loaded? record)))
