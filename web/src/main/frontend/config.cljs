(ns frontend.config
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [frontend.state :as state]
            [frontend.util :as util]))

(defonce dev? ^boolean goog.DEBUG)

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

(defn asset-uri
  [path]
  (if dev? path
      (str asset-domain path)))

(defn git-pull-secs
  []
  (if dev?
    (* 60 5)
    (or 60 (get-in @state/state [:config :git-pull-secs]))))

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
     #{:json :org :md :xml :yml :dat :asciidoc :rst :txt :markdown :adoc :html :js :ts :edn :clj :ml :rb :ex :erl :java :php :c
       :excalidraw})))

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

(defonce hiccup-support-formats
  #{:org :markdown})

(def mobile?
  (re-find #"Mobi" js/navigator.userAgent))

;; TODO: move to format ns

(defn get-heading-pattern
  [format]
  (let [format (or format (keyword (state/get-preferred-format)))]
    (case format
      :org
      "*"
      :markdown
      "#"

      "")))

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
      "__"
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

(defn get-empty-link-and-back-pos
  [format]
  (case format
    :org
    ["[[][]]" 4]
    :markdown
    ["[]()" 3]
    ["" 0]))

(defn with-default-link
  [format link]
  (case format
    :org
    [(util/format "[[%s][]]" link)
     2]
    :markdown
    [(util/format "[](%s)" link)
     (+ 3 (count link))]
    ["" 0]))

(defn with-default-label
  [format label]
  (case format
    :org
    [(util/format "[[][%s]]" label)
     (+ 4 (count label))]
    :markdown
    [(util/format "[%s]()" label)
     1]
    ["" 0]))

(defn default-empty-heading
  ([format]
   (default-empty-heading format 2))
  ([format n]
   (let [heading-pattern (get-heading-pattern format)]
     (apply str (repeat n heading-pattern)))))

(defonce default-pages-directory "pages")
(defonce default-draw-directory "draws")

(defn draw?
  [path]
  (string/starts-with? path default-draw-directory))

(defonce local-repo "local")
(def config-file "config.edn")
(def metadata-file "metadata.edn")

(def config-default-content
  "{:project {\n           ;; Selected public notes can be published to https://logseq.com/your-project-or-your-username.\n           :name \"\"\n           :alias \"\"\n           ;; your twitter handle\n           :twitter \"\"\n           ;; description supports both hiccup and html\n           :description []}\n\n ;; Git settings\n :git-pull-secs 60\n :git-push-secs 10\n :git-auto-push true\n\n ;; The app will ignore those directories or files.\n ;; E.g. \"/archived\" \"/test.md\"\n :hidden []\n\n ;; When creating the new journal page, the app will use your template content here.\n ;; Example for Markdown users: \"## [[Work]]\\n###\\n## [[Family]]\\n###\\n\"\n ;; Example for Org mode users: \"** [[Work]]\\n***\\n** [[Family]]\\n***\\n\"\n :default-templates\n {:journals \"\"}\n\n ;; The app will show those queries in today's journal page,\n ;; the \"NOW\" query asks the tasks which need to be finished \"now\",\n ;; the \"NEXT\" query asks the future tasks.\n :default-queries\n {:journals\n  [{:title \"🔨 NOW\"\n    :query [:find (pull ?h [*])\n            :in $ ?start ?today\n            :where\n            [?h :heading/marker ?marker]\n            [?h :heading/page ?p]\n            [?p :page/journal? true]\n            [?p :page/journal-day ?d]\n            [(>= ?d ?start)]\n            [(<= ?d ?today)]\n            [(= ?marker \"NOW\")]]\n    :inputs [:14d :today]\n    :result-transform (fn [result]\n                        (sort-by (fn [h]\n                                   (get h :heading/priority \"Z\")) result))}\n   {:title \"📅 NEXT\"\n    :query [:find (pull ?h [*])\n            :in $ ?start ?next\n            :where\n            [?h :heading/marker ?marker]\n            [?h :heading/ref-pages ?p]\n            [?p :page/journal? true]\n            [?p :page/journal-day ?d]\n            [(> ?d ?start)]\n            [(< ?d ?next)]\n            [(contains? #{\"NOW\" \"LATER\"} ?marker)]]\n    :inputs [:today :7d-after]\n    :default-collapsed? true}]}\n\n ;; Add your own commands to speedup.\n ;; E.g. [[\"js\" \"Javascript\"]]\n :commands\n [[\"Think\" \"[[Think]]\"]]\n\n ;; Macros replace texts and will make you more productive.\n ;; For example:\n ;; Add this to the macros below:\n ;; {\"poem\" \"Rose is $1, violet's $2. Life's ordered: Org assists you.\"}\n ;; input \"{{{poem(red,blue)}}}\"\n ;; becomes\n ;; Rose is red, violet's blue. Life's ordered: Org assists you.\n :macros {}}\n")
