(ns frontend.components.reference
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.state :as state]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.components.hiccup :as hiccup]
            [frontend.ui :as ui]
            [frontend.format :as format]
            [frontend.components.content :as content]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.components.svg :as svg]
            [frontend.components.editor :as editor]
            [frontend.handler.page :as page-handler]
            [frontend.db-mixins :as db-mixins]
            [clojure.set :as set]
            [clojure.string :as string]))

(rum/defc references < rum/reactive db-mixins/query
  [page-name marker? priority?]
  (when page-name
    (let [block? (util/uuid-string? page-name)
          block-id (and block? (uuid page-name))
          page-name (string/lower-case page-name)
          encoded-page-name (util/url-encode page-name)
          journal? (date/valid-journal-title? (string/capitalize page-name))
          ref-blocks (cond
                       priority?
                       (db/get-blocks-by-priority (state/get-current-repo) page-name)

                       marker?
                       (db/get-marker-blocks (state/get-current-repo) page-name)
                       block-id
                       (db/get-block-referenced-blocks block-id)
                       :else
                       (db/get-page-referenced-blocks page-name))
          scheduled-or-deadlines (if journal?
                                   (db/get-date-scheduled-or-deadlines (string/capitalize page-name))
                                   nil)
          n-ref (count ref-blocks)]
      (when (or (> n-ref 0)
                (seq scheduled-or-deadlines))
        [:div.references.mt-6.flex-1.flex-row
         [:div.content
          (when (seq scheduled-or-deadlines)
            (ui/foldable
             [:h2.font-bold.opacity-50 (let []
                                         "Scheduled AND Deadline")]
             [:div.references-blocks.mb-6
              (let [ref-hiccup (hiccup/->hiccup scheduled-or-deadlines
                                                {:id (str encoded-page-name "-agenda")
                                                 :start-level 2
                                                 :ref? true
                                                 :group-by-page? true
                                                 :editor-box editor/box}
                                                {})]
                (content/content encoded-page-name
                                 {:hiccup ref-hiccup}))]))

          (ui/foldable
           [:h2.font-bold.opacity-50 (let []
                                       (str n-ref " Linked References"))]
           [:div.references-blocks
            (let [ref-hiccup (hiccup/->hiccup ref-blocks
                                              {:id encoded-page-name
                                               :start-level 2
                                               :ref? true
                                               :group-by-page? true
                                               :editor-box editor/box}
                                              {})]
              (content/content encoded-page-name
                               {:hiccup ref-hiccup}))])]]))))

(rum/defc unlinked-references-aux < rum/reactive db-mixins/query
  [page-name n-ref]
  (let [ref-blocks (db/get-page-unlinked-references page-name)
        encoded-page-name (util/url-encode page-name)]
    (reset! n-ref (count ref-blocks))
    [:div.references-blocks
     (let [ref-hiccup (hiccup/->hiccup ref-blocks
                                       {:id (str encoded-page-name "-unlinked-")
                                        :start-level 2
                                        :ref? true
                                        :group-by-page? true
                                        :editor-box editor/box}
                                       {})]
       (content/content encoded-page-name
                        {:hiccup ref-hiccup}))]))

(rum/defcs unlinked-references < rum/reactive
  (rum/local nil ::n-ref)
  [state page-name]
  (let [n-ref (get state ::n-ref)]
    (when page-name
      (let [page-name (string/lower-case page-name)]
        [:div.references.mt-6.flex-1.flex-row
         [:div.content.flex-1
          (ui/foldable
           [:h2.font-bold {:style {:opacity "0.3"}}
            (if @n-ref
              (str @n-ref " Unlinked References")
              "Unlinked References")]
           (fn []
             (unlinked-references-aux page-name n-ref))
           true)]]))))
