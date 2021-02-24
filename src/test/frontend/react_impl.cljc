(ns frontend.react-impl
  "Note: don't run component parallel"
  ;;#?(:clj (:require [clojure.tools.macro :refer [name-with-attributes]]))
  #?(:cljs (:require-macros [frontend.react-impl])))

#_{:component-key {:result nil
                   :watches []
                   :f-path nil
                   :f nil}}
(def react-defines (atom {}))
(def ^:dynamic *f-ident* nil)
(def ^:dynamic *react-f-path* nil)
(def ^:dynamic *from-watching-fn* nil)

(defn react
  [react-ref]
  (let [ident *f-ident*
        f (get-in @react-defines [ident :f])]
    (cond
      (ifn? f)
      (do (let [component (get @react-defines ident)]
            (when-not ((:watches component) react-ref)
              (let [new-component (update component :watches conj react-ref)]
                (swap! react-defines assoc *f-ident* new-component)
                (add-watch react-ref ident
                  (fn [_key _atom old-state new-state]
                    (when-not (= old-state new-state)
                      (let [f-path (get-in @react-defines [ident :f-path])]
                        (let [{:keys [f ident]} f-path]
                          (binding [*f-ident* ident
                                    *react-f-path* f-path]
                            (let [component (get @react-defines ident)]
                              (reset! (:result component) (f))))))
                      ))))))
          @react-ref)

      ;; Sometime react is not used in component by accident, return the val.
      :else
      @react-ref)))

(defn react-fn
  [f]
  (let [{result :result :as component} (get @react-defines *f-ident*)]
    (if component
      (do (reset! result (f))
          result)
      (let [result (atom nil)]
        (binding [*react-f-path* (if *react-f-path*
                                   *react-f-path*
                                   {:f f :ident *f-ident*})]
          (swap! react-defines assoc *f-ident* {:result result
                                                :watches #{}
                                                :ident *f-ident*
                                                :f-path *react-f-path*
                                                :f f})
          (reset! result (f))
          result)))))

#?(:clj (defmacro defc
          [sym args & body]
          `(defn ~sym ~args
             (assert (some? *f-ident*) "should with-key.")
             (let [f# (fn []
                        (binding [*f-ident* *f-ident*]
                          ~@body))]
               (react-fn f#)))))

#?(:clj (defmacro with-key
          [key & body]
          `(binding [*f-ident* ~key]
             ~@body)))

#?(:clj (defmacro auto-clean-state
          [& body]
          `(do (reset! react-defines {})
               (let [result# ~@body]
                 (reset! react-defines {})
                 result#))))
