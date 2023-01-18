(ns gen-malli-kondo-config.core
  "Used to generate kondo config from malli-schema"
  (:require-macros [gen-malli-kondo-config.collect :refer [collect-schema]])
  (:require [frontend.util]
            [frontend.util.list]
            [malli.clj-kondo :as mc]
            [malli.instrument]))


(defn main [& _args]
  (collect-schema)
  (println (mc/linter-config (mc/collect-cljs)))
  (js/process.exit 0))
