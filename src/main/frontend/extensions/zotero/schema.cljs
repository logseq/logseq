(ns frontend.extensions.zotero.schema
  (:require [camel-snake-kebab.core :as csk]
            [clojure.edn :as edn]
            [shadow.resource :as rc]))

(def items-with-fields
  (-> (rc/inline "zotero-items.edn")
      (edn/read-string)))

(defn fields [type]
  (->> items-with-fields
       (filter (fn [{:keys [item-type]}] (= item-type type)))
       (first)
       :fields
       (mapv csk/->kebab-case-keyword)))
