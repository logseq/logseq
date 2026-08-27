(ns frontend.handler.file-graph-import
  "Renderer-side session for streaming File-to-DB imports."
  (:require [promesa.core :as p]))

(defonce ^:private *file-graph-import-session (atom nil))

(defn set-file-graph-import-session!
  [session]
  (reset! *file-graph-import-session session))

(defn clear-file-graph-import-session!
  []
  (reset! *file-graph-import-session nil))

(defn <read-file-graph-import-file
  [path]
  (if-let [reader (:<read-file @*file-graph-import-session)]
    (reader path)
    (p/rejected (ex-info "no file-graph import session"
                         {:code :missing-import-session
                          :path path}))))

(defn <write-file-graph-import-staged-asset!
  [repo asset]
  (if-let [writer (:<write-staged-asset @*file-graph-import-session)]
    (let [write (writer repo asset)]
      (when-let [pending (:pending-asset-writes @*file-graph-import-session)]
        (swap! pending conj write))
      write)
    (p/resolved nil)))

(defn <await-file-graph-import-asset-writes!
  []
  (if-let [pending (:pending-asset-writes @*file-graph-import-session)]
    (p/let [_ (p/all @pending)]
      (reset! pending [])
      nil)
    (p/resolved nil)))
