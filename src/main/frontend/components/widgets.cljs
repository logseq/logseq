(ns frontend.components.widgets
  (:require [clojure.string :as string]
            [frontend.context.i18n :as i18n]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.user :as user-handler]
            [frontend.handler.web.nfs :as nfs]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [rum.core :as rum]))

(rum/defc choose-preferred-format
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

(rum/defcs add-github-repo <
  (rum/local "" ::repo)
  (rum/local "" ::branch)
  [state]
  (let [repo (get state ::repo)
        branch (get state ::branch)]
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div.flex.flex-col
       [:div.w-full.mx-auto
        [:div
         [:div
          [:h1.title
           (t :git/add-repo-prompt)]
          [:div.mt-4.mb-4.relative.rounded-md.shadow-sm.max-w-xs
           [:input#repo.form-input.block.w-full.sm:text-sm.sm:leading-5
            {:autoFocus true
             :placeholder "https://github.com/username/repo"
             :on-change (fn [e]
                          (reset! repo (util/evalue e)))}]]
          [:label.font-medium "Default Branch (make sure it's matched with your setting on GitHub): "]
          [:div.mt-2.mb-4.relative.rounded-md.shadow-sm.max-w-xs
           [:input#branch.form-input.block.w-full.sm:text-sm.sm:leading-5
            {:value @branch
             :placeholder "e.g. master"
             :on-change (fn [e]
                          (reset! branch (util/evalue e)))}]]]]

        (ui/button
         (t :git/add-repo-prompt-confirm)
         :on-click
         (fn []
           (let [branch (string/trim @branch)]
             (if (string/blank? branch)
               (notification/show!
                [:p.text-gray-700.dark:text-gray-300 "Please input a branch, make sure it's matched with your setting on GitHub."]
                :error
                false)
               (let [repo (util/lowercase-first @repo)]
                 (if (util/starts-with? repo "https://github.com/")
                   (let [repo (string/replace repo ".git" "")]
                     (repo-handler/create-repo! repo branch))

                   (notification/show!
                    [:p.text-gray-700.dark:text-gray-300 "Please input a valid repo url, e.g. https://github.com/username/repo"]
                    :error
                    false)))))))]])))

(rum/defcs add-local-directory
  []
  (rum/with-context [[t] i18n/*tongue-context*]
    [:div.flex.flex-col
     [:h1.title "Add a graph"]
     (let [nfs-supported? (nfs/supported?)]
       [:div.cp__widgets-open-local-directory
        [:div.select-file-wrap.cursor
         (when nfs-supported?
           {:on-click #(page-handler/ls-dir-files! shortcut/refresh!)})
         [:div
          [:h1.title "Open a local directory"]
          [:p "Logseq supports both Markdown and Org-mode. You can open an existing directory or create a new one on your device, a directory is also known simply as a folder. Your data will be stored only on this device."]
          [:p "After you have opened your directory, it will create three folders in that directory:"]
          [:ul
           [:li "/journals - store your journal pages"]
           [:li "/pages - store the other pages"]
           [:li "/logseq - store configuration, custom.css, and some metadata."]]
          (when-not nfs-supported?
            (ui/admonition :warning
                           [:p "It seems that your browser doesn't support the "

                            [:a {:href "https://web.dev/file-system-access/"
                                 :target "_blank"}
                             "new native filesystem API"]
                            [:span ", please use any Chromium 86+ based browser like Chrome, Vivaldi, Edge, etc. Notice that the API doesn't support mobile browsers at the moment."]]))]]])]))

(rum/defcs add-graph <
  [state & {:keys [graph-types]
            :or {graph-types [:local :github]}
            :as opts}]
  (let [github-authed? (state/github-authed?)
        generate-f (fn [x]
                     (case x
                       :github
                       (when (and github-authed? (not (util/electron?)))
                         (rum/with-key (add-github-repo)
                           "add-github-repo"))

                       :local
                       (rum/with-key (add-local-directory)
                         "add-local-directory")

                       nil))
        available-graph (->> (set graph-types)
                             (keep generate-f)
                             (vec)
                             (interpose [:b.mt-10.mb-5.opacity-50 "OR"]))]
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div.p-8.flex.flex-col available-graph])))
