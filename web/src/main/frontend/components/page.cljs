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

;; A page is just a logical heading
(rum/defcs page < rum/reactive
  (mixins/keyboard-mixin "tab"
                         (fn [state e]
                           (when (and
                                  ;; not input, t
                                  (nil? (state/get-edit-input-id))
                                  (string/blank? (:search/q @state/state)))
                             (util/stop e)
                             (let [encoded-page-name (get-page-name state)
                                   id encoded-page-name]
                               (expand/toggle-all! id)))))
  ;; (mixins/perf-measure-mixin "Page")
  [state {:keys [repo] :as option}]
  (let [repo (or repo (state/sub :git/current-repo))
        encoded-page-name (get-page-name state)
        page-name (string/lower-case (util/url-decode encoded-page-name))
        format (db/get-page-format page-name)
        journal? (db/journal-page? page-name)
        heading? (util/uuid-string? page-name)
        heading-id (and heading? (uuid page-name))
        sidebar? (:sidebar? option)
        raw-page-headings (get-headings repo page-name journal? heading?)
        page-name (if heading?
                    (:page/name (db/entity repo (:db/id (:heading/page (first raw-page-headings)))))
                    page-name)
        page (db/entity repo [:page/name page-name])
        file (:page/file page)]
    (cond
      (db/marker-page? page-name)
      [:div
       [:h1.title
        (string/upper-case page-name)]
       [:div.ml-2
        (reference/references page-name false true)]]

      (and sidebar? file (empty? raw-page-headings))
      (do
        (state/sidebar-remove-block! (:sidebar/idx option))
        [:div.text-sm "Empty"])

      :else
      (let [file-path (and (:db/id file) (:file/path (db/entity repo (:db/id file))))
            content (db/get-file-no-sub repo file-path)
            page-headings (db/with-dummy-heading raw-page-headings format
                            (if (empty? raw-page-headings)
                              {:heading/page {:db/id (:db/id page)}
                               :heading/file {:db/id (:db/id (:page/file page))}
                               :heading/meta
                               (let [file-id (:db/id (:page/file page))]
                                 {:pos (utf8/length (utf8/encode content))
                                  :end-pos nil})})
                            journal?)
            start-level (if journal? 2 1)
            hiccup-config {:id encoded-page-name
                           :start-level start-level
                           :sidebar? sidebar?}
            hiccup (hiccup/->hiccup page-headings hiccup-config {})
            starred? (contains? (set
                                 (some->> (state/sub [:config repo :starred])
                                          (map string/lower-case)))
                                page-name)
            today? (and
                    journal?
                    (= page-name (string/lower-case (date/journal-name))))]
        [:div.flex-1.page
         (when-not sidebar?
           [:div.flex.flex-row.justify-between.items-center
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
           [:div.text-sm.ml-1
            "File: "
            [:a.bg-base-2.p-1.ml-1 {:style {:border-radius 4}
                                    :href (str "/file/" (util/url-encode file-path))}
             file-path]])

         (when (and repo (not journal?))
           (let [alias (some->> (db/get-page-alias repo page-name)
                                (remove util/file-page?))]
             (when (seq alias)
               [:div.alias.ml-1.mb-1.content
                [:span.font-bold.mr-1 "Page aliases: "]
                (for [item alias]
                  [:a {:href (str "/page/" (util/url-encode item))}
                   [:span.mr-1 (util/capitalize-all item)]])])))

         ;; content before headings, maybe directives or summary it can be anything
         (when (and (not journal?) (not heading?) (not sidebar?))
           (when-let [path (let [file-id (:db/id (:page/file page))]
                             (:file/path (db/entity repo file-id)))]
             (let [encoded-path (util/url-encode path)
                   heading-start-pos (and
                                      (seq raw-page-headings)
                                      (get-in (first raw-page-headings) [:heading/meta :pos]))]
               (when (or
                      (nil? heading-start-pos)
                      (and heading-start-pos (not (zero? heading-start-pos))))
                 (let [encoded-content (utf8/encode content)
                       heading-start-pos (or heading-start-pos (utf8/length encoded-content))
                       content-before-heading (string/trim (utf8/substring encoded-content 0 heading-start-pos))]
                   [:div.before-heading.ml-1.mt-5.mb-3
                    (content/content
                     encoded-path
                     {:content content-before-heading
                      :format format
                      :on-hide (fn [value]
                                 (let [new-content (str (string/trim value)
                                                        "\n"
                                                        (when heading-start-pos
                                                          (utf8/substring encoded-content heading-start-pos)))]
                                   (when (not= (string/trim new-content)
                                               (string/trim content))
                                     (handler/alter-file repo path new-content {:re-render-root? true}))))})])))))

         ;; headings
         (content/content encoded-page-name
                          {:hiccup hiccup
                           :sidebar? sidebar?})

         (when (and today? (not sidebar?))
           (let [queries (state/sub [:config repo :default-queries :journals])]
             (when (seq queries)
               [:div#today-queries
                (for [{:keys [title query]} queries]
                  [:div {:key (str "query-" title)}
                   (hiccup/custom-query {:start-level 2} {:query-title title}
                                        query)])])))

         ;; referenced headings
         (reference/references page-name false false)]))))

(rum/defc all-pages < rum/reactive
  []
  (let [current-repo (state/sub :git/current-repo)]
    [:div.flex-1
     [:h1.title
      "All Pages"]
     (when current-repo
       (let [pages (db/get-pages-with-modified-at current-repo)]
         [:table
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
    [:div#page-new
     [:div.mt-10.mb-2 {:style {:font-size "1.5rem"}}
      "What's your new page title?"]
     [:input#page-title.focus:outline-none.ml-1.text-gray-900
      {:style {:border "none"
               :font-size "1.8rem"}
       :auto-focus true
       :auto-complete "off"
       :on-change (fn [e]
                    (reset! title (util/evalue e)))}]]))
