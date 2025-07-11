(ns logseq.db.frontend.db
  "DB graph fns commonly used outside db dep"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.common.config :as common-config]
            [logseq.common.util.namespace :as ns-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.common.uuid :as common-uuid]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.frontend.property :as db-property]))

(defn built-in-class-property?
  "Whether property a built-in property for the specific class"
  [class-entity property-entity]
  (and (entity-util/built-in? class-entity)
       (entity-util/class? class-entity)
       (entity-util/built-in? property-entity)
       (contains? (set (get-in (db-class/built-in-classes (:db/ident class-entity)) [:schema :properties]))
                  (:db/ident property-entity))))

(defn private-built-in-page?
  "Private built-in pages should not be navigable or searchable by users. Later it
   could be useful to use this for the All Pages view"
  [page]
  (cond (entity-util/property? page)
        (not (db-property/public-built-in-property? page))
        (or (entity-util/class? page) (entity-util/internal-page? page))
        false
        ;; Default to true for closed value and future internal types.
        ;; Other types like whiteboard are not considered because they aren't built-in
        :else
        true))

(defn build-favorite-tx
  "Builds tx for a favorite block in favorite page"
  [favorite-uuid]
  {:block/link [:block/uuid favorite-uuid]
   :block/title ""})

(defn get-all-properties
  [db]
  (->> (d/datoms db :avet :block/tags :logseq.class/Property)
       (map (fn [d] (d/entity db (:e d))))))

(defn get-page-parents
  [node]
  (when-let [parent (:block/parent node)]
    (loop [current-parent parent
           parents' []]
      (if (and current-parent
               (not (contains? parents' current-parent)))
        (recur (:block/parent current-parent)
               (conj parents' current-parent))
        (vec (reverse parents'))))))

(defn- get-class-title-with-extends
  [entity]
  (let [parents' (->> (db-class/get-class-extends entity)
                      (remove (fn [e] (= :logseq.class/Root (:db/ident e))))
                      vec)]
    (string/join
     ns-util/parent-char
     (map :block/title (conj (vec parents') entity)))))

(defn get-title-with-parents
  [entity]
  (cond
    (entity-util/class? entity)
    (get-class-title-with-extends entity)

    (entity-util/page? entity)
    (let [parents' (->> (get-page-parents entity)
                        (remove (fn [e]
                                  (and (:logseq.property/built-in? e) (= common-config/library-page-name (:block/title e))))))]
      (string/join
       ns-util/parent-char
       (map :block/title (conj (vec parents') entity))))

    :else
    (:block/title entity)))

(defn get-classes-parents
  "Returns all parents of all classes. Like get-class-extends but for multiple classes"
  [tags]
  (let [tags' (filter entity-util/class? tags)
        result (mapcat db-class/get-class-extends tags')]
    (set result)))

(defn class-instance?
  "Whether `object` is an instance of `class`"
  [class object]
  (let [tags (:block/tags object)
        tags-ids (set (map :db/id tags))]
    (or
     (contains? tags-ids (:db/id class))
     (let [class-parent-ids (set (map :db/id (get-classes-parents tags)))]
       (contains? (set/union class-parent-ids tags-ids) (:db/id class))))))

(defn inline-tag?
  [block-raw-title tag]
  (assert (string? block-raw-title) "block-raw-title should be a string")
  (string/includes? block-raw-title (str "#" (page-ref/->page-ref (:block/uuid tag)))))

(defonce node-display-type-classes
  #{:logseq.class/Code-block :logseq.class/Math-block :logseq.class/Quote-block})

(defn get-class-ident-by-display-type
  [display-type]
  (case display-type
    :code :logseq.class/Code-block
    :math :logseq.class/Math-block
    :quote :logseq.class/Quote-block
    nil))

(defn get-display-type-by-class-ident
  [class-ident]
  (case class-ident
    :logseq.class/Code-block :code
    :logseq.class/Math-block :math
    :logseq.class/Quote-block :quote
    nil))

(defn get-built-in-page
  [db title]
  (when db
    (let [id (common-uuid/gen-uuid :builtin-block-uuid title)]
      (d/entity db [:block/uuid id]))))

(defn library?
  [page]
  (and (entity-util/built-in? page)
       (= common-config/library-page-name (:block/title page))))