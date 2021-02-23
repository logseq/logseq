(ns frontend.react-impl
  "Note: don't run component parallel"
  ;;#?(:clj (:require [clojure.tools.macro :refer [name-with-attributes]]))
  #?(:cljs (:require-macros [frontend.react-impl])))

(defn name-with-attributes
  "copy: https://github.com/clojure/tools.macro/blob/master/src/main/clojure/clojure/tools/macro.clj#L282"
  [name macro-args]
  (let [[docstring macro-args] (if (string? (first macro-args))
                                 [(first macro-args) (next macro-args)]
                                 [nil macro-args])
        [attr macro-args] (if (map? (first macro-args))
                            [(first macro-args) (next macro-args)]
                            [{} macro-args])
        attr (if docstring
               (assoc attr :doc docstring)
               attr)
        attr (if (meta name)
               (conj (meta name) attr)
               attr)]
    [(with-meta name attr) macro-args]))

#_{:component-key {:result nil
                   :watches []
                   :f-path nil
                   :f nil}}
(def react-defines (atom {}))
(def ^:dynamic *f-indent* nil)
(def ^:dynamic *react-f-path* '())
(def ^:dynamic *from-watching-fn* nil)

(defn react'
  [react-ref]
  (let [ident *f-indent*
        f (get-in @react-defines [ident :f])]
    (cond
      (= true *from-watching-fn*)
      (deref react-ref)

      (ifn? f)
      (let [component (get @react-defines ident)]
        (when-not ((:watches component) react-ref)
          (let [new-component (update component :watches conj react-ref)]
            (add-watch react-ref react-ref
              (fn [_key _atom old-state new-state]
                (when-not (= old-state new-state)
                 (binding [*from-watching-fn* true]
                   (reset! (:result component) (f))
                   (let [f-path (rest (get-in @react-defines [ident :f-path]))]
                     (doseq [{:keys [f ident]} f-path]
                       (binding [*f-indent* ident]
                         (let [component (get @react-defines ident)]
                           (reset! (:result component) (f))))))))))
            (swap! react-defines assoc *f-indent* new-component)
            @react-ref)))

      :else (deref react-ref))))

(defn react-fn
  [f]
  (let [result-ref (atom nil)
        ident (keyword (gensym))]
    (binding [*f-indent* ident
              *react-f-path* (conj *react-f-path* {:f f :ident ident})]
      (swap! react-defines assoc *f-indent* {:result result-ref
                                             :watches #{}
                                             :f-path *react-f-path*
                                             :f f})
      (reset! result-ref (f))
      (deref (get-in @react-defines [ident :result])))))

#?(:clj (defmacro react
          [react-ref]
          `(react' ~react-ref)))

#?(:clj (defmacro defc
          [sym args & body]
          `(defn ~sym ~args
             (fn []
               (let [f# (fn [] ~@body)]
                 (react-fn f#))))))

#?(:clj (defmacro auto-clean-state
          [& body]
          `(do (reset! react-defines {})
               (let [result# ~@body]
                 (reset! react-defines {})
                 result#))))

(comment
  (def b (atom 1))

  (defc inner
    [c]
    (+ c (react b))))
