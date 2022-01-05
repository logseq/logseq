(ns frontend.components.plugins
  (:require [rum.core :as rum]
            [frontend.state :as state]
            [cljs-bean.core :as bean]
            [frontend.context.i18n :as i18n]
            [frontend.ui :as ui]
            [frontend.handler.ui :as ui-handler]
            [frontend.search :as search]
            [frontend.util :as util]
            [frontend.mixins :as mixins]
            [electron.ipc :as ipc]
            [promesa.core :as p]
            [frontend.components.svg :as svg]
            [frontend.handler.notification :as notification]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.page :as page-handler]
            [clojure.string :as string]))

(rum/defcs installed-themes
  < rum/reactive
    (rum/local 0 ::cursor)
    (rum/local 0 ::total)
    (mixins/event-mixin
      (fn [state]
        (let [*cursor (::cursor state)
              *total (::total state)
              ^js target (rum/dom-node state)]
          (.focus target)
          (mixins/on-key-down
            state {38                                       ;; up
                   (fn [^js e]
                     (reset! *cursor
                             (if (zero? @*cursor)
                               (dec @*total) (dec @*cursor))))
                   40                                       ;; down
                   (fn [^js e]
                     (reset! *cursor
                             (if (= @*cursor (dec @*total))
                               0 (inc @*cursor))))

                   13                                       ;; enter
                   #(when-let [^js active (.querySelector target ".is-active")]
                      (.click active))
                   }))))
  [state]
  (let [*cursor (::cursor state)
        *total (::total state)
        themes (state/sub :plugin/installed-themes)
        selected (state/sub :plugin/selected-theme)
        themes (cons {:name "Default Theme" :url nil :description "Logseq default light/dark theme."} themes)
        themes (sort #(:selected %) (map #(assoc % :selected (= (:url %) selected)) themes))
        _ (reset! *total (count themes))]

    (rum/with-context
      [[t] i18n/*tongue-context*]

      [:div.cp__themes-installed
       {:tab-index -1}
       [:h1.mb-4.text-2xl.p-1 (t :themes)]
       (map-indexed
         (fn [idx opt]
           (let [current-selected (:selected opt)
                 plg (get (:plugin/installed-plugins @state/state) (keyword (:pid opt)))]
             [:div.it.flex.px-3.py-1.5.rounded-sm.justify-between
              {:key      (str idx (:url opt))
               :title    (if current-selected "Cancel selected theme")
               :class    (util/classnames
                           [{:is-selected current-selected
                             :is-active   (= idx @*cursor)}])
               :on-click #(do (js/LSPluginCore.selectTheme (if current-selected nil (clj->js opt)))
                              (state/close-modal!))}
              [:section
               [:strong.block
                [:small.opacity-60 (str (or (:name plg) "Logseq") " • ")]
                (:name opt)]]
              [:small.flex-shrink-0.flex.items-center.opacity-10
               (if current-selected (ui/icon "check"))]]))
         themes)])))

(rum/defc unpacked-plugin-loader
  [unpacked-pkg-path]
  (rum/use-effect!
    (fn []
      (let [err-handle
            (fn [^js e]
              (case (keyword (aget e "name"))
                :IllegalPluginPackageError
                (notification/show! "Illegal Logseq plugin package." :error)
                :ExistedImportedPluginPackageError
                (notification/show! "Existed Imported plugin package." :error)
                :default)
              (plugin-handler/reset-unpacked-state))
            reg-handle #(plugin-handler/reset-unpacked-state)]
        (when unpacked-pkg-path
          (doto js/LSPluginCore
            (.once "error" err-handle)
            (.once "registered" reg-handle)
            (.register (bean/->js {:url unpacked-pkg-path}))))
        #(doto js/LSPluginCore
           (.off "error" err-handle)
           (.off "registered" reg-handle))))
    [unpacked-pkg-path])

  (when unpacked-pkg-path
    [:strong.inline-flex.px-3 "Loading ..."]))

(rum/defc category-tabs
  [t category on-action]

  [:div.secondary-tabs.categories
   (ui/button
     [:span (ui/icon "puzzle") (t :plugins)]
     :intent "logseq"
     :on-click #(on-action :plugins)
     :class (if (= category :plugins) "active" ""))
   (ui/button
     [:span (ui/icon "palette") (t :themes)]
     :intent "logseq"
     :on-click #(on-action :themes)
     :class (if (= category :themes) "active" ""))])

(rum/defc local-markdown-display
  < rum/reactive
  []
  (let [[content item] (state/sub :plugin/active-readme)]
    [:div.cp__plugins-details
     {:on-click (fn [^js/MouseEvent e]
                  (when-let [target (.-target e)]
                    (when (and (= (string/lower-case (.-nodeName target)) "a")
                               (not (string/blank? (. target getAttribute "href"))))
                      (js/apis.openExternal (. target getAttribute "href"))
                      (.preventDefault e))))}
     (when-let [repo (:repository item)]
       (when-let [repo (if (string? repo) repo (:url repo))]
         [:div.p-4.rounded-md.bg-base-3
          [:strong [:a.flex.items-center {:target "_blank" :href repo}
                    [:span.mr-1 (svg/github {:width 25 :height 25})] repo]]]))
     [:div.p-1.bg-transparent.border-none.ls-block
      {:style                   {:min-height "60vw"
                                 :max-width  900}
       :dangerouslySetInnerHTML {:__html content}}]]))

(rum/defc remote-readme-display
  [repo content]

  (let [src (str "lsp://logseq.com/marketplace.html?repo=" repo)]
    [:iframe.lsp-frame-readme {:src src}]))

(defn security-warning
  []
  (ui/admonition
    :warning
    [:div.max-w-4xl
     "Plugins can access your graph and your local files, issue network requests.
      They can also cause data corruption or loss. We're working on proper access rules for your graphs.
      Meanwhile, make sure you have regular backups of your graphs and only install the plugins when you can read and
      understand the source code."]))

(rum/defc plugin-item-card < rum/static
  [{:keys [id name title settings version url description author icon usf iir repo sponsors] :as item}
   market? *search-key has-other-pending?
   installing-or-updating? installed? stat coming-update]

  (let [disabled (:disabled settings)
        name (or title name "Untitled")
        unpacked? (not iir)
        new-version (and coming-update (:latest-version coming-update))]
    (rum/with-context
      [[t] i18n/*tongue-context*]

      [:div.cp__plugins-item-card
       {:class (util/classnames
                 [{:market          market?
                   :installed       installed?
                   :updating        installing-or-updating?
                   :has-new-version new-version}])}

       [:div.l.link-block
        {:on-click #(plugin-handler/open-readme!
                      url item (if repo remote-readme-display local-markdown-display))}
        (if (and icon (not (string/blank? icon)))
          [:img.icon {:src (if market? (plugin-handler/pkg-asset id icon) icon)}]
          svg/folder)

        (when (and (not market?) unpacked?)
          [:span.flex.justify-center.text-xs.text-red-500.pt-2 "unpacked"])]

       [:div.r
        [:h3.head.text-xl.font-bold.pt-1.5

         [:span name]
         (if (not market?) [:sup.inline-block.px-1.text-xs.opacity-50 version])]

        [:div.desc.text-xs.opacity-70
         [:p description]
         ;;[:small (js/JSON.stringify (bean/->js settings))]
         ]

        ;; Author & Identity
        [:div.flag
         [:p.text-xs.pr-2.flex.justify-between
          [:small {:on-click #(when-let [^js el (js/document.querySelector ".cp__plugins-page .search-ctls input")]
                                (reset! *search-key (str "@" author))
                                (.select el))} author]
          [:small {:on-click #(do
                                (notification/show! "Copied!" :success)
                                (util/copy-to-clipboard! id))}
           (str "ID: " id)]]]

        ;; Github repo
        [:div.flag.is-top.opacity-50
         (if repo
           [:a.flex {:target "_blank"
                     :href   (plugin-handler/gh-repo-url repo)}
            (svg/github {:width 16 :height 16})])]

        (if market?
          ;; market ctls
          [:div.ctl
           [:ul.l.flex.items-center
            ;; stars
            [:li.flex.text-sm.items-center.pr-3
             (svg/star 16) [:span.pl-1 (:stargazers_count stat)]]

            ;; downloads
            (when-let [downloads (and stat (:total_downloads stat))]
              (if (and downloads (> downloads 0))
                [:li.flex.text-sm.items-center.pr-3
                 (svg/cloud-down 16) [:span.pl-1 downloads]]))]

           [:div.r.flex.items-center

            [:a.btn
             {:class    (util/classnames [{:disabled   (or installed? installing-or-updating?)
                                           :installing installing-or-updating?}])
              :on-click #(plugin-handler/install-marketplace-plugin item)}
             (if installed?
               (t :plugin/installed)
               (if installing-or-updating?
                 [:span.flex.items-center [:small svg/loading]
                  (t :plugin/installing)]
                 (t :plugin/install)))]]]

          ;; installed ctls
          [:div.ctl
           [:div.l
            [:div.de
             [:strong (ui/icon "settings")]
             [:ul.menu-list
              [:li {:on-click #(if usf (js/apis.openPath usf))} (t :plugin/open-settings)]
              [:li {:on-click #(js/apis.openPath url)} (t :plugin/open-package)]
              [:li {:on-click
                    #(let [confirm-fn
                           (ui/make-confirm-modal
                             {:title      (t :plugin/delete-alert name)
                              :on-confirm (fn [_ {:keys [close-fn]}]
                                            (close-fn)
                                            (plugin-handler/unregister-plugin id))})]
                       (state/set-sub-modal! confirm-fn {:center? true}))}
               (t :plugin/uninstall)]]]

            (when (seq sponsors)
              [:div.de.sponsors
               [:strong (ui/icon "coffee")]
               [:ul.menu-list
                (for [link sponsors]
                  [:li [:a {:href link :target "_blank"}
                        [:span.flex.items-center link (ui/icon "external-link")]]])]])
            ]

           [:div.r.flex.items-center
            (if (and unpacked? (not disabled))
              [:a.btn
               {:on-click #(js-invoke js/LSPluginCore "reload" id)}
               (t :plugin/reload)])

            (when (not unpacked?)
              [:div.updates-actions
               [:a.btn
                {:class    (util/classnames [{:disabled (or installing-or-updating?)}])
                 :on-click #(if-not has-other-pending?
                              (plugin-handler/check-or-update-marketplace-plugin
                                (assoc item :only-check (not new-version))
                                (fn [e] (notification/show! e :error))))}

                (if installing-or-updating?
                  (t :plugin/updating)
                  (if new-version
                    (str (t :plugin/update) " 👉 " new-version)
                    (t :plugin/check-update))
                  )]])

            (ui/toggle (not disabled)
                       (fn []
                         (js-invoke js/LSPluginCore (if disabled "enable" "disable") id)
                         (page-handler/init-commands!))
                       true)]])]])))

(rum/defc panel-control-tabs
  < rum/static
  [t search-key *search-key category *category
   sort-by *sort-by selected-unpacked-pkg
   market? develop-mode? reload-market-fn]

  (let [*search-ref (rum/create-ref)]
    [:div.mb-2.flex.justify-between.control-tabs.relative
     [:div.flex.items-center.l
      (category-tabs t category #(reset! *category %))

      (when (and develop-mode? (not market?))
        [:div
         (ui/tippy {:html  [:div (t :plugin/unpacked-tips)]
                    :arrow true}
                   (ui/button
                     [:span (ui/icon "upload") (t :plugin/load-unpacked)]
                     :intent "logseq"
                     :class "load-unpacked"
                     :on-click plugin-handler/load-unpacked-plugin))

         (unpacked-plugin-loader selected-unpacked-pkg)])]

     [:div.flex.items-center.r

      ;;(ui/button
      ;;  (t :plugin/open-preferences)
      ;;  :intent "logseq"
      ;;  :on-click (fn []
      ;;              (p/let [root (plugin-handler/get-ls-dotdir-root)]
      ;;                (js/apis.openPath (str root "/preferences.json")))))

      ;; search
      [:div.search-ctls
       [:small.absolute.s1
        (ui/icon "search")]
       (when-not (string/blank? search-key)
         [:small.absolute.s2
          {:on-click #(when-let [^js target (rum/deref *search-ref)]
                        (reset! *search-key nil)
                        (.focus target))}
          (ui/icon "x")])
       [:input.form-input.is-small
        {:placeholder "Search plugins"
         :ref         *search-ref
         :on-key-down (fn [^js e]
                        (if (= 27 (.-keyCode e))
                          (when-not (string/blank? search-key)
                            (util/stop e)
                            (reset! *search-key nil))))
         :on-change   #(let [^js target (.-target %)]
                         (reset! *search-key (util/trim-safe (.-value target))))
         :value       (or search-key "")}]]


      ;; sorter
      (ui/dropdown-with-links
        (fn [{:keys [toggle-fn]}]
          (ui/button
            [:span (ui/icon "arrows-sort") ""]
            :class "sort-by"
            :on-click toggle-fn
            :intent "link"))
        (let [aim-icon #(if (= sort-by %) "check" "circle")]
          (if market?
            [{:title   "Downloads (Desc)"
              :options {:on-click #(reset! *sort-by :downloads)}
              :icon    (ui/icon (aim-icon :downloads))}

             {:title   "Stars (Desc)"
              :options {:on-click #(reset! *sort-by :stars)}
              :icon    (ui/icon (aim-icon :stars))}

             {:title   "Title (A - Z)"
              :options {:on-click #(reset! *sort-by :letters)}
              :icon    (ui/icon (aim-icon :letters))}]

            [{:title   (t :plugin/enabled)
              :options {:on-click #(reset! *sort-by :enabled)}
              :icon    (ui/icon (aim-icon :enabled))}]))
        {})

      ;; more - updater
      (ui/dropdown-with-links
        (fn [{:keys [toggle-fn]}]
          (ui/button
            [:span (ui/icon "dots-vertical")]
            :class "more-do"
            :on-click toggle-fn
            :intent "link"))

        (concat (if market?
                  [{:title   [:span (ui/icon "rotate-clockwise") (t :plugin/refresh-lists)]
                    :options {:on-click #(reload-market-fn)}}]
                  [{:title   [:span (ui/icon "rotate-clockwise") (t :plugin/check-all-updates)]
                    :options {:on-click #(plugin-handler/check-enabled-for-updates (not= :plugins category))}}])
                (when (state/developer-mode?)
                  [{:hr true}
                   {:title   [:span (ui/icon "file-code") "Open Preferences"]
                    :options {:on-click
                              #(p/let [root (plugin-handler/get-ls-dotdir-root)]
                                 (js/apis.openPath (str root "/preferences.json")))}}
                   {:title   [:span (ui/icon "bug") "Open " [:code " ~/.logseq"]]
                    :options {:on-click
                              #(p/let [root (plugin-handler/get-ls-dotdir-root)]
                                 (js/apis.openPath root))}}]))
        {})

      ;; developer
      (ui/button
        (t :plugin/contribute)
        :href "https://github.com/logseq/marketplace"
        :class "contribute"
        :intent "logseq"
        :target "_blank")
      ]]))

(rum/defcs marketplace-plugins
  < rum/static rum/reactive
    (rum/local false ::fetching)
    (rum/local "" ::search-key)
    (rum/local :plugins ::category)
    (rum/local :downloads ::sort-by)                        ;; downloads / stars / letters / updates
    (rum/local nil ::error)
    {:did-mount (fn [s]
                  (let [reload-fn (fn [force-refresh?]
                                    (when-not @(::fetching s)
                                      (reset! (::fetching s) true)
                                      (reset! (::error s) nil)
                                      (-> (plugin-handler/load-marketplace-plugins force-refresh?)
                                          (p/then #(plugin-handler/load-marketplace-stats false))
                                          (p/catch #(do (js/console.error %) (reset! (::error s) %)))
                                          (p/finally #(reset! (::fetching s) false)))))]
                    (reload-fn false)
                    (assoc s ::reload (partial reload-fn true))))}
  [state]
  (let [pkgs (state/sub :plugin/marketplace-pkgs)
        stats (state/sub :plugin/marketplace-stats)
        installed-plugins (state/sub :plugin/installed-plugins)
        installing (state/sub :plugin/installing)
        online? (state/sub :network/online?)
        develop-mode? (state/sub :ui/developer-mode?)
        *search-key (::search-key state)
        *category (::category state)
        *sort-by (::sort-by state)
        *fetching (::fetching state)
        *error (::error state)
        filtered-pkgs (when (seq pkgs)
                        (if (= @*category :themes)
                          (filter #(:theme %) pkgs)
                          (filter #(not (:theme %)) pkgs)))
        filtered-pkgs (if-not (string/blank? @*search-key)
                        (if-let [author (and (string/starts-with? @*search-key "@")
                                             (subs @*search-key 1))]
                          (filter #(= author (:author %)) filtered-pkgs)
                          (search/fuzzy-search
                            filtered-pkgs @*search-key
                            :limit 30
                            :extract-fn :title))
                        filtered-pkgs)
        filtered-pkgs (map #(if-let [stat (get stats (keyword (:id %)))]
                              (let [downloads (:total_downloads stat)
                                    stars (:stargazers_count stat)]
                                (assoc % :stat stat
                                         :stars stars
                                         :downloads downloads))
                              %) filtered-pkgs)
        sorted-pkgs (apply sort-by
                           (conj
                             (case @*sort-by
                               :letters [:title #(compare %1 %2)]
                               [@*sort-by #(compare %2 %1)])
                             filtered-pkgs))]

    (rum/with-context
      [[t] i18n/*tongue-context*]

      [:div.cp__plugins-marketplace

       (panel-control-tabs
         t
         @*search-key *search-key
         @*category *category
         @*sort-by *sort-by nil true
         develop-mode? (::reload state))

       (cond
         (not online?)
         [:p.flex.justify-center.pt-20.opacity-50
          (svg/offline 30)]

         @*fetching
         [:p.flex.justify-center.pt-20
          svg/loading]

         @*error
         [:p.flex.justify-center.pt-20.opacity-50
          "Remote error: " (.-message @*error)]

         :else
         [:div.cp__plugins-marketplace-cnt
          {:class (util/classnames [{:has-installing (boolean installing)}])}
          [:div.cp__plugins-item-lists.grid-cols-1.md:grid-cols-2.lg:grid-cols-3
           (for [item sorted-pkgs]
             (rum/with-key
               (let [pid (keyword (:id item))
                     stat (:stat item)]
                 (plugin-item-card
                   item true *search-key installing
                   (and installing (= (keyword (:id installing)) pid))
                   (contains? installed-plugins pid) stat nil))
               (:id item)))]])])))

(rum/defcs installed-plugins
  < rum/static rum/reactive
    (rum/local "" ::search-key)
    (rum/local :enabled ::sort-by)                          ;; enabled / letters / updates
    (rum/local :plugins ::category)
  [state]
  (let [installed-plugins (state/sub :plugin/installed-plugins)
        installed-plugins (vals installed-plugins)
        updating (state/sub :plugin/installing)
        develop-mode? (state/sub :ui/developer-mode?)
        selected-unpacked-pkg (state/sub :plugin/selected-unpacked-pkg)
        coming-updates (state/sub :plugin/updates-coming)
        *sort-by (::sort-by state)
        *search-key (::search-key state)
        *category (::category state)
        filtered-plugins (when (seq installed-plugins)
                           (if (= @*category :themes)
                             (filter #(:theme %) installed-plugins)
                             (filter #(not (:theme %)) installed-plugins)))
        filtered-plugins (if-not (string/blank? @*search-key)
                           (if-let [author (and (string/starts-with? @*search-key "@")
                                                (subs @*search-key 1))]
                             (filter #(= author (:author %)) filtered-plugins)
                             (search/fuzzy-search
                               filtered-plugins @*search-key
                               :limit 30
                               :extract-fn :name))
                           filtered-plugins)
        sorted-plugins (->> filtered-plugins
                            (reduce #(let [k (if (get-in %2 [:settings :disabled]) 1 0)]
                                       (update %1 k conj %2)) [[] []])
                            (#(update % 0 (fn [it] (sort-by :iir it))))
                            (flatten))]
    (rum/with-context
      [[t] i18n/*tongue-context*]

      [:div.cp__plugins-installed

       (panel-control-tabs
         t
         @*search-key *search-key
         @*category *category
         @*sort-by *sort-by
         selected-unpacked-pkg
         false develop-mode? nil)

       [:div.cp__plugins-item-lists.grid-cols-1.md:grid-cols-2.lg:grid-cols-3
        (for [item sorted-plugins]
          (rum/with-key
            (let [pid (keyword (:id item))]
              (plugin-item-card
                item false *search-key updating
                (and updating (= (keyword (:id updating)) pid))
                true nil (get coming-updates pid))) (:id item)))]])))

(defn open-select-theme!
  []
  (state/set-sub-modal! installed-themes))

(rum/defc hook-ui-slot
  ([type payload] (hook-ui-slot type payload nil))
  ([type payload opts]
   (let [rs (util/rand-str 8)
         id (str "slot__" rs)]
     (rum/use-effect!
       (fn []
         (plugin-handler/hook-plugin-app type {:slot id :payload payload} nil)
         #())
       [id])
     [:div.lsp-hook-ui-slot
      (merge opts {:id            id
                   :on-mouse-down (fn [e] (util/stop e))})])))

(rum/defc ui-item-renderer
  [pid type {:keys [key template]}]
  (let [*el (rum/use-ref nil)
        uni #(str "injected-ui-item-" %)
        ^js pl (js/LSPluginCore.registeredPlugins.get (name pid))]

    (rum/use-effect!
      (fn []
        (when-let [^js el (rum/deref *el)]
          (js/LSPlugin.pluginHelpers.setupInjectedUI.call
            pl #js {:slot (.-id el) :key key :template template} #js {})))
      [])

    (if-not (nil? pl)
      [:div {:id    (uni (str (name key) "-" (name pid)))
             :class (uni (name type))
             :ref   *el}]
      [:span])))

(rum/defcs hook-ui-items < rum/reactive
                           "type
                                                        - :toolbar
                                                        - :pagebar
                                                     "
  [state type]
  (when (state/sub [:plugin/installed-ui-items])
    (let [items (state/get-plugins-ui-items-with-type type)]
      (when (seq items)
        [:div {:class     (str "ui-items-container")
               :data-type (name type)}
         (for [[_ {:keys [key template] :as opts} pid] items]
           (rum/with-key (ui-item-renderer pid type opts) key))]))))

(rum/defc plugins-page
  []

  (let [[active set-active!] (rum/use-state :installed)
        market? (= active :marketplace)
        *el-ref (rum/create-ref)]

    (rum/use-effect!
      #(let [^js el (rum/deref *el-ref)]
         (js/setTimeout (fn [] (.focus el)) 100))
      [])

    (rum/with-context
      [[t] i18n/*tongue-context*]

      [:div.cp__plugins-page
       {:ref       *el-ref
        :tab-index "-1"}
       [:h1 (t :plugins)]
       (security-warning)
       [:hr]

       [:div.tabs.flex.items-center.justify-center
        [:div.tabs-inner.flex.items-center
         (ui/button [:span.it (t :plugin/installed)]
                    :on-click #(set-active! :installed)
                    :intent "logseq" :class (if-not market? "active" ""))

         (ui/button [:span.mk (svg/apps 16) (t :plugin/marketplace)]
                    :on-click #(set-active! :marketplace)
                    :intent "logseq" :class (if market? "active" ""))]]

       [:div.panels
        (if market?
          (marketplace-plugins)
          (installed-plugins))]])))

(rum/defc custom-js-installer
  [{:keys [t current-repo db-restoring? nfs-granted?] :as props}]
  (rum/use-effect!
    (fn []
      (when (and (not db-restoring?)
                 (or (not util/nfs?) nfs-granted?))
        (ui-handler/exec-js-if-exists-&-allowed! t)))
    [current-repo db-restoring? nfs-granted?])
  nil)

(defn open-plugins-modal!
  []
  (state/set-modal!
    (fn [close!]
      (plugins-page))))