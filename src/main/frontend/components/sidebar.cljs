(ns frontend.components.sidebar
  (:require [cljs-drag-n-drop.core :as dnd]
            [clojure.string :as string]
            [frontend.components.command-palette :as command-palette]
            [frontend.components.header :as header]
            [frontend.components.journal :as journal]
            [frontend.components.repo :as repo]
            [frontend.components.right-sidebar :as right-sidebar]
            [frontend.components.settings :as settings]
            [frontend.components.theme :as theme]
            [frontend.components.widgets :as widgets]
            [frontend.components.plugins :as plugins]
            [frontend.config :as config]
            [frontend.context.i18n :as i18n]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.db.react :as db-react]
            [frontend.components.svg :as svg]
            [frontend.db-mixins :as db-mixins]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.page :as page-handler]
            [frontend.mixins :as mixins]
            [frontend.modules.shortcut.data-helper :as shortcut-dh]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [reitit.frontend.easy :as rfe]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [rum.core :as rum]
            [frontend.extensions.srs :as srs]
            [frontend.extensions.pdf.assets :as pdf-assets]))

(defn nav-item
  [title href svg-d active? close-modal-fn]
  [:a.mb-1.group.flex.items-center.pl-4.py-2.text-base.leading-6.font-medium.hover:text-gray-200.transition.ease-in-out.duration-150.nav-item
   {:href href
    :on-click close-modal-fn}
   [:svg.mr-4.h-6.w-6.group-hover:text-gray-200.group-focus:text-gray-200.transition.ease-in-out.duration-150
    {:viewBox "0 0 24 24", :fill "none", :stroke "currentColor"}
    [:path
     {:d svg-d
      :stroke-width "2"
      :stroke-linejoin "round"
      :stroke-linecap "round"}]]
   title])

(rum/defc nav-content-item
  [name {:keys [edit-fn class] :as opts} child]

  [:div.nav-content-item.is-expand
   {:class class}
   [:div.hd.items-center.mb-2
    {:on-click (fn [^js/MouseEvent e]
                 (let [^js target (.-target e)
                       ^js parent (.closest target ".nav-content-item")]
                   (.toggle (.-classList parent) "is-expand")))}

    [:a.font-medium.fade-link name]
    [:span
     [:a.more svg/arrow-down-v2]]]
   [:div.bd child]])

;; TODO: enhance
(defn- pick-one-ast-page-ref
  [block]
  (when-let [title-ast (and block (:block/title block))]
    (when-let [link-ref (and (= (ffirst title-ast) "Link")
                             (:url (second (first title-ast))))]
      (when (= "Page_ref" (first link-ref))
        (second link-ref)))))

(defn- delta-y
  [e]
  (let [rect (.. (.. e -target) getBoundingClientRect)]
    (- (.. e -pageY) (.. rect -top))))

(defn- move-up?
  [e]
  (let [delta (delta-y e)]
    (< delta 14)))

(rum/defc page-name
  [name]
  (let [original-name (db-model/get-page-original-name name)]
    [:a {:on-click (fn [e]
                     (util/stop e)
                     (let [name (util/safe-lower-case name)]
                       (if (gobj/get e "shiftKey")
                         (when-let [page-entity (db/entity [:block/name name])]
                           (state/sidebar-add-block!
                            (state/get-current-repo)
                            (:db/id page-entity)
                            :page
                            {:page page-entity}))
                         (route-handler/redirect! {:to :page
                                                   :path-params {:name name}}))))}
     (pdf-assets/fix-local-asset-filename original-name)]))

