(ns logseq.shui.icon.v2
  (:require
   [clojure.string :as string]
   [rum.core :as rum]))

(rum/defc root
  ([name] (root name nil))
  ([name {:keys [extension? class] :as opts}]
   (when-not (string/blank? name)
     (let [tabler-classes (str (if extension? "tie tie-" "ti ti-") name)]
       [:span.ui__icon (merge {:class (cond-> tabler-classes class (str " " class))}
                              (dissoc opts :class :extension? :font?))]))))
