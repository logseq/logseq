(ns frontend.handler.events
  "System-component-like ns that defines named RFX events. Any part of the
  system can dispatch one of these events using state/pub-event!"
  (:refer-clojure :exclude [run!])
  (:require-macros [frontend.handler.events.macros :refer [defevent!]])
  (:require ["@sentry/react" :as Sentry]
            [cljs-bean.core :as bean]
            [cljs-time.core :as t]
            [clojure.string :as string]
            [frontend.commands :as commands]
            [frontend.components.rtc.indicator :as indicator]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db.async :as db-async]
            [frontend.extensions.fsrs :as fsrs]
            [frontend.handler.assets :as assets-handler]
            [frontend.handler.code :as code-handler]
            [frontend.handler.comments :as comments-handler]
            [frontend.handler.common.page :as page-common-handler]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.db-based.rtc-flows :as rtc-flows]
            [frontend.handler.db-based.sync :as rtc-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.events.rtc-error :as rtc-error]
            [frontend.handler.export :as export]
            [frontend.handler.graph :as graph-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.repo-config :as repo-config-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.shell :as shell-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.user :as user-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.modules.instrumentation.posthog :as posthog]
            [frontend.modules.outliner.pipeline :as pipeline]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.modules.shortcut.core :as st]
            [frontend.persist-db :as persist-db]
            [frontend.quick-capture :as quick-capture]
            [frontend.rfx :as rfx]
            [frontend.search.plugin :as search-plugin]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [lambdaisland.glogi :as log]
            [logseq.api.plugin :as plugin-api]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

;; TODO: should we move all events here?

(defonce ^:private event-definitions
  (atom {}))

(defn- capture-event-error!
  [event error]
  (log/error :event-error error :event (first event))
  (let [type :handle-system-events/failed]
    (state/pub-event! [:capture-error {:error error
                                       :payload {:type type
                                                 :payload event}}])))

(defn- handle-rfx-event
  [handler _coeffects event]
  (try
    (let [result (-> (p/resolved (handler event))
                     (p/catch (fn [error]
                                (capture-event-error! event error)
                                (p/rejected error))))]
      {::rfx/result result})
    (catch :default error
      (capture-event-error! event error)
      {::rfx/error error})))

(defn- register-rfx-handler!
  [event-id handler]
  (rfx/reg-event-fx! event-id (fn [coeffects event]
                                (handle-rfx-event handler coeffects event))))

(defn register-event-definition!
  [event-id handler]
  (swap! event-definitions assoc event-id handler)
  (register-rfx-handler! event-id handler)
  nil)

(defonce ^:private *search-index-build-timeout (atom nil))
(defn- <build-search-index!
  [repo]
  (-> (p/let [result (state/<invoke-db-worker :thread-api/search-build-blocks-indice-in-worker repo)]
        (when (and (not= :started result)
                   (= repo (state/get-current-repo)))
          (state/pub-event! [:graph/ready repo]))
        result)
      (p/catch (fn [error]
                 (js/console.error "Search index build error:" error)))))

(defn- schedule-search-index-build!
  [repo]
  (when-let [timeout-id @*search-index-build-timeout]
    (js/clearTimeout timeout-id))
  (reset! *search-index-build-timeout
          (js/setTimeout
           (fn []
             (cond
               (not= repo (state/get-current-repo))
               (reset! *search-index-build-timeout nil)

               (state/input-idle? repo :diff 5000)
               (do
                 (reset! *search-index-build-timeout nil)
                 (<build-search-index! repo))

               :else
               (schedule-search-index-build! repo)))
           1000)))

(defevent! :init/commands [_]
  (page-handler/init-commands!))

(defn- graph-switch
  [graph]
  (state/set-current-repo! graph)
  (page-handler/init-commands!)
  ;; load config
  (repo-config-handler/restore-repo-config! graph)
  (st/refresh!)
  (route-handler/redirect-to-home!)
  (graph-handler/settle-metadata-to-local! {:last-seen-at (js/Date.now)}))

