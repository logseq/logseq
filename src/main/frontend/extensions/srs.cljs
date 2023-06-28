(ns frontend.extensions.srs
  (:require [frontend.template :as template]
            [frontend.db.query-dsl :as query-dsl]
            [frontend.db.query-react :as query-react]
            [frontend.util :as util]
            [logseq.graph-parser.property :as gp-property]
            [logseq.graph-parser.util.page-ref :as page-ref]
            [frontend.util.property :as property]
            [frontend.util.drawer :as drawer]
            [frontend.util.persist-var :as persist-var]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.db-mixins :as db-mixins]
            [frontend.state :as state]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.editor.property :as editor-property]
            [frontend.components.block :as component-block]
            [frontend.components.macro :as component-macro]
            [frontend.components.select :as component-select]
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
            [frontend.modules.shortcut.core :as shortcut]
            [medley.core :as medley]
            [frontend.context.i18n :refer [t]]))

;;; ================================================================
;;; Commentary
;;; - One block with tag "#card" or "[[card]]" is treated as a card.
;;; - {{cloze content}} show as "[...]" when reviewing cards

;;; ================================================================
;;; const & vars

;; TODO: simplify state

(defonce global-cards-mode? (atom false))

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
  [_last-interval repeats ef quality of-matrix]
  (assert (and (<= quality 5) (>= quality 0)))
  (let [ef (or ef 2.5)
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
  (let [result (map (fn [block]
                      (-> block
                          (dissoc :block/collapsed?)
                          (medley/dissoc-in [:block/properties :collapsed]))) blocks)]
    result))

;;; ================================================================
;;; card impl

(deftype Sided-Cloze-Card [block]
  ICard
  (get-root-block [_this] (db/pull [:block/uuid block]))
  ICardShow
  (show-cycle [_this phase]
    (let [block-id (:db/id block)
          blocks (-> (db/get-paginated-blocks (state/get-current-repo) block-id
                                              {:scoped-block-id block-id})
                     clear-collapsed-property)
          cloze? (has-cloze? blocks)]
      (case phase
        1
        (let [blocks-count (count blocks)]
          {:value [(first blocks)] :next-phase (if (or (> blocks-count 1) (nil? cloze?)) 2 3)})
        2
        {:value blocks :next-phase (if cloze? 3 1)}
        3
        {:value blocks :next-phase 1})))

  (show-cycle-config [_this phase]
    (case phase
      1
      {}
      2
      {}
      3
      {:show-cloze? true})))

(defn- ->card [block]
  (let [block' (db/pull (:db/id block))]
    (->Sided-Cloze-Card block')))

;;; ================================================================
;;;

(defn- query
  "Use same syntax as frontend.db.query-dsl.
  Add an extra condition: block's :block/refs contains `#card or [[card]]'"
  ([repo query-string]
   (query repo query-string {}))
  ([repo query-string {:keys [use-cache?]
                       :or {use-cache? true}}]
   (when (string? query-string)
     (let [result (if (string/blank? query-string)
                    (:block/_refs (db/entity [:block/name card-hash-tag]))
                    (let [query-string (template/resolve-dynamic-template! query-string)
                          query-string (if-not (or (string/blank? query-string)
                                                   (string/starts-with? query-string "(")
                                                   (string/starts-with? query-string "["))
                                         (page-ref/->page-ref (string/trim query-string))
                                         query-string)
                          {:keys [query sort-by rules]} (query-dsl/parse query-string)
                          query* (util/concat-without-nil
                                  [['?b :block/refs '?br] ['?br :block/name card-hash-tag]]
                                  (if (coll? (first query)) query [query]))]
                      (when-let [query (query-dsl/query-wrapper query*
                                                                {:blocks? true
                                                                 :block-attrs [:db/id :block/properties]})]
                        (let [result (query-react/react-query repo
                                                              {:query (with-meta query {:cards-query? true})
                                                               :rules (or rules [])}
                                                              (merge
                                                               {:use-cache? use-cache?}
                                                               (when sort-by
                                                                 {:transform-fn sort-by})))]
                          (when result
                            (flatten (util/react result)))))))]
       (vec result)))))

(defn- query-scheduled
  "Return blocks scheduled to 'time' or before"
  [blocks time]
  (let [filtered-result (filterv (fn [b]
                                   (let [props (:block/properties b)
                                         next-sched (get props card-next-schedule-property)
                                         next-sched* (tc/from-string next-sched)
                                         repeats (get props card-repeats-property)]
                                     (or (nil? repeats)
                                         (< repeats 1)
                                         (nil? next-sched)
                                         (nil? next-sched*)
                                         (t/before? next-sched* time))))
                                 blocks),
        sort-by-next-schedule   (sort-by (fn [b]
                                           (get (get b :block/properties) card-next-schedule-property)) filtered-result)]
    {:total (count blocks)
     :result sort-by-next-schedule}))


;;; ================================================================
;;; operations


(defn- get-next-interval
  [card score]
  {:pre [(and (<= score 5) (>= score 0))
         (satisfies? ICard card)]}
  (let [block (.-block card)
        props (get-block-card-properties block)
        last-interval (or
                       (when-let [v (get props card-last-interval-property)]
                         (util/safe-parse-float v))
                       0)
        repeats (or (when-let [v (get props card-repeats-property)]
                      (util/safe-parse-int v))
                    0)
        last-ef (or (when-let [v (get props card-last-easiness-factor-property)]
                      (util/safe-parse-float v)) 2.5)
        [next-interval next-repeats next-ef of-matrix*]
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
     card-last-score-property score}))

(defn- operation-score!
  [card score]
  {:pre [(and (<= score 5) (>= score 0))
         (satisfies? ICard card)]}
  (let [block (.-block card)
        result (get-next-interval card score)
        next-of-matrix (:next-of-matrix result)]
    (reset! of-matrix next-of-matrix)
    (save-block-card-properties! (db/pull (:db/id block))
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
    (reset-block-card-properties! (db/pull (:db/id block)))))

(defn- operation-card-info-summary!
  [review-records review-cards card-query-block]
  (when card-query-block
    (let [review-count (count (flatten (vals review-records)))
          review-cards-count (count review-cards)
          score-remembered-count (+ (count (get review-records 5))
                                    (count (get review-records 3)))
          score-forgotten-count (count (get review-records 1))]
      (editor-handler/insert-block-tree-after-target
       (:db/id card-query-block) false
       [{:content (util/format "Summary: %d items, %d review counts [[%s]]"
                               review-cards-count review-count (date/today))
         :children [{:content
                     (util/format "Remembered:   %d (%d%%)" score-remembered-count (* 100 (/ score-remembered-count review-count)))}
                    {:content
                     (util/format "Forgotten :   %d (%d%%)" score-forgotten-count (* 100 (/ score-forgotten-count review-count)))}]}]
       (:block/format card-query-block)
       false))))

;;; ================================================================
;;; UI

(defn- dec-cards-due-count!
  []
  (state/update-state! :srs/cards-due-count
                       (fn [n]
                         (if (> n 0)
                           (dec n)
                           n))))

(defn- score-and-next-card [score card *card-index finished? *phase *review-records cb]
  (operation-score! card score)
  (swap! *review-records #(update % score (fn [ov] (conj ov card))))
  (if finished?
    (when cb (cb @*review-records))
    (reset! *phase 1))
  (swap! *card-index inc)
  (when @global-cards-mode?
    (dec-cards-due-count!)))

(defn- skip-card [card *card-index finished? *phase *review-records cb]
  (swap! *review-records #(update % "skip" (fn [ov] (conj ov card))))
  (swap! *card-index inc)
  (if finished?
    (when cb (cb @*review-records))
    (reset! *phase 1)))

(def review-finished
  [:p.p-2 (t :flashcards/modal-finished)])

(defn- btn-with-shortcut [{:keys [shortcut id btn-text background on-click class]}]
  (ui/button
   [:span btn-text (when-not (util/sm-breakpoint?)
                     [" " (ui/render-keyboard-shortcut shortcut)])]
   :id id
   :class (str id " " class)
   :background background
   :on-mouse-down (fn [e] (util/stop-propagation e))
   :on-click (fn [_e]
               (js/setTimeout #(on-click) 10))))

(rum/defcs view < rum/reactive db-mixins/query
  (rum/local 1 ::phase)
  (rum/local {} ::review-records)
  [state blocks {preview? :preview?
                 cards? :cards?
                 modal? :modal?
                 cb :callback}
   card-index]
  (let [review-records (::review-records state)
        current-block (util/nth-safe blocks @card-index)
        card (when current-block (->card current-block))
        finished? (= (inc @card-index) (count blocks))]
    (if (nil? card)
      review-finished
      (let [phase (::phase state)
            {current-blocks :value next-phase :next-phase} (show-cycle card @phase)
            root-block (.-block card)
            root-block-id (:block/uuid root-block)]
        [:div.ls-card.content
         {:class (when (or preview? modal?)
                   (str (util/hiccup->class ".flex.flex-col.resize.overflow-y-auto")
                        (when modal? " modal-cards")))}
         (let [repo (state/get-current-repo)]
           [:div {:style {:margin-top 20}}
            (component-block/breadcrumb {} repo root-block-id {})])
         (component-block/blocks-container
          current-blocks
          (merge (show-cycle-config card @phase)
                 {:id (str root-block-id)
                  :editor-box editor/box
                  :review-cards? true}))
         (if (or preview? modal?)
           [:div.flex.my-4.justify-between
            (when-not (and (not preview?) (= next-phase 1))
              (btn-with-shortcut {:btn-text (case next-phase
                                              1 (t :flashcards/modal-btn-hide-answers)
                                              2 (t :flashcards/modal-btn-show-answers)
                                              3 (t :flashcards/modal-btn-show-clozes))
                                  :shortcut  "s"
                                  :id "card-answers"
                                  :class "mr-2"
                                  :on-click #(reset! phase next-phase)}))
            (when (and (not= @card-index (count blocks))
                       cards?
                       preview?)
              (btn-with-shortcut {:btn-text (t :flashcards/modal-btn-next-card)
                                  :shortcut "n"
                                  :id       "card-next"
                                  :class    "mr-2"
                                  :on-click (fn [e]
                                              (util/stop e)
                                              (skip-card card card-index finished? phase review-records cb))}))

            (when (and (not preview?) (= 1 next-phase))
              [:<>
               (btn-with-shortcut {:btn-text   (t :flashcards/modal-btn-forgotten)
                                   :shortcut   "f"
                                   :id         "card-forgotten"
                                   :background "red"
                                   :on-click   (fn []
                                                 (score-and-next-card 1 card card-index finished? phase review-records cb)
                                                 (let [tomorrow (tc/to-string (t/plus (t/today) (t/days 1)))]
                                                   (editor-property/set-block-property! root-block-id card-next-schedule-property tomorrow)))})

               (btn-with-shortcut {:btn-text (if (util/mobile?) "Hard" (t :flashcards/modal-btn-recall))
                                   :shortcut "t"
                                   :id       "card-recall"
                                   :on-click #(score-and-next-card 3 card card-index finished? phase review-records cb)})

               (btn-with-shortcut {:btn-text   (t :flashcards/modal-btn-remembered)
                                   :shortcut   "r"
                                   :id         "card-remembered"
                                   :background "green"
                                   :on-click   #(score-and-next-card 5 card card-index finished? phase review-records cb)})])

            (when preview?
              (ui/tippy {:html [:div.text-sm
                                (t :flashcards/modal-btn-reset-tip)]
                         :class "tippy-hover"
                         :interactive true}
                        (ui/button [:span (t :flashcards/modal-btn-reset)]
                                   :id "card-reset"
                                   :class (util/hiccup->class "opacity-60.hover:opacity-100.card-reset")
                                   :on-click (fn [e]
                                               (util/stop e)
                                               (operation-reset! card)))))]
           [:div.my-3 (ui/button "Review cards" :small? true)])]))))

(rum/defc view-modal <
  (shortcut/mixin :shortcut.handler/cards false)
  [blocks option card-index]
  [:div#cards-modal
   (if (seq blocks)
     (rum/with-key
       (view blocks option card-index)
       (str "ls-card-" (:db/id (first blocks))))
     review-finished)])

(rum/defc preview-cp < rum/reactive db-mixins/query
  [block-id]
  (let [blocks (db/get-paginated-blocks (state/get-current-repo) block-id
                                        {:scoped-block-id block-id})]
    (view-modal blocks {:preview? true} (atom 0))))

(defn preview
  [block-id]
  (state/set-modal! #(preview-cp block-id) {:id :srs}))

;;; ================================================================
;;; register some external vars & related UI

;;; register cloze macro

(def ^:private cloze-cue-separator "\\\\")

(defn- cloze-parse
  "Parse the cloze content, and return [answer cue]."
  [content]
  (let [parts (string/split content cloze-cue-separator -1)]
    (if (<= (count parts) 1)
      [content nil]
      (let [cue (string/trim (last parts))]
        ;; If there are more than one separator, only the last component is considered the cue.
        [(string/trimr (string/join cloze-cue-separator (drop-last parts))) cue]))))

(rum/defcs cloze-macro-show < rum/reactive
  {:init (fn [state]
           (let [config (first (:rum/args state))
                 shown? (atom (:show-cloze? config))]
             (assoc state :shown? shown?)))}
  [state config options]
  (let [shown?* (:shown? state)
        shown? (rum/react shown?*)
        toggle! #(swap! shown?* not)
        [answer cue] (cloze-parse (string/join ", " (:arguments options)))]
    (if (or shown? (:show-cloze? config))
      [:a.cloze-revealed {:on-click toggle!}
       (util/format "[%s]" answer)]
      [:a.cloze {:on-click toggle!}
       (if (string/blank? cue)
         "[...]"
         (str "(" cue ")"))])))

(component-macro/register cloze-macro-name cloze-macro-show)

(def cards-total (atom 0))

(defn get-srs-cards-total
  []
  (try
    (let [repo (state/get-current-repo)
          query-string ""
          blocks (query repo query-string {:use-cache?        false})]
      (when (seq blocks)
        (let [{:keys [result]} (query-scheduled blocks (tl/local-now))
              count (count result)]
          (reset! cards-total count)
          count)))
    (catch :default e
      (js/console.error e) 0)))

(declare cards)

(rum/defc cards-select
  [{:keys [on-chosen]}]
  (let [cards (db-model/get-macro-blocks (state/get-current-repo) "cards")
        items (->> (map (comp :logseq.macro-arguments :block/properties) cards)
                   (map (fn [col] (string/join " " col))))
        items (concat items [(t :flashcards/modal-select-all)])]
    (component-select/select {:items items
                              :on-chosen on-chosen
                              :close-modal? false
                              :input-default-placeholder (t :flashcards/modal-select-switch)
                              :extract-fn nil})))

;;; register cards macro
(rum/defcs ^:large-vars/cleanup-todo cards-inner < rum/reactive db-mixins/query
  (rum/local 0 ::card-index)
  (rum/local false ::random-mode?)
  (rum/local false ::preview-mode?)
  [state config options {:keys [query-atom query-string query-result due-result]}]
  (let [*random-mode? (::random-mode? state)
        *preview-mode? (::preview-mode? state)
        *card-index (::card-index state)]
    (if (seq query-result)
      (let [{:keys [total result]} due-result
            review-cards (if @*preview-mode? query-result result)
            card-query-block (db/entity [:block/uuid (:block/uuid config)])
            filtered-total (count result)
            modal? (:modal? config)
            callback-fn (fn [review-records]
                          (when-not @*preview-mode?
                            (operation-card-info-summary!
                             review-records review-cards card-query-block)
                            (persist-var/persist-save of-matrix)))]
        [:div.flex-1.cards-review {:style (when modal? {:height "100%"})}
         [:div.flex.flex-row.items-center.justify-between.cards-title
          [:div.flex.flex-row.items-center
           (ui/icon "infinity" {:style {:font-size 20}})
           (ui/dropdown
            (fn [{:keys [toggle-fn]}]
              [:div.ml-1.text-sm.font-medium.cursor
               {:on-mouse-down (fn [e]
                                 (util/stop e)
                                 (toggle-fn))}
               [:span.flex (if (string/blank? query-string) (t :flashcards/modal-select-all) query-string)
                [:span {:style {:margin-top 2}}
                 (svg/caret-down)]]])
            (fn [{:keys [toggle-fn]}]
              (cards-select {:on-chosen (fn [query]
                                          (let [query' (if (= query (t :flashcards/modal-select-all)) "" query)]
                                            (reset! query-atom query')
                                            (toggle-fn)))}))
            {:modal-class (util/hiccup->class
                           "origin-top-right.absolute.left-0.mt-2.ml-2.rounded-md.shadow-lg")})]

          [:div.flex.flex-row.items-center

           ;; FIXME: CSS issue
           (if @*preview-mode?
             (ui/tippy {:html [:div.text-sm (t :flashcards/modal-current-total)]
                        :interactive true}
                       [:div.opacity-60.text-sm.mr-3
                        @*card-index
                        [:span "/"]
                        total])
             (ui/tippy {:html [:div.text-sm (t :flashcards/modal-overdue-total)]
                        ;; :class "tippy-hover"
                        :interactive true}
                       [:div.opacity-60.text-sm.mr-3
                        (max 0 (- filtered-total @*card-index))
                        [:span "/"]
                        total]))

           (ui/tippy
            {:html [:div.text-sm (t :flashcards/modal-toggle-preview-mode)]
             :delay [1000, 100]
             :class "tippy-hover"
             :interactive true
             :disabled false}
            [:a.opacity-60.hover:opacity-100.svg-small.inline.font-bold
             {:id "preview-all-cards"
              :style (when @*preview-mode? {:color "orange"})
              :on-click (fn [e]
                          (util/stop e)
                          (swap! *preview-mode? not)
                          (reset! *card-index 0))}
             "A"])

           (ui/tippy
            {:html [:div.text-sm (t :flashcards/modal-toggle-random-mode)]
             :delay [1000, 100]
             :class "tippy-hover"
             :interactive true}
            [:a.mt-1.ml-2.block.opacity-60.hover:opacity-100
             {:on-mouse-down (fn [e]
                               (util/stop e)
                               (swap! *random-mode? not))}
             (ui/icon "arrows-shuffle" {:style (cond->
                                                {:font-size 18
                                                 :font-weight 600}
                                                 @*random-mode?
                                                 (assoc :color "orange"))})])]]
         [:div.px-1
          (when (and (not modal?) (not @*preview-mode?))
            {:on-click (fn []
                         (state/set-modal! #(cards (assoc config :modal? true) {:query-string query-string})
                                           {:id :srs}))})
          (let [view-fn (if modal? view-modal view)
                blocks (if @*preview-mode? query-result review-cards)
                blocks (if @*random-mode? (shuffle blocks) blocks)]
            (view-fn blocks
                     (merge config
                            (merge options
                                   {:random-mode? @*random-mode?
                                    :preview? @*preview-mode?
                                    :callback callback-fn}))
                     *card-index))]])
      (if (:global? config)
        [:div.ls-card.content
         [:h1.title (t :flashcards/modal-welcome-title)]

         [:div
          [:p (t :flashcards/modal-welcome-desc-1)]
          [:img.my-4 {:src "https://docs.logseq.com/assets/2021-07-22_22.28.02_1626964258528_0.gif"}]
          [:p (t :flashcards/modal-welcome-desc-2)
           [:a {:href "https://docs.logseq.com/#/page/Flashcards" :target "_blank"}
            (t :flashcards/modal-welcome-desc-3)]
           (t :flashcards/modal-welcome-desc-4)]]]
        [:div.opacity-60.custom-query-title.ls-card.content
         [:div.w-full.flex-1
          [:code.p-1 (str "Cards: " query-string)]]
         [:div.mt-2.ml-2.font-medium "No matched cards"]]))))

(rum/defcs cards <
  (rum/local nil ::query)
  {:will-mount (fn [state]
                 (state/set-state! :srs/mode? true)
                 state)
   :will-unmount (fn [state]
                   (state/set-state! :srs/mode? false)
                   state)}
  [state config options]
  (let [*query (::query state)
        repo (state/get-current-repo)
        query-string (or @*query
                         (:query-string options)
                         (string/join ", " (:arguments options)))
        query-result (query repo query-string)
        due-result (query-scheduled query-result (tl/local-now))]
    (cards-inner config (assoc options :cards? true)
                 {:query-atom *query
                  :query-string query-string
                  :query-result query-result
                  :due-result due-result})))

(rum/defc global-cards <
  {:will-mount (fn [state]
                 (reset! global-cards-mode? true)
                 state)
   :will-unmount (fn [state]
                   (reset! global-cards-mode? false)
                   state)}
  []
  (cards {:modal? true
          :global? true} {}))

(component-macro/register query-macro-name cards)

;;; register builtin properties
(gp-property/register-built-in-properties #{card-last-interval-property
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

(defn batch-make-cards!
  ([] (batch-make-cards! (state/get-selection-block-ids)))
  ([block-ids]
   (let [block-content-fn (fn [block]
                            [block (-> (property/remove-built-in-properties (:block/format block) (:block/content block))
                                       (drawer/remove-logbook)
                                       string/trim
                                       (str " #" card-hash-tag))])
         blocks (->> block-ids
                     (map #(db/entity [:block/uuid %]))
                     (remove card-block?)
                     (map #(db/pull [:block/uuid (:block/uuid %)]))
                     (map block-content-fn))]
     (when-not (empty? blocks)
       (editor-handler/save-blocks! blocks)))))

(defonce *due-cards-interval (atom nil))

(defn update-cards-due-count!
  []
  (when (state/enable-flashcards?)
    (let [f (fn []
              (let [total (get-srs-cards-total)]
                (state/set-state! :srs/cards-due-count total)))]
      (js/setTimeout f 1000)
      (when (nil? @*due-cards-interval)
        ;; refresh every hour
        (let [interval (js/setInterval f (* 3600 1000))]
          (reset! *due-cards-interval interval))))))