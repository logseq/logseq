(ns logseq.db.frontend.content
  "Fns to handle block content e.g. internal ids"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [logseq.common.util :as common-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db.common.entity-util :as common-entity-util]))

;; [[uuid]]
(def id-ref-pattern
  (re-pattern
   (str
    "\\[\\["
    "("
    common-util/uuid-pattern
    ")"
    "\\]\\]")))

(defn content-id-ref->page
  "Convert id ref backs to page name using refs."
  [content refs]
  (reduce
   (fn [content ref]
     (if (:block/title ref)
       (string/replace content (page-ref/->page-ref (:block/uuid ref)) (:block/title ref))
       content))
   content
   refs))

(defn- sort-refs
  "Nested pages first"
  [refs]
  (sort-by
   (fn [ref]
     (when-let [title (and (map? ref) (:block/title ref))]
       [(boolean (re-find page-ref/page-ref-without-nested-re (:block/title ref)))
        title]))
   >
   refs))

(defn id-ref->title-ref
  "Convert id ref backs to page name refs using refs."
  [content* refs* & {:keys [replace-block-id?]
                     :or {replace-block-id? false}}]
  (when (string? content*)
    (let [refs (if replace-block-id?
               ;; The caller need to handle situations including
               ;; mutual references and circle references.
                 refs*
                 (filter common-entity-util/page? refs*))
          content (str content*)]
      (if (re-find id-ref-pattern content)
        (reduce
         (fn [content ref]
           (if (:block/title ref)
             (let [content' (if (not (string/includes? (:block/title ref) " "))
                              (string/replace content
                                              (str "#" (page-ref/->page-ref (:block/uuid ref)))
                                              (str "#" (:block/title ref)))
                              content)]
               (string/replace content' (page-ref/->page-ref (:block/uuid ref))
                               (page-ref/->page-ref (:block/title ref))))
             content))
         content
         (sort-refs refs))
        content))))

(defn get-matched-ids
  [content]
  (->> (re-seq id-ref-pattern content)
       (distinct)
       (map second)
       (map uuid)))

(defn- replace-tag-ref
  [content page-name id]
  (let [page (if (string/includes? page-name " ") (page-ref/->page-ref page-name) page-name)
        wrapped-id (page-ref/->page-ref id)
        page-name (common-util/format "#%s" page)
        r (common-util/format "#%s" wrapped-id)]
    ;; hash tag parsing rules https://github.com/logseq/mldoc/blob/701243eaf9b4157348f235670718f6ad19ebe7f8/test/test_markdown.ml#L631
    ;; Safari doesn't support look behind, don't use
    ;; TODO: parse via mldoc
    (string/replace content
                    (re-pattern (str "(?i)(^|\\s)(" (common-util/escape-regex-chars page-name) ")(?=[,\\.]*($|\\s))"))
                    ;;    case_insense^    ^lhs   ^_grp2                       look_ahead^         ^_grp3
                    (fn [[_match lhs _grp2 _grp3]]
                      (str lhs r)))))

(defn- replace-page-ref
  [content page-name id]
  (let [[page wrapped-id] (map page-ref/->page-ref [page-name id])]
    (common-util/replace-ignore-case content page wrapped-id)))

(defn- replace-page-ref-with-id
  [content page-name id replace-tag?]
  (let [page-name (-> (str page-name)
                      (string/replace "HashTag-" "#"))
        id (str id)
        content' (replace-page-ref content page-name id)]
    (if replace-tag?
      (replace-tag-ref content' page-name id)
      content')))

(defn title-ref->id-ref
  "Convert ref to id refs e.g. `[[page name]] -> [[uuid]]."
  [title refs & {:keys [replace-tag?]
                 :or {replace-tag? true}}]
  (assert (string? title))
  (let [refs' (->>
               (map
                (fn [ref]
                  (if (and (vector? ref) (= :block/uuid (first ref)))
                    {:block/uuid (second ref)
                     :block/title (str (first ref))}
                    ref))
                refs)
               sort-refs)]
    (reduce
     (fn [content {uuid' :block/uuid :block/keys [title] :as block}]
       (let [title' (or (:block.temp/original-page-name block) title)]
         (replace-page-ref-with-id content title' uuid' replace-tag?)))
     title
     (filter :block/title refs'))))

(defn update-block-content
  "Replace `[[internal-id]]` with `[[page name]]`"
  [db item eid]
  (if-let [content (:block/title item)]
    (let [refs (:block/refs (d/entity db eid))]
      (assoc item :block/title (id-ref->title-ref content refs)))
    item))

(defn replace-tags-with-id-refs
  "Replace tag names in content with page-ref ids e.g. #TAG -> [[UUID]].
   Ignore case because tags in content can have any case and still have a valid ref"
  [content tags]
  (->>
   (reduce
    (fn [content tag]
      (let [id-ref (page-ref/->page-ref (:block/uuid tag))]
        (-> content
            ;; #[[favorite book]]
            (common-util/replace-ignore-case
             (str "#" (page-ref/->page-ref (:block/title tag)))
             id-ref)
            ;; #book
            (common-util/replace-ignore-case (str "#" (:block/title tag)) id-ref))))
    content
    (sort-refs tags))
   (string/trim)))

(defn replace-tag-refs-with-page-refs
  "Replace tag refs in content with page refs e.g. #[[UUID]] -> [[UUID]]"
  [content tags]
  (->>
   (reduce
    (fn [content tag]
      (let [id-ref (page-ref/->page-ref (:block/uuid tag))]
        (-> content
            ;; #[[favorite book]]
            (common-util/replace-ignore-case
             (str "#" id-ref)
             id-ref)
            ;; #book
            (common-util/replace-ignore-case (str "#" id-ref) id-ref))))
    content
    (sort-refs tags))
   (string/trim)))

(defn recur-replace-uuid-in-block-title
  "Convert id ref (recursively) backs to page name refs, returns replaced title"
  ([ent]
   (recur-replace-uuid-in-block-title ent 10))
  ([ent max-depth]
   (if (some->> (:block/title ent) (re-find id-ref-pattern))
     (let [ref-set (loop [result-refs (:block/refs ent)
                          current-refs (:block/refs ent)
                          depth 0]
                     (if (or (>= depth max-depth) (empty? current-refs))
                       result-refs
                       (let [next-refs (set (mapcat :block/refs current-refs))
                             result-refs' (apply conj result-refs next-refs)]
                         (if (= (count result-refs') (count result-refs))
                           result-refs
                           (recur (apply conj result-refs next-refs) next-refs (inc depth))))))
           opts {:replace-block-id? true}]
       (loop [result (id-ref->title-ref (:block/title ent) ref-set opts)
              last-result nil
              depth 0]
         (if (or (>= depth max-depth)
                 (= last-result result))
           result
           (recur (id-ref->title-ref result ref-set opts) result (inc depth)))))
     (:block/title ent))))
