(ns frontend.components.reference
  (:require [frontend.components.block :as block]
            [frontend.components.content :as content]
            [frontend.components.editor :as editor]
            [frontend.components.reference-filters :as filters]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [logseq.db :as ldb]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.async :as db-async]
            [frontend.db.utils :as db-utils]
            [frontend.handler.block :as block-handler]
            [frontend.handler.page :as page-handler]
            [frontend.modules.outliner.tree :as tree]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [rum.core :as rum]))

(rum/defc block-linked-references < rum/reactive db-mixins/query
  {:init (fn [state]
           (when-let [e (db/entity [:block/uuid (first (:rum/args state))])]
             (db-async/<get-block-refs (state/get-current-repo) (:db/id e)))
           state)}
  [block-id]
  (when-let [e (db/entity [:block/uuid block-id])]
    (when-not (state/sub-async-query-loading (str (:db/id e) "-refs"))
      (let [ref-blocks (-> (db/get-referenced-blocks (:db/id e))
                           db-utils/group-by-page)]
        (when (> (count ref-blocks) 0)
          (let [ref-hiccup (block/->hiccup ref-blocks
                                           {:id (str block-id)
                                            :ref? true
                                            :breadcrumb-show? true
                                            :group-by-page? true
                                            :editor-box editor/box}
                                           {})]
            [:div.references-blocks
             (content/content block-id
                              {:hiccup ref-hiccup})]))))))

(rum/defc references-inner
  [page-entity filters filtered-ref-blocks]
  (let [*ref (rum/use-ref nil)]
    [:div.references-blocks.faster.fade-in {:ref *ref}
     (let [ref-hiccup (block/->hiccup filtered-ref-blocks
                                      {:id (str (:block/uuid page-entity))
                                       :scroll-container *ref
                                       :ref? true
                                       :breadcrumb-show? true
                                       :group-by-page? true
                                       :editor-box editor/box
                                       :filters filters}
                                      {})]
       (content/content (str (:block/uuid page-entity)) {:hiccup ref-hiccup}))]))

(rum/defc references-cp
  [page-entity *filters total filter-n filtered-ref-blocks *ref-pages]
  (let [filters @*filters
        threshold (state/get-linked-references-collapsed-threshold)
        default-collapsed? (or (>= total threshold) (ldb/class? page-entity))
        *collapsed? (atom nil)]
    (ui/foldable
     [:div.flex.flex-row.flex-1.justify-between.items-center
      [:h2.font-medium (t :linked-references/reference-count (when (or (seq (:included filters))
                                                                       (seq (:excluded filters))) filter-n) total)]
      [:a.filter.fade-link
       {:title (t :linked-references/filter-heading)
        :on-mouse-over (fn [_e]
                         (when @*collapsed? ; collapsed
                           ;; expand
                           (reset! @*collapsed? false)))
        :on-pointer-down (fn [e]
                           (util/stop-propagation e)
                           (shui/popup-show! (.-target e)
                                             (fn []
                                               [:div.p-4
                                                (filters/filter-dialog page-entity *filters *ref-pages)])
                                             {:align "end"}))}
       (ui/icon "filter" {:class (cond
                                   (and (empty? (:included filters)) (empty? (:excluded filters)))
                                   "opacity-60 hover:opacity-100"

                                   (and (seq (:included filters)) (empty? (:excluded filters)))
                                   "text-success"

                                   (and (empty? (:included filters)) (seq (:excluded filters)))
                                   "text-error"
                                   :else
                                   "text-warning")
                          :size  22})]]

     (fn []
       (references-inner page-entity filters filtered-ref-blocks))

     {:default-collapsed? default-collapsed?
      :title-trigger? true
      :init-collapsed (fn [collapsed-atom]
                        (reset! *collapsed? collapsed-atom))})))

(defn- get-filtered-children
  [block parent->blocks]
  (let [children (get parent->blocks (:db/id block))]
    (set
     (loop [blocks children
            result (vec children)]
       (if (empty? blocks)
         result
         (let [fb (first blocks)
               children (get parent->blocks (:db/id fb))]
           (recur
            (concat children (rest blocks))
            (conj result fb))))))))