(rum/defcs favorite-item <
  (rum/local nil ::up?)
  (rum/local nil ::dragging-over)
  [state t name]
  (let [up? (get state ::up?)
        dragging-over (get state ::dragging-over)
        target (state/sub :favorites/dragging)]
    [:li.favorite-item
     {:key name
      :class (if (and target @dragging-over (not= target @dragging-over))
               "dragging-target"
               "")
      :draggable true
      :on-drag-start (fn [event]
                       (state/set-state! :favorites/dragging name))
      :on-drag-over (fn [e]
                      (util/stop e)
                      (reset! dragging-over name)
                      (when-not (= name (get @state/state :favorites/dragging))
                        (reset! up? (move-up? e))))
      :on-drag-leave (fn [e]
                       (reset! dragging-over nil))
      :on-drop (fn [e]
                 (page-handler/reorder-favorites! {:to name
                                                   :up? (move-up? e)})
                 (reset! up? nil)
                 (reset! dragging-over nil))}
     (page-name name)]))

(rum/defc favorites < rum/reactive
  [t]
  (nav-content-item
   [:a.flex.items-center.text-sm.font-medium.rounded-md
    (ui/icon "star mr-1" {:style {:font-size 18}})
    [:span.flex-1.uppercase {:style {:padding-top 2}}
     (t :left-side-bar/nav-favorites)]]

   {:class "favorites"
    :edit-fn
    (fn [e]
      (rfe/push-state :page {:name "Favorites"})
      (util/stop e))}

   (let [favorites (->> (:favorites (state/sub-graph-config))
                        (remove string/blank?)
                        (filter string?))]
     (when (seq favorites)
       [:ul.favorites
        (for [name favorites]
          (when-not (string/blank? name)
            (when (db/entity [:block/name (util/safe-lower-case name)])
                (favorite-item t name))))]))))

(rum/defc recent-pages
  < rum/reactive db-mixins/query
  [t]
  (nav-content-item
   [:a.flex.items-center.text-sm.font-medium.rounded-md
    (ui/icon "history mr-1" {:style {:font-size 18}})
    [:span.flex-1.uppercase {:style {:padding-top 2}}
     (t :left-side-bar/nav-recent-pages)]]

   {:class "recent"}

   (let [pages (->> (db/sub-key-value :recent/pages)
                    (remove string/blank?)
                    (filter string?))]
     [:ul
      (for [name pages]
        (when (db/entity [:block/name (util/safe-lower-case name)])
          [:li {:key name}
           (page-name name)]))])))

