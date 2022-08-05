;; Convert data on updating from earlier version of Logseq on demand

(ns frontend.handler.conversion
  (:require [clojure.string :as string]
            [promesa.core :as p]
            [goog.string :as gstring]
            [logseq.graph-parser.util :as gp-util]
            [frontend.idb :as idb]
            [frontend.util.fs :as fs-util]
            [frontend.state :as state]
            [frontend.version :refer [dir-version]]
            [frontend.handler.config :refer [set-config!]]))

(defn dir-stale?
  [repo]
  (not= (state/get-dir-version repo) dir-version))

(defn index-stale?
  "Index version need to match up with the dir version
   or it's the case that file is updated but index is staled."
  [repo]
  (p/let [val (idb/get-item (str "index-version/" repo))]
         (< val (state/get-dir-version repo))))

(defn write-dir-version!
  "Version for tracking if conversion is required.
   Write version when dir is converted.
   Return:
     Promise <void>"
  [repo]
  (js/console.log (str "Writing dir version " dir-version " of repo " repo))
  (set-config! :repo/dir-version dir-version))

;; TODO: move to some where suitable to avoid cyclic dependency
(defn write-index-version!
  "Version for tracking if re-index is required.
   Write version when re-index happened and persisted to disk.
   Save it to iDB instead of config to avoid sync across devices, as re-index
   is required on every device.
   Write the current dir version in config, as the index is the parsing result of the dir content"
  [repo]
  (js/console.log (str "Writing index version " (state/get-dir-version repo) " of repo " repo))
  (idb/set-item! (str "index-version/" repo) (state/get-dir-version repo)))

;; Rule of dir-ver 0
;; Source: https://github.com/logseq/logseq/blob/e7110eea6790eda5861fdedb6b02c2a78b504cd9/deps/graph-parser/src/logseq/graph_parser/extract.cljc#L35
(defn legacy-title-parsing
  [file-name-body]
  (js/decodeURIComponent (string/replace file-name-body "." "/")))

;; Rule of dir-ver 0 (before 2022 May)
;; Source: https://github.com/logseq/logseq/blob/1519e35e0c8308d8db90b2525bfe7a716c4cdf04/src/main/frontend/util.cljc#L930
(defn- legacy-dot-file-name-sanity
  [page-name]
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
                      ;; for android filesystem compatiblity
                     (string/replace #"[\\#|%]+" "_")
                     (normalize))]
    (string/replace page #"/" ".")))

;; Rule of dir-ver 0 (after 2022 May)
;; Source: https://github.com/logseq/logseq/blob/e7110eea6790eda5861fdedb6b02c2a78b504cd9/src/main/frontend/util.cljc#L927
(defn- legacy-url-file-name-sanity
  [page-name]
  (let [url-encode #(some-> % str (js/encodeURIComponent) (.replace "+" "%20"))]
    (some-> page-name
            gp-util/page-name-sanity
             ;; for android filesystem compatiblity
            (string/replace #"[\\#|%]+" url-encode)
             ;; Windows reserved path characters
            (string/replace #"[:\\*\\?\"<>|]+" url-encode)
            (string/replace #"/" url-encode)
            (string/replace "*" "%2A"))))

(defn- calc-current-name
  "If the file body is parsed as the same page name, but the page name has a 
   different file sanitization result under the current sanitization form, return 
   the new file name.
   Return: 
     the file name for the page name under the current file naming rules, or `nil`
     if no change of path happens"
  [file-body prop-title]
  (let [page-name        (or prop-title
                             (gp-util/title-parsing file-body))
        cur-file-body (fs-util/file-name-sanity page-name)]
    (when-not (= file-body cur-file-body)
      cur-file-body)))

(defn- calc-previous-name
  "We want to recover user's title back under new file name sanity rules.
   Return: 
     the file name for that page name under the current file naming rules, or `nil`
     if no break change happens"
  [file-body prop-title old-parsing-fn]
  (let [new-title (gp-util/title-parsing file-body) ;; Rename even the prop-title is provided.
        old-title (or prop-title
                      (old-parsing-fn file-body))]
    (when (not= new-title old-title)
      (fs-util/file-name-sanity old-title))))

(defn- is-dir-ver-3-result?
  [file-body]
  (or (string/includes? file-body "__")
      (not= file-body (gstring/unescapeEntities file-body))))

(defn- is-dir-ver-3-manual-title-prop?
  [file-body prop-title]
  (when prop-title
    (and (not= file-body (legacy-url-file-name-sanity prop-title))
         (not= file-body (legacy-dot-file-name-sanity prop-title)))))

(defn calc-dir-ver-3-rename-target
  "prop-title - might be nil"
  [file-body prop-title]
  ;; special rule for version 3:
  ;;   1) don't rename the hls files
  ;;     keep `hls__` in file and use `hls/` as the title prefix
  ;;     don't do conversion on the following body, as the previous
  ;;     pdf name handling is buggy
  ;;   2) avoid cycle conversion 
  ;;     don't show items that likely to be converted 
  ;;     (with `_0x` or `__` included)
  ;;   3) prop title also creates `__` likely, and it will not cause cycle conversion
  ;;     so always pass if `prop-title` provides
  (when (and (not (is-dir-ver-3-manual-title-prop? file-body prop-title))
             (not (string/starts-with? file-body "hls__")))
    (or (when (or prop-title
                  (not (is-dir-ver-3-result? file-body)))
          (calc-previous-name file-body prop-title legacy-title-parsing))
        ;; if no break-change conversion triggered, check if file name is in an informal / outdated style.
        (calc-current-name file-body prop-title))))

(defn calc-rename-target
  "Return the new file body to recover the original title of the file in previous version. 
   The return title should be the same as the title in the index file in the previous version.
   It's the 'expected' title of the user when updating from the last version.
   If it's not a break-change, but an informal one, return the formal one.
   Otherwise, return `nil`.
   repo: the target repo
   page: the page entity
   path: the path of the file of the page"
  [repo page path]
  (let [prop-title (get-in page [:block/properties :title])
        file-body  (gp-util/path->file-body path)
        journal?   (:block/journal? page)]
    ;; dont rename journal page. officially it's stored as `yyyy_mm_dd`
    ;; Warning: If it's a journal file imported with custom :journal/page-title-format,
    ;;   and it includes reserved characters, format config change / file renaming is required. 
    ;;   It's about user's own data management decision and should be handled
    ;;   by user manually.
    (when (not journal?)
      (cond (< (state/get-dir-version repo) 3)
            (calc-dir-ver-3-rename-target file-body prop-title)
            ;; placeholder for future breaking change rules. From low to high version. 
            :else
            nil))))
