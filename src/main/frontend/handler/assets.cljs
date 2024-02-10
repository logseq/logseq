(ns ^:no-doc frontend.handler.assets
  (:require [frontend.state :as state]
            [medley.core :as medley]
            [frontend.util :as util]
            [frontend.config :as config]
            [frontend.mobile.util :as mobile-util]
            [logseq.graph-parser.config :as gp-config]
            [clojure.string :as string]
            [logseq.common.path :as path]
            [logseq.graph-parser.util :as gp-util]))

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
     #"^(file://|assets://)" gp-config/capacitor-protocol-with-prefix)))

(defn resolve-asset-real-path-url
  [repo rpath]
  (when-let [rpath (and (string? rpath)
                        (string/replace rpath #"^[.\/\\]+" ""))]
    (if config/publishing?
      (str "./" rpath)
      (let [ret (let [rpath          (if-not (string/starts-with? rpath gp-config/local-assets-dir)
                                       (path/path-join gp-config/local-assets-dir rpath)
                                       rpath)
                      encoded-chars? (boolean (re-find #"(?i)%[0-9a-f]{2}" rpath))
                      rpath          (if encoded-chars? (js/decodeURI rpath) rpath)
                      graph-root     (config/get-repo-dir repo)
                      has-schema?    (string/starts-with? graph-root "file:")]

                  (if-let [[rpath' alias]
                           (and (alias-enabled?)
                                (let [rpath' (string/replace rpath (re-pattern (str "^" gp-config/local-assets-dir "[\\/\\\\]+")) "")]
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
        (path/path-join "file://" (gp-util/safe-decode-uri-component path))
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

(comment
 (normalize-asset-resource-url "https://x.com/a.pdf")
 (normalize-asset-resource-url "./a/b.pdf")
 (normalize-asset-resource-url "assets/a/b.pdf")
 (normalize-asset-resource-url "@图书/a/b.pdf"))
