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
