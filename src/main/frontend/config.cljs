(ns frontend.config
  "App config and fns built on top of configuration"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.crypt :as crypt]
            [goog.crypt.Md5]
            [logseq.common.config :as common-config]
            [logseq.common.path :as path]
            [logseq.common.util :as common-util]
            [logseq.db.sqlite.util :as sqlite-util]
            [shadow.resource :as rc]))

(goog-define DEV-RELEASE false)
(defonce dev-release? DEV-RELEASE)
(defonce dev? ^boolean (or dev-release? goog.DEBUG))

(defonce publishing? common-config/PUBLISHING)

(goog-define REVISION "unknown")
(defonce revision REVISION)

(goog-define ENABLE-FILE-SYNC-PRODUCTION false)

;; this is a feature flag to enable the account tab
;; when it launches (when pro plan launches) it should be removed
(def ENABLE-SETTINGS-ACCOUNT-TAB false)

(if ENABLE-FILE-SYNC-PRODUCTION
  (do (def FILE-SYNC-PROD? true)
      (def LOGIN-URL
        "https://logseq-prod.auth.us-east-1.amazoncognito.com/login?client_id=3c7np6bjtb4r1k1bi9i049ops5&response_type=code&scope=email+openid+phone&redirect_uri=logseq%3A%2F%2Fauth-callback")
      (def API-DOMAIN "api.logseq.com")
      (def WS-URL "wss://ws.logseq.com/file-sync?graphuuid=%s")
      (def COGNITO-IDP "https://cognito-idp.us-east-1.amazonaws.com/")
      (def COGNITO-CLIENT-ID "69cs1lgme7p8kbgld8n5kseii6")
      (def REGION "us-east-1")
      (def USER-POOL-ID "us-east-1_dtagLnju8")
      (def IDENTITY-POOL-ID "us-east-1:d6d3b034-1631-402b-b838-b44513e93ee0")
      (def OAUTH-DOMAIN "logseq-prod.auth.us-east-1.amazoncognito.com")
      (def CONNECTIVITY-TESTING-S3-URL "https://logseq-connectivity-testing-prod.s3.us-east-1.amazonaws.com/logseq-connectivity-testing"))

  (do (def FILE-SYNC-PROD? false)
      (def LOGIN-URL
        "https://logseq-test2.auth.us-east-2.amazoncognito.com/login?client_id=3ji1a0059hspovjq5fhed3uil8&response_type=code&scope=email+openid+phone&redirect_uri=logseq%3A%2F%2Fauth-callback")
      (def API-DOMAIN "api-dev.logseq.com")
      (def WS-URL "wss://ws-dev.logseq.com/file-sync?graphuuid=%s")
      (def COGNITO-IDP "https://cognito-idp.us-east-2.amazonaws.com/")
      (def COGNITO-CLIENT-ID "1qi1uijg8b6ra70nejvbptis0q")
      (def REGION "us-east-2")
      (def USER-POOL-ID "us-east-2_kAqZcxIeM")
      (def IDENTITY-POOL-ID "us-east-2:cc7d2ad3-84d0-4faf-98fe-628f6b52c0a5")
      (def OAUTH-DOMAIN "logseq-test2.auth.us-east-2.amazoncognito.com")
      (def CONNECTIVITY-TESTING-S3-URL "https://logseq-connectivity-testing-prod.s3.us-east-1.amazonaws.com/logseq-connectivity-testing")))

(goog-define ENABLE-RTC-SYNC-PRODUCTION false)
(if ENABLE-RTC-SYNC-PRODUCTION
  (def RTC-WS-URL "wss://ws.logseq.com/rtc-sync?token=%s")
  (def RTC-WS-URL "wss://ws-dev.logseq.com/rtc-sync?token=%s"))
;; Feature flags
;; =============

(goog-define ENABLE-PLUGINS true)
(defonce feature-plugin-system-on? ENABLE-PLUGINS)

;; Desktop only as other platforms requires better understanding of their
;; multi-graph workflows and optimal place for a "global" dir
(def global-config-enabled? util/electron?)

;; User level configuration for whether plugins are enabled
(defonce lsp-enabled?
  (and util/plugin-platform?
       (not (false? feature-plugin-system-on?))
       (state/lsp-enabled?-or-theme)))

