(ns gen-malli-kondo-config.collect
  "Macro for collect malli-schema"
  (:require [cljs.analyzer.api :as ana-api]))

(defmacro collect-schema
  []
  `(malli.instrument/collect! {:ns ~(vec (ana-api/all-ns))}))
