(ns frontend.components.lazy
  "Lazy loading components for better performance"
  (:require [cljs.core.async :as async]
            [frontend.performance :as perf]
            [frontend.state :as state]
            [rum.core :as rum]))

;; Lazy loading hook
(defn use-lazy-data
  "React hook for lazy data loading"
  [data-loader initial-page-size]
  (let [[data set-data] (rum/use-state [])
        [loading set-loading] (rum/use-state false)
        [page set-page] (rum/use-state 1)
        [has-more set-has-more] (rum/use-state true)]

    (rum/use-effect!
     (fn []
       (set-loading true)
       (-> (data-loader page initial-page-size)
           (.then (fn [new-data]
                    (set-data (concat data new-data))
                    (set-has-more (> (count new-data) 0))
                    (set-loading false)))))
     [page])

    {:data data
     :loading loading
     :has-more has-more
     :load-more #(set-page (inc page))}))

;; Virtual scrolling component
(rum/defc virtual-list < rum/static
  [items item-height container-height render-item]
  (let [platform-config (perf/get-platform-config)
        threshold (:virtual-scroll-threshold platform-config)
        use-virtual (> (count items) threshold)]

    (if-not use-virtual
      ;; Regular rendering for small lists
      [:div {:style {:height container-height :overflow-y "auto"}}
       (map-indexed
        (fn [idx item]
          (rum/with-key (render-item item idx) idx))
        items)]

      ;; Virtual scrolling for large lists
      (let [[scroll-top set-scroll-top] (rum/use-state 0)
            [start-idx end-idx] (perf/calculate-visible-range
                                 scroll-top item-height container-height (count items))
            visible-items (subvec items start-idx (min end-idx (count items)))
            total-height (* (count items) item-height)
            offset-top (* start-idx item-height)]

        [:div {:style {:height container-height :overflow-y "auto"}
               :on-scroll (fn [e]
                           (set-scroll-top (.-scrollTop (.-target e))))}
         [:div {:style {:height total-height :position "relative"}}
          [:div {:style {:transform (str "translateY(" offset-top "px)")}}
           (map-indexed
            (fn [idx item]
              (rum/with-key (render-item item (+ start-idx idx)) idx))
            visible-items)]]]))))

;; Paginated data loader
(defn create-paginated-loader
  "Create a paginated data loader function"
  [data-source page-size]
  (fn [page _]
    (js/Promise.
     (fn [resolve reject]
       (try
         (let [start-idx (* (dec page) page-size)
               end-idx (+ start-idx page-size)
               page-data (perf/lazy-load-data data-source page-size page)]
           (resolve page-data))
         (catch :default e
           (reject e)))))))

;; Infinite scroll component
(rum/defc infinite-scroll < rum/static
  [data-loader render-item & {:keys [page-size threshold]
                              :or {page-size 50 threshold 100}}]
  (let [{:keys [data loading has-more load-more]} (use-lazy-data
                                                   (create-paginated-loader data-loader page-size)
                                                   page-size)
        [scroll-position set-scroll-position] (rum/use-state 0)]

    [:div {:style {:height "100%" :overflow-y "auto"}
           :on-scroll (fn [e]
                       (let [target (.-target e)
                             scroll-top (.-scrollTop target)
                             scroll-height (.-scrollHeight target)
                             client-height (.-clientHeight target)]
                         (set-scroll-position scroll-top)
                         (when (and has-more
                                  (not loading)
                                  (> (+ scroll-top client-height)
                                     (- scroll-height threshold)))
                           (load-more))))}
     ;; Render items
     (map-indexed
      (fn [idx item]
        (rum/with-key (render-item item idx) idx))
      data)

     ;; Loading indicator
     (when loading
       [:div.loading-indicator "Loading more..."])

     ;; End indicator
     (when-not has-more
       [:div.end-indicator "No more items to load"])]))