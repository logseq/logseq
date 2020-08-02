(ns frontend.components.page
  (:require [rum.core :as rum]
            [frontend.util :as util :refer-macros [profile]]
            [frontend.handler :as handler]
            [frontend.handler.file :as file]
            [frontend.handler.page :as page-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.export :as export-handler]
            [frontend.state :as state]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.components.hiccup :as hiccup]
            [frontend.components.heading :as heading]
            [frontend.components.reference :as reference]
            [frontend.components.svg :as svg]
            [frontend.extensions.graph-2d :as graph-2d]
            [frontend.ui :as ui]
            [frontend.format :as format]
            [frontend.components.content :as content]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.mixins :as mixins]
            [frontend.db-mixins :as db-mixins]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [frontend.utf8 :as utf8]
            [frontend.date :as date]
            [frontend.graph :as graph]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]))

(defn- get-page-name
  [state]
  (let [route-match (first (:rum/args state))]
    (get-in route-match [:parameters :path :name])))

(defn- get-headings
  [repo page-name page-original-name heading? heading-id]
  (when page-name
    (if heading?
      (db/get-heading-and-children repo heading-id)
      (do
        (db/add-page-to-recent! repo page-original-name)
        (db/get-page-headings repo page-name)))))

(rum/defc page-headings-cp < rum/reactive
  [repo page file-path page-name page-original-name encoded-page-name sidebar? journal? heading? heading-id format]
  (let [raw-page-headings (get-headings repo page-name page-original-name heading? heading-id)
        page-headings (db/with-dummy-heading raw-page-headings format
                        (if (empty? raw-page-headings)
                          (let [content (db/get-file repo file-path)]
                            {:heading/page {:db/id (:db/id page)}
                             :heading/file {:db/id (:db/id (:page/file page))}
                             :heading/meta
                             (let [file-id (:db/id (:page/file page))]
                               {:pos (utf8/length (utf8/encode content))
                                :end-pos nil})}))
                        journal?)
        start-level (if journal? 2 1)
        hiccup-config {:id encoded-page-name
                       :start-level start-level
                       :sidebar? sidebar?
                       :heading? heading?}
        hiccup (hiccup/->hiccup page-headings hiccup-config {})]
    (rum/with-key
      (content/content encoded-page-name
                       {:hiccup hiccup
                        :sidebar? sidebar?})
      (str encoded-page-name "-hiccup"))))

(defn presentation
  [repo page journal?]
  [:a.opacity-50.hover:opacity-100.ml-4
   {:title "Presentation mode (Powered by Reveal.js)"
    :on-click (fn []
                (state/sidebar-add-block!
                 repo
                 (:db/id page)
                 :page-presentation
                 {:page page
                  :journal? journal?})
                (ui-handler/show-right-sidebar))}
   svg/slideshow])

(rum/defc today-queries < rum/reactive
  [repo today? sidebar?]
  (when (and today? (not sidebar?))
    (let [queries (state/sub [:config repo :default-queries :journals])]
      (when (seq queries)
        [:div#today-queries.mt-10.ml-2
         (for [{:keys [title] :as query} queries]
           (rum/with-key
             (hiccup/custom-query {:start-level 2} query)
             (str repo "-custom-query-" (cljs.core/random-uuid))))]))))

(defn- delete-page!
  [page-name]
  (page-handler/delete! page-name
                        (fn []
                          (notification/show! (str "Page " page-name " was deleted successfully!")
                                                      :success)))
  (state/set-state! :modal/delete-page false)
  (route-handler/redirect-to-home!))

