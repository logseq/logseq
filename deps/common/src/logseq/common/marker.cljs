(ns logseq.common.marker
  "Marker patterns. File graph only"
  (:require [clojure.string :as string]))

(defn marker-pattern [format]
  (re-pattern
   (str "^" (if (= format :markdown) "(#+\\s+)?" "(\\*+\\s+)?")
        "(NOW|LATER|TODO|DOING|DONE|WAITING|WAIT|CANCELED|CANCELLED|IN-PROGRESS)?\\s?")))


(defn clean-marker
  [content format]
  (string/replace-first content (marker-pattern format) ""))
