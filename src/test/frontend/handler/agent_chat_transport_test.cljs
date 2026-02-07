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
                                         :item-id "item-1"}}
                                 {:type "item.delta"
                                  :ts 1100
                                  :data {:delta "new-delta"
                                         :item-id "item-2"}}
                                 {:type "item.completed"
                                  :ts 1200
                                  :data {:item-id "item-2"
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
