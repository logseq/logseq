(ns logseq.cli.transport-test
  (:require [cljs.test :refer [deftest is async testing]]
            [logseq.cli.transport :as transport]
            [promesa.core :as p]))

(def ^:private fs (js/require "fs"))
(def ^:private os (js/require "os"))
(def ^:private path (js/require "path"))

(defn- temp-path
  [filename]
  (let [dir (.mkdtempSync fs (.join path (.tmpdir os) "logseq-cli-"))]
    (.join path dir filename)))

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

(deftest test-request-avoids-deprecated-url-parse
  (async done
         (let [url-module (js/require "url")
               original-parse (.-parse url-module)
               parse-calls (atom 0)]
           (set! (.-parse url-module)
                 (fn [& args]
                   (swap! parse-calls inc)
                   (.apply original-parse url-module (to-array args))))
           (-> (p/let [{:keys [url stop!]} (start-server
                                            (fn [_req ^js res]
                                              (.writeHead res 200 #js {"Content-Type" "text/plain"})
                                              (.end res "ok")))]
                 (p/let [response (transport/request {:method "GET"
                                                      :url (str url "/status")
                                                      :timeout-ms 1000})]
                   (is (= 200 (:status response)))
                   (is (= 0 @parse-calls))
                   (p/let [_ (stop!)] true)))
               (p/then (fn [_]
                         (set! (.-parse url-module) original-parse)
                         (done)))
               (p/catch (fn [e]
                          (set! (.-parse url-module) original-parse)
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-request-does-not-retry
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
                                                    (.end res "ok"))))))]
                 (p/catch
                  (transport/request {:method "GET"
                                      :url (str url "/retry")
                                      :timeout-ms 1000})
                  (fn [e]
                    (is (= :http-error (-> (ex-data e) :code)))
                    (is (= 500 (-> (ex-data e) :status)))))
                 (is (= 1 @calls))
                 (p/let [_ (stop!)] true))
               (p/then (fn [_] (done)))
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
                                    :timeout-ms 10})
                (fn [e]
                  (is (= :timeout (-> (ex-data e) :code)))
                  (p/let [_ (stop!)] true))))
             (p/then (fn [_] (done)))
             (p/catch (fn [e]
                        (is false (str "unexpected error: " e))
                        (done))))))

(deftest test-invoke-accepts-keyword-method
  (async done
         (let [received (atom nil)]
           (-> (p/let [{:keys [url stop!]} (start-server
                                            (fn [^js req ^js res]
                                              (let [chunks (array)]
                                                (.on req "data" (fn [chunk] (.push chunks chunk)))
                                                (.on req "end" (fn []
                                                                 (let [buf (js/Buffer.concat chunks)
                                                                       payload (js/JSON.parse (.toString buf "utf8"))]
                                                                   (reset! received (js->clj payload :keywordize-keys true))
                                                                   (.writeHead res 200 #js {"Content-Type" "application/json"})
                                                                   (.end res (js/JSON.stringify #js {:result "ok"}))))))))]
                 (p/let [result (transport/invoke {:base-url url} :thread-api/pull true ["repo" [:block/title]])]
                   (is (= "ok" result))
                   (is (= "thread-api/pull" (:method @received)))
                   (is (= true (:directPass @received)))
                   (p/let [_ (stop!)] true)))
               (p/then (fn [_] (done)))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-invoke-does-not-send-auth-header
  (async done
         (let [auth-header (atom :unset)]
           (-> (p/let [{:keys [url stop!]} (start-server
                                            (fn [^js req ^js res]
                                              (let [headers (.-headers req)]
                                                (reset! auth-header (aget headers "authorization")))
                                              (.writeHead res 200 #js {"Content-Type" "application/json"})
                                              (.end res (js/JSON.stringify #js {:result "ok"}))))]
                 (p/let [result (transport/invoke {:base-url url
                                                   :auth-token "secret"}
                                                  :thread-api/pull
                                                  true
                                                  ["repo" [:block/title]])]
                   (is (= "ok" result))
                   (is (nil? @auth-header))
                   (p/let [_ (stop!)] true)))
               (p/then (fn [_] (done)))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-read-input
  (testing "reads edn input"
    (let [file-path (temp-path "input.edn")]
      (.writeFileSync fs file-path "{:a 1}")
      (is (= {:a 1} (transport/read-input {:format :edn :path file-path})))))

  (testing "reads sqlite input as buffer"
    (let [file-path (temp-path "input.sqlite")
          buffer (js/Buffer.from "sqlite-data")]
      (.writeFileSync fs file-path buffer)
      (let [result (transport/read-input {:format :sqlite :path file-path})]
        (is (instance? js/Buffer result))
        (is (= "sqlite-data" (.toString result "utf8")))))))

(deftest test-write-output
  (testing "writes sqlite output as buffer"
    (let [file-path (temp-path "output.sqlite")
          buffer (js/Buffer.from "sqlite-export")]
      (transport/write-output {:format :sqlite :path file-path :data buffer})
      (is (= "sqlite-export" (.toString (.readFileSync fs file-path) "utf8"))))))
