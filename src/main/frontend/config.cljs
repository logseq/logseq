(ns frontend.config
  "App config and fns built on top of configuration"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.graph-parser.config :as gp-config]
            [logseq.graph-parser.util :as gp-util]
            [shadow.resource :as rc]))

(goog-define DEV-RELEASE false)
(defonce dev-release? DEV-RELEASE)
(defonce dev? ^boolean (or dev-release? goog.DEBUG))

(goog-define PUBLISHING false)
(defonce publishing? PUBLISHING)

(reset! state/publishing? publishing?)

(def test? false)

(goog-define ENABLE-FILE-SYNC-PRODUCTION false)

(if ENABLE-FILE-SYNC-PRODUCTION
  (do (def FILE-SYNC-PROD? true)
      (def LOGIN-URL
        "https://logseq-prod.auth.us-east-1.amazoncognito.com/login?client_id=3c7np6bjtb4r1k1bi9i049ops5&response_type=code&scope=email+openid+phone&redirect_uri=logseq%3A%2F%2Fauth-callback")
      (def API-DOMAIN "api.logseq.com")
      (def WS-URL "wss://ws.logseq.com/file-sync?graphuuid=%s"))

  (do (def FILE-SYNC-PROD? false)
      (def LOGIN-URL
        "https://logseq-test2.auth.us-east-2.amazoncognito.com/login?client_id=3ji1a0059hspovjq5fhed3uil8&response_type=code&scope=email+openid+phone&redirect_uri=logseq%3A%2F%2Fauth-callback")
      (def API-DOMAIN "api-dev.logseq.com")
      (def WS-URL "wss://ws-dev.logseq.com/file-sync?graphuuid=%s")))

;; feature flags

(goog-define ENABLE-PLUGINS true)
(defonce enable-plugins? ENABLE-PLUGINS)

(swap! state/state assoc :plugin/enabled enable-plugins?)

;; :TODO: How to do this?
;; (defonce desktop? ^boolean goog.DESKTOP)

(def app-name "logseq")
(def website
  (if dev?
    "http://localhost:3000"
    (util/format "https://%s.com" app-name)))

(def api
  (if dev?
    "http://localhost:3000/api/v1/"
    (str website "/api/v1/")))

(def asset-domain (util/format "https://asset.%s.com"
                               app-name))

;; TODO: Remove this, switch to lazy loader
(defn asset-uri
  [path]
  (cond
    publishing?
    path

    (util/file-protocol?)
    (string/replace path "/static/" "./")

    :else
    (if dev? path
        (str asset-domain path))))

