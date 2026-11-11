(ns electron.listener
  "System-component-like ns that defines listeners by event name to receive ipc
  messages from electron's main process"
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [dommy.core :as dom]
            [electron.ipc :as ipc]
            [electron.locale :as electron-locale]
            [frontend.context.i18n :as i18n]
            [frontend.db.async :as db-async]
            [frontend.handler.notification :as notification]
            [frontend.handler.route :as route-handler]
            [frontend.handler.search :as search-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.user :as user]
            [frontend.persist-db :as persist-db]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

(defn- safe-api-call
  "Force the callback result to be nil, otherwise, ipc calls could lead to
  window crash."
  [k f]
  (js/window.apis.on k (fn [data] (f data) nil)))

(defonce ^:private *deeplink-complete (atom state/app-ready-promise))

(defn- listen-for-deeplink!
  [channel handle!]
  (safe-api-call channel
                 (fn [data]
                   (swap! *deeplink-complete
                          (fn [previous]
                            (-> (p/let [_ previous
                                        result (handle! data)]
                                  result)
                                (p/catch #(log/error :deeplink/action-failed %))))))))

(defn- <redirect-when-exists!
  [{:keys [page-name block-id]}]
  (let [repo (state/get-current-repo)]
    (cond
      page-name
      (p/let [page (db-async/<get-block repo page-name {:children? false})]
        (when (and page (= repo (state/get-current-repo)))
          (route-handler/redirect-to-page! page-name {:block-id block-id})))

      block-id
      (p/let [block (db-async/<get-block repo block-id {:children? false})]
        (when (= repo (state/get-current-repo))
          (if block
            (route-handler/redirect-to-page! block-id)
            (notification/show! (i18n/t :electron/block-not-exist block-id) :error false)))))))

(defn- <open-graph!
  [data]
  (let [{:keys [graph-name i18n-key i18n-args] :as target} (bean/->clj data)]
    (if i18n-key
      (notification/show! (apply i18n/t (keyword i18n-key) i18n-args) :error false)
      (-> (p/let [switch-result (when (not= graph-name (state/get-current-repo))
                                  (state/pub-event! [:graph/switch graph-name]))
                  ;; Dispatch resolves with the handler promise, which must also complete.
                  _ switch-result]
            (when (= graph-name (state/get-current-repo))
              (<redirect-when-exists! target)))
          (p/catch (fn [error]
                     (log/error :deeplink/navigation-failed error)
                     (notification/show! (i18n/t :graph/build-error) :error false)))))))

(defn ^:large-vars/cleanup-todo listen-to-electron!
  []
  (safe-api-call "graph-lifecycle"
                 (fn [data]
                   (let [{:keys [repo phase generation]} (bean/->clj data)]
                     (persist-db/<invalidate-remote-repo! repo phase generation))))

  (safe-api-call "notification"
                 (fn [data]
                   (let [{:keys [type payload i18n-key i18n-args]} (bean/->clj data)
                         type (keyword type)
                         i18n-key (when i18n-key (keyword i18n-key))
                         content (if i18n-key
                                   (apply i18n/t i18n-key i18n-args)
                                   (str payload))
                         comp [:div content]]
                     (notification/show! comp type false))))

  (safe-api-call "rebuildSearchIndice"
                 (fn [_data]
                   (prn "Rebuild search indices")
                   (search-handler/rebuild-indices!)))

  (safe-api-call "setGitUsernameAndEmail"
                 (fn []
                   (state/pub-event! [:modal/set-git-username-and-email])))

  (safe-api-call "setCurrentGraph"
                 (fn []
                   (when-let [graph (state/get-current-repo)]
                     (ipc/ipc :setCurrentGraph graph))))

  (safe-api-call "redirect"
                 (fn [data]
                   (let [{:keys [payload]} (bean/->clj data)
                         payload (update payload :to keyword)]
                     (route-handler/redirect! payload))))

  (safe-api-call "redirectWhenExists"
                 (fn [data]
                   (<redirect-when-exists! (bean/->clj data))))

  (safe-api-call "foundInPage"
                 (fn [data]
                   (let [data' (bean/->clj data)]
                     (state/set-state! [:ui/find-in-page :matches] data')
                     (dom/remove-style! (dom/by-id "search-in-page-input") :visibility)
                     (dom/set-text! (dom/by-id "search-in-page-placeholder") "")
                     (ui/focus-element "search-in-page-input"))))

  (safe-api-call "loginCallback"
                 (fn [code]
                   (user/login-callback code)))

  (listen-for-deeplink! "quickCapture"
                      (fn [args]
                        (state/pub-event! [:editor/quick-capture args])))

  (listen-for-deeplink! "invokeCommand"
                      (fn [args]
                        (state/pub-event! [:editor/invoke-command args])))

  (safe-api-call "openNewWindowOfGraph"
                 ;; Handle open new window in renderer, until the destination graph doesn't rely on setting local storage
                 ;; No db cache persisting ensured. Should be handled by the caller
                 (fn [repo]
                   (ui-handler/open-new-window-or-tab! repo)))

  (listen-for-deeplink! "openGraph" <open-graph!)

  (safe-api-call "invokeLogseqAPI"
                 (fn [^js data]
                   (let [sync-id (.-syncId data)
                         method  (.-method data)
                         ns-method (some-> method (string/split "@"))
                         ns' (first ns-method)
                         method' (last ns-method)
                         args    (.-args data)
                         ret-fn! #(ipc/invoke (str :electron.server/sync! sync-id) %)
                         app? (contains? #{"app" "editor" "db" "cli"} ns')
                         ^js sdk1 (aget js/window.logseq "api")
                         ^js sdk2 (aget js/window.logseq "sdk")]

                     (try
                       (println "invokeLogseqAPI:" method ", args:" args)
                       (let [^js methodTarget (if app? sdk1 (aget sdk2 ns'))]
                         (when-not methodTarget
                           (throw (js/Error. (str "MethodNotExist: " method))))
                         (-> (p/promise (apply js-invoke methodTarget method' args))
                             (p/then #(ret-fn! %))
                             (p/catch #(do
                                         (js/console.error "Unexpected error:" %)
                                         (ret-fn! {:error (.-message %)})))))
                       (catch :default e
                         (js/console.error "Unexpected error:" e)
                         (ret-fn! {:error (.-message e)}))))))

  (safe-api-call "syncAPIServerState"
                 (fn [^js data]
                   (state/set-state! :electron/server (bean/->clj data))))

  (listen-for-deeplink! "handbook"
                      (fn [^js data]
                        (when-let [k (and data (.-key data))]
                          (state/open-handbook-pane! k)))))

(defn listen!
  []
  (listen-to-electron!)
  (electron-locale/push-locale! (state/get-state :preferred-language)))
