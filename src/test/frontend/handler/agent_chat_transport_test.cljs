(ns frontend.handler.agent-chat-transport-test
  (:require [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [frontend.handler.agent-chat-transport :as agent-chat-transport]
            [promesa.core :as p]))

(defn- sse-response
  [events]
  (let [body (->> events
                  (map (fn [event]
                         (str "data: " (js/JSON.stringify (clj->js event)) "\n\n")))
                  (apply str))]
    (js/Response.
     body
     #js {:status 200
          :headers #js {"content-type" "text/event-stream"}})))

(defn- <read-all-chunks
  [stream]
  (let [reader (.getReader stream)]
    (p/loop [acc []]
      (p/let [result (.read reader)]
        (if (.-done result)
          acc
          (p/recur (conj acc (js->clj (.-value result) :keywordize-keys true))))))))

(deftest send-messages-streams-deltas-and-ignores-backlog-test
  (async done
         (let [calls (atom [])
               fetch-fn (fn [url init]
                          (let [method (or (aget init "method") "GET")
                                body (aget init "body")]
                            (swap! calls conj {:url url
                                               :method method
                                               :body body})
                            (cond
                              (and (= "POST" method)
                                   (= "http://db-sync.local/sessions/sess-1/messages" url))
                              (js/Promise.resolve
                               (js/Response.
                                (js/JSON.stringify #js {:ok true})
                                #js {:status 200
                                     :headers #js {"content-type" "application/json"}}))

                              (and (= "GET" method)
                                   (= "http://db-sync.local/sessions/sess-1/stream" url))
                              (js/Promise.resolve
                               (sse-response
                                [{:type "item.delta"
                                  :ts 900
                                  :data {:delta "old-backlog"
                                         :item_id "item-1"}}
                                 {:type "item.delta"
                                  :ts 1100
                                  :data {:delta "new-delta"
                                         :item_id "item-2"}}
                                 {:type "item.completed"
                                  :ts 1200
                                  :data {:item_id "item-2"
                                         :item {:kind "message"
                                                :content [{:type "text"
                                                           :text "new-delta"}]}}}]))

                              :else
                              (js/Promise.resolve
                               (js/Response.
                                (js/JSON.stringify #js {:error "unexpected request"})
                                #js {:status 500
                                     :headers #js {"content-type" "application/json"}})))))
               transport (agent-chat-transport/make-transport
                          {:base "http://db-sync.local"
                           :session-id "sess-1"
                           :fetch-fn fetch-fn
                           :now-fn (fn [] 1000)
                           :idle-timeout-ms 100})]
           (-> (.sendMessages transport
                              #js {:chatId "sess-1"
                                   :trigger "submit-message"
                                   :messageId nil
                                   :messages #js [#js {:id "user-1"
                                                       :role "user"
                                                       :parts #js [#js {:type "text"
                                                                        :text "hello from ui"}]}]})
               (.then <read-all-chunks)
               (.then (fn [chunks]
                        (let [types (mapv :type chunks)]
                          (is (= ["start"
                                  "start-step"
                                  "text-start"
                                  "text-delta"
                                  "text-end"
                                  "finish-step"
                                  "finish"]
                                 types))
                          (is (= "new-delta" (:delta (nth chunks 3))))
                          (is (not-any? #(= "old-backlog" (:delta %)) chunks))
                          (is (= 2 (count @calls)))
                          (is (string/includes? (or (:body (first @calls)) "")
                                                "\"message\":\"hello from ui\""))
                          (done))))
               (.catch (fn [error]
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest send-messages-emits-error-chunk-on-runtime-error-test
  (async done
         (let [fetch-fn (fn [url init]
                          (let [method (or (aget init "method") "GET")]
                            (cond
                              (and (= "POST" method)
                                   (= "http://db-sync.local/sessions/sess-1/messages" url))
                              (js/Promise.resolve
                               (js/Response.
                                (js/JSON.stringify #js {:ok true})
                                #js {:status 200
                                     :headers #js {"content-type" "application/json"}}))

                              (and (= "GET" method)
                                   (= "http://db-sync.local/sessions/sess-1/stream" url))
                              (js/Promise.resolve
                               (sse-response
                                [{:type "agent.runtime.error"
                                  :ts 1100
                                  :data {:message "runtime exploded"}}]))

                              :else
                              (js/Promise.resolve
                               (js/Response.
                                (js/JSON.stringify #js {:error "unexpected request"})
                                #js {:status 500
                                     :headers #js {"content-type" "application/json"}})))))
               transport (agent-chat-transport/make-transport
                          {:base "http://db-sync.local"
                           :session-id "sess-1"
                           :fetch-fn fetch-fn
                           :now-fn (fn [] 1000)
                           :idle-timeout-ms 100})]
           (-> (.sendMessages transport
                              #js {:chatId "sess-1"
                                   :trigger "submit-message"
                                   :messageId nil
                                   :messages #js [#js {:id "user-1"
                                                       :role "user"
                                                       :parts #js [#js {:type "text"
                                                                        :text "hello from ui"}]}]})
               (.then <read-all-chunks)
               (.then (fn [chunks]
                        (is (some #(= "error" (:type %)) chunks))
                        (is (some #(string/includes? (or (:errorText %) "")
                                                     "runtime exploded")
                                  chunks))
                        (is (= "finish" (:type (last chunks))))
                        (done)))
               (.catch (fn [error]
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest send-messages-emits-text-delta-for-turn-completed-status-error-test
  (async done
         (let [fetch-fn (fn [url init]
                          (let [method (or (aget init "method") "GET")]
                            (cond
                              (and (= "POST" method)
                                   (= "http://db-sync.local/sessions/sess-1/messages" url))
                              (js/Promise.resolve
                               (js/Response.
                                (js/JSON.stringify #js {:ok true})
                                #js {:status 200
                                     :headers #js {"content-type" "application/json"}}))

                              (and (= "GET" method)
                                   (= "http://db-sync.local/sessions/sess-1/stream" url))
                              (js/Promise.resolve
                               (sse-response
                                [{:type "item.completed"
                                  :ts 1100
                                  :data {:item_id "itm-9"
                                         :item {:item_id "itm-9"
                                                :kind "status"
                                                :role "system"
                                                :content [{:type "status"
                                                           :label "turn.completed"
                                                           :detail "{\"error\":{\"codexErrorInfo\":\"unauthorized\",\"message\":\"Your access token could not be refreshed because your refresh token was already used. Please log out and sign in again.\"},\"status\":\"failed\"}"}]}}}
                                 {:type "response.completed"
                                  :ts 1200
                                  :data {:item_id "itm-9"}}]))

                              :else
                              (js/Promise.resolve
                               (js/Response.
                                (js/JSON.stringify #js {:error "unexpected request"})
                                #js {:status 500
                                     :headers #js {"content-type" "application/json"}})))))
               transport (agent-chat-transport/make-transport
                          {:base "http://db-sync.local"
                           :session-id "sess-1"
                           :fetch-fn fetch-fn
                           :now-fn (fn [] 1000)
                           :idle-timeout-ms 100})]
           (-> (.sendMessages transport
                              #js {:chatId "sess-1"
                                   :trigger "submit-message"
                                   :messageId nil
                                   :messages #js [#js {:id "user-1"
                                                       :role "user"
                                                       :parts #js [#js {:type "text"
                                                                        :text "hello"}]}]})
               (.then <read-all-chunks)
               (.then (fn [chunks]
                        (let [delta (some #(when (= "text-delta" (:type %)) %) chunks)
                              types (mapv :type chunks)]
                          (is (some #{"start"} types))
                          (is (some #{"text-start"} types))
                          (is (= "Your access token could not be refreshed because your refresh token was already used. Please log out and sign in again."
                                 (:delta delta)))
                          (is (= "finish" (:type (last chunks))))
                          (done))))
               (.catch (fn [error]
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest send-messages-rejects-empty-user-message-test
  (async done
         (let [call-count (atom 0)
               fetch-fn (fn [_url _init]
                          (swap! call-count inc)
                          (js/Promise.resolve
                           (js/Response.
                            (js/JSON.stringify #js {:ok true})
                            #js {:status 200
                                 :headers #js {"content-type" "application/json"}})))
               transport (agent-chat-transport/make-transport
                          {:base "http://db-sync.local"
                           :session-id "sess-1"
                           :fetch-fn fetch-fn})]
           (-> (.sendMessages transport
                              #js {:chatId "sess-1"
                                   :trigger "submit-message"
                                   :messageId nil
                                   :messages #js [#js {:id "user-1"
                                                       :role "user"
                                                       :parts #js [#js {:type "text"
                                                                        :text "   "}]}]})
               (.then (fn [_]
                        (is false "expected sendMessages to reject empty input")
                        (done)))
               (.catch (fn [_error]
                         (is (= 0 @call-count))
                         (done)))))))

(deftest reconnect-to-stream-returns-nil-test
  (async done
         (let [transport (agent-chat-transport/make-transport
                          {:base "http://db-sync.local"
                           :session-id "sess-1"})]
           (-> (.reconnectToStream transport #js {:chatId "sess-1"})
               (.then (fn [result]
                        (is (nil? result))
                        (done)))
               (.catch (fn [error]
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest send-messages-streams-reasoning-parts-without-empty-text-part-test
  (async done
         (let [fetch-fn (fn [url init]
                          (let [method (or (aget init "method") "GET")]
                            (cond
                              (and (= "POST" method)
                                   (= "http://db-sync.local/sessions/sess-1/messages" url))
                              (js/Promise.resolve
                               (js/Response.
                                (js/JSON.stringify #js {:ok true})
                                #js {:status 200
                                     :headers #js {"content-type" "application/json"}}))

                              (and (= "GET" method)
                                   (= "http://db-sync.local/sessions/sess-1/stream" url))
                              (js/Promise.resolve
                               (sse-response
                                [{:type "item.completed"
                                  :ts 1100
                                  :data {:item_id "itm-r1"
                                         :item {:kind "reasoning"
                                                :text "thought here"}}}]))

                              :else
                              (js/Promise.resolve
                               (js/Response.
                                (js/JSON.stringify #js {:error "unexpected request"})
                                #js {:status 500
                                     :headers #js {"content-type" "application/json"}})))))
               transport (agent-chat-transport/make-transport
                          {:base "http://db-sync.local"
                           :session-id "sess-1"
                           :fetch-fn fetch-fn
                           :now-fn (fn [] 1000)
                           :idle-timeout-ms 100})]
           (-> (.sendMessages transport
                              #js {:chatId "sess-1"
                                   :trigger "submit-message"
                                   :messageId nil
                                   :messages #js [#js {:id "user-1"
                                                       :role "user"
                                                       :parts #js [#js {:type "text"
                                                                        :text "hello"}]}]})
               (.then <read-all-chunks)
               (.then (fn [chunks]
                        (let [types (mapv :type chunks)]
                          (is (= ["start"
                                  "start-step"
                                  "reasoning-start"
                                  "reasoning-delta"
                                  "reasoning-end"
                                  "finish-step"
                                  "finish"]
                                 types))
                          (is (= "thought here"
                                 (:delta (some #(when (= "reasoning-delta" (:type %)) %) chunks))))
                          (is (not-any? #(contains? #{"text-start" "text-delta" "text-end"} (:type %))
                                        chunks))
                          (done))))
               (.catch (fn [error]
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest send-messages-streams-tool-and-reasoning-from-item-content-parts-test
  (async done
         (let [fetch-fn (fn [url init]
                          (let [method (or (aget init "method") "GET")]
                            (cond
                              (and (= "POST" method)
                                   (= "http://db-sync.local/sessions/sess-1/messages" url))
                              (js/Promise.resolve
                               (js/Response.
                                (js/JSON.stringify #js {:ok true})
                                #js {:status 200
                                     :headers #js {"content-type" "application/json"}}))

                              (and (= "GET" method)
                                   (= "http://db-sync.local/sessions/sess-1/stream" url))
                              (js/Promise.resolve
                               (sse-response
                                [{:type "item.completed"
                                  :ts 1100
                                  :data {:item_id "itm-2"
                                         :item {:kind "message"
                                                :content [{:type "reasoning"
                                                           :text "inspect repo"}
                                                          {:type "tool_call"
                                                           :tool_call_id "call-1"
                                                           :tool_name "bash"
                                                           :arguments "{\"cmd\":\"ls\"}"}
                                                          {:type "tool_result"
                                                           :tool_call_id "call-1"
                                                           :output {:stdout "ok"}}
                                                          {:type "text"
                                                           :text "Done."}]}}}]))

                              :else
                              (js/Promise.resolve
                               (js/Response.
                                (js/JSON.stringify #js {:error "unexpected request"})
                                #js {:status 500
                                     :headers #js {"content-type" "application/json"}})))))
               transport (agent-chat-transport/make-transport
                          {:base "http://db-sync.local"
                           :session-id "sess-1"
                           :fetch-fn fetch-fn
                           :now-fn (fn [] 1000)
                           :idle-timeout-ms 100})]
           (-> (.sendMessages transport
                              #js {:chatId "sess-1"
                                   :trigger "submit-message"
                                   :messageId nil
                                   :messages #js [#js {:id "user-1"
                                                       :role "user"
                                                       :parts #js [#js {:type "text"
                                                                        :text "hello"}]}]})
               (.then <read-all-chunks)
               (.then (fn [chunks]
                        (let [types (mapv :type chunks)
                              tool-input (some #(when (= "tool-input-available" (:type %)) %) chunks)
                              tool-output (some #(when (= "tool-output-available" (:type %)) %) chunks)]
                          (is (some #{"reasoning-start"} types))
                          (is (some #{"reasoning-delta"} types))
                          (is (some #{"reasoning-end"} types))
                          (is (some #{"tool-input-available"} types))
                          (is (some #{"tool-output-available"} types))
                          (is (= "call-1" (:toolCallId tool-input)))
                          (is (= "bash" (:toolName tool-input)))
                          (is (= "call-1" (:toolCallId tool-output)))
                          (is (= "Done."
                                 (:delta (some #(when (= "text-delta" (:type %)) %) chunks))))
                          (done))))
               (.catch (fn [error]
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest send-messages-streams-reasoning-delta-events-test
  (async done
         (let [fetch-fn (fn [url init]
                          (let [method (or (aget init "method") "GET")]
                            (cond
                              (and (= "POST" method)
                                   (= "http://db-sync.local/sessions/sess-1/messages" url))
                              (js/Promise.resolve
                               (js/Response.
                                (js/JSON.stringify #js {:ok true})
                                #js {:status 200
                                     :headers #js {"content-type" "application/json"}}))

                              (and (= "GET" method)
                                   (= "http://db-sync.local/sessions/sess-1/stream" url))
                              (js/Promise.resolve
                               (sse-response
                                [{:type "item.delta"
                                  :ts 1100
                                  :data {:item_id "itm-r2"
                                         :item {:kind "reasoning"}
                                         :delta "step one"}}
                                 {:type "item.completed"
                                  :ts 1200
                                  :data {:item_id "itm-r2"
                                         :item {:kind "reasoning"}}}]))

                              :else
                              (js/Promise.resolve
                               (js/Response.
                                (js/JSON.stringify #js {:error "unexpected request"})
                                #js {:status 500
                                     :headers #js {"content-type" "application/json"}})))))
               transport (agent-chat-transport/make-transport
                          {:base "http://db-sync.local"
                           :session-id "sess-1"
                           :fetch-fn fetch-fn
                           :now-fn (fn [] 1000)
                           :idle-timeout-ms 100})]
           (-> (.sendMessages transport
                              #js {:chatId "sess-1"
                                   :trigger "submit-message"
                                   :messageId nil
                                   :messages #js [#js {:id "user-1"
                                                       :role "user"
                                                       :parts #js [#js {:type "text"
                                                                        :text "hello"}]}]})
               (.then <read-all-chunks)
               (.then (fn [chunks]
                        (let [types (mapv :type chunks)]
                          (is (some #{"reasoning-start"} types))
                          (is (= "step one"
                                 (:delta (some #(when (= "reasoning-delta" (:type %)) %) chunks))))
                          (is (some #{"reasoning-end"} types))
                          (done))))
               (.catch (fn [error]
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest send-messages-streams-tool-result-start-and-delta-events-test
  (async done
         (let [fetch-fn (fn [url init]
                          (let [method (or (aget init "method") "GET")]
                            (cond
                              (and (= "POST" method)
                                   (= "http://db-sync.local/sessions/sess-1/messages" url))
                              (js/Promise.resolve
                               (js/Response.
                                (js/JSON.stringify #js {:ok true})
                                #js {:status 200
                                     :headers #js {"content-type" "application/json"}}))

                              (and (= "GET" method)
                                   (= "http://db-sync.local/sessions/sess-1/stream" url))
                              (js/Promise.resolve
                               (sse-response
                                [{:type "item.started"
                                  :ts 1100
                                  :data {:item_id "itm-6"
                                         :native_item_id "call_BAmVsnQdKewfsophB4x7PTLI"
                                         :item {:item_id "itm-6"
                                                :native_item_id "call_BAmVsnQdKewfsophB4x7PTLI"
                                                :kind "tool_result"
                                                :content [{:type "json"
                                                           :json {:command "/bin/bash -lc ls"
                                                                  :cwd "/workspace"
                                                                  :status "InProgress"}}]}}}
                                 {:type "item.delta"
                                  :ts 1110
                                  :data {:item_id "itm-6"
                                         :native_item_id "call_BAmVsnQdKewfsophB4x7PTLI"
                                         :delta "AGENTS.md\n"}}
                                 {:type "response.completed"
                                  :ts 1200
                                  :data {:item_id "itm-6"}}]))

                              :else
                              (js/Promise.resolve
                               (js/Response.
                                (js/JSON.stringify #js {:error "unexpected request"})
                                #js {:status 500
                                     :headers #js {"content-type" "application/json"}})))))
               transport (agent-chat-transport/make-transport
                          {:base "http://db-sync.local"
                           :session-id "sess-1"
                           :fetch-fn fetch-fn
                           :now-fn (fn [] 1000)
                           :idle-timeout-ms 100})]
           (-> (.sendMessages transport
                              #js {:chatId "sess-1"
                                   :trigger "submit-message"
                                   :messageId nil
                                   :messages #js [#js {:id "user-1"
                                                       :role "user"
                                                       :parts #js [#js {:type "text"
                                                                        :text "hello"}]}]})
               (.then <read-all-chunks)
               (.then (fn [chunks]
                        (let [types (mapv :type chunks)
                              tool-input (some #(when (= "tool-input-available" (:type %)) %) chunks)
                              tool-output (last (filter #(= "tool-output-available" (:type %)) chunks))]
                          (is (some #{"tool-input-available"} types))
                          (is (some #{"tool-output-available"} types))
                          (is (= "call_BAmVsnQdKewfsophB4x7PTLI" (:toolCallId tool-input)))
                          (is (= "call_BAmVsnQdKewfsophB4x7PTLI" (:toolCallId tool-output)))
                          (is (string/includes? (or (:output tool-output) "") "AGENTS.md"))
                          (is (not-any? #(= "text-delta" (:type %)) chunks))
                          (done))))
               (.catch (fn [error]
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest ^:large-vars/cleanup-todo send-messages-supports-nested-agent-event-envelope-test
  (async done
         (let [fetch-fn (fn [url init]
                          (let [method (or (aget init "method") "GET")]
                            (cond
                              (and (= "POST" method)
                                   (= "http://db-sync.local/sessions/sess-1/messages" url))
                              (js/Promise.resolve
                               (js/Response.
                                (js/JSON.stringify #js {:ok true})
                                #js {:status 200
                                     :headers #js {"content-type" "application/json"}}))

                              (and (= "GET" method)
                                   (= "http://db-sync.local/sessions/sess-1/stream" url))
                              (js/Promise.resolve
                               (sse-response
                                [{:event-id "evt_15"
                                  :session-id "sess-1"
                                  :type "item.completed"
                                  :ts 1100
                                  :data {:raw nil
                                         :type "item.completed"
                                         :data {:item {:item_id "itm_3"
                                                       :native_item_id "rs_1"
                                                       :kind "message"
                                                       :role "assistant"
                                                       :content [{:type "reasoning"
                                                                  :text "**Inspecting repo structure**"}]
                                                       :status "completed"}}}}
                                 {:event-id "evt_18"
                                  :session-id "sess-1"
                                  :type "item.started"
                                  :ts 1110
                                  :data {:raw nil
                                         :type "item.started"
                                         :data {:item {:item_id "itm_6"
                                                       :native_item_id "call_BAmVsnQdKewfsophB4x7PTLI"
                                                       :kind "tool_result"
                                                       :role "tool"
                                                       :content [{:type "json"
                                                                  :json {:command "/bin/bash -lc ls"
                                                                         :cwd "/workspace/69872e10-e2b7-4f59-9445-aadb259befd1"
                                                                         :status "InProgress"}}]
                                                       :status "in_progress"}}}}
                                 {:event-id "evt_19"
                                  :session-id "sess-1"
                                  :type "item.delta"
                                  :ts 1120
                                  :data {:raw nil
                                         :type "item.delta"
                                         :data {:item_id "itm_6"
                                                :native_item_id "call_BAmVsnQdKewfsophB4x7PTLI"
                                                :delta "AGENTS.md\n"}}}
                                 {:event-id "evt_20"
                                  :session-id "sess-1"
                                  :type "response.completed"
                                  :ts 1200
                                  :data {:raw nil
                                         :type "response.completed"
                                         :data {:item_id "itm_6"}}}]))

                              :else
                              (js/Promise.resolve
                               (js/Response.
                                (js/JSON.stringify #js {:error "unexpected request"})
                                #js {:status 500
                                     :headers #js {"content-type" "application/json"}})))))
               transport (agent-chat-transport/make-transport
                          {:base "http://db-sync.local"
                           :session-id "sess-1"
                           :fetch-fn fetch-fn
                           :now-fn (fn [] 1000)
                           :idle-timeout-ms 100})]
           (-> (.sendMessages transport
                              #js {:chatId "sess-1"
                                   :trigger "submit-message"
                                   :messageId nil
                                   :messages #js [#js {:id "user-1"
                                                       :role "user"
                                                       :parts #js [#js {:type "text"
                                                                        :text "hello"}]}]})
               (.then <read-all-chunks)
               (.then (fn [chunks]
                        (let [types (mapv :type chunks)
                              tool-input (some #(when (= "tool-input-available" (:type %)) %) chunks)
                              tool-output (last (filter #(= "tool-output-available" (:type %)) chunks))
                              reasoning-delta (some #(when (= "reasoning-delta" (:type %)) %) chunks)]
                          (is (some #{"reasoning-start"} types))
                          (is (= "**Inspecting repo structure**" (:delta reasoning-delta)))
                          (is (some #{"reasoning-end"} types))
                          (is (some #{"tool-input-available"} types))
                          (is (some #{"tool-output-available"} types))
                          (is (= "call_BAmVsnQdKewfsophB4x7PTLI" (:toolCallId tool-input)))
                          (is (= "call_BAmVsnQdKewfsophB4x7PTLI" (:toolCallId tool-output)))
                          (is (string/includes? (or (:output tool-output) "") "AGENTS.md"))
                          (is (not-any? #(= "text-delta" (:type %)) chunks))
                          (done))))
               (.catch (fn [error]
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest send-messages-skips-stream-request-when-open-stream-disabled-test
  (async done
         (let [calls (atom [])
               fetch-fn (fn [url init]
                          (let [method (or (aget init "method") "GET")
                                body (aget init "body")]
                            (swap! calls conj {:url url
                                               :method method
                                               :body body})
                            (cond
                              (and (= "POST" method)
                                   (= "http://db-sync.local/sessions/sess-1/messages" url))
                              (js/Promise.resolve
                               (js/Response.
                                (js/JSON.stringify #js {:ok true})
                                #js {:status 200
                                     :headers #js {"content-type" "application/json"}}))

                              (and (= "GET" method)
                                   (= "http://db-sync.local/sessions/sess-1/stream" url))
                              (js/Promise.resolve
                               (js/Response.
                                (js/JSON.stringify #js {:error "unexpected stream request"})
                                #js {:status 500
                                     :headers #js {"content-type" "application/json"}}))

                              :else
                              (js/Promise.resolve
                               (js/Response.
                                (js/JSON.stringify #js {:error "unexpected request"})
                                #js {:status 500
                                     :headers #js {"content-type" "application/json"}})))))
               transport (agent-chat-transport/make-transport
                          {:base "http://db-sync.local"
                           :session-id "sess-1"
                           :fetch-fn fetch-fn
                           :open-stream? false})]
           (-> (.sendMessages transport
                              #js {:chatId "sess-1"
                                   :trigger "submit-message"
                                   :messageId nil
                                   :messages #js [#js {:id "user-1"
                                                       :role "user"
                                                       :parts #js [#js {:type "text"
                                                                        :text "hello from ui"}]}]})
               (.then <read-all-chunks)
               (.then (fn [chunks]
                        (is (= 1 (count @calls)))
                        (is (= "POST" (:method (first @calls))))
                        (is (= "finish" (:type (last chunks))))
                        (done)))
               (.catch (fn [error]
                         (is false (str "unexpected error: " error))
                         (done)))))))
