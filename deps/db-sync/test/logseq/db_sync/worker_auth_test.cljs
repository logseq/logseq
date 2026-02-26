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

(deftest auth-claims-expired-token-returns-nil-test
  (async done
         (let [request (js/Request. "http://localhost/graphs"
                                    #js {:headers #js {"authorization" "Bearer expired-token"}})]
           (-> (p/with-redefs [authorization/verify-jwt
                               (fn [_token _env]
                                 (p/rejected (ex-info "exp" {})))]
                 (p/let [claims (auth/auth-claims request #js {})]
                   (is (nil? claims))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest auth-claims-jwks-error-propagates-test
  (async done
         (let [request (js/Request. "http://localhost/graphs"
                                    #js {:headers #js {"authorization" "Bearer broken-token"}})]
           (-> (p/with-redefs [authorization/verify-jwt
                               (fn [_token _env]
                                 (p/rejected (ex-info "jwks" {})))]
                 (auth/auth-claims request #js {}))
               (p/then (fn [_]
                         (is false "expected rejection when jwks fetch fails")
                         (done)))
               (p/catch (fn [error]
                          (is (= "jwks" (ex-message error)))
                          (done)))))))

(deftest auth-claims-expired-jwt-short-circuits-verification-test
  (async done
         (let [expired-token "eyJhbGciOiJSUzI1NiJ9.eyJleHAiOjEsInN1YiI6InUxIn0.signature"
               request (js/Request. "http://localhost/graphs"
                                    #js {:headers #js {"authorization" (str "Bearer " expired-token)}})
               verify-called? (atom false)]
           (-> (p/with-redefs [authorization/verify-jwt
                               (fn [_token _env]
                                 (reset! verify-called? true)
                                 (p/rejected (ex-info "should-not-be-called" {})))]
                 (p/let [claims (auth/auth-claims request #js {})]
                   (is (nil? claims))
                   (is (false? @verify-called?))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))