(defn plugin-config-enabled?
  []
  (and lsp-enabled? (global-config-enabled?)))

;; :TODO: How to do this?
;; (defonce desktop? ^boolean goog.DESKTOP)

;; ============

(def app-name common-config/app-name)
(def website
  (if dev?
    "http://localhost:3000"
    (util/format "https://%s.com" app-name)))

;; FIXME:
(def app-website
  (if dev?
    "http://localhost:3001"
    (util/format "https://%s.com" app-name)))

(def asset-domain (util/format "https://asset.%s.com"
                               app-name))

;; TODO: Remove this, switch to lazy loader
(defn asset-uri
  [path]
  (cond
    publishing?
    path

    (or (util/file-protocol?) (util/capacitor-new?))
    (string/replace path "/static/" "./")

    :else
    (if dev? path
        (str asset-domain path))))

(def markup-formats
  #{:org :md :markdown :asciidoc :adoc :rst})

(def doc-formats
  #{:doc :docx :xls :xlsx :ppt :pptx :one :pdf :epub})

(def image-formats
  #{:png :jpg :jpeg :bmp :gif :webp :svg :heic})

(def audio-formats
  #{:mp3 :ogg :mpeg :wav :m4a :flac :wma :aac})

(def video-formats
  #{:mp4 :webm :mov :flv :avi :mkv})

(def media-formats (set/union (common-config/img-formats) audio-formats video-formats))

(defn extname-of-supported?
  ([input] (extname-of-supported?
            input
            [image-formats doc-formats audio-formats
             video-formats markup-formats
             (common-config/text-formats)]))
  ([input formats]
   (when-let [input (some->
                     (cond-> input
                       (and (string? input)
                            (not (string/blank? input)))
                       (string/replace-first "." ""))
                     (util/safe-lower-case)
                     (keyword))]
     (boolean
      (some
       (fn [s]
         (contains? s input))
       formats)))))

(defn ext-of-video?
  ([s] (ext-of-video? s true))
  ([s html5?]
   (when-let [s (and (string? s) (util/get-file-ext s))]
     (let [video-formats' (cond-> video-formats
                            html5? (disj :mkv))]
       (extname-of-supported? s [video-formats'])))))

(defn ext-of-audio?
  ([s] (ext-of-audio? s true))
  ([s html5?]
   (when-let [s (and (string? s) (util/get-file-ext s))]
     (let [audio-formats' (cond-> audio-formats
                            html5? (disj :wma :ogg))]
       (extname-of-supported? s [audio-formats'])))))

(defn ext-of-image?
  [s]
  (when-let [s (and (string? s) (util/get-file-ext s))]
    (extname-of-supported? s [image-formats])))

(def mobile?
  "Triggering condition: Mobile phones
   *** Warning!!! ***
   For UX logic only! Don't use for FS logic
   iPad / Android Pad doesn't trigger!

   Same as config/mobile?"
  (when-not util/node-test?
    (util/safe-re-find #"Mobi" js/navigator.userAgent)))

;; TODO: protocol design for future formats support

(defn get-block-pattern
  [format]
  (common-config/get-block-pattern (or format (state/get-preferred-format))))

(defn get-hr
  [format]
  (let [format (or format (keyword (state/get-preferred-format)))]
    (case format
      :org
      "-----"
      :markdown
      "---"
      "")))

(defn get-bold
  [format]
  (let [format (or format (keyword (state/get-preferred-format)))]
    (case format
      :org
      "*"
      :markdown
      "**"
      "")))

(defn get-italic
  [format]
  (let [format (or format (keyword (state/get-preferred-format)))]
    (case format
      :org
      "/"
      :markdown
      "*"
      "")))
(defn get-underline
  [format]
  (let [format (or format (keyword (state/get-preferred-format)))]
    (case format
      :org
      "_"
      :markdown ;; no underline for markdown
      ""
      "")))
(defn get-strike-through
  [format]
  (let [format (or format (keyword (state/get-preferred-format)))]
    (case format
      :org
      "+"
      :markdown
      "~~"
      "")))

(defn get-highlight
  [format]
  (case format
    :org
    "^^"
    :markdown
    "=="
    ""))

(defn get-code
  [format]
  (let [format (or format (keyword (state/get-preferred-format)))]
    (case format
      :org
      "~"
      :markdown
      "`"
      "")))

(defn get-empty-link-and-forward-pos
  [format]
  (case format
    :org
    ["[[][]]" 2]
    :markdown
    ["[]()" 1]
    ["" 0]))

(defn link-format
  [format label link]
  (if (not-empty label)
    (case format
      :org
      (util/format "[[%s][%s]]" link label)
      :markdown
      (util/format "[%s](%s)" label link))
    link))

(defn with-default-link
  [format link]
  (case format
    :org
    [(util/format "[[%s][]]" link)
     (+ 4 (count link))]
    :markdown
    [(util/format "[](%s)" link)
     1]
    ["" 0]))

(defn with-label-link
  [format label link]
  (case format
    :org
    [(util/format "[[%s][%s]]" link label)
     (+ 4 (count link) (count label))]
    :markdown
    [(util/format "[%s](%s)" label link)
     (+ 4 (count link) (count label))]
    ["" 0]))

(defn with-default-label
  [format label]
  (case format
    :org
    [(util/format "[[][%s]]" label)
     2]
    :markdown
    [(util/format "[%s]()" label)
     (+ 3 (count label))]
    ["" 0]))

(defn get-file-extension
  [format]
  (case (keyword format)
    :markdown
    "md"
    (name format)))

(defonce default-journals-directory "journals")
(defonce default-pages-directory "pages")
(defonce default-whiteboards-directory "whiteboards")

(defn get-pages-directory
  []
  (or (state/get-pages-directory) default-pages-directory))

(defn get-journals-directory
  []
  (or (state/get-journals-directory) default-journals-directory))

(defn get-whiteboards-directory
  []
  (or (state/get-whiteboards-directory) default-whiteboards-directory))

(defonce demo-repo "Demo")

(defn demo-graph?
  "Demo graph or nil graph?"
  ([]
   (demo-graph? (state/get-current-repo)))
  ([repo-url]
   (or (nil? repo-url) (= repo-url demo-repo)
       (string/ends-with? repo-url demo-repo))))

(defonce recycle-dir ".recycle")
(def config-file "config.edn")
(def custom-css-file "custom.css")
(def export-css-file "export.css")
(def custom-js-file "custom.js")
(def config-default-content (rc/inline "templates/config.edn"))
(def config-default-content-md5 (let [md5 (new crypt/Md5)]
                                  (.update md5 (crypt/stringToUtf8ByteArray config-default-content))
                                  (crypt/byteArrayToHex (.digest md5))))

;; NOTE: repo-url is the unique identifier of a repo.
;; - `local` => in-memory demo graph
;; - `logseq_local_/absolute/path/to/graph` => local graph, native fs backend
;; - `logseq_local_x:/absolute/path/to/graph` => local graph, native fs backend, on Windows
;; - `logseq_local_GraphName` => local graph, browser fs backend
;; - `logseq_db_GraphName` => db based graph, sqlite as backend
;; - Use `""` while writing global files

(defonce idb-db-prefix "logseq-db/")
(defonce local-db-prefix "logseq_local_")
(defonce local-handle "handle")
(defonce db-version-prefix common-config/db-version-prefix)

(defn db-graph-name
  [repo-with-prefix]
  (string/replace-first repo-with-prefix db-version-prefix ""))

(defn local-file-based-graph?
  [s]
  (and (string? s)
       (string/starts-with? s local-db-prefix)))

(defn db-based-graph?
  ([]
   (db-based-graph? (state/get-current-repo)))
  ([s]
   (boolean
    (and (string? s)
         (sqlite-util/db-based-graph? s)))))

(defn get-local-asset-absolute-path
  [s]
  (str "/" (string/replace s #"^[./]*" "")))

(defn get-local-dir
  [repo]
  (if (db-based-graph? repo)
    (path/path-join (get-in @state/state [:system/info :home-dir])
                    "logseq"
                    "graphs"
                    (string/replace repo db-version-prefix ""))
    (string/replace repo local-db-prefix "")))

;; FIXME(andelf): this is not the reverse op of get-repo-dir, should be fixed
(defn get-local-repo
  [dir]
  (str local-db-prefix dir))

(defn get-repo-dir
  [repo-url]
  (when repo-url
    (let [db-based? (db-based-graph? repo-url)]
      (cond
        (and (util/electron?) db-based-graph?)
        (get-local-dir repo-url)

        db-based?
        (str "memory:///"
             (string/replace-first repo-url db-version-prefix ""))

        (and (util/electron?) (local-file-based-graph? repo-url))
        (get-local-dir repo-url)

        (and (mobile-util/native-platform?) (local-file-based-graph? repo-url))
        (let [dir (get-local-dir repo-url)]
          (if (string/starts-with? dir "file://")
            dir
            (path/path-join "file://" dir)))

    ;; Special handling for demo graph
        (= repo-url demo-repo)
        "memory:///local"

    ;; nfs, browser-fs-access
    ;; Format: logseq_local_{dir-name}
        (or (local-file-based-graph? repo-url)
            (and publishing? (not db-based?)))
        (string/replace-first repo-url local-db-prefix "")

     ;; unit test
        (= repo-url "test-db")
        "/test-db"

        :else
        (do
          (js/console.error "Unknown Repo URL type:" repo-url)
          (str "/"
               (->> (take-last 2 (string/split repo-url #"/"))
                    (string/join "_"))))))))

(defn get-string-repo-dir
  [repo-dir]
  (if (mobile-util/native-ios?)
    (str (if (mobile-util/in-iCloud-container-path? repo-dir)
           "iCloud"
           (cond (mobile-util/native-iphone?)
                 "On My iPhone"

                 (mobile-util/native-ipad?)
                 "On My iPad"

                 :else
                 "Local"))
         (->> (string/split repo-dir "Documents/")
              last
              common-util/safe-decode-uri-component
              (str "/" (string/capitalize app-name) "/")))
    (get-repo-dir (get-local-repo repo-dir))))

(defn get-repo-fpath
  [repo-url path]
  (path/path-join (get-repo-dir repo-url) path))

(defn get-repo-config-path
  []
  (path/path-join app-name config-file))

(defn get-custom-css-path
  ([]
   (get-custom-css-path (state/get-current-repo)))
  ([repo]
   (if (db-based-graph? repo)
     (path/path-join app-name custom-css-file)
     (when-let [repo-dir (get-repo-dir repo)]
       (path/path-join repo-dir app-name custom-css-file)))))

(defn get-export-css-path
  ([]
   (get-export-css-path (state/get-current-repo)))
  ([repo]
   (when-let [repo-dir (get-repo-dir repo)]
     (path/path-join repo-dir app-name  export-css-file))))

(defn expand-relative-assets-path
  "Resolve all relative links in custom.css to assets:// URL"
  ;; ../assets/xxx -> {assets|file}://{current-graph-root-path}/xxx
  [source]
  (when-not (string/blank? source)
    (let [protocol (and (string? source)
                        (not (string/blank? source))
                        (if (util/electron?) "assets://" "file://"))
          ;; BUG: use "assets" as fake current directory
          assets-link-fn (fn [_]
                           (let [graph-root (get-repo-dir (state/get-current-repo))
                                 full-path (if (util/safe-re-find #"^(file|assets):" graph-root)
                                             (path/path-join graph-root "assets")
                                             (path/path-join protocol graph-root "assets"))]
                             (str (cond-> full-path
                                    (mobile-util/native-platform?)
                                    (mobile-util/convert-file-src))
                                  "/")))]
      (string/replace source #"\.\./assets/" assets-link-fn))))

(defn get-current-repo-assets-root
  []
  (when-let [repo-dir (get-repo-dir (state/get-current-repo))]
    (path/path-join repo-dir "assets")))

(defn get-repo-assets-root
  [repo]
  (when-let [repo-dir (get-repo-dir repo)]
    (path/path-join repo-dir "assets")))

(defn get-custom-js-path
  ([]
   (get-custom-js-path (state/get-current-repo)))
  ([repo]
   (if (db-based-graph? repo)
     (path/path-join app-name custom-js-file)
     (when-let [repo-dir (get-repo-dir repo)]
       (path/path-join repo-dir app-name custom-js-file)))))

(defn get-block-hidden-properties
  []
  (:block-hidden-properties (state/get-config)))
