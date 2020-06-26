(ns frontend.components.page
  (:require [rum.core :as rum]
            [frontend.util :as util :refer-macros [profile]]
            [frontend.handler :as handler]
            [frontend.state :as state]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.components.hiccup :as hiccup]
            [frontend.components.reference :as reference]
            [frontend.components.svg :as svg]
            [frontend.ui :as ui]
            [frontend.format :as format]
            [frontend.components.content :as content]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.mixins :as mixins]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [frontend.utf8 :as utf8]
            [frontend.date :as date]
            [frontend.expand :as expand]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]))

(defn- get-page-name
  [state]
  (let [route-match (first (:rum/args state))]
    (get-in route-match [:parameters :path :name])))

(defn- get-headings
  [repo page-name journal? heading?]
  (if heading?
    (db/get-heading-and-children repo (uuid page-name))
    (db/get-page-headings repo page-name)))

(rum/defc page-headings-cp < rum/reactive
  [repo page raw-page-headings file-path page-name encoded-page-name sidebar? journal? heading? format]
  (let [page-headings (db/with-dummy-heading raw-page-headings format
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
                       :sidebar? sidebar?}
        hiccup (hiccup/->hiccup page-headings hiccup-config {})]
    (rum/with-key
      (content/content encoded-page-name
                      {:hiccup hiccup
                       :sidebar? sidebar?})
      (str encoded-page-name "-hiccup"))))

;; A page is just a logical heading
(rum/defcs page < rum/reactive
  (mixins/keyboard-mixin
   "tab"
   (fn [state e]
     (when (and
            ;; not input, t
            (nil? (state/get-edit-input-id))
            (string/blank? (:search/q @state/state)))
       (util/stop e)
       (let [encoded-page-name (get-page-name state)
             id encoded-page-name]
         (expand/cycle!)
         (handler/re-render-root!)))))
  ;; (mixins/perf-measure-mixin "Page")
  [state {:keys [repo] :as option}]
  (let [repo (or repo (state/get-current-repo))
        encoded-page-name (get-page-name state)
        page-name (string/lower-case (util/url-decode encoded-page-name))
        marker-page? (db/marker-page? page-name)
        format (db/get-page-format page-name)
        journal? (db/journal-page? page-name)
        heading? (util/uuid-string? page-name)
        heading-id (and heading? (uuid page-name))
        sidebar? (:sidebar? option)
        raw-page-headings (get-headings repo page-name journal? heading?)]
    (cond
      marker-page?
      [:div
       [:h1.title
        (string/upper-case page-name)]
       [:div.ml-2
        (reference/references page-name false true)]]

      :else
      (let [page (if heading?
                   (->> (:db/id (:heading/page (db/entity repo [:heading/uuid heading-id])))
                        (db/entity repo))
                   (db/entity repo [:page/name page-name]))
            page-name (:page/name page)
            file (:page/file page)
            file-path (and (:db/id file) (:file/path (db/entity repo (:db/id file))))
            starred? (contains? (set
                                 (some->> (state/sub [:config repo :starred])
                                          (map string/lower-case)))
                                page-name)
            today? (and
                    journal?
                    (= page-name (string/lower-case (date/journal-name))))]
        [:div.flex-1.page
         (when-not sidebar?
           [:div.flex.flex-row.justify-between.items-center {:key "page-title"}
            [:div.flex.flex-row
             [:a {:on-click (fn [e]
                              (util/stop e)
                              (when (gobj/get e "shiftKey")
                                (when-let [page (db/pull repo '[*] [:page/name page-name])]
                                  (state/sidebar-add-block!
                                   repo
                                   (:db/id page)
                                   :page
                                   {:page page}))
                                (handler/show-right-sidebar)))}
              [:h1.title
               (util/capitalize-all page-name)]]

             [:a.ml-1.text-gray-500.hover:text-gray-700
              {:class (if starred? "text-gray-800")
               :on-click (fn []
                           ;; TODO: save to config file
                           (handler/star-page! page-name starred?))}
              (if starred?
                (svg/star-solid "stroke-current")
                (svg/star-outline "stroke-current h-5 w-5"))]]

            [:a {:title "Presentation mode(Reveal.js)"
                 :on-click (fn []
                             (state/sidebar-add-block!
                              repo
                              (:db/id page)
                              :page-presentation
                              {:page page
                               :journal? journal?})
                             (handler/show-right-sidebar))}
             svg/reveal-js]])

         (when (and file-path (not sidebar?) (not journal?))
           [:div.text-sm.ml-1.mb-2 {:key "page-file"}
            "File: "
            [:a.bg-base-2.p-1.ml-1 {:style {:border-radius 4}
                                    :href (str "/file/" (util/url-encode file-path))}
             file-path]])

         (when (and repo (not journal?) (not heading?))
           (let [alias (some->> (db/get-page-alias repo page-name)
                                (remove util/file-page?))]
             (when (seq alias)
               [:div.alias.ml-1.mb-1.content {:key "page-alias"}
                [:span.font-bold.mr-1 "Page aliases: "]
                (for [item alias]
                  [:a {:href (str "/page/" (util/url-encode item))}
                   [:span.mr-1 (util/capitalize-all item)]])])))

         ;; headings
         (rum/with-key
           (page-headings-cp repo page raw-page-headings file-path page-name encoded-page-name sidebar? journal? heading? format)
           "page-headings")

         (when (and today? (not sidebar?))
           (let [queries (state/sub [:config repo :default-queries :journals])]
             (when (seq queries)
               [:div#today-queries {:keys "page-today-queries"}
                (for [{:keys [title query]} queries]
                  [:div {:key (str "query-" title)}
                   (hiccup/custom-query {:start-level 2} {:query-title title}
                                        query)])])))

         ;; referenced headings
         [:div {:key "page-references"}
          (reference/references page-name false false)]]))))

(rum/defc all-pages < rum/reactive
  []
  (let [current-repo (state/sub :git/current-repo)]
    [:div.flex-1
     [:h1.title
      "All Pages"]
     (when current-repo
       (let [pages (db/get-pages-with-modified-at current-repo)]
         [:table.table-auto
          [:thead
           [:tr
            [:th "Page name"]
            [:th "Last modified at"]]]
          [:tbody
           (for [[page modified-at] pages]
             (let [page-id (util/url-encode page)]
               [:tr {:key page-id}
                [:td [:a.text-gray-700 {:href (str "/page/" page-id)}
                      (util/capitalize-all page)]]
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
                                      (handler/create-new-page! title)))))))
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
