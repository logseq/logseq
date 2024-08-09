(ns frontend.common.file.util
  "File name fns. Used by worker and frontend namespaces"
  (:require [clojure.string :as string]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]))

;; Update repo/invalid-graph-name-warning if characters change
(def multiplatform-reserved-chars ":\\*\\?\"<>|\\#\\\\")

(def reserved-chars-pattern
  (re-pattern (str "[" multiplatform-reserved-chars "]+")))

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
          common-util/page-name-sanity ;; we want to preserve the case sensitive nature of most file systems, don't lowercase
          (string/replace common-util/url-encoded-pattern encode-url-percent) ;; pre-encode % in title on demand
          (string/replace reserved-chars-pattern url-encode-file-name)
          (escape-windows-reserved-filebodies) ;; do this before the lowbar encoding to avoid ambiguity
          (escape-namespace-slashes-and-multilowbars)))

;; Register sanitization / parsing fns in:
;; logseq.common.util (parsing only)
;; frontend.util.fs         (sanitization only)
(defn file-name-sanity
  [title]
  (when (string? title)
    (tri-lb-file-name-sanity title)))

(defn include-reserved-chars?
  "Includes reserved characters that would broken FS"
  [s]
  (common-util/safe-re-find reserved-chars-pattern s))

;; A fast pprint alternative.
(defn print-prefix-map* [prefix m print-one writer opts]
  (pr-sequential-writer
    writer
    (fn [e w opts]
      (print-one (key e) w opts)
      (-write w \space)
      (print-one (val e) w opts))
    (str prefix "\n{") \newline "}"
    opts (seq m)))

(defn ugly-pr-str
  "Ugly printing fast, with newlines so that git diffs are smaller"
  [x]
  (with-redefs [print-prefix-map print-prefix-map*]
    (pr-str x)))

(defn post-message
  [type data]
  (when (exists? js/self)
    (.postMessage js/self (ldb/write-transit-str [type data]))))