(ns frontend.components.onboarding.setups
  (:require [frontend.context.i18n :refer [t]]
            [rum.core :as rum]))

(rum/defc setups-container
  [flag content]

  [:div.cp__onboarding-setups.flex.flex-1
   (let [picker? (= flag :picker)]
     [:div.inner-card.flex.flex-col.items-center

      [:h1.text-xl
       (if picker?
         [:span (t :onboarding.setup/title)]
         [:span (t :onboarding.import-option/title)])]

      [:h2
       (if picker?
         (t :onboarding.setup/desc)
         (t :onboarding.import-option/desc))]

      content])])
