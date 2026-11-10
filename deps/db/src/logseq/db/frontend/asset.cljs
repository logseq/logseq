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
  "Given a file's ArrayBuffer or String, returns its checksum in a promise"
  [s]
  (let [array-buffer (if (string? s)
                       (.encode (js/TextEncoder.) s) s)]
    (-> (js/crypto.subtle.digest "SHA-256" array-buffer)
        (.then (fn [dig] (js/Uint8Array. dig)))
        (.then decode-digest))))

(defn asset-path->type
  "Create asset type given asset path"
  [path]
  (string/lower-case (.substr (node-path/extname path) 1)))

(defn asset-name->title
  "Create asset title given asset path's basename"
  [path-basename]
  (.-name (node-path/parse path-basename)))

(def plugin-id-pattern
  "Safe plugin id for a sandbox storage dir name: no separators, no leading dot."
  #"^[A-Za-z0-9_-][A-Za-z0-9._-]*$")

(defn asset-file-path
  "Asset file path relative to the graph's assets dir. An asset with
  :logseq.property.asset/plugin-id lives in that plugin's sandbox storage."
  [asset-uuid asset-type plugin-id]
  (let [file-name (str asset-uuid "." asset-type)]
    (cond
      (nil? plugin-id) file-name
      ;; plugin-id arrives via sync, so it must never escape assets/storages/
      (re-matches plugin-id-pattern plugin-id) (str "storages/" plugin-id "/" file-name)
      :else (throw (ex-info "Invalid asset plugin-id" {:plugin-id plugin-id
                                                       :asset-uuid asset-uuid})))))
