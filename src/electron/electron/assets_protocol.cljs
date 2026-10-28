(ns electron.assets-protocol
  "Resolves requests of the assets:// protocol to local file paths. Kept free of
  Electron requires so it can be unit tested."
  (:require [clojure.string :as string]))

(defn url->file-path
  "Returns the local file path to serve for the assets:// request `url`.

  The renderer builds `assets:///home/me/graph/assets/a.png`, but the protocol
  is registered as standard, so Chromium reads the first path segment as the
  host and hands the handler `assets://home/me/graph/assets/a.png`. A path
  without a leading slash is therefore an absolute path whose slash went into
  the URL's host separator, except on Windows where it is a UNC path
  (`assets://server/share/a.png`)."
  [url win32?]
  (let [;; Query and fragment belong to the document URL, not the filename.
        path (-> (first (string/split url #"[?#]" 2))
                 (string/replace "assets://" "")
                 (js/decodeURIComponent))]
    (cond
      (or (string/starts-with? path "/")
          (re-find #"(?i)^/[a-zA-Z]:" path))
      path

      win32?
      (str "//" path)

      :else
      (str "/" path))))
