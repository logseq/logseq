(ns frontend.components.date-range-picker
  "Date-range property value picker.

  Supports three precisions (year / month / day) and optional end-date ranges.
  The picker emits maps of the form
    {:precision :day | :month | :year
     :start     <YYYYMMDD integer>
     :end       <YYYYMMDD integer | nil>}
  via the :on-change callback.  The parent is responsible for persisting the
  value to the DB (see property/value.cljs)."
  (:require [cljs-time.core :as t]
            [clojure.string :as string]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

;;; ─── YYYYMMDD helpers ────────────────────────────────────────────────────────

(defn- ymd->int
  "Return a YYYYMMDD integer from year, month (1-12), day (1-31)."
  [y m d]
  (+ (* 10000 y) (* 100 m) d))

(defn- int->parts
  "Destructure a YYYYMMDD integer into [year month day]."
  [n]
  [(quot n 10000)
   (mod (quot n 100) 100)
   (mod n 100)])

(defn- js-date->int
  "Convert a js/Date to a YYYYMMDD integer using local time."
  [^js d]
  (ymd->int (.getFullYear d) (inc (.getMonth d)) (.getDate d)))

(defn- int->js-date
  "Convert a YYYYMMDD integer to a js/Date (midnight local time)."
  [n]
  (let [[y m d] (int->parts n)]
    (js/Date. y (dec m) d 0 0 0 0)))

(defn- precision-from-int
  "Derive date precision from the YYYYMMDD integer encoding.
   yyyy0000 → :year, yyyymm00 → :month, yyyymmdd → :day."
  [n]
  (cond
    (zero? (mod n 10000)) :year
    (zero? (mod n 100))   :month
    :else                 :day))

;;; ─── Flexible date parser ────────────────────────────────────────────────────

(def ^:private month-name->int
  {"january" 1 "jan" 1
   "february" 2 "feb" 2
   "march" 3 "mar" 3
   "april" 4 "apr" 4
   "may" 5
   "june" 6 "jun" 6
   "july" 7 "jul" 7
   "august" 8 "aug" 8
   "september" 9 "sep" 9 "sept" 9
   "october" 10 "oct" 10
   "november" 11 "nov" 11
   "december" 12 "dec" 12})

(defn- parse-month-name [s]
  (get month-name->int (-> s string/lower-case (string/replace #"\." "") string/trim)))

(defn- pi [s] (js/parseInt s 10))

(defn- valid-ymd? [y m d]
  (and (>= y 1000) (<= y 9999) (>= m 1) (<= m 12) (>= d 1) (<= d 31)))

(defn- valid-ym? [y m]
  (and (>= y 1000) (<= y 9999) (>= m 1) (<= m 12)))

(defn parse-date-text
  "Parse a free-form single-date string. Returns {:precision :year/:month/:day :start <YYYYMMDD>}
   or nil when the string is unrecognisable."
  [raw]
  (let [s (-> raw string/trim (string/replace #"\s{2,}" " "))]
    (when-not (string/blank? s)
      (or
       ;; ── ISO: YYYY-MM-DD ──────────────────────────────────────────────────
       (when-let [[_ y m d] (re-matches #"(\d{4})-(\d{1,2})-(\d{1,2})" s)]
         (let [yi (pi y) mi (pi m) di (pi d)]
           (when (valid-ymd? yi mi di)
             {:precision :day :start (ymd->int yi mi di)})))

       ;; ── ISO: YYYY-MM ─────────────────────────────────────────────────────
       (when-let [[_ y m] (re-matches #"(\d{4})-(\d{2})" s)]
         (let [yi (pi y) mi (pi m)]
           (when (valid-ym? yi mi)
             {:precision :month :start (ymd->int yi mi 0)})))

       ;; ── Four-digit year alone ────────────────────────────────────────────
       (when-let [[_ y] (re-matches #"(\d{4})" s)]
         (let [yi (pi y)]
           (when (<= 1000 yi 9999)
             {:precision :year :start (ymd->int yi 0 0)})))

       ;; ── Slash: M/D/YYYY or M/D/YY ───────────────────────────────────────
       (when-let [[_ m d y] (re-matches #"(\d{1,2})/(\d{1,2})/(\d{2,4})" s)]
         (let [mi (pi m) di (pi d)
               yi (let [yr (pi y)] (if (< yr 100) (+ 2000 yr) yr))]
           (when (valid-ymd? yi mi di)
             {:precision :day :start (ymd->int yi mi di)})))

       ;; ── Slash: M/YYYY ────────────────────────────────────────────────────
       (when-let [[_ m y] (re-matches #"(\d{1,2})/(\d{4})" s)]
         (let [mi (pi m) yi (pi y)]
           (when (valid-ym? yi mi)
             {:precision :month :start (ymd->int yi mi 0)})))

       ;; ── Day-first: "1 Sep 2025", "1 Sep. 2025", "01 September, 2025" ────
       (when-let [[_ d mon y] (re-matches #"(\d{1,2})\s+([A-Za-z]+\.?)[,\s]+(\d{4})" s)]
         (let [di (pi d) mi (parse-month-name mon) yi (pi y)]
           (when (and mi (valid-ymd? yi mi di))
             {:precision :day :start (ymd->int yi mi di)})))

       ;; ── Month-first: "Sep 1, 2025", "Sep. 1 2025", "September 1 2025" ──
       (when-let [[_ mon d y] (re-matches #"([A-Za-z]+\.?)\s+(\d{1,2})[,\s]+(\d{4})" s)]
         (let [mi (parse-month-name mon) di (pi d) yi (pi y)]
           (when (and mi (valid-ymd? yi mi di))
             {:precision :day :start (ymd->int yi mi di)})))

       ;; ── Month + year: "Sep 2025", "Sep. 2025", "September 2025" ─────────
       (when-let [[_ mon y] (re-matches #"([A-Za-z]+\.?)\s+(\d{4})" s)]
         (let [mi (parse-month-name mon) yi (pi y)]
           (when (and mi (valid-ym? yi mi))
             {:precision :month :start (ymd->int yi mi 0)})))))))

(def ^:private range-sep-re
  "Matches an en-dash, em-dash, or a space-prefixed hyphen as a range separator.
   A leading space is required (so bare hyphens in ISO dates are not treated as
   separators) but a trailing space is optional, so 'Sep 1 -' immediately shows
   the end calendar without requiring the user to type the trailing space first."
  #"(?:[–—]| -)")

(defn- split-range-text
  "Split raw text on the first range separator.  Returns [part1 part2] or nil.
   Recognised separators: en-dash (–), em-dash (—), or ' - ' (space-hyphen-space)."
  [s]
  (when-let [[_ p1 p2] (re-matches (re-pattern (str "(.*?)\\s*" (.-source range-sep-re) "\\s*(.*)")) s)]
    [(string/trim p1) (string/trim p2)]))

(defn parse-date-range-text
  "Parse a single date or a range separated by an en/em-dash or ' - '.
   Returns {:precision … :start <YYYYMMDD> :end <YYYYMMDD|nil>} or nil."
  [raw]
  (let [s (-> raw string/trim (string/replace #"\s{2,}" " "))]
    (when-not (string/blank? s)
      (if-let [[p1 p2] (split-range-text s)]
        ;; Range: both halves must parse successfully.
        (let [start-parsed (parse-date-text p1)
              end-parsed   (parse-date-text p2)]
          (when (and start-parsed end-parsed)
            (assoc start-parsed :end (:start end-parsed))))
        ;; Single date.
        (parse-date-text s)))))

;;; ─── Display label ───────────────────────────────────────────────────────────

(def ^:private month-abbr
  ["" "Jan" "Feb" "Mar" "Apr" "May" "Jun"
   "Jul" "Aug" "Sep" "Oct" "Nov" "Dec"])

(defn- fmt-endpoint
  "Format a single YYYYMMDD integer for display, deriving precision from
   the integer encoding (yyyy0000 → year, yyyymm00 → month, else day)."
  [n]
  (let [[y m d] (int->parts n)]
    (cond
      (zero? (mod n 10000)) (str y)
      (zero? (mod n 100))   (str (get month-abbr m "?") " " y)
      :else                 (str (get month-abbr m "?") " " d ", " y))))

(defn format-label
  "Return a human-readable string for a date-range value map.
   Precision is derived from the integer encoding; the :precision key
   is accepted but ignored (kept for call-site backwards compat)."
  [{:keys [start end]}]
  (when start
    (if end
      (str (fmt-endpoint start) " – " (fmt-endpoint end))
      (fmt-endpoint start))))

;;; ─── Sub-pickers ─────────────────────────────────────────────────────────────

(rum/defc year-picker
  "Shows the current year with ‹/› navigation, sized to match the day calendar
   width (276 px = 2×12 px padding + 7×36 px cells).  The ‹/› buttons call
   on-navigate with the new year; clicking the year label calls on-select."
  [{:keys [year on-select on-navigate]}]
  [:div.flex.items-center.justify-center.gap-3
   {:style {:width "100%" :padding "12px"}}
   (shui/button {:variant :ghost :size :icon
                 :on-click #(on-navigate (dec year))}
                (ui/icon "chevron-left" {:size 14}))
   (shui/button {:variant :ghost :size :sm
                 :class "font-semibold text-base min-w-[5rem]"
                 :on-click #(on-select year)}
                (str year))
   (shui/button {:variant :ghost :size :icon
                 :on-click #(on-navigate (inc year))}
                (ui/icon "chevron-right" {:size 14}))])

(rum/defc month-grid
  "A 4×3 month grid with year navigation, sized to match the day calendar width
   (276 px = 2×12 px padding + 7×36 px cells).
   on-navigate changes the display year;
   on-select is called with a YYYYMMDD integer for the chosen month."
  [{:keys [year month on-select on-navigate]}]
  (let [rows [["Jan" "Feb" "Mar"] ["Apr" "May" "Jun"]
              ["Jul" "Aug" "Sep"] ["Oct" "Nov" "Dec"]]]
    [:div.flex.flex-col.gap-1
     {:style {:width "100%" :padding "12px"}}
     [:div.flex.items-center.justify-between
      (shui/button {:variant :ghost :size :icon
                    :on-click #(on-navigate (dec year))}
                   (ui/icon "chevron-left" {:size 14}))
      [:span.font-semibold.text-sm (str year)]
      (shui/button {:variant :ghost :size :icon
                    :on-click #(on-navigate (inc year))}
                   (ui/icon "chevron-right" {:size 14}))]
     (for [[r row] (map-indexed vector rows)]
       [:div.flex.gap-1 {:key r}
        (for [[c label] (map-indexed vector row)]
          (let [m (+ (* r 3) c 1)
                selected? (= m month)]
            (shui/button
             {:key     label
              :variant (if selected? :default :ghost)
              :size    :sm
              :class   "flex-1"
              :on-click #(on-select (ymd->int year m 0))}
             label)))])]))

(rum/defc day-calendar
  "Wraps single-calendar (no built-in text input) for day-precision selection.
   :default-month seeds the displayed month on each mount; combined with the
   YYYYMM-keyed remount in endpoint-picker this keeps the view in sync with
   whatever month the value (or typed text) points at."
  [{:keys [value on-select]}]
  (let [initial-day (when value (int->js-date value))]
    (ui/single-calendar
     {:selected      initial-day
      :default-month initial-day
      :on-day-click  (fn [^js d]
                       (when d
                         (on-select (js-date->int d))))})))

;;; ─── Single endpoint picker ──────────────────────────────────────────────────

(rum/defcs endpoint-picker < (rum/local nil ::display-year)
  "Picker for a single start or end date.
   Renders inside a fixed-size 276×310 px box so that switching between
   Year / Month / Day precision does not resize the pop-over.
   on-select is called with a YYYYMMDD integer when the user picks a date."
  [state {:keys [precision value on-select]}]
  (let [*display-year (::display-year state)
        [val-year val-month _] (when value (int->parts value))
        display-year  (or @*display-year val-year (t/year (t/now)))]
    ;; Fixed-height container.  Using height (not min-height) so the box never
    ;; expands when the day calendar renders a 6-week month, which prevents the
    ;; small jump when switching away from Day precision.  330px safely covers
    ;; the tallest DayPicker layout (6 weeks × ~44px + caption + padding).
    [:div {:style {:width "276px" :height "330px"
                   :display "flex" :flex-direction "column"
                   :align-items "flex-start" :overflow "hidden"}}
     (case precision
       :year
       (year-picker {:year        display-year
                     :on-navigate (fn [y] (reset! *display-year y))
                     :on-select   (fn [y]
                                    (on-select (ymd->int y 0 0)))})

       :month
       (month-grid  {:year        display-year
                     :month       val-month
                     :on-navigate (fn [y] (reset! *display-year y))
                     :on-select   on-select})

       ;; :day (default)
       (day-calendar {:value     value
                      :on-select on-select}))]))

;;; ─── Main component ────────────────────────────────────────────────────────────────────────────

(rum/defcs date-range-picker-inner <
  rum/reactive
  ;; Sentinel :unset means "not yet overridden by user" — actual initial value
  ;; is derived from the value prop on every render.  Once the user makes a
  ;; selection the atom holds the chosen value.
  (rum/local :unset ::start-precision)
  (rum/local :unset ::end-precision)
  (rum/local :unset ::range?)
  (rum/local :unset ::draft-start)
  (rum/local :unset ::draft-end)
  (rum/local :unset ::text-input)
  (rum/local nil   ::text-error)
  (rum/local false ::hint-visible?)
  {:will-mount   (fn [state] (state/set-editor-action! :property-set-date) state)
   :will-unmount (fn [state] (shui/popup-hide!) (state/set-editor-action! nil) state)}
  [state {:keys [value on-change on-delete del-btn?]}]
  (let [*start-precision (::start-precision state)
        *end-precision   (::end-precision state)
        *range?          (::range? state)
        *draft-start     (::draft-start state)
        *draft-end       (::draft-end state)
        *text-input      (::text-input state)
        *text-error      (::text-error state)
        *hint-visible?   (::hint-visible? state)

        ;; Resolve effective values: user override takes priority; fall back to
        ;; the value prop so that editing an existing value shows current data.
        start-precision  (let [p @*start-precision]
                           (if (= p :unset) (or (:precision value) :day) p))
        end-precision    (let [p @*end-precision]
                           (if (= p :unset) (or (:precision value) :day) p))
        range?           (let [r @*range?]
                           (if (= r :unset) (boolean (and value (:end value))) r))
        draft-start      (let [s @*draft-start]
                           (if (= s :unset) (:start value) s))
        draft-end        (let [e @*draft-end]
                           (if (= e :unset) (:end value) e))
        ;; Text box: sentinel :unset means show the formatted existing value.
        text-input       (let [t @*text-input]
                           (if (= t :unset) (or (format-label value) "") t))
        text-error       @*text-error

        ;; Re-reading helpers so closures always see the latest atom values.
        eff-start  #(let [s @*draft-start] (if (= s :unset) (:start value) s))
        eff-end    #(let [e @*draft-end]   (if (= e :unset) (:end value) e))
        eff-range? #(let [r @*range?]      (if (= r :unset) (boolean (and value (:end value))) r))

        ;; Adjust a YYYYMMDD integer to the requested precision.
        adjust-to-prec
        (fn [n p]
          (let [[y m d] (int->parts n)]
            (case p
              :year  (ymd->int y 0 0)
              :month (ymd->int y (max m 1) 0)
              (ymd->int y (max m 1) (max d 1)))))

        set-start-precision!
        (fn [p]
          (reset! *start-precision p)
          (when-let [cur (eff-start)]
            (let [new-s (adjust-to-prec cur p)]
              (reset! *draft-start new-s)
              (reset! *text-input
                      (format-label {:start new-s
                                     :end   (when (eff-range?) (eff-end))})))))

        set-end-precision!
        (fn [p]
          (reset! *end-precision p)
          (when-let [cur (eff-end)]
            (let [new-e (adjust-to-prec cur p)]
              (reset! *draft-end new-e)
              (when-let [s (eff-start)]
                (reset! *text-input
                        (format-label {:start s :end new-e}))))))

        ;; Apply a successfully parsed text result to the draft atoms.
        ;; When the parsed map includes :end, also update *draft-end and
        ;; switch on range mode automatically.  Each half's precision is
        ;; derived independently from its YYYYMMDD integer encoding.
        apply-parsed!
        (fn [{p :precision s :start e :end}]
          (reset! *draft-start s)
          (reset! *start-precision p)
          (reset! *text-error nil)
          (when (some? e)
            (reset! *draft-end e)
            (reset! *end-precision (precision-from-int e))
            (reset! *range? true)))

        ;; Called on Enter: canonicalise text if valid, show error if not.
        commit-text!
        (fn []
          (let [t (string/trim text-input)]
            (if (string/blank? t)
              (reset! *text-error nil)
              (if-let [parsed (parse-date-range-text t)]
                (do (apply-parsed! parsed)
                    (reset! *text-input (format-label parsed)))
                (reset! *text-error "Unrecognised date — try e.g. \"Sep 1, 2025\" or \"Sep 1 – Sep 30, 2025\"")))))

        ok!
        (fn []
          ;; Re-parse the text box so that typing then clicking OK (without Enter) works.
          (let [from-text   (when-not (string/blank? (string/trim text-input))
                              (parse-date-range-text text-input))
                final-start (or (:start from-text) draft-start)
                ;; Text end takes priority; fall back to calendar-clicked end.
                final-end   (or (:end from-text) (when range? draft-end))
                final-prec  (if final-start (precision-from-int final-start) start-precision)]
            (when (and (fn? on-change) final-start)
              (on-change {:precision final-prec
                          :start     final-start
                          :end       final-end}))))

        ;; Renders a row of Year / Month / Day toggle buttons.
        precision-buttons
        (fn [active-prec on-set!]
          [:div.flex.gap-1
           (for [p [:year :month :day]]
             (shui/button
              {:key      (name p)
               :variant  (if (= p active-prec) :default :outline)
               :size     :sm
               :on-click (fn [] (on-set! p))}
              (string/capitalize (name p))))])]

    [:div.flex.flex-col.gap-3.p-1

     ;; ── calendars (side-by-side in range mode) ───────────────────────────────────────────
     ;; Each endpoint is its own column: a precision-button row at the top,
     ;; then a fixed-height endpoint-picker below.  Each endpoint-picker is
     ;; keyed by its value's YYYYMM so that typing a date in a different
     ;; month forces a remount and seeds the correct display month.
     [:div.flex.flex-row.gap-6

      ;; ── Start column ───────────────────────────────────────────────────────────────────
      [:div.flex.flex-col.gap-2
       ;; Always render the label so it occupies the same vertical space
       ;; whether range mode is on or off, keeping the picker height stable.
       [:span.text-xs.font-medium.uppercase.tracking-wide.text-muted-foreground
        {:style {:visibility (if range? "visible" "hidden")}}
        "Start"]
       (precision-buttons start-precision set-start-precision!)
       (rum/with-key
         (endpoint-picker {:precision start-precision
                           :value     draft-start
                           :on-select (fn [v]
                                        (reset! *draft-start v)
                                        (reset! *text-input
                                                (format-label {:start v
                                                               :end   (when range? draft-end)})))})
         (str "s-" (quot (or draft-start 0) 100)))]

      ;; ── End column (only in range mode) ────────────────────────────────────────────────────────────
      (when range?
        [:div.flex.flex-col.gap-2
         [:span.text-xs.font-medium.uppercase.tracking-wide.text-muted-foreground "End"]
         (precision-buttons end-precision set-end-precision!)
         (rum/with-key
           (endpoint-picker {:precision end-precision
                             :value     draft-end
                             :on-select (fn [v]
                                          (reset! *draft-end v)
                                          (reset! *text-input
                                                  (format-label {:start draft-start
                                                                 :end   v})))})
           (str "e-" (quot (or draft-end 0) 100)))])]

     ;; ── text input (below calendar, auto-focused on open) ────────────────────────
     [:div.flex.flex-col.gap-1
      [:div.relative
       (shui/input
        {:auto-focus      true
         :class           "h-8 text-sm"
         :placeholder     "Enter date"
         :value           text-input
         :on-mouse-enter  #(reset! *hint-visible? true)
         :on-mouse-leave  #(reset! *hint-visible? false)
         :on-change       (fn [e]
                            (let [new-text  (.. e -target -value)
                                  ;; Capture previous text before overwriting so we can
                                  ;; detect when the user removes the range separator.
                                  ;; When the atom is still :unset the picker just opened
                                  ;; with an existing value — use the formatted label so
                                  ;; that clearing the box from that state works correctly.
                                  prev-text (let [t @*text-input]
                                              (if (= t :unset)
                                                (or (format-label value) "")
                                                t))]
                              (reset! *text-input new-text)
                              (reset! *text-error nil)
                              ;; Live parse — handle single dates and ranges incrementally.
                              ;; We parse each half independently so the end calendar
                              ;; navigates as the user types, without waiting for the
                              ;; whole string to be valid.
                              (if-let [[p1 p2] (split-range-text new-text)]
                                (do
                                  ;; Separator present → show end calendar immediately.
                                  ;; Even if p2 is blank the user may still be typing,
                                  ;; so we don't collapse range mode here.
                                  (reset! *range? true)
                                  (when-let [sp (parse-date-text p1)]
                                    (reset! *draft-start (:start sp))
                                    (reset! *start-precision (:precision sp)))
                                  (when-let [ep (parse-date-text p2)]
                                    (reset! *draft-end (:start ep))
                                    (reset! *end-precision (:precision ep))))
                                (do
                                  ;; No separator now.  If the previous text had one,
                                  ;; the user deleted it (or cleared the whole box) —
                                  ;; revert to single-date mode.
                                  (when (and range?
                                             (some? prev-text)
                                             (split-range-text prev-text))
                                    (reset! *range? false)
                                    (reset! *draft-end nil))
                                  ;; Single-date parse.
                                  (when-let [parsed (parse-date-text new-text)]
                                    (apply-parsed! parsed))))))
         :on-key-down     (fn [e]
                            (when (= "Enter" (.-key e))
                              (.preventDefault e)
                              (commit-text!)
                              ;; Submit if commit-text! didn't flag an error
                              ;; (blank text is fine — falls back to calendar selection).
                              (when (nil? @*text-error)
                                (ok!))))})
       (when @*hint-visible?
         [:div.absolute.left-0.bottom-full.mb-1.rounded.shadow-md.px-2.py-1
          {:style {:background     "var(--ls-tooltip-background-color, #374151)"
                   :color          "var(--ls-tooltip-text-color, #f9fafb)"
                   :font-size      "0.75rem"
                   :white-space    "nowrap"
                   :z-index        1000
                   :pointer-events "none"}}
          "e.g. yyyy-mm, d mmm yyyy, yyyy - yyyy"])]
      (when text-error
        [:span.text-xs.text-destructive text-error])]

     ;; ── footer ────────────────────────────────────────────────────────────────────────────
     [:div.flex.justify-between.items-center.pt-1
      [:div.flex.gap-1
       (when-not range?
         (shui/button
          {:variant  :outline
           :size     :sm
           :on-click (fn [] (reset! *range? true))}
          (ui/icon "calendar-plus" {:size 14 :class "mr-1"})
          "Add end"))
       (when range?
         (shui/button
          {:variant  :outline
           :size     :sm
           :on-click (fn []
                       (reset! *range? false)
                       (reset! *draft-end nil))}
          "Remove end"))
       (when del-btn?
         (shui/button
          {:variant  :ghost
           :size     :icon
           :class    "text-muted-foreground hover:text-destructive"
           :on-click (fn [e]
                       (util/stop-propagation e)
                       (when (fn? on-delete) (on-delete e)))}
          (ui/icon "trash" {:size 14})))]

      (shui/button
       {:size     :sm
        :disabled (nil? draft-start)
        :on-click ok!}
       "OK")]]))
