(ns frontend.extensions.fsrs
  "Flashcards functions based on FSRS, only works in db-based graphs"
  (:require [clojure.string :as string]
            [frontend.commands :as commands]
            [frontend.components.block :as component-block]
            [frontend.components.macro :as component-macro]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
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
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [open-spaced-repetition.cljc-fsrs.core :as fsrs.core]
            [promesa.core :as p]
            [io.factorhouse.hsx.core :as hsx]
            [tick.core :as tick]))

(commands/register-slash-command
 (fn []
   [(t :editor.slash/cloze)
    [[:editor/input "{{cloze }}" {:backward-pos 2}]]
    nil
    :icon/brackets-contain]))

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
        result (query-dsl/parse query (db/get-db) {})
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

(defn- global-cards-id?
  [cards-id]
  (contains? #{:global "global"} cards-id))

(defn- selected-cards-title
  [all-cards cards-id]
  (or (some (fn [card]
              (when (= (:db/id card) cards-id)
                (:block/title card)))
            all-cards)
      (some (fn [card]
              (when (= (:db/id card) :global)
                (:block/title card)))
            all-cards)
      (t :flashcard/all-cards)))

(defn- <create-cards-block!
  []
  (editor-handler/api-insert-new-block! ""
                                        {:page (db-model/get-today-journal-title)
                                         :properties {:block/tags #{:logseq.class/Cards}}
                                         :sibling? false
                                         :end? true}))

(defn- btn-with-shortcut [{:keys [shortcut id btn-text due on-click class show-due? mobile?]
                           :or {show-due? true}}]
  (let [bg-class (case id
                   "card-again" "primary-red"
                   "card-hard" "primary-purple"
                   "card-good" "primary-logseq"
                   "card-easy" "primary-green"
                   nil)]
    [:div.flex.flex-row.items-center.gap-2
     {:class (when mobile? "w-full")}
     (shui/button
      (cond->
       {:variant :outline
        :auto-focus false
        :size :sm
        :id id
        :class (str id " " class " "
                    (if mobile?
                      "!w-full !min-h-[48px] !px-4 !py-3 rounded-xl text-base justify-center "
                      "!px-2 !py-1 ")
                    "bg-primary/5 hover:bg-primary/10
        border-primary opacity-90 hover:opacity-100 " bg-class)
        :on-pointer-down (fn [e] (util/stop-propagation e))
        :on-click (fn [_e] (js/setTimeout #(on-click) 10))}
        (not mobile?)
        (assoc :title (t :flashcard/shortcut-tooltip shortcut)))
      [:div.flex.flex-row.items-center.gap-1
       [:span btn-text]
       (when-not (or mobile? (util/sm-breakpoint?))
         [:span.scale-90 (shui/shortcut shortcut)])])
     (when (and show-due? due)
       [:div.text-sm.opacity-50 (util/human-time due {:ago? false})])]))

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

(def ^:private ratings
  [:again :hard :good :easy])

(def ^:private rating->shortcut
  {:again "1"
   :hard  "2"
   :good  "3"
   :easy  "4"})

(defn- rating-key
  [rating]
  (keyword "flashcard.rating" (name rating)))

(defn- rating-desc-key
  [rating]
  (keyword "flashcard.rating" (str (name rating) "-desc")))

(defn- rating-label
  [rating]
  (t (rating-key rating)))

(defn- rating-btns
  [repo block *card-index *phase opts]
  (let [block-id (:db/id block)]
    [:div.flex.flex-row.items-center.gap-8.flex-wrap
     {:class (when (:mobile? opts) "ls-mobile-card-rating-buttons")}
     (mapv
      (fn [rating]
        (let [card-map (get-card-map block)
              due (:due (fsrs.core/repeat-card! card-map rating))]
          (btn-with-shortcut {:btn-text (rating-label rating)
                              :shortcut (rating->shortcut rating)
                              :due due
                              :show-due? (not (:mobile? opts))
                              :mobile? (:mobile? opts)
                              :id (str "card-" (name rating))
                              :on-click #(do (repeat-card! repo block-id rating)
                                             (swap! *card-index inc)
                                             (reset! *phase :init))})))
      ratings)
     (when-not (:mobile? opts)
       (shui/button
        {:variant :ghost
         :size :sm
         :class "!px-0 text-muted-foreground !h-4"
         :on-click (fn [e]
                     (shui/popup-show! (.-target e)
                                       (fn []
                                         [:div.p-4.max-w-lg
                                          (for [rating ratings]
                                            ^{:key (name rating)}
                                            [:dl
                                             [:dt (t (rating-key rating))]
                                             [:dd (t (rating-desc-key rating))]])])
                                       {:align "start"}))}
        (ui/icon "info-circle")))]))

(hsx/defc ^:private card-view
  [repo block-id *card-index *phase opts]
  (let [*block (hooks/use-memo #(atom nil) [repo block-id])
           [block] (hooks/use-atom *block)
           [phase] (hooks/use-atom *phase)
           [_card-index] (hooks/use-atom *card-index)
           block-entity (db/sub-block (:db/id block))]
       (hooks/use-effect!
        (fn []
          (reset! *block nil)
          (p/let [result (db-async/<get-block repo block-id {:children? true})]
            (reset! *block result)))
        [repo block-id])
       (when block
         (when block-entity
           (let [next-phase (phase->next-phase block-entity phase)]
             [:div.ls-card.content.flex.flex-col.overflow-hidden
              {:class (when (:mobile? opts) "ls-mobile-card")}
              [:div.ls-card-scroll.flex-1.min-h-0.overflow-y-auto.overflow-x-hidden
               [:div.mb-4.ml-2.opacity-70.text-sm
                (component-block/breadcrumb {} repo (:block/uuid block-entity) {})]
               (let [option (case phase
                              :init
                              {:hide-children? true}
                              :show-cloze
                              {:show-cloze? true
                               :hide-children? true}
                              {:show-cloze? true
                               :ignore-block-collapsed? true})]
                 (component-block/blocks-container option [block-entity]))]
              [:div.mt-8.pb-2.shrink-0
               {:class (when (:mobile? opts) "ls-mobile-card-actions")}
               (if (contains? #{:show-cloze :show-answer} next-phase)
                 (btn-with-shortcut {:btn-text (case next-phase
                                                 :show-answer
                                                 (t :flashcard.review/show-answers)
                                                 :show-cloze
                                                 (t :flashcard.review/show-clozes)
                                                 :init
                                                 (t :flashcard.review/hide-answers))
                                     :shortcut "s"
                                     :mobile? (:mobile? opts)
                                     :id "card-answers"
                                     :on-click #(swap! *phase
                                                       (fn [phase]
                                                         (phase->next-phase block-entity phase)))})
                 [:div.flex.justify-center (rating-btns repo block-entity *card-index *phase opts)])]])))))

(declare update-due-cards-count)
(hsx/defc ^:large-vars/cleanup-todo cards-view
  [initial-cards-id opts*]
  (let [repo (state/get-current-repo)
        opts (or opts* {})
        mobile? (:mobile? opts)
        *cards-id (hooks/use-memo #(atom (or initial-cards-id :global)) [])
        [cards-id] (hooks/use-atom *cards-id)
        *cards-list (hooks/use-memo #(atom [{:db/id :global
                                             :block/title (t :flashcard/all-cards)}]) [])
        [cards-list] (hooks/use-atom *cards-list)
        all-cards (or cards-list
                      [{:db/id :global
                        :block/title (t :flashcard/all-cards)}])
        *block-ids (hooks/use-memo #(atom nil) [])
        [block-ids] (hooks/use-atom *block-ids)
        *loading? (hooks/use-memo #(atom nil) [])
        [loading?] (hooks/use-atom *loading?)
        *card-index (hooks/use-memo #(atom 0) [])
        [card-index] (hooks/use-atom *card-index)
        *phase (hooks/use-memo #(atom :init) [])
        progress-label (str (min (inc card-index) (count block-ids)) "/" (count block-ids))
        select-card! (fn [v]
                       (reset! *cards-id v)
                       (let [cards-id' (when-not (global-cards-id? v) v)]
                         (p/let [result (<get-due-card-block-ids repo cards-id')]
                           (reset! *card-index 0)
                           (reset! *phase :init)
                           (reset! *block-ids result))))]
    (shortcut/use-shortcut-handler! :shortcut.handler/cards
                                    {:cards-id initial-cards-id
                                     :opts opts})
    (hooks/use-effect!
     (fn []
       (let [cards-class-id (:db/id (entity-plus/entity-memoized (db/get-db) :logseq.class/Cards))]
         (reset! *loading? true)
        (p/let [result (<get-due-card-block-ids repo initial-cards-id)]
           (reset! *block-ids result)
           (reset! *loading? false))
         (when cards-class-id
           (p/let [cards (db-async/<get-tag-objects repo cards-class-id)
                   cards (p/all (map (fn [block]
                                       (if-not (string/blank? (:block/title block))
                                         block
                                         (when-let [query-block-id (:db/id (:logseq.property/query block))]
                                           (p/let [query-block (db-async/<get-block repo query-block-id)]
                                             (assoc block :block/title (:block/title query-block))))))
                                     cards))]
             (reset! *cards-list (concat [{:db/id :global
                                           :block/title (t :flashcard/all-cards)}]
                                         (remove
                                          (fn [card]
                                            (string/blank? (:block/title card)))
                                          cards)))))
         #(do
            (when-let [on-header-change (:on-header-change opts)]
              (on-header-change nil))
            (when-let [on-selector-change (:on-selector-change opts)]
              (on-selector-change nil))
            (update-due-cards-count))))
     [])
    (when (false? loading?)
      (when mobile?
        (when-let [on-header-change (:on-header-change opts)]
          (on-header-change {:title (selected-cards-title all-cards cards-id)
                             :progress progress-label}))
        (when-let [on-selector-change (:on-selector-change opts)]
          (on-selector-change {:cards all-cards
                               :cards-id cards-id
                               :select-card! select-card!})))
      [:div#cards-modal.flex.flex-col.gap-8.flex-1.min-h-0
       (when-not mobile?
         [:div.flex.flex-row.items-center.gap-2
          (shui/select
           {:on-value-change select-card!
            :default-value cards-id}
           (shui/select-trigger
            {:class "!px-2 !py-0 !h-8 w-64"}
            (shui/select-value
             {:placeholder (t :flashcard/select-cards)}))
           (shui/select-content
            (shui/select-group
             (for [card-entity all-cards]
               (shui/select-item {:value (:db/id card-entity)}
                                 (:block/title card-entity))))))
          (shui/button
           {:variant :ghost
            :id "ls-cards-add"
            :size :sm
            :title (t :flashcard/add-query)
            :class "!px-1 text-muted-foreground"
            :on-click (fn []
                        (p/let [saved-block (<create-cards-block!)]
                          (shui/dialog-close!)
                          (when saved-block
                            (route-handler/redirect-to-page! (:block/uuid saved-block)
                                                             {}))))}
           (ui/icon "plus"))
          [:span.text-sm.opacity-50.whitespace-nowrap progress-label]])
       (let [block-id (nth block-ids card-index nil)]
         (cond
           block-id
           [:div.flex.flex-col.flex-1.min-h-0
            ^{:key (str "card-" block-id)}
            [card-view repo block-id *card-index *phase opts]]

           (empty? block-ids)
           [:div.ls-card.content.ml-2
            [:h2.font-medium (t :flashcard.empty/title)]

            [:div
             [:p (t :flashcard.empty/desc "#Card")]]]

           :else
           [:p (t :flashcard.review/finished)]))])))

(defonce ^:private *last-update-due-cards-count-canceler (atom nil))
(defn- update-due-cards-count!
  []
  (let [repo (state/get-current-repo)]
    (p/let [due-cards (<get-due-card-block-ids repo nil)]
      (state/set-state! :srs/cards-due-count (count due-cards)))))

(defn update-due-cards-count
  []
  (when-let [canceler @*last-update-due-cards-count-canceler]
    (canceler)
    (reset! *last-update-due-cards-count-canceler nil))
  (update-due-cards-count!)
  (let [interval-id (js/setInterval update-due-cards-count! (* 3600 1000))
        canceler #(js/clearInterval interval-id)]
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

(hsx/defc cloze-macro-show
  [config options]
  (let [shown?* (hooks/use-memo #(atom (:show-cloze? config)) [])
        [shown?] (hooks/use-atom shown?*)
        ;; Only suppress toggle when the click originates from a child <a>
        ;; element rendered inside the revealed answer (e.g. a page ref).
        ;; An ancestor <a> should not block the toggle.
        toggle! (fn [e]
                  (let [target (.-target e)
                        inner-a (when (instance? js/Element target)
                                  (.closest target "a"))]
                    (when (or (nil? inner-a)
                              (not (.contains (.-currentTarget e) inner-a)))
                      (swap! shown?* not))))
        toggle-key! #(when (contains? #{"Enter" " " "Space" "Spacebar"} (.-key %))
                       (util/stop %)
                       (swap! shown?* not))
        [answer cue] (cloze-parse (string/join ", " (:arguments options)))
        attrs {:role "button"
               :tab-index 0
               :aria-pressed shown?
               :on-click toggle!
               :on-key-down toggle-key!}]
    (if (or shown? (:show-cloze? config))
      [:span.cloze-revealed attrs
       "["
       (component-block/inline-title config answer)
       "]"]
      [:span.cloze attrs
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
