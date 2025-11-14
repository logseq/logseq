(ns frontend.components.container
  (:require [cljs-drag-n-drop.core :as dnd]
            [clojure.string :as string]
            [dommy.core :as d]
            [frontend.components.content :as cp-content]
            [frontend.components.find-in-page :as find-in-page]
            [frontend.components.handbooks :as handbooks]
            [frontend.components.header :as header]
            [frontend.components.journal :as journal]
            [frontend.components.left-sidebar :as app-left-sidebar]
            [frontend.components.plugins :as plugins]
            [frontend.components.right-sidebar :as right-sidebar]
            [frontend.components.theme :as theme]
            [frontend.components.window-controls :as window-controls]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.async :as db-async]
            [frontend.db.model :as db-model]
            [frontend.handler.common :as common-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.user :as user-handler]
            [frontend.mixins :as mixins]
            [frontend.mobile.footer :as footer]
            [frontend.mobile.util :as mobile-util]
            [frontend.modules.shortcut.data-helper :as shortcut-dh]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.version :refer [version]]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [logseq.common.path :as path]
            [logseq.shui.dialog.core :as shui-dialog]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.popup.core :as shui-popup]
            [logseq.shui.toaster.core :as shui-toaster]
            [logseq.shui.ui :as shui]
            [medley.core :as medley]
            [promesa.core :as p]
            [react-draggable]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]))

