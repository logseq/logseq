(ns frontend.worker.commands
  "Invoke commands based on user settings"
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [datascript.core :as d]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.build :as db-property-build]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.outliner.page :as outliner-page]
            [logseq.outliner.pipeline :as outliner-pipeline]))

;; TODO: allow users to add command or configure it through #Command (which parent should be #Code)
(def *commands
  (atom
   [[:repeated-task
     {:title "Repeated task"
      :entity-conditions [{:property :logseq.property.repeat/repeated?
                           :value true}]
      :tx-conditions [{:property :status
                       :value :done}]
      :actions [[:reschedule]
                [:set-property :status :todo]]}]
    [:property-history
     {:title "Record property history"
      :tx-conditions [{:kind :datom-attribute-check?
                       :property :logseq.property/enable-history?
                       :value true}]
      :actions [[:record-property-history]]}]]))

(defn- get-property
  [entity property]
  (if (= property :status)
    (or
     (:db/ident (:logseq.property.repeat/checked-property entity))
     :logseq.property/status)
    property))

(defn- get-value
  [entity property value]
  (cond
    (and (= property :status) (= value :done))
    (or
     (let [p (:logseq.property.repeat/checked-property entity)
           choices (:property/closed-values p)
           checkbox? (= :checkbox (:logseq.property/type p))]
       (if checkbox?
         true
         (some (fn [choice]
                 (when (:logseq.property/choice-checkbox-state choice)
                   (:db/id choice))) choices)))
     :logseq.property/status.done)
    (and (= property :status) (= value :todo))
    (or
     (let [p (:logseq.property.repeat/checked-property entity)
           choices (:property/closed-values p)
           checkbox? (= :checkbox (:logseq.property/type p))]
       (if checkbox?
         false
         (some (fn [choice]
                 (when (false? (:logseq.property/choice-checkbox-state choice))
                   (:db/id choice))) choices)))
     :logseq.property/status.todo)
    :else
    value))

