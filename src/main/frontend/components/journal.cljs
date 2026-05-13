(ns frontend.components.journal
  (:require [frontend.components.page :as page]
            [frontend.db :as db]
            [frontend.components.views :as views]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.react :as react]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.db :as ldb]
            [promesa.core :as p]
            [rum.core :as rum]))

(rum/defc journal-cp < rum/static
  [id last? selection-block-ids]
  [:div.journal-item.content
   (when last?
     {:class "journal-last-item"})
   (page/page-cp {:db/id id
                  :journals? true
                  :selection/block-ids selection-block-ids})])

(defn- journal-block-ids
  [journal-ids]
  (->> journal-ids
       (mapcat (fn [id]
                 (some->> (db/entity id)
                          :block/_parent
                          ldb/sort-by-order
                          (map :block/uuid))))
       vec))

(defn- sub-journals
  []
  (when-let [repo (state/get-current-repo)]
    (some-> (react/q repo
                     [:frontend.worker.react/journals]
                     {:query-fn (fn [_]
                                  (p/let [{:keys [data]} (views/<load-view-data nil {:journals? true})]
                                    (remove nil? data)))}
                     nil)
            util/react)))

(rum/defc all-journals < rum/reactive db-mixins/query
  []
  (let [data (sub-journals)]
    (when (seq data)
      (let [selection-block-ids (journal-block-ids data)]
        [:div#journals
         (ui/virtualized-list
          {:custom-scroll-parent (util/app-scroll-container-node)
           :increase-viewport-by {:top 100 :bottom 100}
           :compute-item-key (fn [idx]
                               (let [id (util/nth-safe data idx)]
                                 (str "journal-" id)))
           :total-count (count data)
           :item-content (fn [idx]
                           (let [id (util/nth-safe data idx)
                                 last? (= (inc idx) (count data))]
                             (journal-cp id last? selection-block-ids)))})]))))
