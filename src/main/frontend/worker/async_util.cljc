(ns frontend.worker.async-util
  "Some cljs.core.async relate macros and fns.
  see also: https://gist.github.com/vvvvalvalval/f1250cec76d3719a8343"
  #?(:cljs (:require [promesa.core :as p]
                     [clojure.core.async :as async])))

(defmacro go-try
  [& body]
  `(cljs.core.async/go
     (try
       ~@body
       (catch :default e#
         e#))))


#?(:cljs
   (defn throw-err
     [v]
     (if (instance? ExceptionInfo v) (throw v) v)))

(defmacro <?
  [port]
  `(throw-err (cljs.core.async/<! ~port)))

#?(:cljs
   (defn c->p
     "Converts a Core.async channel to a Promise"
     [chan]
     (let [d (p/deferred)]
       (if chan
         (async/go
           (let [result (async/<! chan)]
             (if (instance? ExceptionInfo result)
               (p/reject! d result)
               (p/resolve! d result))))
         (p/resolve! d nil))
       d)))
