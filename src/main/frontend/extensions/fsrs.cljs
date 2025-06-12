(ns frontend.extensions.fsrs
  "Flashcards functions based on FSRS, only works in db-based graphs"
  (:require [clojure.string :as string]
            [frontend.common.missionary :as c.m]
            [frontend.components.block :as component-block]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.async :as db-async]
            [frontend.db.model :as db-model]
            [frontend.db.query-dsl :as query-dsl]
            [frontend.extensions.srs :as srs]
            [frontend.handler.block :as block-handler]
            [frontend.handler.property :as property-handler]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.db :as ldb]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.shui.ui :as shui]
            [missionary.core :as m]
            [open-spaced-repetition.cljc-fsrs.core :as fsrs.core]
            [promesa.core :as p]
            [rum.core :as rum]
            [tick.core :as tick]))

(def ^:private instant->inst-ms (comp inst-ms tick/inst))
(defn- inst-ms->instant [ms] (tick/instant (js/Date. ms)))

(defn- fsrs-card-map->property-fsrs-state
  "Convert card-map to value stored in property"
  [fsrs-card-map]
  (-> fsrs-card-map
      (update :last-repeat instant->inst-ms)
      (update :due instant->inst-ms)))

(defn- property-fsrs-state->fsrs-card-map
  "opposite version of `fsrs-card->property-fsrs-state`"
  [prop-fsrs-state]
  (-> prop-fsrs-state
      (update :last-repeat inst-ms->instant)
      (update :due inst-ms->instant)))

(defn- get-card-map
  "Return nil if block is not #card.
  Return default card-map if `:logseq.property.fsrs/state` or `:logseq.property.fsrs/due` is nil"
  [block-entity]
  (when (some (fn [tag]
                (assert (some? (:db/ident tag)) tag)
                (= :logseq.class/Card (:db/ident tag))) ;block should contains #Card
              (:block/tags block-entity))
    (let [fsrs-state (:logseq.property.fsrs/state block-entity)
          fsrs-due (:logseq.property.fsrs/due block-entity)
          return-default-card-map? (not (and fsrs-state fsrs-due))]
      (if return-default-card-map?
        (if-let [block-created-at (some-> (:block/created-at block-entity) (js/Date.) tick/instant)]
          (assoc (fsrs.core/new-card!)
                 :last-repeat block-created-at
                 :due block-created-at)
          (fsrs.core/new-card!))
        (property-fsrs-state->fsrs-card-map (assoc fsrs-state :due fsrs-due))))))

(defn- repeat-card!
  [repo block-id rating]
  (let [eid (if (uuid? block-id) [:block/uuid block-id] block-id)
        block-entity (db/entity repo eid)]
    (when-let [card-map (get-card-map block-entity)]
      (let [next-card-map (fsrs.core/repeat-card! card-map rating)
            prop-card-map (fsrs-card-map->property-fsrs-state next-card-map)
            prop-fsrs-state (-> prop-card-map
                                (dissoc :due)
                                (assoc :logseq/last-rating rating))
            prop-fsrs-due (:due prop-card-map)]
        (property-handler/set-block-properties!
         repo (:block/uuid block-entity)
         {:logseq.property.fsrs/state prop-fsrs-state
          :logseq.property.fsrs/due prop-fsrs-due})))))

