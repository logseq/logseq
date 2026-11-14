(ns logseq.db-sync.platform.node
  (:require [clojure.string :as string]
            [logseq.db-sync.platform.core :as core]
            [promesa.core :as p]))

(defn- headers->object [headers]
  (let [out (js-obj)]
    (.forEach headers (fn [value key] (aset out key value)))
    out))

(defn request-from-node
  "Builds a platform Request from a Node.js IncomingMessage.
  `origins` is a vector of {:scheme :host} maps (as returned by
  `server/request-origin-opts`). The entry whose :host matches the request's
  Host header is used to reconstruct the full URL; the first entry is used as
  a fallback when no match is found. This allows the server to accept requests
  arriving via different addresses (e.g. LAN IP over HTTP and a Tailscale /
  reverse-proxy domain over HTTPS) without any per-request configuration."
  [^js req origins]
  (let [headers (js/Headers.)
        node-headers (.-headers req)
        header-keys (js/Object.keys node-headers)
        _ (doseq [k header-keys]
            (let [value (aget node-headers k)]
              (when (some? value)
                (.set headers (string/lower-case k) value))))
        method (or (.-method req) "GET")
        req-host (or (aget node-headers "host") "localhost")
        {:keys [scheme host]} (or (some #(when (= (:host %) req-host) %) origins)
                                  (first origins)
                                  {:scheme "http"})
        url (str scheme "://" (or host req-host) (.-url req))
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
    (.writeHead res status headers)
    (if-let [body (.-body response)]
      (let [^js stream (try
                         (let [Readable (.-Readable (js/require "stream"))]
                           (when (and Readable (.-fromWeb Readable))
                             (.fromWeb Readable body)))
                         (catch :default _ nil))]
        (if stream
          (do
            (.pipe stream res)
            (js/Promise.resolve nil))
          (p/let [buf (.arrayBuffer response)]
            (.end res (js/Buffer.from buf)))))
      (do
        (.end res)
        (js/Promise.resolve nil)))))