(def markup-formats
  #{:org :md :markdown :asciidoc :adoc :rst})

(defn doc-formats
  []
  #{:doc :docx :xls :xlsx :ppt :pptx :one :pdf :epub})

(def audio-formats #{:mp3 :ogg :mpeg :wav :m4a :flac :wma :aac})

(def media-formats (set/union (gp-config/img-formats) audio-formats))

(def html-render-formats
  #{:adoc :asciidoc})

(def mobile?
  (when-not util/node-test?
    (util/safe-re-find #"Mobi" js/navigator.userAgent)))

;; TODO: protocol design for future formats support

(defn get-block-pattern
  [format]
  (gp-config/get-block-pattern (or format (state/get-preferred-format))))

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
  (if label
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

(defn properties-wrapper-pattern
  [format]
  (case format
    :markdown
    "---\n%s\n---"
    "%s"))

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

(defonce local-repo "local")

(defn demo-graph?
  "Demo graph or nil graph?"
  ([]
   (demo-graph? (state/get-current-repo)))
  ([graph]
   (or (nil? graph) (= graph local-repo))))

(defonce recycle-dir ".recycle")
(def config-file "config.edn")
(def custom-css-file "custom.css")
(def export-css-file "export.css")
(def custom-js-file "custom.js")
(def metadata-file "metadata.edn")
(def pages-metadata-file "pages-metadata.edn")

(def config-default-content (rc/inline "config.edn"))

;; Desktop only as other platforms requires better understanding of their
;; multi-graph workflows and optimal place for a "global" dir
(def global-config-enabled? util/electron?)

(defonce idb-db-prefix "logseq-db/")
(defonce local-db-prefix "logseq_local_")
(defonce local-handle "handle")
(defonce local-handle-prefix (str local-handle "/" local-db-prefix))

(defn local-db?
  [s]
  (and (string? s)
       (string/starts-with? s local-db-prefix)))

(defn get-local-asset-absolute-path
  [s]
  (str "/" (string/replace s #"^[./]*" "")))

(defn get-local-dir
  [s]
  (string/replace s local-db-prefix ""))

(defn get-local-repo
  [dir]
  (str local-db-prefix dir))

(defn get-repo-dir
  [repo-url]
  (cond
    (and (util/electron?) (local-db? repo-url))
    (get-local-dir repo-url)

    (and (mobile-util/native-platform?) (local-db? repo-url))
    (let [dir (get-local-dir repo-url)]
      (if (string/starts-with? dir "file:")
        dir
        (str "file:///" (string/replace dir #"^/+" ""))))

    :else
    (str "/"
         (->> (take-last 2 (string/split repo-url #"/"))
              (string/join "_")))))

(defn get-string-repo-dir
  [repo-dir]
  (if (mobile-util/native-ios?)
    (str (if (mobile-util/iCloud-container-path? repo-dir)
           "iCloud"
           (cond (mobile-util/native-iphone?)
                 "On My iPhone"

                 (mobile-util/native-ipad?)
                 "On My iPad"

                 :else
                 "Local"))
         (->> (string/split repo-dir "Documents/")
              last
              js/decodeURIComponent
              (str "/" (string/capitalize app-name) "/")))
    (get-repo-dir repo-dir)))

(defn get-repo-path
  [repo-url path]
  (if (and (or (util/electron?) (mobile-util/native-platform?))
           (local-db? repo-url))
    path
    (util/node-path.join (get-repo-dir repo-url) path)))

;; FIXME: There is another get-file-path at src/main/frontend/fs/capacitor_fs.cljs
(defn get-file-path
  "Normalization happens here"
  [repo-url relative-path]
  (when (and repo-url relative-path)
    (let [path (cond
                 (demo-graph?)
                 nil

                 (and (util/electron?) (local-db? repo-url))
                 (let [dir (get-repo-dir repo-url)]
                   (if (string/starts-with? relative-path dir)
                     relative-path
                     (str dir "/"
                          (string/replace relative-path #"^/" ""))))

                 (and (mobile-util/native-ios?) (local-db? repo-url))
                 (let [dir (get-repo-dir repo-url)]
                   (str dir relative-path))

                 (and (mobile-util/native-android?) (local-db? repo-url))
                 (let [dir (get-repo-dir repo-url)
                       dir (if (or (string/starts-with? dir "file:")
                                   (string/starts-with? dir "content:"))
                             dir
                             (str "file:///" (string/replace dir #"^/+" "")))]
                   (util/safe-path-join dir relative-path))

                 (= "/" (first relative-path))
                 (subs relative-path 1)

                 :else
                 relative-path)]
      (and (not-empty path) (gp-util/path-normalize path)))))

;; NOTE: js/encodeURIComponent cannot be used here
(defn get-page-file-path
  "Get the path to the page file for the given page. This is used when creating new files."
  [repo-url sub-dir page-name ext]
  (let [page-basename (if (mobile-util/native-platform?)
                        (js/encodeURI page-name)
                        page-name)]
    (get-file-path repo-url (str sub-dir "/" page-basename "." ext))))

(defn get-repo-config-path
  ([]
   (get-repo-config-path (state/get-current-repo)))
  ([repo]
   (when repo
     (get-file-path repo (str app-name "/" config-file)))))

(defn get-metadata-path
  ([]
   (get-metadata-path (state/get-current-repo)))
  ([repo]
   (when repo
     (get-file-path repo (str app-name "/" metadata-file)))))

(defn get-pages-metadata-path
  ([]
   (get-pages-metadata-path (state/get-current-repo)))
  ([repo]
   (when repo
     (get-file-path repo (str app-name "/" pages-metadata-file)))))

(defn get-custom-css-path
  ([]
   (get-custom-css-path (state/get-current-repo)))
  ([repo]
   (when repo
     (get-file-path repo
                    (str app-name "/" custom-css-file)))))

(defn get-export-css-path
  ([]
   (get-export-css-path (state/get-current-repo)))
  ([repo]
   (when repo
     (get-file-path repo
                    (str app-name "/" export-css-file)))))

(defn expand-relative-assets-path
  ;; ../assets/xxx -> {assets|file}://{current-graph-root-path}/xxx
  [source]
  (when-let [protocol (and (string? source)
                           (not (string/blank? source))
                           (if (util/electron?) "assets" "file"))]

    (string/replace
     source "../assets" (util/format "%s://%s/assets" protocol (get-repo-dir (state/get-current-repo))))))

(defn get-current-repo-assets-root
  []
  (when-let [repo-root (and (local-db? (state/get-current-repo))
                            (get-repo-dir (state/get-current-repo)))]
    (util/node-path.join repo-root "assets")))

(defn get-custom-js-path
  ([]
   (get-custom-js-path (state/get-current-repo)))
  ([repo]
   (when repo
     (get-file-path repo
                    (str app-name "/" custom-js-file)))))

(defn get-block-hidden-properties
  []
  (:block-hidden-properties (state/get-config)))
