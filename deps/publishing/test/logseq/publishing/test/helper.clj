(ns logseq.publishing.test.helper)

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
