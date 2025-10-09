(ns ^:no-doc frontend.handler.assets
  (:require [cljs-http-missionary.client :as http]
            [clojure.string :as string]
            [frontend.common.missionary :as c.m]
            [frontend.common.thread-api :as thread-api :refer [def-thread-api]]
            [frontend.config :as config]
            [frontend.fs :as fs]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.common.config :as common-config]
            [logseq.common.path :as path]
            [logseq.common.util :as common-util]
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

(defn resolve-asset-real-path-url
  [repo rpath]
  (when-let [rpath (and (string? rpath)
                        (string/replace rpath #"^[.\/\\]+" ""))]
    (if config/publishing?
      (str "./" rpath)
      (let [ret (let [rpath          (if-not (string/starts-with? rpath common-config/local-assets-dir)
                                       (path/path-join common-config/local-assets-dir rpath)
                                       rpath)
                      encoded-chars? (boolean (re-find #"(?i)%[0-9a-f]{2}" rpath))
                      rpath          (if encoded-chars? (js/decodeURI rpath) rpath)
                      graph-root     (config/get-repo-dir repo)
                      has-schema?    (string/starts-with? graph-root "file:")]

                  (if-let [[rpath' alias]
                           (and (alias-enabled?)
                                (let [rpath' (string/replace rpath (re-pattern (str "^" common-config/local-assets-dir "[\\/\\\\]+")) "")]
                                  (and
                                   (string/starts-with? rpath' "@")
                                   (some->> (and (seq (get-alias-dirs))
                                                 (second (get-alias-by-name (second (re-find #"^@([^\/]+)" rpath')))))
                                            (vector rpath')))))]

                    (str "assets://" (string/replace rpath' (str "@" (:name alias)) (:dir alias)))

                    (if has-schema?
                      (path/path-join graph-root rpath)
                      (path/prepend-protocol "file:" (path/path-join graph-root rpath)))))]
        ret))))

(defn normalize-asset-resource-url
  "try to convert resource file to url asset link"
  [path]
  (let [protocol-link? (->> #{"file://" "http://" "https://" "assets://"}
                            (some #(string/starts-with? (string/lower-case path) %)))]
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
      (resolve-asset-real-path-url (state/get-current-repo) path))))

(defn get-matched-alias-by-ext
  [ext]
  (when-let [ext (and (alias-enabled?)
                      (string? ext)
                      (not (string/blank? ext))
                      (util/safe-lower-case ext))]

    (let [alias (medley/find-first
                 (fn [{:keys [exts]}]
                   (some #(string/ends-with? ext %) exts))
                 (get-alias-dirs))]
      alias)))

(defn get-asset-file-link
  "Link text for inserting to markdown/org"
  [format url file-name image?]
  (let [pdf?   (and url (string/ends-with? (string/lower-case url) ".pdf"))
        media? (and url (or (config/ext-of-audio? url)
                            (config/ext-of-video? url)))]
    (case (keyword format)
      :markdown (util/format (str (when (or image? media? pdf?) "!") "[%s](%s)") file-name url)
      :org (if image?
             (util/format "[[%s]]" url)
             (util/format "[[%s][%s]]" url file-name))
      nil)))

(defn <make-data-url
  [path]
  (let [repo-dir (config/get-repo-dir (state/get-current-repo))]
    (p/let [binary (fs/read-file repo-dir path {})
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
  "Make asset URL for UI element, to fill img.src"
  [path] ;; path start with "/assets"(editor) or compatible for "../assets"(whiteboards)
  (if config/publishing?
    ;; Relative path needed since assets are not under '/' if published graph is not under '/'
    (string/replace-first path #"^/" "")
    (let [repo      (state/get-current-repo)
          repo-dir  (config/get-repo-dir repo)
          ;; Hack for path calculation
          path      (string/replace path #"^(\.\.)?/" "./")
          full-path (path/path-join repo-dir path)
          data-url? (string/starts-with? path "data:")]
      (cond
        data-url?
        path ;; just return the original

        (and (alias-enabled?)
             (check-alias-path? path))
        (resolve-asset-real-path-url (state/get-current-repo) path)

        (util/electron?)
        ;; fullpath will be encoded
        (path/prepend-protocol "file:" full-path)

        ;(mobile-util/native-platform?)
        ;(mobile-util/convert-file-src full-path)

        (config/db-based-graph? (state/get-current-repo)) ; memory fs
        (p/let [binary (fs/read-file repo-dir path {})
                blob (js/Blob. (array binary) (clj->js {:type "image"}))]
          (when blob (js/URL.createObjectURL blob)))))))

(defn get-file-checksum
  [^js/Blob file]
  (-> (.arrayBuffer file)
      (.then db-asset/<get-file-array-buffer-checksum)))

(defn <get-all-assets
  []
  (when-let [path (config/get-current-repo-assets-root)]
    (p/let [result (p/catch (fs/readdir path {:path-only? true})
                            (constantly nil))]
      (p/all (map (fn [path]
                    (p/let [data (fs/read-file path "" {})]
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
  [repo asset-block-id asset-type]
  (let [repo-dir (config/get-repo-dir repo)
        file-path (path/path-join common-config/local-assets-dir
                                  (str asset-block-id "." asset-type))]
    (fs/read-file repo-dir file-path {})))

(defn <get-asset-file-metadata
  [repo asset-block-id asset-type]
  (-> (p/let [file (<read-asset repo asset-block-id asset-type)
              blob (js/Blob. (array file) (clj->js {:type "image"}))
              checksum (get-file-checksum blob)]
        {:checksum checksum})
      (p/catch (constantly nil))))

(defn <write-asset
  [repo asset-block-id asset-type data]
  (let [asset-block-id-str (str asset-block-id)
        repo-dir (config/get-repo-dir repo)
        file-path (path/path-join common-config/local-assets-dir
                                  (str asset-block-id-str "." asset-type))]
    (p/do!
     (fs/write-plain-text-file! repo repo-dir file-path data {})
     (state/update-state!
      :assets/asset-file-write-finish
      (fn [m] (assoc-in m [repo asset-block-id-str] (common-util/time-ms)))))))

(defn <unlink-asset
  [repo asset-block-id asset-type]
  (let [file-path (path/path-join (config/get-repo-dir repo)
                                  common-config/local-assets-dir
                                  (str asset-block-id "." asset-type))]
    (p/catch (fs/unlink! repo file-path {}) (constantly nil))))

(defn new-task--rtc-upload-asset
  [repo asset-block-uuid-str asset-type checksum put-url]
  (assert (and asset-type checksum))
  (m/sp
    (let [asset-file (c.m/<? (<read-asset repo asset-block-uuid-str asset-type))
          *progress-flow (atom nil)
          http-task (http/put put-url {:headers {"x-amz-meta-checksum" checksum
                                                 "x-amz-meta-type" asset-type}
                                       :body asset-file
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
          {:ex-data {:type :rtc.exception/upload-asset-failed :data (dissoc r :body)}})))))

(defn new-task--rtc-download-asset
  [repo asset-block-uuid-str asset-type get-url]
  (m/sp
    (let [*progress-flow (atom nil)
          http-task (http/get get-url {:with-credentials? false
                                       :response-type :array-buffer
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
            {:ex-data {:type :rtc.exception/download-asset-failed :data (dissoc r :body)}}
            (do (c.m/<? (<write-asset repo asset-block-uuid-str asset-type body))
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
  [repo asset-block-uuid-str asset-type checksum put-url]
  (new-task--rtc-upload-asset repo asset-block-uuid-str asset-type checksum put-url))

(def-thread-api :thread-api/rtc-download-asset
  [repo asset-block-uuid-str asset-type get-url]
  (new-task--rtc-download-asset repo asset-block-uuid-str asset-type get-url))

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
