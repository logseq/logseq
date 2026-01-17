(ns logseq.cli.transport-test
  (:require [cljs.test :refer [deftest is async]]
            [promesa.core :as p]
            [logseq.cli.transport :as transport]))

(defn- start-server
  [handler]
  (p/create
   (fn [resolve reject]
     (let [http (js/require "http")
           server (.createServer http handler)]
       (.on server "error" reject)
       (.listen server 0 "127.0.0.1"
                (fn []
                  (let [address (.address server)
                        port (.-port address)
                        stop! (fn []
                                (p/create (fn [resolve _]
                                            (.close server (fn [] (resolve true))))))]
                    (resolve {:url (str "http://127.0.0.1:" port)
                              :stop! stop!}))))))))

(deftest test-request-retries
  (async done
    (let [calls (atom 0)]
      (-> (p/let [{:keys [url stop!]} (start-server
                                       (fn [_req ^js res]
                                         (let [attempt (swap! calls inc)]
                                           (if (= attempt 1)
                                             (do
                                               (.writeHead res 500 #js {"Content-Type" "text/plain"})
                                               (.end res "boom"))
                                             (do
                                               (.writeHead res 200 #js {"Content-Type" "text/plain"})
                                               (.end res "ok"))))))
                 response (transport/request {:method "GET"
                                              :url (str url "/retry")
                                              :retries 1
                                              :timeout-ms 1000})]
            (is (= 200 (:status response)))
            (is (= 2 @calls))
            (p/let [_ (stop!)]
              (done)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))
                     (done)))))))

(deftest test-request-timeout
  (async done
    (-> (p/let [{:keys [url stop!]} (start-server
                                     (fn [_req _res]
                                       nil))]
          (p/catch
           (transport/request {:method "GET"
                               :url (str url "/hang")
                               :timeout-ms 10
                               :retries 0})
           (fn [e]
             (is (= :timeout (-> (ex-data e) :code)))
             (p/let [_ (stop!)]
               (done)))))
        (p/catch (fn [e]
                   (is false (str "unexpected error: " e))
                   (done))))))
