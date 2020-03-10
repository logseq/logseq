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
            [clojure.string :as string]
            [frontend.db :as db]))

;; how to simplify this?
;; (rum/defc home < rum/reactive
;;   []
;;   (let [name (rum/react (db/pull '[*] 1))]
;;     [:div (str name)]))


(rum/defq home <
  {:q (fn []
        (db/pull '[*] :settings))}
  ;; [state [{:keys [github-token]}]]
  [state query-result]
  [:div "github-token"])

;; (rum/defc home
;;   []
;;   [:div.relative.min-h-screen.overflow-hidden.bg-gray-900.lg:bg-gray-300
;;    [:div.hidden.lg:block.absolute.scroll-bg.scroll-background]
;;    [:div.angled-background
;;     {:class (util/hiccup->class ".relative.min-h-screen.lg:min-w-3xl.xl:min-w-4xl.lg:flex.lg:items-center.lg:justify-center.lg:w-3/5.lg:py-20.lg:pl-8.lg:pr-8.bg-no-repeat")}
;;     [:div
;;      [:div.px-6.pt-8.pb-12.md:max-w-3xl.md:mx-auto.lg:mx-0.lg:max-w-none.lg:pt-0.lg:pb-16
;;       [:div.flex.items-center.justify-between
;;        [:div
;;         [:img.h-6.lg:h-8.xl:h-9
;;          {:alt "Gitnotes",
;;           :src "/img/tailwindui-logo-on-dark.svg"}]]
;;        [:div
;;         [:a.text-sm.font-semibold.text-white.focus:outline-none.focus:underline
;;          {:href (str config/api "login/github")}
;;          "Login →"]]]]
;;      [:div.px-6.md:max-w-3xl.md:mx-auto.lg:mx-0.lg:max-w-none
;;       [:p.text-sm.font-semibold.text-gray-300.uppercase.tracking-wider
;;        "\n              Now in early access\n            "]
;;       [:h1.mt-3.text-3xl.leading-9.font-semibold.font-display.text-white.sm:mt-6.sm:text-4xl.sm:leading-10.xl:text-5xl.xl:leading-none
;;        "\n              Beautiful UI components, crafted\n              "
;;        [:br.hidden.sm:inline]
;;        [:span.text-teal-400
;;         "\n                by the creators of Tailwind CSS.\n              "]]
;;       [:p.mt-2.text-lg.leading-7.text-gray-300.sm:mt-3.sm:text-xl.sm:max-w-xl.xl:mt-4.xl:text-2xl.xl:max-w-2xl
;;        "\n              Fully responsive HTML components, designed and developed by Adam Wathan and Steve Schoger.\n            "]
;;       [:div.mt-6.sm:flex.sm:mt-8.xl:mt-12
;;        [:a.w-full.sm:w-auto.inline-flex.items-center.justify-center.px-6.py-3.border.border-transparent.text-base.leading-6.font-semibold.rounded-md.text-gray-900.bg-white.shadow-sm.hover:text-gray-600.focus:outline-none.focus:text-gray-600.transition.ease-in-out.duration-150.xl:text-lg.xl:py-4
;;         {:href (str config/api "login/github")}
;;         "Login with Github"]
;;        [:a.mt-4.sm:ml-4.sm:mt-0.w-full.sm:w-auto.inline-flex.items-center.justify-center.px-6.py-3.border.border-transparent.text-base.leading-6.font-semibold.rounded-md.text-white.bg-gray-800.shadow-sm.hover:bg-gray-700.focus:outline-none.focus:bg-gray-700.transition.ease-in-out.duration-150.xl:text-lg.xl:py-4
;;         {:href "/demo"}
;;         "Live Demo"]]]
;;      [:div.mt-8.sm:mt-12.relative.h-64.overflow-hidden.bg-gray-300.lg:hidden
;;       [:div.absolute.scroll-bg.scroll-background-2]]
;;      [:div.px-6.py-8.sm:pt-12.md:max-w-3xl.md:mx-auto.lg:mx-0.lg:max-w-full.lg:py-0.lg:pt-24
;;       [:p.text-sm.font-semibold.text-gray-300.uppercase.tracking-wider
;;        "Designed and developed by"]
;;       [:div.mt-4.sm:flex
;;        [:a.flex.items-center.no-underline
;;         {:href "https://twitter.com/adamwathan"}]
;;        [:div.flex-shrink-0
;;         [:img.h-12.w-12.rounded-full.border-2.border-white
;;          {:alt "", :src "/img/adam.jpg"}]]
;;        [:div.ml-3
;;         [:p.font-semibold.text-white.leading-tight "Adam Wathan"]
;;         [:p.text-sm.text-gray-500.leading-tight
;;          "Creator of Tailwind CSS"]]
;;        [:a.mt-6.sm:mt-0.sm:ml-12.flex.items-center.no-underline
;;         {:href "https://twitter.com/steveschoger"}]
;;        [:div.flex-shrink-0
;;         [:img.h-12.w-12.rounded-full.border-2.border-white
;;          {:alt "", :src "/img/steve.jpg"}]]
;;        [:div.ml-3
;;         [:p.font-semibold.text-white.leading-tight "Steve Schoger"]
;;         [:p.text-sm.text-gray-500.leading-tight
;;          "Author of Refactoring UI"]]]]]]])

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
