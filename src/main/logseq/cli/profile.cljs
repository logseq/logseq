(ns logseq.cli.profile
  "Stage timing profiler for logseq CLI runtime."
  (:require [promesa.core :as p]))

(defn create-session
  [enabled?]
  (when enabled?
    {:enabled? true
     :started-ms (js/Date.now)
     :spans (atom [])
     :next-span-id (atom 0)}))

(defn- next-span-id
  [session]
  (swap! (:next-span-id session) inc))

(defn- record-span!
  [session {:keys [stage span-id started-ms ended-ms]}]
  (when session
    (let [started-ms (or started-ms ended-ms 0)
          ended-ms (or ended-ms started-ms)
          elapsed-ms (max 0 (- ended-ms started-ms))]
      (swap! (:spans session) conj {:stage stage
                                    :span-id span-id
                                    :started-ms started-ms
                                    :ended-ms ended-ms
                                    :elapsed-ms elapsed-ms}))))

(defn- thenable?
  [value]
  (and (some? value)
       (fn? (.-then value))))

(defn time!
  [session stage f]
  (if-not session
    (f)
    (let [start-ms (js/Date.now)
          span-id (next-span-id session)]
      (try
        (let [result (f)]
          (if (thenable? result)
            (-> result
                (p/finally (fn []
                             (record-span! session {:stage stage
                                                    :span-id span-id
                                                    :started-ms start-ms
                                                    :ended-ms (js/Date.now)}))))
            (do
              (record-span! session {:stage stage
                                     :span-id span-id
                                     :started-ms start-ms
                                     :ended-ms (js/Date.now)})
              result)))
        (catch :default e
          (record-span! session {:stage stage
                                 :span-id span-id
                                 :started-ms start-ms
                                 :ended-ms (js/Date.now)})
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
        now-ms (js/Date.now)
        total-ms (max 0 (- now-ms started-ms))
        spans (vec (or @(some-> session :spans) []))
        spans (if (some #(= "cli.total" (:stage %)) spans)
                spans
                (conj spans {:stage "cli.total"
                             :span-id 0
                             :started-ms started-ms
                             :ended-ms now-ms
                             :elapsed-ms total-ms}))]
    {:command command
     :status status
     :total-ms total-ms
     :spans spans
     :stages (summarize-stages spans)}))

(defn- span-node
  [span]
  (let [elapsed-ms (max 0 (or (:elapsed-ms span) 0))]
    {:label (:stage span)
     :span span
     :elapsed-ms elapsed-ms
     :children (atom [])}))

(defn- span-contains?
  [outer inner]
  (let [outer-start (:started-ms outer)
        outer-end (:ended-ms outer)
        inner-start (:started-ms inner)
        inner-end (:ended-ms inner)]
    (and (number? outer-start)
         (number? outer-end)
         (number? inner-start)
         (number? inner-end)
         (<= outer-start inner-start)
         (>= outer-end inner-end))))

(defn- sort-spans-for-tree
  [spans]
  (sort-by (fn [{:keys [started-ms ended-ms span-id]}]
             (let [start (or started-ms 0)
                   end (or ended-ms start)
                   duration (max 0 (- end start))]
               [start (- duration) (or span-id 0)]))
           spans))

(defn- freeze-node
  [node]
  (let [children @(:children node)]
    (-> node
        (dissoc :span)
        (assoc :children (mapv freeze-node children)))))

(defn- build-stage-tree-from-spans
  [spans]
  (let [ordered (sort-spans-for-tree spans)
        roots (atom [])
        stack (atom [])
        trim-stack (fn [current-stack span]
                     (loop [items current-stack]
                       (if (and (seq items)
                                (not (span-contains? (:span (peek items)) span)))
                         (recur (pop items))
                         items)))
        push-node! (fn [parent child]
                     (if parent
                       (swap! (:children parent) conj child)
                       (swap! roots conj child)))]
    (doseq [span ordered]
      (let [node (span-node span)
            trimmed (trim-stack @stack span)
            parent (peek trimmed)]
        (push-node! parent node)
        (reset! stack (conj trimmed node))))
    {:label "stages"
     :children (mapv freeze-node @roots)}))

(defn- build-stage-tree-from-stages
  [stages]
  {:label "stages"
   :children (mapv (fn [stage-data]
                     {:label (:stage stage-data)
                      :elapsed-ms (max 0 (or (:elapsed-ms stage-data)
                                             (:total-ms stage-data)
                                             0))
                      :children []})
                   stages)})

(defn- stage-node->text
  [{:keys [label]}]
  label)

(defn- render-stage-tree-rows
  [stage-tree]
  (let [rows (atom [{:elapsed-ms nil
                     :text (:label stage-tree)}])
        walk (fn walk [node prefix]
               (let [children (:children node)
                     total (count children)]
                 (doseq [[idx child] (map-indexed vector children)]
                   (let [last-child? (= idx (dec total))
                         branch (if last-child? "└── " "├── ")
                         next-prefix (str prefix (if last-child? "    " "│   "))]
                     (swap! rows conj {:elapsed-ms (:elapsed-ms child)
                                       :text (str prefix
                                                  branch
                                                  (stage-node->text child))})
                     (walk child next-prefix)))))]
    (walk stage-tree "")
    @rows))

(defn- pad-right
  [value width]
  (let [padding (max 0 (- width (count value)))]
    (str value (apply str (repeat padding " ")))))

(defn- format-profile-lines
  [rows]
  (let [duration-strs (mapv (fn [{:keys [elapsed-ms]}]
                              (when (number? elapsed-ms)
                                (str elapsed-ms "ms")))
                            rows)
        duration-width (apply max 0 (map #(count (or % "")) duration-strs))]
    (mapv (fn [{:keys [text]} duration-str]
            (str (pad-right (or duration-str "") duration-width)
                 " "
                 text))
          rows
          duration-strs)))

(defn render-lines
  [{:keys [command status total-ms spans stages]}]
  (let [status-str (if (keyword? status) (name status) (str status))
        header-row {:elapsed-ms total-ms
                    :text (str "command=" command
                               " status=" status-str)}
        stage-tree (if (seq spans)
                     (build-stage-tree-from-spans spans)
                     (build-stage-tree-from-stages stages))
        stage-rows (render-stage-tree-rows stage-tree)]
    (format-profile-lines (vec (cons header-row stage-rows)))))