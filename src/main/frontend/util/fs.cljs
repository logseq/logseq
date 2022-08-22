;; TODO: move all file path related util functions to here (excepts those fit graph-parser)

(ns frontend.util.fs
  "Misc util fns built on top of frontend.fs"
  (:require ["path" :as path]
            [frontend.util :as util]
            [logseq.graph-parser.util :as gp-util]
            [clojure.string :as string]
            [frontend.fs :as fs]
            [frontend.config :as config]
            [promesa.core :as p]
            [cljs.reader :as reader]))

;; NOTE: This is not the same ignored-path? as src/electron/electron/utils.cljs.
;;       The assets directory is ignored.
;;
;; When in nfs-mode, dir is "", path is relative path to graph dir.
;; When in native-mode, dir and path are absolute paths.
(defn ignored-path?
  "Ignore path for ls-dir-files-with-handler! and reload-dir!"
  [dir path]
  (let [ignores ["." ".recycle" "node_modules" "logseq/bak"
                 "logseq/version-files" "logseq/graphs-txid.edn"]]
    (when (string? path)
      (or
       (some #(string/starts-with? path (str dir "/" %)) ignores)
       (some #(string/includes? path (str "/" % "/")) ignores)
       (some #(string/ends-with? path %)
             [".DS_Store" "logseq/graphs-txid.edn" "logseq/broken-config.edn"])
      ;; hidden directory or file
       (let [relpath (path/relative dir path)]
         (or (re-find #"/\.[^.]+" relpath)
             (re-find #"^\.[^.]+" relpath)))
       (let [path (string/lower-case path)]
         (and
          (not (string/blank? (path/extname path)))
          (not
           (some #(string/ends-with? path %)
                 [".md" ".markdown" ".org" ".js" ".edn" ".css"]))))))))

(defn read-graphs-txid-info
  [root]
  (when (string? root)
    (p/let [exists? (fs/file-exists? root "logseq/graphs-txid.edn")]
      (when exists?
        (-> (p/let [txid-str (fs/read-file root "logseq/graphs-txid.edn")
                    txid-meta (and txid-str (reader/read-string txid-str))]
              txid-meta)
            (p/catch
                (fn [^js e]
                  (js/console.error "[fs read txid data error]" e))))))))

(defn inflate-graphs-info
  [graphs]
  (if (seq graphs)
    (p/all (for [{:keys [root] :as graph} graphs]
             (p/let [sync-meta (read-graphs-txid-info root)]
               (if sync-meta
                 (assoc graph
                        :sync-meta sync-meta
                        :GraphUUID (second sync-meta))
                 graph))))
    []))

(defn read-repo-file
  [repo-url file]
  (when-let [repo-dir (config/get-repo-dir repo-url)]
    (fs/read-file repo-dir file)))

(def multiplatform-reserved-chars ":\\*\\?\"<>|\\#")

(def reserved-chars-pattern
  (re-pattern (str "[" multiplatform-reserved-chars "]+")))

(defn include-reserved-chars?
  "Includes reserved charcters that would broken FS"
  [s]
  (util/safe-re-find reserved-chars-pattern s))

(defn- encode-url-lowbar
  [input]
  (string/replace input "_" "%5F"))

(defn- encode-url-percent
  [input]
  (string/replace input "%" "%25"))

(defn- escape-namespace-slashes-and-multilowbars
  "Encode slashes / as double lowbars __
   Don't encode _ in most cases, except causing ambiguation"
  [string]
  (-> string
      ;; The ambiguation is caused by the unbounded _ (possible continuation of `_`s)
      (string/replace "__" encode-url-lowbar)
      (string/replace "_/" encode-url-lowbar)
      (string/replace "/_" encode-url-lowbar)
      ;; After ambiguaous _ encoded, encode the slash
      (string/replace "/" "__")))

(def windows-reserved-filebodies
  (set '("CON" "PRN" "AUX" "NUL" "COM1" "COM2" "COM3" "COM4" "COM5" "COM6"
               "COM7" "COM8" "COM9" "LPT1" "LPT2" "LPT3" "LPT4" "LPT5" "LPT6" "LPT7"
               "LPT8" "LPT9")))

(defn- escape-windows-reserved-filebodies
  "Encode reserved file names in Windows"
  [file-body]
  (str file-body (when (or (contains? windows-reserved-filebodies file-body)
                           (string/ends-with? file-body "."))
                   "/"))) ;; "__" would not break the title, but follow the Windows ruling

(defn- url-encode-file-name
  [file-name]
  (-> file-name
      js/encodeURIComponent
      (string/replace "*" "%2A") ;; extra token that not involved in URI encoding
      ))

(defn file-name-sanity
  "Sanitize page-name for file name (strict), for file name in file writing."
  [title]
  (some-> title
          gp-util/page-name-sanity ;; we want to preserve the case sensitive nature of most file systems, don't lowercase
          (string/replace gp-util/url-encoded-pattern encode-url-percent) ;; pre-encode % in title on demand
          (string/replace reserved-chars-pattern url-encode-file-name)
          (escape-windows-reserved-filebodies) ;; do this before the lowbar encoding to avoid ambiguity
          (escape-namespace-slashes-and-multilowbars)))

(defn create-title-property?
  [page-name]
  (and (string? page-name)
       (let [file-name  (file-name-sanity page-name)
             page-name' (gp-util/title-parsing file-name)
             result     (or (not= page-name page-name')
                            (include-reserved-chars? file-name))]
         (when result (js/console.error "`fs-util/create-title-property?` return true for page " page-name))
         result)))
