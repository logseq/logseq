(ns logseq.melange.bridge.common.uuid
  "DataScript UUID capability for typed Melange Common consumers."
  (:require ["@logseq/melange-js-api/common" :as common-api]
            [logseq.melange.bridge.platform.datascript :as d]))

(def ^:private api
  (.-Uuid common-api))

(defn gen
  "Generates a native time-sortable UUID through the DataScript adapter."
  []
  (.generate api d/squuid))
