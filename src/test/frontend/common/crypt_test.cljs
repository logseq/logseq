(ns frontend.common.crypt-test
  (:require [cljs.test :as t :refer [deftest is testing]]
            [frontend.common.crypt :as crypt]
            [frontend.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [promesa.core :as p]))

(defn- uint8array=? [arr1 arr2]
  (assert (and (instance? js/Uint8Array arr1)
               (instance? js/Uint8Array arr2)))
  (= (vec arr1) (vec arr2)))

(deftest-async user-rsa-key-pair+graph-aes-key+password-test
  (p/let [password "test-password"
          rsa-key-pair (crypt/<generate-rsa-key-pair)
          aes-key (crypt/<generate-aes-key)
          encrypted-private-key (crypt/<encrypt-private-key password (:privateKey rsa-key-pair))
          encrypted-aes-key (crypt/<encrypt-aes-key (:publicKey rsa-key-pair) aes-key)]
    (testing "
1. generate rsa key pair
2. generate aes key
3. use password to encrypt private-key
4. use public-key to encrypt aes-key"
      (is (vector? encrypted-private-key))
      (is (instance? js/Uint8Array (last encrypted-private-key)))
      (is (instance? js/Uint8Array encrypted-aes-key)))

    (p/let [decrypted-private-key (crypt/<decrypt-private-key password encrypted-private-key)
            decrypted-aes-key (crypt/<decrypt-aes-key decrypted-private-key encrypted-aes-key)
            exported-original-private-key (crypt/<export-private-key (:privateKey rsa-key-pair))
            exported-decrypted-private-key (crypt/<export-private-key decrypted-private-key)
            exported-original-aes-key (crypt/<export-aes-key aes-key)
            exported-decrypted-aes-key (crypt/<export-aes-key decrypted-aes-key)]
      (testing "
1. use password to decrypt encrypted-private-key above
2. use private-key to decrypt encrypted-aes-key above"
        (is (instance? js/CryptoKey decrypted-private-key))
        (is (instance? js/CryptoKey decrypted-aes-key))
        (is (uint8array=? exported-original-private-key exported-decrypted-private-key))
        (is (uint8array=? exported-original-aes-key exported-decrypted-aes-key))))

    (testing "
1. use wrong password to decrypt encrypted-private-key above
2. use wrong private-key to decrypt encrypted-aes-key above"
      (p/do!
       (-> (p/do! (crypt/<decrypt-private-key "wrong-password" encrypted-private-key))
           (p/catch (fn [e]
                      (is (= "decrypt-private-key" (ex-message e)))
                      (is (true? (:invalid-password? (ex-data e))))))))
       (-> (p/let [another-rsa-key-pair (crypt/<generate-rsa-key-pair)]
             (crypt/<decrypt-aes-key (:privateKey another-rsa-key-pair) encrypted-aes-key))
           (p/catch (fn [e] (is (= "decrypt-aes-key" (ex-message e))))))))))

(deftest expected-crypto-operation-error-detects-runtime-shapes-test
  (let [named (js/DOMException. "The operation failed for an operation-specific reason"
                                "OperationError")
        message-only (js/DOMException. "OperationError")
        wrapped (ex-info "decrypt-private-key" {} named)
        wrapped-message-only (ex-info "decrypt-private-key" {} message-only)]
    (is (true? (crypt/expected-crypto-operation-error? named)))
    (is (true? (crypt/expected-crypto-operation-error? message-only)))
    (is (true? (crypt/expected-crypto-operation-error? wrapped)))
    (is (true? (crypt/expected-crypto-operation-error? wrapped-message-only)))
    (is (false? (crypt/expected-crypto-operation-error?
                 (ex-info "decrypt-private-key" {} (js/Error. "TypeError")))))))