(rum/defc references-aux < rum/reactive db-mixins/query
  {:should-update (fn [old-state new-state]
                    ;; Re-render if only filters update
                    (not= (last (:rum/args old-state))
                          (last (:rum/args new-state))))}
  [state repo page-entity *filters filters]
  (let [*ref-pages (::ref-pages state)
        page-id (:db/id page-entity)
        ref-blocks (db/get-referenced-blocks page-id)
        aliases (db/page-alias-set repo page-id)
        aliases-exclude-self (set (remove #{page-id} aliases))
        top-level-blocks (filter (fn [b] (some aliases (set (map :db/id (:block/refs b))))) ref-blocks)
        top-level-blocks-ids (set (map :db/id top-level-blocks))
        filtered-ref-blocks (->> (block-handler/filter-blocks ref-blocks filters)
                                 (block-handler/get-filtered-ref-blocks-with-parents ref-blocks))
        total (count top-level-blocks)
        filtered-top-blocks (filter (fn [b] (top-level-blocks-ids (:db/id b))) filtered-ref-blocks)
        filter-n (count filtered-top-blocks)
        parent->blocks (group-by (fn [x] (:db/id (x :block/parent))) filtered-ref-blocks)
        result (->> (group-by :block/page filtered-top-blocks)
                    (map (fn [[page blocks]]
                           (let [blocks (sort-by (fn [b] (not= (:db/id page) (:db/id (:block/parent b)))) blocks)
                                 result (map (fn [block]
                                               (let [filtered-children (get-filtered-children block parent->blocks)
                                                     refs (when-not (contains? top-level-blocks-ids (:db/id (:block/parent block)))
                                                            (block-handler/get-blocks-refed-pages aliases (cons block filtered-children)))
                                                     block' (assoc (tree/block-entity->map block) :block/children filtered-children)]
                                                 [block' refs])) blocks)
                                 blocks' (map first result)
                                 page' (if (contains? aliases-exclude-self (:db/id page))
                                         {:db/id (:db/id page)
                                          :block/alias? true
                                          :block/journal-day (:block/journal-day page)}
                                         page)]
                             [[page' blocks'] (mapcat second result)]))))
        filtered-ref-blocks' (map first result)
        ref-pages (->>
                   (mapcat second result)
                   (map :block/title)
                   frequencies)]
    (reset! *ref-pages ref-pages)
    (when (or (seq (:included filters)) (seq (:excluded filters)) (> filter-n 0))
      [:div.references.page-linked.flex-1.flex-row
       [:div.content.pt-6
        (references-cp page-entity *filters total filter-n filtered-ref-blocks' *ref-pages)]])))

(rum/defcs references* < rum/reactive db-mixins/query
  (rum/local nil ::ref-pages)
  {:init (fn [state]
           (let [page (first (:rum/args state))]
             (when page (db-async/<get-block-refs (state/get-current-repo) (:db/id page))))
           (assoc state ::filters (atom nil)))}
  [state block-entity]
  (when block-entity
    (let [repo (state/get-current-repo)
          *filters (::filters state)]
      (when block-entity
        (when-not (state/sub-async-query-loading (str (:db/id block-entity) "-refs"))
          (let [block-entity (db/sub-block (:db/id block-entity))
                filters (page-handler/get-filters block-entity)
                _ (when-not (= filters @*filters)
                    (reset! *filters filters))]
            (references-aux state repo block-entity *filters filters)))))))

(rum/defc references
  [entity]
  (ui/catch-error
   (ui/component-error (if (config/db-based-graph? (state/get-current-repo))
                         "Linked References: Unexpected error."
                         "Linked References: Unexpected error. Please re-index your graph first."))
   (references* entity)))

(rum/defcs unlinked-references-aux
  < rum/reactive db-mixins/query
  {:init
   (fn [state]
     (let [*result (atom nil)
           [page *n-ref] (:rum/args state)]
       (p/let [result (search/get-unlinked-refs (:db/id page))]
         (reset! *n-ref (count result))
         (reset! *result result))
       (assoc state ::result *result)))}
  [state page _n-ref]
  (let [ref-blocks (rum/react (::result state))]
    (when (seq ref-blocks)
      [:div.references-blocks
       (let [ref-hiccup (block/->hiccup ref-blocks
                                        {:id (str (:block/title page) "-unlinked-")
                                         :ref? true
                                         :group-by-page? true
                                         :editor-box editor/box}
                                        {})]
         (content/content (:block/name page)
                          {:hiccup ref-hiccup}))])))

(rum/defcs unlinked-references < rum/reactive
  (rum/local nil ::n-ref)
  [state page]
  (let [n-ref (get state ::n-ref)]
    (when page
      [:div.references.page-unlinked.mt-6.flex-1.flex-row.faster.fade-in
       [:div.content.flex-1
        (ui/foldable
         [:h2.font-medium (t :unlinked-references/reference-count @n-ref)]
         (fn [] (unlinked-references-aux page n-ref))
         {:default-collapsed? true
          :title-trigger? true})]])))
