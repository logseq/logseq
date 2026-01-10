(ns frontend.handler.events
  "System-component-like ns that defines named events and listens on a
  core.async channel to handle them. Any part of the system can dispatch
  one of these events using state/pub-event!"
  (:refer-clojure :exclude [run!])
  (:require ["@sentry/react" :as Sentry]
            [cljs-bean.core :as bean]
            [clojure.core.async :as async]
            [clojure.string :as string]
            [frontend.commands :as commands]
            [frontend.components.rtc.indicator :as indicator]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.db.model :as db-model]
            [frontend.db.react :as react]
            [frontend.extensions.fsrs :as fsrs]
            [frontend.handler.assets :as assets-handler]
            [frontend.handler.code :as code-handler]
            [frontend.handler.common.page :as page-common-handler]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.db-based.rtc :as rtc-handler]
            [frontend.handler.db-based.rtc-flows :as rtc-flows]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.export :as export]
            [frontend.handler.graph :as graph-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.repo-config :as repo-config-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.search :as search-handler]
            [frontend.handler.shell :as shell-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.modules.instrumentation.posthog :as posthog]
            [frontend.modules.outliner.pipeline :as pipeline]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.modules.shortcut.core :as st]
            [frontend.persist-db :as persist-db]
            [frontend.quick-capture :as quick-capture]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [lambdaisland.glogi :as log]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

;; TODO: should we move all events here?

(defmulti handle first)

(defmethod handle :graph/added [[_ repo {:keys [empty-graph?]}]]
  (search-handler/rebuild-indices!)
  (plugin-handler/hook-plugin-app :graph-after-indexed {:repo repo :empty-graph? empty-graph?})
  (route-handler/redirect-to-home!))

(defmethod handle :init/commands [_]
  (page-handler/init-commands!))

(defn- graph-switch
  [graph]
  (react/clear-query-state!)
  (state/set-current-repo! graph)
  (page-handler/init-commands!)
  ;; load config
  (repo-config-handler/restore-repo-config! graph)
  (when-not (= :draw (state/get-current-route))
    (route-handler/redirect-to-home!))
  (graph-handler/settle-metadata-to-local! {:last-seen-at (js/Date.now)}))

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
  (let [switch-promise
        (p/do!
         (export/cancel-db-backup!)
         (persist-db/export-current-graph!)
         (state/set-state! :db/async-queries {})
         (st/refresh!)
         (graph-switch-on-persisted graph opts))]
    (p/then switch-promise
            (fn [_]
              (export/backup-db-graph (state/get-current-repo))))))

(defmethod handle :graph/open-new-window [[_ev target-repo]]
  (ui-handler/open-new-window-or-tab! target-repo))

(defmethod handle :graph/migrated [[_ _repo]]
  (js/alert "Graph migrated."))

(defmethod handle :page/create [[_ page-name opts]]
  (if (= page-name (date/today))
    (page-handler/create-today-journal!)
    (page-handler/<create! page-name opts)))

(defmethod handle :page/deleted [[_ repo page-name file-path tx-meta]]
  (when-not (util/mobile?)
    (page-common-handler/after-page-deleted! repo page-name file-path tx-meta)))

(defmethod handle :page/renamed [[_ repo data]]
  (when-not (util/mobile?)
    (page-common-handler/after-page-renamed! repo data)))

(defmethod handle :page/create-today-journal [[_ _repo]]
  (p/let [_ (page-handler/create-today-journal!)]
    (ui-handler/re-render-root!)))

(defmethod handle :graph/sync-context []
  (let [context {:dev? config/dev?
                 :node-test? util/node-test?
                 :mobile? (util/mobile?)
                 :validate-db-options (:dev/validate-db-options (state/get-config))
                 :importing? (:graph/importing @state/state)
                 :date-formatter (state/get-date-formatter)
                 :journal-file-name-format (or (state/get-journal-file-name-format)
                                               date/default-journal-filename-formatter)
                 :export-bullet-indentation (state/get-export-bullet-indentation)
                 :preferred-format (state/get-preferred-format)
                 :journals-directory (config/get-journals-directory)
                 :pages-directory (config/get-pages-directory)}]
    (state/<invoke-db-worker :thread-api/set-context context)))

