(ns frontend.react-impl
  "Note: don't run component parallel"
  #?(:cljs (:require-macros [frontend.react-impl])))

#_{:component-key {:result nil
                   :watches []
                   :ident nil
                   :root-info nil
                   :f nil}}
(def react-defines (atom {}))
(def ^:dynamic *with-key* nil)
(def ^:dynamic *ident-key* nil)
(def ^:dynamic *root-info* nil)


(defn react
  [react-ref]
  (let [ident *ident-key*
        f (get-in @react-defines [ident :f])]
    (cond
      (ifn? f)
      (do (let [component (get @react-defines ident)]
            (when-not ((:watches component) react-ref)
              (let [new-component (update component :watches conj react-ref)]
                (swap! react-defines assoc *ident-key* new-component)
                (add-watch react-ref ident
                  (fn [_key _atom old-state new-state]
                    (when-not (= old-state new-state)
                      (let [root-f (get-in @react-defines [ident :root-info])]
                        (let [{:keys [f ident]} root-f]
                          (binding [*with-key* ident
                                    *root-info* root-f]
                            (let [component (get @react-defines ident)]
                              (reset! (:result component) (f))))))))))))
          @react-ref)

      ;; Sometime react is not used in component by accident, return the val.
      :else
      @react-ref)))

(defn react-fn
  [f]
  (let [{result :result :as component} (get @react-defines *ident-key*)]
    (if component
      (do (reset! result (f))
          result)
      (let [result (atom nil)]
        (binding [*root-info* (if *root-info*
                                *root-info*
                                {:f f :ident *ident-key*})]
          (let [component {:result result
                           :watches #{}
                           :ident *ident-key*
                           :root-info *root-info*
                           :f f}]
            (swap! react-defines assoc *ident-key* component))
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
                 (react-fn f#))))))

#?(:clj (defmacro with-key
          [key & body]
          `(binding [*with-key* ~key]
             ~@body)))

#?(:clj (defmacro auto-clean-state
          [& body]
          `(do (reset! react-defines {})
               (let [result# ~@body]
                 (reset! react-defines {})
                 result#))))
