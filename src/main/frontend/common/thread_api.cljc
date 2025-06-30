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
  e.g. (def-thread-api :thread-api/a-api [arg1 arg2] body)"
  [qualified-keyword-name params & body]
  (assert (= "thread-api" (namespace qualified-keyword-name)) qualified-keyword-name)
  (assert (vector? params) params)
  `(vswap! *thread-apis assoc
           ~qualified-keyword-name
           (fn ~(symbol (str "thread-api--" (name qualified-keyword-name))) ~params ~@body)))

#?(:cljs (def *profile (volatile! {})))

#?(:cljs
   (defn remote-function
     "Return a promise whose value is transit-str."
     [qualified-kw-str direct-pass? args-transit-str-or-args-array]
     (let [qkw (keyword qualified-kw-str)]
       (vswap! *profile update qkw inc)
       (if-let [f (@*thread-apis qkw)]
         (let [result (apply f (cond-> args-transit-str-or-args-array
                                 (not direct-pass?) ldb/read-transit-str))
               result-promise
               (if (fn? result) ;; missionary task is a fn
                 (js/Promise. result)
                 result)]
           (p/let [result' result-promise]
             (if direct-pass?
               result'
               (ldb/write-transit-str result'))))
         (throw (ex-info (str "not found thread-api: " qualified-kw-str) {}))))))
