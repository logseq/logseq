(ns logseq.db.frontend.asset
  "Asset fns used in node and browser contexts"
  (:require ["path" :as node-path]
            [clojure.string :as string]))

(defn- decode-digest
  [^js/Uint8Array digest]
  (.. (js/Array.from digest)
      (map (fn [s] (.. s (toString 16) (padStart 2 "0"))))
      (join "")))

(defn <get-file-array-buffer-checksum
  "Given a file's ArrayBuffer, returns its checksum in a promise"
  [file-array-buffer]
  (-> (js/crypto.subtle.digest "SHA-256" file-array-buffer)
      (.then (fn [dig] (js/Uint8Array. dig)))
      (.then decode-digest)))

(defn asset-path->type
  "Create asset type given asset path"
  [path]
  (string/lower-case (.substr (node-path/extname path) 1)))

(defn asset-name->title
  "Create asset title given asset path's basename"
  [path-basename]
  (.-name (node-path/parse path-basename)))