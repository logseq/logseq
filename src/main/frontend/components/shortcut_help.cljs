(ns frontend.components.shortcut-help
  "Shortcut help"
  (:require [frontend.components.shortcut :as shortcut]
            [frontend.context.i18n :refer [t]]
            [frontend.extensions.highlight :as highlight]
            [frontend.extensions.latex :as latex]
            [logseq.common.util.block-ref :as block-ref]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

(rum/defc trigger-table []
  [:table.classic-table.w-full
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

(defn markdown-syntax []
  (let [list [:bold :italics :del :mark :latex :code :link :pre :img]
        title (t :help/markdown-syntax)
        learn-more "https://www.markdownguide.org/basic-syntax"
        raw {:bold (str "**" (t :bold) "**")
             :italics (str "_" (t :italics) "_")
             :link "[Link](https://www.example.com)"
             :del (str "~~" (t :strikethrough) "~~")
             :mark (str "^^" (t :highlight) "^^")
             :latex "$$E = mc^2$$"
             :code (str "`" (t :code) "`")
             :pre "```clojure\n  (println \"Hello world!\")\n```"
             :img "![image](https://asset.logseq.com/static/img/logo.png)"}

        rendered {:italics [:i (t :italics)]
                  :bold [:b (t :bold)]
                  :link [:a {:href "https://www.example.com"} "Link"]
                  :del [:del (t :strikethrough)]
                  :mark [:mark (t :highlight)]
                  :latex (latex/latex "E = mc^2" true false)
                  :code [:code (t :code)]
                  :pre (highlight/highlight "help-highlight" {:data-lang "clojure"} "(println \"Hello world!\")")
                  :img [:img {:style {:float "right" :width 32 :height 32}
                              :src "https://asset.logseq.com/static/img/logo.png"
                              :alt "image"}]}]

    [:table.classic-table.w-full
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
  [:div.cp__shortcut-page.px-2
   {:class "-mt-2"}
   (when show-title? [:h1.title (t :help/shortcut-page-title)])
   (trigger-table)
   (markdown-syntax)
   (shortcut/shortcut-keymap-x)])
