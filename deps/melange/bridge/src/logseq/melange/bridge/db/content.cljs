(ns logseq.melange.bridge.db.content
  "DB content representation boundary."
  (:require ["@logseq/melange-js-api/db" :as melange-db]
            [logseq.melange.bridge.platform.datascript :as d]
            [logseq.melange.bridge.runtime :as runtime]))

(def ^:private content-workflow (.-ContentWorkflow melange-db))

(defn contains-id-ref?
  "Returns whether `content` contains a lowercase canonical internal ID reference."
  [content]
  ((.-containsUuidRefWith content-workflow)
   (runtime/runtime-adapter)
   content))

(defn get-matched-ids
  "Returns distinct UUID values referenced by `content` in encounter order."
  [content]
  ((.-matchedIdsWith content-workflow)
   (runtime/runtime-adapter)
   content))

(defn content-id-ref->page
  "Replaces internal page references in `content` with titles from `refs`."
  [content refs]
  ((.-contentIdRefToPageWith content-workflow)
   (runtime/runtime-adapter)
   (d/adapter)
   content
   refs))

(defn replace-tags-with-id-refs
  "Replaces tag names in `content` with internal page-reference IDs from `tags`."
  [content tags]
  ((.-replaceTagsWithIdRefsWith content-workflow)
   (runtime/runtime-adapter)
   (d/adapter)
   content
   tags))

(defn replace-tag-refs-with-page-refs
  "Removes the tag prefix from internal page references in `content` for `tags`."
  [content tags]
  ((.-replaceTagRefsWithPageRefsWith content-workflow)
   (runtime/runtime-adapter)
   (d/adapter)
   content
   tags))

(defn title-ref->id-ref
  "Converts page and tag references in `title` to internal IDs from `refs`."
  [title refs & {:keys [replace-tag?]
                 :or {replace-tag? true}}]
  ((.-replaceTitleRefsWith content-workflow)
   (runtime/runtime-adapter)
   (d/adapter)
   title
   refs
   replace-tag?))

(defn recur-replace-uuid-in-block-title
  "Converts internal ID references in `ent` titles to page titles recursively."
  ([ent]
   (recur-replace-uuid-in-block-title ent 10))
  ([ent max-depth]
   (recur-replace-uuid-in-block-title ent max-depth {}))
  ([ent max-depth {:keys [replace-block-refs?]
                   :or {replace-block-refs? true}}]
   ((.-replaceUuidInBlockTitleWith content-workflow)
    (runtime/runtime-adapter)
    (d/adapter)
    ent
    max-depth
    replace-block-refs?)))

(defn id-ref->title-ref
  "Converts internal ID references in `content` to titles from `refs`."
  [content refs & {:keys [db replace-block-id? replace-pages-with-same-name?]
                   :or {replace-block-id? false
                        replace-pages-with-same-name? true}}]
  ((.-idRefToTitleRefWith content-workflow)
   (runtime/runtime-adapter)
   (d/adapter)
   content
   refs
   db
   replace-block-id?
   replace-pages-with-same-name?))

(defn update-block-content
  "Replaces internal IDs in the title of `item` using the entity at `eid`."
  [db item eid]
  ((.-updateBlockContentWith content-workflow)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   item
   eid))
