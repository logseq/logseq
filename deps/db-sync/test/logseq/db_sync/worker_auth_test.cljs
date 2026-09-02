(ns logseq.db-sync.worker-auth-test
  (:require [cljs.test :refer [async deftest is]]
            [logseq.common.authorization :as authorization]
            [logseq.db-sync.worker.auth :as auth]
            [promesa.core :as p]))

(deftest cognito-client-id-allowlist-test
  (let [env #js {"COGNITO_CLIENT_ID" "web-client"
                 "COGNITO_CLIENT_IDS" "chatgpt-client, admin-client"}]
    (is (authorization/client-id-allowed? env "web-client"))
    (is (authorization/client-id-allowed? env "chatgpt-client"))
    (is (authorization/client-id-allowed? env "admin-client"))
    (is (not (authorization/client-id-allowed? env "unknown-client")))))

(deftest cognito-client-id-allowlist-fails-closed-test
  (is (not (authorization/client-id-allowed? #js {} nil)))
  (is (not (authorization/client-id-allowed? #js {} "")))
  (is (not (authorization/client-id-allowed? #js {"COGNITO_CLIENT_ID" ""} "")))
  (is (not (authorization/client-id-allowed? #js {"COGNITO_CLIENT_IDS" " , "} "chatgpt-client")))
  (is (not (authorization/client-id-allowed? #js {"COGNITO_CLIENT_ID" "web-client"} nil))))

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

(deftest auth-claims-jwks-error-falls-back-to-unsafe-claims-when-enabled-test
  (async done
         (let [token "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1MSJ9.signature"
               request (js/Request. "http://localhost/graphs"
                                   #js {:headers #js {"authorization" (str "Bearer " token)}})
               env #js {"DB_SYNC_ALLOW_UNVERIFIED_JWT_CLAIMS" "true"}]
           (-> (p/with-redefs [authorization/verify-jwt
                               (fn [_token _env]
                                 (p/rejected (ex-info "jwks" {})))]
                 (p/let [claims (auth/auth-claims request env)]
                   (is (= "u1" (aget claims "sub")))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest auth-claims-local-token-match-returns-claims-test
  (async done
         (let [request (js/Request. "http://localhost/graphs"
                                    #js {:headers #js {"authorization" "Bearer local-secret"}})
               env #js {"DB_SYNC_LOCAL_TOKEN" "local-secret"}
               verify-called? (atom false)]
           (-> (p/with-redefs [authorization/verify-jwt
                               (fn [_token _env]
                                 (reset! verify-called? true)
                                 (p/rejected (ex-info "should-not-be-called" {})))]
                 (p/let [claims (auth/auth-claims request env)]
                   (is (= "local-user" (aget claims "sub")))
                   (is (false? @verify-called?))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest auth-claims-local-token-custom-user-id-test
  (async done
         (let [request (js/Request. "http://localhost/graphs?token=local-secret")
               env #js {"DB_SYNC_LOCAL_TOKEN" "local-secret"
                        "DB_SYNC_LOCAL_USER_ID" "felipe"}]
           (-> (p/let [claims (auth/auth-claims request env)]
                 (is (= "felipe" (aget claims "sub"))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest auth-claims-local-token-mismatch-returns-nil-test
  (async done
         (let [request (js/Request. "http://localhost/graphs"
                                    #js {:headers #js {"authorization" "Bearer wrong-secret"}})
               env #js {"DB_SYNC_LOCAL_TOKEN" "local-secret"}]
           (-> (p/let [claims (auth/auth-claims request env)]
                 (is (nil? claims)))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest auth-claims-local-token-rejects-jwt-when-set-test
  ;; When local-token mode is enabled it is the only accepted credential;
  ;; a JWT that would otherwise verify must not authenticate.
  (async done
         (let [request (js/Request. "http://localhost/graphs"
                                    #js {:headers #js {"authorization" "Bearer some-jwt"}})
               env #js {"DB_SYNC_LOCAL_TOKEN" "local-secret"}]
           (-> (p/with-redefs [authorization/verify-jwt
                               (fn [token _env]
                                 (js/Promise.resolve #js {"sub" (str "jwt:" token)}))]
                 (p/let [claims (auth/auth-claims request env)]
                   (is (nil? claims))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest auth-claims-local-token-without-request-token-returns-nil-test
  (async done
         (let [request (js/Request. "http://localhost/graphs")
               env #js {"DB_SYNC_LOCAL_TOKEN" "local-secret"}]
           (-> (p/let [claims (auth/auth-claims request env)]
                 (is (nil? claims)))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
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
