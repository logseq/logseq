(ns frontend.components.onboarding
  (:require [frontend.components.shortcut :as shortcut]
            [frontend.components.svg :as svg]
            [frontend.context.i18n :as i18n]
            [frontend.extensions.highlight :as highlight]
            [frontend.extensions.latex :as latex]
            [frontend.handler.route :as route-handler]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [rum.core :as rum]
            [frontend.config :as config]))

(rum/defc intro
  []
  (rum/with-context [[t] i18n/*tongue-context*]
    [:div#logseq-intro.pl-1
     [:div.flex-1
      [:div.flex.flex-col.pl-1.ls-block
       [:hr {:style {:margin-top 200}}]
       [:div.flex.flex-row.admonitionblock.align-items {:class "important"}
        [:div.pr-4.admonition-icon.flex.flex-col.justify-center
         {:title "Important"} (svg/tip)]
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
        (if (util/electron?)
          (str (config/get-static-path) "img/screenshot.png")
          "https://cdn.logseq.com/%2F8b9a461d-437e-4ca5-a2da-18b51077b5142020_07_25_Screenshot%202020-07-25%2013-29-49%20%2B0800.png?Expires=4749255017&Signature=Qbx6jkgAytqm6nLxVXQQW1igfcf~umV1OcG6jXUt09TOVhgXyA2Z5jHJ3AGJASNcphs31pZf4CjFQ5mRCyVKw6N8wb8Nn-MxuTJl0iI8o-jLIAIs9q1v-2cusCvuFfXH7bq6ir8Lpf0KYAprzuZ00FENin3dn6RBW35ENQwUioEr5Ghl7YOCr8bKew3jPV~OyL67MttT3wJig1j3IC8lxDDT8Ov5IMG2GWcHERSy00F3mp3tJtzGE17-OUILdeuTFz6d-NDFAmzB8BebiurYz0Bxa4tkcdLUpD5ToFHU08jKzZExoEUY8tvaZ1-t7djmo3d~BAXDtlEhC2L1YC2aVQ__&Key-Pair-Id=APKAJE5CCD6X7MP6PTEA")
        :alt "screenshot"}]

      [:div.flex.flex-col.ls-block.intro-docs
       [:h2 {} (t :on-boarding/features)]
       [:ul
        {}
        [:li {} (t :on-boarding/features-backlinks)]
        [:li {} (t :on-boarding/features-block-embed)]
        [:li {} (t :on-boarding/features-page-embed)]
        [:li {} (t :on-boarding/features-graph-vis)]
        [:li {} "PDF annotations"]
        [:li {} "Zotero integration"]
        [:li {} "Spaced repetition cards"]
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
         "GitHub: "
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

       [:img {:src
              (if (util/electron?)
                (str (config/get-static-path) "img/credits.png")
                "https://asset.logseq.com/static/img/credits.png")
              :style {:margin "12px 0 0 0"}}]]]]))

(defn links [t]
  (let [discord-with-icon [:div.flex-row.inline-flex.items-center
                           [:span.mr-1 (t :help/community)]
                           svg/discord]
        list
        [[(t :help/start) "https://logseq.github.io/#/page/getting%20started"]
         [(t :help/about) "https://logseq.com/blog/about"]
         [(t :help/roadmap) "https://trello.com/b/8txSM12G/roadmap"]
         [(t :help/bug) "https://github.com/logseq/logseq/issues/new?assignees=&labels=&template=bug_report.md&title="]
         [(t :help/feature) "https://github.com/logseq/logseq/issues/new?assignees=&labels=&template=feature_request.md&title="]
         [(t :help/changelog) "https://logseq.github.io/#/page/changelog"]
         ["FAQ" "https://logseq.github.io/#/page/faq"]
         [(t :help/docs) "https://logseq.github.io/"]
         [(t :help/privacy) "https://logseq.com/blog/privacy-policy"]
         [(t :help/terms) "https://logseq.com/blog/terms"]
         [(t :help/awesome-logseq) "https://github.com/logseq/awesome-logseq"]
         [discord-with-icon "https://discord.gg/KpN4eHY"]]]
    (map (fn [[title href]]
           [:li [:a {:href href :target "_blank"} title]]) list)))

(defn help
  []
  (rum/with-context [[t] i18n/*tongue-context*]
    [:div.help.cp__sidebar-help-docs
     [:ul
      (links t)
      [:li
       (t :help/shortcuts)
       (ui/button
        "Customize"
        :class "text-sm p-1 ml-3"
        :on-click
        (fn []
          (route-handler/redirect! {:to :shortcut-setting})))
       (shortcut/trigger-table)
       (shortcut/shortcut-table :shortcut.category/basics)
       (shortcut/shortcut-table :shortcut.category/block-editing)
       (shortcut/shortcut-table :shortcut.category/formatting)]

      [:li
       (t :help/markdown-syntax)
       [:table
        [:tbody
         (let [list [[(str "**" (t :bold) "**")
                      [:b (t :bold)]]

                     [(str "_" (t :italics) "_")
                      [:i (t :italics)]]

                     [(str "~~" (t :strikethrough) "~~")
                      [:del (t :strikethrough)]]

                     [(str "^^" (t :highlight) "^^")
                      [:mark (t :highlight)]]

                     ["$$E = mc^2$$"
                      (latex/latex "help-latex" "E = mc^2" true false)]

                     [(str "`" (t :code) "`")
                      [:code (t :code)]]

                     ["```clojure\n  (println \"Hello world!\")\n```"
                      (highlight/highlight "help-highlight" {:data-lang "clojure"} "(println \"Hello world!\")")]

                     ["[label](https://www.example.com)"
                      [:a {:href "https://www.example.com" :target "_blank"} "label"]]

                     ["![image](https://asset.logseq.com/static/img/logo.png)"
                      [:img {:style {:float "right" :width 32 :height 32}
                             :src "https://asset.logseq.com/static/img/logo.png"
                             :alt "image"}]]]]

           (map (fn [[trigger shortcut]] [:tr [:td [:pre trigger]] [:td.text-right shortcut]]) list))]]]

      [:li
       (t :help/org-mode-syntax)
       [:table
        [:tbody
         (let [list [[(str "*" (t :bold) "*")
                      [:b (t :bold)]]

                     [(str "/" (t :italics) "/")
                      [:i (t :italics)]]

                     [(str "+" (t :strikethrough) "+") [:del (t :strikethrough)]]


                     [(str "^^" (t :highlight) "^^")
                      [:mark (t :highlight)]]

                     ["$$E = mc^2$$"
                      (latex/latex "help-latex" "E = mc^2" true false)]

                     ["~Code~"
                      [:code (t :code)]]

                     [[:pre "#+BEGIN_SRC clojure\n  (println \"Hello world!\")\n#+END_SRC"]
                      (highlight/highlight "help-highlight-org" {:data-lang "clojure"} "(println \"hello world\")")]

                     ["[[https://www.example.com][label]]"
                      [:a {:href "https://www.example.com"} "label"]]

                     ["[[https://asset.logseq.com/static/img/logo.png][image]]"
                      [:img {:style {:float "right" :width 32 :height 32}
                             :src "https://asset.logseq.com/static/img/logo.png"
                             :alt "image"}]]]]

           (map (fn [[trigger shortcut]] [:tr [:td [:pre trigger]] [:td.text-right shortcut]]) list))]]]]]))
