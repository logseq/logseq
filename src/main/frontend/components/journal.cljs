(ns frontend.components.journal
  (:require [rum.core :as rum]
            [frontend.util :as util :refer-macros [profile]]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db-mixins :as db-mixins]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.config :as config]
            [frontend.components.content :as content]
            [frontend.components.block :as block]
            [frontend.components.editor :as editor]
            [frontend.components.reference :as reference]
            [frontend.components.page :as page]
            [frontend.components.onboarding :as onboarding]
            [goog.object :as gobj]
            [clojure.string :as string]
            [frontend.handler.block :as block-handler]))

(rum/defc blocks-inner < rum/static
  {:did-mount (fn [state]
                (let [[blocks page] (:rum/args state)
                      first-title (second (first (:block/title (first blocks))))
                      journal? (and (string? first-title)
                                    (date/valid-journal-title? first-title))]
                  (when (and journal?
                             (= (string/lower-case first-title) (string/lower-case page)))
                    (notification/show!
                     [:div
                      [:p
                       (util/format
                        "It seems that you have multiple journals for the same day \"%s\"."
                        first-title)]
                      (ui/button "Go to files"
                                 :href "/all-files"
                                 :on-click notification/clear!)]
                     :error
                     false)))
                state)}
  [blocks page document-mode?]
  (let [start-level (or (:block/level (first blocks)) 1)
        config {:id page
                :start-level 2
                :editor-box editor/box
                :document/mode? document-mode?}]
    (content/content
     page
     {:hiccup (block/->hiccup blocks config {})})))

(rum/defc blocks-cp < rum/reactive db-mixins/query
  {}
  [repo page format]
  (let [raw-blocks (db/get-page-blocks repo page)
        document-mode? (state/sub :document/mode?)
        blocks (->>
                (block-handler/with-dummy-block raw-blocks format nil {:journal? true})
                (db/with-block-refs-count repo))]
    (blocks-inner blocks page document-mode?)))

(rum/defc journal-cp < rum/reactive
  [[title format]]
  (let [;; Don't edit the journal title
        page (string/lower-case title)
        repo (state/sub :git/current-repo)
        encoded-page-name (util/encode-str page)
        today? (= (string/lower-case title)
                  (string/lower-case (date/journal-name)))
        intro? (and (not (state/logged?))
                    (not (config/local-db? repo))
                    (not config/publishing?)
                    today?)]
    [:div.flex-1.journal.page {:class (if intro? "intro" "")}
     (ui/foldable
      [:a.initial-color.title
       {:href (str "/page/" encoded-page-name)
        :on-click (fn [e]
                    (.preventDefault e)
                    (when (gobj/get e "shiftKey")
                      (when-let [page (db/pull [:page/name (string/lower-case title)])]
                        (state/sidebar-add-block!
                         (state/get-current-repo)
                         (:db/id page)
                         :page
                         {:page page
                          :journal? true}))))}
       [:h1.title
        (util/capitalize-all title)]]

      (blocks-cp repo page format))

     (page/today-queries repo today? false)

     (reference/references title false)

     (when intro?
       (onboarding/intro))]))

(rum/defc journals <
  {:did-mount (fn [state]
                (editor-handler/open-last-block! true)
                state)}
  [latest-journals]
  [:div#journals
   (ui/infinite-list
    (for [[journal-name format] latest-journals]
      [:div.journal-item.content {:key journal-name}
       (journal-cp [journal-name format])])
    {:on-load (fn []
                (page-handler/load-more-journals!))})])

(rum/defc all-journals < rum/reactive db-mixins/query
  []
  (let [journals-length (state/sub :journals-length)
        latest-journals (db/get-latest-journals (state/get-current-repo) journals-length)]
    (journals latest-journals)))
