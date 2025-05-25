(ns capacitor.components.settings
  (:require [capacitor.components.nav-utils :as cc-util]
            [capacitor.handler :as handler]
            [capacitor.ionic :as ion]
            [capacitor.state :as state]
            [promesa.core :as p]
            [rum.core :as rum]))

(rum/defc create-page-input
  [{:keys [close! reload-pages!]}]
  (ion/alert
   {:is-open true
    :header "Create new page"
    :onWillDismiss (fn [^js e]
                     (let [^js detail (.-detail e)]
                       (when-let [val (and (= "confirm" (.-role detail))
                                           (aget (.-values (.-data detail)) 0))]
                         (-> (handler/<create-page! val)
                             (p/finally reload-pages!)))
                       (close!)))
    :onDidPresent (fn [^js e]
                    (let [^js target (.-target e)]
                      (when-let [input (.querySelector target "input")]
                        (js/setTimeout #(.focus input)))))
    :buttons [#js {:text "Cancel"
                   :role "cancel"}
              #js {:text "Confirm"
                   :role "confirm"}]
    :inputs [#js {:placeholder "page name"
                  :auto-focus true}]}))

(rum/defc all-pages
  []
  (let [[all-pages set-all-pages!] (rum/use-state [])
        [filtered-pages set-filtered-pages!] (rum/use-state [])
        [reload set-reload!] (rum/use-state 0)
        [page-input-open? set-page-input-open?] (rum/use-state false)]

    (rum/use-effect!
     (fn []
       (set-all-pages! (handler/local-all-pages))
       #())
     [reload])

    (rum/use-effect!
     (fn []
       (let [pages (filterv (fn [page]
                              (let [ident (some-> (:block/tags page) first :db/ident)]
                                (not (contains? #{:logseq.class/Journal :logseq.class/Property} ident))))
                            all-pages)]
         (set-filtered-pages! pages))
       #())
     [all-pages])

    [:<>
     (when page-input-open?
       (create-page-input {:close! #(set-page-input-open? false)
                           :reload-pages! #(set-reload! (inc reload))}))
     [:div.flex.flex-col
      [:div.flex.justify-between.items-center.pt-4
       [:h1.text-3xl.font-mono.font-bold.py-2
        "All pages"
        [:small.text-xs.pl-2.opacity-50 (count filtered-pages)]]

       [:div.flex.gap-1
        (ion/button {:size "small" :fill "clear" :on-click #(set-page-input-open? true)}
                    [:span {:slot "icon-only"} (ion/tabler-icon "file-plus" {:size 22})])
        ;(ionic/ion-button {:size "small" :fill "clear" :on-click #(set-reload! (inc reload))}
        ;  [:span {:slot "icon-only"} (ionic/tabler-icon "refresh")])
        ]]

      [:ul.mb-24.pt-2
       (for [page filtered-pages]
         (let [ident (some-> (:block/tags page) first :db/ident)]
           [:li.font-mono.flex.items-center.py-1.active:opacity-50.active:underline.whitespace-nowrap
            {:on-click #(cc-util/nav-to-block! page {:reload-pages! (fn [] (set-reload! (inc reload)))})}
            (case ident
              :logseq.class/Property (ion/tabler-icon "letter-t")
              :logseq.class/Page (ion/tabler-icon "file")
              :logseq.class/Journal (ion/tabler-icon "calendar")
              (ion/tabler-icon "hash"))
            [:span.pl-1 (:block/title page)]
            [:code.opacity-30.scale-75 (.toLocaleDateString (js/Date. (:block/created-at page)))]]))]]]))

(rum/defc page
  []
  (let [[^js nav] (state/use-nav-root)]
    (ion/page
     (ion/header
      (ion/toolbar
       (ion/buttons {:slot "start"}
                    (ion/button {:fill "clear"
                                 :on-click #(.pop nav)}
                                (ion/tabler-icon "arrow-left" {:size 26})))

       (ion/buttons {:slot "end"}
                    (ion/button {:fill "clear"
                                 :on-click #(.pop nav)}
                                (ion/tabler-icon "share" {:size 26})))

       (ion/title "Settings")))

     (ion/content {:class "ion-padding"}
                  (ion/refresher
                   {:slot "fixed"
                    :pull-factor 0.5
                    :pull-min 100
                    :pull-max 200
                    :on-ion-refresh (fn [^js e]
                                      (js/setTimeout
                                       #(.complete (.-detail e))
                                       3000))}
                   (ion/refresher-content))

                  (all-pages)))))
