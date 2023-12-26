;; TODO: move all file path related util functions to here (excepts those fit graph-parser)

(ns frontend.util.fs
  "Misc util fns built on top of frontend.fs"
  (:require ["path" :as node-path]
            [frontend.util :as util]
            [logseq.graph-parser.util :as gp-util]
            [clojure.string :as string]
            [frontend.state :as state]
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
       (some #(string/starts-with? path
                                   (if (= dir "")
                                     %
                                     (str dir "/" %))) ignores)
       (some #(string/includes? path (if (= dir "")
                                       (str "/" % "/")
                                       (str % "/"))) ignores)
       (some #(string/ends-with? path %)
             [".DS_Store" "logseq/graphs-txid.edn"])
      ;; hidden directory or file
       (let [relpath (node-path/relative dir path)]
         (or (re-find #"/\.[^.]+" relpath)
             (re-find #"^\.[^.]+" relpath)))
       (let [path (string/lower-case path)]
         (and
          (not (string/blank? (node-path/extname path)))
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
  [repo-url file-rpath]
  (when-let [repo-dir (config/get-repo-dir repo-url)]
    (fs/read-file repo-dir file-rpath)))

(def multiplatform-reserved-chars ":\\*\\?\"<>|\\#\\\\")

(def reserved-chars-pattern
  (re-pattern (str "[" multiplatform-reserved-chars "]+")))

(defn include-reserved-chars?
  "Includes reserved characters that would broken FS"
  [s]
  (util/safe-re-find reserved-chars-pattern s))

(defn- encode-url-lowbar
  [input]
  (string/replace input "_" "%5F"))

(defn- encode-url-percent
  [input]
  (string/replace input "%" "%25"))

(defn- escape-namespace-slashes-and-multilowbars
  "Encode slashes / as triple lowbars ___
   Don't encode _ in most cases, except causing ambiguation"
  [string]
  (-> string
      ;; The ambiguation is caused by the unbounded _ (possible continuation of `_`s)
      (string/replace "___" encode-url-lowbar)
      (string/replace "_/" encode-url-lowbar)
      (string/replace "/_" encode-url-lowbar)
      ;; After ambiguaous _ encoded, encode the slash
      (string/replace "/" "___")))

(def windows-reserved-filebodies
  (set '("CON" "PRN" "AUX" "NUL" "COM1" "COM2" "COM3" "COM4" "COM5" "COM6"
               "COM7" "COM8" "COM9" "LPT1" "LPT2" "LPT3" "LPT4" "LPT5" "LPT6" "LPT7"
               "LPT8" "LPT9")))

(defn- escape-windows-reserved-filebodies
  "Encode reserved file names in Windows"
  [file-body]
  (str file-body (when (or (contains? windows-reserved-filebodies file-body)
                           (string/ends-with? file-body "."))
                   "/"))) ;; "___" would not break the title, but follow the Windows ruling

(defn- url-encode-file-name
  [file-name]
  (-> file-name
      js/encodeURIComponent
      (string/replace "*" "%2A") ;; extra token that not involved in URI encoding
      ))

(defn- tri-lb-file-name-sanity
  "Sanitize page-name for file name (strict), for file name in file writing.
   Use triple lowbar as namespace separator"
  [title]
  (some-> title
          gp-util/page-name-sanity ;; we want to preserve the case sensitive nature of most file systems, don't lowercase
          (string/replace gp-util/url-encoded-pattern encode-url-percent) ;; pre-encode % in title on demand
          (string/replace reserved-chars-pattern url-encode-file-name)
          (string/replace #"^\." "%2E") ;; Force percent encoding to distinguish pages with a title starting with a dot from a hidden file.
          (escape-windows-reserved-filebodies) ;; do this before the lowbar encoding to avoid ambiguity
          (escape-namespace-slashes-and-multilowbars)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;     Keep for backward compatibility     ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; Rule of dir-ver 0 (before 2022 May)
;; Source: https://github.com/logseq/logseq/blob/1519e35e0c8308d8db90b2525bfe7a716c4cdf04/src/main/frontend/util.cljc#L930
(defn legacy-dot-file-name-sanity
  [page-name]
  (when (string? page-name)
    ;; Bug in original code, but doesn't affect the result
    ;; https://github.com/logseq/logseq/blob/1519e35e0c8308d8db90b2525bfe7a716c4cdf04/src/main/frontend/util.cljc#L892
    #_{:clj-kondo/ignore [:regex-checks/double-escaped-regex]}
    (let [normalize (fn [s] (.normalize s "NFC"))
          remove-boundary-slashes (fn [s] (when (string? s)
                                            (let [s (if (= \/ (first s))
                                                      (subs s 1)
                                                      s)]
                                              (if (= \/ (last s))
                                                (subs s 0 (dec (count s)))
                                                s))))
          page (some-> page-name
                       (remove-boundary-slashes)
                       ;; Windows reserved path characters
                       (string/replace #"[:\\*\\?\"<>|]+" "_")
                       ;; for android filesystem compatibility
                       (string/replace #"[\\#|%]+" "_")
                       (normalize))]
      (string/replace page #"/" "."))))

;; Rule of dir-ver 0 (after 2022 May)
;; Source: https://github.com/logseq/logseq/blob/e7110eea6790eda5861fdedb6b02c2a78b504cd9/src/main/frontend/util.cljc#L927
(defn legacy-url-file-name-sanity
  [page-name]
  (let [url-encode #(some-> % str (js/encodeURIComponent) (.replace "+" "%20"))]
    ;; Bug in original code, but doesn't affect the result
    ;; https://github.com/logseq/logseq/blob/1519e35e0c8308d8db90b2525bfe7a716c4cdf04/src/main/frontend/util.cljc#L892
    #_{:clj-kondo/ignore [:regex-checks/double-escaped-regex]}
    (some-> page-name
            gp-util/page-name-sanity
            ;; for android filesystem compatibility
            (string/replace #"[\\#|%]+" url-encode)
             ;; Windows reserved path characters
            (string/replace #"[:\\*\\?\"<>|]+" url-encode)
            (string/replace #"/" url-encode)
            (string/replace "*" "%2A"))))

;; Register sanitization / parsing fns in:
;; logseq.graph-parser.util (parsing only)
;; frontend.util.fs         (sanitization only)
;; frontend.handler.conversion (both)
(defn file-name-sanity
  ([title]
   (file-name-sanity title (state/get-filename-format)))
  ([title file-name-format]
   (when (string? title)
     (case file-name-format
       :triple-lowbar (tri-lb-file-name-sanity title)
       ;; The earliest file name rule (before May 2022). For file name check in the conversion logic only. Don't allow users to use this or show up in config, as it's not handled.
       :legacy-dot    (legacy-dot-file-name-sanity title)
       (legacy-url-file-name-sanity title)))))

(defn create-title-property?
  [page-name]
  (and (string? page-name)
       (let [filename-format (state/get-filename-format)
             file-name  (file-name-sanity page-name filename-format)
             page-name' (gp-util/title-parsing file-name filename-format)
             result     (or (not= page-name page-name')
                            (include-reserved-chars? file-name))]
         result)))
