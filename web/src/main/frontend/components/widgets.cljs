(ns frontend.components.widgets
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.handler :as handler]
            [frontend.handler.user :as user-handler]
            [frontend.handler.git :as git-handler]
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
            [frontend.components.svg :as svg]
            [frontend.components.commit :as commit]
            [clojure.set :as set]))

(rum/defcs choose-preferred-format
  []
  [:div
   [:h1.title {:style {:margin-bottom "0.25rem"}}
    "What's your preferred mode?"]

   [:div.mt-4.ml-1
    (ui/button
      "Markdown"
      :on-click
      #(user-handler/set-preferred-format! :markdown))

    [:span.ml-2.mr-2 "-OR-"]

    (ui/button
      "Org Mode"
      :on-click
      #(user-handler/set-preferred-format! :org))]])

(rum/defc sync-status < rum/reactive
  []
  (let [repo (state/get-current-repo)]
    (when-not (= repo config/local-repo)
      (let [git-status (state/sub [:git/status repo])
            pulling? (= :pulling git-status)
            pushing? (= :pushing git-status)
            last-pulled-at (db/sub-key-value repo :git/last-pulled-at)
            changed-files (state/sub [:repo/changed-files repo])
            should-push? (seq changed-files)]
        [:div.flex-row.flex.items-center
         (when pushing?
           [:span.lds-dual-ring.mt-1])
         (ui/dropdown
          (fn [{:keys [toggle-fn]}]
            [:div.cursor.w-2.h-2.sync-status.mr-2
             {:class (if (or should-push? pushing?) "bg-orange-400" "bg-green-600")
              :style {:border-radius "50%"
                      :margin-top 2}
              :on-mouse-over
              (fn [e]
                (toggle-fn)
                (js/setTimeout repo-handler/check-changed-files-status 0))}])
          (fn [{:keys [toggle-fn]}]
            [:div.p-2.rounded-md.shadow-xs.bg-base-3.flex.flex-col.sync-content
             {:on-mouse-leave toggle-fn}
             (if (and should-push? (seq changed-files))
               [:div
                [:div.changes
                 [:ul
                  (for [file changed-files]
                    [:li {:key (str "sync-" file)}
                     [:div.flex.flex-row.justify-between.align-items
                      [:a {:href (str "/file/" (util/encode-str file))}
                       file]
                      [:a.ml-4.text-sm.mt-1
                       {:on-click (fn [e]
                                    (export-handler/download-file! file))}
                       [:span "Download"]]]])]]
                ;; [:a.text-sm.font-bold {:href "/diff"} "Check diff"]
                [:div.flex.flex-row.justify-between.align-items.mt-2
                 (ui/button "Push now"
                   :on-click (fn [] (state/set-modal! commit/add-commit-message)))
                 (if pushing?
                   [:span.lds-dual-ring.mt-1])]]
               [:p "All local changes are synced!"])
             [:hr]
             [:div
              [:p {:style {:font-size 12}} "Last pulled at: "
               last-pulled-at]
              [:div.flex.flex-row.justify-between.align-items
               (ui/button "Pull now"
                 :on-click (fn [] (repo-handler/pull-current-repo)))
               (if pulling?
                 [:span.lds-dual-ring.mt-1])]
              [:p.pt-2.text-sm.opacity-50
               "Version: " version/version]]]))]))))

(rum/defc repos < rum/reactive
  [head? on-click]
  (let [current-repo (state/sub :git/current-repo)
        logged? (state/logged?)
        local-repo? (= current-repo config/local-repo)
        get-repo-name-f (fn [repo]
                          (if head?
                            (db/get-repo-path repo)
                            (util/take-at-most (db/get-repo-name repo) 20)))]
    (when logged?
      (if current-repo
        (let [repos (state/sub [:me :repos])]
          (if (> (count repos) 1)
            (ui/dropdown-with-links
             (fn [{:keys [toggle-fn]}]
               [:a#repo-switch {:on-click toggle-fn}
                [:span (get-repo-name-f current-repo)]
                [:span.dropdown-caret.ml-1 {:style {:border-top-color "#6b7280"}}]])
             (mapv
              (fn [{:keys [id url]}]
                {:title (get-repo-name-f url)
                 :options {:on-click (fn []
                                       (state/set-current-repo! url)
                                       (when-not (= :draw (state/get-current-route))
                                         (route-handler/redirect-to-home!))
                                       (when on-click
                                         (on-click url)))}})
              (remove (fn [repo]
                        (= current-repo (:url repo)))
                      repos))
             {:modal-class (util/hiccup->class
                            "origin-top-right.absolute.left-0.mt-2.w-48.rounded-md.shadow-lg ")})
            (if local-repo?
              [:span (get-repo-name-f current-repo)]
              [:a
               {:href current-repo
                :target "_blank"}
               (get-repo-name-f current-repo)])))))))

(rum/defc add-repo < rum/reactive
  []
  (let [repo-url (state/sub :git/clone-repo)]
    [:div.p-8.flex.items-center.justify-center
     [:div.w-full.mx-auto
      [:div
       [:div
        [:h1.title.mb-1
         "Install Logseq on your repo"]
        [:div.mt-4.mb-4.relative.rounded-md.shadow-sm.max-w-xs
         [:input#repo.form-input.block.w-full.sm:text-sm.sm:leading-5
          {:autoFocus true
           :placeholder "https://github.com/username/repo"
           :on-change (fn [e]
                        (state/set-git-clone-repo! (util/evalue e)))}]]]]

      (ui/button
        "Add and Install"
        :on-click
        (fn []
          (when (util/starts-with? repo-url "https://github.com/")
            (let [repo-url (string/replace repo-url ".git" "")]
              (repo-handler/create-repo! repo-url)))))]]))
