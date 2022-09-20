;; Convert data on updating from earlier version of Logseq on demand

(ns frontend.handler.conversion
  (:require [clojure.string :as string]
            [logseq.graph-parser.util :as gp-util]
            [frontend.util.fs :as fs-util]
            [frontend.handler.config :refer [set-config!]]))

(defonce filename-formats {:double-lowbar {:parsing-fn gp-util/title-parsing
                                           :sanity-fn  fs-util/file-name-sanity}
                           :legacy        {:parsing-fn gp-util/legacy-title-parsing
                                           :sanity-fn  fs-util/legacy-url-file-name-sanity
                                           :oudated-sanity-fn fs-util/legacy-dot-file-name-sanity}})

(defonce supported-filename-formats (keys filename-formats))

(defn write-filename-format!
  "Return:
     Promise <void>"
  [repo format]
  (js/console.log (str "Writing character escaping format " format " of repo " repo))
  (set-config! repo :file/name-format format))

(defn- calc-current-name
  "If the file body is parsed as the same page name, but the page name has a 
   different file sanitization result under the current sanitization form, return 
   the new file name.
   Return: 
     the file name for the page name under the current file naming rules, or `nil`
     if no change of path happens"
  [format file-body prop-title]
  (let [page-title    (or prop-title
                          ((get-in filename-formats [format :parsing-fn]) file-body))
        cur-file-body ((get-in filename-formats [format :sanity-fn]) page-title)]
    (when-not (= file-body cur-file-body)
      {:status        :informal
       :target        cur-file-body
       :old-title     page-title
       :changed-title page-title})))

(defn- calc-previous-name
  "We want to recover user's title back under new file name sanity rules.
   Return: 
     the file name for that page name under the current file naming rules,
     and the new title if no action applied, or `nil` if no break change happens"
  [old-format new-format file-body prop-title]
  (let [new-title ((get-in filename-formats [new-format :parsing-fn]) file-body) ;; Rename even the prop-title is provided.
        old-title ((get-in filename-formats [old-format :parsing-fn]) file-body)
        target    ((get-in filename-formats [new-format :sanity-fn]) old-title)]
    (when (not= new-title old-title)
      (if (not= target file-body)
        {:status        :breaking
         :target        target
         :old-title     old-title
         :changed-title new-title}
        ;; Even the same file body are producing mis-matched titles - it's unreachable!
        (if (nil? prop-title)
          {:status        :unreachable
           :target        target
           :old-title     old-title
           :changed-title new-title}
          ;; If property title is provided, it's fine.
          {:status        :informal
           :target        target
           :old-title     old-title
           :changed-title old-title})))))

(defn- is-manual-title-prop?
  "If it's an user defined title property instead of the generated one"
  [format file-body prop-title]
  (if prop-title
    (not (or (= file-body ((get-in filename-formats [format :sanity-fn]) prop-title))
             (when-let [sanity-fn (get-in filename-formats [format :outdated-sanity-fn])]
               (= file-body (sanity-fn prop-title)))))
    false))

(defn calc-rename-target
  "Return the renaming status and new file body to recover the original title of the file in previous version. 
   The return title should be the same as the title in the index file in the previous version.
   return nil if no rename is needed.
   page: the page entity
   path: the path of the file of the page
   old-format, new-format: the filename formats
   Return:
     {:status        :informal | :breaking
      :target        the new file name
      :old-title     the old title
      :chagned-title the new title} | nil"
  [page path old-format new-format]
  (let [prop-title (get-in page [:block/properties :title])
        file-body  (gp-util/path->file-body path)
        journal?   (:block/journal? page)]
    ;; dont rename journal page. officially it's stored as `yyyy_mm_dd`
    ;; If it's a journal file imported with custom :journal/page-title-format,
    ;;   and it includes reserved characters, format config change / file renaming is required. 
    ;;   It's about user's own data management decision and should be handled
    ;;   by user manually.
    ;; Don't rename the hls files
    ;;   keep `hls__` in file and use `hls/` as the title prefix
    ;;   don't do conversion on the following body, as the previous
    ;;   pdf name handling is buggy
    (when (and (not journal?)
               (not (string/starts-with? file-body "hls__"))
               (not (is-manual-title-prop? old-format file-body prop-title)))
      ;; the 'expected' title of the user when updating from the previous format, or title will be broken in new format
      (or (when (and (not= old-format new-format) (nil? prop-title))
            (calc-previous-name old-format new-format file-body prop-title))
      ;; if no break-change conversion triggered, check if file name is in an informal / outdated style.
          (calc-current-name new-format file-body prop-title)))))
