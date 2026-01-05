(ns frontend.common.async-util
  "Some cljs.core.async relate macros and fns, used in worker and frontend
   namespaces. See also: https://gist.github.com/vvvvalvalval/f1250cec76d3719a8343")

#?(:cljs
   (defn throw-err
     [v]
     (if (instance? ExceptionInfo v) (throw v) v)))

(defmacro <?
  [port]
  `(throw-err (cljs.core.async/<! ~port)))
