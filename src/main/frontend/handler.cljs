(ns frontend.handler
  (:require [electron.ipc :as ipc]
            [electron.listener :as el]
            [frontend.components.page :as page]
            [frontend.components.reference :as reference]
            [frontend.config :as config]
            [frontend.context.i18n :as i18n]
            [frontend.db :as db]
            [logseq.db.schema :as db-schema]
            [frontend.db.conn :as conn]
            [frontend.db.react :as react]
            [frontend.error :as error]
            [frontend.handler.command-palette :as command-palette]
            [frontend.handler.events :as events]
            [frontend.handler.file :as file-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.user :as user-handler]
            [frontend.extensions.srs :as srs]
            [frontend.mobile.util :as mobile-util]
            [frontend.idb :as idb]
            [frontend.modules.instrumentation.core :as instrument]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.state :as state]
            [frontend.storage :as storage]
            [frontend.util :as util]
            [frontend.util.persist-var :as persist-var]
            [cljs.reader :refer [read-string]]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]
            [frontend.db.persist :as db-persist]
            [frontend.modules.outliner.datascript :as outliner-db]))

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
    (state/set-state! :srs/cards-due-count total)
    (state/pub-event! [:instrument {:type :flashcards/count
                                    :payload {:total (or total 0)}}])
    (state/pub-event! [:instrument {:type :blocks/count
                                    :payload {:total (db/blocks-count)}}])))

(defn store-schema!
  []
  (storage/set :db-schema (assoc db-schema/schema
                                 :db/version db-schema/version)))

(defn restore-and-setup!
  [repos old-db-schema]
  (-> (db/restore!
       {:repos repos}
       old-db-schema
       (fn [repo]
         (file-handler/restore-config! repo false)))
      (p/then
       (fn []
         ;; try to load custom css only for current repo
         (ui-handler/add-style-if-exists!)

         ;; install after config is restored
         (shortcut/unlisten-all)
         (shortcut/refresh!)

         (cond
           (and (not (seq (db/get-files config/local-repo)))
                ;; Not native local directory
                (not (some config/local-db? (map :url repos)))
                (not (mobile-util/native-platform?)))
           ;; will execute `(state/set-db-restoring! false)` inside
           (repo-handler/setup-local-repo-if-not-exists!)

           :else
           (state/set-db-restoring! false))))
      (p/then
       (fn []
         (prn "db restored, setting up repo hooks")
         (store-schema!)

         (state/pub-event! [:modal/nfs-ask-permission])

         (page-handler/init-commands!)

         (watch-for-date!)
         (file-handler/watch-for-current-graph-dir!)
         (state/pub-event! [:graph/ready (state/get-current-repo)])
         (state/pub-event! [:graph/restored (state/get-current-repo)])))
      (p/catch (fn [error]
                 (log/error :exception error)))))

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
(defn- get-repos
  []
  (p/let [nfs-dbs (db-persist/get-all-graphs)
          nfs-dbs (map (fn [db]
                         {:url db :nfs? true}) nfs-dbs)]
    (cond
      (seq nfs-dbs)
      nfs-dbs

      :else
      [{:url config/local-repo
        :example? true}])))

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

(defn- register-components-fns!
  []
  (state/set-page-blocks-cp! page/page-blocks-cp)
  (state/set-component! :block/linked-references reference/block-linked-references)
  (command-palette/register-global-shortcut-commands))

(reset! db/*db-listener outliner-db/after-transact-pipelines)

(defn start!
  [render]
  (set-global-error-notification!)
  (let [db-schema (storage/get :db-schema)]
    (register-components-fns!)
    (state/set-db-restoring! true)
    (render)
    (i18n/start)
    (instrument/init)
    (set-network-watcher!)

    (util/indexeddb-check?
     (fn [_error]
       (notification/show! "Sorry, it seems that your browser doesn't support IndexedDB, we recommend to use latest Chrome(Chromium) or Firefox(Non-private mode)." :error false)
       (state/set-indexedb-support! false)))

    (react/run-custom-queries-when-idle!)

    (events/run!)

    (p/let [repos (get-repos)]
      (state/set-repos! repos)
      (restore-and-setup! repos db-schema)
      (when (mobile-util/native-platform?)
        (p/do! (mobile-util/hide-splash))))

    (db/run-batch-txs!)
    (file-handler/run-writes-chan!)
    (when config/dev?
      (enable-datalog-console))
    (when (util/electron?)
      (el/listen!))
    (persist-var/load-vars)
    (user-handler/refresh-tokens-loop)
    (js/setTimeout instrument! (* 60 1000))))

(defn stop! []
  (prn "stop!"))

(defn quit-and-install-new-version!
  []
  (p/let [_ (el/persist-dbs!)
          _ (ipc/invoke "set-quit-dirty-state" false)]
    (ipc/ipc :quitAndInstall)))
