(ns frontend.extensions.zip
  (:require [logseq.cli.common.util :as cli-common-util]
            [promesa.core :as p]))

(defn make-file [content file-name args]
  (let [blob-content (clj->js [content])
        last-modified (or (aget content "lastModified") (js/Date.))
        args (clj->js args)]
    (aset args "lastModified" last-modified)
    (js/File. blob-content file-name args)))

(defn make-zip [zip-filename file-name-content _repo]
  (let [zip (cli-common-util/make-export-zip zip-filename file-name-content)]
    (p/let [zip-blob (.generateAsync zip #js {:type "blob"})]
      (make-file zip-blob (str zip-filename ".zip") {:type "application/zip"}))))
