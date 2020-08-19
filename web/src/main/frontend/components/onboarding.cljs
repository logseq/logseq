(ns frontend.components.onboarding
  (:require [rum.core :as rum]
            [frontend.components.svg :as svg]
            [frontend.extensions.latex :as latex]
            [frontend.extensions.code :as code]))

(rum/defc intro
  []
  [:div#intro.pl-1
   [:div.flex-1
    [:div.flex.flex-col.pl-1.ls-block
     [:hr {:style {:margin-top 200}}]
     [:h1.title.welcome-title
      "Hi, welcome to Logseq!"]
     [:p
      {}
      [:strong {} "Logseq"]
      " is a "
      [:a {:href "https://www.inkandswitch.com/local-first.html"
           :target "_blank"}
       [:i {} "local-first"]]
      ", "
      [:a {:href "https://tiddlywiki.com/"
           :target "_blank"}
       [:i {} "non-linear"]]
      ", "
      [:a {:href "https://orgmode.org/"
           :target "_blank"}
       [:i {} "outliner"]]
      " notebook for organizing and "
      [:a {:href "https://logseq.com/blog"
           :target "_blank"} "sharing"]
      " your personal knowledge base."]
     [:div.flex.flex-row.admonitionblock.align-items {:class "warning"}
      [:div.pr-4.admonition-icon.flex.flex-col.justify-center
       {:title "Warning"} (svg/warning)]
      [:div.ml-4.text-lg
       "Notice that this project is in its early days and under quick development, files might be corrupted."]]
     [:p
      {}
      "Use it to organize your todo list, to write your journals, or to record your unique life."]
     [:p
      {}
      "The server will never store or analyze your private notes. Your data are plain text files, we support both Markdown and Emacs Org mode for the time being. Even if the website is down or can't be maintained, your data is always yours."]
     [:p
      {}
      [:strong {} "Logseq"]
      " is hugely inspired by "
      [:a {:href "https://roamresearch.com/"
           :target "_blank"} "Roam Research"]
      ", "
      [:a {:href "https://orgmode.org/"
           :target "_blank"} "Org Mode"]
      ", "
      [:a {:href "https://tiddlywiki.com/"
           :target "_blank"} "Tiddlywiki"]
      " and "
      [:a {:href "https://workflowy.com/"
           :target "_blank"} "Workflowy"]
      ", hats off to all of them!"]]

    [:img.shadow-2xl
     {:src
      "https://cdn.logseq.com/%2F8b9a461d-437e-4ca5-a2da-18b51077b5142020_07_25_Screenshot%202020-07-25%2013-29-49%20%2B0800.png?Expires=4749255017&Signature=Qbx6jkgAytqm6nLxVXQQW1igfcf~umV1OcG6jXUt09TOVhgXyA2Z5jHJ3AGJASNcphs31pZf4CjFQ5mRCyVKw6N8wb8Nn-MxuTJl0iI8o-jLIAIs9q1v-2cusCvuFfXH7bq6ir8Lpf0KYAprzuZ00FENin3dn6RBW35ENQwUioEr5Ghl7YOCr8bKew3jPV~OyL67MttT3wJig1j3IC8lxDDT8Ov5IMG2GWcHERSy00F3mp3tJtzGE17-OUILdeuTFz6d-NDFAmzB8BebiurYz0Bxa4tkcdLUpD5ToFHU08jKzZExoEUY8tvaZ1-t7djmo3d~BAXDtlEhC2L1YC2aVQ__&Key-Pair-Id=APKAJE5CCD6X7MP6PTEA"
      :alt "screenshot"}]

    [:div.flex.flex-col.ls-block

     [:h2 {} "Where are my notes saved?"]
     [:p
      {}
      "Your notes will be stored in the local browser storage using "
      [:a {:href "https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API"
           :target "_blank"}
       "IndexedDB"]
      "."]
     [:h2 {} "How do I use it?"]
     [:h3 {} "1. Sync between multiple devices"]
     [:p
      {}
      "Currently, we only support syncing through Github, more options (e.g.Gitlab, Dropbox, Google Drive, WebDAV, etc.) will be added soon."]
     [:p
      {}
      "We are using an excellent web git client called "
      [:a
       {:href "https://logseq.com/blog/isomorphic-git.org"
        :target "_blank"}
       "Isomorphic-git.org"]
      "."]
     [:h4 {} "Step 1"]
     [:p {} "Click the button " [:i {} "Login with Github"] "."]
     [:h4 {} "Step 2"]
     [:p
      {}
      "Set your Github personal access token, the token will be encrypted and stored in the browser local storage, our server will never store it."]
     [:p
      {}
      "If you know nothing about either Git or the personal access token, no worries, just follow the steps here: "
      [:a
       {:href
        "https://logseq.com/blog/faq#How_to_create_a_Github_personal_access_token-3f-"
        :target "_blank"}
       "https://logseq.com/blog/faq#How"
       [:i {} "to"]
       "create"
       [:i {} "a"]
       "Github"
       [:i {} "personal"]
       "access_token-3f-"]]
     [:h4 {} "Step 3"]
     [:p {} "Start writing!"]
     [:h3 {} "2. Use it locally (no need to login)"]
     [:p
      {}
      "Just remember to backup your notes periodically!"]
     [:h2 {} "Features"]
     [:ul
      {}
      [:li {} "Backlinks between " [:code {} "[[Page]]"] "s"]
      [:li {} "Block embed"]
      [:li {} "Page embed"]
      [:li {} "Graph visualization"]
      [:li {} "Heading properties"]
      [:li
       {}
       "Datalog queries, the notes db is powered by "
       [:a {:href "https://github.com/tonsky/datascript"
            :target "_blank"} "Datascript"]]
      [:li {} "Custom view component"]
      [:li
       {}
       [:a {:href "https://excalidraw.com/"
            :target "_blank"} "Excalidraw"]
       " integration"]
      [:li
       {}
       [:a {:href "https://revealjs.com/"
            :target "_blank"} "reveal.js"]
       " slide support"]
      [:li
       {}
       "Document built-in supports:"
       [:ul
        {}
        [:li {} "Code highlights"]
        [:li {} "Katex latex"]
        [:li
         {}
         "Raw "
         [:a {:href "https://github.com/weavejester/hiccup"
              :target "_blank"} "hiccup"]]
        [:li {} "Raw html"]]]]
     [:h2 {} "Learn more"]
     [:ul
      {}
      [:li
       {}
       "Twitter: "
       [:a
        {:href "https://twitter.com/logseq"
         :target "_blank"}
        "https://twitter.com/logseq"]]
      [:li
       {}
       "Discord: "
       [:a
        {:href "https://discord.gg/KpN4eHY"
         :target "_blank"}
        "https://discord.gg/KpN4eHY"]
       " where the community ask questions and share tips"]
      [:li
       {}
       "Github: "
       [:a
        {:href "https://github.com/logseq/logseq"
         :target "_blank"}
        "https://github.com/logseq/logseq"]
       " everyone is encouraged to report issues!"]
      [:li
       {}
       "Our blog: "
       [:a
        {:href "https://logseq.com/blog"
         :target "_blank"}
        "https://logseq.com/blog"]]]
     [:h2 "Credits to"]
     [:ul
      {}
      [:li [:a {:href "https://roamresearch.com/"
                :target "_blank"} "Roam Research"]]
      [:li [:a {:href "https://orgmode.org/"
                :target "_blank"} "Org Mode"]]
      [:li [:a {:href "https://tiddlywiki.com/"
                :target "_blank"} "Tiddlywiki"]]
      [:li
       [:a {:href "https://workflowy.com/"
            :target "_blank"} "Workflowy"]]
      [:li
       [:a
        {:href "https://logseq.com/blog/clojure.org"
         :target "_blank"}
        "Clojure && Clojurescript"]
       " - A dynamic, functional, general-purpose programming language"]
      [:li
       [:a {:href "https://github.com/tonsky/datascript"
            :target "_blank"} "Datascript"]
       " - Immutable database and Datalog query engine for Clojure, ClojureScript and JS"]
      [:li
       [:a {:href "https://ocaml.org/"
            :target "_blank"} "OCaml"]
       " && "
       [:a
        {:href "https://github.com/inhabitedtype/angstrom"
         :target "_blank"}
        "Angstrom"]
       ", the document "
       [:a {:href "https://github.com/mldoc/mldoc"
            :target "_blank"} "parser"]
       " is built on Angstrom."]
      [:li
       [:a {:href "https://github.com/talex5/cuekeeper"
            :target "_blank"} "Cuekeeper"]
       " - Browser-based GTD (TODO list) system."]
      [:li
       [:a {:href "https://github.com/borkdude/sci"
            :target "_blank"} "sci"]
       " - Small Clojure Interpreter"]
      [:li
       [:a {:href "https://isomorphic-git.org/"
            :target "_blank"} "isomorphic-git"]]]]]])

