(ns frontend.components.home
  (:require [frontend.state :as state]
            [frontend.util :as util]
            [frontend.handler :as handler]
            [frontend.ui :as ui]
            [frontend.mixins :as mixins]
            [frontend.config :as config]
            [rum.core :as rum]
            ;; [frontend.components.agenda :as agenda]
            ;; [frontend.components.file :as file]
            ;; [frontend.components.settings :as settings]
            ;; [frontend.components.repo :as repo]
            [frontend.format :as format]
            [clojure.string :as string]))

(rum/defc transition-block
  [state close-fn]
  [:div.absolute.top-0.inset-x-0.p-2.transition.transform.origin-top-right.md:hidden
           {:class (case state
                     "entering" "duration-150 ease-out opacity-0 scale-95"
                     "entered" "duration-150 ease-out opacity-100 scale-100"
                     "exiting" "duration-100 ease-in opacity-100 scale-100"
                     "exited" "duration-100 ease-in opacity-0 scale-95")}
           [:div.rounded-lg.shadow-md
            [:div.rounded-lg.bg-white.shadow-xs.overflow-hidden
             [:div.px-5.pt-4.flex.items-center.justify-between
              [:div
               [:img.h-8.w-auto
                {:alt "", :src "https://tailwindui.com/img/logos/workflow-mark-on-white.svg"}]]
              [:div.-mr-2
               [:button.inline-flex.items-center.justify-center.p-2.rounded-md.text-gray-400.hover:text-gray-500.hover:bg-gray-100.focus:outline-none.focus:bg-gray-100.focus:text-gray-500.transition.duration-150.ease-in-out
                {:type "button",
                 :on-click close-fn}
                [:svg.h-6.w-6
                 {:viewbox "0 0 24 24",
                  :fill "none",
                  :stroke "currentColor"}
                 [:path
                  {:d "M6 18L18 6M6 6l12 12",
                   :stroke-width "2",
                   :stroke-linejoin "round",
                   :stroke-linecap "round"}]]]]]
             [:div.px-2.pt-2.pb-3
              [:a.block.px-3.py-2.rounded-md.text-base.font-medium.text-gray-700.hover:text-gray-900.hover:bg-gray-50.focus:outline-none.focus:text-gray-900.focus:bg-gray-50.transition.duration-150.ease-in-out
               {:href "#"}
               "Product"]
              [:a.mt-1.block.px-3.py-2.rounded-md.text-base.font-medium.text-gray-700.hover:text-gray-900.hover:bg-gray-50.focus:outline-none.focus:text-gray-900.focus:bg-gray-50.transition.duration-150.ease-in-out
               {:href "#"}
               "Features"]
              [:a.mt-1.block.px-3.py-2.rounded-md.text-base.font-medium.text-gray-700.hover:text-gray-900.hover:bg-gray-50.focus:outline-none.focus:text-gray-900.focus:bg-gray-50.transition.duration-150.ease-in-out
               {:href "#"}
               "Marketplace"]
              [:a.mt-1.block.px-3.py-2.rounded-md.text-base.font-medium.text-gray-700.hover:text-gray-900.hover:bg-gray-50.focus:outline-none.focus:text-gray-900.focus:bg-gray-50.transition.duration-150.ease-in-out
               {:href "#"}
               "Company"]]
             [:div
              [:a.block.w-full.px-5.py-3.text-center.font-medium.text-indigo-600.bg-gray-50.hover:bg-gray-100.hover:text-indigo-700.focus:outline-none.focus:bg-gray-100.focus:text-indigo-700.transition.duration-150.ease-in-out
               {:href "#"}
               "\n                Log in\n              "]]]]])