(rum/defcs flashcards < db-mixins/query rum/reactive
  {:did-mount (fn [state]
                (js/setTimeout
                 (fn []
                   (let [total (srs/get-srs-cards-total)]
                     (state/set-state! :srs/cards-due-count total)))
                 200)
                state)}
  [state]
  (let [num (state/sub :srs/cards-due-count)]
    [:a.item.group.flex.items-center.px-2.py-2.text-sm.font-medium.rounded-md {:on-click #(state/pub-event! [:modal/show-cards])}
     (ui/icon "infinity mr-3" {:style {:font-size 20}})
     [:span.flex-1 "Flashcards"]
     (when (and num (not (zero? num)))
       [:span.ml-3.inline-block.py-0.5.px-3.text-xs.font-medium.rounded-full.fade-in num])]))

(rum/defc sidebar-nav < rum/reactive
  [route-match close-modal-fn]
  (rum/with-context [[t] i18n/*tongue-context*]
    (let [active? (fn [route] (= route (get-in route-match [:data :name])))
          page-active? (fn [page]
                         (= page (get-in route-match [:parameters :path :name])))
          left-sidebar? (state/sub :ui/left-sidebar-open?)]
      (when left-sidebar?
        [:div.left-sidebar-inner.flex-1.flex.flex-col.min-h-0
         [:div.flex.flex-col.pb-4.wrap
          [:nav.flex-1.px-2.space-y-1 {:aria-label "Sidebar"}
           (repo/repos-dropdown)
           [:a.item.group.flex.items-center.px-2.py-2.text-sm.font-medium.rounded-md {:on-click route-handler/go-to-journals!}
            (ui/icon "calendar mr-3" {:style {:font-size 20}})
            [:span.flex-1 "Journals"]]

           (flashcards)

           [:a.item.group.flex.items-center.px-2.py-2.text-sm.font-medium.rounded-md {:href (rfe/href :graph)}
            (ui/icon "hierarchy mr-3" {:style {:font-size 20}})
            [:span.flex-1 "Graph view"]]

           [:a.item.group.flex.items-center.px-2.py-2.text-sm.font-medium.rounded-md {:href (rfe/href :all-pages)}
            (ui/icon "files mr-3" {:style {:font-size 20}})
            [:span.flex-1 "All pages"]]]

          (favorites t)

          (recent-pages t)]]))))

(rum/defc sidebar-mobile-sidebar < rum/reactive
  [{:keys [open? close-fn route-match]}]
  [:div.md:hidden
   [:div.fixed.inset-0.z-30.bg-gray-600.pointer-events-none.ease-linear.duration-300
    {:class (if @open?
              "opacity-75 pointer-events-auto"
              "opacity-0 pointer-events-none")
     :on-click close-fn}]
   [:div#left-bar.fixed.inset-y-0.left-0.flex.flex-col.z-40.w-full.transform.ease-in-out.duration-300
    {:class (if @open?
              "translate-x-0"
              "-translate-x-full")
     :style {:max-width "86vw"}}
    (when @open?
      [:div.absolute.top-0.right-0.p-1
       [:a.button
        {:on-click close-fn}
        (ui/icon "x" {:style {:font-size 24}})]])
    [:div.flex-1.h-0.overflow-y-auto
     (sidebar-nav route-match close-fn)]]])

(rum/defc main <
  {:did-mount (fn [state]
                (when-let [element (gdom/getElement "main-content")]
                  (dnd/subscribe!
                   element
                   :upload-files
                   {:drop (fn [e files]
                            (when-let [id (state/get-edit-input-id)]
                              (let [format (:block/format (state/get-edit-block))]
                                (editor-handler/upload-asset id files format editor-handler/*asset-uploading? true))))}))
                state)}
  [{:keys [route-match global-graph-pages? logged? home? route-name indexeddb-support? white? db-restoring? main-content]}]

  (let [left-sidebar-open? (state/sub :ui/left-sidebar-open?)
        mobile? (util/mobile?)]
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div#main-content.cp__sidebar-main-layout.flex-1.flex
       {:class (util/classnames [{:is-left-sidebar-open left-sidebar-open?}])}

       ;; desktop left sidebar layout
       (when-not mobile?
         [:div#sidebar-nav-wrapper.cp__sidebar-left-layout.overflow-y-auto.h-full
          {:class (util/classnames [{:is-open left-sidebar-open?}])}

          ;; sidebar contents
          (sidebar-nav route-match nil)])

       [:div#main-content-container.w-full.flex.justify-center
        [:div.cp__sidebar-main-content
         {:data-is-global-graph-pages global-graph-pages?
          :data-is-full-width         (or global-graph-pages?
                                          (contains? #{:all-files :all-pages :my-publishing} route-name))}
         (cond
           (not indexeddb-support?)
           nil

           db-restoring?
           [:div.mt-20
            [:div.ls-center
             (ui/loading (t :loading))]]

           :else
           [:div.pb-24 {:class (if global-graph-pages? "" (util/hiccup->class "max-w-7xl.mx-auto"))
                        :style {:margin-bottom (if global-graph-pages? 0 120)}}
            main-content])]]])))

(rum/defc footer
  []
  (when-let [user-footer (and config/publishing? (get-in (state/get-config) [:publish-common-footer]))]
    [:div.p-6 user-footer]))

(defn get-default-home-if-valid
  []
  (when-let [default-home (state/get-default-home)]
    (let [page (:page default-home)
          page (when (and (string? page)
                          (not (string/blank? page)))
                 (db/entity [:block/name (util/safe-lower-case page)]))]
      (if page
        default-home
        (dissoc default-home :page)))))

(defonce sidebar-inited? (atom false))
;; TODO: simplify logic

(rum/defc main-content < rum/reactive db-mixins/query
  {:init (fn [state]
           (when-not @sidebar-inited?
             (let [current-repo (state/sub :git/current-repo)
                   default-home (get-default-home-if-valid)
                   sidebar (:sidebar default-home)
                   sidebar (if (string? sidebar) [sidebar] sidebar)]
               (when-let [pages (->> (seq sidebar)
                                     (remove string/blank?))]
                 (doseq [page pages]
                   (let [page (util/safe-lower-case page)
                         [db-id block-type] (if (= page "contents")
                                              ["contents" :contents]
                                              [page :page])]
                     (state/sidebar-add-block! current-repo db-id block-type nil)))
                 (reset! sidebar-inited? true))))
           state)}
  []
  (let [today (state/sub :today)
        cloning? (state/sub :repo/cloning?)
        default-home (get-default-home-if-valid)
        importing-to-db? (state/sub :repo/importing-to-db?)
        loading-files? (state/sub :repo/loading-files?)
        me (state/sub :me)
        journals-length (state/sub :journals-length)
        current-repo (state/sub :git/current-repo)
        latest-journals (db/get-latest-journals (state/get-current-repo) journals-length)
        preferred-format (state/sub [:me :preferred_format])
        logged? (:name me)]
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div
       (cond
         (and default-home
              (= :home (state/get-current-route))
              (not (state/route-has-p?))
              (:page default-home))
         (route-handler/redirect! {:to :page
                                   :path-params {:name (:page default-home)}})

         (and config/publishing?
              (not default-home)
              (empty? latest-journals))
         (route-handler/redirect! {:to :all-pages})

         importing-to-db?
         (ui/loading (t :parsing-files))

         loading-files?
         (ui/loading (t :loading-files))

         (and (not logged?) (seq latest-journals))
         (journal/journals latest-journals)

         (and logged? (not preferred-format))
         (widgets/choose-preferred-format)

                         ;; TODO: delay this
         (and logged? (nil? (:email me)))
         (settings/set-email)

         cloning?
         (ui/loading (t :cloning))

         (seq latest-journals)
         (journal/journals latest-journals)

         (and logged? (empty? (:repos me)))
         (widgets/add-graph)

                         ;; FIXME: why will this happen?
         :else
         [:div])])))

(rum/defc custom-context-menu < rum/reactive
  []
  (when (state/sub :custom-context-menu/show?)
    (when-let [links (state/sub :custom-context-menu/links)]
      (ui/css-transition
       {:class-names "fade"
        :timeout {:enter 500
                  :exit 300}}
       links
        ;; (custom-context-menu-content)
))))

(rum/defc new-block-mode < rum/reactive
  []
  (when (state/sub [:document/mode?])
    (ui/tippy {:html [:div.p-2
                      [:p.mb-2 [:b "Document mode"]]
                      [:ul
                       [:li
                        [:div.inline-block.mr-1 (ui/keyboard-shortcut (shortcut-dh/gen-shortcut-seq :editor/new-line))]
                        [:p.inline-block  "to create new block"]]
                       [:li
                        [:p.inline-block.mr-1 "Click `D` or type"]
                        [:div.inline-block.mr-1 (ui/keyboard-shortcut (shortcut-dh/gen-shortcut-seq :ui/toggle-document-mode))]
                        [:p.inline-block "to toggle document mode"]]]]}
              [:a.block.px-1.text-sm.font-medium.bg-base-2.rounded-md.mx-2
               {:on-click state/toggle-document-mode!}
               "D"])))

(rum/defc help-button < rum/reactive
  []
  (when-not (state/sub :ui/sidebar-open?)
    ;; TODO: remove with-context usage
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div.cp__sidebar-help-btn
       {:title (t :help-shortcut-title)
        :on-click (fn []
                    (state/sidebar-add-block! (state/get-current-repo) "help" :help nil))}
       "?"])))

(rum/defc settings-modal < rum/reactive
  []
  (let [settings-open? (state/sub :ui/settings-open?)]
    (if settings-open?
      (do
        (state/set-modal!
         (fn [] [:div.settings-modal (settings/settings)]))
        (util/lock-global-scroll settings-open?))
      (state/set-modal! nil))
    nil))

(defn- hide-context-menu-and-clear-selection
  []
  (state/hide-custom-context-menu!)
  (editor-handler/clear-selection!))

(rum/defcs sidebar <
  (mixins/modal :modal/show?)
  rum/reactive
  (mixins/event-mixin
   (fn [state]
     (mixins/listen state js/window "click" hide-context-menu-and-clear-selection)
     (mixins/listen state js/window "keydown"
                    (fn [e]
                      (when (= 27 (.-keyCode e))
                        (if (state/modal-opened?)
                          (state/close-modal!)
                          (hide-context-menu-and-clear-selection)))))))
  [state route-match main-content]
  (let [{:keys [open? close-fn open-fn]} state
        close-fn (fn []
                   (close-fn)
                   (state/set-left-sidebar-open! false))
        me (state/sub :me)
        current-repo (state/sub :git/current-repo)
        granted? (state/sub [:nfs/user-granted? (state/get-current-repo)])
        theme (state/sub :ui/theme)
        system-theme? (state/sub :ui/system-theme?)
        white? (= "white" (state/sub :ui/theme))
        sidebar-open?  (state/sub :ui/sidebar-open?)
        left-sidebar-open?  (state/sub :ui/left-sidebar-open?)
        right-sidebar-blocks (state/sub :sidebar/blocks)
        route-name (get-in route-match [:data :name])
        global-graph-pages? (= :graph route-name)
        logged? (:name me)
        db-restoring? (state/sub :db/restoring?)
        indexeddb-support? (state/sub :indexeddb/support?)
        page? (= :page route-name)
        home? (= :home route-name)
        default-home (get-default-home-if-valid)]
    (rum/with-context [[t] i18n/*tongue-context*]
      (theme/container
       {:t             t
        :theme         theme
        :route         route-match
        :current-repo  current-repo
        :nfs-granted?  granted?
        :db-restoring? db-restoring?
        :sidebar-open? sidebar-open?
        :sidebar-blocks-len (count right-sidebar-blocks)
        :system-theme? system-theme?
        :on-click      (fn [e]
                         (editor-handler/unhighlight-blocks!)
                         (util/fix-open-external-with-shift! e))}

       [:div.theme-inner
        {:class (util/classnames [{:ls-left-sidebar-open left-sidebar-open?}])}

        (sidebar-mobile-sidebar
         {:open?       open?
          :close-fn    close-fn
          :route-match route-match})

        [:div.#app-container.h-screen.flex
         [:div.flex-1.h-full.flex.flex-col#left-container.relative
          {:class (if (state/sub :ui/sidebar-open?) "overflow-hidden" "w-full")}
          (header/header {:open-fn        open-fn
                          :white?         white?
                          :current-repo   current-repo
                          :logged?        logged?
                          :page?          page?
                          :route-match    route-match
                          :me             me
                          :default-home   default-home
                          :new-block-mode new-block-mode})

          [:div#main-container.scrollbar-spacing
           (main {:route-match         route-match
                  :global-graph-pages? global-graph-pages?
                  :logged?             logged?
                  :home?               home?
                  :route-name          route-name
                  :indexeddb-support?  indexeddb-support?
                  :white?              white?
                  :db-restoring?       db-restoring?
                  :main-content        main-content})]

          (footer)]
         (right-sidebar/sidebar)

         [:div#app-single-container]]

        (ui/notification)
        (ui/modal)
        (settings-modal)
        (command-palette/command-palette-modal)
        (custom-context-menu)
        (plugins/custom-js-installer {:t t
                                      :current-repo current-repo
                                      :nfs-granted? granted?
                                      :db-restoring? db-restoring?})
        [:a#download.hidden]
        (when
         (and (not config/mobile?)
              (not config/publishing?))
          (help-button))]))))
