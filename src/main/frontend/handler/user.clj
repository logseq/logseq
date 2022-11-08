(ns frontend.handler.user)


(defmacro <wrap-ensure-id&access-token
  [& body]
  `(cljs.core.async/go
     (if-some [exp# (cljs.core.async/<! (<ensure-id&access-token))]
       exp#
       (do ~@body))))
