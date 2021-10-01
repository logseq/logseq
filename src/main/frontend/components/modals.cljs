(ns frontend.components.modals
  (:require [frontend.db.model :as db-model]
            [frontend.handler.page :as page-handler]
            [frontend.handler.route :as route-handler]
            [frontend.ui :as ui]
            [clojure.string :as string]
            [rum.core :as rum]
            [frontend.state :as state]
            [frontend.mixins :as mixins]
            [frontend.context.i18n :as i18n]
            [goog.dom :as gdom]))

(rum/defcs new-page-modal <
           (mixins/event-mixin
             (fn [state]
               (mixins/on-enter
                 state
                 :node (gdom/getElement "input-new-page-title")
                 :on-enter (fn [^js e]
                             (let [^js target (.-target e)
                                   value (.-value target)]
                               (when-let [title (and (not (string/blank? (string/trim value))) value)]
                                 (if (db-model/page-empty? (state/get-current-repo) title)
                                   (page-handler/create! title {:redirect? true})
                                   (route-handler/redirect! {:to :page
                                                             :path-params {:name title}}))))))))
           [state]
           (rum/with-context
             [[t] i18n/*tongue-context*]
             [:div
              [:h2.text-xl.pb-4 (t :new-page)]
              [:input#input-new-page-title.form-input
               {:autoFocus true
                :placeholder "page title"}]
              [:p.py-2.flex (ui/button (t :submit))]]))

(defn show-new-page-modal! []
  (state/set-modal! new-page-modal))
