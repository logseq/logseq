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

(defn- http-url?
  [s]
  (and (string? s)
       (or (string/starts-with? s "http://")
           (string/starts-with? s "https://"))))

(defn- strip-url-suffix
  "Drop query/hash from HTTP(S) URLs so pathnames can be parsed like file names.
  Local filenames that contain `#` or `?` are left unchanged."
  [s]
  (when (string? s)
    (if (http-url? s)
      (first (string/split s #"[?#]" 2))
      s)))

(defn- path-basename
  "Last path segment of a file path or URL."
  [s]
  (when-let [s (strip-url-suffix s)]
    (let [normalized (string/replace s #"\\+" "/")
          idx (string/last-index-of normalized "/")]
      (if idx
        (subs normalized (inc idx))
        normalized))))

(defn asset-path->type
  "Create asset type given asset path"
  [path]
  (let [path (or (strip-url-suffix path) path)]
    (string/lower-case (.substr (node-path/extname path) 1))))

(defn asset-name->title
  "Create asset title given a basename, file path, or URL.

  Remote poster URLs (Amazon/IMDb/TMDB) must not become the visible title —
  callers display the file stem (`MV5B…`) instead of the full URL."
  [name-or-url]
  (let [base (or (path-basename name-or-url) "")]
    (if (string/blank? base)
      ""
      (let [parsed-name (.-name (node-path/parse base))]
        (if (string/blank? parsed-name)
          base
          parsed-name)))))