(ns logseq.db-sync.worker.handler.e2ee
  "Edge-side crypto helpers for the semantic API on E2EE graphs.
  Two package shapes are produced/accepted:
  - canonical: transit vector [iv ciphertext], AES-256-GCM with the graph key
  - RSA envelope: transit map {:logseq.e2ee/keys {user-id wrapped-key} :iv :data},
    readable only by graph members holding the RSA private key"
  (:require [clojure.string :as string]
            [logseq.db :as ldb]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.index :as index]
            [logseq.db-sync.worker.http :as http]
            [promesa.core :as p]))

(def ^:private subtle (.. js/crypto -subtle))
(def ^:private text-encoder (js/TextEncoder.))
(def ^:private text-decoder (js/TextDecoder.))

(defn- base64->uint8 [value]
  (let [binary (js/atob value)]
    (js/Uint8Array.from (js/Array.from binary) #(.charCodeAt % 0))))

(defn- <import-aes-key [base64-key]
  (.importKey subtle "raw" (base64->uint8 base64-key) "AES-GCM" false
              #js ["encrypt" "decrypt"]))

(defn- <import-public-key [public-key-str]
  (let [exported (ldb/read-transit-str public-key-str)]
    (.importKey subtle "spki" exported
                #js {:name "RSA-OAEP" :hash "SHA-256"} false #js ["encrypt"])))

(defn- <encrypt-text-aes [aes-key text]
  (p/let [iv (js/crypto.getRandomValues (js/Uint8Array. 12))
          encrypted (.encrypt subtle #js {:name "AES-GCM" :iv iv} aes-key
                              (.encode text-encoder (ldb/write-transit-str text)))]
    (ldb/write-transit-str [iv (js/Uint8Array. encrypted)])))

(defn- <decrypt-text-aes [aes-key value]
  (let [decoded (try (ldb/read-transit-str value)
                     (catch :default _ nil))]
    (if-not (and (vector? decoded) (= 2 (count decoded)))
      (p/rejected (ex-info "invalid encrypted package" {:value value}))
      (p/let [[iv-data encrypted-data] decoded
              iv (js/Uint8Array. iv-data)
              decrypted (.decrypt subtle #js {:name "AES-GCM" :iv iv} aes-key
                                  (js/Uint8Array. encrypted-data))
              transit-text (.decode text-decoder decrypted)]
        (ldb/read-transit-str transit-text)))))

(defn- <encrypt-text-rsa [member-keys text]
  (p/let [ephemeral (.generateKey subtle #js {:name "AES-GCM" :length 256} true
                                  #js ["encrypt"])
          iv (js/crypto.getRandomValues (js/Uint8Array. 12))
          encrypted (.encrypt subtle #js {:name "AES-GCM" :iv iv} ephemeral
                              (.encode text-encoder (ldb/write-transit-str text)))
          exported-ephemeral (.exportKey subtle "raw" ephemeral)
          wrapped (p/all (map (fn [{:keys [user-id public-key]}]
                                (p/let [public-key' (<import-public-key public-key)
                                        wrapped-key (.encrypt subtle #js {:name "RSA-OAEP"}
                                                              public-key' exported-ephemeral)]
                                  [user-id (js/Uint8Array. wrapped-key)]))
                              member-keys))]
    (ldb/write-transit-str
     {:logseq.e2ee/alg "rsa-oaep-256+aes-gcm-256"
      :logseq.e2ee/keys (into {} wrapped)
      :logseq.e2ee/iv iv
      :logseq.e2ee/data (js/Uint8Array. encrypted)})))

(defn- <read-body [request]
  (p/let [raw (-> (common/read-json request)
                  (p/catch (fn [_] ::invalid-body)))]
    (if (or (nil? raw) (= ::invalid-body raw))
      raw
      (js->clj raw :keywordize-keys true))))

(defn- valid-texts? [texts]
  (and (sequential? texts) (seq texts)
         (<= (count texts) 100)
         (every? string? texts)))

(defn handle
  "Handles /api/v1/graphs/:graph-id/e2ee/* operations at the edge, without
  forwarding to the graph's durable object."
  [{:keys [request ^js env handler graph-id]}]
  (case handler
    :semantic/e2ee-public-keys
    (p/let [keys (index/<graph-member-public-keys (aget env "DB") graph-id)]
      (http/json-response nil {:keys keys}))

    :semantic/e2ee-encrypt
    (p/let [body (<read-body request)
            texts (:texts body)
            key (:key body)]
      (cond
        (not (valid-texts? texts))
        (http/bad-request "invalid texts")

        (and (some? key) (not (string? key)))
        (http/bad-request "invalid key")

        :else
        (-> (if (string? key)
              (p/let [aes-key (<import-aes-key key)]
                (p/all (mapv #(<encrypt-text-aes aes-key %) texts)))
              (p/let [member-keys (index/<graph-member-public-keys (aget env "DB") graph-id)]
                (if (seq member-keys)
                  (p/all (mapv #(<encrypt-text-rsa member-keys %) texts))
                  (p/rejected (ex-info "graph has no member public keys" {})))))
            (p/then (fn [texts'] (http/json-response nil {:texts texts'})))
            (p/catch (fn [error]
                       (http/bad-request (or (ex-message error) "encrypt failed")))))))

    :semantic/e2ee-decrypt
    (p/let [body (<read-body request)
            texts (:texts body)
            key (:key body)]
      (if (or (not (string? key)) (not (valid-texts? texts)))
        (http/bad-request "invalid key or texts")
        (-> (p/let [aes-key (<import-aes-key key)]
              (p/all (mapv #(<decrypt-text-aes aes-key %) texts)))
            (p/then (fn [texts'] (http/json-response nil {:texts texts'})))
            (p/catch (fn [_] (http/bad-request "decrypt failed"))))))

    (http/not-found)))
