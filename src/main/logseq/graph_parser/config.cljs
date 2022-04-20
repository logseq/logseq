(ns logseq.graph-parser.config
  "Minimal version of frontend.config used by graph-parser"
  (:require [logseq.graph-parser.util :as util]
            [clojure.string :as string]))

(defonce local-assets-dir "assets")

(defn local-asset?
  [s]
  (util/safe-re-find (re-pattern (str "^[./]*" local-assets-dir)) s))

(defonce default-draw-directory "draws")

(defn draw?
  [path]
  (string/starts-with? path default-draw-directory))

(defonce mldoc-support-formats
  #{:org :markdown :md})

(defn mldoc-support?
  [format]
  (contains? mldoc-support-formats (keyword format)))

(defonce local-db-prefix "logseq_local_")

(defn get-local-dir
  [s]
  (string/replace s local-db-prefix ""))

(defn get-repo-dir
  [repo-url]
  (cond
    true
    #_(and (util/electron?) (local-db? repo-url))
    (get-local-dir repo-url)

    ;; TODO: Pass in mobile-util checks
    #_(and (mobile-util/is-native-platform?) (local-db? repo-url))
    #_(let [dir (get-local-dir repo-url)]
        (if (string/starts-with? dir "file:")
          dir
          (str "file:///" (string/replace dir #"^/+" ""))))

    :else
    (str "/"
         (->> (take-last 2 (string/split repo-url #"/"))
              (string/join "_")))))

(defn get-file-path
  "Normalization happens here"
  [repo-url relative-path]
  (when (and repo-url relative-path)
    (let [path (cond
                 true
                 #_(and (util/electron?) (local-db? repo-url))
                 (let [dir (get-repo-dir repo-url)]
                   (if (string/starts-with? relative-path dir)
                     relative-path
                     (str dir "/"
                          (string/replace relative-path #"^/" ""))))

                 (= "/" (first relative-path))
                 (subs relative-path 1)

                 :else
                 relative-path)]
      (util/path-normalize path))))

(def app-name "logseq")
(def pages-metadata-file "pages-metadata.edn")

(defn get-pages-metadata-path
  [repo]
  (when repo
    (get-file-path repo (str app-name "/" pages-metadata-file))))
