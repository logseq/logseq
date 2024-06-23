(ns frontend.components.rtc.flows
  (:require [frontend.state :as state]
            [missionary.core :as m]
            [cljs-time.core :as t]))

(def rtc-log-flow
  (m/watch (:rtc/log @state/state)))

(def rtc-download-log-flow
  (m/eduction
   (filter #(= :rtc.log/download (:type %)))
   rtc-log-flow))

(def rtc-upload-log-flow
  (m/eduction
   (filter #(= :rtc.log/upload (:type %)))
   rtc-log-flow))

(def rtc-misc-log-flow
  (m/eduction
   (remove #(contains? #{:rtc.log/download :rtc.log/upload} (:type %)))
   rtc-log-flow))

(def rtc-state-flow
  (m/watch (:rtc/state @state/state)))

(defn create-rtc-recent-updates-flow
  "Keep recent-updates for N minutes.
  graph-uuid->user-uuid->[instant {:keys [update-block-uuids :delete-block-uuids]}]"
  [minutes]
  (let [*buffer (atom {})]
    (m/ap
      (let [latest-updates (m/?> (m/watch (:rtc/recent-updates @state/state)))]
        (when-let [graph-uuid (first (keys latest-updates))]
          (let [mins-ago (t/minus (t/now) (t/minutes minutes))
                latest-keys (map (fn [[user-uuid _]] user-uuid) (get latest-updates graph-uuid))
                new-map
                {graph-uuid
                 (into {}
                       (map (fn [k]
                              [k
                               (take-while
                                (fn [[inst _]] (> inst mins-ago))
                                (concat (get-in latest-updates [graph-uuid k])
                                        (get-in @*buffer [graph-uuid k])))]))
                       latest-keys)}]
            (prn :debug new-map latest-updates)
            (swap! *buffer merge new-map)
            @*buffer))))))
