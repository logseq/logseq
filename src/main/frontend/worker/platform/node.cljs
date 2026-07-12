(ns frontend.worker.platform.node
  "Node.js platform adapter for db-worker."
  (:require ["@logseq/melange-js-api/node" :as melange-js-api]
            [frontend.worker.platform :as platform]))

(defn- macos-arm64?
  []
  (and (= "darwin" (.-platform js/process))
       (= "arm64" (.-arch js/process))))

(defn- vector-embedding-enabled?
  [{:keys [embedding-endpoint]}]
  (boolean
   (and (macos-arm64?)
        (seq (or embedding-endpoint
                 (some-> js/process .-env .-LOGSEQ_EMBEDDINGS_URL))))))

(defn- node-options->js
  [{:keys [root-dir owner-source event-fn write-guard-fn recreate-lock-fn
           embedding-endpoint embedding-model-id open-vector-index-fn]}]
  #js {:rootDir root-dir
       :ownerSource (some-> owner-source name)
       :eventFn event-fn
       :writeGuardFn write-guard-fn
       :recreateLockFn recreate-lock-fn
       :embeddingEndpoint embedding-endpoint
       :embeddingModelId embedding-model-id
       :openVectorIndexFn open-vector-index-fn})

(defn node-platform
  [opts]
  (let [platform (-> (.-Platform melange-js-api)
                     (.node_platform (node-options->js opts))
                     platform/js-platform->platform)]
    (cond-> platform
      (not (vector-embedding-enabled? opts))
      (dissoc :vector :embedding))))