(defn- <get-due-card-block-ids
  [repo cards-id]
  (let [now-inst-ms (inst-ms (js/Date.))
        cards (when (and cards-id (not= (keyword cards-id) :global)) (db/entity cards-id))
        query (:block/title cards)
        result (query-dsl/parse query {:db-graph? true})
        q '[:find [?b ...]
            :in $ ?now-inst-ms %
            :where
            [?b :block/tags :logseq.class/Card]
            (or-join [?b ?now-inst-ms]
                     (and
                      [?b :logseq.property.fsrs/due ?due]
                      [(>= ?now-inst-ms ?due)])
                     [(missing? $ ?b :logseq.property.fsrs/due)])
            [?b :block/uuid]]
        q' (if query
             (let [query* (:query result)]
               (util/concat-without-nil
                q
                (if (coll? (first query*)) query* [query*])))
             q)]
    (db-async/<q repo {:transact-db? false} q' now-inst-ms (:rules result))))

(defn- btn-with-shortcut [{:keys [shortcut id btn-text due on-click class]}]
  (let [bg-class (case id
                   "card-again" "primary-red"
                   "card-hard" "primary-purple"
                   "card-good" "primary-logseq"
                   "card-easy" "primary-green"
                   nil)]
    [:div.flex.flex-row.items-center.gap-2
     (shui/button
      {:variant :outline
       :title (str "Shortcut: " shortcut)
       :auto-focus false
       :size :sm
       :id id
       :class (str id " " class " !px-2 !py-1 bg-primary/5 hover:bg-primary/10
        border-primary opacity-90 hover:opacity-100 " bg-class)
       :on-pointer-down (fn [e] (util/stop-propagation e))
       :on-click (fn [_e] (js/setTimeout #(on-click) 10))}
      [:div.flex.flex-row.items-center.gap-1
       [:span btn-text]
       (when-not (util/sm-breakpoint?)
         [:span.scale-90 (shui/shortcut shortcut)])])
     (when due [:div.text-sm.opacity-50 (util/human-time due {:ago? false})])]))

(defn- has-cloze?
  [block]
  (string/includes? (:block/title block) "{{cloze "))

(defn- phase->next-phase
  [block phase]
  (let [cloze? (has-cloze? block)]
    (case phase
      :init
      (if cloze? :show-cloze :show-answer)
      :show-cloze
      (if cloze? :show-answer :init)
      :show-answer
      :init)))

(def ^:private rating->shortcut
  {:again "1"
   :hard  "2"
   :good  "3"
   :easy  "4"})

(defn- rating-btns
  [repo block *card-index *phase]
  (let [block-id (:db/id block)]
    [:div.flex.flex-row.items-center.gap-8.flex-wrap
     (mapv
      (fn [rating]
        (let [card-map (get-card-map block)
              due (:due (fsrs.core/repeat-card! card-map rating))]
          (btn-with-shortcut {:btn-text (string/capitalize (name rating))
                              :shortcut (rating->shortcut rating)
                              :due due
                              :id (str "card-" (name rating))
                              :on-click #(do (repeat-card! repo block-id rating)
                                             (swap! *card-index inc)
                                             (reset! *phase :init))})))
      (keys rating->shortcut))
     (shui/button
      {:variant :ghost
       :size :sm
       :class "!px-0 text-muted-foreground !h-4"
       :on-click (fn [e]
                   (shui/popup-show! (.-target e)
                                     (fn []
                                       [:div.p-4.max-w-lg
                                        [:dl
                                         [:dt "Again"]
                                         [:dd "We got the answer wrong. Automatically means that we have forgotten the card. This is a lapse in memory."]]
                                        [:dl
                                         [:dt "Hard"]
                                         [:dd "The answer was correct but we were not confident about it and/or took too long to recall."]]
                                        [:dl
                                         [:dt "Good"]
                                         [:dd "The answer was correct but we took some mental effort to recall it."]]
                                        [:dl
                                         [:dt "Easy"]
                                         [:dd "The answer was correct and we were confident and quick in our recall without mental effort."]]])
                                     {:align "start"}))}
      (ui/icon "info-circle"))]))

(rum/defcs ^:private card-view < rum/reactive db-mixins/query
  {:will-mount (fn [state]
                 (let [[repo block-id _] (:rum/args state)
                       *block (atom nil)]
                   (p/let [result (db-async/<get-block repo block-id {:children? true})]
                     (reset! *block result))
                   (assoc state ::block *block)))}
  [state repo _block-id *card-index *phase]
  (when-let [block (rum/react (::block state))]
    (when-let [block-entity (db/sub-block (:db/id block))]
      (let [phase (rum/react *phase)
            _card-index (rum/react *card-index)
            next-phase (phase->next-phase block-entity phase)]
        [:div.ls-card.content.flex.flex-col.overflow-y-auto.overflow-x-hidden
         [:div (component-block/breadcrumb {} repo (:block/uuid block-entity) {})]
         (let [option (case phase
                        :init
                        {:hide-children? true}
                        :show-cloze
                        {:show-cloze? true
                         :hide-children? true}
                        {:show-cloze? true})]
           (component-block/blocks-container option [block-entity]))
         [:div.mt-8.pb-2
          (if (contains? #{:show-cloze :show-answer} next-phase)
            (btn-with-shortcut {:btn-text (t
                                           (case next-phase
                                             :show-answer
                                             :flashcards/modal-btn-show-answers
                                             :show-cloze
                                             :flashcards/modal-btn-show-clozes
                                             :init
                                             :flashcards/modal-btn-hide-answers))
                                :shortcut "s"
                                :id (str "card-answers")
                                :on-click #(swap! *phase
                                                  (fn [phase]
                                                    (phase->next-phase block-entity phase)))})
            [:div.flex.justify-center (rating-btns repo block-entity *card-index *phase)])]]))))

(declare update-due-cards-count)
(rum/defcs cards-view < rum/reactive
  (rum/local 0 ::card-index)
  (shortcut/mixin :shortcut.handler/cards false)
  {:init (fn [state]
           (let [*block-ids (atom nil)
                 *loading? (atom nil)
                 cards-id (last (:rum/args state))]
             (reset! *loading? true)
             (p/let [result (<get-due-card-block-ids (state/get-current-repo) cards-id)]
               (reset! *block-ids result)
               (reset! *loading? false))
             (assoc state
                    ::block-ids *block-ids
                    ::cards-id (atom (or cards-id :global))
                    ::loading? *loading?)))
   :will-unmount (fn [state]
                   (update-due-cards-count)
                   state)}
  [state _cards-id]
  (let [repo (state/get-current-repo)
        *cards-id (::cards-id state)
        cards-id (rum/react *cards-id)
        all-cards (concat
                   [{:db/id :global
                     :block/title "All cards"}]
                   (db-model/get-class-objects repo (:db/id (entity-plus/entity-memoized (db/get-db) :logseq.class/Cards))))
        *block-ids (::block-ids state)
        block-ids (rum/react *block-ids)
        loading? (rum/react (::loading? state))
        *card-index (::card-index state)
        *phase (atom :init)]
    (when (false? loading?)
      [:div#cards-modal.flex.flex-col.gap-8.flex-1
       [:div.flex.flex-row.items-center.gap-2.flex-wrap
        (shui/select
         {:on-value-change (fn [v]
                             (reset! *cards-id v)
                             (p/let [result (<get-due-card-block-ids repo (if (= :global v) nil v))]
                               (reset! *card-index 0)
                               (reset! *block-ids result)))
          :default-value cards-id}
         (shui/select-trigger
          {:class "!px-2 !py-0 !h-8 w-64"}
          (shui/select-value
           {:placeholder "Select cards"})
          (shui/select-content
           (shui/select-group
            (for [card-entity all-cards]
              (shui/select-item {:value (:db/id card-entity)}
                                (:block/title card-entity)))))))

        [:span.text-sm.opacity-50 (str (min (inc @*card-index) (count @*block-ids)) "/" (count @*block-ids))]]
       (let [block-id (nth block-ids @*card-index nil)]
         (cond
           block-id
           [:div.flex.flex-col
            (rum/with-key
              (card-view repo block-id *card-index *phase)
              (str "card-" block-id))]

           (empty? block-ids)
           [:div.ls-card.content.ml-2
            [:h2.font-medium (t :flashcards/modal-welcome-title)]

            [:div
             [:p (t :flashcards/modal-welcome-desc-1)]]]

           :else
           [:p (t :flashcards/modal-finished)]))])))

(defonce ^:private *last-update-due-cards-count-canceler (atom nil))
(def ^:private new-task--update-due-cards-count
  "Return a task that update `:srs/cards-due-count` periodically."
  (m/sp
    (let [repo (state/get-current-repo)]
      (if (config/db-based-graph? repo)
        (m/?
         (m/reduce
          (fn [_ _]
            (p/let [due-cards (<get-due-card-block-ids repo nil)]
              (state/set-state! :srs/cards-due-count (count due-cards))))
          (c.m/clock (* 3600 1000))))
        (srs/update-cards-due-count!)))))

(defn update-due-cards-count
  []
  (when-let [canceler @*last-update-due-cards-count-canceler]
    (canceler)
    (reset! *last-update-due-cards-count-canceler nil))
  (let [canceler (c.m/run-task :update-due-cards-count
                   new-task--update-due-cards-count)]
    (reset! *last-update-due-cards-count-canceler canceler)
    nil))

(defn- get-operating-blocks
  [block-ids]
  (some->> block-ids
           (map (fn [id] (db/entity [:block/uuid id])))
           (seq)
           block-handler/get-top-level-blocks
           (remove ldb/property?)))

(defn batch-make-cards!
  ([] (batch-make-cards! (state/get-selection-block-ids)))
  ([block-ids]
   (let [repo (state/get-current-repo)
         blocks (get-operating-blocks block-ids)]
     (when-let [block-ids (not-empty (map :block/uuid blocks))]
       (property-handler/batch-set-block-property!
        repo
        block-ids
        :block/tags
        (:db/id (db/entity :logseq.class/Card)))))))

(comment
  (defn- cards-in-time-range
    [cards start-instant end-instant]
    (assert (and (tick/instant? start-instant)
                 (tick/instant? end-instant))
            [start-instant end-instant])
    (->> cards
         (filter (fn [card] (tick/<= start-instant (:last-repeat card) end-instant)))))

  (defn- cards-today
    [cards]
    (let [date-today (tick/new-date)
          start-instant (tick/instant (tick/at date-today (tick/new-time 0 0)))
          end-instant (tick/instant)]
      (cards-in-time-range cards start-instant end-instant)))

  (defn- cards-recent-7-days
    [cards]
    (let [now-instant (tick/instant)
          date-7-days-ago (tick/date (tick/<< now-instant (tick/new-duration 7 :days)))
          start-instant (tick/instant (tick/at date-7-days-ago (tick/new-time 0 0)))
          end-instant now-instant]
      (cards-in-time-range cards start-instant end-instant)))

  (defn- cards-recent-30-days
    [cards]
    (let [now-instant (tick/instant)
          date-30-days-ago (tick/date (tick/<< now-instant (tick/new-duration 30 :days)))
          start-instant (tick/instant (tick/at date-30-days-ago (tick/new-time 0 0)))
          end-instant now-instant]
      (cards-in-time-range cards start-instant end-instant)))

  (defn- cards-stat
    [cards]
    (let [state-grouped-cards (group-by :state cards)
          state-cards-count (update-vals state-grouped-cards count)
          {new-count :new
           learning-count :learning
           review-count :review
           relearning-count :relearning} state-cards-count
          passed-repeat-count (count (filter #(contains? #{:good :easy} (:logseq/last-rating %)) cards))
          lapsed-repeat-count (count (filter #(contains? #{:again :hard} (:logseq/last-rating %)) cards))
          true-retention-percent (when (seq cards) (/ review-count (count cards)))]
      {:true-retention true-retention-percent
       :passed-repeats passed-repeat-count
       :lapsed-repeats lapsed-repeat-count
       :new-state-cards (or new-count 0)
       :learning-state-cards (or learning-count 0)
       :review-state-cards (or review-count 0)
       :relearning-state-cards (or relearning-count 0)}))

  (defn <cards-stat
    "Some explanations on return value:
  :true-retention, cards in review-state / all-cards-count
  :passed-repeats, last rating is :good or :easy
  :lapsed-repeats, last rating is :again or :hard
  :XXX-state-cards, cards' state is XXX"
    []
    (p/let [repo (state/get-current-repo)
            all-card-blocks
            (db-async/<q repo {:transact-db? false}
                         '[:find [(pull ?b [* {:block/tags [:db/ident]}]) ...]
                           :where
                           [?b :block/tags :logseq.class/Card]
                           [?b :block/uuid]])
            all-cards (map get-card-map all-card-blocks)
            [today-stat
             recent-7-days-stat
             recent-30-days-stat]
            (map cards-stat ((juxt cards-today cards-recent-7-days cards-recent-30-days) all-cards))]
      {:today-stat today-stat
       :recent-7-days-stat recent-7-days-stat
       :recent-30-days-stat recent-30-days-stat})))
