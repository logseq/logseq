(ns frontend.worker.commands
  "Invoke commands based on user settings"
  (:require [datascript.core :as d]
            [logseq.db.frontend.property.type :as db-property-type]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]
            [logseq.db.frontend.property :as db-property]
            [logseq.outliner.pipeline :as outliner-pipeline]
            [frontend.worker.handler.page.db-based.page :as worker-db-page]
            [logseq.common.util.date-time :as date-time-util]))

;; TODO: allow users to add command or configure it through #Command (which parent should be #Code)
(def *commands
  (atom
   [[:repeated-task
     {:title "Repeated task"
      :entity-conditions [{:property :logseq.task/repeated?
                           :value true}]
      :tx-conditions [{:property :status
                       :value :done}]
      :actions [[:reschedule]
                [:set-property :status :todo]]}]]))

(defn- get-property
  [entity property]
  (if (= property :status)
    (or
     (:db/ident (:logseq.task/recur-status-property entity))
     :logseq.task/status)
    property))

(defn- get-value
  [entity property value]
  (cond
    (and (= property :status) (= value :done))
    (or
     (let [p (:logseq.task/recur-status-property entity)
           choices (:property/closed-values p)
           checkbox? (= :checkbox (get-in p [:block/schema :type]))]
       (if checkbox?
         true
         (some (fn [choice]
                 (when (:logseq.property/choice-checkbox-state choice)
                   (:db/id choice))) choices)))
     :logseq.task/status.done)
    (and (= property :status) (= value :todo))
    (or
     (let [p (:logseq.task/recur-status-property entity)
           choices (:property/closed-values p)
           checkbox? (= :checkbox (get-in p [:block/schema :type]))]
       (if checkbox?
         false
         (some (fn [choice]
                 (when (false? (:logseq.property/choice-checkbox-state choice))
                   (:db/id choice))) choices)))
     :logseq.task/status.todo)
    :else
    value))

(defn sastify-condition?
  "Whether entity or updated datoms satisfy the `condition`"
  [db entity {:keys [property value]} datoms]
  (let [property' (get-property entity property)
        value (get-value entity property value)]
    (when-let [property-entity (d/entity db property')]
      (let [value-matches? (fn [datom-value]
                             (let [ref? (contains? db-property-type/all-ref-property-types (:type (:block/schema property-entity)))
                                   db-value (cond
                                              ;; entity-conditions
                                              (nil? datom-value)
                                              (get entity property')
                                              ;; tx-conditions
                                              ref?
                                              (d/entity db datom-value)
                                              :else
                                              datom-value)]
                               (cond
                                 (qualified-keyword? value)
                                 (and (map? db-value) (= value (:db/ident db-value)))

                                 ref?
                                 (or
                                  (and (uuid? value) (= (:block/uuid db-value) value))
                                  (= value (db-property/property-value-content db-value))
                                  (= value (:db/id db-value)))

                                 :else
                                 (= db-value value))))]
        (if (seq datoms)
          (some (fn [d] (and (value-matches? (:v d)) (:added d)))
                (filter (fn [d] (= property' (:a d))) datoms))
          (value-matches? nil))))))

(defmulti handle-command (fn [action-id & _others] action-id))

(defmethod handle-command :reschedule [_ db entity]
  (let [property-ident (or (:db/ident (:logseq.task/scheduled-on-property entity))
                           :logseq.task/scheduled)
        property (when property-ident (d/entity db property-ident))
        frequency (db-property/property-value-content (:logseq.task/recur-frequency entity))
        unit (:logseq.task/recur-unit entity)]
    (when (and frequency unit)
      (let [interval (case (:db/ident unit)
                       :logseq.task/recur-unit.minute t/minutes
                       :logseq.task/recur-unit.hour t/hours
                       :logseq.task/recur-unit.day t/days
                       :logseq.task/recur-unit.week t/weeks
                       :logseq.task/recur-unit.month t/months
                       :logseq.task/recur-unit.year t/years)
            next-time (t/plus (t/now) (interval frequency))
            next-time-long (tc/to-long next-time)
            journal-day (outliner-pipeline/get-journal-day-from-long db next-time-long)
            create-journal-page (when-not journal-day
                                  (let [formatter (:logseq.property.journal/title-format (d/entity db :logseq.class/Journal))
                                        title (date-time-util/format (t/to-default-time-zone next-time) formatter)]
                                    (worker-db-page/create db title {:create-first-block? false})))
            value (if (= :datetime (get-in property [:block/schema :type]))
                    next-time-long
                    (or journal-day
                        [:block/uuid (:page-uuid create-journal-page)]))]
        (concat
         (:tx-data create-journal-page)
         (when value
           [[:db/add (:db/id entity) property-ident value]]))))))

(defmethod handle-command :set-property [_ _db entity property value]
  (let [property' (get-property entity property)
        value' (get-value entity property value)]
    [[:db/add (:db/id entity) property' value']]))

(defn execute-command
  "Build tx-data"
  [db entity [_command {:keys [actions]}]]
  (mapcat (fn [action]
            (apply handle-command (first action) db entity (rest action))) actions))

(defn run-commands
  [{:keys [tx-data db-after]}]
  (let [db db-after]
    (mapcat (fn [[e datoms]]
              (let [entity (d/entity db e)
                    commands (filter (fn [[_command {:keys [entity-conditions tx-conditions]}]]
                                       (and (every? #(sastify-condition? db entity % nil) entity-conditions)
                                            (every? #(sastify-condition? db entity % datoms) tx-conditions))) @*commands)]
                (mapcat
                 (fn [command]
                   (execute-command db entity command))
                 commands)))
            (group-by :e tx-data))))
