(ns frontend.extensions.zip
  (:require [clojure.string :as string]
            [frontend.config :as config]
            ["jszip" :as JSZip]
            [promesa.core :as p]))

(defn make-file [content file-name args]
  (let [blob-content (clj->js [content])
        last-modified (or (aget content "lastModified") (js/Date.))
        args (clj->js args)]
    (aset args "lastModified" last-modified)
    (js/File. blob-content file-name args)))

(defn make-zip [zip-filename file-name->content repo]
  (let [zip (JSZip.)
        zip-foldername (subs zip-filename (inc (string/last-index-of zip-filename "/")))
        src-filepath (string/replace repo config/local-db-prefix "")
        folder (.folder zip zip-foldername)]
    (doseq [[file-name content] file-name->content]
      (.file folder (-> file-name
                        (string/replace src-filepath "")
                        (string/replace #"^/+" ""))
             content))
    (p/let [zip-blob (.generateAsync zip #js {:type "blob"})]
      (make-file zip-blob (str zip-filename ".zip") {:type "application/zip"}))))
