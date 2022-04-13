(ns frontend.handler.events
  (:refer-clojure :exclude [run!])
  (:require [clojure.core.async :as async]
            [clojure.set :as set]
            [frontend.context.i18n :refer [t]]
            [frontend.components.diff :as diff]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.components.plugins :as plugin]
            [frontend.components.encryption :as encryption]
            [frontend.components.git :as git-component]
            [frontend.components.shell :as shell]
            [frontend.components.search :as search]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db-schema :as db-schema]
            [frontend.extensions.srs :as srs]
            [frontend.fs.nfs :as nfs]
            [frontend.fs.watcher-handler :as fs-watcher]
            [frontend.handler.common :as common-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.search :as search-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.file :as file-handler]
            [frontend.handler.route :as route-handler]
            [frontend.modules.shortcut.core :as st]
            [frontend.modules.outliner.file :as outliner-file]
            [frontend.commands :as commands]
            [frontend.spec :as spec]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [rum.core :as rum]
            [frontend.modules.instrumentation.posthog :as posthog]
            [frontend.mobile.util :as mobile-util]
            [frontend.encrypt :as encrypt]
            [promesa.core :as p]
            [frontend.fs :as fs]
            [clojure.string :as string]
            [frontend.util.persist-var :as persist-var]
            [frontend.fs.sync :as sync]))

;; TODO: should we move all events here?

(defn show-install-error!
  [repo-url title]
  (spec/validate :repos/url repo-url)
  (notification/show!
   [:p.content
    title
    " "
    [:span.mr-2
     (util/format
      "Please make sure that you've installed the logseq app for the repo %s on GitHub. "
      repo-url)
     (ui/button
      "Install Logseq on GitHub"
      :href (str "https://github.com/apps/" config/github-app-name "/installations/new"))]]
   :error
   false))

(defmulti handle first)

(defmethod handle :repo/install-error [[_ repo-url title]]
  (show-install-error! repo-url title))

(defmethod handle :modal/encryption-setup-dialog [[_ repo-url close-fn]]
  (state/set-modal!
   (encryption/encryption-setup-dialog repo-url close-fn)))

(defmethod handle :modal/encryption-input-secret-dialog [[_ repo-url db-encrypted-secret close-fn]]
  (state/set-modal!
   (encryption/encryption-input-secret-dialog
    repo-url
    db-encrypted-secret
    close-fn)))

(defmethod handle :graph/added [[_ repo {:keys [empty-graph?]}]]
  (db/set-key-value repo :ast/version db-schema/ast-version)
  (search-handler/rebuild-indices!)
  (db/persist! repo)
  (when (state/setups-picker?)
    (if empty-graph?
      (route-handler/redirect! {:to :import :query-params {:from "picker"}})
      (route-handler/redirect-to-home!))))

(defn- file-sync-stop-when-switch-graph []
  (p/do! (persist-var/load-vars)
         (sync/sync-stop)
         ;; trigger rerender file-sync-header
         (state/set-file-sync-state nil)))

(defn- graph-switch [graph]
  (repo-handler/push-if-auto-enabled! (state/get-current-repo))
  (state/set-current-repo! graph)
  ;; load config
  (common-handler/reset-config! graph nil)
  (st/refresh!)
  (when-not (= :draw (state/get-current-route))
    (route-handler/redirect-to-home!))
  (when-let [dir-name (config/get-repo-dir graph)]
    (fs/watch-dir! dir-name))
  (srs/update-cards-due-count!)
  (state/pub-event! [:graph/ready graph])

  (file-sync-stop-when-switch-graph))



(def persist-db-noti-m
  {:before     #(notification/show!
                 (ui/loading (t :graph/persist))
                 :warning)
   :on-error   #(notification/show!
                 (t :graph/persist-error)
                 :error)})

(defn- graph-switch-on-persisted
  "Logic for keeping db sync when switching graphs
   Only works for electron"
  [graph]
  (let [current-repo (state/get-current-repo)]
    (p/do!
     (when (util/electron?)
       (p/do!
        (repo-handler/persist-db! current-repo persist-db-noti-m)
        (repo-handler/persist-otherwindow-db! graph)))
     (repo-handler/restore-and-setup-repo! graph)
     (graph-switch graph))))

(defmethod handle :graph/switch [[_ graph]]
  (file-sync-stop-when-switch-graph)
  (if (outliner-file/writes-finished?)
    (graph-switch-on-persisted graph)
    (notification/show!
     "Please wait seconds until all changes are saved for the current graph."
     :warning)))

