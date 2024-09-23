(ns frontend.extensions.fsrs
  "Flashcards functions based on FSRS, only works in db-based graphs"
  (:require [frontend.common.missionary-util :as c.m]
            [frontend.components.block :as component-block]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.extensions.srs :as srs]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [missionary.core :as m]
            [open-spaced-repetition.cljc-fsrs.core :as fsrs.core]
            [rum.core :as rum]
            [tick.core :as tick]
            [clojure.string :as string]
            [logseq.shui.ui :as shui]
            [frontend.ui :as ui]
            [frontend.modules.shortcut.core :as shortcut]
            [promesa.core :as p]
            [frontend.db-mixins :as db-mixins]))

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
  (when (some (fn [tag] (= :logseq.class/Card (:db/ident tag))) ;block should contains #Card
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
            prop-fsrs-state (dissoc prop-card-map :due)
            prop-fsrs-due (:due prop-card-map)]
        (db-property-handler/set-block-properties!
         block-id
         {:logseq.property.fsrs/state prop-fsrs-state
          :logseq.property.fsrs/due prop-fsrs-due})))))

(defn- <get-due-card-block-ids
  [repo]
  (let [now-inst-ms (inst-ms (js/Date.))]
    (db-async/<q repo {:transact-db? false}
                 '[:find [?b ...]
                   :in $ ?now-inst-ms
                   :where
                   [?b :block/tags :logseq.class/Card]
                   (or-join [?b ?now-inst-ms]
                            (and
                             [?b :logseq.property.fsrs/due ?due]
                             [(>= ?now-inst-ms ?due)])
                            [(missing? $ ?b :logseq.property.fsrs/due)])
                   [?b :block/uuid]]
                 now-inst-ms)))

(defn- btn-with-shortcut [{:keys [shortcut id btn-text background on-click class]}]
  (shui/button
   {:variant :outline
    :auto-focus false
    :size :sm
    :id id
    :class (str id " " class " !px-2 !py-1")
    :background background
    :on-pointer-down (fn [e] (util/stop-propagation e))
    :on-click (fn [_e]
                (js/setTimeout #(on-click) 10))}
   [:div.flex.flex-row.items-center.gap-1
    [:span btn-text]
    (when-not (util/sm-breakpoint?)
      (shui/button
       {:variant :outline
        :tab-index -1
        :auto-focus false
        :class "text-muted-foreground !px-1 !py-0 !h-4"
        :size :sm}
       [:span.text-sm shortcut]))]))

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
  [repo block-id *card-index *phase]
  [:div.flex.flex-row.items-center.gap-2.flex-wrap
   (mapv
    (fn [rating]
      (btn-with-shortcut {:btn-text (string/capitalize (name rating))
                          :shortcut (rating->shortcut rating)
                          :id (str "card-" (name rating))
                          :on-click #(do (repeat-card! repo block-id rating)
                                         (swap! *card-index inc)
                                         (reset! *phase :init))}))
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
                                       [:dd "The answer was only partially correct and/or we took too long to recall it."]]
                                      [:dl
                                       [:dt "Good"]
                                       [:dd "The answer was correct but we were not confident about it."]]
                                      [:dl
                                       [:dt "Easy"]
                                       [:dd "The answer was correct and we were confident and quick in our recall."]]])
                                   {:align "start"}))}
    (ui/icon "info-circle"))])

(rum/defcs ^:private card < rum/reactive db-mixins/query
  {:will-mount (fn [state]
                 (when-let [[repo block-id _] (:rum/args state)]
                   (db-async/<get-block repo block-id))
                 state)}
  [state repo block-id *card-index *phase]
  (when-let [block-entity (db/sub-block block-id)]
    (let [phase (rum/react *phase)
          next-phase (phase->next-phase block-entity phase)]
      [:div.ls-card.content
       [:div (component-block/breadcrumb {} repo (:block/uuid block-entity) {})]
       (let [option (case phase
                      :init
                      {:hide-children? true}
                      :show-cloze
                      {:show-cloze? true
                       :hide-children? true}
                      {:show-cloze? true})]
         (component-block/blocks-container option [block-entity]))
       [:div.mt-8
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
          (rating-btns repo (:db/id block-entity) *card-index *phase))]])))

(declare update-due-cards-count)
(rum/defcs cards < rum/reactive
  (rum/local 0 ::card-index)
  (shortcut/mixin :shortcut.handler/cards false)
  {:init (fn [state]
           (let [*block-ids (atom nil)
                 *loading? (atom nil)]
             (reset! *loading? true)
             (p/let [result (<get-due-card-block-ids (state/get-current-repo))]
               (reset! *block-ids result)
               (reset! *loading? false))
             (assoc state
                    ::block-ids *block-ids
                    ::loading? *loading?)))
   :will-unmount (fn [state]
                   (update-due-cards-count)
                   state)}
  [state]
  (let [repo (state/get-current-repo)
        *block-ids (::block-ids state)
        block-ids (rum/react *block-ids)
        loading? (rum/react (::loading? state))
        *card-index (::card-index state)
        *phase (atom :init)]
    (when (false? loading?)
      [:div#cards-modal.p-2
      (if-let [block-id (nth block-ids @*card-index nil)]
        [:div.flex.flex-col
         (card repo block-id *card-index *phase)]
        [:p (t :flashcards/modal-finished)])])))

(defonce ^:private *last-update-due-cards-count-canceler (atom nil))
(def ^:private new-task--update-due-cards-count
  "Return a task that update `:srs/cards-due-count` periodically."
  (m/sp
    (let [repo (state/get-current-repo)]
      (if (config/db-based-graph? repo)
        (m/?
         (m/reduce
          (fn [_ _]
            (p/let [due-cards (<get-due-card-block-ids repo)]
              (state/set-state! :srs/cards-due-count (count due-cards))))
          (c.m/clock (* 3600 1000))))
        (srs/update-cards-due-count!)))))

(defn update-due-cards-count
  []
  (when-let [canceler @*last-update-due-cards-count-canceler]
    (canceler)
    (reset! *last-update-due-cards-count-canceler nil))
  (let [canceler (c.m/run-task new-task--update-due-cards-count :update-due-cards-count)]
    (reset! *last-update-due-cards-count-canceler canceler)
    nil))
