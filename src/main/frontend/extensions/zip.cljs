(ns frontend.extensions.zip
  (:require ["jszip" :as JSZip]
            ["/frontend/utils" :as utils]
            [promesa.core :as p]
            [medley.core :as medley]))

(defn make-file [content file-name args]
  (let [blob-content (clj->js [content])
        last-modified (or (aget content "lastModified") (js/Date.))
        args (clj->js args)]
    (aset args "lastModified" last-modified)
    (js/File. blob-content file-name args)))

(defn make-zip [repo file-name->content]
  (let [zip (JSZip.)
        folder (.folder zip repo)]
    (doseq [[file-name content] file-name->content]
      (.file folder file-name content))
    (p/let [zip-blob (.generateAsync zip #js {:type "blob"})]
      (make-file zip-blob (str repo ".zip") {:type "application/zip"}))))
