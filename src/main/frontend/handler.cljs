(ns frontend.handler
  "Main ns that handles application startup. Closest ns that we have to a
  system. Contains a couple of small system components"
  (:require [cljs.reader :refer [read-string]]
            [clojure.string :as string]
            [electron.ipc :as ipc]
            [electron.listener :as el]
            [frontend.components.block :as block]
            [frontend.components.editor :as editor]
            [frontend.components.page :as page]
            [frontend.components.reference :as reference]
            [frontend.components.whiteboard :as whiteboard]
            [frontend.config :as config]
            [frontend.context.i18n :as i18n :refer [t]]
            [frontend.db :as db]
            [frontend.db.conn :as conn]
            [frontend.db.persist :as db-persist]
            [frontend.db.react :as react]
            [frontend.error :as error]
            [frontend.extensions.srs :as srs]
            [frontend.handler.command-palette :as command-palette]
            [frontend.handler.events :as events]
            [frontend.handler.file :as file-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.user :as user-handler]
            [frontend.handler.repo-config :as repo-config-handler]
            [frontend.handler.global-config :as global-config-handler]
            [frontend.handler.plugin-config :as plugin-config-handler]
            [frontend.idb :as idb]
            [frontend.mobile.util :as mobile-util]
            [frontend.modules.instrumentation.core :as instrument]
            [frontend.modules.outliner.datascript :as outliner-db]
            [frontend.modules.outliner.file :as file]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.persist-var :as persist-var]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

(defn set-global-error-notification!
  []
  (set! js/window.onerror
        (fn [message, _source, _lineno, _colno, error]
          (when-not (error/ignored? message)
            (log/error :exception error)
            ;; (notification/show!
            ;;  (str "message=" message "\nsource=" source "\nlineno=" lineno "\ncolno=" colno "\nerror=" error)
            ;;  :error
            ;;  ;; Don't auto-hide
            ;;  false)
            ))))


(defn- watch-for-date!
  []
  (let [f (fn []
            #_:clj-kondo/ignore
            (let [repo (state/get-current-repo)]
              (when (and (not (state/nfs-refreshing?))
                         (not (contains? (:file/unlinked-dirs @state/state)
                                         (config/get-repo-dir repo))))
                ;; Don't create the journal file until user writes something
                (page-handler/create-today-journal!))))]
    (f)
    (js/setInterval f 5000)))

(defn- instrument!
  []
  (let [total (srs/get-srs-cards-total)]
    (state/set-state! :srs/cards-due-count total)))

(defn restore-and-setup!
  [repos]
  (when-let [repo (or (state/get-current-repo) (:url (first repos)))]
    (-> (db/restore! repo)
        (p/then
         (fn []
           ;; try to load custom css only for current repo
           (ui-handler/add-style-if-exists!)

           (->
            (p/do! (repo-config-handler/start {:repo repo})
                   (when (config/global-config-enabled?)
                     (global-config-handler/start {:repo repo}))
                   (when (config/plugin-config-enabled?) (plugin-config-handler/start)))
            (p/finally
              (fn []
                ;; install after config is restored
                (shortcut/refresh!)

                (cond
                  (and (not (seq (db/get-files config/local-repo)))
                       ;; Not native local directory
                       (not (some config/local-db? (map :url repos)))
                       (not (mobile-util/native-platform?)))
                  ;; will execute `(state/set-db-restoring! false)` inside
                  (repo-handler/setup-local-repo-if-not-exists!)

                  :else
                  (state/set-db-restoring! false)))))))
        (p/then
         (fn []
           (js/console.log "db restored, setting up repo hooks")

           (state/pub-event! [:modal/nfs-ask-permission])

           (page-handler/init-commands!)

           (watch-for-date!)
           (file-handler/watch-for-current-graph-dir!)
           (state/pub-event! [:graph/restored (state/get-current-repo)])))
        (p/catch (fn [error]
                   (log/error :exception error))))))

(defn- handle-connection-change
  [e]
  (let [online? (= (gobj/get e "type") "online")]
    (state/set-online! online?)))

(defn set-network-watcher!
  []
  (js/window.addEventListener "online" handle-connection-change)
  (js/window.addEventListener "offline" handle-connection-change))

(defn enable-datalog-console
  "Enables datalog console in browser provided by https://github.com/homebaseio/datalog-console"
  []
  (js/document.documentElement.setAttribute "__datalog-console-remote-installed__" true)
  (.addEventListener js/window "message"
                     (fn [event]
                       (let [db (conn/get-db)]
                         (when-let [devtool-message (gobj/getValueByKeys event "data" ":datalog-console.client/devtool-message")]
                           (let [msg-type (:type (read-string devtool-message))]
                             (case msg-type

                               :datalog-console.client/request-whole-database-as-string
                               (.postMessage js/window #js {":datalog-console.remote/remote-message" (pr-str db)} "*")

                               nil)))))))

(defn clear-cache!
  []
  (notification/show! "Clearing..." :warning false)
  (p/let [_ (when (util/electron?)
              (ipc/ipc "clearCache"))
          _ (idb/clear-local-storage-and-idb!)]
    (js/setTimeout
     (fn [] (if (util/electron?)
              (ipc/ipc :reloadWindowPage)
              (js/window.location.reload)))
     2000)))

;; FIXME: Another get-repos implementation at src\main\frontend\handler\repo.cljs
(defn- get-repos
  []
  (p/let [nfs-dbs (db-persist/get-all-graphs)]
    ;; TODO: Better IndexDB migration handling
    (cond
      (and (mobile-util/native-platform?)
           (some #(or (string/includes? % " ")
                      (string/includes? % "logseq_local_/")) nfs-dbs))
      (do (notification/show! ["DB version is not compatible, please clear cache then re-add your graph back."
                               (ui/button
                                (t :settings-page/clear-cache)
                                :class    "ui__modal-enter"
                                :class    "text-sm p-1"
                                :on-click clear-cache!)] :error false)
          {:url config/local-repo
           :example? true})

      (seq nfs-dbs)
      (map (fn [db] {:url db :nfs? true}) nfs-dbs)

      :else
      [{:url config/local-repo
        :example? true}])))

(defn- register-components-fns!
  []
  (state/set-page-blocks-cp! page/page-blocks-cp)
  (state/set-component! :block/linked-references reference/block-linked-references)
  (state/set-component! :whiteboard/tldraw-preview whiteboard/tldraw-preview)
  (state/set-component! :block/single-block block/single-block-cp)
  (state/set-component! :editor/box editor/box)
  (command-palette/register-global-shortcut-commands))

(reset! db/*db-listener outliner-db/after-transact-pipelines)

(defn start!
  [render]
  (set-global-error-notification!)
  (register-components-fns!)
  (user-handler/restore-tokens-from-localstorage)
  (state/set-db-restoring! true)
  (render)
  (i18n/start)
  (instrument/init)
  (state/set-online! js/navigator.onLine)
  (set-network-watcher!)

  (util/indexeddb-check?
   (fn [_error]
     (notification/show! "Sorry, it seems that your browser doesn't support IndexedDB, we recommend to use latest Chrome(Chromium) or Firefox(Non-private mode)." :error false)
     (state/set-indexedb-support! false)))
  (idb/start)

  (react/run-custom-queries-when-idle!)

  (events/run!)

  (-> (p/let [repos (get-repos)
              _ (state/set-repos! repos)
              _ (restore-and-setup! repos)]
        (when (mobile-util/native-platform?)
          (p/do!
           (mobile-util/hide-splash)
           (state/restore-mobile-theme!))))
      (p/catch (fn [e]
                 (js/console.error "Error while restoring repos: " e)))
      (p/finally (fn []
                   (state/set-db-restoring! false))))

  (db/run-batch-txs!)
  (file/<ratelimit-file-writes!)
  (util/<app-wake-up-from-sleep-loop (atom false))

  (when config/dev?
    (enable-datalog-console))
  (when (util/electron?)
    (el/listen!))
  (persist-var/load-vars)
  (js/setTimeout instrument! (* 60 1000)))

(defn stop! []
  (prn "stop!"))

(defn quit-and-install-new-version!
  []
  (p/let [_ (el/persist-dbs!)
          _ (ipc/invoke "set-quit-dirty-state" false)]
    (ipc/ipc :quitAndInstall)))
