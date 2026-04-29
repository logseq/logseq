(ns frontend.util.js-module
  (:require [goog.object :as gobj]))

(defn default-export
  [module]
  (or (when (some? module)
        (gobj/get module "default"))
      (when (some? module)
        (gobj/get module "module.exports"))
      module))
