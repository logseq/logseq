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
  (let [format (or format (state/get-preferred-format))
        format (keyword format)]
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
  "{:project {\n           ;; Selected public notes can be published to https://logseq.com/your-project-or-your-username.\n           :name \"\"\n           :alias \"\"\n           ;; your twitter handle\n           :twitter \"\"\n           ;; description supports both hiccup and html\n           :description \"\"}\n\n ;; Currently, we support either \"Markdown\" or \"Org\".\n ;; This can overwrite your global preference so that\n ;; maybe your personal preferred format is Org but you'd\n ;; need to use Markdown for some projects.\n ;; :preferred-format \"\"\n\n ;; Git settings\n :git-pull-secs 60\n :git-push-secs 10\n :git-auto-push true\n\n ;; The app will ignore those directories or files.\n ;; E.g. \"/archived\" \"/test.md\"\n :hidden []\n\n ;; When creating the new journal page, the app will use your template content here.\n ;; Example for Markdown users: \"## [[Work]]\\n###\\n## [[Family]]\\n###\\n\n ;; Example for Org mode users: \"** [[Work]]\\n***\\n** [[Family]]\\n***\\n\n :default-templates\n {:journals \"\"}\n\n ;; The app will show those queries in today's journal page,\n ;; the \"NOW\" query asks the tasks which need to be finished \"now\",\n ;; the \"NEXT\" query asks the future tasks.\n :default-queries\n {:journals\n  [{:title \"🔨 NOW\"\n    :query [:find (pull ?h [*])\n            :in $ ?start ?today\n            :where\n            [?h :heading/marker ?marker]\n            [?h :heading/page ?p]\n            [?p :page/journal? true]\n            [?p :page/journal-day ?d]\n            [(>= ?d ?start)]\n            [(<= ?d ?today)]\n            [(contains? #{\"NOW\" \"DOING\"} ?marker)]]\n    :inputs [:14d :today]\n    :result-transform (fn [result]\n                        (sort-by (fn [h]\n                                   (get h :heading/priority \"Z\")) result))\n    :collapsed? true}\n   {:title \"📅 NEXT\"\n    :query [:find (pull ?h [*])\n            :in $ ?start ?next\n            :where\n            [?h :heading/marker ?marker]\n            [?h :heading/ref-pages ?p]\n            [?p :page/journal? true]\n            [?p :page/journal-day ?d]\n            [(> ?d ?start)]\n            [(< ?d ?next)]\n            [(contains? #{\"NOW\" \"LATER\" \"TODO\"} ?marker)]]\n    :inputs [:today :7d-after]\n    :collapsed? true}]}\n\n ;; Add your own commands to speedup.\n ;; E.g. [[\"js\" \"Javascript\"]]\n :commands\n []\n\n ;; Macros replace texts and will make you more productive.\n ;; For example:\n ;; Add this to the macros below:\n ;; {\"poem\" \"Rose is $1, violet's $2. Life's ordered: Org assists you.\"}\n ;; input \"{{{poem(red,blue)}}}\"\n ;; becomes\n ;; Rose is red, violet's blue. Life's ordered: Org assists you.\n :macros {}}\n")

