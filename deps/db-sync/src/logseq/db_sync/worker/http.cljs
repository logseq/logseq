(ns logseq.db-sync.worker.http
  (:require [logseq.db-sync.common :as common]
            [logseq.db-sync.malli-schema :as db-sync-schema]
            [logseq.db-sync.worker.coerce :as coerce]))

(defn coerce-http-request [schema-key body]
  (if-let [coercer (get db-sync-schema/http-request-coercers schema-key)]
    (let [coerced (coerce/coerce coercer body {:schema schema-key :dir :request})]
      (when-not (= coerced coerce/invalid-coerce)
        coerced))
    body))

(defn json-response
  ([schema-key data] (json-response schema-key data 200))
  ([schema-key data status]
   (if-let [coercer (get db-sync-schema/http-response-coercers schema-key)]
     (let [coerced (coerce/coerce coercer data {:schema schema-key :dir :response})]
       (if (= coerced coerce/invalid-coerce)
         (do
           (js/console.error "DEBUG json-response coercion FAILED for" (pr-str schema-key) "data:" (pr-str data))
           (common/json-response
            {:error "server error"
             :debug-coercion-failed (pr-str schema-key)
             :debug-data (pr-str data)}
            500))
         (common/json-response coerced status)))
     (common/json-response data status))))

(defn error-response [message status]
  (json-response :error {:error message} status))

(defn bad-request [message]
  (error-response message 400))

(defn unauthorized []
  (error-response "unauthorized" 401))

(defn forbidden []
  (error-response "forbidden" 403))

(defn not-found []
  (error-response "not found" 404))
