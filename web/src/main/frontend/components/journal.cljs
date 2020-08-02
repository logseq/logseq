(ns frontend.components.journal
  (:require [rum.core :as rum]
            [frontend.util :as util :refer-macros [profile]]
            [frontend.date :as date]
            [frontend.handler :as handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.editor :as editor]
            [frontend.handler.ui :as ui-handler]
            [frontend.db :as db]
            [frontend.state :as state]
            [clojure.string :as string]
            [frontend.ui :as ui]
            [frontend.format :as format]
            [frontend.components.content :as content]
            [frontend.components.hiccup :as hiccup]
            [frontend.components.reference :as reference]
            [frontend.components.page :as page]
            [frontend.components.svg :as svg]
            [frontend.utf8 :as utf8]
            [goog.object :as gobj]
            [clojure.string :as string]))

(defn- journal-include-template!
  [state]
  (let [[[title format]] (:rum/args state)
        page (string/lower-case title)
        today? (= page (string/lower-case (date/journal-name)))
        repo (state/get-current-repo)]
    ;; no contents yet
    (when today?
      (let [raw-headings (db/get-page-headings repo page)
            headings (db/with-dummy-heading raw-headings format nil true)]
        (when (= 1 (count raw-headings))
          (when-let [template (state/get-journal-template)]
            (when-not (string/blank? template)
              (editor/insert-new-heading!
               (first headings)
               template
               false
               nil
               true)))))))
  state)

(rum/defc intro
  []
  [:div#intro.pl-1
   [:div.flex-1
    [:div.flex.flex-col.pl-1.ls-heading
     [:hr {:style {:margin-top 200}}]
     [:h1.title.welcome-title {:style {:margin-left -6}}
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
       "Notice that this project is in its early days and under quick development, data might be lost."]]
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
      ", hats off to all of them!"
      ]]

    [:img.shadow-2xl
     {:src
      "https://cdn.logseq.com/%2F8b9a461d-437e-4ca5-a2da-18b51077b5142020_07_25_Screenshot%202020-07-25%2013-29-49%20%2B0800.png?Expires=4749255017&Signature=Qbx6jkgAytqm6nLxVXQQW1igfcf~umV1OcG6jXUt09TOVhgXyA2Z5jHJ3AGJASNcphs31pZf4CjFQ5mRCyVKw6N8wb8Nn-MxuTJl0iI8o-jLIAIs9q1v-2cusCvuFfXH7bq6ir8Lpf0KYAprzuZ00FENin3dn6RBW35ENQwUioEr5Ghl7YOCr8bKew3jPV~OyL67MttT3wJig1j3IC8lxDDT8Ov5IMG2GWcHERSy00F3mp3tJtzGE17-OUILdeuTFz6d-NDFAmzB8BebiurYz0Bxa4tkcdLUpD5ToFHU08jKzZExoEUY8tvaZ1-t7djmo3d~BAXDtlEhC2L1YC2aVQ__&Key-Pair-Id=APKAJE5CCD6X7MP6PTEA"
      :alt "screentshot"}
     ]

    [:div.flex.flex-col.ls-heading

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
      "Just remember to backup your notes periodically (we'll provide export and import soon)!"]
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
        "Clojure && Clojurescript"]]
      [:li
       [:a {:href "https://github.com/tonsky/datascript"
            :target "_blank"} "Datascript"]
       " - Immutable database and Datalog query engine for Clojure, ClojureScript and JS"]
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
            :target "_blank"} "isomorphic-git"]]]]
    ]])

(rum/defc headings-inner < rum/static
  {:did-mount (fn [state]
                (let [[headings _ page] (:rum/args state)
                      first-title (second (first (:heading/title (first headings))))
                      journal? (and (string? first-title)
                                    (date/valid-journal-title? first-title))]
                  (when (and journal?
                             (= (string/lower-case first-title) (string/lower-case page)))
                    (notification/show!
                     [:div
                      [:p
                       "It seems that you have multiple journal files (with different formats) for the same month, please only keep one journal file for each month."]
                      (ui/button "Go to files"
                        :href "/all-files"
                        :on-click notification/clear!)]
                     :error
                     false)))
                state)}
  [headings encoded-page-name page]
  (content/content
   encoded-page-name
   {:hiccup (hiccup/->hiccup headings
                             {:id encoded-page-name
                              :start-level 2}
                             {})}))

(rum/defc headings-cp < rum/reactive
  {}
  [repo page encoded-page-name format]
  (let [raw-headings (db/get-page-headings repo page)
        headings (db/with-dummy-heading raw-headings format nil true)]
    (headings-inner headings encoded-page-name page)))

(rum/defc journal-cp < rum/reactive
  {:init journal-include-template!
   :did-update journal-include-template!}
  [[title format]]
  (let [;; Don't edit the journal title
        page (string/lower-case title)
        repo (state/sub :git/current-repo)
        encoded-page-name (util/encode-str page)
        today? (= (string/lower-case title)
                  (string/lower-case (date/journal-name)))]
    [:div.flex-1.journal.page
     (ui/foldable
      [:a.initial-color.title
       {:href (str "/page/" encoded-page-name)
        :on-click (fn [e]
                    (util/stop e)
                    (when (gobj/get e "shiftKey")
                      (when-let [page (db/pull [:page/name title])]
                        (state/sidebar-add-block!
                         (state/get-current-repo)
                         (:db/id page)
                         :page
                         {:page page
                          :journal? true}))
                      (ui-handler/show-right-sidebar)))}
       [:h1.title
        (util/capitalize-all title)]]

      (headings-cp repo page encoded-page-name format))

     (page/today-queries repo today? false)

     (reference/references title false)

     (when (and (not (state/logged?))
                today?)
       (intro))]))

(rum/defc journals <
  [latest-journals]
  [:div#journals
   (ui/infinite-list
    (for [[journal-name format] latest-journals]
      [:div.journal.content {:key journal-name}
       (journal-cp [journal-name format])])
    {:on-load (fn []
                (handler/load-more-journals!))})])
