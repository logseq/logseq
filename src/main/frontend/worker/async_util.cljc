(ns frontend.worker.async-util
  "Some cljs.core.async relate macros and fns.
  see also: https://gist.github.com/vvvvalvalval/f1250cec76d3719a8343")

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
