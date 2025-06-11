(ns logseq.db.frontend.asset)

(defn- decode-digest
  [^js/Uint8Array digest]
  (.. (js/Array.from digest)
      (map (fn [s] (.. s (toString 16) (padStart 2 "0"))))
      (join "")))

;; TODO: Reuse with frontend
(defn <get-file-array-buffer-checksum
  "Given a file's ArrayBuffer, returns its checksum in a promise"
  [file-array-buffer]
  (-> (js/crypto.subtle.digest "SHA-256" file-array-buffer)
      (.then (fn [dig] (js/Uint8Array. dig)))
      (.then decode-digest)))