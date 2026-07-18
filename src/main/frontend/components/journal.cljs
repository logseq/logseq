(ns frontend.components.journal
  (:require [frontend.components.page :as page]
            [frontend.components.views :as views]
            [frontend.db.hooks :as db-hooks]
            [frontend.db.react :as react]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.shui.hooks :as hooks]
            [promesa.core :as p]
            [io.factorhouse.hsx.core :as hsx]))

(def ^:private journal-item-reserve-height-ms 5000)
(defonce ^:private journal-item-height-by-key* (atom {}))

(defn- journal-item-cache-key
  [id]
  [(state/get-current-repo) id])

(defn- css-px
  [v]
  (let [n (js/parseFloat v)]
    (if (js/Number.isNaN n) 0 n)))

(defn- journal-item-content-height
  [^js node]
  (when-let [content (.-firstElementChild node)]
    (let [style (js/getComputedStyle node)
          extra-height (+ (css-px (.-paddingTop style))
                          (css-px (.-paddingBottom style))
                          (css-px (.-borderTopWidth style))
                          (css-px (.-borderBottomWidth style)))]
      (js/Math.round
       (+ (.-height (.getBoundingClientRect content))
          extra-height)))))

(defn- remember-journal-item-height!
  [cache-key ^js node]
  (let [height (some-> node
                       (.getBoundingClientRect)
                       (.-height)
                       js/Math.round)]
    (when (pos? height)
      (swap! journal-item-height-by-key* assoc cache-key height))))

(hsx/defc journal-cp
  [id last? keep-tree-resident?]
  (let [cache-key (journal-item-cache-key id)
        [reserve set-reserve!] (hooks/use-state {:cache-key cache-key
                                                 :height (get @journal-item-height-by-key* cache-key)})
        reserve-height (when (= cache-key (:cache-key reserve))
                         (:height reserve))
        clear-reserve! #(set-reserve! {:cache-key cache-key :height nil})
        *item-ref (hooks/use-ref nil)]
    (hooks/use-effect!
     (fn []
       (set-reserve! {:cache-key cache-key
                      :height (get @journal-item-height-by-key* cache-key)})
       (let [timeout-id (js/setTimeout clear-reserve!
                                       journal-item-reserve-height-ms)]
         #(js/clearTimeout timeout-id)))
     [cache-key])
    (hooks/use-effect!
     (fn []
       (when-let [node (hooks/deref *item-ref)]
         (when-not reserve-height
           (remember-journal-item-height! cache-key node))
         (let [observer (js/ResizeObserver.
                         (fn []
                           (if reserve-height
                             (when (>= (or (journal-item-content-height node) 0)
                                       (dec reserve-height))
                               (clear-reserve!))
                             (remember-journal-item-height! cache-key node))))]
           (.observe observer node)
           #(.disconnect observer))))
     [cache-key reserve-height])
    [:div.journal-item.content
     (cond-> {:ref *item-ref}
       last? (assoc :class "journal-last-item")
       reserve-height (assoc :style {:min-height reserve-height})
       reserve-height (assoc :on-focus clear-reserve!)
       reserve-height (assoc :on-input clear-reserve!))
     (page/page-cp {:db/id id
                    :journals? true
                    :keep-tree-resident? keep-tree-resident?})]))

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
       (ui/virtualized-list
        {:custom-scroll-parent (util/app-scroll-container-node)
         :increase-viewport-by {:top 100 :bottom 100}
         :skipAnimationFrameInResizeObserver true
         :compute-item-key (fn [idx]
                             (let [id (util/nth-safe data idx)]
                               (str "journal-" id)))
         :total-count (count data)
         :item-content (fn [idx]
                         (let [id (util/nth-safe data idx)
                               last? (= (inc idx) (count data))]
                           (journal-cp id last? (< idx 2))))})])))