(defn delete-page-dialog
  [page-name]
  (fn [close-fn]
    [:div
     [:div.sm:flex.sm:items-start
      [:div.mx-auto.flex-shrink-0.flex.items-center.justify-center.h-12.w-12.rounded-full.bg-red-100.sm:mx-0.sm:h-10.sm:w-10
       [:svg.h-6.w-6.text-red-600
        {:stroke "currentColor", :view-box "0 0 24 24", :fill "none"}
        [:path
         {:d
          "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
          :stroke-width "2",
          :stroke-linejoin "round",
          :stroke-linecap "round"}]]]
      [:div.mt-3.text-center.sm:mt-0.sm:ml-4.sm:text-left
       [:h3#modal-headline.text-lg.leading-6.font-medium.text-gray-900
        "Are you sure you want to delete this page?"]]]

     [:div.mt-5.sm:mt-4.sm:flex.sm:flex-row-reverse
      [:span.flex.w-full.rounded-md.shadow-sm.sm:ml-3.sm:w-auto
       [:button.inline-flex.justify-center.w-full.rounded-md.border.border-transparent.px-4.py-2.bg-indigo-600.text-base.leading-6.font-medium.text-white.shadow-sm.hover:bg-indigo-500.focus:outline-none.focus:border-indigo-700.focus:shadow-outline-indigo.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
        {:type "button"
         :on-click (fn []
                     (delete-page! page-name))}
        "Yes"]]
      [:span.mt-3.flex.w-full.rounded-md.shadow-sm.sm:mt-0.sm:w-auto
       [:button.inline-flex.justify-center.w-full.rounded-md.border.border-gray-300.px-4.py-2.bg-white.text-base.leading-6.font-medium.text-gray-700.shadow-sm.hover:text-gray-500.focus:outline-none.focus:border-blue-300.focus:shadow-outline-blue.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
        {:type "button"
         :on-click close-fn}
        "Cancel"]]]]))

(rum/defcs rename-page-dialog-inner <
  (rum/local "" ::input)
  [state page-name close-fn]
  (let [input (get state ::input)]
    [:div
     [:div.sm:flex.sm:items-start
      [:div.mt-3.text-center.sm:mt-0.sm:text-left
       [:h3#modal-headline.text-lg.leading-6.font-medium.text-gray-900
        (str "Rename \"" page-name "\" to:")]]]

     [:input.form-input.block.w-full.sm:text-sm.sm:leading-5.my-2
      {:auto-focus true
       :style {:color "#000"}
       :on-change (fn [e]
                    (reset! input (util/evalue e)))}]

     [:div.mt-5.sm:mt-4.sm:flex.sm:flex-row-reverse
      [:span.flex.w-full.rounded-md.shadow-sm.sm:ml-3.sm:w-auto
       [:button.inline-flex.justify-center.w-full.rounded-md.border.border-transparent.px-4.py-2.bg-indigo-600.text-base.leading-6.font-medium.text-white.shadow-sm.hover:bg-indigo-500.focus:outline-none.focus:border-indigo-700.focus:shadow-outline-indigo.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
        {:type "button"
         :on-click (fn []
                     (let [value @input]
                       (let [value (string/trim value)]
                         (when-not (string/blank? value)
                           (page-handler/rename! page-name value)
                           (state/set-state! :modal/rename-page false)))))}
        "Submit"]]
      [:span.mt-3.flex.w-full.rounded-md.shadow-sm.sm:mt-0.sm:w-auto
       [:button.inline-flex.justify-center.w-full.rounded-md.border.border-gray-300.px-4.py-2.bg-white.text-base.leading-6.font-medium.text-gray-700.shadow-sm.hover:text-gray-500.focus:outline-none.focus:border-blue-300.focus:shadow-outline-blue.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
        {:type "button"
         :on-click close-fn}
        "Cancel"]]]]))

(defn rename-page-dialog
  [page-name]
  (fn [close-fn]
    (rename-page-dialog-inner page-name close-fn)))

