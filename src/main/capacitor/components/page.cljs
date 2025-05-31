(ns capacitor.components.page
  (:require [capacitor.components.ui :as ui]
            [capacitor.ionic :as ion]
            [capacitor.state :as state]
            [frontend.components.page :as cp-page]
            [frontend.db.async :as db-async]
            [frontend.db.utils :as db-utils]
            [frontend.handler.page :as page-handler]
            [frontend.state :as fstate]
            [logseq.db :as ldb]
            [promesa.core :as p]
            [rum.core :as rum]))

(rum/defc page
  [block]
  (let [[^js nav] (state/use-nav-root)
        [entity set-entity!] (rum/use-state (let [eid (or (:db/id block)
                                                          (when-let [id (:block/uuid block)]
                                                            [:block/uuid id]))]
                                              (db-utils/entity eid)))
        title (or (:block/title block) (:block/title entity))
        [loading? set-loading!] (rum/use-state true)]

    (rum/use-effect!
      ;; sync page blocks
     (fn []
       (-> (db-async/<get-block (fstate/get-current-repo) (:block/uuid block))
           (p/then #(set-entity! (db-utils/entity (:db/id %))))
           (p/finally #(set-loading! false)))
       #())
     [])

    (ion/page
     (ion/header
      (ion/toolbar
       (ion/buttons {:slot "start"}
                    (ion/button {:fill "clear"
                                 :on-click #(.pop nav)}
                                (ion/tabler-icon "arrow-left" {:size 26})))
       (when (ldb/page? entity)
         (ion/buttons {:slot "end"}
                      (ion/button {:fill "clear"
                                   :on-click (fn []
                                               (page-handler/<delete! (:block/uuid entity)
                                                                      (fn []
                                                                        (.pop nav))
                                                                      {:error-handler (fn [^js e]
                                                                                        (js/console.error e))}))}
                                  [:span.text-muted-foreground {:slot "icon-only"}
                                   (ion/tabler-icon "trash" {:size 24})])))

       (ion/title title)))

     (ion/content {:class "ion-padding"}
                  (ui/classic-app-container-wrap
                   (if loading?
                     [:p.text-xl.text-center "Loading ..."]
                     (cp-page/page-blocks-cp entity {})))))))
