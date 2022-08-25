(ns frontend.test.helper)

(defmacro with-config
  [config & body]
  `(let [repo# (frontend.state/get-current-repo)]
     (frontend.state/set-config! repo# ~config)
     ~@body
     (frontend.state/set-config! repo# nil)))
