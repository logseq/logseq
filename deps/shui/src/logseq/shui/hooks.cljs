(ns logseq.shui.hooks
  "React custom hooks."
  (:refer-clojure :exclude [deref])
  (:require ["react" :as react]
            [frontend.common.missionary :as c.m]
            [goog.functions :as gfun]
            [missionary.core :as m]))

(defn- memo-deps
  [equal-fn deps]
  (let [equal-fn (or equal-fn =)
        ^js deps-ref (react/useRef deps)]
    (when-not (equal-fn (.-current deps-ref) deps)
      (set! (.-current deps-ref) deps))
    (.-current deps-ref)))

(defn- deps-array
  [deps equal-fn]
  (if (empty? deps)
    #js[]
    #js[(memo-deps equal-fn deps)]))

(defn- effect-result
  [result]
  (if (fn? result)
    result
    js/undefined))

(defn use-memo
  [f deps & {:keys [equal-fn]}]
  (react/useMemo f (deps-array deps equal-fn)))

(defn use-effect!
  "setup-fn will be invoked every render of component when no deps arg provided"
  ([setup-fn]
   (assert (fn? setup-fn) "use-effect! setup-fn should be a function")
   (react/useEffect (fn []
                      (let [result (setup-fn)]
                        (effect-result result)))))
  ([setup-fn deps & {:keys [equal-fn]}]
   (assert (fn? setup-fn) "use-effect! setup-fn should be a function")
   (react/useEffect (fn []
                      (let [result (setup-fn)]
                        (effect-result result)))
                    (deps-array deps equal-fn))))

(defn use-layout-effect!
  ([setup-fn]
   (assert (fn? setup-fn) "use-layout-effect! setup-fn should be a function")
   (react/useLayoutEffect (fn []
                            (let [result (setup-fn)]
                              (effect-result result)))))
  ([setup-fn deps & {:keys [equal-fn]}]
   (assert (fn? setup-fn) "use-layout-effect! setup-fn should be a function")
   (react/useLayoutEffect (fn []
                            (let [result (setup-fn)]
                              (effect-result result)))
                          (deps-array deps equal-fn))))

(defn use-callback
  [callback deps & {:keys [equal-fn]}]
  (react/useCallback callback (deps-array deps equal-fn)))

(defn- event-target
  [target]
  (cond
    (fn? target)
    (target)

    (and target (not (undefined? (.-current target))))
    (.-current target)

    :else
    target))

(defn use-event-listener
  ([target event-name handler deps]
   (use-event-listener target event-name handler deps nil))
  ([target event-name handler deps options]
   (use-effect!
    (fn []
      (when-let [target' (event-target target)]
        (.addEventListener target' event-name handler options)
        #(.removeEventListener target' event-name handler options)))
    (into [target event-name options] deps))))

(defn use-window-keydown
  ([handler deps]
   (use-window-keydown handler deps nil))
  ([handler deps options]
   (use-event-listener js/window "keydown" handler deps options)))

(defn use-window-keyup
  ([handler deps]
   (use-window-keyup handler deps nil))
  ([handler deps options]
   (use-event-listener js/window "keyup" handler deps options)))

(defn use-hide-on-esc-or-outside
  [{:keys [active? root-ref on-hide ignore-class outside-event outside-options]
    :or {ignore-class "ignore-outside-event"
         outside-event "mousedown"}}]
  (let [outside-handler (use-callback
                         (fn [e]
                           (when (and active?
                                      (not (some-> (event-target root-ref)
                                                   (.contains (.-target e))))
                                      (not (some-> e .-target .-classList (.contains ignore-class))))
                             (on-hide e)))
                         [active? root-ref on-hide ignore-class])
        keydown-handler (use-callback
                         (fn [e]
                           (when (and active? (= 27 (.-keyCode e)))
                             (on-hide e)))
                         [active? on-hide])]
    (use-event-listener js/window outside-event outside-handler [outside-handler] outside-options)
    (use-window-keydown keydown-handler [keydown-handler])))

;;; React hooks
(def use-ref react/useRef)
(def create-ref react/createRef)
(defn deref [ref] (.-current ref))
(defn set-ref! [ref value] (set! (.-current ref) value))
(defn- choose-value [nv cv]
  (if (= nv cv)
    cv
    nv))

;; borrowed from https://github.com/pitch-io/uix/blob/master/core/src/uix/hooks/alpha.cljs
(defn- use-clojure-aware-updater
  "Replicates React's behaviour when updating state with identical JS value,
  but using Clojure's value equality here"
  [updater]
  (react/useCallback
   (fn [v & args]
     (updater
      (fn [cv]
        (if (fn? v)
          (choose-value (apply v cv args) cv)
          (choose-value v cv)))))
   #js [updater]))

(defn use-state [value]
  (let [[state set-state] (react/useState value)
        set-state (use-clojure-aware-updater set-state)]
    #js [state set-state]))

(defn- clojure-aware-reducer-updater
  "Same as `use-clojure-primitive-aware-updater` but for `use-reducer`"
  [f]
  (fn [state action]
    (choose-value (f state action) state)))

(defn use-reducer
  ([f value]
   (let [updater (clojure-aware-reducer-updater f)]
     (react/useReducer updater value)))
  ([f value init-state]
   (let [updater (clojure-aware-reducer-updater f)]
     (react/useReducer updater value init-state))))

;;; other custom hooks

(defn use-debounced-value
  "Return the debounced value"
  [value msec]
  (let [[debounced-value set-value!] (use-state value)
        cb (use-callback (gfun/debounce set-value! msec) [])]
    (use-effect! #(cb value) [value])
    debounced-value))

(defn use-flow-state
  "Return values from `flow`, default init-value is nil"
  ([flow] (use-flow-state nil flow []))
  ([init-value flow] (use-flow-state init-value flow []))
  ([init-value flow deps]
   (let [[value set-value!] (use-state init-value)]
     (use-effect!
      #(c.m/run-task*
        (m/reduce
         (constantly nil)
         (m/ap (set-value! (m/?> flow)))))
      deps)
     value)))

(defn- is-touch-event? [e]
  (exists? (.-touches e)))

(defn- prevent-default [e]
  (when (and (is-touch-event? e)
             (< (.-length (.-touches e)) 2)
             (.-preventDefault e))
    (.preventDefault e)))

(defn use-long-press
  [{:keys [on-click on-long-press prevent-default? delay]
    :or {prevent-default? true
         delay 300}}]
  (let [[long-press-triggered set-long-press-triggered] (use-state false)
        timeout-ref (use-ref nil)
        target-ref (use-ref nil)
        start (use-callback
               (fn [e]
                 (when (and prevent-default? (.-target e))
                   (.addEventListener (.-target e) "touchend" prevent-default #js {:passive false})
                   (set! (.-current target-ref) (.-target e)))
                 (set! (.-current timeout-ref)
                       (js/setTimeout
                        (fn []
                          (on-long-press e)
                          (set-long-press-triggered true))
                        delay)))
               [on-long-press delay prevent-default?])

        clear (use-callback
               (fn [_e should-trigger-click]
                 (when (.-current timeout-ref)
                   (js/clearTimeout (.-current timeout-ref)))
                 (when (and (or (nil? should-trigger-click) should-trigger-click)
                            (not long-press-triggered))
                   (on-click))
                 (set-long-press-triggered false)
                 (when (and prevent-default? (.-current target-ref))
                   (.removeEventListener (.-current target-ref) "touchend" prevent-default)))
               [prevent-default? on-click long-press-triggered])]

    {:onMouseDown #(start %)
     :onTouchStart #(start %)
     :onMouseUp #(clear % true)
     :onMouseLeave #(clear % false)
     :onTouchEnd #(clear % true)}))

(defn- use-atom-fn
  [a getter-fn setter-fn]
  (let [[val set-val] (use-state (getter-fn @a))]
    (use-effect!
     (fn []
       (let [current-value (getter-fn @a)]
         (when-not (= val current-value)
           (set-val current-value)))
       (let [id (str (random-uuid))]
         (add-watch a id (fn [_ _ prev-state next-state]
                           (let [prev-value (getter-fn prev-state)
                                 next-value (getter-fn next-state)]
                             (when-not (= prev-value next-value)
                               (set-val next-value)))))
         #(remove-watch a id)))
     [a])
    [val #(swap! a setter-fn %)]))

(defn use-atom
  "(use-atom my-atom)"
  [a]
  (use-atom-fn a identity (fn [_ v] v)))

(defn use-atom-in
  [a ks]
  (let [ks (if (keyword? ks) [ks] ks)]
    (use-atom-fn a #(get-in % ks) (fn [a' v] (assoc-in a' ks v)))))

(defn use-modal-state
  [initial-open?]
  (let [open-atom (use-memo #(atom (boolean initial-open?)) [])
        [open-value] (use-atom open-atom)
        close-fn #(reset! open-atom false)
        open-fn #(reset! open-atom true)
        toggle-fn #(swap! open-atom not)]
    {:open? open-value
     :open-atom open-atom
     :close-fn close-fn
     :open-fn open-fn
     :toggle-fn toggle-fn}))

(defn use-mounted
  []
  (let [mounted-ref (use-ref false)]
    (use-effect!
     (fn []
       (set-ref! mounted-ref true)
       #(set-ref! mounted-ref false))
     [])
    #(deref mounted-ref)))

(defn use-bounding-client-rect
  "Return a callback ref and the current bounding client rect for that node."
  ([] (use-bounding-client-rect nil))
  ([tick]
   (let [[ref set-ref] (use-state nil)
         [rect set-rect] (use-state nil)]
     (use-effect!
      (if ref
        (fn []
          (let [update-rect #(set-rect (.getBoundingClientRect ref))
                update-from-observer! (fn [entries]
                                        (when (some-> entries (aget 0) .-contentRect)
                                          (update-rect)))
                observer (js/ResizeObserver. update-from-observer!)]
            (update-rect)
            (.observe observer ref)
            #(.disconnect observer)))
        #())
      [ref tick])
     [set-ref rect])))
