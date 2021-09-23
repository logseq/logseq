(ns frontend.extensions.srs
  (:require [frontend.template :as template]
            [frontend.db.query-dsl :as query-dsl]
            [frontend.db.query-react :as react]
            [frontend.util :as util]
            [frontend.util.property :as property]
            [frontend.util.drawer :as drawer]
            [frontend.util.persist-var :as persist-var]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.handler.editor :as editor-handler]
            [frontend.components.block :as component-block]
            [frontend.components.macro :as component-macro]
            [frontend.components.svg :as svg]
            [frontend.ui :as ui]
            [frontend.date :as date]
            [frontend.commands :as commands]
            [frontend.components.editor :as editor]
            [cljs-time.core :as t]
            [cljs-time.local :as tl]
            [cljs-time.coerce :as tc]
            [clojure.string :as string]
            [rum.core :as rum]
            [frontend.modules.shortcut.core :as shortcut]))

;;; ================================================================
;;; Commentary
;;; - One block with tag "#card" or "[[card]]" is treated as a card.
;;; - {{cloze content}} show as "[...]" when reviewing cards

;;; ================================================================
;;; const & vars

(def card-hash-tag "card")

(def card-last-interval-property        :card-last-interval)
(def card-repeats-property              :card-repeats)
(def card-last-reviewed-property        :card-last-reviewed)
(def card-next-schedule-property        :card-next-schedule)
(def card-last-easiness-factor-property :card-ease-factor)
(def card-last-score-property           :card-last-score)

(def default-card-properties-map {card-last-interval-property -1
                                  card-repeats-property 0
                                  card-last-easiness-factor-property 2.5})

(def cloze-macro-name
  "cloze syntax: {{cloze: ...}}"
  "cloze")

(def query-macro-name
  "{{cards ...}}"
  "cards")

(def learning-fraction-default
  "any number between 0 and 1 (the greater it is the faster the changes of the OF matrix)"
  0.5)

(defn- learning-fraction []
  (if-let [learning-fraction (:srs/learning-fraction (state/get-config))]
    (if (and (number? learning-fraction)
             (< learning-fraction 1)
             (> learning-fraction 0))
      learning-fraction
      learning-fraction-default)
    learning-fraction-default))

(def of-matrix (persist-var/persist-var nil "srs-of-matrix"))

(def initial-interval-default 4)

(defn- initial-interval []
  (if-let [initial-interval (:srs/initial-interval (state/get-config))]
    (if (and (number? initial-interval)
             (> initial-interval 0))
      initial-interval
      initial-interval-default)
    initial-interval-default))

;;; ================================================================
;;; utils

(defn- get-block-card-properties
  [block]
  (when-let [properties (:block/properties block)]
    (merge
     default-card-properties-map
     (select-keys properties  [card-last-interval-property
                               card-repeats-property
                               card-last-reviewed-property
                               card-next-schedule-property
                               card-last-easiness-factor-property
                               card-last-score-property]))))

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
                                      card-last-easiness-factor-property 2.5
                                      card-last-reviewed-property "nil"
                                      card-next-schedule-property "nil"
                                      card-last-score-property "nil"}))


;;; used by other ns


