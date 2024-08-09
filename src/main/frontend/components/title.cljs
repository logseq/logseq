(ns frontend.components.title
  (:require [clojure.string :as string]
            [frontend.db :as db]))

(defn block-unique-title
  "Multiple pages/objects may have the same `:block/title`.
   Notice: this doesn't prevent for pages/objects that have the same tag or created by different clients."
  [block]
  (if (seq (:block/tags block))
    (str (:block/title block)
         " "
         (string/join
          ", "
          (keep (fn [tag]
                  (let [tag (if (number? tag)
                              (db/entity tag)
                              tag)]
                    (when-let [title (:block/title tag)]
                      (str "#" title))))
                (:block/tags block))))
    (:block/title block)))
