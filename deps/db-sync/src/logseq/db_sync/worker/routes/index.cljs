(ns logseq.db-sync.worker.routes.index
  (:require [reitit.core :as r]))

(def ^:private route-data
  [["/graphs"
    ["" {:methods {"GET" :graphs/list
                   "POST" :graphs/create}}]
    ["/:graph-id"
     ["/access" {:methods {"GET" :graphs/access}}]
     ["/members" {:methods {"GET" :graph-members/list
                            "POST" :graph-members/create}}]
     ["/members/:member-id" {:methods {"PUT" :graph-members/update
                                       "DELETE" :graph-members/delete}}]
     ["" {:methods {"DELETE" :graphs/delete}}]]]

   ["/e2ee"
    ["/user-keys" {:methods {"GET" :e2ee/user-keys-get
                             "POST" :e2ee/user-keys-post}}]
    ["/user-public-key" {:methods {"GET" :e2ee/user-public-key-get}}]
    ["/graphs/:graph-id"
     ["/aes-key" {:methods {"GET" :e2ee/graph-aes-key-get
                            "POST" :e2ee/graph-aes-key-post}}]
     ["/grant-access" {:methods {"POST" :e2ee/grant-access}}]]]

   ["/sessions"
    ["" {:methods {"POST" :sessions/create}}]
    ["/:session-id"
     ["" {:methods {"GET" :sessions/get}}]
     ["/messages" {:methods {"POST" :sessions/messages}}]
     ["/pause" {:methods {"POST" :sessions/pause}}]
     ["/resume" {:methods {"POST" :sessions/resume}}]
     ["/interrupt" {:methods {"POST" :sessions/interrupt}}]
     ["/cancel" {:methods {"POST" :sessions/cancel}}]
     ["/pr" {:methods {"POST" :sessions/pr}}]
     ["/events" {:methods {"GET" :sessions/events}}]
     ["/stream" {:methods {"GET" :sessions/stream}}]]]])

(def ^:private router
  (r/router route-data))

(defn match-route [method path]
  (when-let [match (r/match-by-path router path)]
    (when-let [handler (get-in match [:data :methods method])]
      (assoc match :handler handler))))
