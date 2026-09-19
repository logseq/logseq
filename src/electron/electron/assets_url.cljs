(ns electron.assets-url
  "Resolve Electron assets:// URLs to filesystem paths."
  (:require [clojure.string :as string]))

(defn- decode-assets-path
  [path]
  (let [path (string/replace path "/logseq__colon/" ":/")]
    (try
      (js/decodeURIComponent path)
      (catch :default _
        path))))

(defn- path-from-url
  [^js parsed win32?]
  (let [host (.-host parsed)
        pathname (.-pathname parsed)]
    (cond
      (string/blank? host)
      pathname

      ;; Windows drive rewritten as host: assets://C/logseq__colon/Users/...
      (re-matches #"[A-Za-z]" host)
      (str "/" host pathname)

      win32?
      (str "//" host pathname)

      ;; Chromium standard-scheme rewrite: assets:///home/foo → assets://home/foo
      :else
      (str "/" host pathname))))

(defn- path-from-stripped
  [stripped win32?]
  (cond
    (or (string/starts-with? stripped "/")
        (re-find #"(?i)^[a-zA-Z]:" stripped))
    stripped

    win32?
    (str "//" stripped)

    :else
    (str "/" stripped)))

(defn assets-url->fs-path
  "Convert an assets:// URL to a filesystem path.

  The assets scheme is registered as a Chromium standard scheme, so
  `assets:///home/foo` is rewritten to `assets://home/foo` (host=`home`).
  Reconstruct the absolute path from host + pathname."
  [url {:keys [win32?]}]
  (when (string? url)
    (decode-assets-path
     (if-let [^js parsed (try (js/URL. url) (catch :default _ nil))]
       (path-from-url parsed win32?)
       (-> (first (string/split url #"[?#]" 2))
           (string/replace "assets://" "")
           (path-from-stripped win32?))))))
