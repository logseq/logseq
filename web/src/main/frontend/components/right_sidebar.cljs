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
            [frontend.handler.route :as route-handler]
            [frontend.handler.editor :as editor-handler]
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

(defn page-graph
  [page]
  (let [theme (:ui/theme @state/state)
        dark? (= theme "dark")
        graph (db/build-page-graph page theme)]
    (when (seq (:nodes graph))
      [:div.sidebar-item.flex-col.flex-1
       (graph-2d/graph
        (graph/build-graph-opts
         graph dark?
         {:width 600
          :height 600}))])))

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

(defn recent-pages
  []
  (let [pages (db/get-key-value :recent/pages)]
    [:div.recent-pages.text-sm.flex-col.flex.ml-3.mt-2
     (if (seq pages)
       (for [page pages]
         [:a.mb-1 {:key (str "recent-page-" page)
                   :href (str "/page/" page)}
          page]))]))

(rum/defcs foldable-list <
  (rum/local false ::fold?)
  [state page l]
  (let [fold? (get state ::fold?)]
    [:div
     [:div.flex.flex-row.items-center.mb-1
      [:a.control {:on-click #(swap! fold? not)
                   :style {:width "0.75rem"}}
       (when (seq l)
         (if @fold?
           svg/arrow-down-v2
           svg/arrow-right-v2))]

      [:a.ml-2 {:key (str "contents-" page)
                :href (str "/page/" page)}
       (util/capitalize-all page)]]
     (when (seq l)
       [:div.contents-list.ml-4 {:class (if @fold? "hidden" "initial")}
        (for [{:keys [page list]} l]
          (rum/with-key
            (foldable-list page list)
            (str "toc-item-" page)))])]))

(rum/defc contents < rum/reactive
  []
  (let [l (db/get-contents)]
    [:div.contents.text-sm.flex-col.flex.ml-3.mt-2
     (if (seq l)
       (for [{:keys [page list]} l]
         (rum/with-key
           (foldable-list page list)
           (str "toc-item-" page)))
       (let [page (db/entity [:page/name "contents"])]
         (if page
           [:div
            [:p.text-base "No contents yet, you can click the button below to edit it."]
            (ui/button
              "Edit the contents"
              :on-click (fn [e]
                          (util/stop e)
                          (route-handler/redirect! {:to :page
                                                    :path-params {:name "contents"}})))]
           [:div
            [:p.text-base
             [:i.font-medium "Contents"] " (similar to book contents) is a way to structure your pages, please click the button below to start!"]
            (ui/button
              "Create the contents"
              :on-click (fn [e]
                          (util/stop e)
                          (editor-handler/create-new-page! "contents")))])))]))

(defn build-sidebar-item
  [repo idx db-id block-type block-data]
  (case block-type
    :contents
    [[:a {:on-click (fn [e]
                      (util/stop e)
                      (if-not (db/entity [:page/name "contents"])
                        (editor-handler/create-new-page! "contents")
                        (route-handler/redirect! {:to :page
                                                  :path-params {:name "contents"}})))}
      "Contents (edit)"]
     (contents)]

    :recent
    ["Recent" (recent-pages)]

    :help
    ["Help" (help)]

    :page-graph
    [(str "Graph of " (util/capitalize-all block-data))
     (page-graph block-data)]

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

(defn close
  ([on-close]
   (close nil on-close))
  ([class on-close]
   [:a.close.hover:text-gray-900.text-gray-500.flex.items-center
    (cond-> {:on-click on-close}
      class
      (assoc :class class))
    svg/close]))

(rum/defc sidebar-item < rum/reactive
  [repo idx db-id block-type block-data]
  (let [collapse? (state/sub [:ui/sidebar-collapsed-blocks db-id])]
    [:div.sidebar-item.content
     (let [[title component] (build-sidebar-item repo idx db-id block-type block-data)]
       [:div.flex.flex-col
        [:div.flex.flex-row.justify-between
         [:div.flex.flex-row.justify-center
          [:a.hover:text-gray-900.text-gray-500.flex.items-center.pr-1
           {:on-click #(state/sidebar-block-toggle-collapse! db-id)}
           (if collapse?
             (svg/caret-right)
             (svg/caret-down))]
          [:div.ml-1.font-medium
           title]]
         (close #(state/sidebar-remove-block! idx))]
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

(defn get-current-page
  []
  (let [match (:route-match @state/state)
        theme (:ui/theme @state/state)]
    (get-page match)))

(rum/defcs sidebar < rum/reactive
  [state]
  (let [blocks (state/sub :sidebar/blocks)
        repo (state/sub :git/current-repo)
        match (state/sub :route-match)
        theme (state/sub :ui/theme)
        dark? (= "dark" theme)]
    [:div#right-sidebar.flex.flex-col.p-2.shadow-xs.overflow-y-auto
     [:div#theme-selector.ml-3.mb-2
      [:div.flex.flex-row
       [:div.flex.flex-row {:key "right-sidebar-settings"}
        [:div.mr-4.text-sm
         [:a {:on-click (fn [e]
                          (state/sidebar-add-block! repo "contents" :contents nil))}
          "Contents"]]

        [:div.mr-4.text-sm
         [:a {:on-click (fn [_e]
                          (state/sidebar-add-block! repo "recent" :recent nil))}
          "Recent"]]

        [:div.mr-4.text-sm
         [:a {:on-click (fn []
                          (when-let [page (get-current-page)]
                            (state/sidebar-add-block!
                             repo
                             (str "page-graph-" page)
                             :page-graph
                             page)))}
          "Page graph"]]

        [:div.mr-4.text-sm
         (let [theme (if dark? "white" "dark")]
           [:a {:title (str "Switch to "
                            theme
                            " theme")
                :on-click (fn []
                            (state/set-theme! theme))}
            (str (string/capitalize theme) " theme")])]

        [:div.mr-4.text-sm
         [:a {:on-click (fn [_e]
                          (state/sidebar-add-block! repo "help" :help nil))}
          "Help"]]]]]

     (for [[idx [repo db-id block-type block-data]] (medley/indexed blocks)]
       (rum/with-key
         (sidebar-item repo idx db-id block-type block-data)
         (str "sidebar-block-" idx)))]))
