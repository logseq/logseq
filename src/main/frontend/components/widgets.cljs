(ns frontend.components.widgets
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.handler.user :as user-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.export :as export-handler]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [frontend.config :as config]
            [clojure.string :as string]
            [frontend.ui :as ui]
            [frontend.db :as db]
            [frontend.version :as version]
            [frontend.components.commit :as commit]
            [frontend.context.i18n :as i18n]
            [reitit.frontend.easy :as rfe]
            [frontend.components.svg :as svg]
            [frontend.handler.web.nfs :as nfs]))

(rum/defcs choose-preferred-format
  []
  (rum/with-context [[t] i18n/*tongue-context*]
    [:div
     [:h1.title {:style {:margin-bottom "0.25rem"}}
      (t :format/preferred-mode)]

     [:div.mt-4.ml-1
      (ui/button
       "Markdown"
       :on-click
       #(user-handler/set-preferred-format! :markdown))

      [:span.ml-2.mr-2 "-OR-"]

      (ui/button
       "Org Mode"
       :on-click
       #(user-handler/set-preferred-format! :org))]]))

(rum/defcs add-graph <
  (rum/local "" ::repo)
  (rum/local "master" ::branch)
  [state]
  (let [repo (get state ::repo)
        branch (get state ::branch)
        login-source (state/get-login-source)]
    (rum/with-context [[t] i18n/*tongue-context*]
      (if (= "github" login-source)
        [:div.p-8.flex.items-center.justify-center
        [:div.w-full.mx-auto
         [:div
          [:div
           [:h1.title.mb-1
            (t :git/add-repo-prompt)]
           (ui/admonition :warning
             [:p "Make sure that you've created this repo on GitHub."])
           [:div.mt-4.mb-4.relative.rounded-md.shadow-sm.max-w-xs
            [:input#repo.form-input.block.w-full.sm:text-sm.sm:leading-5
             {:autoFocus true
              :placeholder "https://github.com/username/repo"
              :on-change (fn [e]
                           (reset! repo (util/evalue e)))}]]

           [:label.font-medium "Default Branch (make sure it's matched with your setting on Github): "]
           [:div.mt-2.mb-4.relative.rounded-md.shadow-sm.max-w-xs
            [:input#branch.form-input.block.w-full.sm:text-sm.sm:leading-5
             {:value @branch
              :placeholder "master"
              :on-change (fn [e]
                           (reset! branch (util/evalue e)))}]]]]

         (ui/button
           (t :git/add-repo-prompt-confirm)
           :on-click
           (fn []
             (let [branch (string/trim @branch)]
               (if (string/blank? branch)
                 (notification/show!
                   [:p "Please input a branch, make sure it's matched with your setting on Github."]
                   :error
                   false)
                 (let [repo (util/lowercase-first @repo)]
                   (if (util/starts-with? repo "https://github.com/")
                     (let [repo (string/replace repo ".git" "")]
                       (repo-handler/create-repo! repo branch))

                     (notification/show!
                       [:p "Please input a valid repo url, e.g. https://github.com/username/repo"]
                       :error
                       false)))))))]]

        [:div.p-8.flex.items-center.justify-center
         [:div.w-full.mx-auto
          [:div
           [:div
            [:h1.title.mb-1
             "Please open a local directory : "]]
           [:a.text-lg.font-medium.opacity-70.hover:opacity-100.ml-3.block
            {:on-click (fn [] (nfs/ls-dir-files))}
            [:div.flex.flex-row
             [:span.inline-block svg/folder-add-large]
             (when-not config/mobile?
               [:span.ml-1.inline-block {:style {:margin-top "20px"}}
                (t :open)])]]]]]))))
