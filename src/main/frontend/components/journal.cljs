(ns frontend.components.journal
  (:require [frontend.components.page :as page]
            [frontend.db.hooks :as db-hooks]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.shui.hooks :as hooks]
            [io.factorhouse.hsx.core :as hsx]))

(defonce ^:private journal-item-height-by-key* (atom {}))

(hsx/defc journal-item
  [journal-uuid last?]
  (let [bundle (db-hooks/use-resource [:journal-bundle journal-uuid])
        repo (state/get-current-repo)
        cache-key [repo journal-uuid]
        *item-ref (hooks/use-ref nil)
        cached-height (get @journal-item-height-by-key* cache-key)]
    (hooks/use-effect!
     (fn []
       (when-let [node (and bundle (hooks/deref *item-ref))]
         (let [observer
               (js/ResizeObserver.
                #(let [height (js/Math.round
                               (.-height (.getBoundingClientRect node)))]
                   (when (pos? height)
                     (swap! journal-item-height-by-key*
                            assoc cache-key height))))]
           (.observe observer node)
           #(.disconnect observer))))
     [repo journal-uuid (boolean bundle)])
    [:div.journal-item.content.relative
     (cond-> {:ref *item-ref}
       last? (assoc :class "journal-last-item")
       (and (not bundle) cached-height)
       (assoc :style {:min-height cached-height}))
     (when bundle
       (page/journal-page journal-uuid {:journals? true}))]))

(hsx/defc all-journals
  []
  (let [journal-uuids (db-hooks/use-resource [:journals])]
    (when (seq journal-uuids)
      (if (util/rtc-test-without-virtualization?)
        [:div#journals
         (map-indexed
          (fn [idx journal-uuid]
            ^{:key (str "journal-" journal-uuid)}
            [journal-item journal-uuid (= (inc idx) (count journal-uuids))])
          journal-uuids)]
        [:div#journals
         (ui/virtualized-list
          {:custom-scroll-parent (util/app-scroll-container-node)
           :data (to-array journal-uuids)
           :compute-item-key (fn [_idx journal-uuid]
                               (str "journal-" journal-uuid))
           :item-content (fn [idx journal-uuid]
                           (journal-item journal-uuid
                                         (= (inc idx) (count journal-uuids))))})]))))
