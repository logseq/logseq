(ns frontend.react
  "To facilitate testing, imitate the behavior of react.
  Note: don't run component parallel"
  #?(:cljs (:require-macros [frontend.react])))

#_{:component-key {:result nil
                   :watches []
                   :root-info nil}}
(def react-components (atom {}))
(def ^:dynamic *with-key* nil)
(def ^:dynamic *comp-key* nil)
(def ^:dynamic *root-info* nil)

(defn react
  [react-ref]
  (let [comp-key *comp-key*
        component (get @react-components comp-key)]
    (cond
      (some? component)
      (do
        (when-not ((:watches component) react-ref)
          (let [new-component (update component :watches conj react-ref)]
            (swap! react-components assoc comp-key new-component)
            (add-watch react-ref comp-key
                       (fn [_key _atom old-state new-state]
                         (when-not (= old-state new-state)
                           (let [root-info (get-in @react-components [comp-key :root-info])
                                 {:keys [f comp-key]} root-info]
                             (binding [*with-key* comp-key
                                       *root-info* root-info]
                               (let [component (get @react-components comp-key)]
                                 (reset! (:result component) (f))))))))))
        @react-ref)

      ;; Sometime react is not used in component by accident, return the val.
      :else
      @react-ref)))

(defn set-comp-and-calc-result
  [f]
  (let [{result :result :as component} (get @react-components *comp-key*)]
    (if component
      (do (reset! result (f)) result)
      (let [result (atom nil)]
        (binding [*root-info* (if *root-info* *root-info* {:f f :comp-key *comp-key*})]
          (let [component {:result result
                           :watches #{}
                           :root-info *root-info*}]
            (swap! react-components assoc *comp-key* component))
          (reset! result (f))
          result)))))

#?(:clj (defmacro defc
          [sym args & body]
          `(defn ~sym ~args
             (let [f# (fn []
                        (binding [*comp-key* *with-key*
                                  ;; inner component should specify own *with-key*
                                  *with-key* nil]
                          ~@body))]
               (binding [*comp-key* *with-key*]
                 (set-comp-and-calc-result f#))))))

#?(:clj (defmacro with-key
          [key & body]
          `(binding [*with-key* ~key]
             ~@body)))
