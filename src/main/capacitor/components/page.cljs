(ns capacitor.components.page
  (:require [capacitor.ionic :as ion]
            [capacitor.state :as state]
            [capacitor.components.ui :as ui]
            [frontend.components.page :as cp-page]
            [frontend.db.async :as db-async]
            [frontend.db.utils :as db-utils]
            [frontend.handler.page :as page-handler]
            [frontend.state :as fstate]
            [promesa.core :as p]
            [rum.core :as rum]))

(rum/defc page
  [block & {:keys [reload-pages!]}]
  (let [[^js nav] (state/use-nav-root)
        [page set-page!] (rum/use-state (let [eid (or (:db/id block)
                                                      (when-let [id (:block/uuid block)]
                                                        [:block/uuid id]))]
                                          (db-utils/entity eid)))
        title (or (:block/title block) (:block/title page))
        [loading? set-loading!] (rum/use-state true)
        rerender! (fn []
                    (set-page! (db-utils/entity (:db/id block))))]

    (rum/use-effect!
      ;; sync page blocks
     (fn []
       (-> (db-async/<get-block (fstate/get-current-repo) (:block/uuid block))
           (p/then #(set-page! (db-utils/entity (:db/id %))))
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

       (ion/buttons {:slot "end"}
                    (ion/button {:fill "clear"
                                 :class "opacity-80"
                                 :on-click rerender!}
                                (ion/tabler-icon "refresh" {:size 26}))
                    (ion/button {:fill "clear"
                                 :class "opacity-80 text-red-500"
                                 :on-click (fn []
                                             (page-handler/<delete! (:block/uuid block)
                                                                    (fn []
                                                                      (.pop nav)
                                                                      (when (fn? reload-pages!)
                                                                        (reload-pages!)))
                                                                    {:error-handler (fn [^js e]
                                                                                      (js/console.error e))}))}
                                (ion/tabler-icon "trash" {:size 26})))

       (ion/title title)))

      (ion/content {:class "ion-padding"}
        (ui/classic-app-container-wrap
          (if loading?
            [:p.text-xl.text-center "Loading ..."]
            (cp-page/page-blocks-cp page {})))))))
