(ns electron.rtc-handler
  (:require [electron.handler-interface :refer [handle]]
            [electron.db :as db]
            [cljs.reader :as reader]
            [logseq.db.sqlite.rtc :as sqlite-rtc]))

(defmethod handle :rtc/init [_window [_ repo]]
  (sqlite-rtc/init! (db/get-graphs-dir) repo))

(defmethod handle :rtc/add-ops [_window [_ repo data-str]]
  (let [ops (reader/read-string data-str)]
    (when (seq ops)
      (sqlite-rtc/add-ops! repo ops))))


(defmethod handle :rtc/get-ops&local-tx [_window [_ repo]]
  (sqlite-rtc/get-ops&local-tx repo))

(defmethod handle :rtc/clean-ops [_window [_ repo]]
  (sqlite-rtc/clean-ops! repo))
