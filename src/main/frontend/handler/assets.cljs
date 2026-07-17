(ns ^:no-doc frontend.handler.assets
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.fs :as fs]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.melange.bridge.common.api :as melange-common]
            [logseq.melange.bridge.common.log :as common-log]
            [logseq.melange.bridge.db.asset :as db-asset]
            [medley.core :as medley]
            [promesa.core :as p]))

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

(defn- windows-drive-absolute-path?
  [path]
  (and (string? path)
       (boolean (re-find #"^[A-Za-z]:[\/\\]" path))))

(defn- protect-windows-drive-in-assets-path
  [path]
  (cond-> path
    (windows-drive-absolute-path? path)
    (string/replace-first #":" "/logseq__colon/")))

(defn asset-protocol-url->media-url
  [url]
  (if (and (melange-common/local-protocol-asset? url)
           (not (util/electron?)))
    (-> url
        (melange-common/remove-asset-protocol)
        (string/replace-first "/logseq__colon/" ":/"))
    url))

(defn resolve-asset-real-path-url
  [repo rpath]
  (when-let [rpath (and (string? rpath)
                        (string/replace rpath #"^[.\/\\]+" ""))]
    (if config/publishing?
      (str "./" rpath)
      (let [ret (let [rpath (if-not (string/starts-with? rpath melange-common/local-assets-dir)
                              (melange-common/path-join melange-common/local-assets-dir (to-array [rpath]))
                              rpath)
                      encoded-chars? (boolean (re-find #"(?i)%[0-9a-f]{2}" rpath))
                      rpath (if encoded-chars? (js/decodeURI rpath) rpath)
                      graph-root (config/get-repo-dir repo)
                      graph-root (if (util/electron?)
                                   (protect-windows-drive-in-assets-path graph-root)
                                   graph-root)
                      has-schema? (string/starts-with? graph-root "file:")
                      protocol (if (util/electron?) "assets:" "file:")]
                  (if has-schema?
                    (melange-common/path-join graph-root (to-array [rpath]))
                    (melange-common/prepend-protocol protocol (melange-common/path-join graph-root (to-array [rpath])))))]
        ret))))

(defn normalize-asset-resource-url
  "try to convert resource file to url asset link"
  [path]
  (let [windows-drive-path? (windows-drive-absolute-path? path)
        protocol-link? (and (not windows-drive-path?)
                            (melange-common/protocol-path? path))]
    (cond
      protocol-link?
      path

      ;; BUG: avoid double encoding from PDF assets
      (or (melange-common/absolute? path)
          windows-drive-path?)
      (let [protocol (if (util/electron?) "assets://" "file://")
            path (if (util/electron?)
                   (protect-windows-drive-in-assets-path path)
                   path)]
        (if (boolean (re-find melange-common/url-encoded-pattern path)) ;; has encoded chars?
          ;; Incoming path might be already URL encoded. from PDF assets
          (melange-common/path-join
           protocol
           (to-array [(melange-common/safe-decode-uri-component
                       path
                       #(common-log/error :decode-uri-component-failed %))]))
          (melange-common/path-join protocol (to-array [path]))))

      :else ;; relative path or alias path
      (when-some [resolved (resolve-asset-real-path-url (state/get-current-repo) path)]
        (melange-common/safe-decode-uri-component
         resolved
         #(common-log/error :decode-uri-component-failed %))))))

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
        fixed-rel-paths (map (fn [p] (melange-common/path-join "./logseq/" (to-array [p]))) rel-paths)]
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
           local-asset? (melange-common/local-relative-asset? path)
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
                            (melange-common/path-join repo-dir (to-array [path])) path)]
            ;; fullpath will be encoded
            (melange-common/prepend-protocol "assets:" (protect-windows-drive-in-assets-path full-path)))

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

(defn- field-value
  [payload field-name]
  (or (get payload field-name)
      (get payload (keyword field-name))
      (when (object? payload)
        (aget payload field-name))))

(defn- indexed-object->array
  [payload]
  (let [keys (->> (js/Object.keys payload)
                  (js->clj)
                  (filter #(re-matches #"\d+" %))
                  (sort-by #(js/parseInt % 10)))]
    (when (seq keys)
      (clj->js (map #(aget payload %) keys)))))

(defn- indexed-map->array
  [payload]
  (let [keys (->> (keys payload)
                  (filter #(re-matches #"\d+" (str %)))
                  (sort-by #(js/parseInt (str %) 10)))]
    (when (seq keys)
      (clj->js (map #(get payload %) keys)))))

(defn ->uint8
  [payload]
  (cond
    (and (exists? js/Blob)
         (instance? js/Blob payload))
    payload

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

    (and (= "Buffer" (field-value payload "type"))
         (some? (field-value payload "data")))
    (->uint8 (field-value payload "data"))

    (map? payload)
    (if-let [data (indexed-map->array payload)]
      (js/Uint8Array. data)
      (throw (ex-info "unsupported binary payload"
                      {:payload-type (str (type payload))
                       :keys (mapv str (keys payload))})))

    (and (object? payload)
         (number? (aget payload "length")))
    (js/Uint8Array. payload)

    (object? payload)
    (if-let [data (indexed-object->array payload)]
      (js/Uint8Array. data)
      (throw (ex-info "unsupported binary payload"
                      {:payload-type (str (type payload))
                       :object-tag (try
                                     (.call (.-toString (.-prototype js/Object)) payload)
                                     (catch :default _ nil))
                       :keys (try
                               (js->clj (js/Object.keys payload))
                               (catch :default _ nil))})))

    :else
    (throw (ex-info "unsupported binary payload"
                    {:payload-type (str (type payload))}))))

(defn <get-all-assets
  []
  (if-let [path (config/get-current-repo-assets-root)]
    (p/let [exists? (p/catch (fs/stat path)
                             (constantly nil))]
      (if exists?
        (p/let [result (fs/readdir path {:path-only? true})]
          (p/all (map (fn [path]
                        (p/let [data (fs/read-file-raw path "" {})]
                          (let [path' (util/node-path.join "assets" (util/node-path.basename path))]
                            [path' data]))) result)))
        (p/resolved [])))
    (p/resolved [])))

(defn ensure-assets-dir!
  [repo]
  (p/let [repo-dir (config/get-repo-dir repo)
          assets-dir "assets"
          _ (fs/mkdir-if-not-exists (melange-common/path-join repo-dir (to-array [assets-dir])))]
    [repo-dir assets-dir]))

(defn get-asset-path
  "Get asset path from filename, ensure assets dir exists"
  [filename]
  (p/let [[repo-dir assets-dir] (ensure-assets-dir! (state/get-current-repo))]
    (melange-common/path-join repo-dir (to-array [assets-dir filename]))))

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
