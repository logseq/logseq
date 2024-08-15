(ns logseq.db.frontend.content
  "Fns to handle block content e.g. special ids"
  (:require [clojure.string :as string]
            [logseq.common.util.page-ref :as page-ref]
            [datascript.core :as d]
            [logseq.common.util :as common-util]
            [logseq.db.frontend.entity-util :as entity-util]))

(defonce page-ref-special-chars "~^")

(defonce special-id-ref-pattern
  (re-pattern
   (str
    "(?i)"
    "~\\^"
    "("
    common-util/uuid-pattern
    ")")))

(defn block-id->special-id-ref
  [id]
  (str page-ref/left-brackets
       page-ref-special-chars
       id
       page-ref/right-brackets))

(defn special-id-ref->page
  "Convert special id ref backs to page name using refs."
  [content refs]
  (reduce
   (fn [content ref]
     (if (:block/title ref)
       (-> content
           (string/replace (block-id->special-id-ref (:block/uuid ref))
                           (:block/title ref))
           (string/replace
                (str "#" page-ref-special-chars
                     (:block/uuid ref))
                (str "#" (:block/title ref))))
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
         (if (:block/title ref)
           (-> content
               ;; Replace page refs
               (string/replace
                (str page-ref/left-brackets
                     page-ref-special-chars
                     (:block/uuid ref)
                     page-ref/right-brackets)
                (page-ref/->page-ref (:block/title ref)))
               ;; Replace tags
               (string/replace
                (str "#" page-ref-special-chars
                     (:block/uuid ref))
                (str "#" (:block/title ref))))

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
     (-> content
         (string/replace (str page-ref/left-brackets (:block/title ref) page-ref/right-brackets)
                         (str page-ref/left-brackets page-ref-special-chars (:block/uuid ref) page-ref/right-brackets))))
   content
   refs))

(defn update-block-content
  "Replace `[[internal-id]]` with `[[page name]]`"
  [db item eid]
  (if (entity-util/db-based-graph? db)
    (if-let [content (:block/title item)]
      (let [refs (:block/refs (d/entity db eid))]
        (assoc item :block/title (special-id-ref->page-ref content refs)))
      item)
    item))

(defn replace-tags-with-page-refs
  "Replace tags in content with page-ref ids. Ignore case because tags in
  content can have any case and still have a valid ref"
  [content tags]
  (->>
   (reduce
    (fn [content tag]
      (let [id-ref (block-id->special-id-ref (:block/uuid tag))]
        (-> content
           ;; #[[favorite book]]
            (common-util/replace-ignore-case
             (str "#" page-ref/left-brackets (:block/title tag) page-ref/right-brackets)
             id-ref)
          ;; #book
            (common-util/replace-ignore-case (str "#" (:block/title tag)) id-ref))))
    content
    (sort-by :block/title > tags))
   (string/trim)))
