(ns logseq.db-sync.worker-auth-test
  (:require [cljs.test :refer [async deftest is]]
            [logseq.common.authorization :as authorization]
            [logseq.db-sync.worker.auth :as auth]
            [promesa.core :as p]))

(deftest auth-claims-uses-jwt-verification-test
  (async done
         (let [request (js/Request. "http://localhost/graphs"
                                    #js {:headers #js {"authorization" "Bearer dev-token"}})]
           (-> (p/with-redefs [authorization/verify-jwt
                               (fn [token _env]
                                 (js/Promise.resolve #js {"sub" (str "jwt:" token)}))]
                 (p/let [claims (auth/auth-claims request #js {})]
                   (is (= "jwt:dev-token" (aget claims "sub")))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest auth-claims-without-token-returns-nil-test
  (async done
         (let [request (js/Request. "http://localhost/graphs")]
           (-> (p/let [claims (auth/auth-claims request #js {})]
                 (is (nil? claims)))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))
