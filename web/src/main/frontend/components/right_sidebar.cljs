(ns frontend.components.right-sidebar
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.components.svg :as svg]
            [frontend.components.page :as page]
            [frontend.components.hiccup :as hiccup]
            [frontend.components.heading :as heading]
            [frontend.extensions.graph-2d :as graph-2d]
            [frontend.extensions.latex :as latex]
            [frontend.extensions.code :as code]
            [frontend.handler :as handler]
            [frontend.state :as state]
            [frontend.db :as db]
            [frontend.util :as util]
            [frontend.date :as date]
            [medley.core :as medley]
            [clojure.string :as string]
            [frontend.extensions.slide :as slide]
            [cljs-bean.core :as bean]
            [goog.object :as gobj]
            [frontend.graph :as graph]))

(rum/defc heading-cp < rum/reactive
  [repo idx heading]
  (let [id (:heading/uuid heading)]
    (page/page {:parameters {:path {:name (str id)}}
                :sidebar? true
                :sidebar/idx idx
                :repo repo})))

(defn build-sidebar-item
  [repo idx db-id block-type block-data]
  (case block-type
    :heading-ref
    ["Block reference"
     (let [heading (:heading block-data)
           heading-id (:heading/uuid heading)
           format (:heading/format heading)]
       [[:div.ml-2.mt-1
         (heading/heading-parents repo heading-id format)]
        [:div.ml-2
         (heading-cp repo idx heading)]])]

    :heading
    (let [heading-id (:heading/uuid block-data)
          format (:heading/format block-data)]
      [(heading/heading-parents repo heading-id format)
       [:div.ml-2
        (heading-cp repo idx block-data)]])

    :page
    (let [page-name (get-in block-data [:page :page/name])]
      [[:a {:href (str "/page/" (util/url-encode page-name))}
        (util/capitalize-all page-name)]
       [:div.ml-2
        (page/page {:parameters {:path {:name page-name}}
                    :sidebar? true
                    :repo repo})]])

    :page-presentation
    (let [page-name (get-in block-data [:page :page/name])
          journal? (:journal? block-data)
          headings (db/get-page-headings repo page-name)
          headings (if journal?
                     (rest headings)
                     headings)
          sections (hiccup/build-slide-sections headings {:id "slide-reveal-js"
                                                          :start-level 2
                                                          :slide? true
                                                          :sidebar? true})]
      [[:a {:href (str "/page/" (util/url-encode page-name))}
        (util/capitalize-all page-name)]
       [:div.ml-2.slide.mt-2
        (slide/slide sections)]])

    ["" [:span]]))

