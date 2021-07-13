(ns frontend.extensions.srs
  (:require [frontend.template :as template]
            [frontend.db.query-dsl :as query-dsl]
            [frontend.db.query-react :as react]
            [frontend.util :as util]
            [frontend.util.property :as property]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.handler.editor :as editor-handler]
            [frontend.components.block :as component-block]
            [frontend.components.macro :as component-macro]
            [frontend.components.svg :as svg]
            [frontend.ui :as ui]
            [cljs-time.core :as t]
            [cljs-time.local :as tl]
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

(def card-type-set #{:cloze :sided})

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

(defn- get-block-card-type
  [block]
  (keyword (get (:block/properties block) card-type-property)))

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
  [block props]
  (editor-handler/save-block-if-changed!
   block
   (property/insert-properties (:block/format block) (:block/content block) props)
   {:force? true}))

(defn- reset-block-card-properties!
  [block]
  (save-block-card-properties! block {card-last-interval-property -1
                                      card-repeats-property 0
                                      card-last-easiness-factor 2.5
                                      card-last-reviewed-property "nil"
                                      card-next-schedule-property "nil"}))


;;; used by other ns
(defn card-block?
  [block]
  (let [type (keyword (get (:block/properties block) card-type-property))]
    (and type (contains? card-type-set type))))

;;; ================================================================
;;; sr algorithm (sm-5)
;;; https://www.supermemo.com/zh/archives1990-2015/english/ol/sm5

(defn- fix-2f
  [n]
  (/ (Math/round (* 100 n)) 100))

(defn- get-of [of-matrix n ef]
  (or (get-in of-matrix [n ef])
      (if (<= n 1)
        4
        ef)))

(defn- set-of [of-matrix n ef of]
  (->>
   (fix-2f of)
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
        next-ef (next-ef ef quality)
        next-of-matrix (next-of-matrix of-matrix repeats quality learning-fraction ef)
        next-interval (interval repeats next-ef next-of-matrix)]

    (if (< quality 3)
      ;; If the quality response was lower than 3
      ;; then start repetitions for the item from
      ;; the beginning without changing the E-Factor
      [-1 1 ef next-of-matrix]
      [(fix-2f next-interval) (+ 1 repeats) (fix-2f next-ef) next-of-matrix])))


;;; ================================================================
;;; card protocol
(defprotocol ICard
  (card-type [this]))

(defprotocol ICardShow
  ;; `show-phase-1' shows cards without hidden contents
  (show-phase-1 [this])
  ;; `show-phase-2' shows cards with all contents
  (show-phase-2 [this])

  ;; show-phase-1-config & show-phase-2-config control display styles of cards at different phases
  (show-phase-1-config [this])
  (show-phase-2-config [this]))


;;; ================================================================
;;; card impl

(deftype SidedCard [block]
  ICard
  (card-type [this] :sided)
  ICardShow
  (show-phase-1 [this] [block])
  (show-phase-2 [this]
    (db/get-block-and-children (state/get-current-repo) (:block/uuid block)))
  (show-phase-1-config [this] {})
  (show-phase-2-config [this] {}))

(deftype ClozeCard [block]
  ICard
  (card-type [this] :cloze)
  ICardShow
  (show-phase-1 [this]
    (db/get-block-and-children (state/get-current-repo) (:block/uuid block)))
  (show-phase-2 [this]
    (db/get-block-and-children (state/get-current-repo) (:block/uuid block)))
  (show-phase-1-config [this] {:cloze true})
  (show-phase-2-config [this] {}))


(defn- ->card [block]
  (case (get-block-card-type block)
    :cloze (->ClozeCard block)
    :sided (->SidedCard block)
    :else (->SidedCard block)))

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
                                 (if (coll? (first query))
                                   query
                                   [query]))]
              (when-let [query** (query-dsl/query-wrapper query* blocks?)]
                (react/react-query repo
                                   {:query query**}
                                   (if sort-by
                                     {:transform-fn sort-by}))))))))))


