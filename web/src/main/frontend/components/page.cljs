(ns frontend.components.page
  (:require [rum.core :as rum]
            [frontend.util :as util]
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
            [frontend.utf8 :as utf8]))

(defn- get-page-name
  [state]
  (let [route-match (first (:rum/args state))]
    (get-in route-match [:parameters :path :name])))

(defn- get-headings
  [page-name journal? heading?]
  (if heading?
    (util/react [(db/pull-heading (uuid page-name))])
    (let [page-headings (db/get-page-headings page-name)
          page-headings (if journal?
                          (update (vec page-headings) 0 assoc :heading/lock? true)
                          page-headings)]
      page-headings)))

;; A page is just a logical heading
(rum/defcs page < rum/reactive
  [state option]
  (let [encoded-page-name (get-page-name state)
        page-name (string/lower-case (util/url-decode encoded-page-name))
        format (db/get-page-format page-name)
        journal? (db/journal-page? page-name)
        heading? (util/uuid-string? page-name)
        heading-id (and heading? (uuid page-name))
        sidebar? (:sidebar? option)
        raw-page-headings (get-headings page-name journal? heading?)
        page-name (if heading?
                    (:page/name (db/entity (:db/id (:heading/page (first raw-page-headings)))))
                    page-name)
        page (db/entity [:page/name page-name])
        file (:page/file page)
        file-path (and (:db/id file) (:file/path (db/entity (:db/id file))))
        page-headings (db/with-dummy-heading raw-page-headings format
                        (if (empty? raw-page-headings)
                          {:heading/page {:db/id (:db/id page)}
                           :heading/file {:db/id (:db/id (:page/file page))}
                           :heading/meta
                           (let [file-id (:db/id (:page/file page))
                                 content (state/get-file file-path)]
                             {:pos (utf8/length (utf8/encode content))
                              :end-pos nil})})
                        journal?)
        start-level (if journal? 2 1)
        hiccup (hiccup/->hiccup page-headings {:id encoded-page-name
                                               :start-level start-level
                                               :sidebar? sidebar? })
        repo (state/get-current-repo)
        starred? (contains? (set
                             (some->> (state/sub [:config repo :starred])
                                      (map string/lower-case)))
                            page-name)]
    [:div.flex-1.page
     (when-not sidebar?
       [:div.flex.flex-row
        [:a {:on-click (fn [e]
                         (util/stop e)
                         (when (gobj/get e "shiftKey")
                           (when-let [page (db/pull [:page/name page-name])]
                             (state/sidebar-add-block!
                              (:db/id page)
                              :page
                              {:page page}))
                           (handler/show-right-sidebar)))}
         [:h1.title
          (util/capitalize-all page-name)]]

        [:a.ml-1.text-gray-500.hover:text-gray-700
         {:class (if starred? "text-gray-800")
          :on-click (fn []
                      (handler/star-page! page-name starred?))}
         (if starred?
           (svg/star-solid "stroke-current")
           (svg/star-outline "stroke-current h-5 w-5"))]])

     (when (and file-path (not sidebar?) (not journal?))
       [:div.text-sm.mb-2.ml-1 "File: "
        [:a.bg-base-2.p-1.ml-1 {:style {:border-radius 4}
                                :href (str "/file/" (util/url-encode file-path))}
         file-path]])

     (when (and repo (not journal?))
       (let [alias (db/get-page-alias repo page-name)]
         (when (seq alias)
           [:div.alias.ml-1.mb-1.content
            [:span.font-bold.mr-1 "Page aliases: "]
            (for [item alias]
              [:a {:href (str "/page/" (util/url-encode item))}
               [:span.mr-1 (util/capitalize-all item)]])])))

     ;; content before headings, maybe directives or summary it can be anything
     (when (and (not journal?) (not heading?) (:page/file page))
       (let [path (let [file-id (:db/id (:page/file page))]
                    (:file/path (db/entity file-id)))
             encoded-path (util/url-encode path)
             heading-start-pos (get-in (first raw-page-headings) [:heading/meta :pos])]
         (when (or (not (zero? heading-start-pos))
                   (seq (:page/directives page)))
           (let [content (state/get-file path)
                 encoded-content (utf8/encode content)
                 content-before-heading (string/trim (utf8/substring encoded-content 0 heading-start-pos))]
             [:div.before-heading.ml-4
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
                               (handler/alter-file (state/get-current-repo) path new-content nil))))})]))))
     ;; headings
     (content/content encoded-page-name
                      {:hiccup hiccup
                       :sidebar? sidebar?})

     ;; referenced headings
     (when-not sidebar?
       (reference/references page-name))]))

(rum/defc all-pages < rum/reactive
  []
  (let [current-repo (state/sub :git/current-repo)]
    [:div.flex-1
     [:h1.title
      "All Pages"]
     (when current-repo
       (let [pages (->> (db/get-pages current-repo)
                        (remove util/file-page?)
                        sort)]
         (for [page pages]
           (let [page-id (util/url-encode page)]
             [:div {:key page-id}
              [:a {:href (str "/page/" page-id)}
               (util/capitalize-all page)]]))))]))

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
