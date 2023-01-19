(ns frontend.shui
  "Glue between frontend code and deps/shui for convenience"
  (:require 
    [frontend.date :refer [int->local-time-2]]
    [frontend.state :as state]
    [logseq.shui.context :refer [make-context]]))

(def default-versions {:logseq.table.version 1})

(defn get-shui-component-version 
  "Returns the version of the shui component, checking first 
  the block properties, then the global config, then the defaults."
  [component-name block-config]
  (let [version-key (keyword (str "logseq." (name component-name) ".version"))]
    (js/parseFloat
      (or (get-in block-config [:block :block/properties version-key])
          (get-in (state/get-config) [version-key])
          (get-in default-versions [version-key])
          1))))

(defn make-shui-context [block-config inline]
  (make-context {:block-config block-config 
                 :app-config (state/get-config) 
                 :inline inline 
                 :int->local-time-2 int->local-time-2}))
