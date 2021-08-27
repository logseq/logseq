(ns frontend.components.plugins
  (:require [rum.core :as rum]
            [frontend.state :as state]
            [cljs-bean.core :as bean]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [electron.ipc :as ipc]
            [promesa.core :as p]
            [frontend.components.svg :as svg]
            [frontend.handler.notification :as notification]
            [frontend.handler.plugin :as plugin-handler]
            [clojure.string :as string]))

(rum/defc installed-themes
  < rum/reactive
  []
  (let [themes (state/sub :plugin/installed-themes)
        selected (state/sub :plugin/selected-theme)
        themes (cons {:name "Default Theme" :url nil :description "Logseq default light/dark theme."} themes)]

    [:div.cp__themes-installed
     [:h2.mb-4.text-xl "Installed Themes"]
     (for [opt themes]
       (let [current-selected (= selected (:url opt))]
         [:div.it.flex.px-3.py-2.mb-2.rounded-sm.justify-between
          {:key      (:url opt)
           :class    [(if current-selected "is-selected")]
           :on-click #(do (js/LSPluginCore.selectTheme (if current-selected nil (clj->js opt)))
                          (state/set-modal! nil))}
          [:section
           [:strong.block (:name opt)]
           [:small.opacity-30 (:description opt)]]
          [:small.flex-shrink-0.flex.items-center.opacity-10
           (if current-selected "current")]]))]))

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

(rum/defc simple-markdown-display
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
          [:strong [:a.flex.items-center {:target "_blank" :href repo} [:span.mr-1 (svg/github {:width 25 :height 25})] repo]]]))
     [:div.p-1.bg-transparent.border-none.ls-block
      {:style                   {:min-height "60vw"
                                 :max-width  900}
       :dangerouslySetInnerHTML {:__html content}}]]))

