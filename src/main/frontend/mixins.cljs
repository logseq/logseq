(ns frontend.mixins
  "Rum mixins for use in components"
  (:require [rum.core :as rum]
            [goog.dom :as dom]
            [frontend.util :refer [profile] :as util]
            [frontend.state :as state])
  (:import [goog.events EventHandler]))

(defn detach
  "Detach all event listeners."
  [state]
  (some-> state ::event-handler .removeAll))

(defn listen
  "Register an event `handler` for events of `type` on `target`."
  [state target type handler & [opts]]
  (when-let [^EventHandler event-handler (::event-handler state)]
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

(defn hide-when-esc-or-outside
  [state & {:keys [on-hide node visibilitychange? outside?]}]
  (let [opts (last (:rum/args state))
        outside? (cond-> opts (nil? outside?) (:outside?))]
    (try
      (let [dom-node (rum/dom-node state)]
        (when-let [dom-node (or node dom-node)]
          (let [click-fn (fn [e]
                           (let [target (.. e -target)]
                             ;; If the click target is outside of current node
                             (when (and
                                     (not (dom/contains dom-node target))
                                     (not (.contains (.-classList target) "ignore-outside-event")))
                               (on-hide state e :click))))]
            (when-not (false? outside?)
              (listen state js/window "mousedown" click-fn)))
          (listen state js/window "keydown"
                  (fn [e]
                    (case (.-keyCode e)
                      ;; Esc
                      27 (on-hide state e :esc)
                      nil)))
          (when visibilitychange?
            (listen state js/window "visibilitychange"
                    (fn [e]
                      (on-hide state e :visibilitychange))))))
      (catch :default _e
        ;; TODO: Unable to find node on an unmounted component.
        nil))))

(defn on-enter
  [state & {:keys [on-enter node]}]
  (let [node (or node (rum/dom-node state))]
    (listen state node "keyup"
            (fn [e]
              (case (.-keyCode e)
                ;; Enter
                13 (on-enter e)
                nil)))))

(defn on-key-up
  "Caution: This mixin uses a different args than on-key-down"
  [state keycode-map all-handler]
  (listen state js/window "keyup"
          (fn [e]
            (let [key-code (.-keyCode e)]
              (when-let [f (get keycode-map key-code)]
                (f state e))
              (when all-handler (all-handler e key-code))))))

(defn on-key-down
  ([state keycode-map]
   (on-key-down state keycode-map {}))
  ([state keycode-map {:keys [not-matched-handler all-handler target keycode?]
                       :or {keycode? true}}]
   (listen state (or target js/window) "keydown"
           (fn [e]
             (let [key (if keycode? (.-keyCode e) (.-key e))]
               (if-let [f (get keycode-map key)]
                 (f state e)
                 (when (and not-matched-handler (fn? not-matched-handler))
                   (not-matched-handler e key)))
               (when (and all-handler (fn? all-handler))
                 (all-handler e key)))))))

(defn event-mixin
  ([attach-listeners]
   (event-mixin attach-listeners identity))
  ([attach-listeners init-callback]
   (merge
    event-handler-mixin
    {:init (fn [state _props]
             (init-callback state))
     :did-mount (fn [state]
                  (attach-listeners state)
                  state)
     :will-remount (fn [old-state new-state]
                     (detach old-state)
                     (attach-listeners new-state)
                     new-state)})))

(defn modal
  [k]
  (event-mixin
   (fn [state]
     (let [open? (get state k)]
       (hide-when-esc-or-outside
        state
        :on-hide (fn []
                   (when (and open? @open?)
                     (reset! open? false))))))
   (fn [state]
     (let [open? (atom false)
           component (:rum/react-component state)]
       (add-watch open? ::open
                  (fn [_ _ _ _]
                    (rum/request-render component)))
       (assoc state
              :open? open?
              :close-fn (fn []
                          (reset! open? false))
              :open-fn (fn []
                         (reset! open? true))
              :toggle-fn (fn []
                           (swap! open? not)))))))

(def component-editing-mode
  {:will-mount
   (fn [state]
     (state/set-block-component-editing-mode! true)
     state)
   :will-unmount
   (fn [state]
     (state/set-block-component-editing-mode! false)
     state)})

(defn perf-measure-mixin
  "Does performance measurements in development."
  [desc]
  {:wrap-render
   (fn wrap-render [render-fn]
     (fn [state]
       (profile
        (str "Render " desc)
        (render-fn state))))})
