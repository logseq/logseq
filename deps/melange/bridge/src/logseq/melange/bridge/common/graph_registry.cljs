(ns logseq.melange.bridge.common.graph-registry
  (:require ["@logseq/melange-js-api/common" :as common-api]
            [logseq.melange.bridge.runtime :as runtime]))

(def ^:private api (.-GraphRegistry common-api))

(defn- result-value
  [entry result]
  (if-let [message (.-error result)]
    (throw (ex-info message {:entry entry}))
    (.-value result)))

(defn normalize-entry
  [entry]
  (result-value
   entry
   (.normalizeValueWith api (runtime/runtime-adapter) entry)))

(defn upsert-entry
  [registry entry]
  (result-value
   entry
   (.upsertValueWith api (runtime/runtime-adapter) registry entry)))

(defn resolve-target
  [registry {:keys [graph-id graph-identifier]}]
  (.resolveTargetValueWith
   api
   (runtime/runtime-adapter)
   registry
   graph-id
   graph-identifier))