(defn card-block?
  [block]
  (let [card-entity (db/entity [:block/name card-hash-tag])
        refs (into #{} (:block/refs block))]
    (contains? refs card-entity)))

(declare get-root-block)
(defn- card-group-by-repeat [cards]
  (let [groups (group-by
                #(get (get-block-card-properties (get-root-block %)) card-repeats-property)
                cards)]
    groups))

;;; ================================================================
;;; sr algorithm (sm-5)
;;; https://www.supermemo.com/zh/archives1990-2015/english/ol/sm5

(defn- fix-2f
  [n]
  (/ (Math/round (* 100 n)) 100))

(defn- get-of [of-matrix n ef]
  (or (get-in of-matrix [n ef])
      (if (<= n 1)
        (initial-interval)
        ef)))

(defn- set-of [of-matrix n ef of]
  (->>
   (fix-2f of)
   (assoc-in of-matrix [n ef])))

(defn- interval
  [n ef of-matrix]
  (if (<= n 1)
    (get-of of-matrix 1 ef)
    (* (get-of of-matrix n ef)
       (interval (- n 1) ef of-matrix))))

(defn- next-ef
  [ef quality]
  (let [ef* (+ ef (- 0.1 (* (- 5 quality) (+ 0.08 (* 0.02 (- 5 quality))))))]
    (if (< ef* 1.3) 1.3 ef*)))

(defn- next-of-matrix
  [of-matrix n quality fraction ef]
  (let [of (get-of of-matrix n ef)
        of* (* of (+ 0.72 (* quality 0.07)))
        of** (+ (* (- 1 fraction) of) (* of* fraction))]
    (set-of of-matrix n ef of**)))

(defn next-interval
  "return [next-interval repeats next-ef of-matrix]"
  [last-interval repeats ef quality of-matrix]
  (assert (and (<= quality 5) (>= quality 0)))
  (let [ef (or ef 2.5)
        last-interval (if (or (nil? last-interval) (<= last-interval 0)) 1 last-interval)
        next-ef (next-ef ef quality)
        next-of-matrix (next-of-matrix of-matrix repeats quality (learning-fraction) ef)
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
  (get-root-block [this]))

(defprotocol ICardShow
  ;; return {:value blocks :next-phase next-phase}
  (show-cycle [this phase])

  (show-cycle-config [this phase]))


(defn- has-cloze?
  [blocks]
  (->> (map :block/content blocks)
       (some #(string/includes? % "{{cloze "))))

(defn- clear-collapsed-property
  "Clear block's collapsed property if exists"
  [blocks]
  (let [result (map (fn [block] (assoc-in block [:block/properties :collapsed] false)) blocks)]
    (def result result)
    result))

;;; ================================================================
;;; card impl

(deftype Sided-Cloze-Card [block]
  ICard
  (get-root-block [this] (db/pull [:block/uuid (:block/uuid block)]))
  ICardShow
  (show-cycle [this phase]
    (let [blocks (-> (db/get-block-and-children (state/get-current-repo) (:block/uuid block))
                     clear-collapsed-property)
          cloze? (has-cloze? blocks)]
      (def blocks blocks)
      (case phase
        1
        (let [blocks-count (count blocks)]
          {:value [block] :next-phase (if (> blocks-count 1) 2 3)})
        2
        {:value blocks :next-phase (if cloze? 3 1)}
        3
        {:value blocks :next-phase 1})))

  (show-cycle-config [this phase]
    (case phase
      1
      {}
      2
      {}
      3
      {:show-cloze? true})))

(defn- ->card [block]
  {:pre [(map? block)]}
  (->Sided-Cloze-Card block))

;;; ================================================================
;;;

(defn- query
  "Use same syntax as frontend.db.query-dsl.
  Add an extra condition: block's :block/refs contains `#card or [[card]]'"
  [repo query-string]
  (when (string? query-string)
    (let [query-string (template/resolve-dynamic-template! query-string)]
      (let [{:keys [query sort-by] :as result} (query-dsl/parse repo query-string)]
        (let [query* (concat [['?b :block/refs [:block/name card-hash-tag]]]
                             (if (coll? (first query))
                               query
                               [query]))]
          (when-let [query** (query-dsl/query-wrapper query* true)]
            (react/react-query repo
                               {:query query**}
                               (when sort-by
                                 {:transform-fn sort-by}))))))))

(defn- query-scheduled
  "Return blocks scheduled to 'time' or before"
  [repo blocks time]
  (let [filtered-result (->>
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
                                          (t/before? next-sched* time))))))]
    {:total (count blocks)
     :result filtered-result}))


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
        last-ef (or (util/safe-parse-float (get props card-last-easiness-factor-property)) 2.5)]
    (let [[next-interval next-repeats next-ef of-matrix*]
          (next-interval last-interval repeats last-ef score @of-matrix)
          next-interval* (if (< next-interval 0) 0 next-interval)
          next-schedule (tc/to-string (t/plus (tl/local-now) (t/hours (* 24 next-interval*))))
          now (tc/to-string (tl/local-now))]
      {:next-of-matrix of-matrix*
       card-last-interval-property next-interval
       card-repeats-property next-repeats
       card-last-easiness-factor-property next-ef
       card-next-schedule-property next-schedule
       card-last-reviewed-property now
       card-last-score-property score})))

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
                                               card-last-easiness-factor-property
                                               card-next-schedule-property
                                               card-last-reviewed-property
                                               card-last-score-property]))))