;; Parameters for the `persist-db` function, to show the notification messages
(defn- graph-switch-on-persisted
  "graph: the target graph to switch to"
  [graph opts]
  (p/do!
   (repo-handler/restore-and-setup-repo! graph)
   (graph-switch graph)
   (graph-handler/<upsert-current-graph-registry!)
   (graph-handler/remember-current-graph-id-in-tab!)
   (state/set-state! :sync-graph/init? false)
   (when (:rtc-download? opts)
     (repo-handler/refresh-repos!)
     (p/do!
      (p/delay 5000)
      (p/let [repo (state/get-current-repo)
              _ (<build-search-index! repo)]
        (when state/lsp-enabled?
          (doseq [service (state/get-all-plugin-services-with-type :search)]
            (search-plugin/call-service! service "search:rebuildPagesIndice" {})
            (search-plugin/call-service! service "search:rebuildBlocksIndice" {}))))))))

(defevent! :graph/switch [[_ graph opts]]
  (let [t1 (t/now)]
    (p/do!
     (export/cancel-db-backup!)
     (state/clear-async-queries!)
     (graph-switch-on-persisted graph opts)
     (export/backup-db-graph (state/get-current-repo))
     (let [t2 (t/now)]
       (log/info ::graph-switch-spent (- t2 t1))))))

(defevent! :graph/open-new-window [[_ev target]]
  (ui-handler/open-new-window-or-tab! target))

(defevent! :page/create [[_ page-name opts]]
  (if (= page-name (date/today))
    (page-handler/create-today-journal!)
    (page-handler/<create! page-name opts)))

(defevent! :page/deleted [[_ page-name _tx-meta]]
  (when page-name
    (when-not (util/mobile?)
      (page-common-handler/after-page-deleted! page-name))))

(defevent! :page/renamed [[_ repo data]]
  (when-not (util/mobile?)
    (page-common-handler/after-page-renamed! repo data)))

(defevent! :graph/sync-context []
  (let [context {:dev? config/dev?
                 :node-test? util/node-test?
                 :mobile? (util/mobile?)
                 :validate-db-options (:dev/validate-db-options (state/get-config))
                 :importing? (:graph/importing @state/state)
                 :date-formatter (state/get-date-formatter)
                 :export-bullet-indentation (state/get-export-bullet-indentation)
                 :preferred-format (state/get-preferred-format)}]
    (state/<invoke-db-worker :thread-api/set-context context)))

;; Hook on a graph is ready to be shown to the user.
;; It's different from :graph/restored, as :graph/restored is for window reloaded
;; FIXME: config may not be loaded when the graph is ready.
(defevent! :graph/ready
  [[_ repo]]
  ;; FIXME: an ugly implementation for redirecting to page on new window is restored
  (repo-handler/graph-ready! repo))

(defevent! :instrument [[_ {:keys [type payload] :as opts}]]
  (when-not (empty? (dissoc opts :type :payload))
    (log/error :event :invalid-instrument-payload-keys
               :message "instrument data-map should only contain [:type :payload]"
               :payload opts))
  (posthog/capture type payload))

(defn- <current-graph-schema-version
  []
  (if @state/db-worker-ready?
    (p/let [version (state/<invoke-db-worker :thread-api/get-key-value
                                             (state/get-current-repo)
                                             :logseq.kv/schema-version)]
      (some-> version str))
    (p/resolved nil)))

(defevent! :capture-error [[_ {:keys [error payload extra]}]]
  (p/let [db-schema-version (<current-graph-schema-version)
          payload (merge
                   {:schema-version (str db-schema/version)
                    :db-schema-version db-schema-version
                    :db-based true}
                   payload)]
    (Sentry/captureException error
                             (bean/->js {:tags payload
                                         :extra extra}))))

(defevent! :exec-plugin-cmd [[_ {:keys [pid cmd action]}]]
  (commands/exec-plugin-simple-command! pid cmd action))

