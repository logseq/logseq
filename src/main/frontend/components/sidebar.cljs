(ns frontend.components.sidebar
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.mixins :as mixins]
            [frontend.db-mixins :as db-mixins]
            [frontend.db :as db]
            [frontend.components.widgets :as widgets]
            [frontend.components.journal :as journal]
            [frontend.components.page :as page]
            [frontend.components.settings :as settings]
            [frontend.components.svg :as svg]
            [frontend.components.repo :as repo]
            [frontend.components.commit :as commit]
            [frontend.components.header :as header]
            [frontend.components.right-sidebar :as right-sidebar]
            [frontend.storage :as storage]
            [frontend.util :as util]
            [frontend.state :as state]
            [frontend.handler.user :as user-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.export :as export]
            [frontend.config :as config]
            [frontend.keyboards :as keyboards]
            [dommy.core :as d]
            [clojure.string :as string]
            [goog.object :as gobj]
            [frontend.context.i18n :as i18n]
            [reitit.frontend.easy :as rfe]
            [goog.dom :as gdom]))

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

(rum/defc sidebar-nav < rum/reactive
  [route-match close-modal-fn]
  (let [white? (= "white" (state/sub :ui/theme))
        active? (fn [route] (= route (get-in route-match [:data :name])))
        page-active? (fn [page]
                       (= page (get-in route-match [:parameters :path :name])))
        right-sidebar? (state/sub :ui/sidebar-open?)
        left-sidebar? (state/sub :ui/left-sidebar-open?)]
    (when left-sidebar?
      [:nav.flex-1.left-sidebar-inner
       (nav-item "Journals" "/"
                 "M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10M9 21h6"
                 (active? :home)
                 close-modal-fn)
       (nav-item "All Pages" "/all-pages"
                 "M6 2h9a1 1 0 0 1 .7.3l4 4a1 1 0 0 1 .3.7v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4c0-1.1.9-2 2-2zm9 2.41V7h2.59L15 4.41zM18 9h-3a2 2 0 0 1-2-2V4H6v16h12V9zm-2 7a1 1 0 0 1-1 1H9a1 1 0 0 1 0-2h6a1 1 0 0 1 1 1zm0-4a1 1 0 0 1-1 1H9a1 1 0 0 1 0-2h6a1 1 0 0 1 1 1zm-5-4a1 1 0 0 1-1 1H9a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1z"
                 (active? :all-pages)
                 close-modal-fn)
       (when-not config/publishing?
         (nav-item "All Files" "/all-files"
                   "M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H13L11 5H5C3.89543 5 3 5.89543 3 7Z"
                   (active? :all-files)
                   close-modal-fn))
       (when-not right-sidebar?
         [:div.pl-4.pr-4 {:style {:height 1
                                  :background-color (if white? "#f0f8ff" "#073642")
                                  :margin 12}}])
       (right-sidebar/contents)])))

(rum/defc sidebar-mobile-sidebar < rum/reactive
  [{:keys [open? close-fn route-match]}]
  [:div.md:hidden
   [:div.fixed.inset-0.z-30.bg-gray-600.opacity-0.pointer-events-none.transition-opacity.ease-linear.duration-300
    {:class (if @open?
              "opacity-75 pointer-events-auto"
              "opacity-0 pointer-events-none")
     :on-click close-fn}]
   [:div#left-bar.fixed.inset-y-0.left-0.flex.flex-col.z-40.max-w-xs.w-full.transform.ease-in-out.duration-300
    {:class (if @open?
              "translate-x-0"
              "-translate-x-full")
     :style {:background-color "#002b36"}}
    (if @open?
      [:div.absolute.top-0.right-0.-mr-14.p-1
       [:button#close-left-bar.flex.items-center.justify-center.h-12.w-12.rounded-full.focus:outline-none.focus:bg-gray-600
        {:on-click close-fn}
        [:svg.h-6.w-6.text-white
         {:viewBox "0 0 24 24", :fill "none", :stroke "currentColor"}
         [:path
          {:d "M6 18L18 6M6 6l12 12"
           :stroke-width "2"
           :stroke-linejoin "round"
           :stroke-linecap "round"}]]]])
    [:div.flex-shrink-0.flex.items-center.px-4.h-16 {:style {:background-color "#002b36"}}
     (repo/repos-dropdown false nil)]
    [:div.flex-1.h-0.overflow-y-auto
     (sidebar-nav route-match close-fn)]]])

