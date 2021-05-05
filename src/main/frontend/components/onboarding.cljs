(ns frontend.components.onboarding
  (:require [rum.core :as rum]
            [frontend.components.svg :as svg]
            [frontend.extensions.latex :as latex]
            [frontend.extensions.highlight :as highlight]
            [frontend.context.i18n :as i18n]
            [frontend.util :as util]))

(rum/defc intro
  []
  (rum/with-context [[t] i18n/*tongue-context*]
    [:div#intro.pl-1
     [:div.flex-1
      [:div.flex.flex-col.pl-1.ls-block
       [:hr {:style {:margin-top 200}}]
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
          {:href "https://logseq.github.io/"
           :target "_blank"}
          "https://logseq.github.io/"]]]
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
         (t :on-boarding/isomorphic-git-desc)]]

       [:img {:src "https://asset.logseq.com/static/img/credits.png"
              :style {:margin "12px 0 0 0"}}]]]]))

(defn help
  []
  (rum/with-context [[t] i18n/*tongue-context*]
    [:div.help.cp__sidebar-help-docs
     [:ul
      [:li
       [:a {:href "https://logseq.com/blog/about"
            :target "_blank"}
        (t :help/about)]]
      [:li
       [:a {:href "https://trello.com/b/8txSM12G/roadmap"
            :target "_blank"}
        (t :help/roadmap)]]
      [:li
       [:a {:href "https://github.com/logseq/logseq/issues/new?assignees=&labels=&template=bug_report.md&title="
            :target "_blank"}
        (t :help/bug)]]
      [:li
       [:a {:href "https://github.com/logseq/logseq/issues/new?assignees=&labels=&template=feature_request.md&title="
            :target "_blank"}
        (t :help/feature)]]
      [:li
       [:a {:href "https://logseq.github.io/page/changelog"
            :target "_blank"}
        (t :help/changelog)]]
      [:li
       [:a {:href "https://logseq.github.io/page/faq"
            :target "_blank"}
        "FAQ"]]
      [:li
       [:a {:href "https://logseq.github.io/"
            :target "_blank"}
        (t :help/docs)]]
      [:li
       [:a {:href "/blog/privacy-policy"
            :target "_blank"}
        (t :help/privacy)]]
      [:li
       [:a {:href "/blog/terms"
            :target "_blank"}
        (t :help/terms)]]
      [:li
       [:a {:href "https://discord.gg/KpN4eHY"
            :target "_blank"}
        [:div.flex-row.inline-flex.items-center
         [:span.mr-1 (t :help/community)]
         svg/discord]]]
      [:li
       (t :help/shortcuts)
       [:table
        [:thead
         [:tr
          [:th [:b (t :help/shortcuts-triggers)]]
          [:th (t :help/shortcut)]]]
        [:tbody
         [:tr [:td (t :help/slash-autocomplete)] [:td "/"]]
         [:tr [:td (t :help/block-content-autocomplete)] [:td "<"]]
         [:tr [:td (t :help/reference-autocomplete)] [:td "[[]]"]]
         [:tr [:td (t :help/block-reference)] [:td "(())"]]]]
       [:table
        [:thead
         [:tr
          [:th [:span [:b (t :help/key-commands)]
                (t :help/working-with-lists)]]
          [:th (t :help/shortcut)]]]
        [:tbody
         [:tr [:td (t :help/indent-block-tab)] [:td "Tab"]]
         [:tr [:td (t :help/unindent-block)] [:td "Shift-Tab"]]
         [:tr [:td (t :help/move-block-up)] [:td (util/->platform-shortcut "Alt-Shift-Up")]]
         [:tr [:td (t :help/move-block-down)] [:td (util/->platform-shortcut "Alt-Shift-Down")]]
         [:tr [:td (t :help/create-new-block)] [:td "Enter"]]
         [:tr [:td (t :help/new-line-in-block)] [:td "Shift-Enter"]]
         [:tr [:td (t :undo)] [:td (util/->platform-shortcut "Ctrl-z")]]
         [:tr [:td (t :redo)] [:td (util/->platform-shortcut "Ctrl-y")]]
         [:tr [:td (t :help/zoom-in)] [:td (util/->platform-shortcut (if util/mac? "Cmd-." "Alt-Right"))]]
         [:tr [:td (t :help/zoom-out)] [:td (util/->platform-shortcut (if util/mac? "Cmd-," "Alt-left"))]]
         [:tr [:td (t :help/follow-link-under-cursor)] [:td (util/->platform-shortcut "Ctrl-o")]]
         [:tr [:td (t :help/open-link-in-sidebar)] [:td (util/->platform-shortcut "Ctrl-shift-o")]]
         [:tr [:td (t :expand)] [:td (util/->platform-shortcut "Ctrl-Down")]]
         [:tr [:td (t :collapse)] [:td (util/->platform-shortcut "Ctrl-Up")]]
         [:tr [:td (t :select-block-above)] [:td "Shift-Up"]]
         [:tr [:td (t :select-block-below)] [:td "Shift-Down"]]
         [:tr [:td (t :select-all-blocks)] [:td (util/->platform-shortcut "Ctrl-Shift-a")]]]]
       [:table
        [:thead
         [:tr
          [:th [:b (t :general)]]
          [:th (t :help/shortcut)]]]
        [:tbody
         [:tr [:td (t :help/toggle)] [:td "?"]]
         [:tr [:td (t :help/git-commit-message)] [:td "c"]]
         [:tr [:td (t :help/full-text-search)] [:td (util/->platform-shortcut "Ctrl-u")]]
         [:tr [:td (t :help/page-search)] [:td (util/->platform-shortcut "Ctrl-Shift-u")]]
         [:tr [:td (t :help/open-link-in-sidebar)] [:td "Shift-Click"]]
         [:tr [:td (t :help/context-menu)] [:td "Right Click"]]
         [:tr [:td (t :help/fold-unfold)] [:td "Tab"]]
         [:tr [:td (t :help/toggle-contents)] [:td "t c"]]
         [:tr [:td (t :help/toggle-doc-mode)] [:td "t d"]]
         [:tr [:td (t :help/toggle-theme)] [:td "t t"]]
         [:tr [:td (t :help/toggle-right-sidebar)] [:td "t r"]]
         [:tr [:td (t :help/toggle-settings)] [:td "t s"]]
         [:tr [:td (t :help/toggle-insert-new-block)] [:td "t e"]]
         [:tr [:td (t :help/jump-to-journals)] [:td (if util/mac? "Cmd-j" "Alt-j")]]]]
       [:table
        [:thead
         [:tr
          [:th [:b (t :formatting)]]
          [:th (t :help/shortcut)]]]
        [:tbody
         [:tr [:td (t :bold)] [:td (util/->platform-shortcut "Ctrl-b")]]
         [:tr [:td (t :italics)] [:td (util/->platform-shortcut "Ctrl-i")]]
         [:tr [:td (t :html-link)] [:td (util/->platform-shortcut "Ctrl-k")]]
         [:tr [:td (t :highlight)] [:td (util/->platform-shortcut "Ctrl-Shift-h")]]]]]

      [:li
       (t :help/markdown-syntax)
       [:table
        [:tbody
         [:tr [:td (str "**" (t :bold) "**")] [:td.text-right [:b (t :bold)]]]
         [:tr [:td (str "_" (t :italics) "_")] [:td.text-right [:i (t :italics)]]]
         [:tr [:td (str "~~" (t :strikethrough) "~~")] [:td.text-right [:del (t :strikethrough)]]]
         [:tr [:td (str "^^" (t :highlight) "^^")] [:td.text-right [:mark (t :highlight)]]]
         [:tr [:td "$$E = mc^2$$"] [:td.text-right (latex/latex
                                                    "help-latex"
                                                    "E = mc^2" true false)]]
         [:tr [:td (str "`" (t :code) "`")] [:td.text-right [:code (t :code)]]]
         [:tr [:td [:pre "```clojure
  (println \"Hello world!\")
```"]] [:td.text-right
        (highlight/highlight
         "help-highlight"
         {:data-lang "clojure"}
         "(println \"Hello world!\")")]]
         [:tr [:td "[label](https://www.example.com)"]
          [:td.text-right
           [:a {:href "https://www.example.com"}
            "label"]]]
         [:tr [:td "![image](https://asset.logseq.com/static/img/logo.png)"]
          [:td.text-right
           [:img {:style {:float "right"
                          :width 64
                          :height 64}
                  :src "https://asset.logseq.com/static/img/logo.png"
                  :alt "image"}]]]]]]

      [:li
       (t :help/org-mode-syntax)
       [:table
        [:tbody
         [:tr [:td (str "*" (t :bold) "*")] [:td.text-right [:b (t :bold)]]]
         [:tr [:td (str "/" (t :italics) "/")] [:td.text-right [:i (t :italics)]]]
         [:tr [:td (str "+" (t :strikethrough) "+")] [:td.text-right [:del (t :strikethrough)]]]
         [:tr [:td (str "^^" (t :highlight) "^^")] [:td.text-right [:mark (t :highlight)]]]
         [:tr [:td "$$E = mc^2$$"] [:td.text-right (latex/latex
                                                    "help-latex"
                                                    "E = mc^2" true false)]]
         [:tr [:td "~Code~"] [:td.text-right [:code (t :code)]]]
         [:tr [:td [:pre "#+BEGIN_SRC clojure
  (println \"Hello world!\")
#+END_SRC"]] [:td.text-right
              (highlight/highlight
               "help-highlight-org"
               {:data-lang "clojure"}
               "(println \"hello world\")")]]
         [:tr [:td "[[https://www.example.com][label]]"]
          [:td.text-right
           [:a {:href "https://www.example.com"}
            "label"]]]
         [:tr [:td "[[https://asset.logseq.com/static/img/logo.png][image]]"]
          [:td.text-right
           [:img {:style {:float "right"
                          :width 64
                          :height 64}
                  :src "https://asset.logseq.com/static/img/logo.png"
                  :alt "image"}]]]]]]]]))
