(ns frontend.worker.commands
  "Invoke commands based on user settings"
  (:require [datascript.core :as d]
            [logseq.db.frontend.property.type :as db-property-type]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]
            [logseq.db.frontend.property :as db-property]))

;; TODO: allow users to add command or configure it through #Command (which parent should be #Code)
(def *commands
  (atom
   [[:repeated-task
     {:title "Repeated task"
      :entity-conditions [{:property :logseq.task/repeated?
                           :value true}]
      :tx-conditions [{:property :logseq.task/status
                       :value :logseq.task/status.done}]
      :actions [[:reschedule :logseq.task/scheduled]
                [:set-property :logseq.task/status :logseq.task/status.todo]]}]]))

(defn sastify-condition?
  "Whether entity or updated datoms satisfy the `condition`"
  [db entity {:keys [property value]} datoms]
  (when-let [property-entity (d/entity db property)]
    (let [value-matches? (fn [value]
                           (cond
                             (qualified-keyword? value)
                             (= (:db/ident (get entity property)) value)
                           ;; ref type
                             (and (int? value) (contains? db-property-type/all-ref-property-types (:type (:block/schema property-entity))))
                             (= (:db/id (get entity property)) value)
                             :else
                             (= (get entity property) value)))]
      (if datoms
        (some (fn [d] (value-matches? (:v d))) datoms)
        (value-matches? value)))))

(defmulti handle-command (fn [action-id & _others] action-id))

(defmethod handle-command :reschedule [_ entity property]
  (let [frequency (db-property/property-value-content  (:logseq.task/recur-frequency entity))
        unit (:logseq.task/recur-unit entity)]
    (when (and frequency unit)
      (let [interval (case (:db/ident unit)
                       :logseq.task/recur-unit.minute t/minutes
                       :logseq.task/recur-unit.hour t/hours
                       :logseq.task/recur-unit.day t/days
                       :logseq.task/recur-unit.week t/weeks
                       :logseq.task/recur-unit.month t/months
                       :logseq.task/recur-unit.year t/years)
            next-time (tc/to-long (t/plus (t/now) (interval frequency)))]
        [[:db/add (:db/id entity) property next-time]]))))

(defmethod handle-command :set-property [_ entity property value]
  [[:db/add (:db/id entity) property value]])

(defn execute-command
  "Build tx-data"
  [entity [_command {:keys [actions]}]]
  (mapcat (fn [action]
            (apply handle-command (first action) entity (rest action))) actions))

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
                   (execute-command entity command))
                 commands)))
            (group-by :e tx-data))))
