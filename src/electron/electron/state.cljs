(ns electron.state
  (:require [clojure.core.async :as async]))

(defonce persistent-dbs-chan (async/chan 1))
