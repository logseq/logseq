(ns frontend.extensions.zip
  (:require [clojure.string :as string]
            ["jszip" :as JSZip]
            [promesa.core :as p]))

(defn make-file [content file-name args]
  (let [blob-content (clj->js [content])
        last-modified (or (aget content "lastModified") (js/Date.))
        args (clj->js args)]
    (aset args "lastModified" last-modified)
    (js/File. blob-content file-name args)))

(defn make-zip [zip-filename file-name->content _repo]
  (let [zip (JSZip.)
        folder (.folder zip zip-filename)]
    (doseq [[file-name content] file-name->content]
      (when-not (string/blank? content)
        (.file folder (-> file-name
                          (string/replace #"^/+" ""))
               content)))
    (p/let [zip-blob (.generateAsync zip #js {:type "blob"})]
      (make-file zip-blob (str zip-filename ".zip") {:type "application/zip"}))))
