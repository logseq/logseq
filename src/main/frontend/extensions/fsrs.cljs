(ns frontend.extensions.fsrs
  "Flashcards functions based on FSRS, only works in db-based graphs"
  (:require [datascript.core :as d]
            [frontend.components.block :as component-block]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [open-spaced-repetition.cljc-fsrs.core :as fsrs.core]
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
  (when (some (fn [tag] (= :logseq.class/Card (:db/ident tag))) ;block should contains #Card
              (:block/tags block-entity))
    (let [fsrs-state (:logseq.property.fsrs/state block-entity)
          fsrs-due (:property.value/content (:logseq.property.fsrs/due block-entity))
          return-default-card-map? (not (and fsrs-state fsrs-due))]
      (if return-default-card-map?
        (fsrs.core/new-card!)
        (property-fsrs-state->fsrs-card-map (assoc fsrs-state :due fsrs-due))))))

(defn repeat-card!
  [repo block-id rating]
  (let [eid (if (uuid? block-id) [:block/uuid block-id] block-id)
        block-entity (db/entity repo eid)]
    (when-let [card-map (get-card-map block-entity)]
      (let [next-card-map (fsrs.core/repeat-card! card-map rating)
            prop-card-map (fsrs-card-map->property-fsrs-state next-card-map)
            prop-fsrs-state (dissoc prop-card-map :due)
            prop-fsrs-due (:due prop-card-map)]
        (db-property-handler/set-block-property!
         block-id :logseq.property.fsrs/state prop-fsrs-state)
        (db-property-handler/create-property-text-block!
         block-id :logseq.property.fsrs/due (str prop-fsrs-due)
         {:new-block-id (db/new-block-id)})))))

(defn get-card-block-ids
  [repo]
  (let [db (db/get-db repo)]
    (->>
     (d/q '[:find ?b
            :where
            [?b :block/tags :logseq.class/Card]
            [?b :block/uuid]]
          db)
     (apply concat))))

(defn get-due-card-block-ids
  [repo]
  (let [db (db/get-db repo)
        now-inst-ms (inst-ms (js/Date.))]
    (->> (d/q '[:find ?b
                :in $ ?now-inst-ms
                :where
                [?b :block/tags :logseq.class/Card]
                [?b :logseq.property.fsrs/due ?due-b]
                [?due-b :property.value/content ?due]
                [(>= ?now-inst-ms ?due)]
                [?b :block/uuid]]
              db now-inst-ms)
         (apply concat))))

(defn- btn-with-shortcut [{:keys [shortcut id btn-text background on-click class]}]
  (ui/button
   [:span btn-text (when-not (util/sm-breakpoint?)
                     [" " (ui/render-keyboard-shortcut shortcut {:theme :text})])]
   :id id
   :class (str id " " class)
   :background background
   :on-pointer-down (fn [e] (util/stop-propagation e))
   :on-click (fn [_e]
               (js/setTimeout #(on-click) 10))))

(def ^:private phase->next-phase
  {:init :show-answer
   :show-answer :end
   :end :end})

(rum/defcs card <
  (rum/local :init ::phase)
  [state repo block-entity]
  (let [*phase (::phase state)]
    [:div.ls-card.content
     [:div (component-block/breadcrumb {} repo (:block/uuid block-entity) {})]
     (component-block/blocks-container
      (cond-> {}
        (contains? #{:init} @*phase) (assoc :hide-children? true))
      [block-entity])
     (btn-with-shortcut {:btn-text (t :flashcards/modal-btn-show-answers)
                         :shortcut "s"
                         :id (str "card-answers")
                         :on-click #(swap! *phase phase->next-phase)})]))

;; {
;;    :again 1 ;; We got the answer wrong. Automatically means that we
;;             ;; have forgotten the card. This is a lapse in memory.
;;    :hard  2 ;; The answer was only partially correct and/or we took
;;             ;; too long to recall it.
;;    :good  3 ;; The answer was correct but we were not confident about it.
;;    :easy  4 ;; The answer was correct and we were confident and quick
;;             ;; in our recall.
;;    }
(def ^:private rating->shortcut
  {:again "1"
   :hard  "2"
   :good  "3"
   :easy  "4"})

(defn- rating-btns
  [repo block-id *card-index]
  (mapv
   (fn [rating]
     (btn-with-shortcut {:btn-text (name rating)
                         :shortcut (rating->shortcut rating)
                         :id (str "card-" (name rating))
                         :on-click #(do (repeat-card! repo block-id rating)
                                        (swap! *card-index inc))}))
   (keys rating->shortcut)))

(rum/defcs cards <
  (rum/local 0 ::card-index)
  [state]
  (let [repo (state/get-current-repo)
        block-ids (get-card-block-ids repo)
        *card-index (::card-index state)]
    (if-let [block-entity (some-> (nth block-ids @*card-index nil) db/entity)]
      (vec (concat [:div (card repo block-entity)]
                   (rating-btns repo (:db/id block-entity) *card-index)))
      [:p.p-2 (t :flashcards/modal-finished)])))
