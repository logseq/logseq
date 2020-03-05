(ns frontend.mixins
  (:require [rum.core :as rum]
            [goog.dom :as dom])
  (:import [goog.events EventHandler]))

(defn detach
  "Detach all event listeners."
  [state]
  (some-> state ::event-handler .removeAll))

(defn listen
  "Register an event `handler` for events of `type` on `target`."
  [state target type handler & [opts]]
  (when-let [event-handler (::event-handler state)]
    (.listen event-handler target (name type) handler (clj->js opts))))

(def event-handler-mixin
  "The event handler mixin."
  {:will-mount
   (fn [state]
     (assoc state ::event-handler (EventHandler.)))
   :will-unmount
   (fn [state]
     (detach state)
     (dissoc state ::event-handler))})

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

(defn close-when-esc-or-outside
  [state open? & {:keys [on-close]}]
  (let [node (rum/dom-node state)]
    (when open?
      (listen state js/window "click"
              (fn [e]
                ;; If the click target is outside of current node
                (when-not (dom/contains node (.. e -target))
                  (on-close e))))

      (listen state js/window "keydown"
              (fn [e]
                (case (.-keyCode e)
                  ;; Esc
                  27 (on-close e)
                  nil))))))

(defn simple-close-listener
  [state key]
  (let [open? (get state key)]
    (close-when-esc-or-outside state
                               open?
                               :on-close (fn []
                                           (reset! open? false)))))

(defn event-mixin
  [attach-listeners]
  (merge
   event-handler-mixin
   {:did-mount (fn [state]
                 (attach-listeners state)
                 state)
    :did-remount (fn [old-state new-state]
                   (detach old-state)
                   (attach-listeners new-state)
                   new-state)}))
