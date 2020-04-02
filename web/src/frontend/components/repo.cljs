(ns frontend.components.repo
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.handler :as handler]
            [clojure.string :as string]
            [frontend.ui :as ui]))

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
      (ui/button
        "Clone"
        (fn []
          (handler/clone-and-pull @repo-url)))]]))