(rum/defc sidebar-item < rum/reactive
  [repo idx db-id block-type block-data]
  (let [collapse? (state/sub [:ui/sidebar-collapsed-blocks db-id])]
    [:div.sidebar-item.content
     (let [[title component] (build-sidebar-item repo idx db-id block-type block-data)]
       [:div.flex.flex-col
        [:div.flex.flex-row.justify-between
         [:div.flex.flex-row.justify-center
          [:a.hover:text-gray-900.text-gray-500.flex.items-center.pl-1.pr-1
           {:on-click #(state/sidebar-block-toggle-collapse! db-id)}
           (if collapse?
             (svg/caret-right)
             (svg/caret-down))]
          [:div.ml-1.font-medium
           title]]
         [:a.close.hover:text-gray-900.text-gray-500.flex.items-center
          {:on-click (fn []
                       (state/sidebar-remove-block! idx))}
          svg/close]]
        [:div {:class (if collapse? "hidden" "initial")}
         component]])]))

(defn- get-page
  [match]
  (let [route-name (get-in match [:data :name])
        page (case route-name
               :page
               (get-in match [:path-params :name])

               :file
               (get-in match [:path-params :path])

               (date/journal-name))]
    (if page
      (util/url-decode (string/lower-case page)))))

(defonce *show-page-graph? (atom false))

(rum/defc page-graph < rum/reactive
  [dark?]
  (let [match (:route-match @state/state)
        theme (:ui/theme @state/state)
        page (get-page match)
        graph (db/build-page-graph page theme)]
    (when (seq (:nodes graph))
      [:div.sidebar-item.flex-col.flex-1
       (graph-2d/graph
        (graph/build-graph-opts
         graph dark?
         {:width 600
          :height 600}))])))

(rum/defcs starred-cp <
  (rum/local true ::show?)
  [state repo starred]
  (let [show? (get state ::show?)]
    (when @show?
      (when (and repo (seq starred))
        [:div.sidebar-item.flex-col.content {:key "starred-pages"}
         [:div.flex.flex-row.justify-between
          [:div.flex.flex-row.items-center.mb-2
           (svg/star-outline "stroke-current h-4 w-4")
           [:div.ml-2 {:style {:font-weight 500}}
            "Starred"]]
          [:a.close.hover:text-gray-900.text-gray-500.flex.items-center
           {:on-click (fn [] (reset! show? false))}
           svg/close]]
         [:div.flex.flex-row.justify-start
          (for [page starred]
            (let [encoded-page (util/url-encode page)]
              [:a.flex.items-center.pb-2.px-2.text-sm
               {:key encoded-page
                :href (str "/page/" encoded-page)}
               (util/capitalize-all page)]))]]))))

(rum/defc help < rum/reactive
  []
  (when (state/sub :ui/show-help?)
    [:div.sidebar-item.flex-col.flex-1.help
     [:ul
      [:li
       [:a {:href "https://github.com/logseq/logseq/issues/new"
            :target "_blank"}
        "Bug report"]]
      [:li
       [:a {:href "https://github.com/logseq/logseq/issues/new"
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
         [:tr [:td "Create New Block"] [:td "Enter"]]
         [:tr [:td "New Line in Block"] [:td "Shift-Enter"]]
         [:tr [:td "Undo"] [:td "Ctrl-z"]]
         [:tr [:td "Redo"] [:td "Ctrl-y"]]
         [:tr [:td "Zoom In"] [:td "Alt-Right"]]
         [:tr [:td "Zoom out"] [:td "Alt-left"]]
         [:tr [:td "Follow link under cursor"] [:td "Ctrl-o"]]
         [:tr [:td "Open link in Sidebar"] [:td "Ctrl-shift-o"]]
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
         [:tr [:td "__Italics__"] [:td.text-right [:i "Italics"]]]
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
                  :alt "image"}]]]]]]]]))

(rum/defcs sidebar < rum/reactive
  [state]
  (let [blocks (state/sub :sidebar/blocks)
        repo (state/sub :git/current-repo)
        starred (state/sub [:config repo :starred])
        match (state/sub :route-match)
        theme (state/sub :ui/theme)
        dark? (= "dark" theme)
        show-page-graph? (rum/react *show-page-graph?)
        show-help? (state/sub :ui/show-help?)]
    [:div#right-sidebar.flex.flex-col.p-2.shadow-xs.overflow-y-auto
     [:div#theme-selector.ml-3.mb-2
      [:div.flex.flex-row
       [:div.flex.flex-row {:key "right-sidebar-settings"}
        [:div.mr-4.text-sm
         [:a {:on-click (fn [e]
                          (state/toggle-help!))}
          (if show-help?
            "Close Help"
            "Open Help")]]

        [:div.mr-4.text-sm
         [:a {:on-click (fn []
                          (swap! *show-page-graph? not))}
          (if @*show-page-graph?
            "Close page graph"
            "Open page graph")]]

        [:div.mr-4.text-sm
         (let [theme (if dark? "white" "dark")]
           [:a {:title (str "Switch to "
                            theme
                            " theme")
                :on-click (fn []
                            (state/set-theme! theme))}
            (str (string/capitalize theme) " theme")])]]]]

     (help)

     (for [[idx [repo db-id block-type block-data]] (medley/indexed blocks)]
       (rum/with-key
         (sidebar-item repo idx db-id block-type block-data)
         (str "sidebar-block-" idx)))
     (when show-page-graph?
       (page-graph dark?))
     (starred-cp repo starred)]))
