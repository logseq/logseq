(ns frontend.components.plugins
  (:require ["react" :as react]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [electron.ipc :as ipc]
            [frontend.components.plugins-settings :as plugins-settings]
            [frontend.components.plugin-logs :as plugin-logs]
            [frontend.components.svg :as svg]
            [frontend.config :as config]
            [frontend.context.i18n :refer [interpolate-rich-text interpolate-rich-text-node t]]
            [frontend.handler.common.plugin :as plugin-common-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.plugin-config :as plugin-config-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.rfx :as rfx]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.storage :as storage]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [io.factorhouse.hsx.core :as hsx]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

(declare open-waiting-updates-modal!)
(defonce PER-PAGE-SIZE 15)
(defonce DISABLED-PLUGINS-CLEANUP-THRESHOLD 100)
(defonce DISABLED-PLUGINS-CLEANUP-SNOOZE-MS (* 1000 60 60 24 30))
(defonce DISABLED-PLUGINS-CLEANUP-NOTIFICATION-ID :lsp-disabled-plugins-cleanup-warning)
(defonce DISABLED-PLUGINS-CLEANUP-SNOOZED-AT-KEY :lsp-disabled-plugins-cleanup-snoozed-at)

(def *dirties-toggle-items (atom {}))

(defn- handle-installed-themes-key-down
  [*cursor *total ^js target ^js e]
  (case (.-keyCode e)
    38                                           ;; up
    (do
      (util/stop e)
      (reset! *cursor
              (if (zero? @*cursor)
                (dec @*total) (dec @*cursor))))
    40                                           ;; down
    (do
      (util/stop e)
      (reset! *cursor
              (if (= @*cursor (dec @*total))
                0 (inc @*cursor))))
    13                                           ;; enter
    (do
      (util/stop e)
      (when-let [^js active (.querySelector target ".is-active")]
        (.click active)))
    nil))

(defn- clear-dirties-states!
  []
  (reset! *dirties-toggle-items {}))

(defn render-classic-dropdown-items
  [id items]
  (for [{:keys [hr item title options icon]} items]
    (let [on-click' (:on-click options)]
      (if hr
        (shui/dropdown-menu-separator)
        (shui/dropdown-menu-item
         (assoc options
                :on-click (fn [^js e]
                            (when on-click'
                              (when-not (false? (on-click' e))
                                (shui/popup-hide! id)))))
         (or item
             [:span.flex.items-center.gap-1.w-full
              icon [:div title]]))))))

(hsx/defc installed-themes
  []
  (let [*root (hooks/use-ref nil)
        [themes set-themes!] (hooks/use-state [])
        *cursor (hooks/use-memo #(atom 0) [])
        *total (hooks/use-memo #(atom 0) [])
        [cursor] (hooks/use-atom *cursor)
        mode (rfx/use-sub [:ui/theme])
        all-themes (rfx/use-sub [:plugin/installed-themes])
        selected (rfx/use-sub [:plugin/selected-theme])]
    (hooks/use-effect!
     (fn []
       (let [mode-title (t (case mode
                             "dark" :settings.general/theme-dark
                             :settings.general/theme-light))
             themes (->> all-themes
                         (filter #(= (:mode %) mode))
                         (sort-by #(:name %)))
             no-mode-themes (->> all-themes
                                 (filter #(= (:mode %) nil))
                                 (sort-by #(:name %))
                                 (map-indexed (fn [idx opt] (assoc opt :group-first (zero? idx) :group-desc (if (zero? idx) (t :plugin.themes/light-and-dark) nil)))))
             themes (map-indexed (fn [idx opt]
                                    (let [selected? (= (:url opt) selected)]
                                      (when selected? (reset! *cursor (+ idx 1)))
                                      (assoc opt :mode mode :selected selected?))) (concat themes no-mode-themes))
             themes (cons {:name        (t :plugin.themes/default-name (string/capitalize mode-title))
                           :url         nil
                           :description (t :plugin.themes/default-desc mode-title)
                           :mode        mode
                           :selected    (nil? selected)
                           :group-first true
                           :group-desc  (t :plugin.themes/group mode-title)} themes)]
         (set-themes! themes)
         (reset! *total (count themes))))
     [mode all-themes selected])
    (hooks/use-effect!
     (fn []
       (some-> (hooks/deref *root) (.focus)))
     [])
    [:div.cp__themes-installed
     {:tab-index -1
      :ref *root
      :on-key-down #(handle-installed-themes-key-down *cursor *total (.-currentTarget %) %)}
     [:h1.mb-4.text-2xl.p-1 (t :nav/themes)]
     (map-indexed
      (fn [idx opt]
        (let [current-selected? (:selected opt)
              group-first?      (:group-first opt)
              plg               (get (:plugin/installed-plugins @state/state) (keyword (:pid opt)))]
          [:div
           {:key (str idx (:name opt))}
           (when (and group-first? (not= idx 0)) [:hr.my-2])
           [:div.it.flex.px-3.py-1.5.rounded-sm.justify-between
            {:title    (:description opt)
             :class    (util/classnames
                        [{:is-selected current-selected?
                          :is-active   (= idx cursor)}])
             :on-click #(do (js/LSPluginCore.selectTheme (bean/->js opt))
                            (shui/dialog-close!))}
            [:div.flex.items-center.text-xs
             [:div.opacity-60 (str (or (:name plg) "Logseq") " •")]
             [:div.name.ml-1 (:name opt)]]
            (when (or group-first? current-selected?)
              [:div.flex.items-center
               (when group-first? [:small.opacity-60 (:group-desc opt)])
               (when current-selected? [:small.inline-flex.ml-1.opacity-60 (ui/icon "check")])])]]))
      themes)]))

(hsx/defc unpacked-plugin-loader
  [unpacked-pkg-path]
  (hooks/use-effect!
   (fn []
     (let [err-handle
           (fn [^js e]
             (case (keyword (aget e "name"))
               :IllegalPluginPackageError
               (plugin-handler/show-illegal-plugin-package-notification! e)
               :ExistedImportedPluginPackageError
               (notification/show! (t :plugin/existed-package (.-message e)) :error)
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
    [:strong.inline-flex.px-3 (t :ui/loading)]))

(hsx/defc category-tabs
  [t total-nums category on-action]

  [:div.secondary-tabs.categories.flex
   (ui/button
    [:span.flex.items-center
     (ui/icon "puzzle")
     (t :nav/plugins) (when (vector? total-nums) (str " (" (first total-nums) ")"))]
    :intent "link"
    :on-click #(on-action :plugins)
    :class (if (= category :plugins) "active" ""))
   (ui/button
    [:span.flex.items-center
     (ui/icon "palette")
     (t :nav/themes) (when (vector? total-nums) (str " (" (last total-nums) ")"))]
    :intent "link"
    :on-click #(on-action :themes)
    :class (if (= category :themes) "active" ""))])

(hsx/defc local-markdown-display
  []
  (let [[content item] (rfx/use-sub [:plugin/active-readme])]
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

(hsx/defc remote-readme-display
  [{:keys [repo]} _content]
  (let [src (str "./marketplace.html?repo=" repo)]
    [:iframe.lsp-frame-readme {:src src}]))

(defn security-warning
  []
  (ui/admonition
   :warning
   [:p.text-sm
    (t :plugin/security-warning)]))

(defn format-number [num & {:keys [precision] :or {precision 2}}]
  (cond
    (< num 1000) (str num)
    (>= num 1000) (str (.toFixed (/ num 1000) precision) "k")))

(hsx/defc card-ctls-of-market
  [item stat installed? installing-or-updating?]
  [:div.ctl
   [:ul.l.flex.items-center
    ;; stars
    [:li.flex.text-sm.items-center.pr-3
     (svg/star 16) [:span.pl-1 (:stargazers_count stat)]]

    ;; downloads
    (when-let [downloads (and stat (:total_downloads stat))]
      (when (and downloads (> downloads 0))
        [:li.flex.text-sm.items-center.pr-3
         (svg/cloud-down 16) [:span.pl-1 (format-number downloads)]]))]

   [:div.r.flex.items-center

    [:a.btn
     {:class    (util/classnames [{:disabled   (or installed? installing-or-updating?)
                                   :installing installing-or-updating?}])
      :on-click #(plugin-common-handler/install-marketplace-plugin! item)}
     (if installed?
       (t :plugin/installed)
       (if installing-or-updating?
         [:span.flex.items-center [:small svg/loading]
          (t :plugin/installing)]
         (t :plugin/install)))]]])

(defn- set-plugin-disabled!
  [id disabled?]
  (-> (js-invoke js/LSPluginCore (if disabled? "disable" "enable") id)
      (p/then (fn []
                (when-let [^js settings (and disabled?
                                             (some-> (plugin-handler/get-plugin-inst id) (.-settings)))]
                  (.set settings "disabled-since" (js/Date.now)))))
      (p/catch #(js/console.error %))))

(hsx/defc card-ctls-of-installed
  [id name url sponsors unpacked? disabled?
   installing-or-updating? has-other-pending?
   new-version item]
  [:div.ctl
   [:div.l
    [:div.de
     [:strong (ui/icon "settings")]
     [:ul.menu-list
      [:li {:on-click #(plugin-handler/open-plugin-settings! id false)} (t :plugin/open-settings)]
      [:li {:on-click #(plugin-logs/open-plugin-logs! {:pid id :name name})} (t :plugin/open-logs)]
      (when (util/electron?)
        [:li {:on-click #(js/apis.openPath url)} (t :plugin/open-package)])
      [:li {:on-click #(plugin-handler/open-report-modal! id name)} (t :plugin/report-security)]
      [:li {:on-click
            #(-> (shui/dialog-confirm!
                  [:b (t :plugin/delete-alert name)]
                  {:cancel-label (t :ui/cancel)
                   :ok-label (t :ui/confirm)})
                 (p/then (fn []
                           (plugin-common-handler/unregister-plugin id)

                           (when (util/electron?)
                             (plugin-config-handler/remove-plugin id)))))}
       (t :plugin/uninstall)]]]

    (when (seq sponsors)
      [:div.de.sponsors
       [:strong (ui/icon "coffee")]
       [:ul.menu-list
        (for [link sponsors]
          [:li {:key link}
           [:a {:href link :target "_blank"}
            [:span.flex.items-center link (ui/icon "external-link")]]])]])]

   [:div.r.flex.items-center
    (when (and unpacked? (not disabled?))
      [:a.btn
       {:on-click #(js-invoke js/LSPluginCore "reload" id)}
       (t :plugin/reload)])

    (when (not unpacked?)
      [:div.updates-actions
       [:a.btn
        {:class    (util/classnames [{:disabled installing-or-updating?}])
         :on-click #(when-not has-other-pending?
                      (plugin-handler/check-or-update-marketplace-plugin!
                       (assoc item :only-check (not new-version))
                       (fn [^js e] (notification/show! (.toString e) :error))))}

        (if installing-or-updating?
          (t :plugin/updating)
          (if new-version
            [:span (t :plugin/update) " 👉 " new-version]
            (t :plugin/check-update)))]])

    (ui/toggle (not disabled?)
               (fn []
                 (set-plugin-disabled! id (not disabled?))
                 (when (nil? (get @*dirties-toggle-items (keyword id)))
                   (swap! *dirties-toggle-items assoc (keyword id) (not disabled?))))
               true)]])

(defn get-open-plugin-readme-handler
  [url {:keys [webPkg] :as item} repo]
  #(plugin-handler/open-readme!
    url item (if (or repo webPkg) remote-readme-display local-markdown-display)))

(defn- plugin-thumb-icon-src
  [id icon market?]
  (when-not (string/blank? icon)
    (if market?
      (plugin-handler/pkg-asset id icon)
      icon)))

(defn- plugin-thumb-icon-view
  [src load-failed? on-error]
  (if (and src (not load-failed?))
    [:img.icon {:src src
                :on-error on-error}]
    svg/folder))

(hsx/defc plugin-thumb-icon
  [id icon market?]
  (let [[load-failed? set-load-failed!] (hooks/use-state false)
        src (plugin-thumb-icon-src id icon market?)]
    (plugin-thumb-icon-view src load-failed?
                            (fn [_]
                              (set-load-failed! true)))))

(hsx/defc plugin-item-card
  [t {:keys [id name title version url description author icon iir repo sponsors webPkg] :as item}
   disabled? market? *search-key has-other-pending?
   installing-or-updating? installed? stat coming-update]

  (let [name (or title name (t :ui/untitled))
        web? (not (nil? webPkg))
        unpacked? (and (not web?) (not iir))
        new-version (state/coming-update-new-version? coming-update)]
    [:div.cp__plugins-item-card
     {:key   (str "lsp-card-" id)
      :class (util/classnames
              [{:market          market?
                :installed       installed?
                :updating        installing-or-updating?
                :has-new-version new-version}])}

     [:div.l.link-block.cursor-pointer
      {:on-click (get-open-plugin-readme-handler url item repo)}
      (plugin-thumb-icon id icon market?)

      (when (and (not market?) unpacked?)
        [:span.flex.justify-center.text-xs.text-error.pt-2 (t :plugin/unpacked)])]

     [:div.r
      [:h3.head.text-xl.font-bold.pt-1.5
       {:title name}
       [:span.l.link-block.cursor-pointer
        {:on-click (get-open-plugin-readme-handler url item repo)}
        name]
       (when (not market?) [:sup.inline-block.px-1.text-xs.opacity-50 version])]

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
                              (notification/show! (t :notification/copied) :success)
                              (util/copy-to-clipboard! id))}
         (str "ID: " id)]]]

    ;; GitHub repo
      [:div.flag.is-top.flex.items-center.space-x-2
       (cond
         (false? (:supportsDB item))
         [:a.flex.cursor-help {:title (t :plugin/does-not-support-db)}
          (shui/tabler-icon "database-off" {:size 17})]
         (true? (:supportsDB item))
         [:a.flex.cursor-help {:title (t :plugin/supports-db)}
          (shui/tabler-icon "database-heart" {:size 17})])
       (when repo
         [:a.flex {:target "_blank"
                   :href   (plugin-handler/gh-repo-url repo)}
          (svg/github {:width 16 :height 16})])]

      (if market?
     ;; market ctls
        (card-ctls-of-market item stat installed? installing-or-updating?)

     ;; installed ctls
        (card-ctls-of-installed
         id name url sponsors unpacked? disabled?
         installing-or-updating? has-other-pending? new-version item))]]))

(hsx/defc panel-tab-search
  [search-key *search-key *search-ref]
  [:div.search-ctls
   [:small.absolute.s1
    (ui/icon "search")]
   (when-not (string/blank? search-key)
     [:small.absolute.s2
      {:on-click #(when-let [^js target (hooks/deref *search-ref)]
                    (reset! *search-key nil)
                    (.focus target))}
      (ui/icon "x")])
   (shui/input
    {:placeholder (t :plugin/search-plugin)
     :ref *search-ref
     :auto-focus true
     :on-key-down (fn [^js e]
                    (when (= 27 (.-keyCode e))
                      (when-not (string/blank? search-key)
                        (util/stop e)
                        (reset! *search-key nil))))
     :on-change #(let [^js target (.-target %)]
                   (reset! *search-key (some-> (.-value target) (string/triml))))
     :value (or search-key "")})])

(hsx/defc panel-tab-developer
  []
  (ui/button
   (t :plugin/contribute)
   :href "https://github.com/logseq/marketplace"
   :class "contribute"
   :intent "link"
   :target "_blank"))

(hsx/defc ^:large-vars/cleanup-todo user-proxy-settings-container
  [{:keys [protocol type] :as agent-opts}]
  (let [selected-type    (or (not-empty (:type agent-opts)) (not-empty protocol) (not-empty type) "system")
        [opts set-opts!] (hooks/use-state agent-opts)
        [testing? set-testing?!] (hooks/use-state false)
        current-type     (or (:type opts) selected-type)
        disabled?        (or (= current-type "system") (= current-type "direct"))
        needs-host-port? (or (= current-type "http") (= current-type "socks5"))
        host-port-valid? (and (not (string/blank? (:host opts)))
                              (not (string/blank? (:port opts))))
        normalize-opts   (fn [{test-url :test :keys [host port type]}]
                           (let [type (or type selected-type)
                                 test-url (util/trim-safe test-url)]
                             (cond-> {:type type
                                      :test test-url}
                               (contains? #{"http" "socks5"} type)
                               (assoc :protocol type
                                      :host (util/trim-safe host)
                                      :port (util/normalize-port-input port)))))
        validate!        (fn []
                           (when (and needs-host-port? (not host-port-valid?))
                             (notification/show! (t :plugin.proxy/host-port-required) :error)
                             true))]
    [:div.cp__settings-network-proxy-cnt
     [:h1.mb-2.text-2xl.font-bold (t :settings.advanced/network-proxy)]
     [:div.flex.flex-col.gap-4.p-2
      [:div.flex.items-center.gap-3
       [:span.shrink-0.font-medium.text-sm (t :ui/type)]
       (shui/select
        {:value current-type
         :on-value-change (fn [v] (set-opts! (assoc opts :type v :protocol v)))}
        (shui/select-trigger {:class "h-8 flex-1"} (shui/select-value {}))
        (shui/select-content
         (shui/select-group
          (shui/select-item {:value "system"} (t :plugin.proxy/system))
          (shui/select-item {:value "direct"} (t :plugin.proxy/direct))
          (shui/select-item {:value "http"} "HTTP")
          (shui/select-item {:value "socks5"} "SOCKS5"))))]

      [:div.flex.items-end.gap-3
       [:div.flex.flex-col.gap-1.flex-1.min-w-0
        [:strong.text-sm.font-medium {:class (when disabled? "opacity-50")} (t :ui/host)]
        [:input.form-input.is-small
         {:style     {:marginTop 0}
          :value     (or (:host opts) "")
          :disabled  disabled?
          :on-change #(set-opts! (assoc opts :host (util/trim-safe (util/evalue %))))}]]
       [:div.flex.flex-col.gap-1.flex-none {:class "w-28"}
        [:strong.text-sm.font-medium {:class (when disabled? "opacity-50")} (t :ui/port)]
        [:input.form-input.is-small
         {:class     "text-right"
          :style     {:marginTop 0}
          :value     (or (:port opts) "")
          :type      "text"
          :inputMode "numeric"
          :pattern   "[0-9]*"
          :disabled  disabled?
          :on-change #(set-opts! (assoc opts :port (util/sanitize-port-input (util/evalue %))))
          :on-blur   #(set-opts! (assoc opts :port (util/normalize-port-input (util/evalue %))))}]]]

      [:hr.my-2]
      [:div.flex.items-center.gap-3
       [:div.flex-1
        [:input.form-input.is-small.w-full
         {:list        "proxy-test-url-datalist"
          :type        "url"
          :placeholder "https://"
          :on-change   #(set-opts! (assoc opts :test (util/trim-safe (util/evalue %))))
          :value       (or (:test opts) "")}]
        [:datalist#proxy-test-url-datalist
         [:option "https://api.logseq.com/logseq/version"]
         [:option "https://logseq-connectivity-testing-prod.s3.us-east-1.amazonaws.com/logseq-connectivity-testing"]
         [:option "https://www.google.com"]
         [:option "https://s3.amazonaws.com"]
         [:option "https://clients3.google.com/generate_204"]]]

       (ui/button (if testing? (ui/loading (t :plugin.proxy/testing)) (t :plugin.proxy/test-url))
                  :intent "logseq"
                  :on-click #(let [normalized-opts (normalize-opts opts)
                                   val (util/trim-safe (:test normalized-opts))]
                               (when (and (not testing?) (not (string/blank? val)))
                                 (when-not (validate!)
                                   (set-testing?! true)
                                   (-> (p/let [result (ipc/ipc :testProxyUrl val normalized-opts)]
                                         (js->clj result :keywordize-keys true))
                                       (p/then (fn [{:keys [code response-ms]}]
                                                 (notification/clear! :proxy-net-check)
                                                 (notification/show! (t :plugin/proxy-check-success code response-ms) :success)))
                                       (p/catch (fn [e]
                                                  (notification/show! (str e) :error false :proxy-net-check)))
                                       (p/finally (fn [] (set-testing?! false))))))))]

      [:div.pt-2
       (ui/button (t :ui/save)
                  :on-click (fn []
                              (let [normalized-opts (normalize-opts opts)]
                                (when-not (validate!)
                                  (state/set-state! [:electron/user-cfgs :settings/agent] normalized-opts)
                                  (shui/dialog-close!)
                                  (-> (ipc/ipc :setProxy normalized-opts)
                                      (p/catch (fn [e]
                                                 (state/set-state! [:electron/user-cfgs :settings/agent] agent-opts)
                                                 (notification/show! (str e) :error))))))))]]]))
(hsx/defc load-from-web-url-container
  []
  (let [[url set-url!] (hooks/use-state "http://127.0.0.1:8080/")
        [pending? set-pending?] (hooks/use-state false)
        handle-submit! (fn []
                         (set-pending? true)
                         (-> (plugin-handler/load-plugin-from-web-url! url)
                             (p/then #(do (notification/show! (t :plugin/new-registered) :success)
                                          (shui/dialog-close!)))
                             (p/catch #(notification/show! (str %) :error))
                             (p/finally
                               #(set-pending? false))))]

    [:div.px-4.pt-4.pb-2.rounded-md.flex.flex-col.gap-2
     [:div.flex.flex-col.gap-3
      (shui/input {:placeholder "http://"
                   :value url
                   :on-change #(set-url! (-> (util/evalue %) (util/trim-safe)))
                   :auto-focus true})
      [:span.text-gray-10
       (shui/tabler-icon "info-circle" {:size 13})
       [:span (t :plugin.install-from-web-url/supports-note
                 "https://github.com/xyhp915/logseq-journals-calendar"
                 "http://localhost:8080/<plugin-dir-root>")]]]
     [:div.flex.justify-end
      (shui/button {:disabled (or pending? (string/blank? url))
                    :on-click handle-submit!}
                   (if pending? (ui/loading) (t :plugin/install)))]]))

(hsx/defc install-from-github-release-container
  []
  (let [[url set-url!] (hooks/use-state "")
        [opts set-opts!] (hooks/use-state {:theme? false :effect? false})
        [pending set-pending!] (hooks/use-state false)
        *input (hooks/use-ref nil)]
    [:div.p-4.flex.flex-col.pb-0
     (shui/input {:placeholder (t :plugin.install-from-web-url/repo-url-placeholder)
                  :value url
                  :ref *input
                  :on-change #(set-url! (util/evalue %))
                  :auto-focus true})
     [:div.flex.gap-6.pt-3.items-center.select-none
      [:label.flex.items-center.gap-2
       (shui/checkbox {:checked (:theme? opts)
                       :on-checked-change #(set-opts! (assoc opts :theme? %))})
       [:span.opacity-60 (t :plugin.install-from-web-url/theme-label)]]
      [:label.flex.items-center.gap-2
       (shui/checkbox {:checked (:effect? opts)
                       :on-checked-change #(set-opts! (assoc opts :effect? %))})
       [:span.opacity-60 (t :plugin.install-from-web-url/effect-label)]]]
     [:div.flex.justify-end.pt-3
      (shui/button
       {:on-click (fn []
                    (if (or (string/blank? (util/trim-safe url))
                            (not (string/starts-with? url "https://")))
                      (.focus (hooks/deref *input))
                      (let [url (string/replace-first url "https://github.com/" "")
                            matched (re-find #"([^\/]+)/([^\/]+)" url)]
                        (if-let [id (some-> matched (nth 2))]
                          (do
                            (set-pending! true)
                            (-> #js {:id id :repo (first matched)
                                     :theme (:theme? opts)
                                     :effect (:effect? opts)}
                                (js/window.logseq.api.__install_plugin)
                                (p/then #(shui/dialog-close!))
                                (p/catch #(notification/show! (str %) :error))
                                (p/finally #(set-pending! false))))
                          (notification/show! (t :plugin/invalid-github-repo-url) :error)))))
        :disabled pending}
        (if pending (ui/loading (t :plugin/installing)) (t :plugin/install)))]]))

(hsx/defc auto-check-for-updates-control
  []
  (let [[enabled, set-enabled!] (hooks/use-state (plugin-handler/get-enabled-auto-check-for-updates?))
        text (t :plugin/auto-update-check)]

    [:div.flex.items-center.justify-between.px-3.py-2
     {:on-click (fn []
                  (let [next-enabled (not enabled)]
                    (set-enabled! next-enabled)
                    (plugin-handler/set-enabled-auto-check-for-updates next-enabled)
                    (notification/show!
                     (into [:span]
                           (interpolate-rich-text
                            (t :plugin/auto-update-check-feedback)
                            [[:strong.pl-1 (t (if next-enabled :ui/on :ui/off))]]))
                     (if next-enabled :success :info))))}
     [:span.pr-3.opacity-80 text]
     (ui/toggle enabled #() true)]))

(defn- disabled-plugin-sort-key
  [{:keys [id name title settings]}]
  (let [disabled-since (:disabled-since settings)
        plugin-name (or title name id)]
    [(if (number? disabled-since) 1 0)
     (or disabled-since 0)
     (util/safe-lower-case plugin-name)
     id]))

(defn- plugin-in-category?
  [category plugin]
  (case category
    :all true
    :plugins (not (:theme plugin))
    :themes (:theme plugin)))

(defn- get-disabled-plugins-for-removal
  [category]
  (->> (vals (state/get-state [:plugin/installed-plugins]))
       (filter #(and (plugin-in-category? category %)
                     (get-in % [:settings :disabled])))
       (sort-by disabled-plugin-sort-key)))

(defn- unregister-plugins-sequentially!
  [plugin-ids]
  (reduce
   (fn [chain id]
     (p/then chain
             (fn []
               (p/let [_ (plugin-common-handler/unregister-plugin id)]
                 (when (util/electron?)
                   (plugin-config-handler/remove-plugin id))))))
   (.resolve js/Promise nil)
   plugin-ids))

(hsx/defc bulk-remove-disabled-plugins-container
  [category]
  (let [plugins (get-disabled-plugins-for-removal category)
        plugin-ids (mapv :id plugins)
        [selected-ids set-selected-ids!] (hooks/use-state (set (take 20 plugin-ids)))
        [pending? set-pending!] (hooks/use-state false)
        selected-plugin-ids (->> plugins
                                 (map :id)
                                 (filter selected-ids)
                                 vec)
        all-selected? (and (seq plugin-ids)
                           (= (count selected-plugin-ids) (count plugin-ids)))
        toggle-selected! (fn [id checked?]
                           (set-selected-ids!
                            ((if checked? conj disj) selected-ids id)))
        remove-selected! (fn []
                           (when (and (seq selected-plugin-ids)
                                      (not pending?))
                             (-> (shui/dialog-confirm!
                                  [:b (t :plugin/bulk-remove-disabled-delete-alert (count selected-plugin-ids))]
                                  {:cancel-label (t :ui/cancel)
                                   :ok-label (t :ui/delete)})
                                 (p/then (fn []
                                           (set-pending! true)
                                           (-> (unregister-plugins-sequentially! selected-plugin-ids)
                                               (p/then (fn []
                                                         (notification/show!
                                                          (t :plugin/bulk-remove-disabled-success (count selected-plugin-ids))
                                                          :success)
                                                         (shui/dialog-close!)))
                                               (p/catch (fn [e]
                                                          (notification/show! (str e) :error)))
                                               (p/finally #(set-pending! false))))))))]
    [:div.p-4.flex.flex-col.gap-3
     [:h1.text-xl.font-bold (t :plugin/bulk-remove-disabled-title)]
     (if (seq plugins)
      [:<>
        [:p.opacity-70.text-sm (t :plugin/bulk-remove-disabled-desc)]
        [:ul.max-h-96.overflow-y-auto.flex.flex-col.gap-2.ml-0
         (for [{:keys [id name title version icon]} plugins
               :let [selected? (contains? selected-ids id)]]
           [:li.flex.items-center.gap-3.rounded-md.border.p-2.select-none
            {:key id
             :class (str "cursor-pointer "
                         (if selected?
                           "border-primary bg-base-3"
                           "border-transparent bg-base-2 hover:bg-base-3"))
             :on-click #(when-not pending?
                          (toggle-selected! id (not selected?)))}
            (shui/checkbox
             {:checked selected?
              :disabled pending?
              :on-click #(.stopPropagation %)
              :on-checked-change #(toggle-selected! id (true? %))})
            [:span.flex.h-10.w-10.shrink-0.items-center.justify-center.overflow-hidden.rounded.bg-base-3
             (if (and icon (not (string/blank? icon)))
               [:img {:src icon
                      :class "h-full w-full object-contain"}]
               [:span.flex.h-6.w-6.items-center.justify-center.overflow-hidden
                svg/folder])]
            [:div.flex-1.overflow-hidden
             [:div.font-medium.truncate (or title name id)]
             [:div.text-xs.opacity-60.truncate (str "ID: " id)]]
            (when version
              [:small.opacity-50.shrink-0 version])])]
        [:div.flex.items-center.justify-between.gap-2
         [:div.flex.gap-2
          (shui/button {:variant :ghost
                        :disabled (or pending? all-selected?)
                        :on-click #(set-selected-ids! (set plugin-ids))}
                       (t :plugin/bulk-remove-disabled-select-all))
          (shui/button {:variant :ghost
                        :disabled (or pending? (empty? selected-plugin-ids))
                        :on-click #(set-selected-ids! #{})}
                       (t :plugin/bulk-remove-disabled-clear-selection))]
         [:div.flex.gap-2
          (shui/button {:variant :ghost
                        :disabled pending?
                        :on-click #(shui/dialog-close!)}
                       (t :ui/cancel))
          (shui/button {:disabled (or pending? (empty? selected-plugin-ids))
                        :on-click remove-selected!}
                       (if pending?
                         (ui/loading (t :plugin/uninstall))
                         (t :plugin/bulk-remove-disabled-confirm (count selected-plugin-ids))))]]]
       [:div.flex.items-center.justify-center.py-8.opacity-50
        (t :plugin/bulk-remove-disabled-empty)])]))

(defn- disabled-plugins-cleanup-snoozed?
  []
  (let [snoozed-at (storage/get DISABLED-PLUGINS-CLEANUP-SNOOZED-AT-KEY)]
    (and (number? snoozed-at)
         (< (- (js/Date.now) snoozed-at) DISABLED-PLUGINS-CLEANUP-SNOOZE-MS))))

(defn- open-bulk-remove-disabled-plugins-dialog!
  [category]
  (notification/clear! DISABLED-PLUGINS-CLEANUP-NOTIFICATION-ID)
  (shui/dialog-open!
   (fn []
     (bulk-remove-disabled-plugins-container category))))

(defn- snooze-disabled-plugins-cleanup-warning!
  []
  (storage/set DISABLED-PLUGINS-CLEANUP-SNOOZED-AT-KEY (js/Date.now))
  (notification/clear! DISABLED-PLUGINS-CLEANUP-NOTIFICATION-ID))

(defn- show-disabled-plugins-cleanup-warning!
  []
  (let [disabled-count (count (get-disabled-plugins-for-removal :all))]
    (when (and (>= disabled-count DISABLED-PLUGINS-CLEANUP-THRESHOLD)
               (not (disabled-plugins-cleanup-snoozed?)))
      (notification/show!
       [:div.flex.flex-col.gap-2
        [:div (t :plugin/disabled-cleanup-warning-title disabled-count)]
        [:div.opacity-70 (t :plugin/disabled-cleanup-warning-desc)]
        [:div.flex.gap-2.pt-1
         (ui/button (t :plugin/disabled-cleanup-warning-clean-now)
                    :small? true
                    :on-click #(open-bulk-remove-disabled-plugins-dialog! :all))
         (ui/button (t :plugin/disabled-cleanup-warning-later)
                    :small? true
                    :variant :ghost
                    :on-click snooze-disabled-plugins-cleanup-warning!)]]
       :warning
       false
       DISABLED-PLUGINS-CLEANUP-NOTIFICATION-ID))))

(hsx/defc ^:large-vars/cleanup-todo panel-control-tabs
  [search-key *search-key category *category
   sort-by *sort-by filter-by *filter-by total-nums
   selected-unpacked-pkg market? develop-mode?
   reload-market-fn agent-opts]

  (let [*search-ref (hooks/create-ref)]
    [:div.pb-3.flex.justify-between.control-tabs.relative
     [:div.flex.items-center.l
      (category-tabs t total-nums category #(reset! *category %))

      (when (and develop-mode? (util/electron?) (not market?))
        [:div
         (ui/tooltip
          (ui/button
           (t :plugin/load-unpacked)
           {:icon "upload"
            :intent "link"
            :class "load-unpacked"
            :on-click plugin-handler/load-unpacked-plugin})
          [:div (t :plugin/unpacked-tips)])

         (when (util/electron?)
           (unpacked-plugin-loader selected-unpacked-pkg))])]

     [:div.flex.items-center.r
      ;; extra info
      (when-let [proxy-val (state/http-proxy-enabled-or-val?)]
        (ui/button
         [:span.flex.items-center.text-indigo-500
          (ui/icon "world-download") proxy-val]
         :small? true
         :intent "link"
         :on-click #(state/pub-event! [:go/proxy-settings agent-opts])))

      ;; search
      (panel-tab-search search-key *search-key *search-ref)

      ;; sorter & filter
      (let [aim-icon #(if (= filter-by %) "check" "circle")
            items (if market?
                    [{:title   (t :plugin/all)
                      :options {:on-click #(reset! *filter-by :default)}
                      :icon    (ui/icon (aim-icon :default))}

                     {:title   (t :plugin/installed)
                      :options {:on-click #(reset! *filter-by :installed)}
                      :icon    (ui/icon (aim-icon :installed))}

                     {:title   (t :plugin/not-installed)
                      :options {:on-click #(reset! *filter-by :not-installed)}
                      :icon    (ui/icon (aim-icon :not-installed))}]

                    [{:title   (t :plugin/all)
                      :options {:on-click #(reset! *filter-by :default)}
                      :icon    (ui/icon (aim-icon :default))}

                     {:title   (t :plugin/enabled)
                      :options {:on-click #(reset! *filter-by :enabled)}
                      :icon    (ui/icon (aim-icon :enabled))}

                     {:title   (t :plugin/disabled)
                      :options {:on-click #(reset! *filter-by :disabled)}
                      :icon    (ui/icon (aim-icon :disabled))}

                     {:title   (t :plugin/unpacked)
                      :options {:on-click #(reset! *filter-by :unpacked)}
                      :icon    (ui/icon (aim-icon :unpacked))}

                     {:title   (t :plugin/update-available)
                      :options {:on-click #(reset! *filter-by :update-available)}
                      :icon    (ui/icon (aim-icon :update-available))}])]
        (ui/button
         (ui/icon "filter")
         :class (str (when-not (contains? #{:default} filter-by) "picked ") "sort-or-filter-by")
         :on-click #(shui/popup-show! (.-target %)
                                      (fn [{:keys [id]}]
                                        (render-classic-dropdown-items id items))
                                      {:as-dropdown? true})
         :variant :ghost))

      (when market?
        (let [aim-icon #(if (= sort-by %) "check" "circle")
              items [{:title (t :plugin/popular)
                      :options {:on-click #(reset! *sort-by :default)}
                      :icon (ui/icon (aim-icon :default))}

                     {:title (t :plugin/downloads)
                      :options {:on-click #(reset! *sort-by :downloads)}
                      :icon (ui/icon (aim-icon :downloads))}

                     {:title (t :plugin/stars)
                      :options {:on-click #(reset! *sort-by :stars)}
                      :icon (ui/icon (aim-icon :stars))}

                     {:title (t :plugin/title "A - Z")
                      :options {:on-click #(reset! *sort-by :letters)}
                      :icon (ui/icon (aim-icon :letters))}

                     {:title   (t :plugin/supports-db)
                      :options {:on-click #(reset! *sort-by :supportsDB)}
                      :icon    (ui/icon (aim-icon :supportsDB))}

                     {:title   (t :plugin/date-added)
                      :options {:on-click #(reset! *sort-by :addedAt)}
                      :icon    (ui/icon (aim-icon :addedAt))}]]

          (ui/button
           (ui/icon "arrows-sort")
           :class (str (when-not (contains? #{:default :popular} sort-by) "picked ") "sort-or-filter-by")
           :on-click #(shui/popup-show! (.-target %)
                                        (fn [{:keys [id]}]
                                          (render-classic-dropdown-items id items))
                                        {:as-dropdown? true})
           :variant :ghost)))

      ;; more - updater
      (let [items (concat (if market?
                            [{:title [:span.flex.items-center.gap-1 (ui/icon "rotate-clockwise") (t :plugin/refresh-lists)]
                              :options {:on-click #(reload-market-fn)}}]
                             (concat
                              [{:title [:span.flex.items-center.gap-1 (ui/icon "rotate-clockwise") (t :plugin/check-all-updates)]
                                :options {:on-click #(plugin-handler/user-check-enabled-for-updates! (not= :plugins category))}}]
                              (when (contains? #{:plugins :themes} category)
                                [{:title [:span.flex.items-center.gap-1 (ui/icon "trash") (t :plugin/bulk-remove-disabled)]
                                  :options {:on-click #(open-bulk-remove-disabled-plugins-dialog! category)}}])))

                          (when (util/electron?)
                            [{:title   [:span.flex.items-center.gap-1 (ui/icon "world") (t :settings.advanced/network-proxy)]
                              :options {:on-click #(state/pub-event! [:go/proxy-settings agent-opts])}}

                             {:title   [:span.flex.items-center.gap-1 (ui/icon "arrow-down-circle") (t :plugin.install-from-file/menu-title)]
                              :options {:on-click plugin-config-handler/open-replace-plugins-modal}}])

                          [{:hr true}]

                          (when (state/developer-mode?)
                            (if (util/electron?)
                              [{:title [:span.flex.items-center.gap-1 (ui/icon "file-code") (t :plugin/open-preferences)]
                                :options {:on-click
                                          #(p/let [root (plugin-handler/get-ls-dotdir-root)]
                                             (js/apis.openPath (str root "/preferences.json")))}}
                               {:title [:span.flex.items-center.whitespace-nowrap.gap-1
                                        (ui/icon "bug") (t :plugin/open-logseq-dir) [:code "~/.logseq"]]
                                :options {:on-click
                                          #(p/let [root (plugin-handler/get-ls-dotdir-root)]
                                             (js/apis.openPath root))}}]
                              [{:title [:span.flex.items-center.whitespace-nowrap.gap-1
                                        (ui/icon "plug") (t :plugin/load-from-web-url)]
                                :options {:on-click
                                          #(shui/dialog-open! load-from-web-url-container)}}]))

                          [{:title [:span.flex.items-center.gap-1 (ui/icon "alert-triangle") (t :plugin/report-security)]
                            :options {:on-click #(plugin-handler/open-report-modal!)}}]

                          [{:hr true :key "dropdown-more"}
                           {:title (auto-check-for-updates-control)}])]

        (ui/button
         (ui/icon "dots-vertical")
         :class "more-do"
         :on-click #(shui/popup-show! (.-target %)
                                      (fn [{:keys [id]}]
                                        (render-classic-dropdown-items id items))
                                      {:as-dropdown? true
                                       :align "center"
                                       :content-props {:side-offset 10}})
         :variant :ghost))

      ;; developer
      (panel-tab-developer)]]))

(defn- use-plugin-items-list-scroll!
  [root-ref]
  (hooks/use-effect!
   (fn []
     (when-let [^js el (hooks/deref root-ref)]
       (when-let [^js el-list (.querySelector el ".cp__plugins-item-lists")]
         (when-let [^js cls (.-classList (.querySelector el ".control-tabs"))]
           (let [on-scroll #(if (> (.-scrollTop el-list) 1)
                              (.add cls "scrolled")
                              (.remove cls "scrolled"))]
             (.addEventListener el-list "scroll" on-scroll)
             #(.removeEventListener el-list "scroll" on-scroll))))))
   []))

(hsx/defc lazy-items-loader
  [load-more!]
  (let [^js inViewState (ui/useInView #js {:threshold 0})
        in-view?        (.-inView inViewState)]

    (hooks/use-effect!
     (fn []
       (load-more!))
     [in-view?])

    [:div {:ref (.-ref inViewState)}
     [:p.py-1.text-center.opacity-0 (when (.-inView inViewState) "·")]]))

(defn weighted-sort-by
  [key pkgs]
  (let [default? (or (nil? key) (= key :default))
        grouped-pkgs (if default?
                       (some->> pkgs
                                (group-by (fn [{:keys [addedAt]}]
                                            (and (number? addedAt)
                                                 (< (- (js/Date.now) addedAt)
                                         ;; under 6 days
                                                    (* 1000 60 60 24 6)))))
                                (into {}))
                       {false pkgs})
        pinned-pkgs (get grouped-pkgs true)
        pkgs (get grouped-pkgs false)
        ;; calculate weight
        [key pkgs] (if default?
                     (let [decay-factor 0.001
                           download-weight 0.8
                           star-weight 0.2]
                       (letfn [(normalize [vals val]
                                 (let [min-val (apply min vals)
                                       max-val (apply max vals)]
                                   (if (= max-val min-val) 0
                                       (/ (- val min-val) (- max-val min-val)))))
                               (time-diff-in-days [ts]
                                 (when-let [time-diff (and (number? ts) (- (js/Date.now) ts))]
                                   (/ time-diff (* 1000 60 60 24))))]
                         [:weight
                          (let [all-downloads (->> (map :downloads pkgs) (remove #(not (number? %))))
                                all-stars (->> (map :stars pkgs) (remove #(not (number? %))))]
                            (->> pkgs
                                 (map (fn [{:keys [downloads stars latestAt] :as pkg}]
                                        (let [downloads (if (number? downloads) downloads 1)
                                              stars (if (number? stars) stars 1)
                                              days-since-latest (time-diff-in-days latestAt)
                                              decay (js/Math.exp (* -1 decay-factor days-since-latest))
                                              normalized-downloads (normalize all-downloads downloads)
                                              normalize-stars (normalize all-stars stars)
                                              download-score (* normalized-downloads download-weight)
                                              star-score (* normalize-stars star-weight)]
                                          (assoc pkg :weight (+ download-score star-score decay)))))))]))
                     [key pkgs])]
    (->> (apply sort-by
                (conj
                 (case key
                   :letters [#(util/safe-lower-case (or (:title %) (:name %)))]
                   [key #(compare %2 %1)])
                 pkgs))
         (concat pinned-pkgs))))

(hsx/defc ^:large-vars/data-var marketplace-plugins
  []
  (let [*root-ref          (hooks/use-ref nil)
        *list-node-ref     (hooks/use-ref nil)
        pkgs               (rfx/use-sub [:plugin/marketplace-pkgs])
        stats              (rfx/use-sub [:plugin/marketplace-stats])
        installed-plugins  (rfx/use-sub [:plugin/installed-plugins])
        installing         (rfx/use-sub [:plugin/installing])
        online?            (rfx/use-sub [:network/online?])
        develop-mode?      (rfx/use-sub [:ui/developer-mode?])
        agent-opts         (rfx/use-sub [:electron/user-cfgs :settings/agent])
        *search-key        (hooks/use-memo #(atom "") [])
        *category          (hooks/use-memo #(atom :plugins) [])
        *sort-by           (hooks/use-memo #(atom :default) []) ;; default (weighted) / downloads / stars / letters / updates / date-added
        *filter-by         (hooks/use-memo #(atom :default) [])
        *cached-query-flag (hooks/use-memo #(atom nil) [])
        *current-page      (hooks/use-memo #(atom 1) [])
        *fetching          (hooks/use-memo #(atom false) [])
        *error             (hooks/use-memo #(atom nil) [])
        [search-key]       (hooks/use-atom *search-key)
        [category]         (hooks/use-atom *category)
        [sort-by]          (hooks/use-atom *sort-by)
        [filter-by]        (hooks/use-atom *filter-by)
        [cached-query-flag] (hooks/use-atom *cached-query-flag)
        [current-page]     (hooks/use-atom *current-page)
        [fetching]         (hooks/use-atom *fetching)
        [error]            (hooks/use-atom *error)
        reload-fn          (hooks/use-callback
                            (fn [force-refresh?]
                              (when-not @*fetching
                                (reset! *fetching true)
                                (reset! *error nil)
                                (-> (plugin-handler/load-marketplace-plugins force-refresh?)
                                    (p/then #(plugin-handler/load-marketplace-stats false))
                                    (p/catch #(do (js/console.error %) (reset! *error %)))
                                    (p/finally #(reset! *fetching false)))))
                            [])
        _                  (use-plugin-items-list-scroll! *root-ref)
        _                  (hooks/use-effect! #(reload-fn false) [])
        theme-plugins      (filter #(:theme %) pkgs)
        normal-plugins     (filter #(not (:theme %)) pkgs)
        filtered-pkgs      (when (seq pkgs)
                             (if (= category :themes) theme-plugins normal-plugins))
        total-nums         [(count normal-plugins) (count theme-plugins)]
        filtered-pkgs      (if (and (seq filtered-pkgs) (not= :default filter-by))
                             (filter #(apply
                                       (if (= :installed filter-by) identity not)
                                       [(contains? installed-plugins (keyword (:id %)))])
                                     filtered-pkgs)
                             filtered-pkgs)
        filtered-pkgs      (if-not (string/blank? search-key)
                             (if-let [author (and (string/starts-with? search-key "@")
                                                  (subs search-key 1))]
                               (filter #(= author (:author %)) filtered-pkgs)
                               (let [low-case-search (string/lower-case search-key)
                                     min-description-search-length 3
                                     max-description-matches 30
                                     fuzzy-title-matches (search/fuzzy-search
                                                    filtered-pkgs search-key
                                                    :limit 30
                                                    :extract-fn :title)
                                     precise-description-matches (if (>= (count low-case-search) min-description-search-length)
                                                                   (->> filtered-pkgs
                                                                        (filter #(some-> (:description %)
                                                                                         string/lower-case
                                                                                         (string/includes? low-case-search)))
                                                                        (take max-description-matches))
                                                                   [])]
                                 (-> (concat fuzzy-title-matches precise-description-matches)
                                     (distinct))))
                             filtered-pkgs)
        filtered-pkgs      (map #(if-let [stat (get stats (keyword (:id %)))]
                                   (let [downloads (:total_downloads stat)
                                         stars     (:stargazers_count stat)
                                         latest-at (some-> (:updated_at stat) (js/Date.) (.getTime))]
                                     (assoc %
                                            :stat stat
                                            :stars stars
                                            :latestAt latest-at
                                            :downloads downloads))
                                   %) filtered-pkgs)
        sorted-plugins     (weighted-sort-by sort-by filtered-pkgs)

        fn-query-flag      (fn [] (string/join "_" [filter-by sort-by search-key category]))
        str-query-flag     (fn-query-flag)
        _                  (when (not= str-query-flag cached-query-flag)
                             (when-let [^js list-cnt (hooks/deref *list-node-ref)]
                               (set! (.-scrollTop list-cnt) 0))
                             (reset! *current-page 1))
        _                  (reset! *cached-query-flag str-query-flag)

        page-total-items   (count sorted-plugins)
        sorted-plugins     (if-not (> page-total-items PER-PAGE-SIZE)
                             sorted-plugins (take (* current-page PER-PAGE-SIZE) sorted-plugins))
        load-more-pages!   #(when (> page-total-items PER-PAGE-SIZE)
                              (when (< (* PER-PAGE-SIZE @*current-page) page-total-items)
                                (reset! *current-page (inc @*current-page))))]

    [:div.cp__plugins-marketplace
     {:ref *root-ref}

     (panel-control-tabs
      search-key *search-key
      category *category
      sort-by *sort-by filter-by *filter-by
      total-nums nil true develop-mode? reload-fn
      agent-opts)

     (cond
       (not online?)
       [:p.flex.justify-center.pt-20.opacity-50 (svg/offline 30)]

       fetching
       [:p.flex.justify-center.py-20 svg/loading]

       error
       [:p.flex.justify-center.pt-20.opacity-50 (t :plugin/remote-error (.-message error))]

       :else
       [:div.cp__plugins-marketplace-cnt
        {:class (util/classnames [{:has-installing (boolean installing)}])}
        [:div.cp__plugins-item-lists
         {:ref *list-node-ref}
         [:div.cp__plugins-item-lists-inner
          ;; items list
          (for [item sorted-plugins]
            (let [pid  (keyword (:id item))
                  stat (:stat item)]
              ^{:key (:id item)}
              [plugin-item-card t item
               (get-in item [:settings :disabled]) true *search-key installing
               (and installing (= (keyword (:id installing)) pid))
               (contains? installed-plugins pid) stat nil]))]

         ;; items loader
         (when (seq sorted-plugins)
           (lazy-items-loader load-more-pages!))]])]))

(hsx/defc ^:large-vars/data-var installed-plugins
  []
  (let [*root-ref             (hooks/use-ref nil)
        *list-node-ref        (hooks/use-ref nil)
        installed-plugins'    (vals (rfx/use-sub [:plugin/installed-plugins]))
        updating              (rfx/use-sub [:plugin/installing])
        develop-mode?         (rfx/use-sub [:ui/developer-mode?])
        selected-unpacked-pkg (rfx/use-sub [:plugin/selected-unpacked-pkg])
        coming-updates        (rfx/use-sub [:plugin/updates-coming])
        agent-opts            (rfx/use-sub [:electron/user-cfgs :settings/agent])
        *filter-by            (hooks/use-memo #(atom :default) [])
        *sort-by              (hooks/use-memo #(atom :default) [])
        *search-key           (hooks/use-memo #(atom "") [])
        *category             (hooks/use-memo #(atom :plugins) [])
        *cached-query-flag    (hooks/use-memo #(atom nil) [])
        *current-page         (hooks/use-memo #(atom 1) [])
        [filter-by]           (hooks/use-atom *filter-by)
        [sort-by]             (hooks/use-atom *sort-by)
        [search-key]          (hooks/use-atom *search-key)
        [category]            (hooks/use-atom *category)
        [cached-query-flag]   (hooks/use-atom *cached-query-flag)
        [current-page]        (hooks/use-atom *current-page)
        _                     (use-plugin-items-list-scroll! *root-ref)
        default-filter-by?    (= :default filter-by)
        theme-plugins         (filter #(:theme %) installed-plugins')
        normal-plugins        (filter #(not (:theme %)) installed-plugins')
        filtered-plugins      (when (seq installed-plugins')
                                (if (= category :themes) theme-plugins normal-plugins))
        total-nums            [(count normal-plugins) (count theme-plugins)]
        filtered-plugins      (if-not default-filter-by?
                                (filter (fn [it]
                                          (let [disabled (get-in it [:settings :disabled])]
                                            (case filter-by
                                              :enabled (not disabled)
                                              :disabled disabled
                                              :unpacked (not (:iir it))
                                              :update-available (state/plugin-update-available? (:id it))
                                              true))) filtered-plugins)
                                filtered-plugins)
        filtered-plugins      (if-not (string/blank? search-key)
                                (if-let [author (and (string/starts-with? search-key "@")
                                                     (subs search-key 1))]
                                  (filter #(= author (:author %)) filtered-plugins)
                                  (search/fuzzy-search
                                   filtered-plugins search-key
                                   :limit 30
                                   :extract-fn :name))
                                filtered-plugins)
        sorted-plugins        (if default-filter-by?
                                (->> filtered-plugins
                                     (reduce #(let [disabled? (get-in %2 [:settings :disabled])
                                                    old-dirty (get @*dirties-toggle-items (keyword (:id %2)))
                                                    k         (if (if (boolean? old-dirty) (not old-dirty) disabled?) 1 0)]
                                                (update %1 k conj %2)) [[] []])
                                     (#(update % 0 (fn [coll] (sort-by :iir coll))))
                                     (flatten))
                                (do
                                  (clear-dirties-states!)
                                  filtered-plugins))

        fn-query-flag         (fn [] (string/join "_" [filter-by sort-by search-key category]))
        str-query-flag        (fn-query-flag)
        _                     (when (not= str-query-flag cached-query-flag)
                                (when-let [^js list-cnt (hooks/deref *list-node-ref)]
                                  (set! (.-scrollTop list-cnt) 0))
                                (reset! *current-page 1))
        _                     (reset! *cached-query-flag str-query-flag)

        page-total-items      (count sorted-plugins)
        sorted-plugins        (if-not (> page-total-items PER-PAGE-SIZE)
                                sorted-plugins (take (* current-page PER-PAGE-SIZE) sorted-plugins))
        load-more-pages!      #(when (> page-total-items PER-PAGE-SIZE)
                                 (when (< (* PER-PAGE-SIZE @*current-page) page-total-items)
                                   (reset! *current-page (inc @*current-page))))]

    [:div.cp__plugins-installed
     {:ref *root-ref}
     (panel-control-tabs
      search-key *search-key
      category *category
      sort-by *sort-by
      filter-by *filter-by
      total-nums selected-unpacked-pkg
      false develop-mode? nil
      agent-opts)

     [:div.cp__plugins-item-lists.pb-6
      {:ref *list-node-ref}
      [:div.cp__plugins-item-lists-inner
       (for [item sorted-plugins]
         (let [pid (keyword (:id item))]
           ^{:key (:id item)}
           [plugin-item-card t item
            (get-in item [:settings :disabled]) false *search-key updating
            (and updating (= (keyword (:id updating)) pid))
            true nil (get coming-updates pid)]))]

      (if (seq sorted-plugins)
        (lazy-items-loader load-more-pages!)
        [:div.flex.items-center.justify-center.py-28.flex-col.gap-2.opacity-30
         (shui/tabler-icon "list-search" {:size 40})
         [:span.text-sm (t :plugin/empty)]])]]))

(hsx/defc waiting-coming-updates
  []
  (hooks/use-effect! #(state/reset-unchecked-update) [])
  (let [_            (rfx/use-sub [:plugin/updates-coming])
        downloading? (rfx/use-sub [:plugin/updates-downloading?])
        unchecked    (rfx/use-sub [:plugin/updates-unchecked])
        updates      (state/all-available-coming-updates)]

    [:div.cp__plugins-waiting-updates
     [:h1.mb-4.text-2xl.p-1 (t :plugin/found-n-updates (count updates))]

     (if (seq updates)
       ;; lists
       [:ul
        {:class (when downloading? "downloading")}
        (for [it updates
              :let [k     (str "lsp-it-" (:id it))
                    c?    (not (contains? unchecked (:id it)))
                    notes (util/trim-safe (:latest-notes it))]]
          [:li.flex.items-center
           {:key   k
            :class (when c? "checked")}

           [:label.flex-1
            {:for k}
            (shui/checkbox
             {:id k
              :default-checked c?
              :on-checked-change (fn [checked?]
                                   (when-not downloading?
                                     (state/set-unchecked-update (:id it) (not checked?))))})
            [:strong.px-3 (:title it)
             [:sup (str (:version it) " 👉 " (:latest-version it))]]]

           [:div.px-4
            (when-not (string/blank? notes)
              (ui/tooltip [:span.opacity-30.hover:opacity-80 (ui/icon "info-circle")] [:p notes]))]])]

       ;; all done
       [:div.py-4 [:strong.text-4xl (str "🎉 " (t :plugin/update-all-success))]])

     ;; actions
     (when (seq updates)
       [:div.pt-5.flex.justify-end
        (ui/button
         (if downloading?
           [:span (ui/loading (t :plugin/updates-downloading))]
           [:span.flex.items-center (ui/icon "download") (t :plugin/update-all-selected)])

         :on-click
         #(when-not downloading?
            (plugin-handler/open-updates-downloading)
            (if-let [n (state/get-next-selected-coming-update)]
              (plugin-handler/check-or-update-marketplace-plugin!
               (assoc n :only-check false)
               (fn [^js e] (notification/show! (.toString e) :error)))
              (plugin-handler/close-updates-downloading)))

         :disabled
         (or downloading?
             (and (seq unchecked)
                  (= (count unchecked) (count updates)))))])]))

(hsx/defc plugins-from-file
  [plugins]
  [:div.cp__plugins-fom-file
   [:h1.mb-4.text-2xl.p-1 (t :plugin.install-from-file/title)]
   (if (seq plugins)
     [:div
      [:div.mb-2.text-xl (t :plugin.install-from-file/notice)]
      ;; lists
      [:ul
       (for [it (:install plugins)
             :let [k (str "lsp-it-" (name (:id it)))]]
         [:li.flex.items-center
          {:key k}
          [:label.flex-1
           {:for k}
           [:strong.px-3 (str (name (:id it)) " " (:version it))]]])]

      ;; actions
      [:div.pt-5
       (ui/button [:span (t :plugin/install)]
                  :on-click #(do
                               (plugin-config-handler/replace-plugins plugins)
                               (shui/dialog-close! "ls-plugins-from-file-modal")))]]
     ;; all done
     [:div.py-4 [:strong.text-xl (str "🎉 " (t :plugin.install-from-file/success))]])])

(defn open-select-theme!
  []
  (shui/dialog-open! installed-themes
                     {:align :top}))

(hsx/defc hook-ui-slot
  ([type payload] (hook-ui-slot type payload nil #(plugin-handler/hook-plugin-app type % nil)))
  ([type payload opts callback]
   (let [rs      (util/rand-str 8)
         id      (str "slot__" rs)
         *el-ref (hooks/use-ref nil)]

     (hooks/use-effect!
      (fn []
        (let [timer (js/setTimeout #(callback {:type type :slot id :payload payload}) 50)]
          #(js/clearTimeout timer)))
      [id])

     (hooks/use-effect!
      (fn []
        (let [el (hooks/deref *el-ref)]
          #(when-let [uis (seq (.querySelectorAll el "[data-injected-ui]"))]
             (doseq [^js el uis]
               (when-let [id (.-injectedUi (.-dataset el))]
                 (js/LSPluginCore._forceCleanInjectedUI id))))))
      [])

     [:div.lsp-hook-ui-slot
      (merge opts {:id            id
                   :ref           *el-ref
                   :on-pointer-down (fn [e] (util/stop-propagation e))})])))

(hsx/defc hook-block-slot
  [type block]
  (hook-ui-slot type {} nil #(plugin-handler/hook-plugin-block-slot block %)))

(hsx/defc ui-item-renderer
  [pid type {:keys [key template prefix]}]
  (let [*el    (hooks/use-ref nil)
        uni    #(str prefix "injected-ui-item-" %)
        ^js pl (js/LSPluginCore.registeredPlugins.get (name pid))]

    (hooks/use-effect!
     (fn []
       (when-let [^js el (hooks/deref *el)]
         (js/LSPlugin.pluginHelpers.setupInjectedUI.call
          pl #js {:slot (.-id el) :key key :template template} #js {})))
     [template])

    (if-not (nil? pl)
      [:div
       {:id    (uni (str (name key) "-" (name pid)))
        :title key
        :class (uni (name type))
        :ref   *el}]
      [:<>])))

(hsx/defc toolbar-plugins-manager-list
  [updates-coming items]
  (let [badge-updates? (and (not (plugin-handler/get-auto-checking?))
                            (seq (state/all-available-coming-updates updates-coming)))
        items (fn []
                (->> (concat
                      (for [[_ {:keys [key pinned?] :as opts} pid] items
                            :let [pkey (str (name pid) ":" key)]]
                        {:title key
                         :item [:div.flex.items-center.item-wrap
                                [ui-item-renderer pid :toolbar (assoc opts :prefix "pl-" :key (str "pl-" key))]
                                [:span {:style {:padding-left "2px"}} key]
                                [:span.pin.flex.items-center.opacity-60
                                 {:class (util/classnames [{:pinned pinned?}])}
                                 (ui/icon (if pinned? "pinned" "pin"))]]
                         :options {:on-click (fn [^js e]
                                               (let [^js target (.-target e)
                                                     user-btn? (boolean (.closest target "div[data-injected-ui]"))]
                                                 (when-not user-btn?
                                                   (plugin-handler/op-pinned-toolbar-item! pkey (if pinned? :remove :add)))
                                                 true))}})
                      [{:hr true}
                       {:title (t :nav/plugins)
                        :options {:on-click #(plugin-handler/goto-plugins-dashboard!)
                                  :class "extra-item mt-2"}
                        :icon (ui/icon "apps")}

                       {:title (t :nav/themes)
                        :options {:on-click #(plugin-handler/show-themes-modal!)
                                  :class "extra-item"}
                        :icon (ui/icon "palette")}

                       {:title (t :nav/settings)
                        :options {:on-click #(plugin-handler/goto-plugins-settings!)
                                  :class "extra-item"}
                        :icon (ui/icon "adjustments")}

                       (when badge-updates?
                         {:title [:div.flex.items-center.space-x-5.leading-none
                                  [:span (t :plugin/found-updates)] (ui/point "bg-red-700" 5 {:style {:margin-top 2}})]
                          :options {:on-click #(open-waiting-updates-modal!)
                                    :class "extra-item"}
                          :icon (ui/icon "download")})]

                      [{:hr true :key "dropdown-more"}
                       {:title [auto-check-for-updates-control]}])
                     (remove nil?)))]

    [:div.toolbar-plugins-manager.flex.items-center
     {:on-click
      (fn [^js e]
        (shui/popup-show! (.-target e)
                          (fn [{:keys [id]}]
                            (render-classic-dropdown-items id (items)))
                          {:as-dropdown? true
                           :content-props {:class "toolbar-plugins-manager-content"}}))}

     (shui/button-ghost-icon :puzzle
                             {:class "flex relative toolbar-plugins-manager-trigger"}
                             (when badge-updates?
                               (ui/point "bg-red-600.top-1.right-1.absolute" 4 {:style {:margin-right 2 :margin-top 2}})))]))

(hsx/defc header-ui-items-list-wrap
  [children]
  (let [*wrap-el (hooks/use-ref nil)]
    [:div.list-wrap {:ref *wrap-el} children]))

(hsx/defc hook-ui-items
  "type of :toolbar, :pagebar"
  [type]
  (let [installed-ui-items (rfx/use-sub [:plugin/installed-ui-items])
        pinned-items       (rfx/use-sub [:plugin/preferences :pinnedToolbarItems])
        updates-coming     (rfx/use-sub [:plugin/updates-coming])
        toolbar?           (= :toolbar type)
        pinned-items       (and (sequential? pinned-items) (into #{} pinned-items))]
    (when installed-ui-items
      (let [items (state/get-plugins-ui-items-with-type type)
            items (sort-by #(:key (second %)) items)]

        (when-let [items (and (seq items)
                              (if toolbar?
                                (map #(assoc-in % [1 :pinned?]
                                                (let [[_ {:keys [key]} pid] %
                                                      pkey (str (name pid) ":" key)]
                                                  (contains? pinned-items pkey)))
                                     items)
                                items))]

          [:div.ui-items-container
           {:data-type (name type)}

           [:<>
            [header-ui-items-list-wrap
             (for [[_ {:keys [key pinned?] :as opts} pid] items]
               (when (or (not toolbar?)
                         (not (set? pinned-items)) pinned?)
                 ^{:key key}
                 [ui-item-renderer pid type opts]))]

            ;; manage plugin buttons
            (when toolbar?
              [toolbar-plugins-manager-list updates-coming items])]])))))

(hsx/defc hook-ui-fenced-code
  [block content {:keys [render edit] :as _opts}]

  (let [[content1 set-content1!] (hooks/use-state content)
        [editor-active? set-editor-active!] (hooks/use-state (string/blank? content))
        *cm (hooks/use-ref nil)
        *el (hooks/use-ref nil)]

    (hooks/use-effect!
     #(set-content1! content)
     [content])

    (hooks/use-effect!
     (fn []
       (some-> (hooks/deref *el)
               (.closest ".ui-fenced-code-wrap")
               (.-classList)
               (#(if editor-active?
                   (.add % "is-active")
                   (.remove % "is-active"))))
       (when-let [cm (hooks/deref *cm)]
         (.refresh cm)
         (.focus cm)
         (.setCursor cm (.lineCount cm) (count (.getLine cm (.lastLine cm))))))
     [editor-active?])

    (hooks/use-effect!
     (fn []
       (let [t (js/setTimeout
                #(when-let [^js cm (some-> (hooks/deref *el)
                                           (.closest ".ui-fenced-code-wrap")
                                           (.querySelector ".CodeMirror")
                                           (.-CodeMirror))]
                   (hooks/set-ref! *cm cm)
                   (doto cm
                     (.on "change" (fn []
                                     (some-> cm (.getDoc) (.getValue) (set-content1!))))))
                  ;; wait for the cm loaded
                1000)]
         #(js/clearTimeout t)))
     [])

    [:div.ui-fenced-code-result
     {:on-pointer-down (fn [e] (when (false? edit) (util/stop e)))
      :class         (util/classnames [{:not-edit (false? edit)}])
      :ref           *el}
     [:<>
      [:span.actions
       {:on-pointer-down #(util/stop %)}
       (ui/button (ui/icon "square-toggle-horizontal" {:size 14})
                  :on-click #(set-editor-active! (not editor-active?)))
       (ui/button (ui/icon "source-code" {:size 14})
                  :on-click #(editor-handler/edit-block! block (count content1)))]
      (when (fn? render)
        (react/createElement render #js {:content content1}))]]))

(hsx/defc plugins-page
  []

  (let [[active set-active!] (hooks/use-state :installed)
        market? (= active :marketplace)
        *el-ref (hooks/create-ref)]

    (hooks/use-effect!
     (fn []
       (state/load-app-user-cfgs)
       #(clear-dirties-states!))
     [])

    (hooks/use-effect!
     #(clear-dirties-states!)
     [market?])

    [:div.cp__plugins-page
     {:ref *el-ref
      :class (when-not (util/electron?) "web-platform")
      :tab-index "-1"}

     [:h1 (t :nav/plugins)]

     (when (util/electron?)
       [:<>
        (security-warning)
        [:hr.my-4]])

     [:div.tabs.flex.items-center.justify-center
      [:div.tabs-inner.flex.items-center
       (shui/button {:on-click #(set-active! :installed)
                     :class (when (not market?) "active")
                     :size :sm
                     :variant :text}
                    (t :plugin/installed))

       (shui/button {:on-click #(set-active! :marketplace)
                     :class (when market? "active")
                     :size :sm
                     :variant :text}
                    (shui/tabler-icon "apps")
                    (t :plugin/marketplace))]]

     [:div.panels
      (if market?
        (marketplace-plugins)
        (installed-plugins))]]))

(def *updates-sub-content-timer (atom nil))
(def *updates-sub-content (atom nil))

(defn set-updates-sub-content!
  [content duration]
  (reset! *updates-sub-content content)

  (when (> duration 0)
    (some-> @*updates-sub-content-timer (js/clearTimeout))
    (->> (js/setTimeout #(reset! *updates-sub-content nil) duration)
         (reset! *updates-sub-content-timer))))

(hsx/defc updates-notifications-impl
  [check-pending? auto-checking? online?]
  (let [[uid, set-uid] (hooks/use-state nil)
        [cleanup-warning-pending? set-cleanup-warning-pending?!] (hooks/use-state false)
        [sub-content, _set-sub-content!] (hooks/use-atom *updates-sub-content)
        notify! (fn [content status]
                  (if auto-checking?
                    (println (t :plugin/list-of-updates) content)
                    (let [cb #(plugin-handler/cancel-user-checking!)]
                      (try
                        (set-uid (notification/show! content status false uid nil cb))
                        (catch js/Error _
                          (set-uid (notification/show! content status false nil nil cb)))))))]

    (hooks/use-effect!
     (fn []
       (if check-pending?
         (notify!
          [:div
           [:div (t :plugin/checking-for-updates)]
           (when sub-content [:p.opacity-60 sub-content])]
          :info)
         (when uid (notification/clear! uid))))
     [check-pending? sub-content])

    (hooks/use-effect!
     (fn []
       (when (and cleanup-warning-pending?
                  (not auto-checking?))
         (set-cleanup-warning-pending?! false)
         (show-disabled-plugins-cleanup-warning!)))
     [cleanup-warning-pending? auto-checking?])

    (hooks/use-effect!
      ;; scheduler for auto updates
     (fn []
       (when online?
         (let [auto-update-delay (if (util/electron?) 3000 (* 60 1000))
               last-updates (storage/get :lsp-last-auto-updates)
               should-auto-update? (and (not (false? last-updates))
                                        (or (true? last-updates)
                                            (not (number? last-updates))
                                             ;; interval 12 hours
                                            (> (- (js/Date.now) last-updates) (* 60 60 12 1000))))
               cleanup-warning-timer (when-not should-auto-update?
                                       (js/setTimeout #(set-cleanup-warning-pending?! true)
                                                      (+ auto-update-delay 1000)))
               update-timer (when should-auto-update?
                              (js/setTimeout
                               (fn []
                                 (plugin-handler/auto-check-enabled-for-updates!)
                                 (storage/set :lsp-last-auto-updates (js/Date.now))
                                 (set-cleanup-warning-pending?! true))
                               auto-update-delay))]
           #(do
              (some-> update-timer (js/clearTimeout))
              (some-> cleanup-warning-timer (js/clearTimeout))))))
     [online?])

    [:<>]))

(hsx/defc updates-notifications
  []
  (let [updates-pending (rfx/use-sub [:plugin/updates-pending])
        online?         (rfx/use-sub [:network/online?])
        auto-checking?  (rfx/use-sub [:plugin/updates-auto-checking?])
        check-pending?  (boolean (seq updates-pending))]
    (updates-notifications-impl check-pending? auto-checking? online?)))

(hsx/defc focused-settings-content
  [title]
  (let [focused (rfx/use-sub [:plugin/focused-settings])
        [cache set-cache!] (hooks/use-state focused)
        nav?    (rfx/use-sub [:plugin/navs-settings?])
        _       (rfx/use-sub [:plugin/installed-plugins])]
    (hooks/use-effect!
     (fn []
       (let [timeout-id (js/setTimeout #(set-cache! focused) 100)]
         #(js/clearTimeout timeout-id)))
     [focused])

    [:div.cp__plugins-settings.cp__settings-main
     [:div.cp__settings-inner.md:flex
      {:class (util/classnames [{:no-aside (not nav?)}])}
      (when nav?
        [:aside.md:w-64 {:style {:min-width "10rem"}}
         [:header.cp__settings-header
          [:h1.cp__settings-modal-title (or title (t :plugin.settings/title))]]
         (let [plugins (plugin-handler/get-enabled-plugins-if-setting-schema)]
           [:ul.settings-plugin-list
            (for [{:keys [id name title icon]} plugins]
              [:li
               {:key id :class (util/classnames [{:active (= id focused)}])}
               [:a.flex.items-center.settings-plugin-item
                {:data-id  id
                 :on-click #(do (state/set-state! :plugin/focused-settings id))}
                (if (and icon (not (string/blank? icon)))
                  [:img.icon {:src icon}]
                  svg/folder)
                [:strong.flex-1 (or title name)]]])])])

      [:article
       [:div.panel-wrap
        {:data-id focused}
        (when-let [^js pl (and focused (= cache focused)
                               (plugin-handler/get-plugin-inst focused))]
          (ui/catch-error
            [:p.warning.text-lg.mt-5 (t :plugin/settings-schema-error)]
           (plugins-settings/settings-container
            (bean/->clj (.-settingsSchema pl)) pl)))]]]]))

(hsx/defc custom-js-installer
  [{:keys [t current-repo db-restoring?]}]
  (hooks/use-effect!
   (fn []
     (when (and (not db-restoring?)
                (not util/nfs?))
       (ui-handler/exec-js-if-exists-&-allowed! t)))
   [current-repo db-restoring?])
  nil)

(hsx/defc perf-tip-content
  [pid name url]
  [:div
   [:span.block.whitespace-normal
    (interpolate-rich-text-node
     (t :plugin/perf-tip)
     [[:strong.text-error (str "#" name)]])]

   [:path.opacity-50
    [:small [:span.pr-1 (ui/icon "folder")] url]]

   [:p
    (ui/button (t :plugin/disable-now)
               :small? true
               :on-click
               (fn []
                 (-> (js/LSPluginCore.disable pid)
                     (p/then #(do
                                (notification/clear! pid)
                                (notification/show!
                                 (interpolate-rich-text-node
                                  (t :plugin/disable-for-performance-feedback)
                                  [[:strong.text-error (str "#" name)]])
                                 :success
                                 true nil 3000 nil)))
                     (p/catch #(js/console.error %)))))]])

(defn open-plugins-modal!
  []
  (shui/dialog-open!
   (plugins-page)
   {:label :plugins-dashboard
    :align :start}))

(defn open-waiting-updates-modal!
  []
  (shui/dialog-open!
   (fn []
     (waiting-coming-updates))
   {:center? true}))

(defn open-plugins-from-file-modal!
  [plugins]
  (shui/dialog-open!
   (fn []
     (plugins-from-file plugins))
   {:id "ls-plugins-from-file-modal"}))

(defn open-focused-settings-modal!
  [title]
  (shui/dialog-open!
   (fn []
     [:div.settings-modal.of-plugins
      (focused-settings-content title)])
   {:label   :plugin-settings-modal
    :align   :start
    :id      "ls-focused-settings-modal"}))

;; tools for user registered host renderers
(hsx/defc renderer-container
  [{:keys [_pid render] :as opts}]
  (if (fn? render)
    [:div.lsp-host-renderer-container
     (render opts)]
    [:pre (pr-str opts)]))

(hsx/defc renderer-resolver
  [nskey']
  (when-let [pid (some-> nskey' (namespace))]
    (let [key (name nskey')
          [renderer set-renderer!] (hooks/use-state nil)]

      (hooks/use-effect!
       (fn []
         (try
           (when-let [renderer (plugin-handler/resolve-hosted-render pid key :sidebar)]
             (let [r (bean/->clj renderer)
                   title (:title r)]
               (when-let [^js dom (and title (js/document.getElementById nskey'))]
                 (set! (. dom -textContent) title))
               (set-renderer! r)))
           (catch js/Error e (js/console.error "Failed to resolve renderer:" nskey' e))))
       [pid key])

      (when renderer
        (renderer-container renderer)))))

(defn hook-custom-routes
  [routes]
  (cond-> routes
    config/lsp-enabled?
    (concat (some->> (plugin-handler/get-route-renderers)
                     (mapv (fn [custom-route]
                             (when-let [{:keys [name path render]} custom-route]
                               (when (not (string/blank? path))
                                 [path {:name name :view (fn [r] (render r custom-route))}]))))
                     (remove nil?)))))

(defn hook-daemon-renderers
  []
  (when-let [rs (seq (plugin-handler/get-daemon-renderers))]
    [:div.lsp-daemon-container
     (for [{:keys [key _pid render]} rs]
       (when (fn? render)
         [:div.lsp-daemon-container-card {:data-key key} (render)]))]))
