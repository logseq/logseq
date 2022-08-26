(ns frontend.components.plugins
  (:require [rum.core :as rum]
            [frontend.state :as state]
            [cljs-bean.core :as bean]
            [frontend.context.i18n :refer [t]]
            [frontend.ui :as ui]
            [frontend.handler.ui :as ui-handler]
            [frontend.search :as search]
            [frontend.util :as util]
            [frontend.mixins :as mixins]
            [electron.ipc :as ipc]
            [promesa.core :as p]
            [frontend.components.svg :as svg]
            [frontend.components.plugins-settings :as plugins-settings]
            [frontend.handler.notification :as notification]
            [frontend.handler.plugin :as plugin-handler]
            [clojure.string :as string]))

(rum/defcs installed-themes
  <
  (rum/local [] ::themes)
  (rum/local 0 ::cursor)
  (rum/local 0 ::total)
  {:did-mount (fn [state]
                (let [*themes        (::themes state)
                      *cursor        (::cursor state)
                      *total         (::total state)
                      mode           (state/sub :ui/theme)
                      all-themes     (state/sub :plugin/installed-themes)
                      themes         (->> all-themes
                                          (filter #(= (:mode %) mode))
                                          (sort-by #(:name %)))
                      no-mode-themes (->> all-themes
                                          (filter #(= (:mode %) nil))
                                          (sort-by #(:name %))
                                          (map-indexed (fn [idx opt] (assoc opt :group-first (zero? idx) :group-desc (if (zero? idx) "light & dark themes" nil)))))
                      selected       (state/sub :plugin/selected-theme)
                      themes         (map-indexed (fn [idx opt]
                                                    (let [selected? (= (:url opt) selected)]
                                                      (when selected? (reset! *cursor (+ idx 1)))
                                                      (assoc opt :mode mode :selected selected?))) (concat themes no-mode-themes))
                      themes         (cons {:name        (string/join " " ["Default" (string/capitalize mode) "Theme"])
                                            :url         nil
                                            :description (string/join " " ["Logseq default" mode "theme."])
                                            :mode        mode
                                            :selected    (nil? selected)
                                            :group-first true
                                            :group-desc  (str mode " themes")} themes)]
                  (reset! *themes themes)
                  (reset! *total (count themes))
                  state))}
  (mixins/event-mixin
   (fn [state]
     (let [*cursor    (::cursor state)
           *total     (::total state)
           ^js target (rum/dom-node state)]
       (.focus target)
       (mixins/on-key-down
        state {38                                           ;; up
               (fn [^js _e]
                 (reset! *cursor
                         (if (zero? @*cursor)
                           (dec @*total) (dec @*cursor))))
               40                                           ;; down
               (fn [^js _e]
                 (reset! *cursor
                         (if (= @*cursor (dec @*total))
                           0 (inc @*cursor))))

               13                                           ;; enter
               #(when-let [^js active (.querySelector target ".is-active")]
                  (.click active))}))))
  [state]
  (let [*cursor (::cursor state)
        *themes (::themes state)]
    [:div.cp__themes-installed
     {:tab-index -1}
     [:h1.mb-4.text-2xl.p-1 (t :themes)]
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
                          :is-active   (= idx @*cursor)}])
             :on-click #(do (js/LSPluginCore.selectTheme (bean/->js opt))
                            (state/close-modal!))}
            [:div.flex.items-center.text-xs
             [:div.opacity-60 (str (or (:name plg) "Logseq") " •")]
             [:div.name.ml-1 (:name opt)]]
            (when (or group-first? current-selected?)
              [:div.flex.items-center
               (when group-first? [:small.opacity-60 (:group-desc opt)])
               (when current-selected? [:small.inline-flex.ml-1.opacity-60 (ui/icon "check")])])]]))
      @*themes)]))

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
  [repo _content]

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

(rum/defc card-ctls-of-market < rum/static
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
         (t :plugin/install)))]]])

