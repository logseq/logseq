(ns frontend.async-util)

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
