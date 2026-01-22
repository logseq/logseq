(ns frontend.handler.db-based.db-sync-test
  (:require [cljs.test :refer [deftest is async]]
            [frontend.handler.db-based.db-sync :as db-sync]
            [promesa.core :as p]))

(deftest download-graph-e2ee-detection-test
  (async done
         (with-redefs [db-sync/fetch-json (fn [_ _ _]
                                            (p/resolved {:encrypted-aes-key "k"}))]
           (-> (p/let [enabled? (#'db-sync/fetch-graph-e2ee? "http://base" "graph-1")]
                 (is (true? enabled?))
                 (done))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))

(deftest download-graph-e2ee-missing-key-test
  (async done
         (with-redefs [db-sync/fetch-json (fn [_ _ _]
                                            (p/resolved {}))]
           (-> (p/let [enabled? (#'db-sync/fetch-graph-e2ee? "http://base" "graph-1")]
                 (is (false? enabled?))
                 (done))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))