(defmethod handle :graph/open-new-window [[_ repo]]
  (p/let [current-repo (state/get-current-repo)
          target-repo (or repo current-repo)
          _ (repo-handler/persist-db! current-repo persist-db-noti-m)
          _ (when-not (= current-repo target-repo)
              (repo-handler/persist-otherwindow-db! repo))]
    (ui-handler/open-new-window! _ repo)))

(defmethod handle :graph/migrated [[_ _repo]]
  (js/alert "Graph migrated."))

(defmethod handle :graph/save [_]
  (repo-handler/persist-db! (state/get-current-repo)
                            {:before     #(notification/show!
                                           (ui/loading (t :graph/save))
                                           :warning)
                             :on-success #(notification/show!
                                           (ui/loading (t :graph/save-success))
                                           :warning)
                             :on-error   #(notification/show!
                                           (t :graph/save-error)
                                           :error)}))

(defn get-local-repo
  []
  (when-let [repo (state/get-current-repo)]
    (when (config/local-db? repo)
      repo)))

(defn ask-permission
  [repo]
  (when
   (and (not (util/electron?))
        (not (mobile-util/is-native-platform?)))
    (fn [close-fn]
      [:div
       [:p
        "Grant native filesystem permission for directory: "
        [:b (config/get-local-dir repo)]]
       (ui/button
        "Grant"
        :class "ui__modal-enter"
        :on-click (fn []
                    (nfs/check-directory-permission! repo)
                    (close-fn)))])))

(defmethod handle :modal/nfs-ask-permission []
  (when-let [repo (get-local-repo)]
    (state/set-modal! (ask-permission repo))))

