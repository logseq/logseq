(ns frontend.components.widgets
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.handler :as handler]
            [frontend.state :as state]
            [clojure.string :as string]
            [frontend.ui :as ui]))

(rum/defcs choose-preferred-format
  []
  [:div
   [:h1.title {:style {:margin-bottom "0.25rem"}}
    "What's your preferred mode?"]
   [:span.text-gray-500.text-sm.ml-1
    "It'll be used for new pages."]

   [:div.mt-4.ml-1
    (ui/button
      "Markdown"
      :on-click
      #(handler/set-preferred-format! :markdown))

    [:span.ml-2.mr-2 "-OR-"]

    (ui/button
      "Org Mode"
      :on-click
      #(handler/set-preferred-format! :org))]])

(rum/defc add-repo < rum/reactive
  []
  (let [access-token (state/sub [:me :access-token])
        repo-url (state/sub :git/clone-repo)]
    [:div.p-8.flex.items-center.justify-center
     [:div.w-full.mx-auto
      [:div
       [:div
        [:h1.title.mb-1
         "Import your notes"]
        [:p.text-sm.text-gray-500.pl-1 "You can import your notes from a repo on Github."]
        [:div.mt-4.mb-2.relative.rounded-md.shadow-sm.max-w-xs
         [:div.font-bold.text-gray-600.mb-1 "Repo url:"]
         [:input#repo.form-input.block.w-full.sm:text-sm.sm:leading-5
          {:autoFocus true
           :placeholder "https://github.com/username/repo"
           :value repo-url
           :on-change (fn [e]
                        (state/set-git-clone-repo! (util/evalue e)))}]]

        [:div.mt-2.mb-2.relative.rounded-md.shadow-sm.max-w-xs
         [:div.font-bold.text-gray-600.mb-1 "Personal access token (optional):"]
         [:input#repo.form-input.block.w-full.sm:text-sm.sm:leading-5
          {:value access-token
           :on-change (fn [e]
                        (let [value (util/evalue e)]
                          (when-not (string/blank? value)
                            (state/set-github-token! value))))}]]]]

      (ui/button
        "Clone"
        :on-click
        (fn []
          (when (string/starts-with? repo-url "https://github.com/")
            (handler/clone-and-pull repo-url)
            (handler/redirect! {:to :home}))))

      ;; (when git-ask-private-grant?
      ;;   [:div
      ;;    [:hr]
      ;;    [:div
      ;;     [:h3.text-red-700.mb-2 "Git clone failed, it might be two reasons:"]
      ;;     [:ol
      ;;      [:li.mb-1 "Please check the repo link is correct."]
      ;;      [:li
      ;;       [:div.mb-1
      ;;        "You're cloning a "
      ;;        [:b "private"]
      ;;        " repo, we need your permission grants for that.
      ;;       We promise that our server will never store your github oauth token, it'll be stored securely and only in the "
      ;;        [:a.underline {:title "Which has a HttpOnly flag"}
      ;;         "browser cookie"]
      ;;        "."]
      ;;       [:a {:href "/auth/github_ask_repo_permission"}
      ;;        (ui/button "Grant us your private repo permission")]]]]])
      ]]))
