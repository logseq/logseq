(ns frontend.format
  (:require [frontend.format.org-mode :refer [->OrgMode]]
            [frontend.format.markdown :refer [->MdMode]]
            [frontend.format.adoc :refer [->AdocMode]]
            [frontend.format.protocol :as protocol]
            [frontend.handler :as handler]))

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

(defn to-html
  [content format config]
  (if-let [record (get-format-record format)]
    (protocol/toHtml record content config)
    ;; TODO: preserve newlines
    content))

(defn loaded?
  [format]
  (when-let [record (get-format-record format)]
    (protocol/loaded? record)))

(defn lazy-load
  [format]
  (let [format (normalize format)]
    (when-let [record (get-format-record format)]
     (when-not (protocol/loaded? record)
       (handler/set-format-js-loading! format true)
       (protocol/lazyLoad record
                          (fn [result]
                            (handler/set-format-js-loading! format false))
                          (fn [error]
                            (prn format " js failed to load.")
                            (handler/set-format-js-loading! format false)
                            ;; TODO: notification
                            (js/console.error error)))))))
