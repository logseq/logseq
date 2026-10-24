(ns logseq.db-sync.worker.handler.e2ee
  "Semantic API crypto helpers using the graph's canonical AES-GCM packages."
  (:require [lambdaisland.glogi :as log]
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
  (let [payload (base64->uint8 base64-key)]
    (when-not (= 32 (.-length payload))
      (throw (ex-info "key must be a 256-bit graph AES key" {})))
    (.importKey subtle "raw" payload "AES-GCM" false #js ["encrypt" "decrypt"])))

(defn encrypted-package?
  "Checks that `value` contains a canonical Transit AES-GCM package."
  [value]
  (when (string? value)
    (let [decoded (try (ldb/read-transit-str value) (catch :default _ nil))]
      (and (vector? decoded) (= 2 (count decoded))
           (every? #(instance? js/Uint8Array %) decoded)
           (= 12 (.-length (first decoded)))
           (<= 16 (.-length (second decoded)))))))

(defn- <encrypt-text-aes [aes-key text]
  (p/let [iv (js/crypto.getRandomValues (js/Uint8Array. 12))
          encrypted (.encrypt subtle #js {:name "AES-GCM" :iv iv} aes-key
                              (.encode text-encoder (ldb/write-transit-str text)))]
    (ldb/write-transit-str [iv (js/Uint8Array. encrypted)])))

(defn- <decrypt-text-aes [aes-key value]
  (let [decoded (try (ldb/read-transit-str value)
                     (catch :default _ nil))]
    (if-not (encrypted-package? value)
      (p/rejected (ex-info "invalid encrypted package" {:value value}))
      (p/let [[iv-data encrypted-data] decoded
              iv (js/Uint8Array. iv-data)
              decrypted (.decrypt subtle #js {:name "AES-GCM" :iv iv} aes-key
                                  (js/Uint8Array. encrypted-data))
              transit-text (.decode text-decoder decrypted)]
        (ldb/read-transit-str transit-text)))))

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

        (not (string? key))
        (http/bad-request "invalid key")

        :else
        (-> (p/let [aes-key (<import-aes-key key)]
              (p/all (mapv #(<encrypt-text-aes aes-key %) texts)))
            (p/then (fn [texts'] (http/json-response nil {:texts texts'})))
            (p/catch (fn [error]
                       (log/warn :db-sync/e2ee-encrypt-failed {:error error})
                       (http/bad-request "encrypt failed"))))))

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
