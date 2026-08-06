(ns frontend.components.journal
  (:require [frontend.components.page :as page]
            [frontend.db.hooks :as db-hooks]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.shui.hooks :as hooks]
            [io.factorhouse.hsx.core :as hsx]))

(defonce ^:private journal-item-height-by-key* (atom {}))

(def ^:private journal-window-limit 50)
(def ^:private journal-window-load-delay-ms 120)
(def ^:private default-journal-height 640)

(defn- estimated-journal-height
  []
  (let [heights (vals @journal-item-height-by-key*)]
    (if (seq heights)
      (/ (reduce + heights) (count heights))
      default-journal-height)))

(defn- initial-journal-count
  []
  (let [viewport-height (or (some-> (util/app-scroll-container-node)
                                    .-clientHeight)
                            (.-innerHeight js/window))]
    (-> (js/Math.ceil (/ viewport-height (estimated-journal-height)))
        (max 1)
        (min journal-window-limit))))

(defn- journal-window
  [journal-uuids visible-range]
  (when (and (seq journal-uuids) visible-range)
    (let [[start-index end-index] visible-range
          end-index (min (dec (count journal-uuids))
                         end-index
                         (+ start-index (dec journal-window-limit)))]
      (subvec journal-uuids start-index (inc end-index)))))

(hsx/defc journal-item
  [journal-uuid last? ready?]
  (let [repo (state/get-current-repo)
        cache-key [repo journal-uuid]
        *item-ref (hooks/use-ref nil)
        cached-height (get @journal-item-height-by-key* cache-key)]
    (hooks/use-effect!
     (fn []
       (when-let [node (and ready? (hooks/deref *item-ref))]
         (let [observer
               (js/ResizeObserver.
                #(let [height (js/Math.round
                               (.-height (.getBoundingClientRect node)))]
                   (when (pos? height)
                     (swap! journal-item-height-by-key*
                            assoc cache-key height))))]
           (.observe observer node)
           #(.disconnect observer))))
     [repo journal-uuid ready?])
    [:div.journal-item.content.relative
     (cond-> {:ref *item-ref}
       last? (assoc :class "journal-last-item")
       (or cached-height (not ready?))
       (assoc :style {:min-height (or cached-height default-journal-height)}))
     (when ready?
       (page/journal-page journal-uuid {:journals? true}))]))

(hsx/defc all-journals
  []
  (let [initial-count (hooks/use-memo initial-journal-count [])
        journal-data (db-hooks/use-resource [:journals initial-count])
        journal-uuids (vec (:journal-uuids journal-data))
        [visible-range set-visible-range!]
        (hooks/use-state
         [0 (dec (if (util/rtc-test-without-virtualization?)
                   journal-window-limit
                   initial-count))])
        settled-visible-range (hooks/use-debounced-value
                               visible-range
                               journal-window-load-delay-ms)
        visible-uuids (journal-window journal-uuids settled-visible-range)
        initial-uuids (set (:loaded-uuids journal-data))
        window-key (when (some #(not (contains? initial-uuids %)) visible-uuids)
                     [:journal-window visible-uuids])
        window-state (db-hooks/use-resource-snapshot window-key)
        ready-uuids (into initial-uuids
                          (get-in window-state [:value :loaded-uuids]))
        items-rendered! (fn [^js items]
                          (when (pos? (alength items))
                            (let [next-range [(.-index (aget items 0))
                                              (.-index (aget items
                                                             (dec (alength items))))]]
                              (set-visible-range!
                               (fn [current]
                                 (if (= current next-range)
                                   current
                                   next-range))))))]
    (when (seq journal-uuids)
      (if (util/rtc-test-without-virtualization?)
        [:div#journals
         (map-indexed
          (fn [idx journal-uuid]
            ^{:key (str "journal-" journal-uuid)}
            [journal-item journal-uuid
             (= (inc idx) (count journal-uuids))
             (contains? ready-uuids journal-uuid)])
          journal-uuids)]
        [:div#journals
         (ui/virtualized-list
          {:custom-scroll-parent (util/app-scroll-container-node)
           :data (to-array journal-uuids)
           :compute-item-key (fn [_idx journal-uuid]
                               (str "journal-" journal-uuid))
           :items-rendered items-rendered!
           :item-content (fn [idx journal-uuid]
                           (journal-item journal-uuid
                                         (= (inc idx) (count journal-uuids))
                                         (contains? ready-uuids journal-uuid)))})]))))
