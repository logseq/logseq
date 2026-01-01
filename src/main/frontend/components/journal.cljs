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

(def ^:private journal-page-size 30)

(rum/defc journal-cp < rum/static
  [id last?]
  [:div.journal-item.content
   (when last?
     {:class "journal-last-item"})
   (page/page-cp {:db/id id
                  :journals? true})])

(defn- load-journals
  [offset limit]
  (when-let [repo (state/get-current-repo)]
    (p/let [{:keys [data count has-more?]} (views/<load-view-data nil {:journals? true
                                                                        :journal-limit limit
                                                                        :journal-offset offset})]
      {:data (remove nil? data)
       :count count
       :has-more? has-more?})))

(rum/defc all-journals < rum/reactive
  {:init (fn [state]
           (assoc state
                  ::loaded-journals (atom [])
                  ::loading? (atom false)
                  ::has-more? (atom true)
                  ::initialized? (atom false)))
   :did-mount (fn [state]
                (let [loaded-journals (::loaded-journals state)
                      loading? (::loading? state)
                      has-more? (::has-more? state)
                      initialized? (::initialized? state)]
                  (when-not @initialized?
                    (reset! loading? true)
                    (p/let [result (load-journals 0 journal-page-size)]
                      (reset! loaded-journals (:data result))
                      (reset! has-more? (:has-more? result))
                      (reset! loading? false)
                      (reset! initialized? true))))
                state)}
  [_]
  (let [*state (rum/state _)
        loaded-journals (::loaded-journals *state)
        loading? (::loading? *state)
        has-more? (::has-more? *state)
        data @loaded-journals
        load-more! (fn []
                     (when (and @has-more? (not @loading?))
                       (reset! loading? true)
                       (p/let [offset (count @loaded-journals)
                               result (load-journals offset journal-page-size)]
                         (swap! loaded-journals into (:data result))
                         (reset! has-more? (:has-more? result))
                         (reset! loading? false))))]
    (when (seq data)
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
                           (journal-cp id last?)))
         :end-reached (fn [_]
                        (when @has-more?
                          (load-more!)))
         :overscan 200})])))