(def default-intro-content
  "## Hi, welcome to [Logseq](https://logseq.com/).

**Logseq** is a _local-first_, _non-linear_, _outliner_ notebook for organizing and [sharing](https://logseq.com/blog) your personal knowledge base.

***Notice that this project is in its early days and under quick development, data might be lost.***

Use it to organize your todo list, to write your journals, or to record your unique life.

The server will never store or analyze your private notes. Your data are plain text files, we support both Markdown and Emacs Org mode for the time being. Even if the website is down or can't be maintained, your data is always yours.

**Logseq** is hugely inspired by [Roam Research](https://roamresearch.com/), [Org Mode](https://orgmode.org/), [Tiddlywiki](https://tiddlywiki.com/) and [Workflowy](https://workflowy.com/), hats off to all of them!!
[screentshot](https://cdn.logseq.com/%2F8b9a461d-437e-4ca5-a2da-18b51077b5142020_07_25_Screenshot%202020-07-25%2013-29-49%20%2B0800.png?Expires=4749255017&Signature=Qbx6jkgAytqm6nLxVXQQW1igfcf~umV1OcG6jXUt09TOVhgXyA2Z5jHJ3AGJASNcphs31pZf4CjFQ5mRCyVKw6N8wb8Nn-MxuTJl0iI8o-jLIAIs9q1v-2cusCvuFfXH7bq6ir8Lpf0KYAprzuZ00FENin3dn6RBW35ENQwUioEr5Ghl7YOCr8bKew3jPV~OyL67MttT3wJig1j3IC8lxDDT8Ov5IMG2GWcHERSy00F3mp3tJtzGE17-OUILdeuTFz6d-NDFAmzB8BebiurYz0Bxa4tkcdLUpD5ToFHU08jKzZExoEUY8tvaZ1-t7djmo3d~BAXDtlEhC2L1YC2aVQ__&Key-Pair-Id=APKAJE5CCD6X7MP6PTEA)


## Where are my notes saved?

Your notes will be stored in the local browser storage. We are using IndexedDB.


## How do I use it?

### 1. Sync between multiple devices

Currently, we only support syncing through Github, more options (e.g.Gitlab, Dropbox, Google Drive, WebDAV, etc.) will be added soon.

We are using an excellent web git client called [Isomorphic-git.org](https://logseq.com/blog/isomorphic-git.org).


#### Step 1

Click the button _Login with Github_.


#### Step 2

Set your Github personal access token, the token will be encrypted and stored in the browser local storage, our server will never store it.

If you know nothing about either Git or the personal access token, no worries, just follow the steps here: [https://logseq.com/blog/faq#How_to_create_a_Github_personal_access_token-3f-](https://logseq.com/blog/faq#How_to_create_a_Github_personal_access_token-3f-)


#### Step 3

Start writing!


### 2. Use it locally (no need to login)

Just remember to backup your notes periodically (we'll provide export and import soon)!


## Features
- Backlinks between `[[Page]]`s
- Block embed
- Page embed
- Graph visualization
- Heading properties
- Datalog queries, the notes db is powered by [Datascript](https://github.com/tonsky/datascript)
- Custom view component
- [Excalidraw](https://excalidraw.com/) integration
- Document built-in supports:
     - Code highlights
     - Katex latex
     - Raw [hiccup](https://github.com/weavejester/hiccup)
     - Raw html

## Learn more
- Twitter: [https://twitter.com/logseq](https://twitter.com/logseq)
- Discord: [https://discord.gg/KpN4eHY](https://discord.gg/KpN4eHY) where the community ask questions and share tips
- Website: [https://logseq.com/](https://logseq.com/)
- Github: [https://github.com/logseq/logseq](https://github.com/logseq/logseq) everyone is encouraged to report issues!
- Our blog: [https://logseq.com/blog](https://logseq.com/blog)

## Credits to
- [Roam Research](https://roamresearch.com/)
- [Org Mode](https://orgmode.org/)
- [Tiddlywiki](https://tiddlywiki.com/)
- [Workflowy](https://workflowy.com/)
- [Clojure && Clojurescript](https://logseq.com/blog/clojure.org)
- [OCaml](https://ocaml.org/) && [Angstrom](https://github.com/inhabitedtype/angstrom), the document [parser](https://github.com/mldoc/mldoc) is built on Angstrom.
- [Cuekeeper](https://github.com/talex5/cuekeeper) - Browser-based GTD (TODO list) system.
- [Datascript](https://github.com/tonsky/datascript) - Immutable database and Datalog query engine for Clojure, ClojureScript and JS
- [sci](https://github.com/borkdude/sci) - Small Clojure Interpreter
- [isomorphic-git](https://isomorphic-git.org/)
")