(defn help
  []
  [:div.help.ml-2.mt-1
   [:ul
    [:li
     [:a {:href "https://logseq.com/blog/about"
          :target "_blank"}
      "About Logseq"]]
    [:li
     [:a {:href "https://github.com/logseq/logseq/issues/new?assignees=&labels=&template=bug_report.md&title="
          :target "_blank"}
      "Bug report"]]
    [:li
     [:a {:href "https://github.com/logseq/logseq/issues/new?assignees=&labels=&template=feature_request.md&title="
          :target "_blank"}
      "Feature request"]]
    [:li
     [:a {:href "/blog/changelog"
          :target "_blank"}
      "Changelog"]]
    [:li
     [:a {:href "/blog"
          :target "_blank"}
      "Logseq Blog"]]
    [:li
     [:a {:href "/blog/privacy-policy"
          :target "_blank"}
      "Privacy policy"]]
    [:li
     [:a {:href "/blog/terms"
          :target "_blank"}
      "Terms"]]
    [:li
     [:a {:href "https://discord.gg/KpN4eHY"
          :target "_blank"}
      [:div.flex-row.flex.items-center
       [:span.mr-1 "Discord community"]
       svg/discord]]]
    [:li
     "Keyboard Shortcuts"
     [:table
      [:thead
       [:tr
        [:th [:b "Triggers"]]
        [:th "Shortcut"]]]
      [:tbody
       [:tr [:td "Slash Autocomplete"] [:td "/"]]
       [:tr [:td "Block content (Src, Quote, Query, etc) Autocomplete"] [:td "<"]]
       [:tr [:td "Page reference Autocomplete"] [:td "[[]]"]]
       [:tr [:td "Block Reference"] [:td "(())"]]]]
     [:table
      [:thead
       [:tr
        [:th [:span [:b "Key Commands"]
              " (working with lists)"]]
        [:th "Shortcut"]]]
      [:tbody
       [:tr [:td "Indent Block Tab"] [:td "Tab"]]
       [:tr [:td "Unindent Block"] [:td "Shift-Tab"]]
       [:tr [:td "Move Block Up"] [:td "Alt-Shift-Up"]]
       [:tr [:td "Move Block Down"] [:td "Alt-Shift-Down"]]
       [:tr [:td "Create New Block"] [:td "Enter"]]
       [:tr [:td "New Line in Block"] [:td "Shift-Enter"]]
       [:tr [:td "Undo"] [:td "Ctrl-z"]]
       [:tr [:td "Redo"] [:td "Ctrl-y"]]
       [:tr [:td "Zoom In"] [:td "Alt-Right"]]
       [:tr [:td "Zoom out"] [:td "Alt-left"]]
       [:tr [:td "Follow link under cursor"] [:td "Ctrl-o"]]
       [:tr [:td "Open link in Sidebar"] [:td "Ctrl-shift-o"]]
       [:tr [:td "Expand"] [:td "Ctrl-Down"]]
       [:tr [:td "Collapse"] [:td "Ctrl-Up"]]
       [:tr [:td "Select Block Above"] [:td "Shift-Up"]]
       [:tr [:td "Select Block Below"] [:td "Shift-Down"]]
       [:tr [:td "Select All Blocks"] [:td "Ctrl-Shift-a"]]]]
     [:table
      [:thead
       [:tr
        [:th [:b "General"]]
        [:th "Shortcut"]]]
      [:tbody
       [:tr [:td "Toggle help"] [:td "?"]]
       [:tr [:td "Git commit message"] [:td "c"]]
       [:tr [:td "Full Text Search"] [:td "Ctrl-u"]]
       [:tr [:td "Open Link in Sidebar"] [:td "Shift-Click"]]
       [:tr [:td "Context Menu"] [:td "Right Click"]]
       [:tr [:td "Fold/Unfold blocks (when not in edit mode)"] [:td "Tab"]]
       [:tr [:td "Toggle document mode"] [:td "Ctrl-Alt-d"]]
       [:tr [:td "Toggle right sidebar"] [:td "Ctrl-Alt-r"]]
       [:tr [:td "Jump to Journals"] [:td "Alt-j"]]]]
     [:table
      [:thead
       [:tr
        [:th [:b "Formatting"]]
        [:th "Shortcut"]]]
      [:tbody
       [:tr [:td "Bold"] [:td "Ctrl-b"]]
       [:tr [:td "Italics"] [:td "Ctrl-i"]]
       [:tr [:td "Html Link"] [:td "Ctrl-k"]]
       [:tr [:td "Highlight"] [:td "Ctrl-h"]]]]]

    [:li
     "Markdown syntax"
     [:table
      [:tbody
       [:tr [:td "**Bold**"] [:td.text-right [:b "Bold"]]]
       [:tr [:td "_Italics_"] [:td.text-right [:i "Italics"]]]
       [:tr [:td "~~Strikethrough~~"] [:td.text-right [:del "Strikethrough"]]]
       [:tr [:td "^^highlight^^"] [:td.text-right [:mark "highlight"]]]
       [:tr [:td "$$E = mc^2$$"] [:td.text-right (latex/latex
                                                  "help-latex"
                                                  "E = mc^2" true false)]]
       [:tr [:td "`Code`"] [:td.text-right [:code "Code"]]]
       [:tr [:td [:pre "```clojure
  (println \"Hello world!\")
```"]] [:td.text-right
        (code/highlight
         "help-highlight"
         {:data-lang "clojure"}
         "(println \"Hello world!\")")]]
       [:tr [:td "[label](https://www.example.com)"]
        [:td.text-right
         [:a {:href "https://www.example.com"}
          "label"]]]
       [:tr [:td "![image](https://logseq.com/static/img/logo.png)"]
        [:td.text-right
         [:img {:style {:float "right"
                        :width 64
                        :height 64}
                :src "https://logseq.com/static/img/logo.png"
                :alt "image"}]]]]]]

    [:li
     "Org mode syntax"
     [:table
      [:tbody
       [:tr [:td "*Bold*"] [:td.text-right [:b "Bold"]]]
       [:tr [:td "/Italics/"] [:td.text-right [:i "Italics"]]]
       [:tr [:td "+Strikethrough+"] [:td.text-right [:del "Strikethrough"]]]
       [:tr [:td "^^highlight^^"] [:td.text-right [:mark "highlight"]]]
       [:tr [:td "$$E = mc^2$$"] [:td.text-right (latex/latex
                                                  "help-latex"
                                                  "E = mc^2" true false)]]
       [:tr [:td "~Code~"] [:td.text-right [:code "Code"]]]
       [:tr [:td [:pre "#+BEGIN_SRC clojure
  (println \"Hello world!\")
#+END_SRC"]] [:td.text-right
              (code/highlight
               "help-highlight-org"
               {:data-lang "clojure"}
               "(println \"hello world\")")]]
       [:tr [:td "[[https://www.example.com][label]]"]
        [:td.text-right
         [:a {:href "https://www.example.com"}
          "label"]]]
       [:tr [:td "[[https://logseq.com/static/img/logo.png][image]]"]
        [:td.text-right
         [:img {:style {:float "right"
                        :width 64
                        :height 64}
                :src "https://logseq.com/static/img/logo.png"
                :alt "image"}]]]]]]]])