;; A page is just a logical heading
(rum/defcs page < rum/reactive
  (db-mixins/clear-query-cache
   (fn [state]
     (let [repo (or (:repo (first (:rum/args state))) (state/get-current-repo))
           encoded-page-name (get-page-name state)]
       (when-not (string/blank? encoded-page-name)
         (let [page-name (string/lower-case (util/url-decode encoded-page-name))
               heading? (util/uuid-string? page-name)]
           (if heading?
             [repo :heading/block (uuid page-name)]
             (when-let [page-id (db/entity repo [:page/name page-name])]
               [repo :page/headings page-id])))))))
  {:did-mount (fn [state]
                (ui-handler/scroll-and-highlight! state)
                (let [page-name (get-page-name state)]
                  (when (= (string/lower-case page-name) "contents")
                    (when-let [first-heading (first (db/get-page-headings "contents"))]
                      (let [edit-id (str "edit-heading-" (:heading/uuid first-heading))]
                        (editor-handler/edit-heading!
                         (:heading/uuid first-heading)
                         :max
                         (:heading/format first-heading)
                         edit-id)
                        (when (string/ends-with? (:heading/content first-heading) "[[]]" )
                          (js/setTimeout #(util/cursor-move-back (gdom/getElement edit-id) 2)
                                         50))
                        (when (string/ends-with? (:heading/content first-heading) "[[]]\n---" )
                          (js/setTimeout #(util/cursor-move-back (gdom/getElement edit-id) 6)
                                         50))))))
                state)
   :did-update ui-handler/scroll-and-highlight!}
  [state {:keys [repo] :as option}]
  (let [current-repo (state/sub :git/current-repo)
        repo (or repo current-repo)
        encoded-page-name (get-page-name state)
        page-name (string/lower-case (util/url-decode encoded-page-name))
        marker-page? (util/marker? page-name)
        priority-page? (contains? #{"a" "b" "c"} page-name)
        format (db/get-page-format page-name)
        journal? (db/journal-page? page-name)
        heading? (util/uuid-string? page-name)
        heading-id (and heading? (uuid page-name))
        sidebar? (:sidebar? option)]
    (cond
      priority-page?
      [:div.page
       [:h1.title
        (str "Priority \"" (string/upper-case page-name) "\"")]
       [:div.ml-2
        (reference/references page-name false true)]]

      marker-page?
      [:div.page
       [:h1.title
        (string/upper-case page-name)]
       [:div.ml-2
        (reference/references page-name true false)]]

      :else
      (let [page (if heading?
                   (->> (:db/id (:heading/page (db/entity repo [:heading/uuid heading-id])))
                        (db/entity repo))
                   (db/entity repo [:page/name page-name]))
            page-name (:page/name page)
            page-original-name (:page/original-name page)
            file (:page/file page)
            file-path (and (:db/id file) (:file/path (db/entity repo (:db/id file))))
            today? (and
                    journal?
                    (= page-name (string/lower-case (date/journal-name))))]
        [:div.flex-1.page.relative
         [:div.relative
          (when-not sidebar?
            (let [links (->>
                         (when file
                           [{:title "Re-index this page"
                             :options {:on-click (fn []
                                                   (file/re-index! file))}}
                            {:title "Copy the whole page as JSON"
                             :options {:on-click (fn []
                                                   (export-handler/copy-page-as-json! page-name))}}
                            (when-not journal?
                              {:title "Rename page"
                               :options {:on-click #(state/set-state! :modal/rename-page true)}})
                            (when-not journal?
                              {:title "Delete page (will delete the file too)"
                               :options {:on-click #(state/set-state! :modal/delete-page true)}})
                            (when-not journal?
                              {:title "Publish this page on Logseq"
                               :options {:on-click (fn []
                                                     (page-handler/publish-page! page-name))}})
                            (when-not journal?
                              {:title "Publish this page as a slide on Logseq"
                               :options {:on-click (fn []
                                                     (page-handler/publish-page-as-slide! page-name))}})
                            (when-not journal?
                              {:title "Un-publish this page on Logseq"
                               :options {:on-click (fn []
                                                     (page-handler/unpublish-page! page-name))}})])
                         (remove nil?))]
              (when (seq links)
                (ui/dropdown-with-links
                 (fn [{:keys [toggle-fn]}]
                   [:a {:style {:position "absolute"
                                :right 0
                                :top 20}
                        :title "More options"
                        :on-click toggle-fn}
                    (svg/vertical-dots {:class (util/hiccup->class "opacity-50.hover:opacity-100.h-5.w-5")})])
                 links
                 {:modal-class (util/hiccup->class
                                "origin-top-right.absolute.right-0.top-10.mt-2.rounded-md.shadow-lg.whitespace-no-wrap.dropdown-overflow-auto.page-drop-options")}))))
          (when-not sidebar?
            [:a {:on-click (fn [e]
                             (util/stop e)
                             (when (gobj/get e "shiftKey")
                               (when-let [page (db/pull repo '[*] [:page/name page-name])]
                                 (state/sidebar-add-block!
                                  repo
                                  (:db/id page)
                                  :page
                                  {:page page}))
                               (ui-handler/show-right-sidebar)))}
             [:h1.title page-original-name]])
          [:div
           [:div.content
            (when (and file-path (not sidebar?) (not journal?) (not heading?))
              [:div.text-sm.ml-1.mb-4.flex-1 {:key "page-file"}
               [:span.opacity-50 "File: "]
               [:a.bg-base-2.p-1.ml-1 {:style {:border-radius 4}
                                       :href (str "/file/" (util/url-encode file-path))}
                file-path]])]

           (when (and repo (not journal?) (not heading?))
             (let [alias (db/get-page-alias-names repo page-name)]
               (when (seq alias)
                 [:div.text-sm.ml-1.mb-4 {:key "page-file"}
                  [:span.opacity-50 "Alias: "]
                  (for [item alias]
                    [:a.p-1.ml-1 {:href (str "/page/" (util/encode-str item))}
                     item])])))


           (when (and heading? (not sidebar?))
             (heading/heading-parents repo heading-id format))

           ;; headings
           (page-headings-cp repo page file-path page-name page-original-name encoded-page-name sidebar? journal? heading? heading-id format)]]

         (when-not heading?
           (today-queries repo today? sidebar?))

         ;; referenced headings
         (when-not sidebar?
           [:div {:key "page-references"}
            (reference/references page-name false)])

         (when-not sidebar?
           [:div {:key "page-unlinked-references"}
            (reference/unlinked-references page-name)])

         (ui/modal :modal/rename-page (rename-page-dialog page-name))
         (ui/modal :modal/delete-page (delete-page-dialog page-name))]))))

(defonce layout (atom [js/window.outerWidth js/window.outerHeight]))

(defonce graph-ref (atom nil))
(rum/defcs global-graph < rum/reactive
  (rum/local false ::show-journal?)
  [state]
  (let [show-journal? (get state ::show-journal?)
        theme (state/sub :ui/theme)
        [width height] (rum/react layout)
        dark? (= theme "dark")
        graph (db/build-global-graph theme @show-journal?)]
    (if (seq (:nodes graph))
      (graph-2d/graph
       (graph/build-graph-opts
        graph dark?
        {:width (- width 24)
         :height (- height 100)
         :ref (fn [v] (reset! graph-ref v))
         :ref-atom graph-ref}))
      [:div.ls-center.mt-20
       [:p.opacity-70.font-medium "Empty"]])))

(rum/defc all-pages < rum/reactive
  []
  (let [current-repo (state/sub :git/current-repo)]
    [:div.flex-1
     [:h1.title "All Pages"]
     (when current-repo
       (let [pages (db/get-pages-with-modified-at current-repo)]
         [:table.table-auto
          [:thead
           [:tr
            [:th "Page name"]
            [:th "Last modified at"]]]
          [:tbody
           (for [[page modified-at] pages]
             (let [encoded-page (util/encode-str page)]
               [:tr {:key encoded-page}
                [:td [:a.text-gray-700 {:href (str "/page/" encoded-page)}
                      page]]
                [:td [:span.text-gray-500.text-sm
                      (if (zero? modified-at)
                        "No data"
                        (date/get-date-time-string
                         (t/to-default-time-zone (tc/to-date-time modified-at))))]]]))]]))]))

(rum/defcs new < rum/reactive
  (rum/local "" ::title)
  (mixins/event-mixin
   (fn [state]
     (mixins/on-enter state
                      :node (gdom/getElement "page-title")
                      :on-enter (fn []
                                  (let [title @(get state ::title)]
                                    (when-not (string/blank? title)
                                      (editor-handler/create-new-page! title)))))))
  [state]
  (let [title (get state ::title)]
    [:div#page-new.flex-1.flex-col {:style {:flex-wrap "wrap"}}
     [:div.mt-10.mb-2 {:style {:font-size "1.5rem"}}
      "What's your new page title?"]
     [:input#page-title.focus:outline-none.ml-1.text-gray-900
      {:style {:border "none"
               :font-size "1.8rem"
               :max-width 300}
       :auto-focus true
       :auto-complete "off"
       :on-change (fn [e]
                    (reset! title (util/evalue e)))}]]))
