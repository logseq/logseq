(ns electron.handler-interface)

(defmulti handle (fn [_window args] (keyword (first args))))
