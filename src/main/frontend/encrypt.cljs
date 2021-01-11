(ns frontend.encrypt
  (:require [frontend.utf8 :as utf8]
            ["bip39" :as bip39]
            ["buffer" :as buffer]
            ["@kanru/rage-wasm" :as rage]))

(defonce secret-phrase "canal this pluck bar elite tape olive toilet cry surprise dish rival wrist tragic click honey solar kangaroo cook cabin replace harvest horse wrong")

(defn generate-mnemonic
  []
  (bip39/generateMnemonic 256))

(defn derive-key-from-mnemonic
  [mnemonic]
  (let [entropy (-> (bip39/mnemonicToEntropy mnemonic)
                    (buffer/Buffer.from "hex"))
        keys (rage/keygen_from_random_bytes entropy)]
    keys))

(let [keys (derive-key-from-mnemonic secret-phrase)]
  (defonce secret-key (first keys))
  (defonce public-key (second keys)))

(println public-key)

(defn encrypt
  [content]
  (let [content (utf8/encode content)
        encrypted (rage/encrypt_with_x25519 public-key content true)]
    ;; (println (utf8/decode encrypted))
    (utf8/decode encrypted)))

(defn decrypt
  [content]
  (let [content (utf8/encode content)
        decrypted (rage/decrypt_with_x25519 secret-key content)]
    (utf8/decode decrypted)))

;; (defn encrypt
;;   [content]
;;   content)

;; (defn decrypt
;;   [content]
;;   content)

;; (println (bip39/generateMnemonic 256))
;; (defonce secret "IRwamok0gbumjx41O0z83V/nzcqrac5vML6P62zS23c=")
;; (println (rage/keygen))
;; (defonce secret (.from buffer/Buffer (bip39/mnemonicToEntropy "canal this pluck bar elite tape olive toilet cry surprise dish rival wrist tragic click honey solar kangaroo cook cabin replace harvest horse wrong") "hex"))
;; (defonce secret "AGE-SECRET-KEY-1DR5NGZJSNK8DYAS2ZWLTDEMEQZJLAPE6AS89AT8JRP9RTVQMUPRQRVJ0FG")
;; (defonce public_key "age1uvghgt5x04myjwdrezmjcpvtxhcvxch2vq76shn5gm4xnzg6aqdskuskxr")
;; (defn encrypt
;;   [public_key content]
;;   (let [content-decoded (nacl-util/decodeUTF8 content)
;;         encrypted (rage/encrypt_with_x25519 public_key content-decoded)]
;;     (nacl-util/encodeBase64 encrypted)))
;; (defn decrypt
;;   [secret_key content]
;;   (let [content (nacl-util/decodeBase64 content)
;;         decrypted (rage/decrypt_with_x25519 secret_key content)]
;;     (nacl-util/encodeUTF8 decrypted)))
;; (defn new-nonce
;;   []
;;   (nacl/randomBytes nacl/secretbox.nonceLength))

;; (defn encrypt
;;   [key content]
;;   (when key
;;     (let [nonce (new-nonce)
;;           content-decoded (nacl-util/decodeUTF8 content)
;;           box (nacl/secretbox content-decoded nonce key)
;;           full-message (new js/Uint8Array (+ nonce.length box.length))]
;;       (js/console.log "nonce" (nacl-util/encodeBase64 nonce))
;;       (js/console.log "box" (nacl-util/encodeBase64 box))
;;       (.set full-message nonce)
;;       (.set full-message box nonce.length)
;;       (nacl-util/encodeBase64 full-message))))

;; (defn decrypt
;;   [key content-with-nonce]
;;   (when key
;;     (let [content-with-nonce-decoded (nacl-util/decodeBase64 content-with-nonce)
;;           nonce (.slice content-with-nonce-decoded 0 nacl/secretbox.nonceLength)
;;           content (.slice content-with-nonce-decoded nacl/secretbox.nonceLength content-with-nonce.length)
;;           decrypted (nacl-util/encodeUTF8 (nacl/secretbox.open content nonce key))]
;;       (println "decrypted" decrypted)
;;       decrypted)))
