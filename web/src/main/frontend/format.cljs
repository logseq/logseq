(ns frontend.format
  (:require [frontend.format.org-mode :refer [->OrgMode] :as org]
            [frontend.format.markdown :refer [->MdMode] :as markdown]
            [frontend.format.adoc :refer [->AdocMode]]
            [frontend.format.protocol :as protocol]
            [clojure.string :as string]))

(defonce org-record (->OrgMode))
(defonce markdown-record (->MdMode))
(defonce adoc-record (->AdocMode))

(defn normalize
  [format]
  (case (keyword format)
    :md :markdown
    :asciidoc :adoc
    ;; default
    (keyword format)))

(defn get-format
  [file]
  (when file
    (normalize (keyword (string/lower-case (last (string/split file #"\.")))))))

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
  [format]
  (case format
    :org org/default-config
    :markdown markdown/default-config
    nil))

(defn to-html
  ([content format]
   (to-html content format (get-default-config format)))
  ([content format config]
   (let [config (if config config (get-default-config format))]
     (if (string/blank? content)
       ""
       (if-let [record (get-format-record format)]
         (protocol/toHtml record content config)
         content)))))

(defn to-edn
  [content format config]
  (let [config (or config (get-default-config format))]
    (if-let [record (get-format-record format)]
      (protocol/toEdn record content config)
      nil)))

(defn loaded?
  [format]
  (when-let [record (get-format-record format)]
    (protocol/loaded? record)))
