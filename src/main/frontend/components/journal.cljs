(ns frontend.components.journal
  (:require [frontend.components.page :as page]
            [frontend.db.hooks :as db-hooks]
            [frontend.db.subs :as subs]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.shui.hooks :as hooks]
            [io.factorhouse.hsx.core :as hsx]))

(defonce ^:private journal-item-height-by-key* (atom {}))

(def ^:private default-journal-height 640)

(defn- journal-ready?
  [journal-uuid]
  (= :ready (:status (subs/block-snapshot journal-uuid))))

(defn- journal-placeholder
  []
  [:div.journal-item-placeholder.animate-pulse.p-6
   {:aria-hidden true}
   [:div.h-8.w-48.rounded.bg-secondary]
   [:div.mt-8.h-5.w-full.rounded.bg-secondary]
   [:div.mt-3.h-5.rounded.bg-secondary {:class "w-2/3"}]])

(hsx/defc journal-content
  [journal-uuid]
  (or (page/journal-page journal-uuid {:journals? true})
      (journal-placeholder)))

(defn- row-style
  "Inline min-height for a row that shows a placeholder: its own last
   measured height when one is cached, the default otherwise."
  [cached-height]
  {:min-height (or cached-height default-journal-height)})

(hsx/defc journal-placeholder-item
  "A row during a scroll: a placeholder, hook-free, pinned to the row's last
   measured height so the list stays steady. Subscribes to nothing, so a row
   that scrolls past queues no snapshot load."
  [journal-uuid last?]
  (let [cached-height (get @journal-item-height-by-key* [(state/get-current-repo) journal-uuid])]
    [:div.journal-item.content.relative
     (cond-> {:style (row-style cached-height)}
       last? (assoc :class "journal-last-item"))
     (journal-placeholder)]))

(hsx/defc journal-rendered-item
  "A row that renders its journal. The row is pinned to its cached height
   while its snapshot is still loading and a cached height exists; a settled
   snapshot, `:missing` and `:error` included, releases the pin and lets the
   content set the height. The `ResizeObserver` measures this same box for as
   long as the row is settled and mounted, so the cache holds real row heights,
   content plus the row's padding, and follows the sub-tree as it fills in."
  [journal-uuid last?]
  (let [repo (state/get-current-repo)
        cache-key [repo journal-uuid]
        *item-ref (hooks/use-ref nil)
        cached-height (get @journal-item-height-by-key* cache-key)
        settled? (db-hooks/use-block-prefetch [journal-uuid])
        pinned? (and (not settled?) (some? cached-height))]
    (hooks/use-effect!
     (fn []
       (when-let [node (and settled? (hooks/deref *item-ref))]
         (let [observer
               (js/ResizeObserver.
                #(let [height (js/Math.round
                               (.-height (.getBoundingClientRect node)))]
                   (when (pos? height)
                     (swap! journal-item-height-by-key*
                            assoc cache-key height))))]
           (.observe observer node)
           #(.disconnect observer))))
     [repo journal-uuid settled?])
    [:div.journal-item.content.relative
     (cond-> {:ref *item-ref}
       last? (assoc :class "journal-last-item")
       pinned? (assoc :style (row-style cached-height)))
     (journal-content journal-uuid)]))

(hsx/defc journal-item
  [journal-uuid last? render?]
  (if render?
    (journal-rendered-item journal-uuid last?)
    (journal-placeholder-item journal-uuid last?)))

(hsx/defc all-journals
  []
  (let [journal-uuids (vec (db-hooks/use-resource [:journals]))
        [scrolling? set-scrolling!] (hooks/use-state false)]
    (when (seq journal-uuids)
      (if (util/rtc-test-without-virtualization?)
        [:div#journals.h-full
         (map-indexed
          (fn [idx journal-uuid]
            ^{:key (str "journal-" journal-uuid)}
            [journal-item journal-uuid
             (= (inc idx) (count journal-uuids))
             true])
          journal-uuids)]
        [:div#journals.h-full
         (ui/virtualized-list
          {:custom-scroll-parent (util/app-scroll-container-node)
           :data (to-array journal-uuids)
           :compute-item-key (fn [_idx journal-uuid]
                               (str "journal-" journal-uuid))
           :is-scrolling set-scrolling!
           :item-content (fn [idx journal-uuid]
                           (journal-item journal-uuid
                                         (= (inc idx) (count journal-uuids))
                                         (or (journal-ready? journal-uuid)
                                             (not scrolling?))))})]))))
