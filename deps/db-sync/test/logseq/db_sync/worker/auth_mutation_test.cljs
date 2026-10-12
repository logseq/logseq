(ns logseq.db-sync.worker.auth-mutation-test
  (:require [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [logseq.common.authorization :as authorization]
            [logseq.db-sync.worker.auth :as auth]
            [promesa.core :as p]))

(defn- jwt-with-exp [exp-s]
  (let [part (-> (js/btoa (js/JSON.stringify #js {"exp" exp-s "sub" "u1"}))
                 (string/replace "+" "-")
                 (string/replace "/" "_")
                 (string/replace "=" ""))]
    (str "eyJhbGciOiJSUzI1NiJ9." part ".signature")))

;; Fails if, in `expired-token?`, `and` becomes `or`.
(deftest auth-claims-verifies-unexpired-jwt-test
  (async done
         (let [token (jwt-with-exp (+ (js/Math.floor (/ (.now js/Date) 1000)) 3600))
               request (js/Request. "http://localhost/graphs"
                                    #js {:headers #js {"authorization" (str "Bearer " token)}})]
           (-> (p/with-redefs [authorization/verify-jwt
                               (fn [_token _env]
                                 (js/Promise.resolve #js {"sub" "u1"}))]
                 (p/let [claims (auth/auth-claims request #js {})]
                   (is (= "u1" (some-> claims (aget "sub")))
                       "a token whose exp is in the future is verified, not dropped as expired")))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))
