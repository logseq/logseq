(ns frontend.components.journal
  (:require [frontend.components.page :as page]
            [frontend.db.hooks :as db-hooks]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [io.factorhouse.hsx.core :as hsx]))

(hsx/defc journal-item
  [journal-uuid last?]
  (let [bundle (db-hooks/use-resource [:journal-bundle journal-uuid])]
    [:div.journal-item.content.relative
     (cond-> {}
       last? (assoc :class "journal-last-item"))
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
