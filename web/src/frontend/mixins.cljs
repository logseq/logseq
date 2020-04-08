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
    (prn {:type type
          :target target
          :handler handler})
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

(defn hide-when-esc-or-outside
  [state show? & {:keys [on-hide node show-fn]}]
  (let [node (or node (rum/dom-node state))
        show? (if (and show-fn (fn? show-fn))
                (show-fn)
                @show?)]
    (when show?
      (listen state js/window "click"
              (fn [e]
                ;; If the click target is outside of current node
                (when-not (dom/contains node (.. e -target))
                  (on-hide e))))

      (listen state js/window "keydown"
              (fn [e]
                (case (.-keyCode e)
                  ;; Esc
                  27 (on-hide e)
                  nil))))))

(defn event-mixin
  ([attach-listeners]
   (event-mixin attach-listeners identity))
  ([attach-listeners init-callback]
   (merge
    event-handler-mixin
    {:init (fn [state props]
             (init-callback state))
     :did-mount (fn [state]
                  (attach-listeners state)
                  state)
     :did-remount (fn [old-state new-state]
                    (detach old-state)
                    (attach-listeners new-state)
                    new-state)})))

;; TODO: is it possible that multiple nested components using the same key `:open?`?
(defn modal
  []
  (let [k :open?]
    (event-mixin
     (fn [state]
       (let [open? (get state k)]
         (hide-when-esc-or-outside state
                                    open?
                                    :on-hide (fn []
                                                (reset! open? false)))))
     (fn [state]
       (let [open? (atom false)
             component (:rum/react-component state)]
         (add-watch open? ::open
                    (fn [_ _ _ _]
                      (rum/request-render component)))
         (assoc state
                k open?
                :close-fn (fn []
                            (reset! open? false))
                :open-fn (fn []
                           (reset! open? true))
                :toggle-fn (fn []
                             (swap! open? not))))))))

(defn will-mount-effect
  [handler]
  {:will-mount (fn [state]
                 (handler (:rum/args state))
                 state)})
