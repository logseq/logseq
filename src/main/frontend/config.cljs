(ns frontend.config
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [frontend.state :as state]
            [frontend.util :as util]))

(goog-define DEV-RELEASE false)
(defonce dev-release? DEV-RELEASE)
(defonce dev? ^boolean (or dev-release? goog.DEBUG))

(goog-define PUBLISHING false)
(defonce publishing? PUBLISHING)

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
     #{:gif :svg :jpeg :ico :png :jpg :bmp})))

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
    (re-find #"Mobi" js/navigator.userAgent)))

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
      "/"
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
  "^^")

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

(defn draw?
  [path]
  (util/starts-with? path default-draw-directory))

(defonce local-repo "local")
(defonce local-assets-dir "assets")
(def config-file "config.edn")
(def custom-css-file "custom.css")
(def metadata-file "metadata.edn")

(def config-default-content
  "{;; Currently, we support either \"Markdown\" or \"Org\".\n ;; This can overwrite your global preference so that\n ;; maybe your personal preferred format is Org but you'd\n ;; need to use Markdown for some projects.\n ;; :preferred-format \"\"\n \n ;; Preferred workflow style. \n ;; Value is either \":now\" for NOW/LATER style,\n ;; or \":todo\" for TODO/DOING style.\n :preferred-workflow :now\n\n ;; Git settings\n :git-pull-secs 60\n :git-push-secs 10\n :git-auto-push true\n\n ;; The app will ignore those directories or files.\n ;; E.g. \"/archived\" \"/test.md\"\n :hidden []\n\n ;; When creating the new journal page, the app will use your template content here.\n ;; Example for Markdown users: \"[[Work]]\\n  -\\n- [[Family]]\\n  -\\n\"\n ;; Example for Org mode users: \"** [[Work]]\\n***\\n** [[Family]]\\n***\\n\"\n :default-templates\n {:journals \"\"}\n\n ;; The app will show those queries in today's journal page,\n ;; the \"NOW\" query asks the tasks which need to be finished \"now\",\n ;; the \"NEXT\" query asks the future tasks.\n :default-queries\n {:journals\n  [{:title \"🔨 NOW\"\n    :query [:find (pull ?h [*])\n            :in $ ?start ?today\n            :where\n            [?h :block/marker ?marker]\n            [?h :block/page ?p]\n            [?p :block/journal? true]\n            [?p :block/journal-day ?d]\n            [(>= ?d ?start)]\n            [(<= ?d ?today)]\n            [(contains? #{\"NOW\" \"DOING\"} ?marker)]]\n    :inputs [:14d :today]\n    :result-transform (fn [result]\n                        (sort-by (fn [h]\n                                   (get h :block/priority \"Z\")) result))\n    :collapsed? false}\n   {:title \"📅 NEXT\"\n    :query [:find (pull ?h [*])\n            :in $ ?start ?next\n            :where\n            [?h :block/marker ?marker]\n            [?h :block/ref-pages ?p]\n            [?p :block/journal? true]\n            [?p :block/journal-day ?d]\n            [(> ?d ?start)]\n            [(< ?d ?next)]\n            [(contains? #{\"NOW\" \"LATER\" \"TODO\"} ?marker)]]\n    :inputs [:today :7d-after]\n    :collapsed? false}]}\n\n ;; Add your own commands to speedup.\n ;; E.g. [[\"js\" \"Javascript\"]]\n :commands\n []\n\n ;; Macros replace texts and will make you more productive.\n ;; For example:\n ;; Add this to the macros below:\n ;; {\"poem\" \"Rose is $1, violet's $2. Life's ordered: Org assists you.\"}\n ;; input \"{{{poem red,blue}}}\"\n ;; becomes\n ;; Rose is red, violet's blue. Life's ordered: Org assists you.\n :macros {}}\n")

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
  (re-find (re-pattern (str "^[./]*" local-assets-dir)) s))

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
  (if (and (util/electron?) (local-db? repo-url))
    (get-local-dir repo-url)
    (str "/"
         (->> (take-last 2 (string/split repo-url #"/"))
              (string/join "_")))))

(defn get-repo-path
  [repo-url path]
  (if (and (util/electron?) (local-db? repo-url))
    path
    (str (get-repo-dir repo-url) "/" path)))

(defn get-file-path
  [repo-url relative-path]
  (when (and repo-url relative-path)
    (cond
      (and (util/electron?) (local-db? repo-url))
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

(defn get-custom-css-path
  ([]
   (get-custom-css-path (state/get-current-repo)))
  ([repo]
   (when repo
     (get-file-path repo
                    (str app-name "/" custom-css-file)))))
