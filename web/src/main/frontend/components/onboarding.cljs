(ns frontend.components.onboarding
  (:require [rum.core :as rum]
            [frontend.components.svg :as svg]
            [frontend.extensions.latex :as latex]
            [frontend.extensions.code :as code]
            [frontend.context.i18n :as i18n]))

(rum/defc intro
  []
  (rum/with-context [[t] i18n/*tongue-context*]
    [:div#intro.pl-1
     [:div.flex-1
      [:div.flex.flex-col.pl-1.ls-block
       [:hr {:style {:margin-top 200}}]
       [:h1.title.welcome-title
        (t :on-boarding/title)]
       [:p
        {}
        [:strong {} "Logseq"]
        (t :on-boarding/is-a)
        [:a {:href "https://www.inkandswitch.com/local-first.html"
             :target "_blank"}
         [:i {} (t :on-boarding/local-first)]]
        ", "
        [:a {:href "https://tiddlywiki.com/"
             :target "_blank"}
         [:i {} (t :on-boarding/non-linear)]]
        ", "
        [:a {:href "https://orgmode.org/"
             :target "_blank"}
         [:i {} (t :on-boarding/outliner)]]
        (t :on-boarding/notebook-for-organizing-and)
        [:a {:href "https://logseq.com/blog"
             :target "_blank"} (t :on-boarding/sharing)]
        (t :on-boarding/your-personal-knowledge-base)]
       [:div.flex.flex-row.admonitionblock.align-items {:class "warning"}
        [:div.pr-4.admonition-icon.flex.flex-col.justify-center
         {:title "Warning"} (svg/warning)]
        [:div.ml-4.text-lg
         (t :on-boarding/notice)]]
       [:p
        {}
        (t :on-boarding/features-desc)]
       [:p
        {}
        (t :on-boarding/privacy)]
       [:p
        {}
        [:strong {} "Logseq"]
        (t :on-boarding/inspired-by)
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

      [:div.flex.flex-col.ls-block.intro-docs
       [:h2 {} (t :on-boarding/where-are-my-notes-saved)]
       [:p
        {}
        (t :on-boarding/storage)
        [:a {:href "https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API"
             :target "_blank"}
         "IndexedDB"]
        "."]
       [:h2 {} (t :on-boarding/how-do-i-use-it)]
       [:h3 {} (t :on-boarding/use-1)]
       [:p
        {}
        (t :on-boarding/use-1-desc)]
       [:p
        (t :on-boarding/use-1-video)
        [:a {:href "https://twitter.com/EdTravelling"
             :target "_blank"}
         "@EdTravelling"]
        ":"]
       [:iframe
        {:allowfullscreen "allowfullscreen"
         :allow
         "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
         :frameborder "0"
         :src "https://www.youtube.com/embed/Vw-x7yTTO0s"
         :height "367"
         :width "653"}]

       [:h3 {} (t :on-boarding/use-2)]
       [:p
        {}
        (t :on-boarding/use-2-desc)]
       [:h2 {} (t :on-boarding/features)]
       [:ul
        {}
        [:li {} (t :on-boarding/features-backlinks)]
        [:li {} (t :on-boarding/features-block-embed)]
        [:li {} (t :on-boarding/features-page-embed)]
        [:li {} (t :on-boarding/features-graph-vis)]
        [:li {} (t :on-boarding/features-heading-properties)]
        [:li
         {}
         (t :on-boarding/features-datalog)
         [:a {:href "https://github.com/tonsky/datascript"
              :target "_blank"} "Datascript"]]
        [:li {} (t :on-boarding/features-custom-view-component)]
        [:li
         {}
         [:a {:href "https://excalidraw.com/"
              :target "_blank"} "Excalidraw"]
         (t :on-boarding/integration)]
        [:li
         {}
         [:a {:href "https://revealjs.com/"
              :target "_blank"} "reveal.js"]
         (t :on-boarding/slide-support)]
        [:li
         {}
         (t :on-boarding/built-in-supports)
         [:ul
          {}
          [:li {} (t :on-boarding/supports-code-highlights)]
          [:li {} (t :on-boarding/supports-katex-latex)]
          [:li
           {}
           (t :on-boarding/raw)
           [:a {:href "https://github.com/weavejester/hiccup"
                :target "_blank"} "hiccup"]]
          [:li {} (t :on-boarding/raw-html)]]]]
       [:h2 {} (t :on-boarding/learn-more)]
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
         (t :on-boarding/discord-desc)]
        [:li
         {}
         "Github: "
         [:a
          {:href "https://github.com/logseq/logseq"
           :target "_blank"}
          "https://github.com/logseq/logseq"]
         (t :on-boarding/github-desc)]
        [:li
         {}
         (t :on-boarding/our-blog)
         [:a
          {:href "https://logseq.com/blog"
           :target "_blank"}
          "https://logseq.com/blog"]]]
       [:h2 (t :on-boarding/credits-to)]
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
          {:href "https://clojure.org"
           :target "_blank"}
          "Clojure && Clojurescript"]
         (t :on-boarding/clojure-desc)]
        [:li
         [:a {:href "https://github.com/tonsky/datascript"
              :target "_blank"} "Datascript"]
         (t :on-boarding/datascript-desc)]
        [:li
         [:a {:href "https://ocaml.org/"
              :target "_blank"} "OCaml"]
         " && "
         [:a
          {:href "https://github.com/inhabitedtype/angstrom"
           :target "_blank"}
          "Angstrom"]
         (t :on-boarding/angstrom-desc-1)
         [:a {:href "https://github.com/mldoc/mldoc"
                                            :target "_blank"} (t :on-boarding/angstrom-desc-2)]
         (t :on-boarding/angstrom-desc-3)]
        [:li
         [:a {:href "https://github.com/talex5/cuekeeper"
              :target "_blank"} "Cuekeeper"]
         (t :on-boarding/cuekeeper-desc)]
        [:li
         [:a {:href "https://github.com/borkdude/sci"
              :target "_blank"} "sci"]
         (t :on-boarding/sci-desc)]
        [:li
         [:a {:href "https://isomorphic-git.org/"
              :target "_blank"} "isomorphic-git"]
         (t :on-boarding/isomorphic-git-desc)]]]]]))

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
      [:div.flex-row.inline-flex.items-center
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
       [:tr [:td "Toggle document mode"] [:td "t d"]]
       [:tr [:td "Toggle between dark/light theme"] [:td "t t"]]
       [:tr [:td "Toggle right sidebar"] [:td "t r"]]
       [:tr [:td "Toggle Enter/Alt+Enter for inserting new block"] [:td "t e"]]
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
