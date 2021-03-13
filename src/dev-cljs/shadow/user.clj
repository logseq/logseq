(ns shadow.user
  (:require [shadow.cljs.devtools.api :as api]))

(defn cljs-repl
  []
  (api/watch :app)
  (api/repl :app))

(defn electron-repl
  []
  (api/watch :electron)
  (api/repl :electron))
