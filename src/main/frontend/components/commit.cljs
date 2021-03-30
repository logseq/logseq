(ns frontend.components.commit
  (:require [rum.core :as rum]
            [frontend.util :as util :refer-macros [profile]]
            [frontend.handler.repo :as repo-handler]
            [frontend.state :as state]
            [frontend.mixins :as mixins]
            [frontend.handler.notification :as notification]
            [promesa.core :as p]
            [goog.dom :as gdom]
            [goog.object :as gobj]))

(defn commit-and-push!
  []
  (let [value (gobj/get (gdom/getElement "commit-message") "value")]
    (when (and value (>= (count value) 1))
      (-> (repo-handler/git-commit-and-push! value)
          (p/catch (fn [error]
                     (notification/show! error :error false))))
      (state/close-modal!))))

(rum/defcs add-commit-message <
  {:did-update (fn [state]
                 (when-let [input (gdom/getElement "commit-message")]
                   (.focus input)
                   (util/move-cursor-to-end input))
                 state)}
  (mixins/event-mixin
   (fn [state]
     (mixins/on-enter state
                      :node (gdom/getElement "commit-message")
                      :on-enter (fn []
                                  (commit-and-push!)))))
  [state close-fn]
  (when-let [repo (state/sub :git/current-repo)]
    [:div
     [:div.sm:flex.sm:items-start
      [:div.mt-3.text-center.sm:mt-0.sm:text-left.mb-2
       [:h3#modal-headline.text-lg.leading-6.font-medium
        "Your commit message:"]]]

     [:input#commit-message.form-input.block.w-full.sm:text-sm.sm:leading-5.my-2
      {:auto-focus true
       :default-value ""}]

     [:div.mt-5.sm:mt-4.sm:flex.sm:flex-row-reverse
      [:span.flex.w-full.rounded-md.shadow-sm.sm:ml-3.sm:w-auto
       [:button.inline-flex.justify-center.w-full.rounded-md.border.border-transparent.px-4.py-2.bg-indigo-600.text-base.leading-6.font-medium.text-white.shadow-sm.hover:bg-indigo-500.focus:outline-none.focus:border-indigo-700.focus:shadow-outline-indigo.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
        {:type "button"
         :on-click commit-and-push!}
        "Commit and push!"]]
      [:span.mt-3.flex.w-full.rounded-md.shadow-sm.sm:mt-0.sm:w-auto
       [:button.inline-flex.justify-center.w-full.rounded-md.border.border-gray-300.px-4.py-2.bg-white.text-base.leading-6.font-medium.text-gray-700.shadow-sm.hover:text-gray-500.focus:outline-none.focus:border-blue-300.focus:shadow-outline-blue.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
        {:type "button"
         :on-click close-fn}
        "Cancel"]]]]))
