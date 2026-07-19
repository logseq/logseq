(ns frontend.components.journal
  (:require [frontend.components.journal-state :as journal-state]
            [frontend.components.page :as page]
            [frontend.db.async :as db-async]
            [frontend.db.hooks :as db-hooks]
            [frontend.db.react :as react]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.shui.hooks :as hooks]
            [io.factorhouse.hsx.core :as hsx]))

(def ^:private journal-item-estimated-height 720)
(def ^:private journal-slot-mount-delay-ms 120)
(def ^:private journal-metadata-hydration-delay-ms 400)
(defonce ^:private journal-item-height-by-key* (atom {}))

(defn- journal-item-cache-key
  [id]
  [(state/get-current-repo) id])

(defn- remember-journal-item-height!
  [cache-key ^js node]
  (let [height (some-> node
                       (.getBoundingClientRect)
                       (.-height)
                       js/Math.round)]
    (when (pos? height)
      (swap! journal-item-height-by-key* assoc cache-key height)
      height)))

(defn- journal-slot-near-viewport?
  [^js node ^js root]
  (let [rect (.getBoundingClientRect node)
        root-rect (.getBoundingClientRect root)
        margin 400]
    (and (> (.-bottom rect) (- (.-top root-rect) margin))
         (< (.-top rect) (+ (.-bottom root-rect) margin)))))

(defn- journal-slot-visible?
  [^js node ^js root]
  (let [rect (.getBoundingClientRect node)
        root-rect (.getBoundingClientRect root)]
    (and (> (.-bottom rect) (.-top root-rect))
         (< (.-top rect) (.-bottom root-rect)))))

(defn- use-journal-slot-visibility!
  [cache-key *item-ref *mounted-ref *mount-timer-ref set-mounted! set-loaded!]
  (hooks/use-effect!
   (fn []
     (let [node (hooks/deref *item-ref)
           root (util/app-scroll-container-node)]
       (when (and node root)
         (letfn [(cancel-pending-mount! []
                   (when-let [timer (hooks/deref *mount-timer-ref)]
                     (js/clearTimeout timer)
                     (hooks/set-ref! *mount-timer-ref nil)))
                 (release-slot! []
                   (cancel-pending-mount!)
                   (hooks/set-ref! *mounted-ref false)
                   (set-loaded! false)
                   (set-mounted! false))
                 (mount-slot! []
                   (cancel-pending-mount!)
                   (when-not (hooks/deref *mounted-ref)
                     (set-loaded! false))
                   (hooks/set-ref! *mounted-ref true)
                   (set-mounted! true))
                 (schedule-mount! []
                   (when-not (hooks/deref *mount-timer-ref)
                     (hooks/set-ref!
                      *mount-timer-ref
                      (js/setTimeout
                       (fn []
                         (hooks/set-ref! *mount-timer-ref nil)
                         (when (journal-slot-near-viewport? node root)
                           (mount-slot!)))
                       journal-slot-mount-delay-ms))))]
           (let [observer (js/IntersectionObserver.
                           (fn [entries]
                             (let [intersecting? (boolean (some #(.-isIntersecting %)
                                                                (array-seq entries)))
                                   focused? (.contains node (.-activeElement js/document))
                                   visible? (journal-state/slot-load-now?
                                             (journal-slot-visible? node root)
                                             focused?)
                                   mounted? (hooks/deref *mounted-ref)]
                               (cond
                                 visible?
                                 (mount-slot!)

                                 (and intersecting? mounted?)
                                 (cancel-pending-mount!)

                                 intersecting?
                                 (schedule-mount!)

                                 :else
                                 (release-slot!))))
                           #js {:root root
                                :rootMargin "400px 0px"})
                 on-focus-out (fn []
                                (js/setTimeout
                                 #(let [focused? (.contains node (.-activeElement js/document))]
                                    (when (and (not focused?)
                                               (not (journal-slot-near-viewport? node root)))
                                      (release-slot!)))
                                 0))]
             (.observe observer node)
             (.addEventListener node "focusout" on-focus-out)
             (fn []
               (cancel-pending-mount!)
               (.disconnect observer)
               (.removeEventListener node "focusout" on-focus-out)))))))
   [cache-key]))

