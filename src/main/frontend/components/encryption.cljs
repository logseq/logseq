(ns frontend.components.encryption
  (:require [rum.core :as rum]
            [frontend.util :as util :refer-macros [profile]]

            [frontend.context.i18n :as i18n]
            [frontend.db.utils :as db-utils]
            [clojure.string :as string]
            [frontend.state :as state]))

(rum/defcs encryption-dialog-inner <
  (rum/local false ::reveal-secret-phrase?)
  [state repo-url close-fn]
  (let [reveal-secret-phrase? (get state ::reveal-secret-phrase?)
        secret-phrase (db-utils/get-key-value repo-url :db/secret-phrase)]
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div
       [:div.sm:flex.sm:items-start
        [:div.mt-3.text-center.sm:mt-0.sm:text-left
         [:h3#modal-headline.text-lg.leading-6.font-medium.text-gray-900
          "This graph is encrypted"]]]

       [:div.mt-1
        [:div.max-w-lg.rounded-md.shadow-sm.sm:max-w-xs
         [:div.cursor-pointer.block.w-full.rounded-sm.p-2.text-gray-900
          {:on-click (fn []
                       (when (not @reveal-secret-phrase?)
                         (reset! reveal-secret-phrase? true)))}
          (if @reveal-secret-phrase?
            secret-phrase
            "click to view the secret phrase")]]]

       [:div.mt-5.sm:mt-4.sm:flex.sm:flex-row-reverse
        [:span.mt-3.flex.w-full.rounded-md.shadow-sm.sm:mt-0.sm:w-auto
         [:button.inline-flex.justify-center.w-full.rounded-md.border.border-gray-300.px-4.py-2.bg-white.text-base.leading-6.font-medium.text-gray-700.shadow-sm.hover:text-gray-500.focus:outline-none.focus:border-blue-300.focus:shadow-outline-blue.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
          {:type "button"
           :on-click close-fn}
          (t :close)]]]])))

(defn encryptioin-dialog
  [repo-url]
  (fn [close-fn]
    (encryption-dialog-inner repo-url close-fn)))