(rum/defc card-ctls-of-installed < rum/static
  [id name url sponsors unpacked? disabled?
   installing-or-updating? has-other-pending?
   new-version item]
  [:div.ctl
   [:div.l
    [:div.de
     [:strong (ui/icon "settings")]
     [:ul.menu-list
      [:li {:on-click #(plugin-handler/open-plugin-settings! id false)} (t :plugin/open-settings)]
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
                      (plugin-handler/check-or-update-marketplace-plugin
                       (assoc item :only-check (not new-version))
                       (fn [^js e] (notification/show! (.toString e) :error))))}

        (if installing-or-updating?
          (t :plugin/updating)
          (if new-version
            (str (t :plugin/update) " 👉 " new-version)
            (t :plugin/check-update)))]])

    (ui/toggle (not disabled?)
               (fn []
                 (js-invoke js/LSPluginCore (if disabled? "enable" "disable") id))
               true)]])

(defn get-open-plugin-readme-handler
  [url item repo]
  #(plugin-handler/open-readme!
    url item (if repo remote-readme-display local-markdown-display))
  )

(rum/defc plugin-item-card < rum/static
  [t {:keys [id name title version url description author icon iir repo sponsors] :as item}
   disabled? market? *search-key has-other-pending?
   installing-or-updating? installed? stat coming-update]

  (let [name        (or title name "Untitled")
        unpacked?   (not iir)
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
      (if (and icon (not (string/blank? icon)))
        [:img.icon {:src (if market? (plugin-handler/pkg-asset id icon) icon)}]
        svg/folder)

      (when (and (not market?) unpacked?)
        [:span.flex.justify-center.text-xs.text-red-500.pt-2 (t :plugin/unpacked)])]

     [:div.r
      [:h3.head.text-xl.font-bold.pt-1.5

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
                              (notification/show! "Copied!" :success)
                              (util/copy-to-clipboard! id))}
         (str "ID: " id)]]]

      ;; Github repo
      [:div.flag.is-top.opacity-50
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

(rum/defc panel-tab-search < rum/static
  [search-key *search-key *search-ref]
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
     :auto-focus  true
     :on-key-down (fn [^js e]
                    (when (= 27 (.-keyCode e))
                      (util/stop e)
                      (if (string/blank? search-key)
                        (some-> (js/document.querySelector ".cp__plugins-page") (.focus))
                        (reset! *search-key nil))))
     :on-change   #(let [^js target (.-target %)]
                     (reset! *search-key (util/trim-safe (.-value target))))
     :value       (or search-key "")}]])

(rum/defc panel-tab-developer
  []
  (ui/button
   (t :plugin/contribute)
   :href "https://github.com/logseq/marketplace"
   :class "contribute"
   :intent "logseq"
   :target "_blank"))

