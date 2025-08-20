(ns logseq.cli.common.zip
  ;; TODO: nbb
  (:require ["jszip$default" :as JSZip]
            [clojure.string :as string]))

(defn make-file [content file-name args]
  (let [blob-content (clj->js [content])
        last-modified (or (aget content "lastModified") (js/Date.))
        args (clj->js args)]
    (aset args "lastModified" last-modified)
    (js/File. blob-content file-name args)))

;; TODO: reuse
(defn make-zip [zip-filename file-name-content _repo]
  (let [zip (JSZip.)
        folder (.folder zip zip-filename)]
    (doseq [[file-name content] file-name-content]
      (when-not (string/blank? content)
        (.file folder (-> file-name
                          (string/replace #"^/+" ""))
               content)))
    zip))
