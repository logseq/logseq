(ns frontend.util.js-module
  "Helpers for reading JavaScript module exports across ESM, CommonJS interop, and bundled namespace objects."
  (:require [goog.object :as gobj]))

(defn default-export
  "Returns the callable/default value from ESM, CommonJS interop, or namespace-shaped modules."
  [module]
  (or (when (fn? module)
        module)
      (when (some? module)
        (gobj/get module "default"))
      (when (some? module)
        (gobj/get module "module.exports"))
      module))
