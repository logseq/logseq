(ns frontend.worker.handler.render-resource
  "Public renderer-resource API; implementation lives in the worker engine module."
  (:require [frontend.worker.handler.render-resource.engine :as engine]))

(defn render-resource
  ([db resource-key]
   (engine/render-resource db resource-key))
  ([db resource-key runtime]
   (engine/render-resource db resource-key runtime)))

(defn render-resources
  ([db resource-keys]
   (engine/render-resources db resource-keys))
  ([db resource-keys runtime]
   (engine/render-resources db resource-keys runtime)))
