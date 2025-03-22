(ns frontend.common.thread-api
  "Macro for defining thread apis, which is invokeable by other threads"
  #?(:cljs (:require-macros [frontend.common.thread-api]))
  #?(:cljs (:require [logseq.db :as ldb]
                     [promesa.core :as p])))

#?(:cljs
   (def *thread-apis (volatile! {})))

#_:clj-kondo/ignore
(defmacro defkeyword [& _args])

(defmacro def-thread-api
  "Define a api invokeable by other threads.
e.g. (def-thread-api :rtc/a-api [arg1 arg2] body)"
  [qualified-keyword-name params & body]
  (assert (qualified-keyword? qualified-keyword-name) qualified-keyword-name)
  (assert (vector? params) params)
  `(vswap! *thread-apis assoc
           ~qualified-keyword-name
           (fn ~params ~@body)))

#?(:cljs
   (defn remote-function
     "Return a promise whose value is transit-str."
     [qualified-kw-str args-transit-str]
     (let [qkw (keyword qualified-kw-str)]
       (if-let [f (@*thread-apis qkw)]
         (let [result (apply f (ldb/read-transit-str args-transit-str))
               result-promise
               (if (fn? result) ;; missionary task is a fn
                 (js/Promise. result)
                 result)]
           (p/chain
            result-promise
            ldb/write-transit-str))
         (throw (ex-info (str "not found thread-api: " qualified-kw-str) {}))))))
