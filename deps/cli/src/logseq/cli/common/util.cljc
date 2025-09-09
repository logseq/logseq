(ns logseq.cli.common.util
  "Common util fns between CLI and frontend"
  (:require #?(:org.babashka/nbb ["jszip$default" :as JSZip]
               :cljs ["jszip" :as JSZip])
            #_:clj-kondo/ignore
            [clojure.string :as string]))

#?(:cljs
   (defn make-export-zip
     "Makes a zipfile for an exported version of graph. Removes files with blank content"
     [zip-filename file-name-content]
     (let [zip (JSZip.)
           folder (.folder zip zip-filename)]
       (doseq [[file-name content] file-name-content]
         (when-not (string/blank? content)
           (.file folder (-> file-name
                             (string/replace #"^/+" ""))
                  content)))
       zip)))

;; Macros are defined at top-level for frontend and nbb

(defmacro concatv
  "Vector version of concat. non-lazy"
  [& args]
  `(vec (concat ~@args)))

(defmacro mapcatv
  "Vector version of mapcat. non-lazy"
  [f coll & colls]
  `(vec (mapcat ~f ~coll ~@colls)))

(defmacro removev
  "Vector version of remove. non-lazy"
  [pred coll]
  `(vec (remove ~pred ~coll)))
