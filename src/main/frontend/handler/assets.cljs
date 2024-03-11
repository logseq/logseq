(ns ^:no-doc frontend.handler.assets
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.fs :as fs]
            [frontend.fs.nfs :as nfs]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.common.config :as common-config]
            [logseq.common.path :as path]
            [logseq.common.util :as common-util]
            [medley.core :as medley]
            [promesa.core :as p]))

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

(defn- convert-platform-protocol
  [full-path]

  (cond-> full-path
    (and (string? full-path)
         (mobile-util/native-platform?))
    (string/replace-first
     #"^(file://|assets://)" common-config/capacitor-protocol-with-prefix)))

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
        (convert-platform-protocol ret)))))

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

(defonce *assets-url-cache (atom {}))

(defn make-asset-url
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
        (path/prepend-protocol "assets:" full-path)

        (mobile-util/native-platform?)
        (mobile-util/convert-file-src full-path)

        (config/db-based-graph? (state/get-current-repo)) ; memory fs
        (p/let [binary (fs/read-file repo-dir path {})
                blob (js/Blob. (array binary) (clj->js {:type "image"}))]
          (when blob (js/URL.createObjectURL blob)))

        :else ;; nfs
        (let [handle-path (str "handle/" full-path)
              cached-url  (get @*assets-url-cache (keyword handle-path))]
          (if cached-url
            (p/resolved cached-url)
            ;; Loading File from handle cache
            ;; Use await file handle, to ensure all handles are loaded.
            (p/let [handle (nfs/await-get-nfs-file-handle repo handle-path)
                    file   (and handle (.getFile handle))]
              (when file
                (p/let [url (js/URL.createObjectURL file)]
                  (swap! *assets-url-cache assoc (keyword handle-path) url)
                  url)))))))))
