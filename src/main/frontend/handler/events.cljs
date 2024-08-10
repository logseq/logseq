(ns frontend.handler.events
  "System-component-like ns that defines named events and listens on a
  core.async channel to handle them. Any part of the system can dispatch
  one of these events using state/pub-event!"
  (:refer-clojure :exclude [run!])
  (:require ["@capacitor/filesystem" :refer [Directory Filesystem]]
            ["@sentry/react" :as Sentry]
            [cljs-bean.core :as bean]
            [clojure.core.async :as async]
            [clojure.core.async.interop :refer [p->c]]
            [clojure.set :as set]
            [clojure.string :as string]
            [frontend.commands :as commands]
            [frontend.components.class :as class-component]
            [frontend.components.cmdk.core :as cmdk]
            [frontend.components.settings :as settings]
            [frontend.components.diff :as diff]
            [frontend.components.encryption :as encryption]
            [frontend.components.file-sync :as file-sync]
            [frontend.components.git :as git-component]
            [frontend.components.plugins :as plugin]
            [frontend.components.shell :as shell]
            [frontend.components.whiteboard :as whiteboard]
            [frontend.components.user.login :as login]
            [frontend.components.repo :as repo]
            [frontend.components.db-based.page :as db-page]
            [frontend.components.property.dialog :as property-dialog]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [logseq.shui.ui :as shui]
            [frontend.db :as db]
            [frontend.db.conn :as conn]
            [frontend.db.model :as db-model]
            [frontend.db.persist :as db-persist]
            [frontend.db.transact :as db-transact]
            [frontend.extensions.srs :as srs]
            [frontend.fs :as fs]
            [frontend.fs.capacitor-fs :as capacitor-fs]
            [frontend.fs.nfs :as nfs]
            [frontend.fs.sync :as sync]
            [frontend.fs.watcher-handler :as fs-watcher]
            [frontend.handler.common :as common-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.file :as file-handler]
            [frontend.handler.file-sync :as file-sync-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.common.page :as page-common-handler]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.repo-config :as repo-config-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.search :as search-handler]
            [frontend.handler.shell :as shell-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.user :as user-handler]
            [frontend.handler.property.util :as pu]
            [frontend.handler.db-based.property.util :as db-pu]
            [frontend.handler.property :as property-handler]
            [frontend.handler.file-based.nfs :as nfs-handler]
            [frontend.handler.code :as code-handler]
            [frontend.handler.db-based.rtc :as rtc-handler]
            [frontend.handler.graph :as graph-handler]
            [frontend.mobile.core :as mobile]
            [frontend.mobile.graph-picker :as graph-picker]
            [frontend.mobile.util :as mobile-util]
            [frontend.modules.instrumentation.posthog :as posthog]
            [frontend.modules.instrumentation.sentry :as sentry-event]
            [frontend.modules.shortcut.core :as st]
            [frontend.quick-capture :as quick-capture]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.persist-var :as persist-var]
            [goog.dom :as gdom]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [promesa.core :as p]
            [lambdaisland.glogi :as log]
            [rum.core :as rum]
            [frontend.rum :as r]
            [frontend.persist-db.browser :as db-browser]
            [frontend.modules.outliner.pipeline :as pipeline]
            [frontend.date :as date]
            [logseq.db :as ldb]
            [frontend.persist-db :as persist-db]))

;; TODO: should we move all events here?

(defmulti handle first)

(defn file-sync-restart! []
  (async/go (async/<! (p->c (persist-var/load-vars)))
    (async/<! (sync/<sync-stop))
    (some-> (sync/<sync-start) async/<!)))

(defn- file-sync-stop! []
  (async/go (async/<! (p->c (persist-var/load-vars)))
    (async/<! (sync/<sync-stop))))

(defn- enable-beta-features!
  []
  (when-not (false? (state/enable-sync?)) ; user turns it off
    (file-sync-handler/set-sync-enabled! true)))

(defmethod handle :user/fetch-info-and-graphs [[_]]
  (state/set-state! [:ui/loading? :login] false)
  (async/go
    (let [result (async/<! (sync/<user-info sync/remoteapi))]
      (cond
        (instance? ExceptionInfo result)
        nil
        (map? result)
        (do
          (state/set-user-info! result)
          (when-let [uid (user-handler/user-uuid)]
            (sentry-event/set-user! uid))
          (let [status (if (user-handler/alpha-or-beta-user?) :welcome :unavailable)]
            (when (and (= status :welcome) (user-handler/logged-in?))
              (enable-beta-features!)
              (async/<! (rtc-handler/<get-remote-graphs))
              (async/<! (file-sync-handler/load-session-graphs))
              (p/let [repos (repo-handler/refresh-repos!)]
                (when-let [repo (state/get-current-repo)]
                  (when (some #(and (= (:url %) repo)
                                    (vector? (:sync-meta %))
                                    (util/uuid-string? (first (:sync-meta %)))
                                    (util/uuid-string? (second (:sync-meta %)))) repos)
                    (sync/<sync-start)))))
            (ui-handler/re-render-root!)
            (file-sync/maybe-onboarding-show status)))))))

(defmethod handle :user/logout [[_]]
  (file-sync-handler/reset-session-graphs)
  (sync/remove-all-pwd!)
  (file-sync-handler/reset-user-state!)
  (login/sign-out!))

(defmethod handle :user/login [[_ host-ui?]]
  (if (or host-ui? (not util/electron?))
    (js/window.open config/LOGIN-URL)
    (if (mobile-util/native-platform?)
      (route-handler/redirect! {:to :user-login})
      (login/open-login-modal!))))