(defn- operation-reset!
  [card]
  {:pre [(satisfies? ICard card)]}
  (let [block (.-block card)]
    (reset-block-card-properties! (db/pull [:block/uuid (:block/uuid block)]))))

(defn- operation-card-info-summary!
  [review-records review-cards card-query-block]
  (when card-query-block
    (let [review-count (count (flatten (vals review-records)))
          review-cards-count (count review-cards)
          score-5-count (count (get review-records 5))
          score-4-count (count (get review-records 4))
          score-3-count (count (get review-records 3))
          score-2-count (count (get review-records 2))
          score-1-count (count (get review-records 1))
          score-0-count (count (get review-records 0))
          skip-count (count (get review-records "skip"))]
      (editor-handler/paste-block-tree-after-target
       (:db/id card-query-block) false
       [{:content (util/format "Summary: %d items, %d review counts [[%s]]"
                               review-cards-count review-count (date/today))
         :children [{:content
                     (util/format "Remembered:   %d (%d%%)" score-5-count (* 100 (/ score-5-count review-count)))}
                    {:content
                     (util/format "Forgotten :   %d (%d%%)" score-1-count (* 100 (/ score-1-count review-count)))}]}]
       (:block/format card-query-block)))))

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
             :class "tippy-hover"
             :interactive true
             :disabled false}
            (svg/info)))

