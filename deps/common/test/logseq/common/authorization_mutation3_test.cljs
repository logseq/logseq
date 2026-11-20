(ns logseq.common.authorization-mutation3-test
  (:require ["http" :as http]
            [cljs.test :refer [async deftest is]]
            [logseq.common.authorization :as authorization]
            [promesa.core :as p]))

(defn- base64url [buf-or-string]
  (.toString (js/Buffer.from buf-or-string) "base64url"))

(defn- sign-jwt [private-key payload]
  (p/let [header-part (base64url (js/JSON.stringify #js {"alg" "RS256" "kid" "k1"}))
          payload-part (base64url (js/JSON.stringify (clj->js payload)))
          data (.encode (js/TextEncoder.) (str header-part "." payload-part))
          signature (.sign js/crypto.subtle "RSASSA-PKCS1-v1_5" private-key data)]
    (str header-part "." payload-part "." (base64url (js/Uint8Array. signature)))))

(defn- serve-json [body-str]
  (p/create
   (fn [resolve! _reject]
     (let [server (.createServer http (fn [_req res]
                                        (.writeHead res 200 #js {"content-type" "application/json"})
                                        (.end res body-str)))]
       (.listen server 0 "127.0.0.1" (fn [] (resolve! server)))))))

;; Fails if, in `import-rsa-key`, the body becomes `nil`, the `:name` key is dropped or the `:hash` key is dropped.
(deftest verify-jwt-accepts-token-signed-by-jwks-key-test
  (async done
         (let [*server (atom nil)]
           (-> (p/let [key-pair (.generateKey js/crypto.subtle
                                              #js {:name "RSASSA-PKCS1-v1_5"
                                                   :modulusLength 2048
                                                   :publicExponent (js/Uint8Array. #js [1 0 1])
                                                   :hash "SHA-256"}
                                              true
                                              #js ["sign" "verify"])
                       public-jwk (.exportKey js/crypto.subtle "jwk" (.-publicKey key-pair))
                       _ (set! (.-kid public-jwk) "k1")
                       server (serve-json (js/JSON.stringify #js {:keys #js [public-jwk]}))
                       _ (reset! *server server)
                       env #js {"COGNITO_ISSUER" "https://issuer.example"
                                "COGNITO_CLIENT_ID" "web-client"
                                "COGNITO_JWKS_URL" (str "http://127.0.0.1:" (.-port (.address server)) "/mutation3-jwks.json")}
                       token (sign-jwt (.-privateKey key-pair)
                                       {"iss" "https://issuer.example"
                                        "aud" "web-client"
                                        "sub" "u1"})
                       payload (authorization/verify-jwt token env)]
                 (is (= "u1" (aget payload "sub"))))
               (p/catch (fn [error] (is false (str error))))
               (p/finally (fn []
                            (when-let [server @*server] (.close server))
                            (done)))))))
