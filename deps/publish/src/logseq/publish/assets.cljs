(ns logseq.publish.assets
  (:require [clojure.string :as string]
            [logseq.publish.common :as publish-common])
  (:require-macros [logseq.publish.async :refer [js-await]]))

(defn asset-content-type [ext]
  (case (string/lower-case (or ext ""))
    ("png") "image/png"
    ("jpg" "jpeg") "image/jpeg"
    ("gif") "image/gif"
    ("webp") "image/webp"
    ("svg") "image/svg+xml"
    ("bmp") "image/bmp"
    ("avif") "image/avif"
    ("mp4") "video/mp4"
    ("webm") "video/webm"
    ("mov") "video/quicktime"
    ("mp3") "audio/mpeg"
    ("wav") "audio/wav"
    ("ogg") "audio/ogg"
    ("pdf") "application/pdf"
    "application/octet-stream"))

(defn parse-asset-meta-header [request]
  (let [meta-header (.get (.-headers request) "x-asset-meta")]
    (when meta-header
      (try
        (publish-common/normalize-meta (js/JSON.parse meta-header))
        (catch :default _
          nil)))))

(defn handle-post-asset [request env]
  (js-await [auth-header (.get (.-headers request) "authorization")
             token (when (and auth-header (string/starts-with? auth-header "Bearer "))
                     (subs auth-header 7))
             claims (cond
                      (nil? token) nil
                      :else (publish-common/verify-jwt token env))]
            (if (nil? claims)
              (publish-common/unauthorized)
              (let [meta (parse-asset-meta-header request)
                    graph-uuid (get meta :graph)
                    asset-uuid (get meta :asset_uuid)
                    asset-type (get meta :asset_type)
                    checksum (get meta :checksum)]
                (if (or (nil? meta) (string/blank? graph-uuid) (string/blank? asset-uuid) (string/blank? asset-type))
                  (publish-common/bad-request "missing asset metadata")
                  (js-await [body (.arrayBuffer request)
                             r2 (aget env "PUBLISH_R2")
                             r2-key (str "publish/assets/" graph-uuid "/" asset-uuid "." asset-type)
                             ^js existing (.head r2 r2-key)
                             existing-checksum (when existing
                                                 (when-let [meta (.-customMetadata existing)]
                                                   (aget meta "checksum")))
                             content-type (or (get meta :content_type)
                                              (asset-content-type asset-type))
                             put? (not (and existing-checksum checksum (= existing-checksum checksum)))
                             _ (when put?
                                 (.put r2 r2-key body
                                       #js {:httpMetadata #js {:contentType content-type}
                                            :customMetadata #js {:checksum (or checksum "")
                                                                 :owner_sub (aget claims "sub")}}))]
                            (publish-common/json-response {:asset_uuid asset-uuid
                                                           :graph_uuid graph-uuid
                                                           :asset_type asset-type
                                                           :asset_url (str "/asset/" graph-uuid "/" asset-uuid "." asset-type)})))))))
