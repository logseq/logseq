(ns logseq.db.frontend.content
  "Fns to handle block content e.g. special ids"
  (:require [clojure.string :as string]
            [logseq.common.util.page-ref :as page-ref]
            [datascript.core :as d]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.common.util :as common-util]))

(defonce page-ref-special-chars "~^")

(defonce special-id-ref-pattern
  (re-pattern
   (str
    "(?i)"
    "~\\^"
    "("
    common-util/uuid-pattern
    ")")))

(defn special-id-ref->page
  "Convert special id ref backs to page name using refs."
  [content refs]
  (reduce
   (fn [content ref]
     (if (:block/name ref)
       (-> content
           (string/replace (str page-ref/left-brackets
                                page-ref-special-chars
                                (:block/uuid ref)
                                page-ref/right-brackets)
                           (:block/original-name ref))
           (string/replace
                (str "#" page-ref-special-chars
                     (:block/uuid ref))
                (str "#" (:block/original-name ref))))
       content))
   content
   refs))

(defn special-id-ref->page-ref
  "Convert special id ref backs to page name refs using refs."
  [content* refs]
  (let [content (str content*)]
    (if (or (string/includes? content (str page-ref/left-brackets page-ref-special-chars))
            (string/includes? content (str "#" page-ref-special-chars)))
      (reduce
       (fn [content ref]
         (if (:block/name ref)
           (-> content
               ;; Replace page refs
               (string/replace
                (str page-ref/left-brackets
                     page-ref-special-chars
                     (:block/uuid ref)
                     page-ref/right-brackets)
                (page-ref/->page-ref (:block/original-name ref)))
               ;; Replace tags
               (string/replace
                (str "#" page-ref-special-chars
                     (:block/uuid ref))
                (str "#" (:block/original-name ref))))

           content))
       content
       refs)
      content)))

(defn get-matched-special-ids
  [content]
  (->> (re-seq special-id-ref-pattern content)
       (distinct)
       (map second)
       (map uuid)))

(defn page-ref->special-id-ref
  "Convert page ref to special id refs e.g. `[[page name]] -> [[~^...]].
   TODO: Merge with db-editor-handler/replace-page-refs-with-ids when possible"
  [content refs]
  (reduce
   (fn [content ref]
     (string/replace content
                     (str page-ref/left-brackets
                          (:block/original-name ref)
                          page-ref/right-brackets)
                     (str page-ref/left-brackets
                          page-ref-special-chars
                          (:block/uuid ref)
                          page-ref/right-brackets)))
   content
   refs))

(defn update-block-content
  "Replace `[[internal-id]]` with `[[page name]]`"
  [repo db item eid]
  (if (sqlite-util/db-based-graph? repo)
    (if-let [content (:block/content item)]
      (let [refs (:block/refs (d/entity db eid))]
        (assoc item :block/content (special-id-ref->page-ref content refs)))
      item)
    item))

(defn content-without-tags
  "Remove tags from content"
  [content tags]
  (->
   (reduce
    (fn [content tag]
      (-> content
          (string/replace (str "#" tag " ") "")
          (string/replace (str "#" tag) "")
          (string/replace (str "#" page-ref/left-brackets tag page-ref/right-brackets " ") "")
          (string/replace (str "#" page-ref/left-brackets tag page-ref/right-brackets) "")))
    content
    tags)
   (string/trim)))

(defn replace-tags-with-page-refs
  "Replace tags in content with page-ref ids. Ignore case because tags in
  content can have any case and still have a valid ref"
  [content tags]
  (reduce
   (fn [content tag]
     (common-util/replace-ignore-case
      content
      (str "#" (:block/original-name tag))
      (str page-ref/left-brackets
           page-ref-special-chars
           (:block/uuid tag)
           page-ref/right-brackets)))
   content
   (sort-by :block/original-name > tags)))