(rum/defc user-proxy-settings-panel
  [{:keys [protocol] :as agent-opts}]
  (let [[opts set-opts!] (rum/use-state agent-opts)
        [testing? set-testing?!] (rum/use-state false)
        *test-input (rum/create-ref)
        disabled?   (string/blank? (:protocol opts))]
    [:div.cp__settings-network-proxy-panel
     [:h1.mb-2.text-2xl.font-bold (t :settings-page/network-proxy)]
     [:div.p-2
      [:p [:label [:strong (t :type)]
           (ui/select [{:label "Disabled" :value "" :selected disabled?}
                       {:label "http" :value "http" :selected (= protocol "http")}
                       {:label "socks5" :value "socks5" :selected (= protocol "socks5")}]
                      #(set-opts!
                        (assoc opts :protocol (if (= "disabled" (util/safe-lower-case %)) nil %))) nil)]]
      [:p.flex
       [:label.pr-4 [:strong (t :host)]
        [:input.form-input.is-small
         {:value     (:host opts) :disabled disabled?
          :on-change #(set-opts!
                       (assoc opts :host (util/trim-safe (util/evalue %))))}]]

       [:label [:strong (t :port)]
        [:input.form-input.is-small
         {:value     (:port opts) :type "number" :disabled disabled?
          :on-change #(set-opts!
                       (assoc opts :port (util/trim-safe (util/evalue %))))}]]]

      [:hr]
      [:p.flex.items-center.space-x-2
       [:span.w-60
        [:input.form-input.is-small
         {:ref         *test-input
          :placeholder "http://"
          :on-change   #(set-opts!
                         (assoc opts :test (util/trim-safe (util/evalue %))))
          :value       (:test opts)}]]

       (ui/button (if testing? (ui/loading "Testing") "Test URL")
                  :intent "logseq" :large? false
                  :style {:margin-top 0 :padding "5px 15px"}
                  :on-click #(let [val (util/trim-safe (.-value (rum/deref *test-input)))]
                               (when (and (not testing?) (not (string/blank? val)))
                                 (set-testing?! true)
                                 (-> (p/let [_ (ipc/ipc :setHttpsAgent opts)
                                             _ (ipc/ipc :testProxyUrl val)])
                                     (p/catch (fn [e] (notification/show! (str e) :error)))
                                     (p/finally (fn [] (set-testing?! false)))))))]

      [:p.pt-2
       (ui/button (t :save)
                  :on-click (fn []
                              (p/let [_ (ipc/ipc :setHttpsAgent opts)]
                                (state/set-state! [:electron/user-cfgs :settings/agent] opts)
                                (state/close-sub-modal! :https-proxy-panel))))]]]))

