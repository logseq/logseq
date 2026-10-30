(ns logseq.graph-parser.exporter.clock
  "Pure helpers that turn OG `:LOGBOOK:` CLOCK lines into approximate DB task
  status history for the file-to-db importer.

  Work happens in three steps, each returning data and structured diagnostics
  instead of logging:
  1. `parse-logbook-lines`: raw drawer lines -> parsed source clocks
  2. `normalize-clocks`: source clocks -> effective, validated intervals
  3. `plan-history`: intervals + current status -> ordered status events

  `build-history` runs all three. Anything that cannot be converted without
  guessing skips the whole task's history and is reported."
  (:require [clojure.string :as string]
            [logseq.common.util.date-time :as date-time]))

(def ^:private timestamp-re
  ;; [2021-11-07 Sun 12:00:15] with optional weekday and optional seconds
  "\\[(\\d{4})-(\\d{2})-(\\d{2})(?:\\s+[^\\s\\]\\d:]+)?\\s+(\\d{1,2}):(\\d{2})(?::(\\d{2}))?\\]")

(def ^:private clock-line-re
  (re-pattern (str "(?i)^\\s*CLOCK:\\s*" timestamp-re
                   "(?:--" timestamp-re "(?:\\s*=>\\s*(.*?))?)?\\s*$")))