(defn security-warning
  []
  (ui/admonition
    :warning
    [:div {:style {:max-width 700}}
     "Plugins can access your graph and your local files, issue network requests.
     They can also cause data corruption or loss. We're working on proper access rules for your graphs.
     Meanwhile, make sure you have regular backups of your graphs and only install the plugins when you can read and
     understand the source code."]))

(rum/defc plugin-item-card
  [{:keys [id name settings version url description author icon usf repo] :as item}]
  (let [market? (and (not (nil? repo)) (nil? usf))
        disabled (:disabled settings)]
    [:div.cp__plugins-item-card
     {:class (util/classnames [{:market market?}])}

     [:div.l.link-block
      {:on-click #(plugin-handler/open-readme! url item simple-markdown-display)}
      (if icon
        [:img.icon {:src (if market? (plugin-handler/pkg-asset id icon) icon)}]
        svg/folder)]

     [:div.r
      [:h3.head.text-xl.font-bold.pt-1.5

       [:span name]
       (if (not market?) [:sup.inline-block.px-1.text-xs.opacity-30 version])]

      [:div.desc.text-xs.opacity-60
       [:p description]
       ;;[:small (js/JSON.stringify (bean/->js settings))]
       ]

      [:div.flag
       [:p.text-xs.text-gray-300.pr-2.flex.justify-between.dark:opacity-40
        [:small author]
        [:small (str "ID: " id)]]]

      [:div.flag.is-top.opacity-50
       (if repo
         [:a.flex {:target "_blank" :href (plugin-handler/gh-repo-url repo)} (svg/github {:width 16 :height 16})])]

      (if market?
        ;; market ctls
        [:div.ctl
         [:ul.l.flex.items-center
          [:li.flex.text-sm.items-center (svg/cloud-down 16) [:span.pl-1 "128"]]
          [:li.flex.text-sm.items-center.pl-3 (svg/star 16) [:span.pl-1 "128"]]]

         [:div.r.flex.items-center

          [:a.text-sm "install"]]]

        ;; installed ctls
        [:div.ctl
         [:div.l
          [:div.de
           [:strong svg/settings-sm]
           [:ul.menu-list
            [:li {:on-click #(if usf (js/apis.openPath usf))} "Open settings"]
            [:li {:on-click #(js/apis.openPath url)} "Open plugin package"]
            [:li {:on-click
                  #(let [confirm-fn
                         (ui/make-confirm-modal
                           {:title      (str "Are you sure uninstall plugin [" name "] ?")
                            :on-confirm (fn [_ {:keys [close-fn]}]
                                          (close-fn)
                                          (plugin-handler/unregister-plugin id))})]
                     (state/set-modal! confirm-fn))}
             "Uninstall plugin"]]]]

         [:div.flex.items-center
          [:small.de (if disabled "Disabled" "Enabled")]
          (ui/toggle (not disabled)
                     (fn []
                       (js-invoke js/LSPluginCore (if disabled "enable" "disable") id))
                     true)]])]]))

(rum/defcs marketplace-plugins
  < rum/static rum/reactive
    (rum/local false ::fetching)
    {:did-mount (fn [s]
                  (reset! (::fetching s) true)
                  (-> (plugin-handler/load-marketplace-plugins false)
                      (p/catch #(js/console.error))
                      (p/finally #(reset! (::fetching s) false)))
                  s)}
  [state]
  (let [pkgs (state/sub :plugin/marketplace-pkgs)
        installed (state/sub :plugin/installed-plugins)
        installing (state/sub :plugin/installing)
        *fetching (::fetching state)]

    (if @*fetching
      [:p.flex.justify-center.pt-20
       svg/loading]

      [:div.cp__plugins-marketplace
       [:div.cp__plugins-item-lists.grid-cols-1.md:grid-cols-2.lg:grid-cols-3
        (for [item pkgs]
          (rum/with-key (plugin-item-card item) (:id item)))]])))

(rum/defcs installed-plugins
  < rum/static rum/reactive
  [state]
  (let [installed-plugins (state/sub :plugin/installed-plugins)
        selected-unpacked-pkg (state/sub :plugin/selected-unpacked-pkg)]
    [:div.cp__plugins-installed
     [:div.mb-6.flex.items-center.justify-between
      (ui/button
        "Load unpacked plugin"
        :intent "logseq"
        :on-click plugin-handler/load-unpacked-plugin)
      (unpacked-plugin-loader selected-unpacked-pkg)
      (when (util/electron?)
        (ui/button
          [:span.flex.items-center
           ;;svg/settings-sm
           "Open plugin preferences file"]
          :intent "logseq"
          :on-click (fn []
                      (p/let [root (plugin-handler/get-ls-dotdir-root)]
                        (js/apis.openPath (str root "/preferences.json"))))))]

     [:div.cp__plugins-item-lists.grid-cols-1.md:grid-cols-2.lg:grid-cols-3
      (for [[_ item] installed-plugins]
        (rum/with-key (plugin-item-card item) (:id item)))]]))

(defn open-select-theme!
  []
  (state/set-modal! installed-themes))

(rum/defc hook-ui-slot
  ([type payload] (hook-ui-slot type payload nil))
  ([type payload opts]
   (let [id (str "slot__" (util/rand-str 8))]
     (rum/use-effect!
       (fn []
         (plugin-handler/hook-plugin-app type {:slot id :payload payload} nil)
         #())
       [])
     [:div.lsp-hook-ui-slot
      (merge opts {:id id})])))

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

  (let [[active set-active!] (rum/use-state :marketplace)
        market? (= active :marketplace)]

    [:div.cp__plugins-page
     [:h1 "Plugins"]
     (security-warning)
     [:hr]

     [:div.tabs.flex.items-center.justify-center
      [:div.tabs-inner.flex.items-center
       (ui/button [:span.mk (svg/apps 16) "Marketplace"]
                  :on-click #(set-active! :marketplace)
                  :intent "logseq" :class (if market? "active" ""))
       (ui/button [:span.it "Installed"]
                  :on-click #(set-active! :installed)
                  :intent "logseq" :class (if-not market? "active" ""))]]

     [:div.panels
      (if market?
        (marketplace-plugins)
        (installed-plugins))]]))