(rum/defcs home < (mixins/modal)
  [state]
  (let [{:keys [open? close-fn open-fn]} state]
    (prn {:open? open?
          :state state})
    [:div.relative.bg-white.overflow-hidden
     [:div.max-w-screen-xl.mx-auto
      [:div.relative.z-10.pb-8.bg-white.sm:pb-16.md:pb-20.lg:max-w-2xl.lg:w-full.lg:pb-28.xl:pb-32
       [:div.pt-6.px-4.sm:px-6.lg:px-8
        [:nav.relative.flex.items-center.justify-between.sm:h-10.lg:justify-start
         [:div.flex.items-center.flex-grow.flex-shrink-0.lg:flex-grow-0
          [:div.flex.items-center.justify-between.w-full.md:w-auto
           [:a
            {:href "#"}
            [:img.h-8.w-auto.sm:h-10
             {:alt "", :src "https://tailwindui.com/img/logos/workflow-mark-on-white.svg"}]]
           [:div.-mr-2.flex.items-center.md:hidden
            [:button.inline-flex.items-center.justify-center.p-2.rounded-md.text-gray-400.hover:text-gray-500.hover:bg-gray-100.focus:outline-none.focus:bg-gray-100.focus:text-gray-500.transition.duration-150.ease-in-out
             {:type "button",
              :on-click open-fn}
             [:svg.h-6.w-6
              {:viewbox "0 0 24 24",
               :fill "none",
               :stroke "currentColor"}
              [:path
               {:d "M4 6h16M4 12h16M4 18h16",
                :stroke-width "2",
                :stroke-linejoin "round",
                :stroke-linecap "round"}]]]]]]
         [:div.hidden.md:block.md:ml-10.md:pr-4
          [:a.font-medium.text-gray-500.hover:text-gray-900.focus:outline-none.focus:text-gray-900.transition.duration-150.ease-in-out
           {:href "#"}
           "Product"]
          [:a.ml-8.font-medium.text-gray-500.hover:text-gray-900.focus:outline-none.focus:text-gray-900.transition.duration-150.ease-in-out
           {:href "#"}
           "Features"]
          [:a.ml-8.font-medium.text-gray-500.hover:text-gray-900.focus:outline-none.focus:text-gray-900.transition.duration-150.ease-in-out
           {:href "#"}
           "Marketplace"]
          [:a.ml-8.font-medium.text-gray-500.hover:text-gray-900.focus:outline-none.focus:text-gray-900.transition.duration-150.ease-in-out
           {:href "#"}
           "Company"]
          [:a.ml-8.font-medium.text-indigo-600.hover:text-indigo-900.focus:outline-none.focus:text-indigo-700.transition.duration-150.ease-in-out
           {:href "#"}
           "Log in"]]]]
       (ui/css-transition
        {:in @open?
         :timeout 0}
        (fn [state]
          (transition-block state close-fn)))

       [:div.mt-10.mx-auto.max-w-screen-xl.px-4.sm:mt-12.sm:px-6.md:mt-16.lg:mt-20.lg:px-8.xl:mt-28
        [:div.sm:text-center.lg:text-left
         [:h2.text-4xl.tracking-tight.leading-10.font-extrabold.text-gray-900.sm:text-5xl.sm:leading-none.md:text-6xl
          "\n            Data to enrich your\n            "
          [:br.xl:hidden]
          [:span.text-indigo-600 "online business"]]
         [:p.mt-3.text-base.text-gray-500.sm:mt-5.sm:text-lg.sm:max-w-xl.sm:mx-auto.md:mt-5.md:text-xl.lg:mx-0
          "\n            Anim aute id magna aliqua ad ad non deserunt sunt. Qui irure qui lorem cupidatat commodo. Elit sunt amet fugiat veniam occaecat fugiat aliqua.\n          "]
         [:div.mt-5.sm:mt-8.sm:flex.sm:justify-center.lg:justify-start
          [:div.rounded-md.shadow
           [:a.w-full.flex.items-center.justify-center.px-8.py-3.border.border-transparent.text-base.leading-6.font-medium.rounded-md.text-white.bg-indigo-600.hover:bg-indigo-500.focus:outline-none.focus:shadow-outline.transition.duration-150.ease-in-out.md:py-4.md:text-lg.md:px-10
            {:href (str config/api "login/github")}
            "Login with Github"]]
          [:div.mt-3.sm:mt-0.sm:ml-3
           [:a.w-full.flex.items-center.justify-center.px-8.py-3.border.border-transparent.text-base.leading-6.font-medium.rounded-md.text-indigo-700.bg-indigo-100.hover:text-indigo-600.hover:bg-indigo-50.focus:outline-none.focus:shadow-outline.focus:border-indigo-300.transition.duration-150.ease-in-out.md:py-4.md:text-lg.md:px-10
            {:href "#"}
            "Live demo"]]]]]
       [:svg
        {:class (util/hiccup->class ".hidden.lg:block.absolute.right-0.inset-y-0.h-full.w-48.text-white.transform.translate-x-1/2")
         :preserveaspectratio "none",
         :viewbox "0 0 100 100",
         :fill "currentColor"}
        [:polygon {:points "50,0 100,0 50,100 0,100"}]]]]
     [:div
      {:class (util/hiccup->class ".lg:absolute.lg:inset-y-0.lg:right-0.lg:w-1/2")}
      [:img.h-56.w-full.object-cover.sm:h-72.md:h-96.lg:w-full.lg:h-full
       {:alt "",
        :src
        "https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2850&q=80"}]]]))

