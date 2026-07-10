(ns frontend.worker.handler.property
  "Property and class operations for the db worker."
  (:require [datascript.core :as d]
            [frontend.common.thread-api :refer [def-thread-api]]
            [frontend.worker.plain-value :as worker-plain]
            [frontend.worker.state :as worker-state]
            [logseq.db :as ldb]
            [logseq.db.common.view :as db-view]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.entity-util :as entity-util]))

(defn get-all-classes
  [db {:keys [except-root-class? except-private-tags? except-extends-hidden-tags?]
       :or {except-root-class? false
            except-private-tags? true
            except-extends-hidden-tags? false}}]
  (let [classes (->> (d/datoms db :avet :block/tags :logseq.class/Tag)
                     (map (fn [datom]
                            (d/entity db (:e datom))))
                     (remove ldb/recycled?)
                     (remove (fn [class]
                               (and except-private-tags?
                                    (contains? ldb/private-tags (:db/ident class)))))
                     (remove (fn [class]
                               (and except-extends-hidden-tags?
                                    (contains? ldb/extends-hidden-tags (:db/ident class))))))]
    (cond->> classes
      except-root-class?
      (remove #(= :logseq.class/Root (:db/ident %)))

      true
      (map entity-util/entity->map))))

(defn class-extends-children-tree
  ([db class-id]
   (class-extends-children-tree db class-id #{}))
  ([db class-id seen]
   (when-not (contains? seen class-id)
     (let [seen' (conj seen class-id)]
       (->> (d/datoms db :avet :logseq.property.class/extends class-id)
            (keep (fn [datom]
                    (when-let [child (d/entity db (:e datom))]
                      (assoc (select-keys (entity-util/entity->map child)
                                          [:db/id :block/title :block/uuid :db/ident])
                             :class/children
                             (class-extends-children-tree db (:e datom) seen')))))
            (sort-by :block/title)
            vec)))))

(def ^:private broad-scoped-node-class-idents
  #{:logseq.class/Page})

(defn- broad-scoped-node-property?
  [property classes]
  (and (= :node (:logseq.property/type property))
       (some #(contains? broad-scoped-node-class-idents (:db/ident %)) classes)))

(defn- property-node-selector-initial-choices
  [db property non-root-classes option]
  (cond
    (= :property (:logseq.property/type property))
    nil

    (seq non-root-classes)
    (if (broad-scoped-node-property? property non-root-classes)
      (db-view/get-property-values db (:db/ident property) option)
      (->> non-root-classes
           (mapcat (fn [class] (db-class/get-class-objects db (:db/id class))))
           distinct
           (mapv #(worker-plain/worker-plain-value db %))))

    :else
    (db-view/get-property-values db (:db/ident property) option)))

(defn property-node-selector-data
  [db {:keys [property block] :as option}]
  (let [all-classes (get-all-classes db {:except-root-class? false
                                         :except-private-tags? false})
        class-options (get-all-classes db {:except-root-class? true
                                           :except-private-tags? (not (contains? #{:logseq.property/template-applied-to}
                                                                                 (:db/ident property)))})
        extends-class-options (get-all-classes db {:except-extends-hidden-tags? true})
        classes (:logseq.property/classes property)
        class? (= :class (:logseq.property/type property))
        tag-class (some (fn [class]
                          (when (= :logseq.class/Tag (:db/ident class))
                            class))
                        all-classes)
        non-root-classes (cond-> (remove (fn [class]
                                           (= (:db/ident class) :logseq.class/Root))
                                         classes)
                           (and class? tag-class)
                           (conj tag-class))
        extends-property? (= (:db/ident property) :logseq.property.class/extends)
        class-ids (->> (concat all-classes classes [(when extends-property? block)])
                       (keep :db/id)
                       distinct)
        structured-children-by-class-id (->> class-ids
                                             (map (fn [class-id]
                                                    [class-id (db-class/get-structured-children db class-id)]))
                                             (into {}))]
    {:all-classes all-classes
     :class-options class-options
     :extends-class-options extends-class-options
     :structured-children-by-class-id structured-children-by-class-id
     :initial-choices (property-node-selector-initial-choices db property non-root-classes option)}))

(def-thread-api :thread-api/get-all-classes
  [repo opts]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (get-all-classes @conn opts)))

(def-thread-api :thread-api/get-structured-children
  [repo class-id]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (db-class/get-structured-children @conn class-id)))

(def-thread-api :thread-api/get-class-extends-children-tree
  [repo class-id]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (class-extends-children-tree @conn class-id)))

(def-thread-api :thread-api/get-alias-source-page
  [repo page-id]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (some-> (ldb/get-alias-source-page @conn page-id)
            entity-util/entity->map)))

(def-thread-api :thread-api/get-property-closed-values
  [repo property-ident]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (when-let [property (d/entity @conn property-ident)]
      (mapv (fn [entity]
              (select-keys (entity-util/entity->map entity)
                           [:db/id :block/uuid :block/title :block/order
                            :logseq.property/value
                            :logseq.property/icon
                            :logseq.property/choice-checkbox-state]))
            (:block/_closed-value-property property)))))

(def-thread-api :thread-api/get-property-node-selector-data
  [repo option]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (property-node-selector-data @conn option)))
