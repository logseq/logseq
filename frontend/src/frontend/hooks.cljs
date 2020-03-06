(ns frontend.hooks
  (:require [goog.dom :as dom]
            [uix.core.alpha :as uix]
            [uix.dom.alpha :as uix-dom])
  (:import [goog.events EventHandler]))

(defn detach-listeners
  "Detach all event listeners."
  [state]
  (some-> state ::event-handler .removeAll))

(defn listen
  "Register an event `handler` for events of `type` on `target`."
  [^EventHandler event-handler target type handler & [opts]]
  (.listen event-handler target (name type) handler (clj->js opts)))

;; (defn timeout-mixin
;;   "The setTimeout mixin."
;;   [name t f]
;;   {:will-mount
;;    (fn [state]
;;      (assoc state name (util/set-timeout t f)))
;;    :will-unmount
;;    (fn [state]
;;      (let [timeout (get state name)]
;;        (util/clear-timeout timeout)
;;        (dissoc state name)))})

;; (defn interval-mixin
;;   "The setInterval mixin."
;;   [name t f]
;;   {:will-mount
;;    (fn [state]
;;      (assoc state name (util/set-interval t f)))
;;    :will-unmount
;;    (fn [state]
;;      (when-let [interval (get state name)]
;;        (util/clear-interval interval))
;;      (dissoc state name))})

(defn event-hook
  [attach-listeners]
  (let [event-handler (uix/state (EventHandler.))]
    (uix/effect!
     (fn []
       ;; did mount
       (attach-listeners @event-handler)
       (fn []
         ;; will-unmount
         (detach-listeners @event-handler)))
     [])))

(defn close-when-esc-or-outside
  [ref event-handler open? & {:keys [on-close]}]
  (let [node (uix-dom/find-dom-node @ref)]
    (when open?
      (when node
        (listen event-handler js/window "click"
                (fn [e]
                  ;; If the click target is outside of current node
                  (when-not (dom/contains node (.. e -target))
                    (on-close e)))))

      (listen event-handler js/window "keydown"
              (fn [e]
                (case (.-keyCode e)
                  ;; Esc
                  27 (on-close e)
                  nil))))))

(defn setup-close-listener!
  [ref open?]
  (event-hook (fn [event-handler]
                (close-when-esc-or-outside
                 ref
                 event-handler
                 open?
                 :on-close (fn []
                             (reset! open? false))))))
