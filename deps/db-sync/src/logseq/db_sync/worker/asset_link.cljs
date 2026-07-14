(ns logseq.db-sync.worker.asset-link
  (:require [logseq.db-sync.worker.handler.assets :as assets-handler]
            [promesa.core :as p]))

(def ^:private ttl-seconds 300)

(defn- secret-key [^js env usages]
  (let [secret (aget env "ASSET_LINK_SECRET")]
    (if-not (and (string? secret) (seq secret))
      (p/rejected (ex-info "missing ASSET_LINK_SECRET" {:binding "ASSET_LINK_SECRET"}))
      (.importKey (.-subtle js/crypto)
                  "raw"
                  (.encode (js/TextEncoder.) secret)
                  #js {:name "HMAC" :hash "SHA-256"}
                  false
                  (clj->js usages)))))

(defn- signature-hex [buffer]
  (->> (js/Uint8Array. buffer)
       (map #(-> (.toString % 16) (.padStart 2 "0")))
       (apply str)))

(defn- hex-bytes [value]
  (when (and (string? value) (zero? (mod (count value) 2)))
    (let [payload-bytes (js/Uint8Array. (/ (count value) 2))]
      (doseq [index (range (.-length payload-bytes))]
        (aset payload-bytes index (js/parseInt (subs value (* index 2) (+ (* index 2) 2)) 16)))
      payload-bytes)))

(defn- payload [graph-id file expires]
  (str graph-id "/" file ":" expires))

(defn <temporary-url [^js request ^js env graph-id asset-uuid asset-type]
  (let [expires (+ (js/Math.floor (/ (.now js/Date) 1000)) ttl-seconds)
        file (str asset-uuid "." asset-type)
        data (.encode (js/TextEncoder.) (payload graph-id file expires))]
    (p/let [key (secret-key env ["sign"])
            signature (.sign (.-subtle js/crypto) "HMAC" key data)
            url (js/URL. (str "/assets/" graph-id "/" file) (.-url request))]
      (.set (.-searchParams url) "expires" (str expires))
      (.set (.-searchParams url) "signature" (signature-hex signature))
      {:url (str url) :expires-at expires})))

(defn <valid-request? [^js request ^js env]
  (let [url (js/URL. (.-url request))
        parsed (assets-handler/parse-asset-path (.-pathname url))
        expires-raw (.get (.-searchParams url) "expires")
        signature-raw (.get (.-searchParams url) "signature")
        expires (when expires-raw (js/parseInt expires-raw 10))
        signature (hex-bytes signature-raw)
        now (js/Math.floor (/ (.now js/Date) 1000))]
    (if-not (and parsed (number? expires) (not (js/isNaN expires)) signature
                 (> expires now) (<= expires (+ now ttl-seconds)))
      (p/resolved false)
      (let [file (str (:asset-uuid parsed) "." (:asset-type parsed))
            data (.encode (js/TextEncoder.) (payload (:graph-id parsed) file expires))]
        (p/let [key (secret-key env ["verify"])]
          (.verify (.-subtle js/crypto) "HMAC" key signature data))))))
