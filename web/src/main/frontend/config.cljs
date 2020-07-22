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

(defonce config-default-content
  "{:project {
           ;; Selected public notes can be published to https://logseq.com/your-project-or-your-username.
           :name \"\"
           :alias \"\"
           ;; your twitter handle
           :twitter \"\"
           ;; description supports both hiccup and html
           :description []}

 ;; Git settings
 :git-pull-secs 60
 :git-push-secs 10
 :git-auto-push true

 ;; The app will ignore those directories or files.
 ;; E.g. \"/archived\" \"/test.md\"
 :hidden []

 ;; When creating the new journal page, the app will use your template content here.
 ;; Example for Markdown users: \"## [[Work]]\n###\n## [[Family]]\n###\n\"
 ;; Example for Org mode users: \"** [[Work]]\n***\n** [[Family]]\n***\n\"
 {:journals \"\"}

 ;; The app will show those queries in today's journal page,
 ;; the \"NOW\" query asks the tasks which need to be finished \"now\",
 ;; the \"NEXT\" query asks the future tasks.
 :default-queries
 {:journals
  [{:title \"🔨 NOW\"
    :query [:find (pull ?h [*])
            :in $ ?start ?today
            :where
            [?h :heading/marker ?marker]
            [?h :heading/page ?p]
            [?p :page/journal? true]
            [?p :page/journal-day ?d]
            [(>= ?d ?start)]
            [(<= ?d ?today)]
            [(= ?marker \"NOW\")]]
    :inputs [:14d :today]
    :result-transform (fn [result]
                        (sort-by (fn [h]
                                   (get h :heading/priority \"Z\")) result))}
   {:title \"📅 NEXT\"
    :query [:find (pull ?h [*])
            :in $ ?start ?next
            :where
            [?h :heading/marker ?marker]
            [?h :heading/ref-pages ?p]
            [?p :page/journal? true]
            [?p :page/journal-day ?d]
            [(> ?d ?start)]
            [(< ?d ?next)]
            [(contains? #{\"NOW\" \"LATER\"} ?marker)]]
    :inputs [:today :7d-after]
    :default-collapsed? true}]}

 ;; Add your own commands to speedup.
 ;; E.g. [[\"js\" \"Javascript\"]]
 :commands
 [[\"Think\" \"[[Think]]\"]]

 ;; Macros replace texts and will make you more productive.
 ;; For example:
 ;; Add this to the macros below:
 ;; {\"poem\" \"Rose is $1, violet's $2. Life's ordered: Org assists you.\"}
 ;; input \"{{{poem(red,blue)}}}\"
 ;; becomes
 ;; Rose is red, violet's blue. Life's ordered: Org assists you.
 :macros {}}
")
