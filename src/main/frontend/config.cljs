(ns frontend.config
  "App config and fns built on top of configuration"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.crypt.Md5]
            [logseq.melange.bridge.common.api :as melange-common]
            [logseq.melange.bridge.db.sqlite.util :as sqlite-util]
            [logseq.melange.bridge.common.regex :as melange-regex]
            [shadow.resource :as rc]))

(goog-define DEV-RELEASE false)
(defonce dev-release? DEV-RELEASE)
(defonce dev? ^boolean (or dev-release? goog.DEBUG))

(defonce publishing? util/PUBLISHING)

;; this is a feature flag to enable the account tab
;; when it launches (when pro plan launches) it should be removed
(def ENABLE-SETTINGS-ACCOUNT-TAB false)

(def COGNITO-CLIENT-ID melange-common/cognito-client-id)
(def OAUTH-DOMAIN melange-common/oauth-domain)

(def API-DOMAIN "api.logseq.com")
(def COGNITO-IDP "https://cognito-idp.us-east-1.amazonaws.com/")
(def REGION "us-east-1")
(def USER-POOL-ID "us-east-1_dtagLnju8")
(def IDENTITY-POOL-ID "us-east-1:d6d3b034-1631-402b-b838-b44513e93ee0")
(def default-publish-api-base "https://logseq.io")

;; Enable for local development
;; (def default-publish-api-base "http://localhost:8787")

(goog-define ENABLE-DB-SYNC-LOCAL false)
(defonce db-sync-local? ENABLE-DB-SYNC-LOCAL)

(defonce default-db-sync-ws-url
  (if db-sync-local?
    "ws://127.0.0.1:8787/sync/%s"
    "wss://api.logseq.io/sync/%s"))

(defonce default-db-sync-http-base
  (if db-sync-local?
    "http://127.0.0.1:8787"
    "https://api.logseq.io"))

(defn get-custom-sync-server-url
  "Read the user-configured custom sync server URL from localStorage.
   Returns nil when not set or empty."
  []
  (when-not util/node-test?
    (let [v (.getItem js/localStorage "sync-server-url")]
      (when (and (string? v) (not (string/blank? v)))
        v))))

(defn set-custom-sync-server-url!
  "Persist the custom sync server URL to localStorage. Pass nil or empty string to clear."
  [url]
  (when-not util/node-test?
    (if (or (nil? url) (string/blank? url))
      (.removeItem js/localStorage "sync-server-url")
      (.setItem js/localStorage "sync-server-url" (string/trim url)))))

