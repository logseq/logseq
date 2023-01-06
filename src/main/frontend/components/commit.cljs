(ns frontend.components.commit
  (:require [electron.ipc :as ipc]
            [frontend.mixins :as mixins]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [rum.core :as rum]))

(defn commit-and-push!
  []
  (let [value (gobj/get (gdom/getElement "commit-message") "value")]
    (when (and value (>= (count value) 1))
      (when (util/electron?)
        (ipc/ipc "gitCommitAll" value))
      (state/close-modal!))))

(rum/defcs add-commit-message <
  {:did-update (fn [state]
                 (when-let [input (gdom/getElement "commit-message")]
                   (.focus input)
                   (cursor/move-cursor-to-end input))
                 state)}
  (mixins/event-mixin
   (fn [state]
     (mixins/on-enter state
                      :node (gdom/getElement "commit-message")
                      :on-enter (fn []
                                  (commit-and-push!)))))
  [state _close-fn]
  [:div.w-full.mx-auto {:style {:padding "48px 0"}}
   [:div.sm:flex.sm:items-start
    [:div.mt-3.text-center.sm:mt-0.sm:text-left.mb-2
     [:h3#modal-headline.text-lg.leading-6.font-medium
      "Your commit message:"]]]

   [:input#commit-message.form-input.block.w-full.sm:text-sm.sm:leading-5.my-2
    {:auto-focus true
     :default-value ""}]

   [:div.mt-5.sm:mt-4.flex
    [:span.flex.w-full.rounded-md.shadow-sm
     [:button.inline-flex.justify-center.w-full.rounded-md.border.border-transparent.px-4.py-2.bg-indigo-600.text-base.leading-6.font-medium.text-white.shadow-sm.hover:bg-indigo-500.focus:outline-none.focus:border-indigo-700.focus:shadow-outline-indigo.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
      {:type "button"
       :on-click commit-and-push!}
      "Commit"]]]])

(defn show-commit-modal! [e]
  (when (and
         (util/electron?)
         (not (util/input? (gobj/get e "target")))
         (not (gobj/get e "shiftKey"))
         (not (gobj/get e "ctrlKey"))
         (not (gobj/get e "altKey"))
         (not (gobj/get e "metaKey")))
    #_:clj-kondo/ignore
    (when-let [repo-url (state/get-current-repo)]
      (when-not (state/get-edit-input-id)
        (util/stop e)
        (state/set-modal! add-commit-message)))))
