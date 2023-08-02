(ns frontend.db.rtc.core
  (:require [datascript.core :as d]
            [frontend.db.conn :as conn]
            [frontend.util :as util]
            [frontend.config :as config]
            [cljs.core.async :as async :refer [<! >! chan go go-loop offer!
                                               poll! timeout]]
            [electron.ipc :as ipc]))

(def ws-addr config/RTC-WS-URL)

(defn export-as-blocks
  [repo]
  (let [db (conn/get-db repo)
        datoms (d/datoms db :eavt)]
    (->> datoms
         (partition-by :e)
         (keep (fn [datoms]
                 (when (seq datoms)
                   (reduce
                    (fn [r datom] (assoc r (:a datom) (:v datom)))
                    {:db/id (:e (first datoms))}
                    datoms)))))))

(def data-from-ws-chan (chan 1000))

(defn ws-listen!
  [graph-uuid *ws data-from-ws-chan]
  (reset! *ws {:ws (js/WebSocket. (util/format ws-addr graph-uuid)) :stop false})
  (set! (.-onmessage (:ws @*ws)) (fn [e]
                                   (let [data (js->clj (js/JSON.parse (.-data e)) :keywordize-keys true)]
                                     (>! data-from-ws-chan data))))

  (set! (.-onclose (:ws @*ws)) (fn [_e] (println :ws-stopped))))


(defn init-rtc-op-db
  [repo]
  (when (config/db-based-graph? repo)
    (ipc/ipc :rtc/init repo)))