(defn satisfy-condition?
  "Whether entity or updated datoms satisfy the `condition`"
  [db entity {:keys [kind property value]} datoms]
  (let [property' (get-property entity property)
        value' (get-value entity property value)]
    (when-let [property-entity (d/entity db property')]
      (let [value-matches? (fn [datom-value]
                             (let [ref? (contains? db-property-type/all-ref-property-types (:logseq.property/type property-entity))
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
                                 (qualified-keyword? value')
                                 (and (map? db-value) (= value' (:db/ident db-value)))

                                 ref?
                                 (or
                                  (and (uuid? value') (= (:block/uuid db-value) value'))
                                  (= value' (db-property/property-value-content db-value))
                                  (= value' (:db/id db-value)))

                                 :else
                                 (= db-value value'))))]
        (if (seq datoms)
          (case kind
            :datom-attribute-check?
            (some (fn [d]
                    (= value' (get (d/entity db (:a d)) property)))
                  datoms)

            (some (fn [d] (and (value-matches? (:v d)) (:added d)))
                  (filter (fn [d] (= property' (:a d))) datoms)))
          (value-matches? nil))))))

(defmulti handle-command (fn [action-id & _others] action-id))

(defn- advance-from-completion
  "`.+` semantics: next occurrence = now + frequency * unit."
  [recur-unit frequency]
  (t/plus (t/now) (recur-unit frequency)))

(defn- advance-from-scheduled
  "`+` semantics: next occurrence = scheduled + frequency * unit. Can land in
  the past if completion was long after scheduled — that's the documented
  behavior (\"can stack overdue\")."
  [datetime recur-unit frequency]
  (t/plus datetime (recur-unit frequency)))

(defn- advance-until-future
  "`++` semantics: advance from scheduled in frequency*unit steps until strictly
  after now. cljs-time arithmetic is UTC, so adding whole weeks preserves
  day-of-week by construction — no fix-up needed."
  [datetime recur-unit period-f frequency]
  (let [now (t/now)
        periods (max 1
                     (if (t/after? datetime now)
                       1
                       (period-f (t/interval datetime now))))
        delta (->> (Math/ceil (/ periods frequency))
                   (* frequency)
                   recur-unit)
        result (t/plus datetime delta)]
    (loop [candidate result]
      (if (t/after? candidate now)
        candidate
        (recur (t/plus candidate (recur-unit frequency)))))))

(defn- repeat-next-timestamp
  "Dispatch on repeat-type db-ident to compute the next occurrence. Mirrors the
  three org-mode repeater cookies documented at
  docs.logseq.com: `.+` (dotted-plus), `+` (plus), `++` (double-plus)."
  [datetime recur-unit period-f frequency repeat-type]
  (case repeat-type
    :logseq.property.repeat/repeat-type.dotted-plus
    (advance-from-completion recur-unit frequency)

    :logseq.property.repeat/repeat-type.plus
    (advance-from-scheduled datetime recur-unit frequency)

    ;; :double-plus or unknown fallback
    (advance-until-future datetime recur-unit period-f frequency)))

(defn- get-next-time
  [current-value unit frequency repeat-type]
  (let [current-date-time (tc/to-date-time current-value)
        [recur-unit period-f] (case (:db/ident unit)
                                :logseq.property.repeat/recur-unit.minute [t/minutes t/in-minutes]
                                :logseq.property.repeat/recur-unit.hour [t/hours t/in-hours]
                                :logseq.property.repeat/recur-unit.day [t/days t/in-days]
                                :logseq.property.repeat/recur-unit.week [t/weeks t/in-weeks]
                                :logseq.property.repeat/recur-unit.month [t/months t/in-months]
                                :logseq.property.repeat/recur-unit.year [t/years t/in-years]
                                nil)]
    ;; Guard against frequency <= 0: `advance-until-future` would infinite-loop
    ;; on zero-length intervals, and the other variants produce nonsense.
    (when (and recur-unit (pos? frequency))
      (tc/to-long (repeat-next-timestamp current-date-time recur-unit period-f frequency repeat-type)))))

(defn- resolve-recur-frequency
  "Returns `[frequency default-value-tx-data]` for a recurring task entity:

  - `[n nil]` when the entity already has an explicit
    `:logseq.property.repeat/recur-frequency` value `n`.
  - `[1 tx-data]` when it doesn't — tx-data populates the property's
    default-value block so subsequent reads see 1.

  The explicit-vs-default branch was previously guarded by `(or [A B] [C D])`,
  which always selected the first branch because any 2-vector is truthy in
  Clojure. That made the default-value path unreachable and left migrated
  recurring tasks without a resolvable frequency. This form checks the value
  explicitly via `if-let`."
  [db entity]
  (if-let [freq (db-property/property-value-content
                 (:logseq.property.repeat/recur-frequency entity))]
    [freq nil]
    (let [property (d/entity db :logseq.property.repeat/recur-frequency)
          default-value-block (db-property-build/build-property-value-block property property 1)
          default-value-tx-data [default-value-block
                                 {:db/id (:db/id property)
                                  :logseq.property/default-value [:block/uuid (:block/uuid default-value-block)]}]]
      [1 default-value-tx-data])))

(defn- compute-reschedule-property-tx
  [db entity property-ident]
  (let [[frequency default-value-tx-data] (resolve-recur-frequency db entity)
        unit (:logseq.property.repeat/recur-unit entity)
        repeat-type (or (:db/ident (:logseq.property.repeat/repeat-type entity))
                        :logseq.property.repeat/repeat-type.double-plus)
        property (d/entity db property-ident)
        date? (= :date (:logseq.property/type property))
        current-value (cond->
                       (get entity property-ident)
                        date?
                        (#(date-time-util/journal-day->ms (:block/journal-day %))))]
    (when (and frequency unit)
      (when-let [next-time-long (get-next-time current-value unit frequency repeat-type)]
        (let [journal-day (outliner-pipeline/get-journal-day-from-long db next-time-long)
              {:keys [tx-data page-uuid]} (if journal-day
                                            {:page-uuid (:block/uuid (d/entity db journal-day))}
                                            (let [formatter (:logseq.property.journal/title-format (d/entity db :logseq.class/Journal))
                                                  title (date-time-util/format (t/to-default-time-zone (tc/to-date-time next-time-long)) formatter)]
                                              (outliner-page/create db title {})))
              value (if date? [:block/uuid page-uuid] next-time-long)]
          (concat
           default-value-tx-data
           tx-data
           (when value
             [[:db/add (:db/id entity) property-ident value]])))))))

(defmethod handle-command :reschedule [_ db entity _datoms]
  (let [property-ident (or (:db/ident (:logseq.property.repeat/temporal-property entity))
                           :logseq.property/scheduled)
        other-property-idents (cond
                                (and (= property-ident :logseq.property/scheduled)
                                     (:logseq.property/deadline entity))
                                [:logseq.property/deadline]

                                (and (= property-ident :logseq.property/deadline)
                                     (:logseq.property/scheduled entity))
                                [:logseq.property/scheduled]

                                :else
                                (filter (fn [p] (get entity p)) [:logseq.property/deadline :logseq.property/scheduled]))]
    (mapcat #(compute-reschedule-property-tx db entity %) (distinct (cons property-ident other-property-idents)))))

(defmethod handle-command :set-property [_ _db entity _datoms property value]
  (let [property' (get-property entity property)
        value' (get-value entity property value)]
    [[:db/add (:db/id entity) property' value']]))

(defmethod handle-command :record-property-history [_ db entity datoms]
  (let [changes (keep (fn [d]
                        (let [property (d/entity db (:a d))]
                          (when (and (true? (get property :logseq.property/enable-history?))
                                     (:added d))
                            {:property property
                             :value (:v d)}))) datoms)
        data (map
              (fn [{:keys [property value]}]
                (let [ref? (= :db.type/ref (:db/valueType property))
                      value-key (if ref? :logseq.property.history/ref-value :logseq.property.history/scalar-value)]
                  (sqlite-util/block-with-timestamps
                   {:block/uuid (ldb/new-block-id)
                    value-key value
                    :logseq.property.history/block (:db/id entity)
                    :logseq.property.history/property (:db/id property)})))
              changes)]
    data))

(defmethod handle-command :default [command _db entity datoms]
  (throw (ex-info "Unhandled command"
                  {:command command
                   :entity entity
                   :datoms datoms})))

(defn execute-command
  "Build tx-data"
  [db entity datoms [_command {:keys [actions]}]]
  (mapcat (fn [action]
            (apply handle-command (first action) db entity datoms (rest action))) actions))

(defn run-commands
  [{:keys [tx-data db-after]}]
  (mapcat (fn [[e datoms]]
            (let [entity (d/entity db-after e)
                  commands (filter (fn [[_command {:keys [entity-conditions tx-conditions]}]]
                                     (and
                                      (if (seq entity-conditions)
                                        (every? #(satisfy-condition? db-after entity % nil) entity-conditions)
                                        true)
                                      (every? #(satisfy-condition? db-after entity % datoms) tx-conditions))) @*commands)]
              (mapcat
               (fn [command]
                 (execute-command db-after entity datoms command))
               commands)))
          (group-by :e tx-data)))