(rum/defc sidebar-main
  [{:keys [route-match global-graph-pages? logged? home? route-name indexeddb-support? white? db-restoring? main-content]}]
  (rum/with-context [[t] i18n/*tongue-context*]
    [:div#main-content.cp__sidebar-main-layout
     (when-not config/mobile?
       [:div#sidebar-nav-wrapper.flex-col.pt-4.hidden.sm:block
        {:style {:flex (if (state/get-left-sidebar-open?)
                         "0 1 20%"
                         "0 0 0px")
                 :border-right (str "1px solid "
                                    (if white? "#f0f8ff" "#073642"))}}
        (when (state/sub :ui/left-sidebar-open?)
          (sidebar-nav route-match nil))])
     [:div#main-content-container.cp__sidebar-main-content-container
      [:div.cp__sidebar-main-content
       {:data-is-global-graph-pages global-graph-pages?
        :data-is-full-width (or global-graph-pages?
                                (and (not logged?)
                                     home?)
                                (contains? #{:all-files :all-pages} route-name))}
       (cond
         (not indexeddb-support?)
         nil

         db-restoring?
         [:div.mt-20
          [:div.ls-center
           (ui/loading (t :loading))]]

         :else
         [:div {:style {:margin-bottom (if global-graph-pages? 0 120)}}
          main-content])]]
     (when-not config/mobile?
       (right-sidebar/sidebar))]))

(defn get-default-home-if-valid
  []
  (when-let [default-home (state/get-default-home)]
    (when-let [page (:page default-home)]
      (when (db/entity [:page/name (string/lower-case page)])
        default-home))))

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
                                     (remove nil?))]
                 (let [blocks (remove nil? pages)]
                   (doseq [page pages]
                     (let [page (string/lower-case page)
                           [db-id block-type] (if (= page "contents")
                                                ["contents" :contents]
                                                [page :page])]
                       (state/sidebar-add-block! current-repo db-id block-type nil))))
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
        logged? (:name me)
        token (state/sub :encrypt/token)
        ;; TODO: remove this
        daily-migrating? (state/sub [:daily/migrating?])]
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div.max-w-7xl.mx-auto
       (cond
         daily-migrating?
         (ui/loading "Migrating to daily notes")

         (and default-home
              (= :home (state/get-current-route))
              (not (state/route-has-p?)))
         (route-handler/redirect! {:to :page
                                   :path-params {:name (:page default-home)}})

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

         importing-to-db?
         (ui/loading (t :parsing-files))

         loading-files?
         (ui/loading (t :loading-files))

         (and logged? (empty? (:repos me)))
         (widgets/add-repo)

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
  (when-let [alt-enter? (= "alt+enter" (state/sub [:shortcuts :editor/new-block]))]
    [:a.px-1.text-sm.font-medium.bg-base-2.mr-4.rounded-md
     {:title "Click to switch to \"Enter\" for creating new block"
      :on-click state/toggle-new-block-shortcut!}
     "A"]))

(rum/defc help-button < rum/reactive
  []
  (when-not (state/sub :ui/sidebar-open?)
    ;; TODO: remove with-context usage
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div.cp__sidebar-help
       {:title (t :help-shortcut-title)
        :on-click (fn []
                    (state/sidebar-add-block! (state/get-current-repo) "help" :help nil))}
       "?"])))

(rum/defcs sidebar <
  (mixins/modal :modal/show?)
  rum/reactive
  ;; TODO: move this to keyboards
  (mixins/event-mixin
   (fn [state]
     (mixins/listen state js/window "click"
                    (fn [e]
                      ;; hide context menu
                      (state/hide-custom-context-menu!)

                      (if-not (state/get-selection-start-block)
                        (editor-handler/clear-selection! e)
                        (state/set-selection-start-block! nil))))

     (mixins/on-key-down
      state
      {;; esc
       27 (fn [_state e]
            (editor-handler/clear-selection! e))

       ;; shift+up
       38 (fn [state e]
            (editor-handler/on-select-block state e true))

       ;; shift+down
       40 (fn [state e]
            (editor-handler/on-select-block state e false))

       ;; ?
       191 (fn [state e]
             (when-not (util/input? (gobj/get e "target"))
               (state/sidebar-add-block! (state/get-current-repo) "help" :help nil)))
       ;; c
       67 (fn [state e]
            (when (and (not (util/input? (gobj/get e "target")))
                       (not (gobj/get e "shiftKey"))
                       (not (gobj/get e "ctrlKey"))
                       (not (gobj/get e "altKey"))
                       (not (gobj/get e "metaKey")))
              (when-let [repo-url (state/get-current-repo)]
                (when-not (state/get-edit-input-id)
                  (util/stop e)
                  (state/set-modal! commit/add-commit-message)))))})))
  {:did-mount (fn [state]
                (keyboards/bind-shortcuts!)
                state)}
  (mixins/keyboards-mixin keyboards/keyboards)
  [state route-match main-content]
  (let [{:keys [open? close-fn open-fn]} state
        close-fn (fn []
                   (close-fn)
                   (state/set-left-sidebar-open! false))
        me (state/sub :me)
        current-repo (state/sub :git/current-repo)
        theme (state/sub :ui/theme)
        white? (= "white" (state/sub :ui/theme))
        sidebar-open? (state/sub :ui/sidebar-open?)
        route-name (get-in route-match [:data :name])
        global-graph-pages? (= :graph route-name)
        logged? (:name me)
        db-restoring? (state/sub :db/restoring?)
        indexeddb-support? (state/sub :indexeddb/support?)
        page? (= :page route-name)
        home? (= :home route-name)
        default-home (get-default-home-if-valid)]
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div {:class (if white? "white-theme" "dark-theme")
             :on-click editor-handler/unhighlight-block!}
       (sidebar-mobile-sidebar {:open? open?
                                :close-fn close-fn
                                :route-match route-match})

       [:div.#app-container.cp__sidebar-layout
        {:class (if sidebar-open? "is-right-sidebar-open")}
        (header/header {:open-fn open-fn
                        :white? white?
                        :current-repo current-repo
                        :logged? logged?
                        :page? page?
                        :route-match route-match
                        :me me
                        :default-home default-home
                        :new-block-mode new-block-mode})

        (sidebar-main {:route-match route-match
                       :global-graph-pages? global-graph-pages?
                       :logged? logged?
                       :home? home?
                       :route-name route-name
                       :indexeddb-support? indexeddb-support?
                       :white? white?
                       :db-restoring? db-restoring?
                       :main-content main-content})]

       (ui/notification)
       (ui/modal)
       (custom-context-menu)
       [:a#download.hidden]
       (when (and (not config/mobile?)
                  (not config/publishing?))
         (help-button)
         ;; [:div.font-bold.absolute.bottom-4.bg-base-2.rounded-full.h-8.w-8.flex.items-center.justify-center.font-bold.cursor.opacity-70.hover:opacity-100
         ;;  {:style {:left 24}
         ;;   :title "Click to show/hide sidebar"
         ;;   :on-click (fn []
         ;;               (state/set-left-sidebar-open! (not (state/get-left-sidebar-open?))))}
         ;;  (if (state/sub :ui/left-sidebar-open?) "<" ">")]
)])))
