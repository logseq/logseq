(ns frontend.extensions.srs
  (:require [frontend.template :as template]
            [frontend.db.query-dsl :as query-dsl]
            [frontend.db.query-react :as react]
            [frontend.util :as util]
            [frontend.util.property :as property]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.handler.editor :as editor-handler]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]
            [clojure.string :as string]
            [rum.core :as rum]
            [datascript.db :as d]))

;;; ================================================================
;;; Some Commentary
;;; - One block with property `card-type-property' is treated as a card.
;;; - When the card's type is ':sided', this block's content is the front side,
;;;   and its children are the back side
;;; - When the card's type is ':cloze', '{{cloze: <content>}}' shows as '[...]'


;;; ================================================================
;;; const & vars

(def card-type [:cloze :sided])

(def card-type-property          :card-type)
(def card-last-interval-property :card-last-interval)
(def card-repeats-property       :card-repeats)
(def card-last-reviewed-property :card-last-reviewed)
(def card-next-schedule-property :card-next-schedule)
(def card-last-easiness-factor   :card-ease-factor)

(def default-card-properties-map {card-last-interval-property -1
                                  card-repeats-property 0
                                  card-last-easiness-factor 2.5})

(def cloze-macro-name
  "cloze syntax: {{cloze: ...}}"
  "cloze")

(def query-macro-name
  "{{card-query ...}}"
  "card-query")

(def learning-fraction
  "any number between 0 and 1 (the greater it is the faster the changes of the OF matrix)"
  0.5)

;;; TODO: persist var 'of-matrix'
(def of-matrix (atom nil))

;;; ================================================================
;;; utils

(defn- get-block-card-properties
  [block]
  (when-let [properties (:block/properties block)]
    (merge
     default-card-properties-map
     (select-keys properties  [card-type-property
                               card-last-interval-property
                               card-repeats-property
                               card-last-reviewed-property
                               card-next-schedule-property
                               card-last-easiness-factor]))))

(defn- save-block-card-properties!
  [repo block props]
  (editor-handler/save-block!
   repo (:block/uuid block)
   (property/insert-properties (:block/format block) (:block/content block) props)))

(defn- reset-block-card-properties!
  [repo block]
  (let [f (fn [key content] (property/remove-property (:block/format block) (name key) content false))]
    (->>
     (f card-last-interval-property (:block/content block))
     (f card-repeats-property)
     (f card-last-easiness-factor)
     (f card-last-reviewed-property)
     (f card-next-schedule-property)
     (#(do (println %) (identity %)))
     (editor-handler/save-block! repo (:block/uuid block)))))

;;; ================================================================
;;; sr algorithm (sm-5)
;;; https://www.supermemo.com/zh/archives1990-2015/english/ol/sm5

(defn- get-of [of-matrix n ef]
  (or (get-in of-matrix [n ef])
      (if (<= n 1)
        4
        ef)))

(defn- set-of [of-matrix n ef of]
  (->>
   (util/format "%.3f" of)
   (cljs.reader/read-string)
   (assoc-in of-matrix [n ef])))

(defn- interval
  [n ef of-matrix]
  (if (<= n 1)
    (get-of of-matrix 1 ef )
    (* (get-of of-matrix n ef )
       (interval (- n 1) ef of-matrix))))

(defn- next-ef
  [ef quality]
  (let [ef* (+ ef (- 0.1 (* (- 5 quality) (+ 0.08 (* 0.02 (- 5 quality))))))]
    (if (< ef* 1.3) 1.3 ef*)))

(defn- next-of-matrix
  [of-matrix n quality fraction ef]
  (let [of (get-of of-matrix n ef)
        of* (* of (+ 0.72 (* quality 0.07)))
        of** (+ (* (- 1 fraction) of ) (* of* fraction))]
    (set-of of-matrix n ef of**)))

(defn next-interval
  "return [next-interval repeats next-ef of-matrix]"
  [last-interval repeats ef quality of-matrix]
  (assert (and (<= quality 5) (>= quality 0)))
  (let [ef (or ef 2.5)
        last-interval (if (or (nil? last-interval) (<= last-interval 0)) 1 last-interval)
        next-interval (interval repeats ef of-matrix)
        next-ef (next-ef ef quality)
        next-of-matrix (next-of-matrix of-matrix repeats quality learning-fraction ef)]

    (if (< quality 3)
      ;; If the quality response was lower than 3
      ;; then start repetitions for the item from
      ;; the beginning without changing the E-Factor
      [-1 1 ef next-of-matrix]
      [next-interval (+ 1 repeats) next-ef next-of-matrix])))


;;; ================================================================
;;; card protocol
(defprotocol ICard
  (card-type [this]))

(defprotocol ICardShow
  ;; `show-phase-1' shows cards without hidden contents
  (show-phase-1 [this])
  ;; `show-phase-2' shows cards with all contents
  (show-phase-2 [this]))


;;; ================================================================
;;; card impl

(deftype SidedCard [block]
  ICard
  (card-type [this] :sided)
  ICardShow
  (show-phase-1 [this] block)
  (show-phase-2 [this]
    (db/get-block-and-children (state/get-current-repo) (:block/uuid block))))

(deftype ClozeCard [block]
  ICard
  (card-type [this] :cloze)
  ICardShow
  (show-phase-1 [this] block)
  (show-phase-2 [this]
    (db/get-block-and-children (state/get-current-repo) (:block/uuid block))))


;;; ================================================================
;;;

(defn- query
  "Use same syntax as frontend.db.query-dsl.
  Add an extra condition: blocks with `card-type-property'"
  [repo query-string]
  (when (string? query-string)
    (let [query-string (template/resolve-dynamic-template! query-string)]
      (when-not (string/blank? query-string)
        (let [{:keys [query sort-by blocks?] :as result} (query-dsl/parse repo query-string)]
          (when query
            (let [query* (concat `[[~'?b :block/properties ~'?prop]
                                   [(~'missing? ~'$ ~'?b :block/name)]
                                   [(~'get ~'?prop ~card-type-property) ~'?prop-v]]
                                 query)]
              (when-let [query** (query-dsl/query-wrapper query* blocks?)]
                (react/react-query repo
                                   {:query query**}
                                   (if sort-by
                                     {:transform-fn sort-by}))))))))))


(defn- query-scheduled
  "Return blocks scheduled to 'time' or before"
  [repo query-string time]
  (when-let [blocks @(query repo query-string)]
    (->>
     (flatten blocks)
     (filterv (fn [b]
                (let [props (:block/properties b)
                      next-sched (get props card-next-schedule-property)
                      repeats (get props card-repeats-property)]
                  (or (nil? repeats)
                      (< repeats 1)
                      (nil? next-sched)
                      (t/before? (tc/from-string next-sched) time))))))))



;;; ================================================================
;;; operations

(defn- operation-score!
  [card score]
  {:pre [(and (<= score 5) (>= score 0))
         (satisfies? ICard card)]}
  (let [block (.-block card)
        props (get-block-card-properties block)
        last-interval (or (util/safe-parse-float (get props card-last-interval-property)) 0)
        repeats (or (util/safe-parse-int (get props card-repeats-property)) 0)
        last-ef (or (util/safe-parse-float (get props card-last-easiness-factor)) 2.5)]
    (let [[next-interval next-repeats next-ef of-matrix*]
          (next-interval last-interval repeats last-ef score @of-matrix)
          next-interval* (if (< next-interval 0) 0 next-interval)
          next-schedule (tc/to-string (t/plus (t/now) (t/hours (* 24 next-interval*))))
          now (tc/to-string (t/now))]
      (reset! of-matrix of-matrix*)
      (save-block-card-properties! (state/get-current-repo)
                                  (db/get-block-by-uuid (:block/uuid block))
                                  {card-last-interval-property next-interval
                                   card-repeats-property next-repeats
                                   card-last-easiness-factor next-ef
                                   card-next-schedule-property next-schedule
                                   card-last-reviewed-property now}))))

(defn- operation-reset!
  [card]
  {:pre [(satisfies? ICard card)]}
  (let [block (.-block card)]
    (reset-block-card-properties! (state/get-current-repo)
                                  (db/get-block-by-uuid (:block/uuid block)))))


;;; ================================================================
;;; UI

(rum/defc preview < rum/reactive
  [card]
  (assert (satisfies? ICardShow card))
  [:div ""])