(defmethod handle :graph/added [[_ repo {:keys [empty-graph?]}]]
  (search-handler/rebuild-indices!)
  (plugin-handler/hook-plugin-app :graph-after-indexed {:repo repo :empty-graph? empty-graph?})
  (route-handler/redirect-to-home!)
  (when-let [dir-name (and (not (config/db-based-graph? repo)) (config/get-repo-dir repo))]
    (fs/watch-dir! dir-name))
  (file-sync-restart!))

(defmethod handle :init/commands [_]
  (page-handler/init-commands!))

(defmethod handle :graph/unlinked [repo current-repo]
  (when (= (:url repo) current-repo)
    (file-sync-restart!)))

;; FIXME(andelf): awful multi-arty function.
;; Should use a `-impl` function instead of the awful `skip-ios-check?` param with nested callback.
(defn- graph-switch
  ([graph]
   (graph-switch graph false))
  ([graph skip-ios-check?]
   (let [db-based? (config/db-based-graph? graph)]
     (if (and (mobile-util/native-ios?) (not skip-ios-check?))
       (state/pub-event! [:validate-appId graph-switch graph])
       (do
         (state/set-current-repo! graph)
         (page-handler/init-commands!)
         ;; load config
         (repo-config-handler/restore-repo-config! graph)
         (when-not (= :draw (state/get-current-route))
           (route-handler/redirect-to-home!))
         (srs/update-cards-due-count!)
         (state/pub-event! [:graph/ready graph])
         (if db-based?
           (rtc-handler/<rtc-start! graph)
           (file-sync-restart!))
         (when-let [dir-name (and (not db-based?) (config/get-repo-dir graph))]
           (fs/watch-dir! dir-name))
         (graph-handler/settle-metadata-to-local! {:last-seen-at (js/Date.now)}))))))

;; Parameters for the `persist-db` function, to show the notification messages
(defn- graph-switch-on-persisted
  "graph: the target graph to switch to"
  [graph opts]
  (p/do!
   (repo-handler/restore-and-setup-repo! graph)
   (graph-switch graph)
   (state/set-state! :sync-graph/init? false)
   (when (:rtc-download? opts)
     (and (search-handler/rebuild-indices!) true)
     (repo-handler/refresh-repos!))))

