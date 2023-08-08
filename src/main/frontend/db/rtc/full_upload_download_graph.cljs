(ns frontend.db.rtc.full-upload-download-graph
  (:require-macros [frontend.db.rtc.macro :refer [with-sub-data-from-ws get-req-id get-result-ch]])
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
    (let [{:keys [url key all-blocks-str]}
          (with-sub-data-from-ws state
            (send (:ws state) {:req-id (get-req-id) :action "presign-put-temp-s3-obj" :graph-uuid "not-yet"})
            (let [all-blocks (export-as-blocks (state/get-current-repo))
                  all-blocks-str (transit/write (transit/writer :json) all-blocks)]
              (merge (<! (get-result-ch)) {:all-blocks-str all-blocks-str})))]
      (<! (http/put url {:body all-blocks-str}))
      (with-sub-data-from-ws state
        (send (:ws state) {:req-id (get-req-id) :action "full-upload-graph" :graph-uuid "not-yet" :s3-key key})
        (println (<! (get-result-ch)))))))


(defn- <download-graph
  [state graph-uuid]
  (go
    (let [r (with-sub-data-from-ws state
              (send (:ws state) {:req-id (get-req-id) :action "full-download-graph" :graph-uuid graph-uuid})
              (<! (get-result-ch)))]
      (prn r))))
