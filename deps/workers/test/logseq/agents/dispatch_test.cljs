(ns logseq.agents.dispatch-test
  (:require [cljs.test :refer [async deftest is]]
            [logseq.agents.dispatch :as agents-dispatch]
            [logseq.sync.platform.core :as platform]))

(deftest agents-dispatch-health-test
  (async done
         (let [request (platform/request "http://example.com/health" #js {:method "GET"})]
           (-> (agents-dispatch/handle-worker-fetch request #js {})
               (.then (fn [response]
                        (is (= 200 (.-status response)))
                        (done)))
               (.catch (fn [error]
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest agents-dispatch-sessions-route-test
  (async done
         (let [request (platform/request "http://example.com/sessions/s1" #js {:method "GET"})]
           (-> (agents-dispatch/handle-worker-fetch request #js {})
               (.then (fn [response]
                        ;; Session routes are handled by agent handler, which returns 401
                        ;; when auth is missing.
                        (is (= 401 (.-status response)))
                        (done)))
               (.catch (fn [error]
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest agents-dispatch-runners-route-test
  (async done
         (let [request (platform/request "http://example.com/runners" #js {:method "GET"})]
           (-> (agents-dispatch/handle-worker-fetch request #js {})
               (.then (fn [response]
                        ;; Runner routes are handled by agent handler, which returns 401
                        ;; when auth is missing.
                        (is (= 401 (.-status response)))
                        (done)))
               (.catch (fn [error]
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest agents-dispatch-not-found-test
  (async done
         (let [request (platform/request "http://example.com/graphs" #js {:method "GET"})]
           (-> (agents-dispatch/handle-worker-fetch request #js {})
               (.then (fn [response]
                        (is (= 404 (.-status response)))
                        (done)))
               (.catch (fn [error]
                         (is false (str "unexpected error: " error))
                         (done)))))))
