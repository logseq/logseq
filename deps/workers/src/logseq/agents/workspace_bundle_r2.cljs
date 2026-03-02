(ns logseq.agents.workspace-bundle-r2
  (:require [clojure.string :as string]
            [promesa.core :as p]))

(defn- non-empty-str
  [value]
  (when (string? value)
    (let [trimmed (string/trim value)]
      (when-not (string/blank? trimmed)
        trimmed))))

(defn- bucket-binding
  [^js env]
  (aget env "BACKUP_BUCKET"))

(defn- normalize-metadata
  [metadata]
  (->> metadata
       (reduce-kv (fn [acc k v]
                    (if (and (some? k) (string? v))
                      (assoc acc (name k) v)
                      acc))
                  {})
       (not-empty)))

(defn <put-bundle-base64!
  [^js env object-key bundle-base64 metadata]
  (let [bucket (bucket-binding env)
        object-key (non-empty-str object-key)
        bundle-base64 (non-empty-str bundle-base64)
        metadata (normalize-metadata metadata)]
    (cond
      (nil? bucket)
      (p/rejected (ex-info "missing BACKUP_BUCKET binding"
                           {:reason :missing-backup-bucket}))

      (not (string? object-key))
      (p/rejected (ex-info "invalid object key"
                           {:reason :invalid-object-key
                            :object-key object-key}))

      (not (string? bundle-base64))
      (p/rejected (ex-info "invalid bundle payload"
                           {:reason :invalid-bundle-payload}))

      :else
      (let [opts (cond-> {:httpMetadata {:contentType "text/plain; charset=utf-8"}}
                   (map? metadata) (assoc :customMetadata metadata))]
        (p/let [_ (.put bucket object-key bundle-base64 (clj->js opts))]
          {:object-key object-key
           :bundle-base64 bundle-base64
           :byte-size (count bundle-base64)})))))

(defn <get-bundle-base64!
  [^js env object-key]
  (let [bucket (bucket-binding env)
        object-key (non-empty-str object-key)]
    (cond
      (nil? bucket)
      (p/rejected (ex-info "missing BACKUP_BUCKET binding"
                           {:reason :missing-backup-bucket}))

      (not (string? object-key))
      (p/rejected (ex-info "invalid object key"
                           {:reason :invalid-object-key
                            :object-key object-key}))

      :else
      (p/let [object (.get bucket object-key)]
        (if-not object
          nil
          (p/let [bundle-base64 (.text object)]
            {:object-key object-key
             :bundle-base64 (non-empty-str bundle-base64)
             :byte-size (count (or bundle-base64 ""))}))))))