(defn valid-sync-server-url?
  "Return true when `url` looks like a valid HTTP(S) base URL."
  [url]
  (and (string? url)
       (re-find #"^https?://" url)))

(defn custom-url->ws-url
  "Derive a WebSocket sync URL from a custom HTTP base URL. Pure function."
  [custom-url]
  (let [scheme (if (string/starts-with? custom-url "https") "wss" "ws")
        base (-> custom-url
                 (string/replace #"^https?://" "")
                 (string/replace #"/+$" ""))]
    (str scheme "://" base "/sync/%s")))

(defn custom-url->http-base
  "Normalize a custom HTTP base URL by stripping trailing slashes. Pure function."
  [custom-url]
  (string/replace custom-url #"/+$" ""))

(defn db-sync-ws-url
  "Return the WebSocket sync URL. Uses custom server when configured, otherwise the default."
  []
  (if-let [custom (get-custom-sync-server-url)]
    (custom-url->ws-url custom)
    default-db-sync-ws-url))

(defn db-sync-http-base
  "Return the HTTP base URL for sync. Uses custom server when configured, otherwise the default."
  []
  (if-let [custom (get-custom-sync-server-url)]
    (custom-url->http-base custom)
    default-db-sync-http-base))

(defn get-custom-publish-server-url
  "Read the user-configured custom publish server URL from localStorage.
   Returns nil when not set or empty."
  []
  (when-not util/node-test?
    (let [v (.getItem js/localStorage "publish-server-url")]
      (when (and (string? v) (not (string/blank? v)))
        v))))

(defn set-custom-publish-server-url!
  "Persist the custom publish server URL to localStorage. Pass nil or empty string to clear."
  [url]
  (when-not util/node-test?
    (if (or (nil? url) (string/blank? url))
      (.removeItem js/localStorage "publish-server-url")
      (.setItem js/localStorage "publish-server-url" (string/trim url)))))

(defn valid-publish-server-url?
  "Return true when `url` looks like a valid HTTP(S) base URL."
  [url]
  (and (string? url)
       (re-find #"^https?://" url)))

(defn custom-url->publish-api-base
  "Normalize a custom publish base URL by stripping trailing slashes. Pure function."
  [custom-url]
  (string/replace custom-url #"/+$" ""))

(defn publish-api-base
  "Return the base URL for the single-page publish service. Uses the user-configured
   URL from localStorage when set, otherwise the default url above. Read on each call so URL changes take effect without a restart."
  []
  (if-let [custom (get-custom-publish-server-url)]
    (custom-url->publish-api-base custom)
    default-publish-api-base))

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

(def app-name melange-common/app-name)

;; FIXME:
(def app-website
  (if dev?
    "http://localhost:3001"
    (util/format "https://%s.com" app-name)))

(def markup-formats
  #{:org :md :markdown :asciidoc :adoc :rst})

(def doc-formats
  #{:doc :docx :xls :xlsx :ppt :pptx :one :pdf :epub})

(def image-formats
  #{:png :jpg :jpeg :bmp :gif :webp :svg :heic :avif :cr2})

(def audio-formats
  #{:mp3 :ogg :mpeg :wav :m4a :flac :wma :aac})

(def video-formats
  #{:mp4 :webm :mov :flv :avi :mkv})

(def media-formats
  (set/union
   (set (map keyword (array-seq (melange-common/image-format-keys))))
   audio-formats
   video-formats))

(def mobile?
  "Triggering condition: Mobile phones
   *** Warning!!! ***
   For UX logic only! Don't use for FS logic
   iPad / Android Pad doesn't trigger!

   Same as config/mobile?"
  (when-not util/node-test?
    (melange-regex/safe-re-find #"Mobi" js/navigator.userAgent)))

(defn get-hr
  [format]
  (let [format (or format (keyword (state/get-preferred-format)))]
    (case format
      :markdown
      "---"
      "")))

(defn get-bold
  [format]
  (let [format (or format (keyword (state/get-preferred-format)))]
    (case format
      :markdown
      "**"
      "")))

(defn get-italic
  [format]
  (let [format (or format (keyword (state/get-preferred-format)))]
    (case format
      :markdown
      "*"
      "")))
(defn get-underline
  [format]
  (let [format (or format (keyword (state/get-preferred-format)))]
    (case format
      :markdown ;; no underline for markdown
      ""
      "")))
(defn get-strike-through
  [format]
  (let [format (or format (keyword (state/get-preferred-format)))]
    (case format
      :markdown
      "~~"
      "")))

(defn get-highlight
  [format]
  (case format
    :markdown
    "=="
    ""))

(defn get-code
  [format]
  (let [format (or format (keyword (state/get-preferred-format)))]
    (case format
      :markdown
      "`"
      "")))

(defn get-empty-link-and-forward-pos
  [format]
  (case format
    :markdown
    ["[]()" 1]
    ["" 0]))

(defn link-format
  [label link]
  (if (not-empty label)
    (util/format "[%s](%s)" label link)
    link))

(defn with-default-link
  [format link]
  (case format
    :markdown
    [(util/format "[](%s)" link)
     1]
    ["" 0]))

(defn with-label-link
  [format label link]
  (case format
    :markdown
    [(util/format "[%s](%s)" label link)
     (+ 4 (count link) (count label))]
    ["" 0]))

(defn with-default-label
  [format label]
  (case format
    :markdown
    [(util/format "[%s]()" label)
     (+ 3 (count label))]
    ["" 0]))

(defonce demo-repo "Demo")

(defn demo-graph?
  "Demo graph or nil graph?"
  ([]
   (demo-graph? (state/get-current-repo)))
  ([repo-url]
   (or (nil? repo-url) (= repo-url demo-repo)
       (string/ends-with? repo-url demo-repo))))

(def config-file "config.edn")
(def custom-css-file "custom.css")
(def export-css-file "export.css")
(def custom-js-file "custom.js")
(def config-default-content (rc/inline "templates/config.edn"))

;; NOTE: repo-url is the unique identifier of a repo.
;; - `logseq_db_GraphName` => db based graph, sqlite as backend
;; - Use `""` while writing global files

(defonce db-version-prefix melange-common/db-version-prefix)

(defn db-graph-name
  [repo-with-prefix]
  (melange-common/strip-leading-db-version-prefix repo-with-prefix))

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
  (melange-common/path-join
             (get-in @state/state [:system/info :home-dir])
             (to-array ["logseq"
                        "graphs"
                        (melange-common/repo-to-encoded-graph-dir-name repo)])))

(defn get-electron-backup-dir
  [repo]
  (melange-common/path-join (get-local-dir repo) (to-array ["backup"])))

(defn get-repo-dir
  [repo-url]
  (when repo-url
    (if (util/electron?)
      (get-local-dir repo-url)
      (str "memory:///"
           (db-graph-name repo-url)))))

(defn get-repo-config-path
  []
  (melange-common/path-join app-name (to-array [config-file])))

(defn get-custom-css-path
  ([]
   (get-custom-css-path (state/get-current-repo)))
  ([repo]
   (if (db-based-graph? repo)
     (melange-common/path-join app-name (to-array [custom-css-file]))
     (when-let [repo-dir (get-repo-dir repo)]
       (melange-common/path-join repo-dir (to-array [app-name custom-css-file]))))))

(defn get-export-css-path
  ([]
   (get-export-css-path (state/get-current-repo)))
  ([repo]
   (when-let [repo-dir (get-repo-dir repo)]
     (melange-common/path-join repo-dir (to-array [app-name export-css-file])))))

(defn get-repo-assets-root
  [repo]
  (when-let [repo-dir (get-repo-dir repo)]
    (melange-common/path-join repo-dir (to-array ["assets"]))))

(defn get-current-repo-assets-root
  []
  (get-repo-assets-root (state/get-current-repo)))

(defn get-custom-js-path
  ([]
   (get-custom-js-path (state/get-current-repo)))
  ([repo]
   (if (db-based-graph? repo)
     (melange-common/path-join app-name (to-array [custom-js-file]))
     (when-let [repo-dir (get-repo-dir repo)]
       (melange-common/path-join repo-dir (to-array [app-name custom-js-file]))))))
