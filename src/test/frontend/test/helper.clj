(ns frontend.test.helper)

(defmacro with-config
  [config & body]
  `(let [repo# (frontend.state/get-current-repo)]
     (frontend.state/set-config! repo# ~config)
     ~@body
     (frontend.state/set-config! repo# nil)))

;; Copied from https://github.com/babashka/nbb/blob/e5d84b0fac59774f5d7a4a9e807240cce04bf252/test/nbb/test_macros.clj
(defmacro deftest-async
  "A wrapper around deftest that handles async and done in all cases.
  Importantly, it prevents unexpected failures in an async test from abruptly
  ending a test suite"
  [name opts & body]
  (let [[opts body]
        (if (map? opts)
          [opts body]
          [nil (cons opts body)])]
    `(cljs.test/deftest ~name
       ~@(when-let [pre (:before opts)]
           [pre])
       (cljs.test/async
        ~'done
        (-> (do ~@body)
            (.catch (fn [err#]
                      (cljs.test/is (= 1 0) (str err# (.-stack err#)))))
            (.finally
             (fn []
               ~@(when-let [post (:after opts)]
                   [post])
               (~'done))))))))

;; Copied from https://clojurians.slack.com/archives/C03S1L9DN/p1631221014001900?thread_ts=1631219838.001500&cid=C03S1L9DN
(defmacro with-reset
  "Like cljs.core/with-redefs, but bindings persist until the `reset` fn is
 called, allowing bindings to be used in async contexts."
  [reset bindings & body]
  ;; code adapted from https://cljs.github.io/api/cljs.core/with-redefs
  (let [names (take-nth 2 bindings)
        vals (take-nth 2 (drop 1 bindings))
        orig-val-syms (map (comp gensym #(str % "-orig-val__") name) names)
        temp-val-syms (map (comp gensym #(str % "-temp-val__") name) names)
        binds (map vector names temp-val-syms)
        redefs (reverse (map vector names orig-val-syms))
        bind-value (fn [[k v]] (list 'set! k v))]
    `(let [~@(interleave orig-val-syms names)
           ~@(interleave temp-val-syms vals)
           ~reset #(do ~@(map bind-value redefs))]
       ~@(map bind-value binds)
       ~@body)))
