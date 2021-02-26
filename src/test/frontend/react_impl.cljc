(ns frontend.react-impl
  "Note: don't run component parallel"
  #?(:cljs (:require-macros [frontend.react-impl])))

#_{:component-key {:result nil
                   :watches []
                   :ident nil
                   :root-info nil
                   :f nil}}
(def react-components (atom {}))
(def ^:dynamic *with-key* nil)
(def ^:dynamic *ident-key* nil)
(def ^:dynamic *root-info* nil)


(defn react
  [react-ref]
  (let [ident *ident-key*
        component (get @react-components ident)]
    (cond
      (some? component)
      (do
        (when-not ((:watches component) react-ref)
          (let [new-component (update component :watches conj react-ref)]
            (swap! react-components assoc *ident-key* new-component)
            (add-watch react-ref ident
              (fn [_key _atom old-state new-state]
                (when-not (= old-state new-state)
                  (let [root-info (get-in @react-components [ident :root-info])]
                    (let [{:keys [f ident]} root-info]
                      (binding [*with-key* ident
                                *root-info* root-info]
                        (let [component (get @react-components ident)]
                          (reset! (:result component) (f)))))))))))
        @react-ref)

      ;; Sometime react is not used in component by accident, return the val.
      :else
      @react-ref)))

(defn set-comp-and-calc-result
  [f]
  (let [{result :result :as component} (get @react-components *ident-key*)]
    (if component
      (do (reset! result (f)) result)
      (let [result (atom nil)]
        (binding [*root-info* (if *root-info* *root-info* {:f f :ident *ident-key*})]
          (let [component {:result result
                           :watches #{}
                           :ident *ident-key*
                           :root-info *root-info*}]
            (swap! react-components assoc *ident-key* component))
          (reset! result (f))
          result)))))

#?(:clj (defmacro defc
          [sym args & body]
          `(defn ~sym ~args
             (assert (some? *with-key*)
               "should specify component key by frontend.react-impl/with-key.")
             (let [f# (fn []
                        (binding [*ident-key* *with-key*
                                  ;; inner component should specify own *with-key*
                                  *with-key* nil]
                          ~@body))]
               (binding [*ident-key* *with-key*]
                 (set-comp-and-calc-result f#))))))

#?(:clj (defmacro with-key
          [key & body]
          `(binding [*with-key* ~key]
             ~@body)))

#?(:clj (defmacro auto-clean-state
          [& body]
          `(do (reset! react-components {})
               (let [result# ~@body]
                 (reset! react-components {})
                 result#))))
