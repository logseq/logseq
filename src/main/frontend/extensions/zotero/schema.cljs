(ns frontend.extensions.zotero.schema
  (:require [frontend.util :as util]
            [shadow.resource :as rc]
            [camel-snake-kebab.core :as csk]))

(def schema (-> (rc/inline "zotero-schema.json")
                (util/json->clj true)))

(defn fields [type]
  (->> (-> schema :item-types)
       (filter (fn [{:keys [item-type]}] (= item-type type)))
       (first)
       :fields
       (map :field)
       (mapv csk/->kebab-case-keyword)))
