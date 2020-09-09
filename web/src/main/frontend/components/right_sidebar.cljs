(ns frontend.components.right-sidebar
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.components.svg :as svg]
            [frontend.components.page :as page]
            [frontend.components.hiccup :as hiccup]
            [frontend.components.block :as block]
            [frontend.extensions.graph-2d :as graph-2d]
            [frontend.components.onboarding :as onboarding]
            [frontend.handler :as handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.page :as page-handler]
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

(rum/defc block-cp < rum/reactive
  [repo idx block]
  (let [id (:block/uuid block)]
    (page/page {:parameters {:path {:name (str id)}}
                :sidebar? true
                :sidebar/idx idx
                :repo repo})))

(defn page-graph
  [page]
  (let [theme (:ui/theme @state/state)
        dark? (= theme "dark")
        graph (if (util/uuid-string? page)
                (db/build-block-graph (uuid page) theme)
                (db/build-page-graph page theme))]
    (when (seq (:nodes graph))
      [:div.sidebar-item.flex-col.flex-1
       (graph-2d/graph
        (graph/build-graph-opts
         graph dark? false
         {:width 600
          :height 600}))])))

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
  [:div.contents.flex-col.flex.ml-3.mt-2
   (when-let [contents (db/entity [:page/name "contents"])]
     (page/contents-page contents))])

(defn build-sidebar-item
  [repo idx db-id block-type block-data]
  (case block-type
    :contents
    [[:a {:on-click (fn [e]
                      (util/stop e)
                      (if-not (db/entity [:page/name "contents"])
                        (page-handler/create! "contents")
                        (route-handler/redirect! {:to :page
                                                  :path-params {:name "contents"}})))}
      "Contents"]
     (contents)]

    :recent
    ["Recent" (recent-pages)]

    :help
    ["Help" (onboarding/help)]

    :page-graph
    [(str "Graph of " (util/capitalize-all block-data))
     (page-graph block-data)]

    :block-ref
    ["Block reference"
     (let [block (:block block-data)
           block-id (:block/uuid block)
           format (:block/format block)]
       [[:div.ml-2.mt-1
         (block/block-parents repo block-id format)]
        [:div.ml-2
         (block-cp repo idx block)]])]

    :block
    (let [block-id (:block/uuid block-data)
          format (:block/format block-data)]
      [(block/block-parents repo block-id format)
       [:div.ml-2
        (block-cp repo idx block-data)]])

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
          blocks (db/get-page-blocks repo page-name)
          blocks (if journal?
                     (rest blocks)
                     blocks)
          sections (hiccup/build-slide-sections blocks {:id "slide-reveal-js"
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
        sidebar-open? (state/sub :ui/sidebar-open?)
        repo (state/sub :git/current-repo)
        match (state/sub :route-match)
        theme (state/sub :ui/theme)
        dark? (= "dark" theme)]
    [:div#right-sidebar.flex-col {:style {:height "100%"
                                          :overflow "hidden"
                                          :flex (if sidebar-open?
                                                  "1 0 40%"
                                                  "0 0 0px")}}
     (if sidebar-open?
       [:div {:style {:flex "1 1 auto"
                      :padding 12
                      :height "100%"
                      :overflow-y "scroll"
                      :overflow-x "hidden"
                      :box-sizing "content-box"
                      :margin-right -17}}
        [:div.flex.flex-row.mb-2 {:key "right-sidebar-settings"}
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
           "Help"]]]

        (for [[idx [repo db-id block-type block-data]] (medley/indexed blocks)]
          (rum/with-key
            (sidebar-item repo idx db-id block-type block-data)
            (str "sidebar-block-" idx)))])]))
