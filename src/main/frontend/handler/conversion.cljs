;; Convert data on updating from earlier version of Logseq on demand

(ns frontend.handler.conversion
  "For conversion logic between old version and new version"
  (:require [logseq.graph-parser.util :as gp-util]
            [frontend.util.fs :as fs-util]
            [frontend.handler.config :refer [set-config!]]
            [frontend.util :as util]))

(defn write-filename-format!
  "Return:
     Promise <void>"
  [repo format]
  (js/console.log (str "Writing character escaping format " format " of repo " repo))
  (set-config! :file/name-format format))

(defn- calc-current-name
  "If the file body is parsed as the same page name, but the page name has a
   different file sanitization result under the current sanitization form, return
   the new file name.
   Return:
     the file name for the page name under the current file naming rules, or `nil`
     if no change of path happens"
  [format file-body prop-title]
  (let [page-title    (or prop-title
                          (gp-util/title-parsing file-body format))
        cur-file-body (fs-util/file-name-sanity page-title format)]
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
  [old-format new-format file-body]
  (let [new-title (gp-util/title-parsing file-body new-format) ;; Rename even the prop-title is provided.
        old-title (gp-util/title-parsing file-body old-format)
        target    (fs-util/file-name-sanity old-title new-format)]
    (when (not= new-title old-title)
      (if (not= target file-body)
        {:status        :breaking
         :target        target
         :old-title     old-title
         :changed-title new-title}
        ;; Even the same file body are producing mismatched titles - it's unreachable!
        {:status        :unreachable
         :target        target
         :old-title     old-title
         :changed-title new-title}))))

;; Register sanitization / parsing fns in:
;; logseq.graph-parser.util (parsing only)
;; frontend.util.fs         (sanitization only)
;; frontend.handler.conversion (both)
;;   - the special rule in `is-manual-title-prop?`
(defonce supported-filename-formats [:triple-lowbar :legacy])

(defn- is-manual-title-prop?
  "If it's an user defined title property instead of the generated one"
  [format file-body prop-title]
  (if prop-title
    (not (or (= file-body (fs-util/file-name-sanity prop-title format))
             (when (= format :legacy)
               (= file-body (fs-util/file-name-sanity prop-title :legacy-dot)))))
    false))

(defn- calc-rename-target-impl
  [old-format new-format file-body prop-title]
  ;; dont rename journal page. officially it's stored as `yyyy_mm_dd`
  ;; If it's a journal file imported with custom :journal/page-title-format,
  ;;   and it includes reserved characters, format config change / file renaming is required.
  ;;   It's about user's own data management decision and should be handled
  ;;   by user manually.
  ;; the 'expected' title of the user when updating from the previous format, or title will be broken in new format
  (let [ret (or (when (and (nil? prop-title)
                           (not= old-format new-format))
                  (calc-previous-name old-format new-format file-body))
                 ;; if no break-change conversion triggered, check if file name is in an informal / outdated style.
                (calc-current-name new-format file-body prop-title))]
    (when (and ret
               ;; Return only when the target is different from the original file body, not only capitalization difference
               (not= (util/page-name-sanity-lc (:target ret))
                     (util/page-name-sanity-lc file-body)))
      ret)))

(defn calc-rename-target
  "Return the renaming status and new file body to recover the original title of the file in previous version.
   The return title should be the same as the title in the index file in the previous version.
   return nil if no rename is needed.
   page: the page entity
   path: the path of the file of the page
   old-format, new-format: the filename formats
   Return:
     {:status        :informal | :breaking | :unreachable
      :file-name original file name
      :target        the new file name
      :old-title     the old title
      :changed-title the new title} | nil"
  [page path old-format new-format]
  (let [prop-title (get-in page [:block/properties :title])
        file-body  (gp-util/path->file-body path)
        journal?   (:block/journal? page)
        manual-prop-title? (is-manual-title-prop? old-format file-body prop-title)]
    (cond
      (and (not journal?)
           (not manual-prop-title?))
      (calc-rename-target-impl old-format new-format file-body prop-title)

      (and (not journal?)
           manual-prop-title?
           (fs-util/include-reserved-chars? file-body))
      {:status        :informal
       :file-name     file-body
       :target        (fs-util/file-name-sanity file-body new-format)
       :old-title     prop-title
       :changed-title prop-title})))
