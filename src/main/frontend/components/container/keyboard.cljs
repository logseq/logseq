(ns frontend.components.container.keyboard
  (:require [frontend.util :as util]))

(defn- target-scroll-top
  [{:keys [scroll-top client-height scroll-height]} action]
  (let [max-top (max 0 (- scroll-height client-height))
        target-top (case action
                     :home 0
                     :end max-top
                     :page-up (- scroll-top (* client-height 0.9))
                     :page-down (+ scroll-top (* client-height 0.9))
                     scroll-top)]
    (-> target-top
        (max 0)
        (min max-top))))

(defn- scroll-key-action
  [key]
  (case key
    "Home" :home
    "End" :end
    "PageUp" :page-up
    "PageDown" :page-down
    nil))

(defn- closest
  [target selector]
  (when (fn? (some-> target .-closest))
    (.closest target selector)))

(defn- main-page-target?
  [target]
  (or (= target (.-body js/document))
      (= target (.-documentElement js/document))
      (some? (closest target "#main-content-container"))))

(defn handle-page-scroll-keydown!
  [^js e]
  (when (and (not (.-defaultPrevented e))
             (not (.-altKey e))
             (not (.-ctrlKey e))
             (not (.-metaKey e))
             (not (.-shiftKey e))
             (main-page-target? (.-target e)))
    (when-let [action (scroll-key-action (.-key e))]
      (when-let [container (util/app-scroll-container-node)]
        (when (> (.-scrollHeight container) (.-clientHeight container))
          (let [target-top (target-scroll-top {:scroll-top (.-scrollTop container)
                                               :client-height (.-clientHeight container)
                                               :scroll-height (.-scrollHeight container)}
                                              action)]
            (.preventDefault e)
            (.scrollTo container #js {:top target-top
                                      :behavior "auto"})
            true))))))
