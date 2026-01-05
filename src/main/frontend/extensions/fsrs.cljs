(ns frontend.extensions.fsrs
  "Flashcards functions based on FSRS, only works in db-based graphs"
  (:require [clojure.string :as string]
            [frontend.commands :as commands]
            [frontend.common.missionary :as c.m]
            [frontend.components.block :as component-block]
            [frontend.components.macro :as component-macro]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.async :as db-async]
            [frontend.db.model :as db-model]
            [frontend.db.query-dsl :as query-dsl]
            [frontend.handler.block :as block-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.property :as property-handler]
            [frontend.handler.route :as route-handler]
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

(commands/register-slash-command ["Cloze"
                                  [[:editor/input "{{cloze }}" {:backward-pos 2}]]])

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
  "Return nil if block is not #Card.
  Return default card-map if `:logseq.property.fsrs/state` or `:logseq.property.fsrs/due` is nil"
  [block-entity]
  (when (ldb/class-instance? (db/entity :logseq.class/Card) block-entity)
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
         (:block/uuid block-entity)
         {:logseq.property.fsrs/state prop-fsrs-state
          :logseq.property.fsrs/due prop-fsrs-due})))))

(defn- <get-due-card-block-ids
  [repo cards-id]
  (let [now-inst-ms (inst-ms (js/Date.))
        cards (when (and cards-id (not (contains? #{:global "global"} cards-id)))
                (db/entity cards-id))
        query (when cards
                (when-let [query (:logseq.property/query cards)]
                  (when-not (string/blank? (:block/title query))
                    (:block/title query))))
        result (query-dsl/parse query {:db-graph? true})
        card-tag-id (:db/id (db/entity :logseq.class/Card))
        card-tag-children-ids (db-model/get-structured-children repo card-tag-id)
        card-ids (cons card-tag-id card-tag-children-ids)
        q '[:find [?b ...]
            :in $ [?t ...] ?now-inst-ms %
            :where
            [?b :block/tags ?t]
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
    (db-async/<q repo {:transact-db? false} q' card-ids now-inst-ms (:rules result))))

(defn- <create-cards-block!
  []
  (let [cards-tag-id (:db/id (db/entity :logseq.class/Cards))]
    (editor-handler/api-insert-new-block! ""
                                          {:page (date/today)
                                           :properties {:block/tags #{cards-tag-id}}
                                           :sibling? false
                                           :end? true})))

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
         [:div.mb-4.ml-2.opacity-70.text-sm
          (component-block/breadcrumb {} repo (:block/uuid block-entity) {})]
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
            (btn-with-shortcut {:btn-text (case next-phase
                                            :show-answer
                                            (t :flashcards/modal-btn-show-answers)
                                            :show-cloze
                                            (t :flashcards/modal-btn-show-clozes)
                                            :init
                                            (t :flashcards/modal-btn-hide-answers))
                                :shortcut "s"
                                :id "card-answers"
                                :on-click #(swap! *phase
                                                  (fn [phase]
                                                    (phase->next-phase block-entity phase)))})
            [:div.flex.justify-center (rating-btns repo block-entity *card-index *phase)])]]))))

(declare update-due-cards-count)
(rum/defcs ^:large-vars/cleanup-todo cards-view < rum/reactive
  (rum/local 0 ::card-index)
  (shortcut/mixin :shortcut.handler/cards false)
  {:init (fn [state]
           (let [*block-ids (atom nil)
                 *loading? (atom nil)
                 cards-id (last (:rum/args state))
                 *cards-list (atom [{:db/id :global
                                     :block/title "All cards"}])
                 repo (state/get-current-repo)
                 cards-class-id (:db/id (entity-plus/entity-memoized (db/get-db) :logseq.class/Cards))]
             (reset! *loading? true)
             (p/let [result (<get-due-card-block-ids (state/get-current-repo) cards-id)]
               (reset! *block-ids result)
               (reset! *loading? false))
             (when cards-class-id
               (p/let [cards (db-async/<get-tag-objects repo cards-class-id)
                       cards (p/all (map (fn [block]
                                           (if-not (string/blank? (:block/title block))
                                             block
                                             (when-let [query-block-id (:db/id (:logseq.property/query block))]
                                               (p/let [query-block (db-async/<get-block (state/get-current-repo) query-block-id)]
                                                 (assoc block :block/title (:block/title query-block))))))
                                         cards))]
                 (reset! *cards-list (concat [{:db/id :global
                                               :block/title "All cards"}]
                                             (remove
                                              (fn [card]
                                                (string/blank? (:block/title card)))
                                              cards)))))
             (assoc state
                    ::block-ids *block-ids
                    ::cards-id (atom (or cards-id :global))
                    ::loading? *loading?
                    ::cards-list *cards-list)))
   :will-unmount (fn [state]
                   (update-due-cards-count)
                   state)}
  [state _cards-id]
  (let [repo (state/get-current-repo)
        *cards-id (::cards-id state)
        cards-id (rum/react *cards-id)
        *cards-list (::cards-list state)
        all-cards (or (rum/react *cards-list)
                      [{:db/id :global
                        :block/title "All cards"}])
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
                             (let [cards-id' (when-not (contains? #{:global "global"} v) v)]
                               (p/let [result (<get-due-card-block-ids repo cards-id')]
                                 (reset! *card-index 0)
                                 (reset! *block-ids result))))
          :default-value cards-id}
         (shui/select-trigger
          {:class "!px-2 !py-0 !h-8 w-64"}
          (shui/select-value
           {:placeholder "Select cards"}))
         (shui/select-content
          (shui/select-group
           (for [card-entity all-cards]
             (shui/select-item {:value (:db/id card-entity)}
                               (:block/title card-entity))))))
        (shui/button
         {:variant :ghost
          :id "ls-cards-add"
          :size :sm
          :title "Add new query"
          :class "!px-1 text-muted-foreground"
          :on-click (fn []
                      (p/let [saved-block (<create-cards-block!)]
                        (shui/dialog-close!)
                        (when saved-block
                          (route-handler/redirect-to-page! (:block/uuid saved-block)
                                                           {}))))}
         (ui/icon "plus"))
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
             [:p (t :flashcards/modal-welcome-desc-1 "#Card")]]]

           :else
           [:p (t :flashcards/modal-finished)]))])))

(defonce ^:private *last-update-due-cards-count-canceler (atom nil))
(def ^:private new-task--update-due-cards-count
  "Return a task that update `:srs/cards-due-count` periodically."
  (m/sp
    (let [repo (state/get-current-repo)]
      (m/?
       (m/reduce
        (fn [_ _]
          (p/let [due-cards (<get-due-card-block-ids repo nil)]
            (state/set-state! :srs/cards-due-count (count due-cards))))
        (c.m/clock (* 3600 1000)))))))

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
   (let [blocks (get-operating-blocks block-ids)]
     (when-let [block-ids (not-empty (map :block/uuid blocks))]
       (property-handler/batch-set-block-property!
        block-ids
        :block/tags
        (:db/id (db/entity :logseq.class/Card)))))))

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

(def cloze-macro-name
  "cloze syntax: {{cloze: ...}}"
  "cloze")

;; TODO: support {{cards ...}}
;; (def query-macro-name
;;   "{{cards ...}}"
;;   "cards")

(component-macro/register cloze-macro-name cloze-macro-show)

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
