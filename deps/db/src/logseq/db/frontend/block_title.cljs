(ns logseq.db.frontend.block-title
  "Shared block title formatting for DB graph entities."
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.common.util.namespace :as ns-util]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.db :as db-db]
            [logseq.db.frontend.entity-util :as entity-util]))

(defn- resolve-entity
  [db lookup-ref]
  (when db
    (d/entity db lookup-ref)))

(defn- needs-resolved-block?
  [block]
  (or (nil? (:block/title block))
      (entity-util/class? block)
      (some number? (:block/tags block))))

(defn- resolve-block
  [db block]
  (cond
    (de/entity? block)
    block

    (and (needs-resolved-block? block)
         (number? (:db/id block)))
    (or (resolve-entity db (:db/id block)) block)

    (and (needs-resolved-block? block)
         (uuid? (:block/uuid block)))
    (or (resolve-entity db [:block/uuid (:block/uuid block)]) block)

    :else
    block))

(defn- class-title-conflicts?
  [db class-entity]
  (let [class-title (:block/title class-entity)
        class-id (:db/id class-entity)]
    (when (and db class-title class-id)
      (boolean
       (d/q '[:find ?other .
              :in $ ?class-title ?class-id
              :where
              [?other :block/title ?class-title]
              [?other :block/tags :logseq.class/Tag]
              [(not= ?other ?class-id)]
              (not [?other :logseq.property/deleted-at])]
            db class-title class-id)))))

(defn- class-title-with-extends
  [class-entity title]
  (let [extends (some->> (:logseq.property.class/extends class-entity)
                         (remove (fn [extend]
                                   (or (:logseq.property/built-in? extend)
                                       (= (:block/title class-entity) (:block/title extend)))))
                         vec)]
    (if (seq extends)
      (str (if (= 1 (count extends))
             (:block/title (first extends))
             (->> (take 2 extends)
                  (map :block/title)
                  (string/join " | ")))
           ns-util/parent-char
           title)
      title)))

(defn- resolve-tag
  [db tag]
  (if (number? tag)
    (resolve-entity db tag)
    tag))

(defn block-unique-title
  "Return a display title that disambiguates duplicate class titles and appends
  user-visible tags.

  `title` may be supplied when a caller has already prepared a display title,
  such as a search snippet with highlight markers."
  [db block {:keys [with-tags? alias truncate? title]
             :or {with-tags? true
                  truncate? true}}]
  (let [block-e (resolve-block db block)]
    (if (entity-util/built-in? block-e)
      (:block/title block-e)
      (let [class? (entity-util/class? block-e)
            tags (when (and with-tags? (not class?))
                   (remove (fn [tag]
                             (or (some-> (:block/raw-title block-e) (db-db/inline-tag? tag))
                                 (db-class/private-tags (:db/ident tag))))
                           (map #(resolve-tag db %) (or (:block/tags block)
                                                        (:block/tags block-e)))))
            base-title (if class?
                         (let [display-title (or title (:block/title block-e))]
                           (if (class-title-conflicts? db block-e)
                             (class-title-with-extends block-e display-title)
                             display-title))
                         (or title (:block/title block-e)))
            trunc-title (if (and truncate? base-title (> (count base-title) 256))
                          (subs base-title 0 256)
                          base-title)
            title (if (seq tags)
                    (str (or trunc-title "")
                         " "
                         (string/join
                          ", "
                          (keep (fn [tag]
                                  (when-let [title (:block/title tag)]
                                    (str "#" title)))
                                tags)))
                    trunc-title)]
        (when title
          (str title
               (when alias
                 (str " -> alias: " alias))))))))
