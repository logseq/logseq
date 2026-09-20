(ns logseq.db-sync.platform.node
  (:require [clojure.string :as string]
            [logseq.db-sync.platform.core :as core]
            [promesa.core :as p]))

(defn- headers->object [headers]
  (let [out (js-obj)]
    (.forEach headers (fn [value key] (aset out key value)))
    out))

(defn request-from-node
  [^js req {:keys [scheme host]}]
  (let [headers (js/Headers.)
        node-headers (.-headers req)
        header-keys (js/Object.keys node-headers)
        _ (doseq [k header-keys]
            (let [value (aget node-headers k)]
              (when (some? value)
                (.set headers (string/lower-case k) value))))
        method (or (.-method req) "GET")
        host (or host (aget node-headers "host") "localhost")
        scheme (or scheme "http")
        url (str scheme "://" host (.-url req))
        init #js {:method method
                  :headers headers}]
    (when-not (or (= method "GET") (= method "HEAD"))
      (aset init "body" req)
      (aset init "duplex" "half"))
    (core/request url init)))

(defn send-response!
  [^js res ^js response]
  (let [headers (headers->object (.-headers response))
        status (.-status response)]
    (if (.-body response)
      (p/let [buf (.arrayBuffer response)
              node-buf (js/Buffer.from buf)]
        (aset headers "content-length" (str (.-length node-buf)))
        (.writeHead res status headers)
        (.end res node-buf))
      (do
        (.writeHead res status headers)
        (.end res)
        (js/Promise.resolve nil)))))