(defn- query-scheduled
  "Return blocks scheduled to 'time' or before"
  [repo query-string time]
  (when-let [*blocks (query repo query-string)]
    (when-let [blocks @*blocks]
      (->>
       (flatten blocks)
       (filterv (fn [b]
                  (let [props (:block/properties b)
                        next-sched (get props card-next-schedule-property)
                        next-sched* (tc/from-string next-sched)
                        repeats (get props card-repeats-property)]
                    (or (nil? repeats)
                        (< repeats 1)
                        (nil? next-sched)
                        (nil? next-sched*)
                        (t/before? next-sched* time)))))))))



;;; ================================================================
;;; operations

(defn- get-next-interval
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
          next-schedule (tc/to-string (t/plus (tl/local-now) (t/hours (* 24 next-interval*))))
          now (tc/to-string (tl/local-now))]
      {:next-of-matrix of-matrix*
       card-last-interval-property next-interval
       card-repeats-property next-repeats
       card-last-easiness-factor next-ef
       card-next-schedule-property next-schedule
       card-last-reviewed-property now})))

(defn- operation-score!
  [card score]
  {:pre [(and (<= score 5) (>= score 0))
         (satisfies? ICard card)]}
  (let [block (.-block card)
        result (get-next-interval card score)
        next-of-matrix (:next-of-matrix result)]
    (reset! of-matrix next-of-matrix)
    (save-block-card-properties! (db/pull [:block/uuid (:block/uuid block)])
                                 (select-keys result
                                              [card-last-interval-property
                                               card-repeats-property
                                               card-last-easiness-factor
                                               card-next-schedule-property
                                               card-last-reviewed-property]))))

(defn- operation-reset!
  [card]
  {:pre [(satisfies? ICard card)]}
  (let [block (.-block card)]
    (reset-block-card-properties! (db/pull [:block/uuid (:block/uuid block)]))))


(defn- operation-card-info-summary
  [cards]
  "TODO")

;;; ================================================================
;;; UI

(defn- score-help-info [days-3 days-4 days-5]
  (ui/tippy {:html [:div
                    [:p.text-sm "0-2: you have forgotten this card."]
                    [:p.text-sm "3-5: you remember this card."]
                    [:p.text-sm "0: completely forgot."]
                    [:p.text-sm "1: it still takes a while to recall even after seeing the answer."]
                    [:p.text-sm "2: immediately recall after seeing the answer."]
                    [:p.text-sm
                     (util/format "3: it takes a while to recall. (will reappear after %d days)" days-3)]
                    [:p.text-sm
                     (util/format "4: you recall this after a little thought. (will reappear after %d days)"
                                  days-4)]
                    [:p.text-sm
                     (util/format "5: you remember it easily. (will reappear after %d days)" days-5)]]
             :class "tippy-hover mr-2"
             :interactive true
             :disabled false}
            (svg/info)))

