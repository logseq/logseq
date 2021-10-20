(ns frontend.config
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [frontend.state :as state]
            [frontend.util :as util]
            [shadow.resource :as rc]
            [frontend.mobile.util :as mobile-util]))

(goog-define DEV-RELEASE false)
(defonce dev-release? DEV-RELEASE)
(defonce dev? ^boolean (or dev-release? goog.DEBUG))

(goog-define PUBLISHING false)
(defonce publishing? PUBLISHING)

(reset! state/publishing? publishing?)

(def test? false)

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

(goog-define GITHUB_APP_NAME "logseq-test")

(def github-app-name (if dev? GITHUB_APP_NAME "logseq"))

(defn git-pull-secs
  []
  (or 60 (get-in @state/state [:config :git-pull-secs])))

(defn git-push-secs
  []
  (or 10 (get-in @state/state [:config :git-push-secs])))

(defn git-repo-status-secs
  []
  (or 10 (get-in @state/state [:config :git-push-secs])))

(defn text-formats
  []
  (let [config-formats (some->> (get-in @state/state [:config :text-formats])
                                (map :keyword)
                                (set))]
    (set/union
     config-formats
     #{:json :org :md :yml :dat :asciidoc :rst :txt :markdown :adoc :html :js :ts :edn :clj :ml :rb :ex :erl :java :php :c :css
       :excalidraw})))

(def markup-formats
  #{:org :md :markdown :asciidoc :adoc :rst})

(defn img-formats
  []
  (let [config-formats (some->> (get-in @state/state [:config :image-formats])
                                (map :keyword)
                                (set))]
    (set/union
     config-formats
     #{:gif :svg :jpeg :ico :png :jpg :bmp :webp})))

(def html-render-formats
  #{:adoc :asciidoc})

(defn supported-formats
  []
  (set/union (text-formats)
             (img-formats)))

;; TODO: rename
(defonce mldoc-support-formats
  #{:org :markdown :md})

(defn mldoc-support?
  [format]
  (contains? mldoc-support-formats (keyword format)))

(def mobile?
  (when-not util/node-test?
    (util/safe-re-find #"Mobi" js/navigator.userAgent)))

;; TODO: protocol design for future formats support

(defn get-block-pattern
  [format]
  (let [format (or format (state/get-preferred-format))
        format (keyword format)]
    (case format
      :org
      "*"

      "-")))

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
      "_"
      "")))
(defn get-underline
  [format]
  (let [format (or format (keyword (state/get-preferred-format)))]
    (case format
      :org
      "_"
      :markdown
      "__"
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

(defn get-subscript
  [format]
  "_")

(defn get-superscript
  [format]
  "^")

(defn get-empty-link-and-forward-pos
  [format]
  (case format
    :org
    ["[[][]]" 2]
    :markdown
    ["[]()" 1]
    ["" 0]))

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

(defn properties-wrapper
  [format]
  (case format
    :markdown
    "---\n\n---"
    ""))

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

(defn get-file-format
  [extension]
  (case (keyword extension)
    :markdown
    :markdown
    :md
    :markdown
    (keyword extension)))

(defn default-empty-block
  ([format]
   (default-empty-block format 2))
  ([format n]
   (let [block-pattern (get-block-pattern format)]
     (apply str (repeat n block-pattern)))))

(defn with-code-wrapper
  [format mode code]
  (let [mode (if-not (string/blank? mode)
               (str mode " ")
               "")]
    (case format
      :markdown
      (util/format "```%s\n%s\n```" mode code)
      :org
      (util/format "#+BEGIN_SRC%s\n%s\n#+END_SRC" mode code)
      code)))

(defonce default-journals-directory "journals")
(defonce default-pages-directory "pages")
(defonce default-draw-directory "draws")

(defn get-pages-directory
  []
  (or (state/get-pages-directory) default-pages-directory))

(defn get-journals-directory
  []
  (or (state/get-journals-directory) default-journals-directory))

(defn draw?
  [path]
  (util/starts-with? path default-draw-directory))

(defn journal?
  [path]
  (string/includes? path (str (get-journals-directory) "/")))

(defonce local-repo "local")
(defonce local-assets-dir "assets")
(defonce recycle-dir ".recycle")
(def config-file "config.edn")
(def custom-css-file "custom.css")
(def custom-js-file "custom.js")
(def metadata-file "metadata.edn")
(def pages-metadata-file "pages-metadata.edn")

(def config-default-content (rc/inline "config.edn"))

(def markers
  #{"now" "later" "todo" "doing" "done" "wait" "waiting"
    "canceled" "cancelled" "started" "in-progress"})

(defonce idb-db-prefix "logseq-db/")
(defonce local-db-prefix "logseq_local_")
(defonce local-handle "handle")
(defonce local-handle-prefix (str local-handle "/" local-db-prefix))

(defn local-db?
  [s]
  (and (string? s)
       (string/starts-with? s local-db-prefix)))

(defn local-asset?
  [s]
  (util/safe-re-find (re-pattern (str "^[./]*" local-assets-dir)) s))

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
    (or
     (mobile-util/is-native-platform?)
     (and (util/electron?) (local-db? repo-url)))
    (get-local-dir repo-url)

    :else
    (str "/"
         (->> (take-last 2 (string/split repo-url #"/"))
              (string/join "_")))))

(defn get-repo-path
  [repo-url path]
  (if (and (or (util/electron?) (mobile-util/is-native-platform?))
           (local-db? repo-url))
    path
    (util/node-path.join (get-repo-dir repo-url) path)))

(defn get-file-path
  [repo-url relative-path]
  (when (and repo-url relative-path)
    (cond
      (and (or (util/electron?) (mobile-util/is-native-platform?)) (local-db? repo-url))
      (let [dir (get-repo-dir repo-url)]
        (if (string/starts-with? relative-path dir)
          relative-path
          (str dir "/"
               (string/replace relative-path #"^/" ""))))
      (= "/" (first relative-path))
      (subs relative-path 1)

      :else
      relative-path)))

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

(defn get-static-path
  []
  (if (and (util/electron?) dev?)
    "static/"
    ""))
