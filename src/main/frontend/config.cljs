(ns frontend.config
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [frontend.state :as state]
            [frontend.util :as util]
            [shadow.resource :as rc]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.config :as gp-config]
            [frontend.mobile.util :as mobile-util]))

(goog-define DEV-RELEASE false)
(defonce dev-release? DEV-RELEASE)
(defonce dev? ^boolean (or dev-release? goog.DEBUG))

(goog-define PUBLISHING false)
(defonce publishing? PUBLISHING)

(reset! state/publishing? publishing?)

(def test? false)

;; prod env
;; (goog-define FILE-SYNC-PROD? true)
;; (goog-define LOGIN-URL
;;              "https://logseq.auth.us-east-1.amazoncognito.com/login?client_id=7ns5v1pu8nrbs04rvdg67u4a7c&response_type=code&scope=email+openid+phone&redirect_uri=logseq%3A%2F%2Fauth-callback")
;; (goog-define API-DOMAIN "api-prod.logseq.com")
;; (goog-define WS-URL "wss://b2rp13onu2.execute-api.us-east-1.amazonaws.com/production?graphuuid=%s")

;; dev env
(goog-define FILE-SYNC-PROD? false)
(goog-define LOGIN-URL
             "https://logseq-test2.auth.us-east-2.amazoncognito.com/login?client_id=3ji1a0059hspovjq5fhed3uil8&response_type=code&scope=email+openid+phone&redirect_uri=logseq%3A%2F%2Fauth-callback")
(goog-define API-DOMAIN "api.logseq.com")
(goog-define WS-URL "wss://og96xf1si7.execute-api.us-east-2.amazonaws.com/production?graphuuid=%s")

;; feature flags
(goog-define ENABLE-FILE-SYNC false)
(defonce enable-file-sync? (or ENABLE-FILE-SYNC dev?)) ;; always enable file-sync when dev

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

(defn get-pages-directory
  []
  (or (state/get-pages-directory) default-pages-directory))

(defn get-journals-directory
  []
  (or (state/get-journals-directory) default-journals-directory))

(defonce local-repo "local")

(defn demo-graph?
  ([]
   (demo-graph? (state/get-current-repo)))
  ([graph]
   (= graph local-repo)))

(defonce recycle-dir ".recycle")
(def config-file "config.edn")
(def custom-css-file "custom.css")
(def export-css-file "export.css")
(def custom-js-file "custom.js")
(def metadata-file "metadata.edn")
(def pages-metadata-file "pages-metadata.edn")

(def config-default-content (rc/inline "config.edn"))

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

(defn get-page-file-path
  "Get the path to the page file for the given page. This is used when creating new files."
  [repo-url sub-dir page-name ext]
  (let [page-basename (if (mobile-util/native-platform?)
                        (util/url-encode page-name)
                        page-name)]
    (get-file-path repo-url (str sub-dir "/" page-basename "." ext))))

(defn get-config-path
  ([]
   (get-config-path (state/get-current-repo)))
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

(defn get-custom-js-path
  ([]
   (get-custom-js-path (state/get-current-repo)))
  ([repo]
   (when repo
     (get-file-path repo
                    (str app-name "/" custom-js-file)))))

(defn get-block-hidden-properties
  []
  (get-in @state/state [:config (state/get-current-repo) :block-hidden-properties]))
