(ns frontend.extensions.age-encryption
  (:require ["regenerator-runtime/runtime"] ;; required for async npm module
            ["@kanru/rage-wasm" :as rage]))

(defn keygen
  []
  (rage/keygen))

(defn encrypt-with-x25519
  [public-key content armor]
  (rage/encrypt_with_x25519 public-key content armor))

(defn decrypt-with-x25519
  [secret-key content]
  (rage/decrypt_with_x25519 secret-key content))

(defn encrypt-with-user-passphrase
  [passphrase content armor]
  (rage/encrypt_with_user_passphrase passphrase content armor))

(defn decrypt-with-user-passphrase
  [passphrase content]
  (rage/decrypt_with_user_passphrase passphrase content))