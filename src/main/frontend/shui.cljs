(ns frontend.shui
  "Glue between frontend code and deps/shui for convenience"
  (:require 
    [frontend.colors :as colors]
    [frontend.date :refer [int->local-time-2]]
    [frontend.db :as db]
    [frontend.db.utils :as db-utils]
    [frontend.handler.search :as search-handler]
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

(defn make-shui-context 
  ([] (make-shui-context nil nil))
  ([block-config inline]
   (make-context {:block-config block-config 
                  :config (state/get-config) 
                  :inline inline 
                  :int->local-time-2 int->local-time-2 
                  :search search-handler/search
                  ;; We need some variable from the state to carry over 
                  :state state/state
                  :get-current-repo state/get-current-repo
                  :color-accent (state/get-color-accent) 
                  ;; Pass over ability to look up entities 
                  :entity db-utils/entity
                  :get-block-and-children db/get-block-and-children
                  :get-block-children db/get-block-children
                  :get-page-blocks-no-cache db/get-page-blocks-no-cache
                  :get-page db/get-page
                  :linear-gradient colors/linear-gradient})))
  