(defn- use-journal-metadata-readiness
  [mounted? loaded? recent?]
  (let [[metadata-ready? set-metadata-ready!] (hooks/use-state recent?)]
    (hooks/use-effect!
     (fn []
       (cond
         recent?
         (do
           (set-metadata-ready! true)
           nil)

         (and mounted? loaded?)
         (let [root (util/app-scroll-container-node)
               *timer (atom nil)
               cancel! (fn []
                         (when-let [timer @*timer]
                           (js/clearTimeout timer)
                           (reset! *timer nil)))
               schedule! (fn []
                           (cancel!)
                           (set-metadata-ready! false)
                           (reset! *timer
                                   (js/setTimeout
                                    #(do
                                       (reset! *timer nil)
                                       (set-metadata-ready! true))
                                    journal-metadata-hydration-delay-ms)))]
           (schedule!)
           (.addEventListener root "scroll" schedule! #js {:passive true})
           (fn []
             (cancel!)
             (.removeEventListener root "scroll" schedule!)))

         :else
         (do
           (set-metadata-ready! false)
           nil)))
     [mounted? loaded? recent?])
    metadata-ready?))

(defn- journal-slot-placeholder
  [journal-day]
  [:div.journal-slot-placeholder.absolute.inset-x-0.top-0
   {:style {:z-index 1
            :background-color "var(--ls-primary-background-color)"}}
   [:div.ls-page-title.flex.flex-1.w-full.content.items-start.title
    [:div.ls-page-title-container.block-content.inline
     (date-time-util/int->journal-title journal-day (state/get-date-formatter))]]])

(hsx/defc journal-slot
  [{:db/keys [id] :block/keys [journal-day]} last? recent?]
  (let [cache-key (journal-item-cache-key id)
        [mounted? set-mounted!] (hooks/use-state recent?)
        [loaded? set-loaded!] (hooks/use-state false)
        [placeholder-height set-placeholder-height!]
        (hooks/use-state (or (get @journal-item-height-by-key* cache-key)
                             journal-item-estimated-height))
        *item-ref (hooks/use-ref nil)
        *mounted-ref (hooks/use-ref mounted?)
        *mount-timer-ref (hooks/use-ref nil)
        metadata-ready? (use-journal-metadata-readiness mounted? loaded? recent?)]
    (hooks/set-ref! *mounted-ref mounted?)
    (hooks/use-effect!
     (fn []
       (set-placeholder-height! (or (get @journal-item-height-by-key* cache-key)
                                    journal-item-estimated-height))
       (set-loaded! false)
       (set-mounted! recent?)
       nil)
     [cache-key])
    (use-journal-slot-visibility!
     cache-key *item-ref *mounted-ref *mount-timer-ref set-mounted! set-loaded!)
    (hooks/use-effect!
     (fn []
       (when (and mounted? (hooks/deref *item-ref))
         (let [node (hooks/deref *item-ref)
               update-height! #(when-let [height (remember-journal-item-height! cache-key node)]
                                 (set-placeholder-height! height))
               observer (js/ResizeObserver. update-height!)]
           (update-height!)
           (.observe observer node)
           #(.disconnect observer))))
     [cache-key mounted?])
    [:div.journal-item.content.relative
     (cond-> {:ref *item-ref}
       last? (assoc :class "journal-last-item")
       (or (not mounted?) (not loaded?)) (assoc :style {:min-height placeholder-height}))
     (when-not loaded?
       (journal-slot-placeholder journal-day))
     (when mounted?
       (page/page-cp {:db/id id
                      :journals? true
                      :keep-tree-resident? recent?
                      :block-metadata-ready? metadata-ready?
                      :on-page-blocks-rendered #(set-loaded! true)}))]))

(defn- sub-journals
  []
  (when-let [repo (state/get-current-repo)]
    (some-> (react/q repo
                     [:frontend.worker.react/journals]
                     {:query-fn (fn [_ _]
                                  (db-async/<get-latest-journals repo))}
                     nil)
            db-hooks/use-query)))

(hsx/defc all-journals
  []
  (let [data (sub-journals)]
    (when (seq data)
      [:div#journals
       (map-indexed
        (fn [idx journal]
          ^{:key (str "journal-" (:db/id journal))}
          [journal-slot journal (= (inc idx) (count data)) (< idx 2)])
        data)])))
