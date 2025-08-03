(ns mobile.components.app
  "App root"
  (:require ["../externals.js"]
            [clojure.string :as string]
            [frontend.components.journal :as journal]
            [frontend.components.rtc.indicator :as rtc-indicator]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.conn :as db-conn]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.user :as user-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.rum :as frum]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.date :as gdate]
            [logseq.db :as ldb]
            [logseq.shui.dialog.core :as shui-dialog]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.popup.core :as shui-popup]
            [logseq.shui.toaster.core :as shui-toaster]
            [logseq.shui.ui :as shui]
            [mobile.components.editor-toolbar :as editor-toolbar]
            [mobile.components.modal :as modal]
            [mobile.components.popup :as popup]
            [mobile.components.search :as search]
            [mobile.components.selection-toolbar :as selection-toolbar]
            [mobile.components.settings :as settings]
            [mobile.components.ui :as ui-component]
            [mobile.ionic :as ion]
            [mobile.state :as mobile-state]
            [promesa.core :as p]
            [rum.core :as rum]))

(rum/defc app-graphs-select < rum/reactive
  []
  (let [current-repo (state/get-current-repo)
        graphs (->> (state/sub [:me :repos])
                    (util/distinct-by :url))
        remote-graphs (state/sub :rtc/graphs)
        graphs (->>
                (if (seq remote-graphs)
                  (repo-handler/combine-local-&-remote-graphs graphs remote-graphs)
                  graphs)
                (filter (fn [item] (config/db-based-graph? (:url item)))))
        short-repo-name (if current-repo
                          (db-conn/get-short-repo-name current-repo)
                          "Select a Graph")]
    [:.app-graph-select
     (ion/button
      {:fill "clear"
       :mode "ios"
       :class "border-none w-full rounded-lg"
       :on-click (fn []
                   (let [buttons (concat
                                  (->>
                                   (for [repo graphs]
                                     {:text (some-> (:url repo) (string/replace #"^logseq_db_" ""))
                                      :role (:url repo)})
                                   (remove (fn [{:keys [text]}] (string/blank? text))))
                                  [{:text "Add new graph"
                                    :role "add-new-graph"}])]
                     (ui-component/open-modal! "Switch graph"
                                               {:type :action-sheet
                                                :buttons buttons
                                                :inputs []
                                                :on-action (fn [e]
                                                             (when-let [role (:role e)]
                                                               (if (= "add-new-graph" role)
                                                                 (state/pub-event! [:graph/new-db-graph])
                                                                 (when (string/starts-with? role "logseq_db_")
                                                                   (state/pub-event! [:graph/switch role])))))
                                                :modal-props {:class "graph-switcher"}})))}
      [:span.flex.items-center.gap-2.opacity-80.pt-1
       [:strong.overflow-hidden.text-ellipsis.block.font-normal
        {:style {:max-width "40vw"}}
        short-repo-name]])]))

(rum/defc bottom-tabs
  []
  (ion/tab-bar
   {:slot "bottom"}
   (ion/tab-button
    {:tab "home"}
    (ion/tabler-icon "home" {:size 22}) "Journals")
   (ion/tab-button
    {:tab "search"}
    (ion/tabler-icon "search" {:size 22}) "Search")
   (ion/tab-button
    {:tab "quick-add"
     :on-pointer-down (fn [e]
                        (util/stop e)
                        (editor-handler/show-quick-add))}
    (ion/tabler-icon "plus" {:size 22}) "Quick add")
   (ion/tab-button
    {:tab "settings"}
    (ion/tabler-icon "settings" {:size 22}) "Settings")))

(rum/defc keep-keyboard-open
  []
  [:input.absolute.top-4.left-0.w-1.h-1.opacity-0
   {:id "app-keep-keyboard-open-input"
    :auto-capitalize "off"
    :auto-correct "false"}])

(rum/defc journals
  []
  (ui-component/classic-app-container-wrap
   [:div.pt-3
    (journal/all-journals)]))

(rum/defc home-inner
  [*page db-restoring? current-tab]
  (ion/page
   {:id "app-main-content"
    :ref *page}
   (ion/header
    (ion/toolbar
     (ion/buttons {:slot "start"}
                  (app-graphs-select))

     (ion/buttons {:slot "end"}
                  (ion/button
                   {:size "small"
                    :fill "clear"
                    :on-click (fn []
                                (let [apply-date! (fn [date]
                                                    (let [page-name (date/journal-name (gdate/Date. (js/Date. date)))]
                                                      (if-let [journal (db/get-page page-name)]
                                                        (mobile-state/open-block-modal! journal)
                                                        (-> (page-handler/<create! page-name {:redirect? false})
                                                            (p/then #(mobile-state/open-block-modal! (db/get-page page-name)))))))]
                                  (-> (.showDatePicker mobile-util/ui-local)
                                      (p/then (fn [^js e] (some-> e (.-value) (apply-date!)))))))}
                   [:span.text-muted-foreground {:slot "icon-only"}
                    (ion/tabler-icon "calendar-month" {:size 24})])

                  (let [repo (state/get-current-repo)]
                    [:div.flex.flex-row.items-center.gap-2.text-muted-foreground
                     (when (and repo
                                (ldb/get-graph-rtc-uuid (db/get-db))
                                (user-handler/logged-in?))
                       (rtc-indicator/indicator))]))))

   ;; main content
   (if db-restoring?
     (ion/content
      [:div.space-y-2.my-8.mx-2
       (shui/skeleton {:class "h-10 w-full mb-8 bg-gray-200"})
       (shui/skeleton {:class "h-6 w-full bg-gray-200"})
       (shui/skeleton {:class "h-6 w-full bg-gray-200"})])
     (ion/content {:class "scrolling ion-padding"}
                  (if (= current-tab "search")
                    [:div]
                    (journals))))))

(rum/defc home < rum/reactive
  {:did-mount (fn [state]
                (ui/inject-document-devices-envs!)
                state)}
  [*page current-tab]
  (let [db-restoring? (state/sub :db/restoring?)]
    (home-inner *page db-restoring? current-tab)))

(defn use-theme-effects!
  [current-repo]
  (let [[theme] (frum/use-atom-in state/state :ui/theme)]
    (hooks/use-effect!
     (fn []
       (state/sync-system-theme!)
       (ui/setup-system-theme-effect!))
     [])
    (hooks/use-effect!
     #(let [^js doc js/document.documentElement
            ^js cls (.-classList doc)
            ^js cls-body (.-classList js/document.body)]
        (.setAttribute doc "data-theme" theme)
        (if (= theme "dark")                               ;; for tailwind dark mode
          (do (.add cls "dark") (.add cls "ion-palette-dark")
              (doto cls-body (.remove "light-theme") (.add "dark-theme")))
          (do (.remove cls "dark") (.remove cls "ion-palette-dark")
              (doto cls-body (.remove "dark-theme") (.add "light-theme")))))
     [theme]))

  (hooks/use-effect!
   (fn []
     (some-> js/window.externalsjs (.settleStatusBar)))
   [current-repo]))

(rum/defc tabs
  [current-repo]
  (let [[current-tab _] (mobile-state/use-tab)
        *home-page (hooks/use-ref nil)
        *search-page (hooks/use-ref nil)
        [presenting-element set-presenting-element!] (hooks/use-state nil)]
    (use-theme-effects! current-repo)
    (hooks/use-effect!
     (fn []
       (case current-tab
         "home"
         (set-presenting-element! (rum/deref *home-page))
         "search"
         (set-presenting-element! (rum/deref *search-page))
         nil))
     [current-tab])
    (ion/tabs
     {:id "app-ion-tabs"
      :onIonTabsDidChange (fn [^js e]
                            (mobile-state/set-tab! (.-tab (.-detail e))
                                                   (.-target e)))}
     (ion/tab
      {:tab "home"}
      (ion/content
       (home *home-page current-tab)))
     (ion/tab
      {:tab "search"}
      (ion/content
       (search/search *search-page)))
     (ion/tab
      {:tab "settings"}
      (ion/content
       (settings/page)))

     (bottom-tabs)

     (keep-keyboard-open)
     (ui-component/install-notifications)
     (ui-component/install-modals)

     (shui-toaster/install-toaster)
     (shui-dialog/install-modals)
     (shui-popup/install-popups)
     (modal/block-modal presenting-element)
     (popup/popup))))

(rum/defc main < rum/reactive
  []
  (let [current-repo (state/sub :git/current-repo)
        show-action-bar? (state/sub :mobile/show-action-bar?)]
    (ion/app
     (tabs current-repo)
     (editor-toolbar/mobile-bar)
     (when show-action-bar?
       (selection-toolbar/action-bar)))))
