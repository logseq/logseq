(ns gen-malli-kondo-config.core
  (:require-macros [gen-malli-kondo-config.collect :refer [collect-schema]])
  (:require [frontend.util]
            [frontend.util.list]
            [malli.clj-kondo :as mc]
            [malli.dev.cljs :as md]))


(defn main [& _args]
  (collect-schema)
  (println (mc/linter-config (mc/collect-cljs)))
  (js/process.exit 0))
