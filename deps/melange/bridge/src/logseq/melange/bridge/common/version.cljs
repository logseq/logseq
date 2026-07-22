(ns logseq.melange.bridge.common.version
  "Compile-time build metadata backed by typed version formatting."
  (:require ["@logseq/melange-js-api/common" :as common-api]))

(goog-define BUILD_TIME "unknown")
(goog-define REVISION "dev")

(defn build-time
  []
  BUILD_TIME)

(defn revision
  []
  REVISION)

(defn format-version
  []
  (.formatVersion (.-Version common-api) BUILD_TIME REVISION))
