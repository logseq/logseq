(ns frontend.components.repo
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.handler :as handler]
            [clojure.string :as string])
  )

(defn repos
  [repos]
  (when (seq repos)
    (let [repos (->> repos (map first) distinct)]
      [:div#repos
      [:ul
       (for [url repos]
         [:li {:key url}
          [:button {:on-click (fn []
                                (prn "set current repo: " url)
                                ;; (handler/set-current-repo url)
                                )}
           (string/replace url "https://github.com/" "")]])]])))

(rum/defcs add-repo < (rum/local "https://github.com/" ::repo-url)
  [state]
  (let [repo-url (get state ::repo-url)]
    [:div.p-8.flex.items-center.justify-center.bg-white
     [:div.w-full.max-w-xs.mx-auto
      [:div
       [:label.block.text-sm.font-medium.leading-5.text-gray-700
        {:for "Repo"}
        "Repo"]
       [:div.mt-1.relative.rounded-md.shadow-sm
        [:input.form-input.block.w-full.sm:text-sm.sm:leading-5
         {:auto-focus true
          :placeholder "https://github.com/yourname/repo"
          :value @repo-url
          :on-change (fn [e]
                       (reset! repo-url (util/evalue e)))}]]]
      [:button.inline-flex.items-center.px-3.py-2.border.border-transparent.text-sm.leading-4.font-medium.rounded-md.text-white.bg-indigo-600.hover:bg-indigo-500.focus:outline-none.focus:border-indigo-700.focus:shadow-outline-indigo.active:bg-indigo-700.transition.ease-in-out.duration-150.mt-1
       {:type "button"
        :on-click (fn []
                    (handler/clone-and-pull @repo-url))}
       "Clone"]
      ]]))