;; Hook on a graph is ready to be shown to the user.
;; It's different from :graph/restored, as :graph/restored is for window reloaded
;; FIXME: config may not be loaded when the graph is ready.
(defmethod handle :graph/ready
  [[_ repo]]
  ;; FIXME: an ugly implementation for redirecting to page on new window is restored
  (repo-handler/graph-ready! repo))

(defmethod handle :instrument [[_ {:keys [type payload] :as opts}]]
  ;; Analytics disabled - instrumentation event is a no-op
  nil)

(defmethod handle :capture-error [[_ {:keys [error payload extra]}]]
  ;; Analytics disabled - error capture is a no-op
  nil)

(defmethod handle :exec-plugin-cmd [[_ {:keys [pid cmd action]}]]
  (commands/exec-plugin-simple-command! pid cmd action))

(defmethod handle :shortcut-handler-refreshed [[_]]
  (when-not @st/*pending-inited?
    (reset! st/*pending-inited? true)
    (st/consume-pending-shortcuts!)))

(defmethod handle :mobile/keyboard-will-show [[_ keyboard-height]]
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

(defmethod handle :mobile/keyboard-will-hide [[_]]
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

(defmethod handle :plugin/hook-db-tx [[_ {:keys [blocks tx-data] :as payload}]]
  (when-let [payload (and (seq blocks)
                          (merge payload {:tx-data (map #(into [] %) tx-data)}))]
    (plugin-handler/hook-plugin-db :changed payload)
    (plugin-handler/hook-plugin-block-changes payload)))

(defmethod handle :rebuild-slash-commands-list [[_]]
  (page-handler/rebuild-slash-commands-list!))

(defmethod handle :shortcut/refresh [[_]]
  (st/refresh!))

(defmethod handle :editor/set-heading [[_ block heading]]
  (when-let [id (:block/uuid block)]
    (editor-handler/set-heading! id heading)))

(defmethod handle :graph/restored [[_ graph]]
  (when graph (assets-handler/ensure-assets-dir! graph))
  (state/pub-event! [:graph/sync-context])
  (export/auto-db-backup! graph)
  (rtc-flows/trigger-rtc-start graph)
  (fsrs/update-due-cards-count)
  (when-not (mobile-util/native-platform?)
    (state/pub-event! [:graph/ready graph])))

(defmethod handle :whiteboard-link [[_ shapes]]
  (route-handler/go-to-search! :whiteboard/link)
  (state/set-state! :whiteboard/linked-shapes shapes))

(defmethod handle :whiteboard-go-to-link [[_ link]]
  (route-handler/redirect! {:to :page
                            :path-params {:name link}}))

(defmethod handle :graph/save-db-to-disk [[_ _opts]]
  (persist-db/export-current-graph! {:succ-notification? true :force-save? true}))

(defmethod handle :ui/re-render-root [[_]]
  (ui-handler/re-render-root!))

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

(defmethod handle :editor/focus-code-editor [[_ editing-block container]]
  (when-let [^js cm (util/get-cm-instance container)]
    (when-not (.hasFocus cm)
      (let [cursor-pos (some-> (:editor/cursor-range @state/state) (deref) (count))
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

(defmethod handle :editor/toggle-children-number-list [[_ block]]
  (when-let [blocks (and block (db-model/get-block-immediate-children (state/get-current-repo) (:block/uuid block)))]
    (editor-handler/toggle-blocks-as-own-order-list! blocks)))

(defmethod handle :editor/upsert-type-block [[_ {:keys [block type lang update-current-block?]}]]
  (p/do!
   (when-not update-current-block?
     (editor-handler/save-current-block!))
   (when-not update-current-block?
     (p/delay 16))
   (let [block (db/entity (:db/id block))
         block-type (:logseq.property.node/display-type block)
         block-title (:block/title block)
         latest-code-lang (or lang
                              (:kv/value (db/entity :logseq.kv/latest-code-lang)))
         turn-type! #(if (and (= (keyword type) :code) latest-code-lang)
                       (db-property-handler/set-block-properties!
                        (:block/uuid %)
                        {:logseq.property.node/display-type (keyword type)
                         :logseq.property.code/lang latest-code-lang})
                       (db-property-handler/set-block-property!
                        (:block/uuid %) :logseq.property.node/display-type (keyword type)))]
     (p/let [block (if (or (not (nil? block-type))
                           (and (not update-current-block?) (not (string/blank? block-title))))
                     (p/let [result (ui-outliner-tx/transact!
                                     {:outliner-op :insert-blocks}
                                     ;; insert a new block
                                     (let [[_p _ block'] (editor-handler/insert-new-block-aux! {} block "")]
                                       (turn-type! block')))]
                       (when-let [id (:block/uuid (first (:blocks result)))]
                         (db/entity [:block/uuid id])))
                     (p/do!
                      (turn-type! block)
                      (db/entity [:block/uuid (:block/uuid block)])))]
       (js/setTimeout #(editor-handler/edit-block! block :max) 100)))))

(defmethod handle :vector-search/sync-state [[_ state]]
  (state/set-state! :vector-search/state state))

(defmethod handle :rtc/sync-state [[_ state]]
  (state/update-state! :rtc/state (fn [old] (merge old state))))

(defmethod handle :rtc/log [[_ data]]
  (state/set-state! :rtc/log data))

(defmethod handle :rtc/remote-graph-gone [_]
  (p/do!
   (notification/show! "This graph has been removed from Logseq Sync." :warning false)
   (rtc-handler/<get-remote-graphs)))

(defmethod handle :rtc/download-remote-graph [[_ graph-name graph-uuid graph-schema-version]]
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
          [:div (str "Downloading " graph-name " ...")]
          (indicator/downloading-logs)])
       {:id :download-rtc-graph}))
    (rtc-handler/<rtc-download-graph! graph-name graph-uuid graph-schema-version 60000)
    (rtc-handler/<get-remote-graphs)
    (when (util/mobile?)
      (shui/popup-hide! :download-rtc-graph)))
   (p/catch (fn [e]
              (println "RTC download graph failed, error:")
              (log/error :rtc-download-graph-failed e)
              (shui/popup-hide! :download-rtc-graph)
              ;; TODO: notify error
              ))))

;; db-worker -> UI
(defmethod handle :db/sync-changes [[_ data]]
  (let [retract-datoms (filter (fn [d] (and (= :block/uuid (:a d)) (false? (:added d)))) (:tx-data data))
        retracted-tx-data (map (fn [d] [:db/retractEntity (:e d)]) retract-datoms)
        tx-data (concat (:tx-data data) retracted-tx-data)]
    (pipeline/invoke-hooks (assoc data :tx-data tx-data))

    nil))

(defmethod handle :db/export-sqlite [_]
  (export/export-repo-as-sqlite-db! (state/get-current-repo))
  nil)

(defmethod handle :editor/run-query-command [_]
  (editor-handler/run-query-command!))

(defmethod handle :editor/load-blocks [[_ ids]]
  (when (seq ids)
    ;; not using `<get-blocks` here becuase because we want to
    ;; load all nested children here for copy/export
    (p/all (map (fn [id]
                  (db-async/<get-block (state/get-current-repo) id
                                       {:skip-refresh? false})) ids))))

(defmethod handle :vector-search/load-model-progress [[_ data]]
  (state/set-state! :vector-search/load-model-progress data))

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
                    (log/error :event-error error :event (first payload))
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
