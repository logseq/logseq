(ns logseq.cli.profile
  "Stage timing profiler for logseq CLI runtime."
  (:require [promesa.core :as p]))

(defn create-session
  [enabled?]
  (when enabled?
    {:enabled? true
     :started-ms (js/Date.now)
     :spans (atom [])}))

(defn- record-span!
  [session stage elapsed-ms]
  (when session
    (swap! (:spans session) conj {:stage stage
                                  :elapsed-ms (max 0 elapsed-ms)})))

(defn- thenable?
  [value]
  (and (some? value)
       (fn? (.-then value))))

(defn time!
  [session stage f]
  (if-not session
    (f)
    (let [start-ms (js/Date.now)]
      (try
        (let [result (f)]
          (if (thenable? result)
            (-> result
                (p/finally (fn []
                             (record-span! session stage (- (js/Date.now) start-ms)))))
            (do
              (record-span! session stage (- (js/Date.now) start-ms))
              result)))
        (catch :default e
          (record-span! session stage (- (js/Date.now) start-ms))
          (throw e))))))

(defn- summarize-stages
  [spans]
  (let [aggregated (reduce (fn [acc {:keys [stage elapsed-ms]}]
                             (update acc stage
                                     (fn [{:keys [count total-ms] :as current}]
                                       (if current
                                         (assoc current
                                                :count (inc count)
                                                :total-ms (+ total-ms elapsed-ms))
                                         {:stage stage
                                          :count 1
                                          :total-ms elapsed-ms}))))
                           {}
                           spans)
        order (distinct (map :stage spans))]
    (mapv (fn [stage]
            (let [{:keys [count total-ms]} (get aggregated stage)
                  avg-ms (if (pos? count)
                           (js/Math.round (/ total-ms count))
                           0)]
              {:stage stage
               :count count
               :total-ms total-ms
               :avg-ms avg-ms}))
          order)))

(defn report
  [session {:keys [command status]}]
  (let [started-ms (or (:started-ms session) (js/Date.now))
        total-ms (max 0 (- (js/Date.now) started-ms))
        spans (vec (or @(some-> session :spans) []))
        spans (if (some #(= "cli.total" (:stage %)) spans)
                spans
                (conj spans {:stage "cli.total"
                             :elapsed-ms total-ms}))]
    {:command command
     :status status
     :total-ms total-ms
     :stages (summarize-stages spans)}))

(defn render-lines
  [{:keys [command status total-ms stages]}]
  (let [status-str (if (keyword? status) (name status) (str status))
        header (str "[profile] total=" total-ms "ms"
                    " command=" command
                    " status=" status-str)
        stage-lines (mapv (fn [{:keys [stage count total-ms avg-ms]}]
                            (str "[profile] " stage
                                 " count=" count
                                 " total=" total-ms "ms"
                                 " avg=" avg-ms "ms"))
                          stages)]
    (vec (cons header stage-lines))))
