(ns frontend.db.rtc.full-upload-download-graph
  (:require [frontend.db.conn :as conn]
            [datascript.core :as d]
            [frontend.db.rtc.ws :refer [send]]
            [frontend.state :as state]
            [cljs.core.async :as async :refer [chan go <!]]
            [cljs-http.client :as http]
            [cognitect.transit :as transit]))


(defn- export-as-blocks
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

(defn- <upload-graph
  [state]
  (go
    (let [req-id (str (random-uuid))
          ch (chan 1)
          data-from-ws-pub (:data-from-ws-pub state)]
      (async/sub data-from-ws-pub req-id ch)
      (send (:ws state) {:req-id req-id :action "presign-put-temp-s3-obj" :graph-uuid "not-yet"})
      (let [all-blocks (export-as-blocks (state/get-current-repo))
            all-blocks-str (transit/write (transit/writer :json) all-blocks)
            {:keys [url key]} (<! ch)]
        (async/unsub data-from-ws-pub req-id ch)
        (<! (http/put url {:body all-blocks-str}))
        (let [req-id2 (str (random-uuid))
              ch2 (chan 1)]
          (async/sub data-from-ws-pub req-id2 ch2)
          (send (:ws state) {:req-id req-id2 :action "full-upload-graph" :graph-uuid "not-yet" :s3-key key})
          (println (<! ch2))
          (async/unsub data-from-ws-pub req-id2 ch2))))))