(rum/defcs view
  < rum/reactive
  (rum/local 1 ::phase)
  (rum/local 0 ::card-index)
  (rum/local nil ::cards)
  [state cards {read-only :read-only cb :callback}]
  (let [cards* (::cards state)
        _ (when (nil? @cards*) (reset! cards* cards))
        card-index (::card-index state)
        card (nth @cards* @card-index)
        phase (::phase state)
        blocks (case @phase
                 1 (show-phase-1 card)
                 2 (show-phase-2 card))
        root-block (.-block card)
        score-and-next-card-fn (fn [score]
                                 (operation-score! card score)
                                 (if (>= (inc @card-index) (count @cards*))
                                   (do (state/close-modal!)
                                       (and cb (cb)))
                                   (do (swap! card-index inc)
                                       (reset! phase 1))))
        restore-card-fn #(swap! cards* (fn [o]
                                         (conj o (nth o @card-index))))]
    [:div
     [:div.w-144.h-96.resize.overflow-y-auto
      (component-block/blocks-container
       blocks
       (merge
        (case @phase
          1 (show-phase-1-config card)
          2 (show-phase-2-config card))
        {:id (str (:block/uuid root-block))}))]
     (into []
           (concat
            [:div.flex.items-start
             (ui/button (if (= 1 @phase) "Show Answers" "Hide Answers")
                        :class "w-32 mr-2"
                        :on-click #(swap! phase (fn [o] (if (= 1 o) 2 1))))
             (ui/button "Reset"
                        :class "mr-8"
                        :on-click #(operation-reset! card))]
            (when (not read-only)
              [(ui/button "skip"
                          :class "mr-2"
                          :on-click #(if (>= (inc @card-index) (count @cards*))
                                       (do (state/close-modal!)
                                           (and cb (cb)))
                                       (do
                                         (swap! card-index inc)
                                         (reset! phase 1))))])
            (when (and (not read-only) (= 2 @phase))
              (let [interval-days-score-3 (get (get-next-interval card 3) card-last-interval-property)
                    interval-days-score-4 (get (get-next-interval card 4) card-last-interval-property)
                    interval-days-score-5 (get (get-next-interval card 5) card-last-interval-property)]
                [(ui/button "0" :on-click (fn [] (restore-card-fn) (score-and-next-card-fn 0)) :class "mr-2")
                 (ui/button "1" :on-click (fn [] (restore-card-fn) (score-and-next-card-fn 1)) :class "mr-2")
                 (ui/button "2" :on-click (fn [] (restore-card-fn) (score-and-next-card-fn 2)) :class "mr-2")
                 (ui/button "3" :on-click #(score-and-next-card-fn 3) :class "mr-2")
                 (ui/button "4" :on-click #(score-and-next-card-fn 4) :class "mr-2")
                 (ui/button "5" :on-click #(score-and-next-card-fn 5) :class "mr-2")
                 (score-help-info
                  (Math/round interval-days-score-3)
                  (Math/round interval-days-score-4)
                  (Math/round interval-days-score-5))]))))]))

(defn preview
  [blocks]
  (state/set-modal! #(view (mapv ->card blocks) {:read-only true})))


;;; ================================================================
;;; register some external vars & related UI

;;; register cloze macro
(defn cloze-macro-show
  [config options]
  (if (:cloze config)
    [:span.text-blue-600 "[...]"]
    [:span
     [:span.text-blue-600 "["]
     (string/join ", " (:arguments options))
     [:span.text-blue-600 "]"]]))

(component-macro/register cloze-macro-name cloze-macro-show)

;;; register card-query macro
(rum/defcs card-query-show
  < rum/reactive
  (rum/local false ::need-requery)
  [state config options]
  (let [query (string/join ", " (:arguments options))
        sched-blocks (query-scheduled (state/get-current-repo) query (tl/local-now))]
    [:div.opacity-70.custom-query-title.flex.flex-row
     [:div.w-full.flex-1
      [:code.p-1 (str "Card-Query: " query)]]
     [:div
      [:a.opacity-70.hover:opacity-100.svg-small.inline
       {:on-click (fn [_]
                    (let [sched-blocks* (query-scheduled (state/get-current-repo) query (tl/local-now))]
                      (when (> (count sched-blocks*) 0)
                        (state/set-modal! #(view (mapv ->card sched-blocks)
                                                 {:callback (fn [] (swap! (::need-requery state) (fn [o] (not o))))})))))}
       svg/edit]
      [:a.open-block-ref-link.bg-base-2.text-sm.ml-2
       {:title "click to refresh count"
        :on-click #(swap! (::need-requery state) (fn [o] (not o)))}
       (count sched-blocks)]]]))

(component-macro/register query-macro-name card-query-show)

;;; register builtin properties
(property/register-built-in-properties #{card-last-interval-property
                                         card-repeats-property
                                         card-last-reviewed-property
                                         card-next-schedule-property
                                         card-last-easiness-factor})
