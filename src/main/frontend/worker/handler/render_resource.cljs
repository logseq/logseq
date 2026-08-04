(ns frontend.worker.handler.render-resource
  "Public renderer-resource API; implementation lives in the worker engine module."
(:require [frontend.worker.handler.render-resource.engine :as engine]))

(def render-resource engine/render-resource)
(def render-resources engine/render-resources)
