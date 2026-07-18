(ns frontend.components.journal
  (:require [frontend.components.page :as page]
            [frontend.components.views :as views]
            [frontend.db.hooks :as db-hooks]
            [frontend.db.react :as react]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.shui.hooks :as hooks]
            [promesa.core :as p]
            [io.factorhouse.hsx.core :as hsx]))

(def ^:private journal-item-estimated-height 720)
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
        margin 1200]
    (and (> (.-bottom rect) (- (.-top root-rect) margin))
         (< (.-top rect) (+ (.-bottom root-rect) margin)))))

(hsx/defc journal-slot
  [id last? recent?]
  (let [cache-key (journal-item-cache-key id)
        [mounted? set-mounted!] (hooks/use-state recent?)
        [loaded? set-loaded!] (hooks/use-state false)
        [placeholder-height set-placeholder-height!]
        (hooks/use-state (or (get @journal-item-height-by-key* cache-key)
                             journal-item-estimated-height))
        *item-ref (hooks/use-ref nil)]
    (hooks/use-effect!
     (fn []
       (set-placeholder-height! (or (get @journal-item-height-by-key* cache-key)
                                    journal-item-estimated-height))
       (set-loaded! false)
       (set-mounted! recent?)
       nil)
     [cache-key])
    (hooks/use-effect!
     (fn []
       (let [node (hooks/deref *item-ref)
             root (util/app-scroll-container-node)]
         (when (and node root)
           (let [observer (js/IntersectionObserver.
                           (fn [entries]
                             (let [intersecting? (boolean (some #(.-isIntersecting %)
                                                                (array-seq entries)))
                                   focused? (.contains node (.-activeElement js/document))
                                   loading-recent? (and recent? (not loaded?))]
                               (set-mounted! (or intersecting? focused? loading-recent?))))
                           #js {:root root
                                :rootMargin "1200px 0px"})
                 on-focus-out (fn []
                                (js/setTimeout
                                 #(when (and (not (.contains node (.-activeElement js/document)))
                                             (not (and recent? (not loaded?)))
                                             (not (journal-slot-near-viewport? node root)))
                                    (set-mounted! false))
                                 0))]
             (.observe observer node)
             (.addEventListener node "focusout" on-focus-out)
             (fn []
               (.disconnect observer)
               (.removeEventListener node "focusout" on-focus-out))))))
     [cache-key loaded? recent?])
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
    [:div.journal-item.content
     (cond-> {:ref *item-ref}
       last? (assoc :class "journal-last-item")
       (not mounted?) (assoc :style {:min-height placeholder-height}))
     (when mounted?
       (page/page-cp {:db/id id
                      :journals? true
                      :keep-tree-resident? recent?
                      :on-page-blocks-rendered #(set-loaded! true)}))]))

(defn- sub-journals
  []
  (when-let [repo (state/get-current-repo)]
    (some-> (react/q repo
                     [:frontend.worker.react/journals]
                     {:query-fn (fn [_]
                                  (p/let [result (views/<load-view-data nil {:journals? true})]
                                    (update result :data #(vec (remove nil? %)))))}
                     nil)
            db-hooks/use-query)))

(hsx/defc all-journals
  []
  (let [{:keys [data]} (sub-journals)]
    (when (seq data)
      [:div#journals
       (map-indexed
        (fn [idx id]
          ^{:key (str "journal-" id)}
          [journal-slot id (= (inc idx) (count data)) (< idx 2)])
        data)])))
