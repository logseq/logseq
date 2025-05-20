(ns capacitor.components.settings
  (:require [capacitor.handler :as handler]
            [capacitor.components.nav-utils :as cc-util]
            [promesa.core :as p]
            [rum.core :as rum]
            [capacitor.state :as state]
            [capacitor.ionic :as ionic]))

(rum/defc create-page-input
  [{:keys [close! reload-pages!]}]
  (ionic/ion-alert
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
        (ionic/ion-button {:size "small" :fill "clear" :on-click #(set-page-input-open? true)}
          [:span {:slot "icon-only"} (ionic/tabler-icon "file-plus" {:size 22})])
        ;(ionic/ion-button {:size "small" :fill "clear" :on-click #(set-reload! (inc reload))}
        ;  [:span {:slot "icon-only"} (ionic/tabler-icon "refresh")])
        ]]

      [:ul.mb-24.pt-2
       (for [page filtered-pages]
         (let [ident (some-> (:block/tags page) first :db/ident)]
           [:li.font-mono.flex.items-center.py-1.active:opacity-50.active:underline.whitespace-nowrap
            {:on-click #(cc-util/nav-to-block! page {:reload-pages! (fn [] (set-reload! (inc reload)))})}
            (case ident
              :logseq.class/Property (ionic/tabler-icon "letter-t")
              :logseq.class/Page (ionic/tabler-icon "file")
              :logseq.class/Journal (ionic/tabler-icon "calendar")
              (ionic/tabler-icon "hash"))
            [:span.pl-1 (:block/title page)]
            [:code.opacity-30.scale-75 (.toLocaleDateString (js/Date. (:block/created-at page)))]]))]
      ]]))

(rum/defc page
  []
  (let [[^js nav] (state/use-nav-root)]
    (ionic/ion-page
      (ionic/ion-header
        (ionic/ion-toolbar
          (ionic/ion-buttons {:slot "start"}
            (ionic/ion-button {:fill "clear"
                               :on-click #(.pop nav)}
              (ionic/tabler-icon "arrow-left" {:size 26})))

          (ionic/ion-buttons {:slot "end"}
            (ionic/ion-button {:fill "clear"
                               :on-click #(.pop nav)}
              (ionic/tabler-icon "share" {:size 26})))

          (ionic/ion-title "Settings")))

      (ionic/ion-content {:class "ion-padding"}
        (ionic/ion-refresher
          {:slot "fixed"
           :pull-factor 0.5
           :pull-min 100
           :pull-max 200
           :on-ion-refresh (fn [^js e]
                             (js/setTimeout
                               #(.complete (.-detail e))
                               3000))}
          (ionic/ion-refresher-content))

        (all-pages)
        ))))
