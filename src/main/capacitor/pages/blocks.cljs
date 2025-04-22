(ns capacitor.pages.blocks
  (:require [capacitor.state :as state]
            [promesa.core :as p]
            [rum.core :as rum]
            [frontend.db.async :as db-async]
            [frontend.db.utils :as db-utils]
            [frontend.state :as fstate]
            [capacitor.ionic :as ionic]))

(rum/defc page [block]
  (let [[^js nav] (state/use-nav-root)
        [page set-page!] (rum/use-state (db-utils/entity (:db/id block)))
        title (or (:block/title block) (:block.temp/cached-title block))
        [loading? set-loading!] (rum/use-state true)
        rerender! #(set-page! (db-utils/entity (:db/id block)))]

    (rum/use-effect!
      ;; sync page blocks
      (fn []
        (-> (db-async/<get-block (fstate/get-current-repo) (:block/uuid block))
          (p/then #(set-page! (db-utils/entity (:db/id %))))
          (p/finally #(set-loading! false)))
        #())
      [])

    (ionic/ion-page
      (ionic/ion-header
        (ionic/ion-toolbar
          (ionic/ion-buttons {:slot "start"}
            (ionic/ion-button {:fill "clear"
                               :on-click #(.pop nav)}
              (ionic/tabler-icon "arrow-left" {:size 26})))

          (ionic/ion-buttons {:slot "end"}
            (ionic/ion-button {:fill "clear"
                               :class "opacity-80"
                               :on-click rerender!}
              (ionic/tabler-icon "refresh" {:size 26}))
            (ionic/ion-button {:fill "clear"
                               :class "opacity-80 text-red-500"
                               :on-click #(.pop nav)}
              (ionic/tabler-icon "trash" {:size 26})))

          (ionic/ion-title title)))

      (ionic/ion-content {:class "ion-padding"}
        (if loading?
          [:p.text-xl.text-center "Loading ..."]
          [:<>
           [:code ":db/id " (:db/id page)]
           (when-let [children (:block/_parent page)]
             [:ul
              (for [block children]
                [:li.text-xl (:block/title block)])])
           [:p.pt-2.flex.justify-center
            (ionic/ion-button
              {:fill "clear"
               :class "w-full"}
              "+ Add")]])))))
