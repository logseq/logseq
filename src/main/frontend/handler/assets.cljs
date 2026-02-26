(ns ^:no-doc frontend.handler.assets
  (:require [cljs-http-missionary.client :as http]
            [clojure.string :as string]
            [frontend.common.crypt :as crypt]
            [frontend.common.missionary :as c.m]
            [frontend.common.thread-api :as thread-api :refer [def-thread-api]]
            [frontend.config :as config]
            [frontend.fs :as fs]
            [frontend.state :as state]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [logseq.common.config :as common-config]
            [logseq.common.path :as path]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.asset :as db-asset]
            [medley.core :as medley]
            [missionary.core :as m]
            [promesa.core :as p])
  (:import [missionary Cancelled]))

(defn exceed-limit-size?
  "Asset size no more than 100M"
  [^js file]
  (> (.-size file) (* 100 1024 1024)))

(defn alias-enabled?
  []
  (and (util/electron?)
       (:assets/alias-enabled? @state/state)))

(defn clean-path-prefix
  [path]
  (when (string? path)
    (string/replace-first path #"^[.\/\\]*(assets)[\/\\]+" "")))

(defn check-alias-path?
  [path]
  (and (string? path)
       (some-> path
               (clean-path-prefix)
               (string/starts-with? "@"))))

(defn get-alias-dirs
  []
  (:assets/alias-dirs @state/state))

(defn get-alias-by-dir
  [dir]
  (when-let [alias-dirs (and (alias-enabled?) (seq (get-alias-dirs)))]
    (medley/find-first #(= dir (:dir (second %1)))
                       (medley/indexed alias-dirs))))

(defn get-alias-by-name
  [name]
  (when-let [alias-dirs (and (alias-enabled?) (seq (get-alias-dirs)))]
    (medley/find-first #(= name (:name (second %1)))
                       (medley/indexed alias-dirs))))

(defn get-area-block-asset-url
  "Returns asset url for an area block used by pdf assets. This lives in this ns
  because it is used by this dep and needs to be independent from the frontend app"
  [block]
  (when-let [image (:logseq.property.pdf/hl-image block)]
    (str "./assets/" (:block/uuid image) ".png")))

(defn resolve-asset-real-path-url
  [repo rpath]
  (when-let [rpath (and (string? rpath)
                        (string/replace rpath #"^[.\/\\]+" ""))]
    (if config/publishing?
      (str "./" rpath)
      (let [ret (let [rpath (if-not (string/starts-with? rpath common-config/local-assets-dir)
                              (path/path-join common-config/local-assets-dir rpath)
                              rpath)
                      encoded-chars? (boolean (re-find #"(?i)%[0-9a-f]{2}" rpath))
                      rpath (if encoded-chars? (js/decodeURI rpath) rpath)
                      graph-root (config/get-repo-dir repo)
                      has-schema? (string/starts-with? graph-root "file:")]
                  (if has-schema?
                    (path/path-join graph-root rpath)
                    (path/prepend-protocol "file:" (path/path-join graph-root rpath))))]
        ret))))

(defn normalize-asset-resource-url
  "try to convert resource file to url asset link"
  [path]
  (let [protocol-link? (common-config/protocol-path? path)]
    (cond
      protocol-link?
      path

      ;; BUG: avoid double encoding from PDF assets
      (path/absolute? path)
      (if (boolean (re-find #"(?i)%[0-9a-f]{2}" path)) ;; has encoded chars?
        ;; Incoming path might be already URL encoded. from PDF assets
        (path/path-join "file://" (common-util/safe-decode-uri-component path))
        (path/path-join "file://" path))

      :else ;; relative path or alias path
      (some-> (resolve-asset-real-path-url (state/get-current-repo) path)
              (common-util/safe-decode-uri-component)))))

(defn <make-data-url
  [path]
  (let [repo-dir (config/get-repo-dir (state/get-current-repo))]
    (p/let [binary (fs/read-file-raw repo-dir path {})
            blob (js/Blob. (array binary) (clj->js {:type "image"}))]
      (when blob (js/URL.createObjectURL blob)))))

(defn <expand-assets-links-for-db-graph
  "Expand ../assets/ links in custom.css file to blob url.

   Only for db-based graph"
  [css]
  (let [rel-paths (re-seq #"\(['\"]?(\.\./assets/.*?)['\"]?\)" css)
        rel-paths (vec (set (map second rel-paths)))
        fixed-rel-paths (map (fn [p] (path/path-join "./logseq/" p)) rel-paths)]
    (p/let [blob-urls (p/all (map <make-data-url fixed-rel-paths))]
      (reduce (fn [css [rel-path blob-url]]
                (string/replace css rel-path (str "'" blob-url "'")))
              css
              (map vector rel-paths blob-urls)))))

(defn <make-asset-url
  "Make accessible asset url from path.
   If path is absolute url, return it directly.
   If path is relative path, return blob url or file url according to environment."
  ([path] (<make-asset-url path (try (js/URL. path) (catch :default _ nil))))
  ([path ^js js-url]
   ;; path start with "/assets"(editor)
   ;; TODO: Remove compatible for "../assets" related to whiteboards?
   (if config/publishing?
     ;; Relative path needed since assets are not under '/' if published graph is not under '/'
     (string/replace-first path #"^/" "")
     (let [repo (state/get-current-repo)
           repo-dir (config/get-repo-dir repo)
           local-asset? (common-config/local-relative-asset? path)
           ;; Hack for path calculation
           path (string/replace path #"^(\.\.)?/" "./")
           js-url? (not (nil? js-url))]
       (cond
         js-url?
         path                                               ;; just return the original

         (and (alias-enabled?)
              (check-alias-path? path))
         (resolve-asset-real-path-url (state/get-current-repo) path)

         (util/electron?)
         (let [full-path (if local-asset?
                           (path/path-join repo-dir path) path)]
           ;; fullpath will be encoded
           (path/prepend-protocol "file:" full-path))

         :else
         (p/let [binary (fs/read-file-raw repo-dir path {})
                 svg? (string/ends-with? path ".svg")
                 type (if svg? "image/svg+xml" "image")
                 blob (js/Blob. (array binary) (clj->js {:type type}))]
           (when blob (js/URL.createObjectURL blob))))))))

(defn get-file-checksum
  [^js file]
  (-> (if (string? file) file (.arrayBuffer file))
      (p/then db-asset/<get-file-array-buffer-checksum)))

(defn- ->uint8
  [payload]
  (cond
    (instance? js/Uint8Array payload)
    payload

    (instance? js/ArrayBuffer payload)
    (js/Uint8Array. payload)

    (and (exists? js/ArrayBuffer)
         (.isView js/ArrayBuffer payload))
    (js/Uint8Array. (.-buffer payload) (.-byteOffset payload) (.-byteLength payload))

    (array? payload)
    (js/Uint8Array. payload)

    (sequential? payload)
    (js/Uint8Array. (clj->js payload))

    (and (object? payload)
         (= "Buffer" (aget payload "type"))
         (array? (aget payload "data")))
    (js/Uint8Array. (aget payload "data"))

    :else
    (throw (ex-info "unsupported binary payload"
                    {:payload-type (str (type payload))}))))

(defn <get-all-assets
  []
  (when-let [path (config/get-current-repo-assets-root)]
    (p/let [result (p/catch (fs/readdir path {:path-only? true})
                            (constantly nil))]
      (p/all (map (fn [path]
                    (p/let [data (fs/read-file-raw path "" {})]
                      (let [path' (util/node-path.join "assets" (util/node-path.basename path))]
                        [path' data]))) result)))))

(defn ensure-assets-dir!
  [repo]
  (p/let [repo-dir (config/get-repo-dir repo)
          assets-dir "assets"
          _ (fs/mkdir-if-not-exists (path/path-join repo-dir assets-dir))]
    [repo-dir assets-dir]))

(defn get-asset-path
  "Get asset path from filename, ensure assets dir exists"
  [filename]
  (p/let [[repo-dir assets-dir] (ensure-assets-dir! (state/get-current-repo))]
    (path/path-join repo-dir assets-dir filename)))

(defn <get-all-asset-file-paths
  [repo]
  (when-let [path (config/get-repo-assets-root repo)]
    (p/catch (fs/readdir path {:path-only? true})
             (constantly nil))))

(defn <read-asset
  "Throw if asset not found"
  [repo asset-block-id asset-type]
  (let [repo-dir (config/get-repo-dir repo)
        file-path (path/path-join common-config/local-assets-dir
                                  (str asset-block-id "." asset-type))]
    (fs/read-file-raw repo-dir file-path {})))

(defn <get-asset-file-metadata
  [repo asset-block-id asset-type]
  (-> (p/let [file (<read-asset repo asset-block-id asset-type)
              blob (js/Blob. (array file) (clj->js {:type "image"}))
              checksum (get-file-checksum blob)]
        {:checksum checksum})
      (p/catch (constantly nil))))

(defn- asset-transfer-in-progress?
  [progress-entry]
  (let [{:keys [loaded total]} progress-entry]
    (and (number? loaded) (number? total) (pos? total) (not= loaded total))))

(defn should-request-remote-asset-download?
  [repo asset-block file-ready? progress]
  (let [asset-uuid (:block/uuid asset-block)
        asset-type (:logseq.property.asset/type asset-block)
        external-url (:logseq.property.asset/external-url asset-block)
        remote-metadata (:logseq.property.asset/remote-metadata asset-block)
        progress-entry (get progress (str asset-uuid))]
    (and (seq repo)
         remote-metadata
         asset-uuid
         (seq asset-type)
         (string/blank? external-url)
         (not file-ready?)
         (not (asset-transfer-in-progress? progress-entry)))))

(defn maybe-request-remote-asset-download!
  [repo asset-block file-ready?]
  (let [progress-atom (get @state/state :rtc/asset-upload-download-progress)
        progress (get (or (some-> progress-atom deref) {}) repo)]
    (when (should-request-remote-asset-download? repo asset-block file-ready? progress)
      (state/<invoke-db-worker
       :thread-api/db-sync-request-asset-download
       repo
       (:block/uuid asset-block))
      true)))

(defn <write-asset
  [repo asset-block-id asset-type data]
  (let [asset-block-id-str (str asset-block-id)
        file-name (str asset-block-id-str "." asset-type)]
    (p/do!
     (fs/write-asset-file! repo file-name data)
     (state/update-state!
      :assets/asset-file-write-finish
      (fn [m] (assoc-in m [repo asset-block-id-str] (common-util/time-ms)))))))

(comment
  ;; en/decrypt assets
  (def repo (state/get-current-repo))
  (p/let [aes-key (crypt/<generate-aes-key)
          asset (<read-asset repo "6903201e-9573-4914-ae88-7d3f1d095d1f" "png")
          encrypted-asset (crypt/<encrypt-uint8array aes-key asset)
          decrypted-asset (crypt/<decrypt-uint8array aes-key encrypted-asset)]
    (def asset asset)
    (def xxxx encrypted-asset)
    (prn :decrypted (.-length decrypted-asset)
         :origin (.-length asset))))

(defn <unlink-asset
  [repo asset-block-id asset-type]
  (let [file-path (path/path-join (config/get-repo-dir repo)
                                  common-config/local-assets-dir
                                  (str asset-block-id "." asset-type))]
    (p/catch (fs/unlink! repo file-path {}) (constantly nil))))

(defn new-task--rtc-upload-asset
  [repo aes-key asset-block-uuid-str asset-type checksum put-url & {:keys [extra-headers]}]
  (assert (and asset-type checksum))
  (m/sp
    (let [asset-file (try (c.m/<? (<read-asset repo asset-block-uuid-str asset-type))
                          (catch :default e
                            (log/info :read-asset e)
                            (throw (ex-info "read-asset failed" {:type :rtc.exception/read-asset-failed} e))))
          asset-file (if aes-key
                       (->uint8 asset-file)
                       asset-file)
          asset-file* (if (not aes-key)
                        asset-file
                        (ldb/write-transit-str
                         (c.m/<? (crypt/<encrypt-uint8array aes-key asset-file))))
          *progress-flow (atom nil)
          headers (merge extra-headers
                         {"x-amz-meta-checksum" checksum
                          "x-amz-meta-type" asset-type})
          http-task (http/put put-url {:headers headers
                                       :body asset-file*
                                       :with-credentials? false
                                       :*progress-flow *progress-flow})]
      (c.m/run-task :upload-asset-progress
        (m/reduce (fn [_ v]
                    (state/update-state!
                     :rtc/asset-upload-download-progress
                     (fn [m] (assoc-in m [repo asset-block-uuid-str] v))))
                  @*progress-flow)
        :succ (constantly nil))
      (let [{:keys [status] :as r} (m/? http-task)]
        (when-not (http/unexceptional-status? status)
          (throw (ex-info "upload-asset failed"
                          {:type :rtc.exception/upload-asset-failed :data (dissoc r :body)})))))))

(defn new-task--rtc-download-asset
  [repo aes-key asset-block-uuid-str asset-type get-url & {:keys [extra-headers]}]
  (m/sp
    (let [*progress-flow (atom nil)
          http-task (http/get get-url {:with-credentials? false
                                       :response-type :array-buffer
                                       :headers extra-headers
                                       :*progress-flow *progress-flow})
          progress-canceler
          (c.m/run-task :download-asset-progress
            (m/reduce (fn [_ v]
                        (state/update-state!
                         :rtc/asset-upload-download-progress
                         (fn [m] (assoc-in m [repo asset-block-uuid-str] v))))
                      @*progress-flow)
            :succ (constantly nil))]
      (try
        (let [{:keys [status body] :as r} (m/? http-task)]
          (if-not (http/unexceptional-status? status)
            (throw (ex-info "download asset failed"
                            {:type :rtc.exception/download-asset-failed :data (dissoc r :body)}))
            (let [asset-file
                  (if (not aes-key)
                    body
                    (try
                      (let [asset-file-untransited (ldb/read-transit-str (.decode (js/TextDecoder.) body))]
                        (c.m/<? (crypt/<decrypt-uint8array aes-key asset-file-untransited)))
                      (catch js/SyntaxError _
                        body)
                      (catch :default e
                         ;; if decrypt failed, write origin-body
                        (if (= "decrypt-uint8array" (ex-message e))
                          body
                          (throw e)))))]
              (c.m/<? (<write-asset repo asset-block-uuid-str asset-type asset-file))
              nil)))
        (catch Cancelled e
          (progress-canceler)
          (throw e))))))

(def-thread-api :thread-api/unlink-asset
  [repo asset-block-id asset-type]
  (<unlink-asset repo asset-block-id asset-type))

(def-thread-api :thread-api/get-all-asset-file-paths
  [repo]
  (<get-all-asset-file-paths repo))

(def-thread-api :thread-api/get-asset-file-metadata
  [repo asset-block-id asset-type]
  (<get-asset-file-metadata repo asset-block-id asset-type))

(def-thread-api :thread-api/rtc-upload-asset
  [repo exported-aes-key asset-block-uuid-str asset-type checksum put-url & {:as opts}]
  (m/sp
    (let [aes-key (when exported-aes-key (c.m/<? (crypt/<import-aes-key exported-aes-key)))]
      (m/? (new-task--rtc-upload-asset repo aes-key asset-block-uuid-str asset-type checksum put-url opts)))))

(def-thread-api :thread-api/rtc-download-asset
  [repo exported-aes-key asset-block-uuid-str asset-type get-url & {:as opts}]
  (m/sp
    (let [aes-key (when exported-aes-key (c.m/<? (crypt/<import-aes-key exported-aes-key)))]
      (m/? (new-task--rtc-download-asset repo aes-key asset-block-uuid-str asset-type get-url opts)))))

(comment
  ;; read asset
  (p/let [repo "logseq_db_demo"
          ;; Existing asset block's id
          asset-block-id-str "672c5a1d-8171-4259-9f35-470c3c67e37f"
          asset-type "png"
          data (<read-asset repo asset-block-id-str asset-type)]
    (js/console.dir data))

  ;; write asset
  (p/let [repo "logseq_db_demo"
          ;; Existing asset block's id
          asset-block-id-str "672c5a1d-8171-4259-9f35-470c3c67e37f"
          asset-type "png"
          data (<read-asset repo asset-block-id-str asset-type)
          new-asset-id (random-uuid)
          result (<write-asset repo new-asset-id asset-type data)]
    (js/console.dir result)))