(rum/defc main <
  {:did-mount (fn [state]
                (when-let [element (gdom/getElement "main-content-container")]
                  (dnd/subscribe!
                   element
                   :upload-files
                   {:drop (fn [_e files]
                            (when-let [id (state/get-edit-input-id)]
                              (let [format (get (state/get-edit-block) :block/format :markdown)]
                                (editor-handler/upload-asset! id files format editor-handler/*asset-uploading? true))))})
                  (common-handler/listen-to-scroll! element)
                  (when (:margin-less-pages? (first (:rum/args state))) ;; makes sure full screen pages displaying without scrollbar
                    (set! (.. element -scrollTop) 0)))
                state)
   :will-unmount (fn [state]
                   (when-let [el (gdom/getElement "main-content-container")]
                     (dnd/unsubscribe! el :upload-files))
                   state)}
  [{:keys [route-match margin-less-pages? route-name db-restoring? main-content]}]
  (let [left-sidebar-open? (state/sub :ui/left-sidebar-open?)
        onboarding-and-home? (and (or (nil? (state/get-current-repo)) (config/demo-graph?))
                                  (not config/publishing?)
                                  (= :home route-name))
        margin-less-pages? (or (and (mobile-util/native-platform?) onboarding-and-home?) margin-less-pages?)]
    [:div#main-container.cp__sidebar-main-layout.flex-1.flex
     {:class (util/classnames [{:is-left-sidebar-open left-sidebar-open?}])}

     ;; desktop left sidebar layout
     (app-left-sidebar/left-sidebar
      {:left-sidebar-open? left-sidebar-open?
       :route-match route-match})

     [:div#main-content-container.scrollbar-spacing.w-full.flex.justify-center.flex-row.outline-none.relative

      {:tabIndex "-1"
       :data-is-margin-less-pages margin-less-pages?}

      [:div.cp__sidebar-main-content
       {:data-is-margin-less-pages margin-less-pages?
        :data-is-full-width (or margin-less-pages?
                                (contains? #{:all-files :all-pages :my-publishing} route-name))}

       (footer/footer)

       (cond
         db-restoring?
         (if config/publishing?
           [:div.space-y-2
            (shui/skeleton {:class "h-8 w-1/3 mb-8 bg-gray-400"})
            (shui/skeleton {:class "h-6 w-full bg-gray-400"})
            (shui/skeleton {:class "h-6 w-full bg-gray-400"})]
           [:div.space-y-2
            (shui/skeleton {:class "h-8 w-1/3 mb-8"})
            (shui/skeleton {:class "h-6 w-full"})
            (shui/skeleton {:class "h-6 w-full"})])

         :else
         [:div
          {:class (if (or onboarding-and-home? margin-less-pages?) "" (util/hiccup->class "mx-auto.pb-24"))
           :style {:margin-bottom (cond
                                    margin-less-pages? 0
                                    onboarding-and-home? 0
                                    :else 120)}}
          main-content])

       (comment
         (when onboarding-and-home?
           (onboarding/intro onboarding-and-home?)))]]]))

(defonce sidebar-inited? (atom false))
;; TODO: simplify logic

(rum/defc parsing-progress < rum/static
  [state]
  (let [finished (or (:finished state) 0)
        total (:total state)
        width (js/Math.round (* (.toFixed (/ finished total) 2) 100))
        display-filename (some-> (:current-parsing-file state)
                                 not-empty
                                 path/filename)
        left-label [:div.flex.flex-row.font-bold
                    (t :parsing-files)
                    [:div.hidden.md:flex.flex-row
                     [:span.mr-1 ": "]
                     [:div.text-ellipsis-wrapper {:style {:max-width 300}}
                      display-filename]]]]
    (ui/progress-bar-with-label width left-label (str finished "/" total))))

(rum/defc main-content < rum/reactive db-mixins/query
  {:init (fn [state]
           (when-not @sidebar-inited?
             (let [current-repo (state/sub :git/current-repo)
                   default-home (app-left-sidebar/get-default-home-if-valid)
                   sidebar (:sidebar default-home)
                   sidebar (if (string? sidebar) [sidebar] sidebar)]
               (when-let [pages (->> (seq sidebar)
                                     (remove string/blank?))]
                 (doseq [page pages]
                   (let [page (util/safe-page-name-sanity-lc page)
                         [db-id block-type] (if (= page "contents")
                                              [(or (:db/id (db/get-page page)) "contents") :contents]
                                              [(:db/id (db/get-page page)) :page])]
                     (state/sidebar-add-block! current-repo db-id block-type)))
                 (reset! sidebar-inited? true))))
           state)}
  []
  (let [default-home (app-left-sidebar/get-default-home-if-valid)
        current-repo (state/sub :git/current-repo)
        loading-files? (when current-repo (state/sub [:repo/loading-files? current-repo]))
        graph-parsing-state (state/sub [:graph/parsing-state current-repo])]
    (cond
      (or
       (:graph-loading? graph-parsing-state)
       (not= (:total graph-parsing-state) (:finished graph-parsing-state)))
      [:div.flex.items-center.justify-center.full-height-without-header
       [:div.flex-1
        (parsing-progress graph-parsing-state)]]

      :else
      [:div
       (cond
         (and default-home
              (= :home (state/get-current-route))
              (not (state/route-has-p?))
              (:page default-home))
         (route-handler/redirect-to-page! (:page default-home))

         (or (not (state/enable-journals? current-repo))
             (let [latest-journals (db/get-latest-journals (state/get-current-repo) 1)]
               (and config/publishing?
                    (not default-home)
                    (empty? latest-journals))))
         (route-handler/redirect! {:to :all-pages})

         loading-files?
         (ui/loading (t :loading-files))

         :else
         (journal/all-journals))])))

(defn- hide-context-menu-and-clear-selection
  [e & {:keys [esc?]}]
  (state/hide-custom-context-menu!)
  (when-not (or (gobj/get e "shiftKey")
                (util/meta-key? e)
                (state/get-edit-input-id)
                (some-> (.-target e) util/input?)
                (= (shui-dialog/get-last-modal-id) :property-dialog)
                (some-> (.-target e) (.closest ".ls-block"))
                (some-> (.-target e) (.closest "[data-keep-selection]")))
    (if (and esc? (editor-handler/popup-exists? :selection-action-bar))
      (state/pub-event! [:editor/hide-action-bar])
      (editor-handler/clear-selection!))))

(rum/defc render-custom-context-menu
  [links position]
  (let [ref (rum/use-ref nil)]
    (hooks/use-effect!
     #(let [el (rum/deref ref)
            {:keys [x y]} (util/calc-delta-rect-offset el js/document.documentElement)]
        (set! (.. el -style -transform)
              (str "translate3d(" (if (neg? x) x 0) "px," (if (neg? y) (- y 10) 0) "px" ",0)"))))
    [:<>
     [:div.menu-backdrop {:on-pointer-down (fn [e] (hide-context-menu-and-clear-selection e))}]
     [:div#custom-context-menu
      {:ref ref
       :style {:z-index 999
               :left (str (first position) "px")
               :top (str (second position) "px")}} links]]))

(rum/defc custom-context-menu < rum/reactive
  []
  (let [show? (state/sub :custom-context-menu/show?)
        links (state/sub :custom-context-menu/links)
        position (state/sub :custom-context-menu/position)]
    (when (and show? links position)
      (render-custom-context-menu links position))))

(rum/defc new-block-mode < rum/reactive
  []
  (when (state/sub [:document/mode?])
    (ui/tooltip
     [:a.block.px-1.text-sm.font-medium.bg-base-2.rounded-md.mx-2
      {:on-click state/toggle-document-mode!}
      "D"]
     [:div.p-2
      [:p.mb-2 [:b "Document mode"]]
      [:ul
       [:li
        [:div.inline-block.mr-1 (ui/render-keyboard-shortcut (shortcut-dh/gen-shortcut-seq :editor/new-line))]
        [:p.inline-block "to create new block"]]
       [:li
        [:p.inline-block.mr-1 "Click `D` or type"]
        [:div.inline-block.mr-1 (ui/render-keyboard-shortcut (shortcut-dh/gen-shortcut-seq :ui/toggle-document-mode))]
        [:p.inline-block "to toggle document mode"]]]])))

(def help-menu-items
  [{:title "Handbook" :icon "book-2" :on-click #(handbooks/toggle-handbooks)}
   {:title "Keyboard shortcuts" :icon "command" :on-click #(state/sidebar-add-block! (state/get-current-repo) "shortcut-settings" :shortcut-settings)}
   {:title "Documentation" :icon "help" :href "https://docs.logseq.com/"}
   :hr
   {:title "Report bug" :icon "bug" :on-click #(rfe/push-state :bug-report)}
   {:title "Request feature" :icon "git-pull-request" :href "https://discuss.logseq.com/c/feedback/feature-requests/"}
   {:title "Submit feedback" :icon "messages" :href "https://discuss.logseq.com/c/feedback/13"}
   :hr
   {:title "Ask the community" :icon "brand-discord" :href "https://discord.com/invite/KpN4eHY"}
   {:title "Support forum" :icon "message" :href "https://discuss.logseq.com/"}
   :hr
   {:title "Release notes" :icon "asterisk" :href "https://docs.logseq.com/#/page/changelog"}])

(rum/defc help-menu-popup
  []

  (hooks/use-effect!
   (fn []
     (state/set-state! :ui/handbooks-open? false))
   [])

  (hooks/use-effect!
   (fn []
     (let [h #(state/set-state! :ui/help-open? false)]
       (.addEventListener js/document.body "click" h)
       #(.removeEventListener js/document.body "click" h)))
   [])

  [:div.cp__sidebar-help-menu-popup
   [:div.list-wrap
    (for [[idx {:keys [title icon href on-click] :as item}] (medley/indexed help-menu-items)]
      (case item
        :hr
        [:hr.my-2 {:key idx}]

        ;; default
        [:a.it.flex.items-center.px-4.py-1.select-none
         {:key title
          :on-click (fn []
                      (cond
                        (fn? on-click) (on-click)
                        (string? href) (util/open-url href))
                      (state/set-state! :ui/help-open? false))}
         [:span.flex.items-center.pr-2.opacity-40 (ui/icon icon {:size 20})]
         [:strong.font-normal title]]))]
   [:div.ft.pl-11.pb-3
    [:span.opacity.text-xs.opacity-30 "Logseq " version]]])

(rum/defc help-button < rum/reactive
  []
  (let [help-open? (state/sub :ui/help-open?)
        handbooks-open? (state/sub :ui/handbooks-open?)]
    [:<>
     [:div.cp__sidebar-help-btn
      [:div.inner
       {:title (t :help-shortcut-title)
        :on-click #(state/toggle! :ui/help-open?)}
       [:svg.scale-125 {:stroke "currentColor", :fill "none", :stroke-linejoin "round", :width "24", :view-box "0 0 24 24", :xmlns "http://www.w3.org/2000/svg", :stroke-linecap "round", :stroke-width "2", :class "icon icon-tabler icon-tabler-help-small", :height "24"}
        [:path {:stroke "none", :d "M0 0h24v24H0z", :fill "none"}]
        [:path {:d "M12 16v.01"}]
        [:path {:d "M12 13a2 2 0 0 0 .914 -3.782a1.98 1.98 0 0 0 -2.414 .483"}]]]]

     (when help-open?
       (help-menu-popup))

     (when handbooks-open?
       (handbooks/handbooks-popup))]))

(rum/defc app-context-menu-observer
  < rum/static
  (mixins/event-mixin
   (fn [state]
        ;; fixme: this mixin will register global event listeners on window
        ;; which might cause unexpected issues
     (mixins/listen state js/window "contextmenu"
                    (fn [^js e]
                      (let [target (gobj/get e "target")
                            block-el (.closest target ".bullet-container[blockid]")
                            block-id (some-> block-el (.getAttribute "blockid"))
                            {:keys [block block-ref]} (state/sub :block-ref/context)
                            {:keys [page page-entity]} (state/sub :page-title/context)]

                        (let [show!
                              (fn [content & {:as option}]
                                (shui/popup-show! e
                                                  (fn [{:keys [id]}]
                                                    [:div {:on-click #(shui/popup-hide! id)
                                                           :data-keep-selection true}
                                                     content])
                                                  (merge
                                                   {:on-before-hide state/dom-clear-selection!
                                                    :on-after-hide state/state-clear-selection!
                                                    :content-props {:class "w-[280px] ls-context-menu-content"}
                                                    :as-dropdown? true}
                                                   option)))

                              handled
                              (cond
                                (and page (not block-id))
                                (do
                                  (show! (cp-content/page-title-custom-context-menu-content page-entity))
                                  (state/set-state! :page-title/context nil))

                                block-ref
                                (do
                                  (show! (cp-content/block-ref-custom-context-menu-content block block-ref))
                                  (state/set-state! :block-ref/context nil))

                                ;; block selection
                                (and (state/selection?) (not (d/has-class? target "bullet")))
                                (show! (cp-content/custom-context-menu-content)
                                       {:id :blocks-selection-context-menu})

                                ;; block bullet
                                (and block-id (parse-uuid block-id))
                                (let [block (.closest target ".ls-block")
                                      property-default-value? (when block
                                                                (= "true" (d/attr block "data-is-property-default-value")))]
                                  (when block
                                    (state/clear-selection!)
                                    (state/conj-selection-block! block :down))
                                  (p/do!
                                   (db-async/<get-block (state/get-current-repo) (uuid block-id) {:children? false})
                                   (show! (cp-content/block-context-menu-content target (uuid block-id) property-default-value?))))

                                :else
                                false)]
                          (when (not (false? handled))
                            (util/stop e))))))))
  []
  nil)

(defn- on-mouse-up
  [e]
  (when-not (or (.closest (.-target e) ".block-control-wrap")
                (.closest (.-target e) "button")
                (.closest (.-target e) "input")
                (.closest (.-target e) "textarea")
                (.closest (.-target e) "a"))
    (editor-handler/show-action-bar!)))

(rum/defcs ^:large-vars/cleanup-todo root-container < rum/reactive
  (mixins/event-mixin
   (fn [state]
     (mixins/listen state js/window "pointerdown" hide-context-menu-and-clear-selection)
     (mixins/listen state js/window "keydown"
                    (fn [e]
                      (cond
                        (= 27 (.-keyCode e))
                        (if (and (state/modal-opened?)
                                 (not
                                  (and
                                                                          ;; FIXME: this does not work on CI tests
                                   util/node-test?
                                   (state/editing?))))
                          (state/close-modal!)
                          (hide-context-menu-and-clear-selection e {:esc? true})))
                      (state/set-ui-last-key-code! (.-key e))))
     (mixins/listen state js/window "keyup"
                    (fn [_e]
                      (state/set-state! :editor/latest-shortcut nil)))))
  [state route-match main-content']
  (let [current-repo (state/sub :git/current-repo)
        theme (state/sub :ui/theme)
        accent-color (some-> (state/sub :ui/radix-color) (name))
        editor-font (some-> (state/sub :ui/editor-font) (name))
        system-theme? (state/sub :ui/system-theme?)
        light? (= "light" (state/sub :ui/theme))
        sidebar-open? (state/sub :ui/sidebar-open?)
        settings-open? (state/sub :ui/settings-open?)
        left-sidebar-open? (state/sub :ui/left-sidebar-open?)
        wide-mode? (state/sub :ui/wide-mode?)
        ls-block-hl-colored? (state/sub :pdf/block-highlight-colored?)
        onboarding-state (state/sub :file-sync/onboarding-state)
        right-sidebar-blocks (state/sub-right-sidebar-blocks)
        route-name (get-in route-match [:data :name])
        margin-less-pages? (or (boolean (#{:graph} route-name))
                               (db-model/whiteboard-page? (state/get-current-page)))
        db-restoring? (state/sub :db/restoring?)
        page? (= :page route-name)
        home? (= :home route-name)
        native-titlebar? (state/sub [:electron/user-cfgs :window/native-titlebar?])
        window-controls? (and (util/electron?) (not util/mac?) (not native-titlebar?))
        edit? (state/editing?)
        default-home (app-left-sidebar/get-default-home-if-valid)
        logged? (user-handler/logged-in?)
        fold-button-on-right? (state/enable-fold-button-right?)
        show-action-bar? (state/sub :mobile/show-action-bar?)
        preferred-language (state/sub [:preferred-language])]
    (theme/container
     {:t t
      :theme theme
      :accent-color accent-color
      :editor-font editor-font
      :route route-match
      :current-repo current-repo
      :edit? edit?

      :db-restoring? db-restoring?
      :sidebar-open? sidebar-open?
      :settings-open? settings-open?
      :sidebar-blocks-len (count right-sidebar-blocks)
      :system-theme? system-theme?
      :onboarding-state onboarding-state
      :preferred-language preferred-language
      :on-click (fn [e]
                  (editor-handler/unhighlight-blocks!)
                  (util/fix-open-external-with-shift! e))}

     [:main.theme-container-inner#app-container-wrapper
      {:class (util/classnames
               [{:ls-left-sidebar-open left-sidebar-open?
                 :ls-right-sidebar-open sidebar-open?
                 :ls-wide-mode wide-mode?
                 :ls-window-controls window-controls?
                 :ls-fold-button-on-right fold-button-on-right?
                 :ls-hl-colored ls-block-hl-colored?}])
       :on-pointer-up (fn []
                        (when-let [container (gdom/getElement "app-container-wrapper")]
                          (d/remove-class! container "blocks-selection-mode")
                          (when (and (> (count (state/get-selection-blocks)) 1)
                                     (not (util/input? js/document.activeElement)))
                            (util/clear-selection!))))}

      [:button#skip-to-main
       {:on-click #(ui/focus-element (ui/main-node))
        :on-key-up (fn [e]
                     (when (= "Enter" (.-key e))
                       (ui/focus-element (ui/main-node))))}
       (t :accessibility/skip-to-main-content)]
      [:div.#app-container
       {:on-mouse-up on-mouse-up}
       [:div#left-container
        {:class (if (state/sub :ui/sidebar-open?) "overflow-hidden" "w-full")}
        (header/header {:light? light?
                        :current-repo current-repo
                        :logged? logged?
                        :page? page?
                        :route-match route-match
                        :default-home default-home
                        :new-block-mode new-block-mode})
        (when (util/electron?)
          (find-in-page/search))

        (if (state/sub :rtc/uploading?)
          [:div.flex.items-center.justify-center.full-height-without-header
           (ui/loading "Creating remote graph...")]
          (main {:route-match route-match
                 :margin-less-pages? margin-less-pages?
                 :logged? logged?
                 :home? home?
                 :route-name route-name
                 :light? light?
                 :db-restoring? db-restoring?
                 :main-content main-content'
                 :show-action-bar? show-action-bar?}))]

       (when window-controls?
         (window-controls/container))

       (right-sidebar/sidebar)

       [:div#app-single-container]]

      (ui/notification)

      (shui-toaster/install-toaster)
      (shui-dialog/install-modals)
      (shui-popup/install-popups)

      (custom-context-menu)
      (plugins/custom-js-installer
       {:t t
        :current-repo current-repo
        :db-restoring? db-restoring?})
      (app-context-menu-observer)

      [:a#download.hidden]
      [:a#download-as-edn-v2.hidden]
      [:a#download-as-json-v2.hidden]
      [:a#download-as-transit-debug.hidden]
      [:a#download-as-sqlite-db.hidden]
      [:a#download-as-db-edn.hidden]
      [:a#download-as-roam-json.hidden]
      [:a#download-as-html.hidden]
      [:a#download-as-zip.hidden]
      [:a#export-as-markdown.hidden]
      [:a#export-as-opml.hidden]
      [:a#convert-markdown-to-unordered-list-or-heading.hidden]
      (when (and (not config/mobile?)
                 (not config/publishing?))
        (help-button))])))
