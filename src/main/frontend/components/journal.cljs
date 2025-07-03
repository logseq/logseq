(ns frontend.components.journal
  (:require [frontend.components.page :as page]
            [frontend.components.views :as views]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.react :as react]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [promesa.core :as p]
            [rum.core :as rum]))

(rum/defc journal-cp < rum/static
  [id last?]
  [:div.journal-item.content
   (when last?
     {:class "journal-last-item"})
   (page/page-cp {:db/id id
                  :journals? true})])

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
      [:div#journals
       (ui/virtualized-list
        {:custom-scroll-parent (util/app-scroll-container-node)
         :increase-viewport-by {:top 300 :bottom 300}
         :compute-item-key (fn [idx]
                             (let [id (util/nth-safe data idx)]
                               (str "journal-" id)))
         :total-count (count data)
         :item-content (fn [idx]
                         (let [id (util/nth-safe data idx)
                               last? (= (inc idx) (count data))]
                           (journal-cp id last?)))})])))