;; (rum/defc content-html
;;   < {:did-mount (fn [state]
;;                   (doseq [block (-> (js/document.querySelectorAll "pre code")
;;                                     (array-seq))]
;;                     (js/hljs.highlightBlock block))
;;                   state)}
;;   [current-file html-content]
;;   [:div
;;    (mui/link {:style {:float "right"}
;;               :on-click (fn []
;;                           (handler/change-page :edit-file))}
;;      "edit")
;;    (util/raw-html html-content)])

;; (rum/defc home < rum/reactive
;;   []
;;   (let [state (rum/react state/state)
;;         {:keys [user tokens repos repo-url github-token github-repo contents loadings current-repo current-file width drawer? tasks cloning?]} state
;;         current-repo (or current-repo
;;                          (when-let [first-repo (first (keys repos))]
;;                            (handler/set-current-repo first-repo)
;;                            first-repo))
;;         files (get-in state [:repos current-repo :files])
;;         cloned? (get-in state [:repos current-repo :cloned?])
;;         loading? (get loadings current-file)
;;         width (or width (util/get-width))
;;         mobile? (and width (<= width 600))]
;;     (prn {:current-repo current-repo
;;           :cloned? cloned?})
;;     (mui/container
;;      {:id "root-container"
;;       :style {:display "flex"
;;               :justify-content "center"
;;               ;; TODO: fewer spacing for mobile, 24px
;;               :margin-top 64}}
;;      (cond
;;        (nil? user)
;;        (mui/button {:variant "contained"
;;                     :color "primary"
;;                     :start-icon (mui/github-icon)
;;                     :href "/login/github"}
;;          "Login with Github")

;;        (empty? repos)
;;        (repo/add-repo repo-url)

;;        cloned?
;;        (mui/grid
;;         {:container true
;;          :spacing 3}
;;         (when-not mobile?
;;           (mui/grid {:xs 2}
;;                     (file/files-list current-repo files)))

;;         (if (and (not mobile?)
;;                  (not drawer?))
;;           (mui/divider {:orientation "vertical"
;;                         :style {:margin "0 24px"}}))
;;         (mui/grid {:xs 9
;;                    :style {:margin-left (if (or mobile? drawer?) 24 0)}}
;;                   (cond
;;                     (nil? current-file)
;;                     (agenda/agenda tasks)

;;                     loading?
;;                     [:div "Loading ..."]

;;                     :else
;;                     (let [content (get contents current-file)
;;                           suffix (last (string/split current-file #"\."))]
;;                       (if (and suffix (contains? #{"md" "markdown" "org"} suffix))
;;                         (content-html current-file (format/to-html content suffix))
;;                         [:div "File " suffix " is not supported."])))))
;;        cloning?
;;        [:div "Cloning..."]

;;        :else
;;        [:div "TBC"]
;;        ;; (settings/settings-form github-token github-repo)
;;        ))))