(defevent! :shortcut-handler-refreshed [[_]]
  (when-not @st/*pending-inited?
    (reset! st/*pending-inited? true)
    (st/consume-pending-shortcuts!)))

(defevent! :mobile/keyboard-will-show [[_ keyboard-height]]
  (let [_main-node (util/app-scroll-container-node)]
    (when-let [^js html (js/document.querySelector ":root")]
      (.setProperty (.-style html) "--ls-native-kb-height" (str keyboard-height "px"))
      (.add (.-classList html) "has-mobile-keyboard")
      (.setProperty (.-style html) "--ls-native-toolbar-opacity" 1))
    (when (mobile-util/native-platform?)
      (reset! util/keyboard-height keyboard-height)
      (util/schedule
       #(some-> (state/get-input)
                (util/scroll-editor-cursor false))))))

(defevent! :mobile/keyboard-will-hide [[_]]
  (let [main-node (util/app-scroll-container-node)]
    (when-let [^js html (js/document.querySelector ":root")]
      (.removeProperty (.-style html) "--ls-native-kb-height")
      (.setProperty (.-style html) "--ls-native-toolbar-opacity" 0)
      (.remove (.-classList html) "has-mobile-keyboard"))
    (when (mobile-util/native-ios?)
      (when-let [card-preview-el (js/document.querySelector ".cards-review")]
        (set! (.. card-preview-el -style -marginBottom) "0px"))
      (set! (.. main-node -style -marginBottom) "0px")
      (when-let [left-sidebar-node (gdom/getElement "left-sidebar")]
        (set! (.. left-sidebar-node -style -bottom) "0px"))
      (when-let [right-sidebar-node (gdom/getElementByClass "sidebar-item-list")]
        (set! (.. right-sidebar-node -style -paddingBottom) "150px")))))

(defevent! :plugin/hook-db-tx [[_ {:keys [blocks tx-data] :as payload}]]
  (when-let [payload (and (seq blocks)
                          (merge payload {:tx-data (map #(into [] %) tx-data)}))]
    (plugin-handler/hook-plugin-db :changed payload)
    (plugin-handler/hook-plugin-block-changes payload)))

(defevent! :rebuild-slash-commands-list [[_]]
  (page-handler/rebuild-slash-commands-list!))

(defevent! :shortcut/refresh [[_]]
  (st/refresh!))

(defevent! :editor/set-heading [[_ block heading]]
  (when-let [id (:block/uuid block)]
    (editor-handler/set-heading! id heading)))

(defevent! :graph/restored [[_ graph]]
  (when graph (assets-handler/ensure-assets-dir! graph))
  (state/pub-event! [:graph/sync-context])
  (when graph
    (schedule-search-index-build! graph))
  (export/auto-db-backup! graph)
  (rtc-flows/trigger-rtc-start graph)
  (fsrs/update-due-cards-count)
  nil)

(defevent! :graph/save-db-to-disk [[_ _opts]]
  (persist-db/export-current-graph! :succ-notification? true))

(defevent! :graph/db-save-shortcut [[_]]
  (state/pub-event! [:graph/save-db-to-disk {:source :shortcut}]))

(defevent! :ui/re-render-root [[_]]
  (ui-handler/re-render-root!))

(defevent! :run/cli-command [[_ command content]]
  (when (and command (not (string/blank? content)))
    (shell-handler/run-cli-command-wrapper! command content)))

(defevent! :editor/quick-capture [[_ ^js args]]
  (quick-capture/quick-capture args))

(defevent! :editor/invoke-command [[_ ^js args]]
  (when-let [{:keys [action payload]} (bean/->clj args)]
    ;; parse "plugin.vibe-clipper.models.onReceiveClipperData"
    (let [keys' (string/split action #"\.")
          [type id group] keys'
          action (last keys')]
      (case (keyword type)
        :plugin (plugin-api/invoke_external_plugin_cmd id group action [payload])
        (log/warn :unknown-invoke-command-type action)))))

(defevent! :modal/keymap [[_]]
  (state/open-settings! :keymap))

(defevent! :editor/toggle-own-number-list [[_ blocks]]
  (let [batch? (sequential? blocks)
        repo (state/get-current-repo)]
    (p/let [blocks (if batch?
                     (p/all (map #(if (or (uuid? %) (string? %))
                                    (db-async/<get-block repo % {:children? false})
                                    %)
                                  blocks))
                     blocks)]
      (if (and batch? (> (count blocks) 1))
        (editor-handler/toggle-blocks-as-own-order-list! blocks)
        (when-let [block (cond-> blocks batch? (first))]
          (if (editor-handler/own-order-number-list? block)
            (editor-handler/remove-block-own-order-list-type! block)
            (editor-handler/make-block-as-own-order-list! block)))))))

(defevent! :editor/remove-own-number-list [[_ block]]
  (when (some-> block (editor-handler/own-order-number-list?))
    (editor-handler/remove-block-own-order-list-type! block)))

(defevent! :editor/save-current-block [_]
  (editor-handler/save-current-block!))

(defevent! :editor/add-comment [_]
  (comments-handler/add-comment-to-current-context!))

(defevent! :editor/save-code-editor [_]
  (code-handler/save-code-editor!))

(defevent! :editor/focus-code-editor [[_ editing-block container]]
  (when-let [^js cm (util/get-cm-instance container)]
    (when-not (.hasFocus cm)
      (let [cursor-pos (some-> (state/get-state :editor/cursor-range) count)
            direction (:block.editing/direction editing-block)
            pos (:block.editing/pos editing-block)
            to-line (case direction
                      :up (.lastLine cm)
                      (case pos
                        :max (.lastLine cm)
                        0))]
                 ;; move to friendly cursor
        (doto cm
          (.focus)
          (.setCursor to-line (or cursor-pos 0)))))))

(defevent! :editor/toggle-children-number-list [[_ block]]
  (when block
    (p/let [blocks (db-async/<get-block-immediate-children (state/get-current-repo) (:block/uuid block))]
      (when (seq blocks)
        (editor-handler/toggle-blocks-as-own-order-list! blocks)))))

(defn- <get-upsert-type-block
  [repo id]
  (db-async/<get-block repo id :children? false))

(defn- <latest-code-lang
  [repo lang]
  (if lang
    (p/resolved lang)
    (state/<invoke-db-worker :thread-api/get-key-value repo :logseq.kv/latest-code-lang)))

(defevent! :editor/upsert-type-block [[_ {:keys [block type lang update-current-block?]}]]
  (p/let [_ (when-not update-current-block?
              (editor-handler/save-current-block!))
          _ (when-not update-current-block?
              (p/delay 16))
          repo (state/get-current-repo)
          db-block (<get-upsert-type-block repo (:db/id block))
          latest-code-lang (<latest-code-lang repo lang)]
    (let [block-type (:logseq.property.node/display-type db-block)
          block-title (:block/title db-block)
          requested-title? (contains? block :block/title)
          requested-title (:block/title block)
          turn-type! #(if (and (= (keyword type) :code) latest-code-lang)
                        (db-property-handler/set-block-properties!
                         (:block/uuid %)
                         {:logseq.property.node/display-type (keyword type)
                          :logseq.property.code/lang latest-code-lang})
                        (db-property-handler/set-block-property!
                         (:block/uuid %) :logseq.property.node/display-type (keyword type)))
          apply-requested-title! #(when (and update-current-block?
                                             requested-title?
                                             (not= requested-title (:block/title %)))
                                    (editor-handler/save-block! (state/get-current-repo) % requested-title))]
      (p/let [converted-block (if (or (not (nil? block-type))
                                      (and (not update-current-block?) (not (string/blank? block-title))))
                                (p/let [result (ui-outliner-tx/transact!
                                                {:outliner-op :insert-blocks}
                                                ;; insert a new block
                                                (let [[_p _ block'] (editor-handler/insert-new-block-aux! {} db-block "")]
                                                  (turn-type! block')))]
                                  (when-let [id (:block/uuid (first (:blocks result)))]
                                    (<get-upsert-type-block repo id)))
                                (p/let [_ (apply-requested-title! db-block)
                                        _ (turn-type! db-block)]
                                  (<get-upsert-type-block repo (:block/uuid db-block))))]
        (js/setTimeout #(editor-handler/edit-block! converted-block :max) 100)))))

(defn- editing-users-by-block
  [online-users current-user-uuid]
  (reduce (fn [result {:user/keys [editing-block-uuid uuid] :as user}]
            (if (and (string? editing-block-uuid)
                     (not= uuid current-user-uuid)
                     (not (contains? result editing-block-uuid)))
              (assoc result editing-block-uuid user)
              result))
          {}
          online-users))

(defn- sync-editing-users-by-block!
  [online-users]
  (let [current-user-uuid (user-handler/user-uuid)
        old-users-by-block (or (state/get-state :rtc/editing-users-by-block) {})
        new-users-by-block (editing-users-by-block online-users current-user-uuid)
        affected-block-ids (into (set (keys old-users-by-block))
                                 (keys new-users-by-block))]
    (doseq [block-id affected-block-ids
            :let [old-user (get old-users-by-block block-id)
                  new-user (get new-users-by-block block-id)]
            :when (not= old-user new-user)]
      (state/set-state! :rtc/editing-users-by-block new-user :nested-path block-id))))

(defevent! :rtc/sync-state [[_ state]]
  (when (contains? state :online-users)
    (sync-editing-users-by-block! (:online-users state)))
  (doseq [[k value] state]
    (state/set-state! :rtc/state value :nested-path k)))

(defevent! :rtc/presence-update [[_ {:keys [editing-block-uuid]}]]
  (rtc-handler/<rtc-update-presence! editing-block-uuid))

(defevent! :rtc/log [[_ data]]
  (state/set-state! :rtc/log data))

(defevent! :rtc/remote-graph-gone [_]
  (p/do!
   (notification/show! (t :graph/removed-from-sync) :warning false)
   (rtc-handler/<get-remote-graphs)))

(defevent! :rtc/download-remote-graph [[_ graph-name graph-uuid graph-schema-version graph-e2ee?]]
  (assert (= (:major (db-schema/parse-schema-version db-schema/version))
             (:major (db-schema/parse-schema-version graph-schema-version)))
          {:app db-schema/version
           :remote-graph graph-schema-version})
  (->
   (p/do!
    (when (util/mobile?)
      (shui/popup-show!
       nil
       (fn []
         [:div.flex.flex-col.items-center.justify-center.mt-8.gap-4
          [:div (t :sync/downloading-graph graph-name)]
          (indicator/downloading-logs)])
       {:id :download-rtc-graph}))
    (rtc-handler/<rtc-download-graph! graph-name graph-uuid graph-e2ee?)
    (rtc-handler/<get-remote-graphs)
    (state/pub-event! [:graph/switch (str config/db-version-prefix graph-name) {:rtc-download? true}])
    (when (util/mobile?)
      (shui/popup-hide! :download-rtc-graph)))
   (p/catch (fn [e]
              (println "RTC download graph failed, error:")
              (log/error :rtc-download-graph-failed e)
              (shui/popup-hide! :download-rtc-graph)
              (when (rtc-error/download-decrypt-failed? e)
                (notification/show! (t :encryption/wrong-password) :error false))))))

;; db-worker -> UI
(defevent! :db/sync-changes [[_ data]]
  (pipeline/invoke-hooks data)
  nil)

(defevent! :db/export-sqlite [_]
  (export/export-repo-as-sqlite-db! (state/get-current-repo))
  nil)

(defevent! :editor/run-query-command [_]
  (editor-handler/run-query-command!))

(defn- register-rfx-handlers!
  []
  (doseq [[event-id handler] @event-definitions]
    (register-rfx-handler! event-id handler)))

(defn run!
  []
  (register-rfx-handlers!))

(comment
  (let [{:keys [deprecated-app-id current-app-id]} {:deprecated-app-id "AFDADF9A-7466-4ED8-B74F-AAAA0D4565B9", :current-app-id "7563518E-0EFD-4AD2-8577-10CFFD6E4596"}]
    (def deprecated-app-id deprecated-app-id)
    (def current-app-id current-app-id))
  (def deprecated-repo (state/get-current-repo))
  (def new-repo (string/replace deprecated-repo deprecated-app-id current-app-id))

  (update-file-path deprecated-repo new-repo deprecated-app-id current-app-id))