(rum/defc ^:large-vars/cleanup-todo panel-control-tabs < rum/static
  [search-key *search-key category *category
   sort-by *sort-by filter-by *filter-by
   selected-unpacked-pkg market? develop-mode?
   reload-market-fn agent-opts]

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
      (let [aim-icon #(if (= filter-by %) "check" "circle")]
        (ui/dropdown-with-links
         (fn [{:keys [toggle-fn]}]
           (ui/button
            [:span (ui/icon "filter")]
            :class (str (when-not (contains? #{:default} filter-by) "picked ") "sort-or-filter-by")
            :on-click toggle-fn
            :intent "link"))

         (if market?
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
             :icon    (ui/icon (aim-icon :update-available))}])
         nil))

      (when market?
        (ui/dropdown-with-links
         (fn [{:keys [toggle-fn]}]
           (ui/button
            [:span (ui/icon "arrows-sort")]
            :class (str (when-not (contains? #{:default :downloads} sort-by) "picked ") "sort-or-filter-by")
            :on-click toggle-fn
            :intent "link"))
         (let [aim-icon #(if (= sort-by %) "check" "circle")]
           [{:title   (t :plugin/downloads)
             :options {:on-click #(reset! *sort-by :downloads)}
             :icon    (ui/icon (aim-icon :downloads))}

            {:title   (t :plugin/stars)
             :options {:on-click #(reset! *sort-by :stars)}
             :icon    (ui/icon (aim-icon :stars))}

            {:title   (str (t :plugin/title) " (A - Z)")
             :options {:on-click #(reset! *sort-by :letters)}
             :icon    (ui/icon (aim-icon :letters))}])
         {}))

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

               [{:title   [:span (ui/icon "world") (t :settings-page/network-proxy)]
                 :options {:on-click #(state/pub-event! [:go/proxy-settings agent-opts])}}]

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
      (panel-tab-developer)]]))

(rum/defcs marketplace-plugins
  < rum/static rum/reactive
  (rum/local false ::fetching)
  (rum/local "" ::search-key)
  (rum/local :plugins ::category)
  (rum/local :downloads ::sort-by)                        ;; downloads / stars / letters / updates
  (rum/local :default ::filter-by)
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
  (let [pkgs              (state/sub :plugin/marketplace-pkgs)
        stats             (state/sub :plugin/marketplace-stats)
        installed-plugins (state/sub :plugin/installed-plugins)
        installing        (state/sub :plugin/installing)
        online?           (state/sub :network/online?)
        develop-mode?     (state/sub :ui/developer-mode?)
        agent-opts        (state/sub [:electron/user-cfgs :settings/agent])
        *search-key       (::search-key state)
        *category         (::category state)
        *sort-by          (::sort-by state)
        *filter-by        (::filter-by state)
        *fetching         (::fetching state)
        *error            (::error state)
        filtered-pkgs     (when (seq pkgs)
                            (if (= @*category :themes)
                              (filter #(:theme %) pkgs)
                              (filter #(not (:theme %)) pkgs)))
        filtered-pkgs     (if (and (seq filtered-pkgs) (not= :default @*filter-by))
                            (filter #(apply
                                      (if (= :installed @*filter-by) identity not)
                                      [(contains? installed-plugins (keyword (:id %)))])
                                    filtered-pkgs)
                            filtered-pkgs)
        filtered-pkgs     (if-not (string/blank? @*search-key)
                            (if-let [author (and (string/starts-with? @*search-key "@")
                                                 (subs @*search-key 1))]
                              (filter #(= author (:author %)) filtered-pkgs)
                              (search/fuzzy-search
                               filtered-pkgs @*search-key
                               :limit 30
                               :extract-fn :title))
                            filtered-pkgs)
        filtered-pkgs     (map #(if-let [stat (get stats (keyword (:id %)))]
                                  (let [downloads (:total_downloads stat)
                                        stars     (:stargazers_count stat)]
                                    (assoc % :stat stat
                                           :stars stars
                                           :downloads downloads))
                                  %) filtered-pkgs)
        sorted-pkgs       (apply sort-by
                                 (conj
                                  (case @*sort-by
                                    :letters [#(util/safe-lower-case (or (:title %) (:name %)))]
                                    [@*sort-by #(compare %2 %1)])
                                  filtered-pkgs))]

    [:div.cp__plugins-marketplace

     (panel-control-tabs
      @*search-key *search-key
      @*category *category
      @*sort-by *sort-by @*filter-by *filter-by
      nil true develop-mode? (::reload state)
      agent-opts)

     (cond
       (not online?)
       [:p.flex.justify-center.pt-20.opacity-50 (svg/offline 30)]

       @*fetching
       [:p.flex.justify-center.pt-20 svg/loading]

       @*error
       [:p.flex.justify-center.pt-20.opacity-50 "Remote error: " (.-message @*error)]

       :else
       [:div.cp__plugins-marketplace-cnt
        {:class (util/classnames [{:has-installing (boolean installing)}])}
        [:div.cp__plugins-item-lists.grid-cols-1.md:grid-cols-2.lg:grid-cols-3
         (for [item sorted-pkgs]
           (rum/with-key
             (let [pid  (keyword (:id item))
                   stat (:stat item)]
               (plugin-item-card t item
                                 (get-in item [:settings :disabled]) true *search-key installing
                                 (and installing (= (keyword (:id installing)) pid))
                                 (contains? installed-plugins pid) stat nil))
             (:id item)))]])]))

(rum/defcs installed-plugins
  < rum/static rum/reactive
  (rum/local "" ::search-key)
  (rum/local :default ::filter-by)                        ;; default / enabled / disabled / unpacked / update-available
  (rum/local :default ::sort-by)
  (rum/local :plugins ::category)
  [state]
  (let [installed-plugins     (state/sub [:plugin/installed-plugins])
        installed-plugins     (vals installed-plugins)
        updating              (state/sub :plugin/installing)
        develop-mode?         (state/sub :ui/developer-mode?)
        selected-unpacked-pkg (state/sub :plugin/selected-unpacked-pkg)
        coming-updates        (state/sub :plugin/updates-coming)
        agent-opts            (state/sub [:electron/user-cfgs :settings/agent])
        *filter-by            (::filter-by state)
        *sort-by              (::sort-by state)
        *search-key           (::search-key state)
        *category             (::category state)
        default-filter-by?    (= :default @*filter-by)
        filtered-plugins      (when (seq installed-plugins)
                                (if (= @*category :themes)
                                  (filter #(:theme %) installed-plugins)
                                  (filter #(not (:theme %)) installed-plugins)))
        filtered-plugins      (if-not default-filter-by?
                                (filter (fn [it]
                                          (let [disabled (get-in it [:settings :disabled])]
                                            (case @*filter-by
                                              :enabled (not disabled)
                                              :disabled disabled
                                              :unpacked (not (:iir it))
                                              :update-available (state/plugin-update-available? (:id it))
                                              true))) filtered-plugins)
                                filtered-plugins)
        filtered-plugins      (if-not (string/blank? @*search-key)
                                (if-let [author (and (string/starts-with? @*search-key "@")
                                                     (subs @*search-key 1))]
                                  (filter #(= author (:author %)) filtered-plugins)
                                  (search/fuzzy-search
                                   filtered-plugins @*search-key
                                   :limit 30
                                   :extract-fn :name))
                                filtered-plugins)
        sorted-plugins        (if default-filter-by?
                                (->> filtered-plugins
                                     (reduce #(let [k (if (get-in %2 [:settings :disabled]) 1 0)]
                                                (update %1 k conj %2)) [[] []])
                                     (#(update % 0 (fn [coll] (sort-by :iir coll))))
                                     (flatten))
                                filtered-plugins)]
    [:div.cp__plugins-installed

     (panel-control-tabs
      @*search-key *search-key
      @*category *category
      @*sort-by *sort-by
      @*filter-by *filter-by
      selected-unpacked-pkg
      false develop-mode? nil
      agent-opts)

     [:div.cp__plugins-item-lists.grid-cols-1.md:grid-cols-2.lg:grid-cols-3
      (for [item sorted-plugins]
        (rum/with-key
          (let [pid (keyword (:id item))]
            (plugin-item-card t item
                              (get-in item [:settings :disabled]) false *search-key updating
                              (and updating (= (keyword (:id updating)) pid))
                              true nil (get coming-updates pid)))
          (:id item)))]]))

(rum/defcs waiting-coming-updates
  < rum/reactive
  {:will-mount (fn [s] (state/reset-unchecked-update) s)}
  [_s]
  (let [_            (state/sub :plugin/updates-coming)
        downloading? (state/sub :plugin/updates-downloading?)
        unchecked    (state/sub :plugin/updates-unchecked)
        updates      (state/all-available-coming-updates)]

    [:div.cp__plugins-waiting-updates
     [:h1.mb-4.text-2xl.p-1 (util/format "Found %s updates" (count updates))]

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
            (ui/checkbox {:id        k
                          :checked   c?
                          :on-change (fn [^js e]
                                       (when-not downloading?
                                         (state/set-unchecked-update (:id it) (not (util/echecked? e)))))})
            [:strong.px-3 (:title it)
             [:sup (str (:version it) " 👉 " (:latest-version it))]]]

           [:div.px-4
            (when-not (string/blank? notes)
              (ui/tippy
               {:html [:p notes]}
               [:span.opacity-30.hover:opacity-80 (ui/icon "info-circle")]))]])]

       ;; all done
       [:div.py-4 [:strong.text-4xl "\uD83C\uDF89 All updated!"]])

     ;; actions
     (when (seq updates)
       [:div.pt-5
        (ui/button
         (if downloading?
           [:span (ui/loading " Downloading...")]
           [:span "Update all of selected"])

         :on-click
         #(when-not downloading?
            (plugin-handler/open-updates-downloading)
            (if-let [n (state/get-next-selected-coming-update)]
              (plugin-handler/check-or-update-marketplace-plugin
               (assoc n :only-check false)
               (fn [^js e] (notification/show! (.toString e) :error)))
              (plugin-handler/close-updates-downloading)))

         :disabled
         (or downloading?
             (and (seq unchecked)
                  (= (count unchecked) (count updates)))))])]))

(defn open-select-theme!
  []
  (state/set-sub-modal! installed-themes))

(rum/defc hook-ui-slot
  ([type payload] (hook-ui-slot type payload nil))
  ([type payload opts]
   (let [rs      (util/rand-str 8)
         id      (str "slot__" rs)
         *el-ref (rum/use-ref nil)]

     (rum/use-effect!
      (fn []
        (let [timer (js/setTimeout
                     #(plugin-handler/hook-plugin-app type {:slot id :payload payload} nil)
                     100)]
          #(js/clearTimeout timer)))
      [id])

     (rum/use-effect!
      (fn []
        (let [el (rum/deref *el-ref)]
          #(when-let [uis (seq (.querySelectorAll el "[data-injected-ui]"))]
             (doseq [^js el uis]
               (when-let [id (.-injectedUi (.-dataset el))]
                 (js/LSPluginCore._forceCleanInjectedUI id))))))
      [])

     [:div.lsp-hook-ui-slot
      (merge opts {:id            id
                   :ref           *el-ref
                   :on-mouse-down (fn [e] (util/stop e))})])))

(rum/defc ui-item-renderer
  [pid type {:keys [key template prefix]}]
  (let [*el    (rum/use-ref nil)
        uni    #(str prefix "injected-ui-item-" %)
        ^js pl (js/LSPluginCore.registeredPlugins.get (name pid))]

    (rum/use-effect!
     (fn []
       (when-let [^js el (rum/deref *el)]
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

(rum/defc toolbar-plugins-manager-list
  [items]

  (ui/dropdown-with-links
   (fn [{:keys [toggle-fn]}]
     [:div.toolbar-plugins-manager
      {:on-click toggle-fn}
      [:a.button (ui/icon "puzzle")]])

   ;; items
   (for [[_ {:keys [key pinned?] :as opts} pid] items
         :let [pkey (str (name pid) ":" key)]]
     {:title   key
      :item    [:div.flex.items-center.item-wrap
                (ui-item-renderer pid :toolbar (assoc opts :prefix "pl-" :key (str "pl-" key)))
                [:span.opacity-80 {:style {:padding-left "2px"}} key]
                [:span.pin.flex.items-center.opacity-60
                 {:class (util/classnames [{:pinned pinned?}])}
                 (ui/icon (if pinned? "pinned" "pin"))]]
      :options {:on-click (fn [^js e]
                            (let [^js target (.-target e)
                                  user-btn?  (boolean (.closest target "div[data-injected-ui]"))]
                              (when-not user-btn?
                                (plugin-handler/op-pinned-toolbar-item! pkey (if pinned? :remove :add))))
                            false)}})
   {:trigger-class "toolbar-plugins-manager-trigger"}))

(rum/defcs hook-ui-items <
  rum/reactive
  "type of :toolbar, :pagebar"
  [_state type]
  (when (state/sub [:plugin/installed-ui-items])
    (let [toolbar?     (= :toolbar type)
          pinned-items (state/sub [:plugin/preferences :pinnedToolbarItems])
          pinned-items (and (sequential? pinned-items) (into #{} pinned-items))
          items        (state/get-plugins-ui-items-with-type type)
          items        (sort-by #(:key (second %)) items)]

      (when-let [items (and (seq items)
                            (if toolbar?
                              (map #(assoc-in % [1 :pinned?]
                                              (let [[_ {:keys [key]} pid] %
                                                    pkey (str (name pid) ":" key)]
                                                (contains? pinned-items pkey)))
                                   items)
                              items))]

        [:div {:class     (str "ui-items-container")
               :data-type (name type)}
         (conj (for [[_ {:keys [key pinned?] :as opts} pid] items]
                 (when (or (not toolbar?)
                           (not (set? pinned-items)) pinned?)
                   (rum/with-key (ui-item-renderer pid type opts) key))))

         ;; manage plugin buttons
         (when toolbar?
           (toolbar-plugins-manager-list items))]))))

(rum/defcs hook-ui-fenced-code < rum/reactive
  [_state content {:keys [render edit] :as _opts}]

  [:div
   {:on-mouse-down (fn [e] (when (false? edit) (util/stop e)))
    :class         (util/classnames [{:not-edit (false? edit)}])}
   (when (fn? render)
     (js/React.createElement render #js {:content content}))])

(rum/defc plugins-page
  []

  (let [[active set-active!] (rum/use-state :installed)
        market? (= active :marketplace)
        *el-ref (rum/create-ref)]

    (rum/use-effect!
     #(state/load-app-user-cfgs)
     [])

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
        (installed-plugins))]]))

(rum/defcs focused-settings-content
  < rum/reactive
  (rum/local (state/sub :plugin/focused-settings) ::cache)
  [_state title]
  (let [*cache  (::cache _state)
        focused (state/sub :plugin/focused-settings)
        nav?    (state/sub :plugin/navs-settings?)
        _       (state/sub :plugin/installed-plugins)
        _       (js/setTimeout #(reset! *cache focused) 100)]

    [:div.cp__plugins-settings.cp__settings-main
     [:header
      [:h1.title (ui/icon "puzzle") (str " " (or title (t :settings-of-plugins)))]]

     [:div.cp__settings-inner.md:flex
      {:class (util/classnames [{:no-aside (not nav?)}])}
      (when nav?
        [:aside.md:w-64 {:style {:min-width "10rem"}}
         (let [plugins (plugin-handler/get-enabled-plugins-if-setting-schema)]
           [:ul.settings-plugin-list
            (for [{:keys [id name title icon]} plugins]
              [:li
               {:class (util/classnames [{:active (= id focused)}])}
               [:a.flex.items-center.settings-plugin-item
                {:data-id id
                 :on-click #(do (state/set-state! :plugin/focused-settings id))}
                (if (and icon (not (string/blank? icon)))
                  [:img.icon {:src icon}]
                  svg/folder)
                [:strong.flex-1 (or title name)]]])])])

      [:article
       [:div.panel-wrap
        {:data-id focused}
        (when-let [^js pl (and focused (= @*cache focused)
                               (plugin-handler/get-plugin-inst focused))]
          (ui/catch-error
           [:p.warning.text-lg.mt-5 "Settings schema Error!"]
           (plugins-settings/settings-container
            (bean/->clj (.-settingsSchema pl)) pl)))]]]]))

(rum/defc custom-js-installer
  [{:keys [t current-repo db-restoring? nfs-granted?]}]
  (rum/use-effect!
   (fn []
     (when (and (not db-restoring?)
                (or (not util/nfs?) nfs-granted?))
       (ui-handler/exec-js-if-exists-&-allowed! t)))
   [current-repo db-restoring? nfs-granted?])
  nil)

(rum/defc perf-tip-content
  [pid name url]
  [:div
   [:span.block.whitespace-normal
    "This plugin "
    [:strong.text-red-500 "#" name]
    " takes too long to load, affecting the application startup time and
     potentially causing other plugins to fail to load."]

   [:path.opacity-50
    [:small [:span.pr-1 (ui/icon "folder")] url]]

   [:p
    (ui/button "Disable now"
               :small? true
               :on-click
               (fn []
                 (-> (js/LSPluginCore.disable pid)
                     (p/then #(do
                                (notification/clear! pid)
                                (notification/show!
                                 [:span "The plugin "
                                  [:strong.text-red-500 "#" name]
                                  " is disabled."] :success
                                 true nil 3000)))
                     (p/catch #(js/console.error %)))))]])

(defn open-plugins-modal!
  []
  (state/set-modal!
   (fn [_close!]
     (plugins-page))))

(defn open-waiting-updates-modal!
  []
  (state/set-sub-modal!
   (fn [_close!]
     (waiting-coming-updates))
   {:center? true}))

(defn open-focused-settings-modal!
  [title]
  (state/set-sub-modal!
   (fn [_close!]
     [:div.settings-modal.of-plugins
      (focused-settings-content title)])
   {:center? false
    :id      "ls-focused-settings-modal"}))
