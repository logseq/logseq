(ns frontend.common.crypt-mutation-test
  "Inside a promise chain, `(is (thrown? ...))` returns the caught error and an
  error returned from a step rejects the chain, so the assertions below run in
  plain fns that return nil, and rejections are wrapped as {:error e}."
  (:require [cljs.test :refer [is]]
            [clojure.string :as string]
            [frontend.common.crypt :as crypt]
            [frontend.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

(defn- <rsa-key-pair
  "A 2048-bit RSA-OAEP key pair (faster to make than crypt's 4096-bit one)."
  []
  (p/let [r (.generateKey crypt/subtle
                          #js {:name "RSA-OAEP"
                               :modulusLength 2048
                               :publicExponent (js/Uint8Array. [1 0 1])
                               :hash "SHA-256"}
                          true
                          #js ["encrypt" "decrypt"])]
    {:publicKey (.-publicKey r)
     :privateKey (.-privateKey r)}))

(defn- <settled
  [promise]
  (-> promise
      (p/then (fn [value] {:value value}))
      (p/catch (fn [e] {:error e}))))

(deftest-async decrypt-private-key-with-wrong-password-is-invalid-password-test
  (p/let [{:keys [privateKey]} (<rsa-key-pair)
          encrypted (crypt/<encrypt-private-key "right-password" privateKey)
          {:keys [error]} (<settled (crypt/<decrypt-private-key "wrong-password" encrypted))]
    (is (= "decrypt-private-key" (ex-message error)))
    (is (true? (:invalid-password? (ex-data error))))))

(deftest-async decrypt-aes-key-with-wrong-private-key-logs-no-error-test
  (let [records (atom [])
        handler (fn [record] (swap! records conj record))]
    (-> (p/let [{:keys [publicKey]} (<rsa-key-pair)
                other-key-pair (<rsa-key-pair)
                aes-key (crypt/<generate-aes-key)
                encrypted-aes-key (crypt/<encrypt-aes-key publicKey aes-key)
                _ (log/add-handler handler)
                {:keys [error]} (<settled (crypt/<decrypt-aes-key (:privateKey other-key-pair) encrypted-aes-key))]
          (log/remove-handler handler)
          (is (= "decrypt-aes-key" (ex-message error)))
          (is (empty? (filter #(string/includes? (pr-str (:message %)) "decrypt-aes-key failed")
                              @records))))
        (p/finally #(log/remove-handler handler)))))

(defn- check-rejects-non-uint8array-data
  [{:keys [publicKey privateKey]} aes-key encrypted-aes-key]
  (let [plain (js/Uint8Array. [1 2 3])]
    (is (thrown? js/Error (crypt/<decrypt-aes-key privateKey (.-buffer encrypted-aes-key)))
        "an ArrayBuffer of an encrypted AES key")
    (is (thrown? js/Error (crypt/<encrypt-uint8array aes-key (.-buffer plain)))
        "an ArrayBuffer to encrypt")
    (is (thrown? js/Error (crypt/<encrypt-text aes-key "plain text"))
        "text that is not transit")
    (is (thrown? js/Error (crypt/<encrypt-aes-key (.-buffer encrypted-aes-key) aes-key))
        "a public key that is not a CryptoKey")
    (is (some? publicKey))
    nil))

(deftest-async crypt-rejects-key-data-that-is-not-a-uint8array-test
  (p/let [key-pair (<rsa-key-pair)
          aes-key (crypt/<generate-aes-key)
          encrypted-aes-key (crypt/<encrypt-aes-key (:publicKey key-pair) aes-key)]
    (check-rejects-non-uint8array-data key-pair aes-key encrypted-aes-key)))