(defmethod handle :graph/switch [[_ graph opts]]
  (persist-db/export-current-graph!)
  (state/set-state! :db/async-query-loading #{})
  (state/set-state! :db/async-queries {})
  (st/refresh!)
  (reset! r/*key->atom {})

  (let [^js sqlite @db-browser/*worker]
    (p/let [writes-finished? (when sqlite (.file-writes-finished? sqlite (state/get-current-repo)))
            request-finished? (db-transact/request-finished?)]
      (if (not writes-finished?) ; TODO: test (:sync-graph/init? @state/state)
        (do
          (log/info :graph/switch (cond->
                                   {:request-finished? request-finished?
                                    :file-writes-finished? writes-finished?}
                                    (false? request-finished?)
                                    (assoc :unfinished-requests? @db-transact/*unfinished-request-ids)))
          (notification/show!
           "Please wait seconds until all changes are saved for the current graph."
           :warning))
        (graph-switch-on-persisted graph opts)))))

(defmethod handle :graph/pull-down-remote-graph [[_ graph dir-name]]
  (if (mobile-util/native-ios?)
    (when-let [graph-name (or dir-name (:GraphName graph))]
      (let [graph-name (util/safe-sanitize-file-name graph-name)]
        (if (string/blank? graph-name)
          (notification/show! "Illegal graph folder name.")

          ;; Create graph directory under Logseq document folder (local)
          (when-let [root (state/get-local-container-root-url)]
            (let [graph-path (graph-picker/validate-graph-dirname root graph-name)]
              (->
                (p/let [exists? (fs/dir-exists? graph-path)]
                  (let [overwrite? (if exists?
                                     (js/confirm (str "There's already a directory with the name \"" graph-name "\", do you want to overwrite it? Make sure to backup it first if you're not sure about it."))
                                     true)]
                    (if overwrite?
                      (p/let [_ (fs/mkdir-if-not-exists graph-path)]
                        (nfs-handler/ls-dir-files-with-path!
                          graph-path
                          {:ok-handler (fn []
                                         (file-sync-handler/init-remote-graph graph-path graph)
                                         (js/setTimeout (fn [] (repo-handler/refresh-repos!)) 200))}))
                      (let [graph-name (-> (js/prompt "Please specify a new directory name to download the graph:")
                                         str
                                         string/trim)]
                        (when-not (string/blank? graph-name)
                          (state/pub-event! [:graph/pull-down-remote-graph graph graph-name]))))))
                (p/catch (fn [^js e]
                           (notification/show! (str e) :error)
                           (js/console.error e)))))))))
    (shui/dialog-open!
      (file-sync/pick-dest-to-sync-panel graph))))

(defmethod handle :graph/pick-page-histories [[_ graph-uuid page-name]]
  (shui/dialog-open!
    (file-sync/pick-page-histories-panel graph-uuid page-name)
    {:id :page-histories :label "modal-page-histories"}))

(defmethod handle :graph/open-new-window [[_ev target-repo]]
  (p/let [current-repo (state/get-current-repo)]
    (ui-handler/open-new-window-or-tab! current-repo target-repo)))

(defmethod handle :graph/migrated [[_ _repo]]
  (js/alert "Graph migrated."))

(defn get-local-repo
  []
  (when-let [repo (state/get-current-repo)]
    (when (config/local-file-based-graph? repo)
      repo)))

(defn ask-permission
  [repo]
  (when
   (and (not (util/electron?))
     (not (mobile-util/native-platform?)))
    (fn [{:keys [close]}]
      [:div
       ;; TODO: fn translation with args
       [:p
        "Grant native filesystem permission for directory: "
        [:b (config/get-local-dir repo)]]
       (ui/button
         (t :settings-permission/start-granting)
         :class "ui__modal-enter"
         :on-click (fn []
                     (nfs/check-directory-permission! repo)
                     (close)))])))

(defmethod handle :modal/nfs-ask-permission []
  (when-let [repo (get-local-repo)]
    (some-> (ask-permission repo)
      (shui/dialog-open! {:align :top}))))

(defonce *query-properties (atom {}))
(rum/defc query-properties-settings-inner < rum/reactive
  {:will-unmount (fn [state]
                   (reset! *query-properties {})
                   state)}
  [block shown-properties all-properties]
  (let [query-properties (rum/react *query-properties)
        db-graph? (config/db-based-graph? (state/get-current-repo))]
    [:div
     [:h1.font-semibold.-mt-2.mb-2.text-lg (t :query/config-property-settings)]
     [:a.flex
      {:title "Refresh list of columns"
       :on-click
       (fn []
         (reset! *query-properties {})
         (let [k (pu/get-pid :logseq.property/query-properties)]
           (property-handler/remove-block-property! (state/get-current-repo) (:block/uuid block) k)))}
      (ui/icon "refresh")]
     (for [property all-properties]
       (let [property-value (get query-properties property)
             shown? (if (nil? property-value)
                      (contains? shown-properties property)
                      property-value)]
         [:div.flex.flex-row.my-2.justify-between.align-items
          [:div (if (and db-graph? (qualified-keyword? property))
                  (db-pu/get-property-name property)
                  (name property))]
          [:div.mt-1 (ui/toggle shown?
                                (fn []
                                  (let [value (not shown?)]
                                    (swap! *query-properties assoc property value)
                                    (editor-handler/set-block-query-properties!
                                     (:block/uuid block)
                                     all-properties
                                     property
                                     value)))
                                true)]]))]))

(defn query-properties-settings
  [block shown-properties all-properties]
  (fn [_close-fn]
    (query-properties-settings-inner block shown-properties all-properties)))

(defmethod handle :modal/set-query-properties [[_ block all-properties]]
  (let [properties (:block/properties block)
        query-properties (pu/lookup properties :logseq.property/query-properties)
        block-properties (if (config/db-based-graph? (state/get-current-repo))
                           query-properties
                           (some-> query-properties
                             (common-handler/safe-read-string "Parsing query properties failed")))
        shown-properties (if (seq block-properties)
                           (set block-properties)
                           (set all-properties))
        shown-properties (set/intersection (set all-properties) shown-properties)]
    (shui/dialog-open!
      (query-properties-settings block shown-properties all-properties)
      {})))

(defmethod handle :modal/show-cards [_]
  (shui/dialog-open!
    srs/global-cards
    {:id :srs
     :label "flashcards__cp"}))

(defmethod handle :modal/show-instruction [_]
  (shui/dialog-open!
    capacitor-fs/instruction
    {:id :instruction
     :label "instruction__cp"}))

(defmethod handle :modal/show-themes-modal [[_ classic?]]
  (if classic?
    (plugin/open-select-theme!)
    (route-handler/go-to-search! :themes)))

(defmethod handle :modal/toggle-appearance-modal [_]
  (let [label "customize-appearance"]
    (if (shui/dialog-get label)
      (shui/dialog-close! label)
      (shui/dialog-open!
        #(settings/modal-appearance-inner)
        {:id      label
         :overlay-props {:label label}
         :label   label}))))

(defmethod handle :modal/set-git-username-and-email [[_ _content]]
  (shui/dialog-open! git-component/set-git-username-and-email))

(defmethod handle :page/create [[_ page-name opts]]
  (if (= page-name (date/today))
    (page-handler/create-today-journal!)
    (page-handler/<create! page-name opts)))

(defmethod handle :page/deleted [[_ repo page-name file-path tx-meta]]
  (page-common-handler/after-page-deleted! repo page-name file-path tx-meta))

(defmethod handle :page/renamed [[_ repo data]]
  (page-common-handler/after-page-renamed! repo data))

(defmethod handle :page/create-today-journal [[_ _repo]]
  (p/let [_ (page-handler/create-today-journal!)]
    (ui-handler/re-render-root!)))

(defmethod handle :file/not-matched-from-disk [[_ path disk-content db-content]]
  (when-let [repo (state/get-current-repo)]
    (shui/dialog-open!
      #(diff/local-file repo path disk-content db-content)
      {:label "diff__cp"})))


(defmethod handle :modal/display-file-version-selector  [[_ versions path  get-content]]
  (shui/dialog-open!
    #(git-component/file-version-selector versions path get-content)))

(defmethod handle :graph/sync-context []
  (let [context {:dev? config/dev?
                 :node-test? util/node-test?
                 :validate-db-options (:dev/validate-db-options (state/get-config))
                 :importing? (:graph/importing @state/state)
                 :date-formatter (state/get-date-formatter)
                 :journal-file-name-format (or (state/get-journal-file-name-format)
                                               date/default-journal-filename-formatter)
                 :export-bullet-indentation (state/get-export-bullet-indentation)
                 :preferred-format (state/get-preferred-format)
                 :journals-directory (config/get-journals-directory)
                 :whiteboards-directory (config/get-whiteboards-directory)
                 :pages-directory (config/get-pages-directory)}
        worker ^Object @state/*db-worker]
    (when worker (.set-context worker (ldb/write-transit-str context)))))

;; Hook on a graph is ready to be shown to the user.
;; It's different from :graph/restored, as :graph/restored is for window reloaded
;; FIXME: config may not be loaded when the graph is ready.
(defmethod handle :graph/ready
  [[_ repo]]
  (when (config/local-file-based-graph? repo)
    (p/let [dir               (config/get-repo-dir repo)
            dir-exists?       (fs/dir-exists? dir)]
      (when (and (not dir-exists?)
                 (not util/nfs?))
        (state/pub-event! [:graph/dir-gone dir]))))
  (p/do!
   (state/pub-event! [:graph/sync-context])
    ;; re-render-root is async and delegated to rum, so we need to wait for main ui to refresh
   (when (mobile-util/native-ios?)
     (js/setTimeout #(mobile/mobile-postinit) 1000))
    ;; FIXME: an ugly implementation for redirecting to page on new window is restored
   (repo-handler/graph-ready! repo)
   (when-not (config/db-based-graph? repo)
     (fs-watcher/load-graph-files! repo))))

(defmethod handle :notification/show [[_ {:keys [content status clear?]}]]
  (notification/show! content status clear?))

(defmethod handle :command/run [_]
  (when (util/electron?)
    (shui/dialog-open! shell/shell)))

(defmethod handle :go/search [_]
  (state/set-modal! cmdk/cmdk-modal
    {:fullscreen? true
     :close-btn?  false
     :panel?      false
     :label "ls-modal-search"}))

(defmethod handle :go/plugins [_]
  (plugin/open-plugins-modal!))

(defmethod handle :go/plugins-waiting-lists [_]
  (plugin/open-waiting-updates-modal!))

(defmethod handle :go/plugins-from-file [[_ plugins]]
  (plugin/open-plugins-from-file-modal! plugins))

(defmethod handle :go/plugins-settings [[_ pid nav? title]]
  (when pid
    (state/set-state! :plugin/focused-settings pid)
    (state/set-state! :plugin/navs-settings? (not (false? nav?)))
    (plugin/open-focused-settings-modal! title)))

(defmethod handle :go/proxy-settings [[_ agent-opts]]
  (shui/dialog-open!
    (plugin/user-proxy-settings-panel agent-opts)
    {:id :https-proxy-panel :center? true :class "lg:max-w-2xl"}))


(defmethod handle :redirect-to-home [_]
  (page-handler/create-today-journal!))

(defmethod handle :instrument [[_ {:keys [type payload] :as opts}]]
  (when-not (empty? (dissoc opts :type :payload))
    (js/console.error "instrument data-map should only contains [:type :payload]"))
  (posthog/capture type payload))

(defmethod handle :capture-error [[_ {:keys [error payload]}]]
  (let [[user-uuid graph-uuid tx-id] @sync/graphs-txid
        payload (assoc payload
                  :user-id user-uuid
                  :graph-id graph-uuid
                  :tx-id tx-id)]
    (Sentry/captureException error
      (bean/->js {:tags payload}))))

(defmethod handle :exec-plugin-cmd [[_ {:keys [pid cmd action]}]]
  (commands/exec-plugin-simple-command! pid cmd action))

(defmethod handle :shortcut-handler-refreshed [[_]]
  (when-not @st/*pending-inited?
    (reset! st/*pending-inited? true)
    (st/consume-pending-shortcuts!)))

(defmethod handle :mobile/keyboard-will-show [[_ keyboard-height]]
  (let [main-node (util/app-scroll-container-node)]
    (state/set-state! :mobile/show-tabbar? false)
    (state/set-state! :mobile/show-toolbar? true)
    (state/set-state! :mobile/show-action-bar? false)
    (when (= (state/sub :editor/record-status) "RECORDING")
      (state/set-state! :mobile/show-recording-bar? true))
    (when (mobile-util/native-ios?)
      (reset! util/keyboard-height keyboard-height)
      (set! (.. main-node -style -marginBottom) (str keyboard-height "px"))
      (when-let [^js html (js/document.querySelector ":root")]
        (.setProperty (.-style html) "--ls-native-kb-height" (str keyboard-height "px"))
        (.add (.-classList html) "has-mobile-keyboard"))
      (when-let [left-sidebar-node (gdom/getElement "left-sidebar")]
        (set! (.. left-sidebar-node -style -bottom) (str keyboard-height "px")))
      (when-let [right-sidebar-node (gdom/getElementByClass "sidebar-item-list")]
        (set! (.. right-sidebar-node -style -paddingBottom) (str (+ 150 keyboard-height) "px")))
      (when-let [card-preview-el (js/document.querySelector ".cards-review")]
        (set! (.. card-preview-el -style -marginBottom) (str keyboard-height "px")))
      (when-let [card-preview-el (js/document.querySelector ".encryption-password")]
        (set! (.. card-preview-el -style -marginBottom) (str keyboard-height "px")))
      (js/setTimeout (fn []
                       (when-let [toolbar (.querySelector main-node "#mobile-editor-toolbar")]
                         (set! (.. toolbar -style -bottom) (str keyboard-height "px"))))
        100))))

(defmethod handle :mobile/keyboard-will-hide [[_]]
  (let [main-node (util/app-scroll-container-node)]
    (state/set-state! :mobile/show-toolbar? false)
    (state/set-state! :mobile/show-tabbar? true)
    (when (= (state/sub :editor/record-status) "RECORDING")
      (state/set-state! :mobile/show-recording-bar? false))
    (when (mobile-util/native-ios?)
      (when-let [^js html (js/document.querySelector ":root")]
        (.removeProperty (.-style html) "--ls-native-kb-height")
        (.remove (.-classList html) "has-mobile-keyboard"))
      (when-let [card-preview-el (js/document.querySelector ".cards-review")]
        (set! (.. card-preview-el -style -marginBottom) "0px"))
      (when-let [card-preview-el (js/document.querySelector ".encryption-password")]
        (set! (.. card-preview-el -style -marginBottom) "0px"))
      (set! (.. main-node -style -marginBottom) "0px")
      (when-let [left-sidebar-node (gdom/getElement "left-sidebar")]
        (set! (.. left-sidebar-node -style -bottom) "0px"))
      (when-let [right-sidebar-node (gdom/getElementByClass "sidebar-item-list")]
        (set! (.. right-sidebar-node -style -paddingBottom) "150px"))
      (when-let [toolbar (.querySelector main-node "#mobile-editor-toolbar")]
        (set! (.. toolbar -style -bottom) 0)))))

(defn- get-ios-app-id
  [repo-url]
  (when repo-url
    (let [app-id (-> (first (string/split repo-url "/Documents"))
                   (string/split "/")
                   last)]
      app-id)))

(defmethod handle :validate-appId [[_ graph-switch-f graph]]
  (when-let [deprecated-repo (or graph (state/get-current-repo))]
    (if (mobile-util/in-iCloud-container-path? deprecated-repo)
      ;; Installation is not changed for iCloud
      (when graph-switch-f
        (graph-switch-f graph true)
        (state/pub-event! [:graph/ready (state/get-current-repo)]))
      ;; Installation is changed for App Documents directory
      (p/let [deprecated-app-id (get-ios-app-id deprecated-repo)
              current-document-url (.getUri Filesystem #js {:path ""
                                                            :directory (.-Documents Directory)})
              current-app-id (-> (js->clj current-document-url :keywordize-keys true)
                               get-ios-app-id)]
        (if (= deprecated-app-id current-app-id)
          (when graph-switch-f (graph-switch-f graph true))
          (do
            (notification/show! [:div "Migrating from previous App installation..."]
              :warning
              true)
            (prn ::migrate-app-id :from deprecated-app-id :to current-app-id)
            (file-sync-stop!)
            (.unwatch mobile-util/fs-watcher)
            (let [current-repo (string/replace deprecated-repo deprecated-app-id current-app-id)
                  current-repo-dir (config/get-repo-dir current-repo)]
              (try
                ;; replace app-id part of repo url
                (reset! conn/conns
                  (update-keys @conn/conns
                    (fn [key]
                      (if (string/includes? key deprecated-app-id)
                        (string/replace key deprecated-app-id current-app-id)
                        key))))
                (db-persist/rename-graph! deprecated-repo current-repo)
                (search/remove-db! deprecated-repo)
                (state/add-repo! {:url current-repo :nfs? true})
                (state/delete-repo! {:url deprecated-repo})
                (catch :default e
                  (js/console.error e)))
              (state/set-current-repo! current-repo)
              (repo-config-handler/restore-repo-config! current-repo)
              (when graph-switch-f (graph-switch-f current-repo true))
              (.watch mobile-util/fs-watcher #js {:path current-repo-dir})
              (file-sync-restart!))))
        (state/pub-event! [:graph/ready (state/get-current-repo)])))))

(defmethod handle :plugin/consume-updates [[_ id prev-pending? updated?]]
  (let [downloading?   (:plugin/updates-downloading? @state/state)
        auto-checking? (plugin-handler/get-auto-checking?)]
    (when-let [coming (and (not downloading?)
                        (get-in @state/state [:plugin/updates-coming id]))]
      (let [error-code (:error-code coming)
            error-code (if (= error-code (str :no-new-version)) nil error-code)
            title      (:title coming)]
        (when (and prev-pending? (not auto-checking?))
          (if-not error-code
            (plugin/set-updates-sub-content! (str title "...") 0)
            (notification/show!
              (str "[Checked]<" title "> " error-code) :error)))))

    (if (and updated? downloading?)
      ;; try to start consume downloading item
      (if-let [next-coming (state/get-next-selected-coming-update)]
        (plugin-handler/check-or-update-marketplace-plugin!
          (assoc next-coming :only-check false :error-code nil)
          (fn [^js e] (js/console.error "[Download Err]" next-coming e)))
        (plugin-handler/close-updates-downloading))

      ;; try to start consume pending item
      (if-let [next-pending (second (first (:plugin/updates-pending @state/state)))]
        (do
          (println "Updates: take next pending - " (:id next-pending))
          (js/setTimeout
            #(plugin-handler/check-or-update-marketplace-plugin!
               (assoc next-pending :only-check true :auto-check auto-checking? :error-code nil)
               (fn [^js e]
                 (notification/show! (.toString e) :error)
                 (js/console.error "[Check Err]" next-pending e))) 500))

        ;; try to open waiting updates list
        (do (when (and prev-pending? (not auto-checking?)
                    (seq (state/all-available-coming-updates)))
              (plugin/open-waiting-updates-modal!))
            (plugin-handler/set-auto-checking! false))))))

(defmethod handle :plugin/hook-db-tx [[_ {:keys [blocks tx-data] :as payload}]]
  (when-let [payload (and (seq blocks)
                       (merge payload {:tx-data (map #(into [] %) tx-data)}))]
    (plugin-handler/hook-plugin-db :changed payload)
    (plugin-handler/hook-plugin-block-changes payload)))

(defmethod handle :plugin/loader-perf-tip [[_ {:keys [^js o _s _e]}]]
  (when-let [opts (.-options o)]
    (notification/show!
      (plugin/perf-tip-content (.-id o) (.-name opts) (.-url opts))
      :warning false (.-id o))))

(defmethod handle :mobile-file-watcher/changed [[_ ^js event]]
  (let [type (.-event event)
        payload (js->clj event :keywordize-keys true)]
    (fs-watcher/handle-changed! type payload)
    (when (file-sync-handler/enable-sync?)
      (sync/file-watch-handler type payload))))

(defmethod handle :rebuild-slash-commands-list [[_]]
  (page-handler/rebuild-slash-commands-list!))

(defmethod handle :shortcut/refresh [[_]]
  (st/refresh!))

(defn- refresh-cb []
  (page-handler/create-today-journal!)
  (file-sync-restart!))

(defmethod handle :graph/ask-for-re-fresh [_]
  (shui/dialog-open!
    [:div {:style {:max-width 700}}
     [:p (t :sync-from-local-changes-detected)]
     [:div.flex.justify-end
      (ui/button
        (t :yes)
        :autoFocus "on"
        :class "ui__modal-enter"
        :on-click (fn []
                    (shui/dialog-close!)
                    (nfs-handler/refresh! (state/get-current-repo) refresh-cb)))]]))

(defmethod handle :sync/create-remote-graph [[_ current-repo]]
  (let [graph-name (js/decodeURI (util/node-path.basename current-repo))]
    (async/go
      (async/<! (sync/<sync-stop))
      (state/set-state! [:ui/loading? :graph/create-remote?] true)
      (when-let [GraphUUID (get (async/<! (file-sync-handler/create-graph graph-name)) 2)]
        (async/<! (sync/<sync-start))
        (state/set-state! [:ui/loading? :graph/create-remote?] false)
        ;; update existing repo
        (state/set-repos! (map (fn [r]
                                 (if (= (:url r) current-repo)
                                   (assoc r
                                     :GraphUUID GraphUUID
                                     :GraphName graph-name
                                     :remote? true)
                                   r))
                            (state/get-repos)))))))

(defmethod handle :modal/remote-encryption-input-pw-dialog [[_ repo-url remote-graph-info type opts]]
  (shui/dialog-open!
    (encryption/input-password
      repo-url nil (merge
                     (assoc remote-graph-info
                       :type (or type :create-pwd-remote)
                       :repo repo-url)
                     opts))
    {:center? true :close-btn? false :close-backdrop? false}))

(defmethod handle :journal/insert-template [[_ page-name]]
  (let [page-name (util/page-name-sanity-lc page-name)]
    (when-let [page (db/get-page page-name)]
      (when (db/page-empty? (state/get-current-repo) page-name)
        (when-let [template (state/get-default-journal-template)]
          (editor-handler/insert-template!
           nil
           template
           {:target page}))))))

(defmethod handle :editor/set-org-mode-heading [[_ block heading]]
  (when-let [id (:block/uuid block)]
    (editor-handler/set-heading! id heading)))

(defmethod handle :file-sync-graph/restore-file [[_ graph page-entity content]]
  (when (db/get-db graph)
    (let [file (:block/file page-entity)]
      (when-let [path (:file/path file)]
        (when (and (not= content (:file/content file))
                (:file/content file))
          (sync/add-new-version-file graph path (:file/content file)))
        (p/let [_ (file-handler/alter-file graph
                    path
                    content
                    {:re-render-root? true
                     :skip-compare? true})]
          (state/close-modal!)
          (route-handler/redirect! {:to :page
                                    :path-params {:name (:block/name page-entity)}}))))))

(defmethod handle :whiteboard/onboarding [[_ opts]]
  (shui/dialog-open!
    (fn [{:keys [close]}] (whiteboard/onboarding-welcome close))
    (merge {:close-btn?      false
            :center?         true
            :close-backdrop? false} opts)))

(defmethod handle :file-sync/onboarding-tip [[_ type opts]]
  (let [type (keyword type)]
    (when-not (config/db-based-graph? (state/get-current-repo))
      (shui/dialog-open!
        (file-sync/make-onboarding-panel type)
        (merge {:close-btn? false
                :center? true
                :close-backdrop? (not= type :welcome)} opts)))))

(defmethod handle :file-sync/maybe-onboarding-show [[_ type]]
  (file-sync/maybe-onboarding-show type))

(defmethod handle :file-sync/storage-exceed-limit [[_]]
  (notification/show! "file sync storage exceed limit" :warning false)
  (file-sync-stop!))

(defmethod handle :file-sync/graph-count-exceed-limit [[_]]
  (notification/show! "file sync graph count exceed limit" :warning false)
  (file-sync-stop!))

(defmethod handle :graph/restored [[_ graph]]
  (mobile/init!)
  (rtc-handler/<rtc-start! graph)
  (when-not (mobile-util/native-ios?)
    (state/pub-event! [:graph/ready graph])))

(defmethod handle :whiteboard-link [[_ shapes]]
  (route-handler/go-to-search! :whiteboard/link)
  (state/set-state! :whiteboard/linked-shapes shapes))

(defmethod handle :whiteboard-go-to-link [[_ link]]
  (route-handler/redirect! {:to :page
                            :path-params {:name link}}))

(defmethod handle :graph/dir-gone [[_ dir]]
  (state/pub-event! [:notification/show
                     {:content (str "The directory " dir " has been renamed or deleted, the editor will be disabled for this graph, you can unlink the graph.")
                      :status :error
                      :clear? false}])
  (state/update-state! :file/unlinked-dirs (fn [dirs] (conj dirs dir))))

(defmethod handle :graph/dir-back [[_ repo dir]]
  (when (contains? (:file/unlinked-dirs @state/state) dir)
    (notification/clear-all!)
    (state/pub-event! [:notification/show
                       {:content (str "The directory " dir " has been back, you can edit your graph now.")
                        :status :success
                        :clear? true}])
    (state/update-state! :file/unlinked-dirs (fn [dirs] (disj dirs dir)))
    (when (= dir (config/get-repo-dir repo))
      (fs/watch-dir! dir))))

(defmethod handle :ui/notify-skipped-downloading-files [[_ paths]]
  (notification/show!
    [:div
     [:div.mb-4
      [:div.font-semibold.mb-4.text-xl "It seems that some of your filenames are in the outdated format."]
      [:p
       "The files below that have reserved characters can't be saved on this device."]
      [:div.overflow-y-auto.max-h-96
       [:ol.my-2
        (for [path paths]
          [:li path])]]

      [:div
       [:p
        "Check " [:a {:href "https://docs.logseq.com/#/page/logseq%20file%20and%20folder%20naming%20rules"
                      :target "_blank"}
                  "Logseq file and folder naming rules"]
        " for more details."]]]]
    :warning
    false))

(defmethod handle :graph/setup-a-repo [[_ opts]]
  (let [opts' (merge {:picked-root-fn #(state/close-modal!)
                      :native-icloud? (not (string/blank? (state/get-icloud-container-root-url)))
                      :logged?        (user-handler/logged-in?)} opts)]
    (if (mobile-util/native-ios?)
      (shui/dialog-open!
        #(graph-picker/graph-picker-cp opts')
        {:label "graph-setup"})
      (page-handler/ls-dir-files! st/refresh! opts'))))

(defmethod handle :graph/new-db-graph [[_ _opts]]
  (shui/dialog-open!
    repo/new-db-graph
    {:id :new-db-graph
     :title [:h2 "Create a new graph"]
     :style {:max-width "500px"}}))

(defmethod handle :graph/save-db-to-disk [[_ _opts]]
  (persist-db/export-current-graph! {:succ-notification? true}))

(defmethod handle :class/configure [[_ page]]
  (shui/dialog-open!
    #(vector :<>
       (class-component/configure page {})
       (db-page/page-properties page {:configure? true
                                      :mode :tag}))
    {:label "page-configure"
     :align :top}))

(defmethod handle :file/alter [[_ repo path content]]
  (p/let [_ (file-handler/alter-file repo path content {:from-disk? true})]
    (ui-handler/re-render-root!)))

(defmethod handle :ui/re-render-root [[_]]
  (ui-handler/re-render-root!))

(rum/defcs file-id-conflict-item <
  (rum/local false ::resolved?)
  [state repo file data]
  (let [resolved? (::resolved? state)
        id (last (:assertion data))]
    [:li {:key file}
     [:div
      [:a {:on-click #(js/window.apis.openPath file)} file]
      (if @resolved?
        [:div.flex.flex-row.items-center
         (ui/icon "circle-check" {:style {:font-size 20}})
         [:div.ml-1 "Resolved"]]
        [:div
         [:p
          (str "It seems that another whiteboard file already has the ID \"" id
            "\". You can fix it by changing the ID in this file with another UUID.")]
         [:p
          "Or, let me"
          (ui/button "Fix"
            :on-click (fn []
                        (let [dir (config/get-repo-dir repo)]
                          (p/let [content (fs/read-file dir file)]
                            (let [new-content (string/replace content (str id) (str (random-uuid)))]
                              (p/let [_ (fs/write-file! repo
                                          dir
                                          file
                                          new-content
                                          {})]
                                (reset! resolved? true))))))
            :class "inline mx-1")
          "it."]])]]))

(defmethod handle :file/parse-and-load-error [[_ repo parse-errors]]
  (state/pub-event! [:notification/show
                     {:content
                      [:div
                       [:h2.title "Oops. These files failed to import to your graph:"]
                       [:ol.my-2
                        (for [[file error] parse-errors]
                          (let [data (ex-data error)]
                            (cond
                              (and (common-config/whiteboard? file)
                                (= :transact/upsert (:error data))
                                (uuid? (last (:assertion data))))
                              (rum/with-key (file-id-conflict-item repo file data) file)

                              :else
                              (do
                                (state/pub-event! [:capture-error {:error error
                                                                   :payload {:type :file/parse-and-load-error}}])
                                [:li.my-1 {:key file}
                                 [:a {:on-click #(js/window.apis.openPath file)} file]
                                 [:p (.-message error)]]))))]
                       [:p "Don't forget to re-index your graph when all the conflicts are resolved."]]
                      :status :error}]))

(defmethod handle :run/cli-command [[_ command content]]
  (when (and command (not (string/blank? content)))
    (shell-handler/run-cli-command-wrapper! command content)))

(defmethod handle :editor/quick-capture [[_ args]]
  (quick-capture/quick-capture args))

(defmethod handle :modal/keymap [[_]]
  (state/open-settings! :keymap))

(defmethod handle :editor/toggle-own-number-list [[_ blocks]]
  (let [batch? (sequential? blocks)
        blocks (cond->> blocks
                 batch?
                 (map #(cond-> % (or (uuid? %) (string? %)) (db-model/get-block-by-uuid))))]
    (if (and batch? (> (count blocks) 1))
      (editor-handler/toggle-blocks-as-own-order-list! blocks)
      (when-let [block (cond-> blocks batch? (first))]
        (if (editor-handler/own-order-number-list? block)
          (editor-handler/remove-block-own-order-list-type! block)
          (editor-handler/make-block-as-own-order-list! block))))))

(defmethod handle :editor/remove-own-number-list [[_ block]]
  (when (some-> block (editor-handler/own-order-number-list?))
    (editor-handler/remove-block-own-order-list-type! block)))

(defmethod handle :editor/save-current-block [_]
  (editor-handler/save-current-block!))

(defmethod handle :editor/save-code-editor [_]
  (code-handler/save-code-editor!))

(defmethod handle :editor/toggle-children-number-list [[_ block]]
  (when-let [blocks (and block (db-model/get-block-immediate-children (state/get-current-repo) (:block/uuid block)))]
    (editor-handler/toggle-blocks-as-own-order-list! blocks)))

(defmethod handle :editor/new-property [[_ {:keys [block] :as opts}]]
  (p/do!
   (editor-handler/save-current-block!)
   (let [editing-block (state/get-edit-block)
         pos (state/get-edit-pos)
         edit-block-or-selected (if editing-block
                                  [editing-block]
                                  (seq (keep #(db/entity [:block/uuid %]) (state/get-selection-block-ids))))
         current-block (when-let [s (state/get-current-page)]
                         (when (util/uuid-string? s)
                           (db/entity [:block/uuid (uuid s)])))
         blocks (or (when block [block])
                    edit-block-or-selected
                    (when current-block [current-block]))
         opts' (cond-> opts
                 editing-block
                 (assoc :original-block editing-block
                        :edit-original-block
                        (fn [{:keys [editing-default-property?]}]
                          (when editing-block
                            (let [content (:block/title (db/entity (:db/id editing-block)))
                                  esc? (= "Escape" (state/get-ui-last-key-code))
                                  [content' pos] (cond
                                                   esc?
                                                   [nil pos]
                                                   (and (>= (count content) pos)
                                                        (>= pos 2)
                                                        (= (util/nth-safe content (dec pos))
                                                           (util/nth-safe content (- pos 2))
                                                           ";"))
                                                   [(str (common-util/safe-subs content 0 (- pos 2))
                                                         (common-util/safe-subs content pos))
                                                    (- pos 2)]
                                                   :else
                                                   [nil pos])]
                              (when content'
                                (if editing-default-property?
                                  (editor-handler/save-block! (state/get-current-repo) (:block/uuid editing-block) content')
                                  (editor-handler/edit-block! editing-block (or pos :max)
                                                              (cond-> {}
                                                                content'
                                                                (assoc :custom-content content'))))))))))]
     (when (seq blocks)
       (let [input (some-> (state/get-edit-input-id)
                           (gdom/getElement))]
         (if input
           (shui/popup-show! input
                             #(property-dialog/dialog blocks opts')
                             {:align "start"
                              :as-dropdown? true
                              :auto-focus? true})
           (shui/dialog-open! #(property-dialog/dialog blocks opts')
                              {:id :property-dialog
                               :align "start"
                               :content-props {:onOpenAutoFocus #(.preventDefault %)}})))))))

(rum/defc multi-tabs-dialog
  []
  (let [word (if (util/electron?) "window" "tab")]
    [:div.flex.p-4.flex-col.gap-4.h-64
     [:span.warning.text-lg
      (util/format "Logseq doesn't support multiple %ss access to the same graph yet, please close this %s or switch to another graph."
        word word)]
     [:div.text-lg
      [:p "Switch to another repo: "]
      [:div.border.rounded.bg-gray-01.overflow-hidden.w-60
       (repo/repos-dropdown {:on-click (fn [e]
                                         (util/stop e)
                                         (state/set-state! :error/multiple-tabs-access-opfs? false)
                                         (shui/dialog-close!))})]]]))

(defmethod handle :show/multiple-tabs-error-dialog [_]
  (state/set-state! :error/multiple-tabs-access-opfs? true)
  (shui/dialog-open! multi-tabs-dialog))

(defmethod handle :rtc/sync-state [[_ state]]
  (state/update-state! :rtc/state (fn [old] (merge old state))))

(defmethod handle :rtc/log [[_ data]]
  (state/set-state! :rtc/log data))

(defmethod handle :rtc/download-remote-graph [[_ graph-name graph-uuid]]
  (->
   (p/do!
     (rtc-handler/<rtc-download-graph! graph-name graph-uuid 60000))
   (p/catch (fn [e]
              (println "RTC download graph failed, error:")
              (js/console.error e)))))

;; db-worker -> UI
(defmethod handle :db/sync-changes [[_ data]]
  (let [retract-datoms (filter (fn [d] (and (= :block/uuid (:a d)) (false? (:added d)))) (:tx-data data))
        retracted-tx-data (map (fn [d] [:db/retractEntity (:e d)]) retract-datoms)
        tx-data (concat (:tx-data data) retracted-tx-data)]
    (pipeline/invoke-hooks (assoc data :tx-data tx-data))

    nil))

(defn run!
  []
  (let [chan (state/get-events-chan)]
    (async/go-loop []
      (let [[payload d] (async/<! chan)]
        (->
          (try
            (p/resolved (handle payload))
            (catch :default error
              (p/rejected error)))
          (p/then (fn [result]
                    (p/resolve! d result)))
          (p/catch (fn [error]
                     (let [type :handle-system-events/failed]
                       (state/pub-event! [:capture-error {:error error
                                                          :payload {:type type
                                                                    :payload payload}}])
                       (p/reject! d error))))))
      (recur))
    chan))

(comment
  (let [{:keys [deprecated-app-id current-app-id]} {:deprecated-app-id "AFDADF9A-7466-4ED8-B74F-AAAA0D4565B9", :current-app-id "7563518E-0EFD-4AD2-8577-10CFFD6E4596"}]
    (def deprecated-app-id deprecated-app-id)
    (def current-app-id current-app-id))
  (def deprecated-repo (state/get-current-repo))
  (def new-repo (string/replace deprecated-repo deprecated-app-id current-app-id))

  (update-file-path deprecated-repo new-repo deprecated-app-id current-app-id))
