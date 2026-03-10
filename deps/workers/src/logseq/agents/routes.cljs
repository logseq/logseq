(ns logseq.agents.routes
  (:require [reitit.core :as r]))

(def ^:private route-data
  [["/auth"
    ["/chatgpt/import" {:methods {"POST" :auth.chatgpt/import}}]
    ["/chatgpt/status" {:methods {"GET" :auth.chatgpt/status}}]]
   ["/planning"
    ["/sessions" {:methods {"POST" :planning.sessions/create}}]
    ["/sessions/:planning-session-id" {:methods {"GET" :planning.sessions/get}}]
    ["/sessions/:planning-session-id/approval" {:methods {"POST" :planning.sessions/approval}}]
    ["/sessions/:planning-session-id/tasks/sync" {:methods {"POST" :planning.sessions/tasks.sync}}]
    ["/sessions/:planning-session-id/replan" {:methods {"POST" :planning.sessions/replan}}]
    ["/chat/:planning-session-id" {:methods {"GET" :planning.chat/transport
                                             "POST" :planning.chat/transport}}]
    ["/workflows" {:methods {"POST" :planning.workflows/create}}]
    ["/workflows/:workflow-id" {:methods {"GET" :planning.workflows/get}}]]
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
     ["/snapshot" {:methods {"POST" :sessions/snapshot}}]
     ["/events" {:methods {"GET" :sessions/events}}]
     ["/branches" {:methods {"GET" :sessions/branches}}]
     ["/terminal" {:methods {"GET" :sessions/terminal}}]
     ["/stream" {:methods {"GET" :sessions/stream}}]]]
   ["/runners"
    ["" {:methods {"GET" :runners/list
                   "POST" :runners/register}}]
    ["/:runner-id"
     ["" {:methods {"GET" :runners/get}}]
     ["/heartbeat" {:methods {"POST" :runners/heartbeat}}]]]])

(def ^:private router
  (r/router route-data))

(defn match-route [method path]
  (when-let [match (r/match-by-path router path)]
    (when-let [handler (get-in match [:data :methods method])]
      (assoc match :handler handler))))
