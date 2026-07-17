(ns logseq.melange.bridge.db.asset
  "Asset domain and Web Crypto representation boundary."
  (:require ["@logseq/melange-js-api/db" :as melange-db]))

(def ^:private asset-api (.-Asset melange-db))

(defn digest-hex
  "Encodes digest bytes as lowercase hexadecimal text."
  [^js/Uint8Array digest]
  ((.-digestHex asset-api) digest))

(defn <get-file-array-buffer-checksum
  "Returns the SHA-256 checksum for an ArrayBuffer or string in a promise."
  [value]
  ((.-checksumValue asset-api) value))

(defn asset-path->type
  "Returns the lowercase final extension for an asset path."
  [path]
  ((.-pathType asset-api) path))

(defn asset-name->title
  "Returns an asset basename without its final extension."
  [path]
  ((.-nameTitle asset-api) path))