(defn- score-and-next-card [score card *card-index cards *phase *review-records cb]
  (operation-score! card score)
  (swap! *review-records #(update % score (fn [ov] (conj ov card))))
  (if (>= (inc @*card-index) (count cards))
    (when cb
      (swap! *card-index inc)
      (cb @*review-records))
    (do
      (swap! *card-index inc)
      (reset! *phase 1))))

(defn- skip-card [card *card-index cards *phase *review-records cb]
  (swap! *review-records #(update % "skip" (fn [ov] (conj ov card))))
  (swap! *card-index inc)
  (if (>= (inc @*card-index) (count cards))
    (and cb (cb @*review-records))
    (reset! *phase 1)))

(def review-finished
  [:p.p-2 "Congrats, you've reviewed all the cards for this query, see you next time! 💯"])

(rum/defcs view
  < rum/reactive
  (rum/local 1 ::phase)
  (rum/local 0 ::card-index)
  (rum/local {} ::review-records)
  [state blocks {preview? :preview?
                 modal? :modal?
                 cb :callback}]
  (let [cards (map ->card blocks)
        review-records (::review-records state)
        card-index (::card-index state)
        card (util/nth-safe cards @card-index)]
    (if-not card
      review-finished
      (let [phase (::phase state)
            {blocks :value next-phase :next-phase} (show-cycle card @phase)
            root-block (.-block card)
            root-block-id (:block/uuid root-block)]
        [:div.ls-card
         {:class (when (or preview? modal?)
                   (util/hiccup->class ".flex.flex-col.resize.overflow-y-auto.px-4"))}
         (let [repo (state/get-current-repo)]
           [:div.my-2.opacity-70.hover:opacity-100
            (component-block/block-parents {} repo root-block-id
                                           (:block/format root-block)
                                           true)])
         (component-block/blocks-container
          blocks
          (merge (show-cycle-config card @phase)
                 {:id (str root-block-id)
                  :editor-box editor/box}))
         (if (or preview? modal?)
           [:div.flex.my-4.justify-between
            [:div.flex-1
             (when-not (and (not preview?) (= next-phase 1))
               (ui/button (case next-phase
                            1 [:span "Hide answers " (ui/keyboard-shortcut [:s])]
                            2 [:span "Show answers " (ui/keyboard-shortcut [:s])]
                            3 [:span "Show clozes " (ui/keyboard-shortcut [:s])])
                          :id "card-answers"
                          :class "mr-2"
                          :large? true
                          :on-click #(reset! phase next-phase)))

             (when (and (> (count cards) 1) preview?)
               (ui/button [:span "Next " (ui/keyboard-shortcut [:n])]
                          :id "card-next"
                          :class "mr-2"
                          :large? true
                          :on-click #(skip-card card card-index cards phase review-records cb)))

             (when (and (not preview?) (= 1 next-phase))
               (let [interval-days-score-3 (get (get-next-interval card 3) card-last-interval-property)
                     interval-days-score-4 (get (get-next-interval card 5) card-last-interval-property)
                     interval-days-score-5 (get (get-next-interval card 5) card-last-interval-property)]
                 [:div.flex.flex-row.justify-between
                  (ui/button [:span "Forgotten " (ui/keyboard-shortcut [:f])]
                             :id "card-forgotten"
                             :large? true
                             :on-click (fn []
                                         (score-and-next-card 1 card card-index cards phase review-records cb)
                                         (let [tomorrow (tc/to-string (t/plus (t/today) (t/days 1)))]
                                           (editor-handler/set-block-property! root-block-id card-next-schedule-property tomorrow))))

                  (ui/button [:span "Remembered " (ui/keyboard-shortcut [:r])]
                             :id "card-remembered"
                             :large? true
                             :on-click #(score-and-next-card 5 card card-index cards phase review-records cb))

                  (ui/button [:span "Took a while to recall " (ui/keyboard-shortcut [:t])]
                             :id "card-recall"
                             :large? true
                             :on-click #(score-and-next-card 3 card card-index cards phase review-records cb))]))]

            (when preview?
              (ui/tippy {:html [:div.text-sm
                                "Reset this card so that you can review it immediately."]
                         :class "tippy-hover"
                         :interactive true}
                        (ui/button "Reset"
                                   :id "card-reset"
                                   :class (util/hiccup->class "opacity-60.hover:opacity-100")
                                   :small? true
                                   :on-click #(operation-reset! card))))]
           [:div.my-4
            (ui/button "Review cards"
                       :small? true)])]))))

(rum/defc view-modal <
  (shortcut/mixin :shortcut.handler/cards)
  [blocks option]
  (view blocks option))

(defn preview
  [blocks]
  (state/set-modal! #(view blocks {:preview? true})))


;;; ================================================================
;;; register some external vars & related UI

;;; register cloze macro


(rum/defcs cloze-macro-show < rum/reactive
  {:init (fn [state]
           (let [shown? (atom (:show-cloze? config))]
             (assoc state :shown? shown?)))}
  [state config options]
  (let [shown?* (:shown? state)
        shown? (rum/react shown?*)
        toggle! #(swap! shown?* not)]
    (if (or shown? (:show-cloze? config))
      [:a.cloze-revealed {:on-click toggle!}
       (util/format "[%s]" (string/join ", " (:arguments options)))]
      [:a.cloze {:on-click toggle!}
       "[...]"])))

(component-macro/register cloze-macro-name cloze-macro-show)

;;; register cards macro
(rum/defcs cards
  < rum/reactive
  (rum/local false ::need-requery)
  [state config options]
  (let [repo (state/get-current-repo)
        query-string (string/join ", " (:arguments options))]
    (if-let [*query-result (query repo query-string)]
      (let [blocks (rum/react *query-result)
            {:keys [total result]} (query-scheduled repo blocks (tl/local-now))
            review-cards result
            query-string (if (string/blank? query-string) "All" query-string)
            card-query-block (db/entity [:block/uuid (:block/uuid config)])
            filtered-total (count result)
            modal? (:modal? config)]
        [:div.flex-1 {:style (when modal? {:height "100%"})}
         [:div.flex.flex-row.items-center.justify-between.cards-title
          [:div
           [:span.text-sm [:span.font-bold "🗂️"]
            (str ": " query-string)]]

          [:div.flex.flex-row.items-center

           ;; FIXME: CSS issue
           (ui/tippy {:html [:div.text-sm "overdue/total"]
                      ;; :class "tippy-hover"
                      :interactive true}
                     [:div.opacity-60.text-sm
                      filtered-total
                      [:span "/"]
                      total])

           (when-not modal?
             (ui/tippy
              {:html [:div.text-sm "Click to preview all cards"]
               :delay [1000, 100]
               :class "tippy-hover"
               :interactive true
               :disabled false}
              [:a.opacity-60.hover:opacity-100.svg-small.inline.ml-3.font-bold
               {:on-click (fn [_]
                            (let [all-blocks (flatten @(query (state/get-current-repo) query-string))]
                              (when (> (count all-blocks) 0)
                                (let [review-cards all-blocks]
                                  (state/set-modal! #(view-modal
                                                      review-cards
                                                      {:preview? true
                                                       :callback (fn [_]
                                                                   (swap! (::need-requery state) not))}))))))}
               "A"]))]]
         (if (seq review-cards)
           [:div (when-not modal?
                   {:on-click (fn []
                                (state/set-modal! #(view-modal
                                                    review-cards
                                                    {:modal? true
                                                     :callback
                                                     (fn [review-records]
                                                       (operation-card-info-summary!
                                                        review-records review-cards card-query-block)
                                                       (swap! (::need-requery state) not)
                                                       (persist-var/persist-save of-matrix))})))})
            (let [view-fn (if modal? view-modal view)]
              (view-fn review-cards
                       (merge config
                              {:callback
                               (fn [review-records]
                                 (operation-card-info-summary!
                                  review-records review-cards card-query-block)
                                 (swap! (::need-requery state) not)
                                 (persist-var/persist-save of-matrix))})))]
           review-finished)])

      (let [result (query (state/get-current-repo) "")]
        (if (or
             (nil? result)
             (and result (empty? @result)))
          [:div.ls-card
           [:h1.title "Time to create your first card!"]

           [:div
            [:p "You can add \"#card\" to any block to turn it into a card or trigger \"/cloze\" to add some clozes."]
            [:img.my-4 {:src "https://logseq.github.io/assets/2021-07-22_22.28.02_1626964258528_0.gif"}]
            [:p "You can "
             [:a {:href "https://logseq.github.io/#/page/cards" :target "_blank"}
              "click this link"]
             " to check the documentation."]]]

          [:div.opacity-60.custom-query-title.ls-card
           [:div.w-full.flex-1
            [:code.p-1 (str "Cards: " query-string)]]
           [:div.mt-2.ml-2.font-medium "No matched cards"]])))))

(rum/defc global-cards
  []
  (cards {:modal? true} {}))

(component-macro/register query-macro-name cards)

;;; register builtin properties
(property/register-built-in-properties #{card-last-interval-property
                                         card-repeats-property
                                         card-last-reviewed-property
                                         card-next-schedule-property
                                         card-last-easiness-factor-property
                                         card-last-score-property})

;;; register slash commands
(commands/register-slash-command ["Cards"
                                  [[:editor/input "{{cards }}" {:backward-pos 2}]]
                                  "Create a cards query"])

(commands/register-slash-command ["Cloze"
                                  [[:editor/input "{{cloze }}" {:backward-pos 2}]]
                                  "Create a cloze"])

;; handlers
(defn make-block-a-card!
  [block-id]
  (when-let [block (db/entity [:block/uuid block-id])]
    (when-let [content (:block/content block)]
      (let [content (-> (property/remove-built-in-properties (:block/format block) content)
                        (drawer/remove-logbook))]
        (editor-handler/save-block!
         (state/get-current-repo)
         block-id
         (str (string/trim content) " #" card-hash-tag))))))
