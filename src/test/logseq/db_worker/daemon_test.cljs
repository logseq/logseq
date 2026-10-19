(ns logseq.db-worker.daemon-test
  (:require [cljs.test :refer [async deftest is]]
            [logseq.db-worker.daemon :as daemon]
            [promesa.core :as p]))

(deftest ready-uses-healthz-200-only
  (async done
    (-> (p/with-redefs [daemon/http-request (fn [{:keys [path]}]
                                              (is (= "/healthz" path))
                                              (p/resolved {:status 200
                                                           :body "{\"status\":\"ready\"}"}))]
          (daemon/ready? {:host "127.0.0.1" :port 7001}))
        (p/then (fn [result]
                  (is (= true result))))
        (p/catch (fn [e]
                   (is false (str "unexpected error: " e))))
        (p/finally done))))
