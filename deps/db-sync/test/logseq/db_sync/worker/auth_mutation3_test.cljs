(ns logseq.db-sync.worker.auth-mutation3-test
  (:require [cljs.test :refer [async deftest is]]
            [logseq.common.authorization :as authorization]
            [logseq.db-sync.worker.auth :as auth]
            [promesa.core :as p]))

(defn- base64url [text]
  (.toString (js/Buffer.from text) "base64url"))

(defn- jwt-with-payload [payload-json]
  (str (base64url "{\"alg\":\"RS256\"}") "." (base64url payload-json) ".signature"))

;; Fails if, in `decode-jwt-part`, the `(string/replace "-" "+")` step is dropped or the `(string/replace "_" "/")` step is dropped.
(deftest unsafe-jwt-claims-decodes-url-safe-base64-test
  (let [payload-json "{\"x\":\"???>>>\"}"
        payload-part (base64url payload-json)
        claims (auth/unsafe-jwt-claims (jwt-with-payload payload-json))]
    (is (re-find #"-" payload-part))
    (is (re-find #"_" payload-part))
    (is (= "???>>>" (aget claims "x")))))

;; Fails if, in `recoverable-auth-error?`, `or` becomes `and` or the `.-message` step is dropped.
(deftest auth-claims-recoverable-error-without-ex-message-returns-nil-test
  (async done
         (let [request (js/Request. "http://localhost/graphs"
                                    #js {:headers #js {"authorization" "Bearer opaque-token"}})]
           (-> (p/with-redefs [authorization/verify-jwt
                               (fn [_token _env]
                                 (p/rejected #js {"message" "kid"}))]
                 (p/let [claims (auth/auth-claims request #js {})]
                   (is (nil? claims))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

;; Fails if, in `expired-token?`, `<=` becomes `<`.
(deftest auth-claims-token-expiring-this-second-is-expired-test
  (async done
         (let [original-now (.-now js/Date)
               token (jwt-with-payload "{\"exp\":1000,\"sub\":\"u1\"}")
               request (js/Request. "http://localhost/graphs"
                                    #js {:headers #js {"authorization" (str "Bearer " token)}})
               verify-called? (atom false)]
           (set! (.-now js/Date) (fn [] 1000000))
           (-> (p/with-redefs [authorization/verify-jwt
                               (fn [_token _env]
                                 (reset! verify-called? true)
                                 (p/resolved #js {"sub" "u1"}))]
                 (p/let [claims (auth/auth-claims request #js {})]
                   (is (nil? claims))
                   (is (false? @verify-called?))))
               (p/catch (fn [error] (is false (str error))))
               (p/finally (fn []
                            (set! (.-now js/Date) original-now)
                            (done)))))))
