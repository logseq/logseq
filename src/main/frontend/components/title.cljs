(ns frontend.components.title
  (:require [clojure.string :as string]
            [frontend.db :as db]
            [logseq.db :as ldb]
            [datascript.impl.entity :as de]))

(defn block-unique-title
  "Multiple pages/objects may have the same `:block/title`.
   Notice: this doesn't prevent for pages/objects that have the same tag or created by different clients."
  [block]
  (let [block-e (cond
                  (de/entity? block)
                  block
                  (uuid? (:block/uuid block))
                  (db/entity [:block/uuid (:block/uuid block)])
                  :else
                  block)
        tags (remove (fn [t] (some-> (:block/raw-title block-e) (ldb/inline-tag? t)))
                     (map (fn [tag] (if (number? tag) (db/entity tag) tag)) (:block/tags block)))]
    (if (and (seq tags)
             (not (ldb/journal? block)))
      (str (:block/title block)
           " "
           (string/join
            ", "
            (keep (fn [tag]
                    (when-let [title (:block/title tag)]
                      (str "#" title)))
                  tags)))
      (:block/title block))))
