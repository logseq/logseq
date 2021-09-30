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
            [frontend.components.modals :refer [show-new-page-modal!]]
            [frontend.config :as config]
            [frontend.context.i18n :as i18n]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.components.svg :as svg]
            [frontend.db-mixins :as db-mixins]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.route :as route-handler]
            [frontend.mixins :as mixins]
            [frontend.modules.shortcut.data-helper :as shortcut-dh]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [reitit.frontend.easy :as rfe]
            [goog.dom :as gdom]
            [rum.core :as rum]))

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
   [:div.hd
    {:on-click (fn [^js/MouseEvent e]
                 (let [^js target (.-target e)
                       ^js parent (.closest target ".nav-content-item")]
                   (.toggle (.-classList parent) "is-expand")))}

    [:strong.text-lg name]
    [:span.flex.items-center
     (when (fn? edit-fn)
       [:a.edit {:on-click edit-fn} (svg/icon-editor)])
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

(rum/defc favorite-contents
  < rum/reactive db-mixins/query
  []

  (nav-content-item
   "Favorites"

   {:class "favorites"
    :edit-fn
    (fn [e]
      (rfe/push-state :page {:name "Favorites"})
      (util/stop e))}

   (let [blocks (let [page-eid (:db/id (db-model/get-page "Favorites"))]
                  (filterv
                   #(= page-eid (:db/id (:block/parent %)))
                   (db-model/get-page-blocks "Favorites")))]

     [:ul
      (for [it blocks
            :let [name (pick-one-ast-page-ref it)]
            :when (not (string/blank? name))]
        [:li {:key (:block/uuid it)}
         [:a
          {:href (rfe/href :page {:name name})} name]])])))

(rum/defc recent-contents
  < rum/reactive db-mixins/query
  []

  (nav-content-item
    "Recent Pages"

    {:class "recent"}

    (let [pages (state/sub :editor/recent-pages)]

      [:ul
       (for [name pages]
         [:li {:key name}
          [:a {:href (rfe/href :page {:name name})} name]])])))

(rum/defc sidebar-nav < rum/reactive
  [route-match close-modal-fn]
  (let [active? (fn [route] (= route (get-in route-match [:data :name])))
        page-active? (fn [page]
                       (= page (get-in route-match [:parameters :path :name])))
        left-sidebar? (state/sub :ui/left-sidebar-open?)]

    (when left-sidebar?
      [:nav.left-sidebar-inner
       (nav-content-item
         "Shortcuts"
         nil
         [:div.shortcut-links
          [:div.wrap
           [:div.item [:a.link {:href (rfe/href :all-journals) :title "Journals"} (ui/icon "calendar")]]
           [:div.item [:a.link {:on-click #(state/pub-event! [:modal/show-cards]) :title "SRS cards"} (ui/icon "versions")]]
           [:div.item [:a.link {:href (rfe/href :graph) :title "Graph views"} (ui/icon "hierarchy")]]
           [:div.item [:a.link {:href (rfe/href :all-pages) :title "All pages"} (ui/icon "files")]]]])

       [:div.shortcut-cnts
        (favorite-contents)
        (recent-contents)]

       [:div.shortcut-acts

        (ui/button "+ New Page"
                   :intent "logseq"
                   :class "new-page"
                   :on-click #(show-new-page-modal!))]])))

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
       [:button#close-left-bar.close-panel-btn.flex.items-center.justify-center.h-12.w-12.rounded-full.focus:outline-none.focus:bg-gray-600
        {:on-click close-fn}
        [:svg.h-6.w-6
         {:viewBox "0 0 24 24", :fill "none", :stroke "currentColor"}
         [:path
          {:d "M6 18L18 6M6 6l12 12"
           :stroke-width "2"
           :stroke-linejoin "round"
           :stroke-linecap "round"}]]]])
    [:div.flex-shrink-0.flex.items-center.px-4.h-16.head-wrap
     (repo/repos-dropdown nil close-fn)]
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
         [:div#sidebar-nav-wrapper.cp__sidebar-left-layout
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
                 (db/entity [:block/name (string/lower-case page)]))]
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
                   (let [page (string/lower-case page)
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
        [:a#download.hidden]
        (when
         (and (not config/mobile?)
              (not config/publishing?))
          (help-button))]))))
