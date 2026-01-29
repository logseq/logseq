(ns logseq.db-sync.worker.handler.assets
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [logseq.db-sync.common :as common :refer [cors-headers]]
            [logseq.db-sync.worker.http :as http]))

(def ^:private max-asset-size (* 100 1024 1024))

(defn parse-asset-path [path]
  (let [prefix "/assets/"]
    (when (string/starts-with? path prefix)
      (let [rest-path (subs path (count prefix))
            slash-idx (string/index-of rest-path "/")
            graph-id (when (and slash-idx (pos? slash-idx)) (subs rest-path 0 slash-idx))
            file (when (and slash-idx (pos? slash-idx)) (subs rest-path (inc slash-idx)))
            dot-idx (when file (string/last-index-of file "."))
            asset-uuid (when (and dot-idx (pos? dot-idx)) (subs file 0 dot-idx))
            asset-type (when (and dot-idx (pos? dot-idx)) (subs file (inc dot-idx)))]
        (when (and (seq graph-id) (seq asset-uuid) (seq asset-type))
          {:graph-id graph-id
           :asset-uuid asset-uuid
           :asset-type asset-type
           :key (str graph-id "/" asset-uuid "." asset-type)})))))

(defn handle [request ^js env]
  (let [url (js/URL. (.-url request))
        path (.-pathname url)
        method (.-method request)]
    (cond
      (= method "OPTIONS")
      (js/Response. nil #js {:status 204 :headers (cors-headers)})

      :else
      (if-let [{:keys [key asset-type]} (parse-asset-path path)]
        (let [^js bucket (.-LOGSEQ_SYNC_ASSETS env)]
          (if-not bucket
            (http/error-response "missing assets bucket" 500)
            (case method
              "GET"
              (.then (.get bucket key)
                     (fn [^js obj]
                       (if (nil? obj)
                         (http/error-response "not found" 404)
                         (let [metadata (.-httpMetadata obj)
                               content-type (or (.-contentType metadata)
                                                "application/octet-stream")
                               content-encoding (.-contentEncoding metadata)
                               cache-control (.-cacheControl metadata)
                               headers (cond-> {"content-type" content-type
                                                "x-asset-type" asset-type}
                                         (and (string? content-encoding)
                                              (not= content-encoding "null")
                                              (pos? (.-length content-encoding)))
                                         (assoc "content-encoding" content-encoding)
                                         (and (string? cache-control)
                                              (pos? (.-length cache-control)))
                                         (assoc "cache-control" cache-control)
                                         true
                                         (bean/->js))]
                           (js/Response. (.-body obj)
                                         #js {:status 200
                                              :headers (js/Object.assign
                                                        headers
                                                        (cors-headers))})))))

              "PUT"
              (.then (.arrayBuffer request)
                     (fn [buf]
                       (if (> (.-byteLength buf) max-asset-size)
                         (http/error-response "asset too large" 413)
                         (.then (.put bucket
                                      key
                                      buf
                                      #js {:httpMetadata #js {:contentType (or (.get (.-headers request) "content-type")
                                                                               "application/octet-stream")}
                                           :customMetadata #js {:checksum (.get (.-headers request) "x-amz-meta-checksum")
                                                                :type asset-type}})
                                (fn [_]
                                  (http/json-response :assets/put {:ok true} 200))))))

              "DELETE"
              (.then (.delete bucket key)
                     (fn [_]
                       (http/json-response :assets/delete {:ok true} 200)))

              (http/error-response "method not allowed" 405))))
        (http/error-response "invalid asset path" 400)))))