(def ^:private clock-prefix-re #"(?i)^\s*CLOCK:")

(def ^:private duration-re #"^(\d+):(\d{2})(?::(\d{2}))?$")

(defn- parse-int [s] (when s (js/parseInt s 10)))

(defn- groups->ms
  [[year month day hour minute second]]
  (date-time/local-datetime->ms (parse-int year) (parse-int month) (parse-int day)
                                (parse-int hour) (parse-int minute) (or (parse-int second) 0)))

(defn parse-duration-ms
  "Parses a printed duration such as `06:00:00`, `51:30:00` or `1:30`. Hours
  have any width. Returns a map with :state of :absent, :valid, :zero or
  :invalid. A valid duration is strictly positive; a well-formed duration of
  zero is :zero."
  [raw]
  (if (nil? raw)
    {:state :absent}
    (if-let [[_ h m s] (re-matches duration-re raw)]
      (let [h (parse-int h) m (parse-int m) s (or (parse-int s) 0)
            ms (* 1000 (+ (* 3600 h) (* 60 m) s))]
        (cond
          (not (and (< m 60) (< s 60))) {:state :invalid :raw raw}
          (pos? ms) {:state :valid :raw raw :ms ms}
          :else {:state :zero :raw raw}))
      {:state :invalid :raw raw})))

(defn parse-clock-line
  "Parses one logbook line. Returns nil for lines that are not CLOCK lines,
  a clock map for valid ones, or {:error :malformed-clock-line} for lines that
  start with CLOCK: but are not a recognised clock. Timestamps that are not
  real local times (Feb 30, DST gap) are also malformed."
  [line]
  (when (re-find clock-prefix-re line)
    (if-let [[_ & groups] (re-matches clock-line-re line)]
      (let [start-groups (take 6 groups)
            end-groups (take 6 (drop 6 groups))
            duration-raw (nth groups 12)
            start (groups->ms start-groups)
            open? (nil? (first end-groups))
            end (when-not open? (groups->ms end-groups))]
        (cond
          (nil? start)
          {:error :malformed-clock-line :raw line}
          ;; An open clock cannot carry a printed duration
          (and open? duration-raw)
          {:error :malformed-clock-line :raw line}
          :else
          (cond-> {:raw line
                   :start start
                   :open? open?
                   :end-valid? (or open? (some? end))
                   :duration (parse-duration-ms duration-raw)}
            end (assoc :end end))))
      {:error :malformed-clock-line :raw line})))

(defn parse-logbook-lines
  "Parses the raw lines of a logbook drawer. Lines are strings as returned by
  mldoc, including separate \"\\n\" items. Returns {:clocks [...] :diagnostics [...]}.
  Each clock carries its :source-index so diagnostics can point at the entry."
  [lines]
  (let [clock-lines (->> lines
                         (filter string?)
                         (remove #(= "\n" %))
                         (mapcat #(string/split-lines %)))]
    (reduce (fn [acc [idx line]]
              (if-let [parsed (parse-clock-line line)]
                (if (:error parsed)
                  (update acc :diagnostics conj
                          {:type :malformed-clock-line :source-index idx :raw line})
                  (update acc :clocks conj (assoc parsed :source-index idx)))
                acc))
            {:clocks [] :diagnostics []}
            (map-indexed vector clock-lines))))

(defn- invalid-entry
  [clock type extra]
  (merge {:type type :source-index (:source-index clock) :raw (:raw clock)} extra))

(defn- normalize-clock
  "Returns {:interval {...} :diagnostics [...]}, {:diagnostics [...]} for an
  ignored entry, or {:diagnostics [...] :skip? true}.
  A valid printed duration wins over the recorded end. An invalid or zero
  printed duration is reported and the recorded range is used when it is
  valid. A clock whose start equals its end and that has no printed duration
  or a zero one records no time, so it is ignored and reported without
  affecting the task's other clocks."
  [{:keys [start end open? end-valid? duration source-index raw] :as clock}]
  (let [base {:source-index source-index :raw raw :start start}]
    (cond
      open?
      {:interval (assoc base :open? true) :diagnostics []}

      (not end-valid?)
      ;; The end is not a real local time. A valid printed duration can still
      ;; define the interval.
      (if (= :valid (:state duration))
        {:interval (assoc base :end (+ start (:ms duration)))
         :diagnostics [(invalid-entry clock :invalid-recorded-end
                                      {:recorded-start start
                                       :effective-end (+ start (:ms duration))})]}
        {:skip? true
         :diagnostics [(invalid-entry clock :invalid-range {:recorded-start start})]})

      :else
      (let [range-valid? (> end start)
            invalid-duration? (contains? #{:invalid :zero} (:state duration))
            duration-diag (when invalid-duration?
                            (invalid-entry clock :invalid-duration
                                           {:printed-duration (:raw duration)}))]
        (cond
          (and (= end start) (contains? #{:absent :zero} (:state duration)))
          {:diagnostics [(invalid-entry clock :zero-length-clock
                                        {:recorded-start start})]}

          (= :valid (:state duration))
          (let [effective-end (+ start (:ms duration))]
            {:interval (assoc base :end effective-end)
             :diagnostics (if (= effective-end end)
                            []
                            [(invalid-entry clock :duration-adjusted
                                            {:recorded-start start
                                             :recorded-end end
                                             :printed-duration (:raw duration)
                                             :effective-end effective-end})])})

          range-valid?
          {:interval (assoc base :end end)
           :diagnostics (cond-> [] duration-diag (conj duration-diag))}

          :else
          {:skip? true
           :diagnostics (cond-> [(invalid-entry clock :invalid-range
                                                {:recorded-start start :recorded-end end})]
                          duration-diag (conj duration-diag))})))))

(defn normalize-clocks
  "Reconciles each parsed clock with its printed duration and sorts valid
  intervals chronologically. Returns {:intervals [...] :diagnostics [...] :skip? bool}.
  :skip? is true when any entry is unusable."
  [clocks]
  (let [results (map normalize-clock clocks)]
    {:intervals (->> results (keep :interval) (sort-by (juxt :start :source-index)) vec)
     :diagnostics (vec (mapcat :diagnostics results))
     :skip? (boolean (some :skip? results))}))

(defn- validate-order
  "Returns a diagnostic map when intervals are contradictory, else nil.
  Intervals must be sorted. Adjacent intervals (end == next start) are fine;
  `plan-history` nudges them apart."
  [intervals]
  (let [open (filter :open? intervals)]
    (cond
      (> (count open) 1)
      {:type :multiple-open-clocks :source-indexes (mapv :source-index open)}

      (and (seq open) (not (:open? (peek intervals))))
      {:type :open-clock-not-final :source-index (:source-index (first open))}

      :else
      (some (fn [[a b]]
              (when (> (or (:end a) (:start a)) (:start b))
                {:type :overlapping-clocks
                 :source-indexes [(:source-index a) (:source-index b)]
                 :first {:start (:start a) :end (:end a)}
                 :second {:start (:start b) :end (:end b)}}))
            (partition 2 1 intervals)))))

(defn plan-history
  "Turns sorted, normalized intervals into ordered status events.

  `current` describes the imported task status: {:status <closing ref> :doing? bool}.
  Returns {:events [{:ms n :status ref}] :completed-sessions n :open-sessions n
  :diagnostics [...]} or {:skip? true :diagnostics [...]}.

  Every interval but the last closes with :todo. The last completed interval
  closes with the current status unless that status is Doing, in which case it
  closes with :todo so no timer runs from an old end. An open clock requires a
  Doing current status. Where an interval ends exactly when the next starts,
  the closing event moves back one millisecond so the two events keep a strict
  order; the next start keeps its true source time."
  [intervals {:keys [status doing?]} {:keys [todo doing]}]
  (let [order-problem (validate-order intervals)
        open? (some :open? intervals)]
    (cond
      ;; Every entry was ignored, so there is nothing to import
      (empty? intervals)
      {:events [] :completed-sessions 0 :open-sessions 0 :diagnostics []}

      order-problem
      {:skip? true :diagnostics [order-problem]}

      (and open? (not doing?))
      {:skip? true
       :diagnostics [{:type :open-clock-inconsistent
                      :source-index (:source-index (peek intervals))}]}

      :else
      (let [last-idx (dec (count intervals))
            nudges (atom [])
            events (vec
                    (mapcat
                     (fn [idx {:keys [start end open? source-index]}]
                       (let [next-start (:start (get intervals (inc idx)))
                             closing (if (= idx last-idx)
                                       (if doing? todo status)
                                       todo)
                             end' (if (and end next-start (= end next-start))
                                    (do (swap! nudges conj {:type :boundary-adjusted
                                                            :source-index source-index
                                                            :boundary end
                                                            :effective-end (dec end)})
                                        (dec end))
                                    end)]
                         (cond-> [{:ms start :status doing}]
                           (not open?) (conj {:ms end' :status closing}))))
                     (range)
                     intervals))]
        {:events events
         :completed-sessions (count (remove :open? intervals))
         :open-sessions (if open? 1 0)
         :diagnostics @nudges}))))

(defn build-history
  "Full pipeline for one task's logbook lines. Returns
  {:events [...] :completed-sessions n :open-sessions n :diagnostics [...]}
  or {:skip? true :diagnostics [...]}. Returns nil when the logbook contains
  no CLOCK lines at all."
  [lines current refs]
  (let [{:keys [clocks diagnostics]} (parse-logbook-lines lines)]
    (when (or (seq clocks) (seq diagnostics))
      (if (seq diagnostics)
        {:skip? true :diagnostics diagnostics}
        (let [normalized (normalize-clocks clocks)]
          (if (:skip? normalized)
            {:skip? true :diagnostics (:diagnostics normalized)}
            (let [plan (plan-history (:intervals normalized) current refs)]
              (update plan :diagnostics #(into (:diagnostics normalized) %)))))))))
