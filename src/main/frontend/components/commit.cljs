(ns frontend.components.commit
  (:require [clojure.string :as string]
            [electron.ipc :as ipc]
            [frontend.mixins :as mixins]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [promesa.core :as p]
            [rum.core :as rum]))

(defn- commit-all!
  []
  (let [value (gobj/get (gdom/getElement "commit-message") "value")]
    (when (and value (>= (count value) 1))
      (when (util/electron?)
        (ipc/ipc "gitCommitAll" value))
      (state/close-modal!))))

(defn prettify-git-status
  [status]
  (let [lines (string/split-lines status)]
    (->> lines
         (remove empty?)
         (map (fn [line]
                (let [first-char (first (string/trim line))]
                  (cond
                    (= first-char "#") [:span line] ;; TODO: handle `--branch` info
                    (= first-char "M") [:span.text-green-400 line]
                    (= first-char "A") [:span.text-green-500 line]
                    (= first-char "D") [:span.text-red-500 line]
                    (= first-char "?") [:span.text-green-500 line]
                    :else line))))
         (interpose [:br]))))


(rum/defcs add-commit-message < rum/reactive
  (rum/local nil ::git-status)
  {:will-mount (fn [state]
                 (-> (ipc/ipc "gitStatus")
                     (p/then (fn [status]
                               (reset! (get state ::git-status) status))))
                 state)
   :did-update (fn [state]
                 (when-let [input (gdom/getElement "commit-message")]
                   (.focus input)
                   (cursor/move-cursor-to-end input))
                 state)}
  (mixins/event-mixin
   (fn [state]
     (mixins/on-enter state
                      :node (gdom/getElement "commit-message")
                      :on-enter (fn []
                                  (commit-all!)))))
  [state _close-fn]
  (let [*git-status (get state ::git-status)]
    [:div.w-full.mx-auto.sm:max-w-lg.sm:w-96 {:style {:padding "48px 0"}}
     (if (empty? @*git-status)
       [:<>
        [:div.sm:flex.sm:items-start
         [:div.mt-3.text-center.sm:mt-0.sm:text-left.mb-2
          [:h3#modal-headline.text-lg.leading-6.font-medium
           "No changes to commit!"]]]
        [:div.mt-5.sm:mt-4.flex
         [:span.flex.w-full.rounded-md.shadow-sm
          [:button.inline-flex.justify-center.w-full.rounded-md.border.border-transparent.px-4.py-2.bg-indigo-600.text-base.leading-6.font-medium.text-white.shadow-sm.hover:bg-indigo-500.focus:outline-none.focus:border-indigo-700.focus:shadow-outline-indigo.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
           {:type "button"
            :on-click #(state/close-modal!)}
           "Close"]]]]

       [:<>
        [:div.sm:flex.sm:items-start
         [:div.mt-3.text-center.sm:mt-0.sm:text-left.mb-2
          (if (nil? @*git-status)
            [:div "Loading..."]
            [:div "You have uncommitted changes"
             [:pre (prettify-git-status @*git-status)]])
          [:h3#modal-headline.text-lg.leading-6.font-medium
           "Your commit message:"]]]
        [:input#commit-message.form-input.block.w-full.sm:text-sm.sm:leading-5.my-2
         {:auto-focus true
          :default-value ""}]
        [:div.mt-5.sm:mt-4.flex
         [:span.flex.w-full.rounded-md.shadow-sm
          [:button.inline-flex.justify-center.w-full.rounded-md.border.border-transparent.px-4.py-2.bg-indigo-600.text-base.leading-6.font-medium.text-white.shadow-sm.hover:bg-indigo-500.focus:outline-none.focus:border-indigo-700.focus:shadow-outline-indigo.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
           {:type "button"
            :on-click commit-all!}
           "Commit"]]]])]))

(defn show-commit-modal! [e]
  (state/set-modal! add-commit-message)
  (when e (util/stop e)))