(defonce *query-properties (atom {}))
(rum/defc query-properties-settings-inner < rum/reactive
  {:will-unmount (fn [state]
                   (reset! *query-properties {})
                   state)}
  [block shown-properties all-properties _close-fn]
  (let [query-properties (rum/react *query-properties)]
    [:div.p-4
     [:div.font-bold "Properties settings for this query:"]
     (for [property all-properties]
       (let [property-value (get query-properties property)
             shown? (if (nil? property-value)
                      (contains? shown-properties property)
                      property-value)]
         [:div.flex.flex-row.m-2.justify-between.align-items
          [:div (name property)]
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
  (fn [close-fn]
    (query-properties-settings-inner block shown-properties all-properties close-fn)))

(defmethod handle :modal/set-query-properties [[_ block all-properties]]
  (let [block-properties (some-> (get-in block [:block/properties :query-properties])
                                 (common-handler/safe-read-string "Parsing query properties failed"))
        shown-properties (if (seq block-properties)
                           (set block-properties)
                           (set all-properties))
        shown-properties (set/intersection (set all-properties) shown-properties)]
    (state/set-modal! (query-properties-settings block shown-properties all-properties))))

(defmethod handle :modal/show-cards [_]
  (state/set-modal! srs/global-cards {:id :srs
                                      :label "flashcards__cp"}))

(defmethod handle :modal/show-themes-modal [_]
  (plugin/open-select-theme!))

(rum/defc modal-output
  [content]
  content)

(defmethod handle :modal/show [[_ content]]
  (state/set-modal! #(modal-output content)))

(defmethod handle :modal/set-git-username-and-email [[_ _content]]
  (state/set-modal! git-component/set-git-username-and-email))

(defmethod handle :page/title-property-changed [[_ old-title new-title]]
  (page-handler/rename! old-title new-title))

(defmethod handle :page/create-today-journal [[_ _repo]]
  (p/let [_ (page-handler/create-today-journal!)]
    (ui-handler/re-render-root!)))

(defmethod handle :file/not-matched-from-disk [[_ path disk-content db-content]]
  (state/clear-edit!)
  (when-let [repo (state/get-current-repo)]
    (when (and disk-content db-content
               (not= (util/trim-safe disk-content) (util/trim-safe db-content)))
      (state/set-modal! #(diff/local-file repo path disk-content db-content)
                        {:label "diff__cp"}))))

(defmethod handle :modal/display-file-version [[_ path content hash]]
  (p/let [content (when content (encrypt/decrypt content))]
    (state/set-modal! #(git-component/file-specific-version path hash content))))

;; TODO: when "only restore the current graph instead of all the graphs" is done,
;; remove invoke of :graph/ready in graph/switch and restore-and-setup!
(defmethod handle :graph/ready [[_ repo]]
  (search-handler/rebuild-indices-when-stale! repo))

(defmethod handle :notification/show [[_ {:keys [content status clear?]}]]
  (notification/show! content status clear?))

(defmethod handle :command/run [_]
  (when (util/electron?)
    (state/set-modal! shell/shell)))

(defmethod handle :go/search [_]
  (state/set-modal! search/search-modal
                    {:fullscreen? false
                     :close-btn?  false}))

(defmethod handle :go/plugins [_]
  (plugin/open-plugins-modal!))

(defmethod handle :go/plugins-waiting-lists [_]
  (plugin/open-waiting-updates-modal!))

(defmethod handle :go/plugins-settings [[_ pid nav? title]]
  (if pid
    (do
      (state/set-state! :plugin/focused-settings pid)
      (state/set-state! :plugin/navs-settings? (not (false? nav?)))
      (plugin/open-focused-settings-modal! title))
    (state/close-sub-modal! "ls-focused-settings-modal")))


(defmethod handle :redirect-to-home [_]
  (page-handler/create-today-journal!))

(defmethod handle :instrument [[_ {:keys [type payload]}]]
  (posthog/capture type payload))

(defmethod handle :exec-plugin-cmd [[_ {:keys [pid cmd action]}]]
  (commands/exec-plugin-simple-command! pid cmd action))

(defmethod handle :shortcut-handler-refreshed [[_]]
  (when-not @st/*inited?
    (reset! st/*inited? true)
    (st/consume-pending-shortcuts!)))


(defmethod handle :mobile/keyboard-will-show [[_]]
  (when (and (state/get-left-sidebar-open?)
             (state/editing?))
    (state/set-left-sidebar-open! false)))

(defmethod handle :mobile/keyboard-did-show [[_]]
  (when-let [input (state/get-input)]
    (util/make-el-cursor-position-into-center-viewport input)))

(defmethod handle :plugin/consume-updates [[_ id pending? updated?]]
  (let [downloading? (:plugin/updates-downloading? @state/state)]

    (when-let [coming (and (not downloading?)
                           (get-in @state/state [:plugin/updates-coming id]))]
      (notification/show!
       (str "Checked: " (:title coming))
       :success))

    (if (and updated? downloading?)
      ;; try to start consume downloading item
      (if-let [n (state/get-next-selected-coming-update)]
        (plugin-handler/check-or-update-marketplace-plugin
         (assoc n :only-check false :error-code nil)
         (fn [^js e] (js/console.error "[Download Err]" n e)))
        (plugin-handler/close-updates-downloading))

      ;; try to start consume pending item
      (if-let [n (second (first (:plugin/updates-pending @state/state)))]
        (plugin-handler/check-or-update-marketplace-plugin
         (assoc n :only-check true :error-code nil)
         (fn [^js e]
           (notification/show! (.toString e) :error)
           (js/console.error "[Check Err]" n e)))
        ;; try to open waiting updates list
        (when (and pending? (seq (state/all-available-coming-updates)))
          (plugin/open-waiting-updates-modal!))))))

(defmethod handle :plugin/hook-db-tx [[_ {:keys [blocks tx-data] :as payload}]]
  (when-let [payload (and (seq blocks)
                          (merge payload {:tx-data (map #(into [] %) tx-data)}))]
    (plugin-handler/hook-plugin-db :changed payload)
    (plugin-handler/hook-plugin-block-changes payload)))

(defmethod handle :backup/broken-config [[_ repo content]]
  (when (and repo content)
    (let [path (config/get-config-path)
          broken-path (string/replace path "/config.edn" "/broken-config.edn")]
      (p/let [_ (fs/write-file! repo (config/get-repo-dir repo) broken-path content {})
              _ (file-handler/alter-file repo path config/config-default-content {:skip-compare? true})]
        (notification/show!
         [:p.content
          "It seems that your config.edn is broken. We've restored it with the default content and saved the previous content to the file logseq/broken-config.edn."]
         :warning
         false)))))

(defmethod handle :file-watcher/changed [[_ ^js event]]
  (fs-watcher/handle-changed!
   (.-event event)
   (update (js->clj event :keywordize-keys true)
           :path
           js/decodeURI)))

(defmethod handle :rebuild-slash-commands-list [[_]]
  (page-handler/rebuild-slash-commands-list!))

(defn run!
  []
  (let [chan (state/get-events-chan)]
    (async/go-loop []
      (let [payload (async/<! chan)]
        (try
          (handle payload)
          (catch js/Error error
            (let [type :handle-system-events/failed]
              (js/console.error (str type) (clj->js payload) "\n" error)
              (state/pub-event! [:instrument {:type    type
                                              :payload payload
                                              :error error}])))))
      (recur))
    chan))
