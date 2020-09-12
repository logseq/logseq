(ns frontend.components.settings
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.handler :as handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.config :as config]
            [clojure.string :as string]
            [goog.object :as gobj]))

(rum/defcs set-email < (rum/local "" ::email)
  [state]
  (let [email (get state ::email)]
    [:div.p-8.flex.items-center.justify-center
     [:div.w-full.mx-auto
      [:div
       [:div
        [:h1.title.mb-1
         "Your email address:"]
        [:div.mt-2.mb-4.relative.rounded-md.shadow-sm.max-w-xs
         [:input#.form-input.block.w-full.pl-2.sm:text-sm.sm:leading-5
          {:autoFocus true
           :on-change (fn [e]
                        (reset! email (util/evalue e)))}]]]]
      (ui/button
        "Submit"
        :on-click
        (fn []
          (user-handler/set-email! @email)))

      [:hr]

      [:span.pl-1.opacity-70 "Git commit requires the email address."]]]))

(rum/defcs set-cors < (rum/local "" ::cors)
  [state]
  (let [cors (get state ::cors)]
    [:div.p-8.flex.items-center.justify-center
     [:div.w-full.mx-auto
      [:div
       [:div
        [:h1.title.mb-1
         "Your cors address:"]
        [:div.mt-2.mb-4.relative.rounded-md.shadow-sm.max-w-xs
         [:input#.form-input.block.w-full.pl-2.sm:text-sm.sm:leading-5
          {:autoFocus true
           :on-change (fn [e]
                        (reset! cors (util/evalue e)))}]]]]
      (ui/button
        "Submit"
        :on-click
        (fn []
          (user-handler/set-cors! @cors)))

      [:hr]

      [:span.pl-1.opacity-70 "Git commit requires the cors address."]]]))

(rum/defcs settings < rum/reactive
  []
  (let [preferred-format (keyword (state/sub [:me :preferred_format]))
        preferred-workflow (keyword (state/sub [:me :preferred_workflow]))
        github-token (state/sub [:me :access-token])
        cors-proxy (state/sub [:me :cors_proxy])
        logged? (state/logged?)
        current-repo (state/get-current-repo)
        developer-mode? (state/sub [:ui/developer-mode?])]
    [:div#settings
     [:h1.title "Settings"]

     [:div.pl-1
      ;; config.edn
      (when current-repo
        [:a {:href (str "/file/" (util/encode-str (str config/app-name "/" config/config-file)))}
         "Edit config.edn (for current repo)"])

      (when logged? [:hr])

      (when logged?
        [:div.mt-6.sm:mt-5
         [:div.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start.sm:pt-5
          [:label.block.text-sm.font-medium.leading-5.sm:mt-px.sm:pt-2.opacity-70
           {:for "preferred_format"}
           "Preferred file format"]
          [:div.mt-1.sm:mt-0.sm:col-span-2
           [:div.max-w-lg.rounded-md.shadow-sm.sm:max-w-xs
            [:select.mt-1.form-select.block.w-full.pl-3.pr-10.py-2.text-base.leading-6.border-gray-300.focus:outline-none.focus:shadow-outline-blue.focus:border-blue-300.sm:text-sm.sm:leading-5
             {:on-change (fn [e]
                           (let [format (-> (util/evalue e)
                                            (string/lower-case)
                                            keyword)]
                             (user-handler/set-preferred-format! format)))}
             (for [format [:org :markdown]]
               [:option (cond->
                         {:key (name format)}
                          (= format preferred-format)
                          (assoc :selected "selected"))
                (string/capitalize (name format))])]]]]
         [:div.mt-6.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start.sm:pt-5
          [:label.block.text-sm.font-medium.leading-5.sm:mt-px.sm:pt-2.opacity-70
           {:for "preferred_workflow"}
           "Preferred workflow"]
          [:div.mt-1.sm:mt-0.sm:col-span-2
           [:div.max-w-lg.rounded-md.shadow-sm.sm:max-w-xs
            [:select.mt-1.form-select.block.w-full.pl-3.pr-10.py-2.text-base.leading-6.border-gray-300.focus:outline-none.focus:shadow-outline-blue.focus:border-blue-300.sm:text-sm.sm:leading-5
             {:on-change (fn [e]
                           (let [workflow (-> (util/evalue e)
                                              (string/lower-case)
                                              keyword)
                                 workflow (if (= workflow :now/later)
                                            :now
                                            :todo)]
                             (user-handler/set-preferred-workflow! workflow)))}
             (for [workflow [:now :todo]]
               [:option (cond->
                         {:key (name workflow)}
                          (= workflow preferred-workflow)
                          (assoc :selected "selected"))
                (if (= workflow :now)
                  "NOW/LATER"
                  "TODO/DOING")])]]]]

         [:hr]

         (ui/admonition
          :important
          [:p "Don't use other people's proxy servers. It's very dangerous, which could make your token and notes stolen. Logseq will not be responsible for this loss if you use other people's proxy servers. You can deploy it yourself, check "
           [:a {:href "https://github.com/isomorphic-git/cors-proxy"
                :target "_blank"}
            "https://github.com/isomorphic-git/cors-proxy"]])

         [:div.mt-6.sm:mt-5.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start.sm:pt-5
          [:label.block.text-sm.font-medium.leading-5.sm:mt-px.sm:pt-2.opacity-70
           {:for "cors"}
           "Custom CORS proxy server"]
          [:div.mt-1.sm:mt-0.sm:col-span-2
           [:div.max-w-lg.rounded-md.shadow-sm.sm:max-w-xs
            [:input#pat.form-input.block.w-full.transition.duration-150.ease-in-out.sm:text-sm.sm:leading-5
             {:default-value cors-proxy
              :on-blur (fn [event]
                         (when-let [server (util/evalue event)]
                           (user-handler/set-cors! server)
                           (notification/show! "Custom CORS proxy updated successfully!" :success)))
              :on-key-press (fn [event]
                              (let [k (gobj/get event "key")]
                                (if (= "Enter" k)
                                  (when-let [server (util/evalue event)]
                                    (user-handler/set-cors! server)
                                    (notification/show! "Custom CORS proxy updated successfully!" :success)))))}]]]]
         
         [:hr]
         
         [:div.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start.sm:pt-5
          [:label.block.text-sm.font-medium.leading-5.sm:mt-px.sm:pt-2.opacity-70
           {:for "developer_mode"}
           "Developer mode"]
          [:div.mt-1.sm:mt-0.sm:col-span-2
           [:div.max-w-lg.rounded-md.shadow-sm.sm:max-w-xs
            (ui/button (if developer-mode? "Disable developer mode" "Enable developer mode")
             :on-click #(state/set-developer-mode! (not developer-mode?)))]]]
         
         [:br]
         "Developer mode helps contributors and extension developers test their integration with Logseq more efficient."])]]))
