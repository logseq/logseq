(ns frontend.handler.shortcut
  (:require [frontend.util :as util]
            [goog.object :as gobj]
            [goog.dom :as gdom]))

(defn auto-complete-prev
  [state e]
  (let [current-idx (get state :frontend.ui/current-idx)
        matched (first (:rum/args state))]
    (util/stop e)
    (js/console.log "go prev" current-idx)
    (cond
      (>= @current-idx 1)
      (swap! current-idx dec)
      (= @current-idx 0)
      (reset! current-idx (dec (count matched)))
      :else nil)
    (when-let [element (gdom/getElement (str "ac-" @current-idx))]
      (let [ac-inner (gdom/getElement "ui__ac-inner")
            element-top (gobj/get element "offsetTop")
            scroll-top (- (gobj/get element "offsetTop") 360)]
        (set! (.-scrollTop ac-inner) scroll-top)))))

(defn auto-complete-next
  [state e]
  (let [current-idx (get state :frontend.ui/current-idx)
        matched (first (:rum/args state))]
    (util/stop e)
    (js/console.log "go next" current-idx "##matched" matched)
    (let [total (count matched)]
      (if (>= @current-idx (dec total))
        (reset! current-idx 0)
        (swap! current-idx inc)))
    (when-let [element (gdom/getElement (str "ac-" @current-idx))]
      (let [ac-inner (gdom/getElement "ui__ac-inner")
            scroll-top (- (gobj/get element "offsetTop") 360)]
        (set! (.-scrollTop ac-inner) scroll-top)))))

(defn auto-complete-complete
  [state e]
  (util/stop e)
  (let [[matched {:keys [on-chosen on-enter]}] (:rum/args state)]
    (let [current-idx (get state :frontend.ui/current-idx)]
      (if (and (seq matched)
               (> (count matched)
                  @current-idx))
        (on-chosen (nth matched @current-idx) false)
        (and on-enter (on-enter state))))))
