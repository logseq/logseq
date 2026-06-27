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

(defn node-platform
  [opts]
  (let [platform (-> (.-Platform melange-js-api)
                     (.node_platform (clj->js opts))
                     platform/js-platform->platform)]
    (cond-> platform
      (not (vector-embedding-enabled? opts))
      (dissoc :vector :embedding))))
