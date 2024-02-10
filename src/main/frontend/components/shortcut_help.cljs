(ns frontend.components.shortcut-help
  "Shortcut help"
  (:require [frontend.context.i18n :refer [t]]
            [frontend.state :as state]
            [frontend.extensions.latex :as latex]
            [frontend.extensions.highlight :as highlight]
            [logseq.graph-parser.util.block-ref :as block-ref]
            [logseq.graph-parser.util.page-ref :as page-ref]
            [rum.core :as rum]
            [frontend.components.shortcut :as shortcut]
            [logseq.shui.core :as shui]))

(rum/defc trigger-table []
  [:table
   [:thead
    [:tr
     [:th.text-left [:b (t :help/shortcuts-triggers)]]
     [:th.text-right [:b (t :help/shortcut)]]]]
   [:tbody
    [:tr
     [:td.text-left (t :help/slash-autocomplete)]
     [:td.text-right [:code "/"]]]
    [:tr
     [:td.text-left (t :help/search)]
     [:td.text-right [:div.float-right
                      (shui/shortcut ["mod" "k"] nil)]]]
    [:tr
     [:td.text-left (t :help/reference-autocomplete)]
     [:td.text-right [:code page-ref/left-and-right-brackets]]]
    [:tr
     [:td.text-left (t :help/block-reference)]
     [:td.text-right [:code block-ref/left-and-right-parens]]]
    [:tr
     [:td.text-left (t :help/open-link-in-sidebar)]
     [:td.text-right [:code "Shift click reference"]]]
    [:tr
     [:td.text-left (t :help/context-menu)]
     [:td.text-right [:code "Right click bullet"]]]]])

(defn markdown-and-orgmode-syntax []
  (let [list [:bold :italics :del :mark :latex :code :link :pre :img]

        preferred-format (state/get-preferred-format) ; markdown/org

        title (case preferred-format
                :markdown (t :help/markdown-syntax)
                :org (t :help/org-mode-syntax))

        learn-more (case preferred-format
                     :markdown "https://www.markdownguide.org/basic-syntax"
                     :org "https://orgmode.org/worg/dev/org-syntax.html")

        raw (case preferred-format
              :markdown {:bold (str "**" (t :bold) "**")
                         :italics (str "_" (t :italics) "_")
                         :link "[Link](https://www.example.com)"
                         :del (str "~~" (t :strikethrough) "~~")
                         :mark (str "^^" (t :highlight) "^^")
                         :latex "$$E = mc^2$$"
                         :code (str "`" (t :code) "`")
                         :pre "```clojure\n  (println \"Hello world!\")\n```"
                         :img "![image](https://asset.logseq.com/static/img/logo.png)"}
              :org {:bold (str "*" (t :bold) "*")
                    :italics (str "/" (t :italics) "/")
                    :del (str "+" (t :strikethrough) "+")
                    :pre [:pre "#+BEGIN_SRC clojure\n  (println \"Hello world!\")\n#+END_SRC"]
                    :link "[[https://www.example.com][Link]]"
                    :mark (str "^^" (t :highlight) "^^")
                    :latex "$$E = mc^2$$"
                    :code "~Code~"
                    :img "[[https://asset.logseq.com/static/img/logo.png][image]]"})

        rendered {:italics [:i (t :italics)]
                  :bold [:b (t :bold)]
                  :link [:a {:href "https://www.example.com"} "Link"]
                  :del [:del (t :strikethrough)]
                  :mark [:mark (t :highlight)]
                  :latex (latex/latex "help-latex" "E = mc^2" true false)
                  :code [:code (t :code)]
                  :pre (highlight/highlight "help-highlight" {:data-lang "clojure"} "(println \"Hello world!\")")
                  :img [:img {:style {:float "right" :width 32 :height 32}
                              :src "https://asset.logseq.com/static/img/logo.png"
                              :alt "image"}]}]

    [:table
     [:thead
      [:tr
       [:th.text-left [:b title]]
       [:th.text-right [:a {:href learn-more} "Learn more →"]]]]
     [:tbody
      (map (fn [name]
             [:tr
              [:td.text-left [(if (= :pre name) :pre :code) (get raw name)]]
              [:td.text-right (get rendered name)]])
        list)]]))


(rum/defc shortcut-page
  [{:keys [show-title?]
    :or {show-title? true}}]
  [:div.cp__shortcut-page
   (when show-title? [:h1.title (t :help/shortcut-page-title)])
   (trigger-table)
   (markdown-and-orgmode-syntax)
   (shortcut/shortcut-keymap-x)])
