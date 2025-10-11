(ns logseq.api.app
  "app state/ui related apis"
  (:require [cljs-bean.core :as bean]
            [cljs.reader]
            [clojure.string :as string]
            [electron.ipc :as ipc]
            [frontend.config :as config]
            [frontend.db.utils :as db-utils]
            [frontend.handler.command-palette :as palette-handler]
            [frontend.handler.config :as config-handler]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.recent :as recent-handler]
            [frontend.handler.route :as route-handler]
            [frontend.modules.layout.core]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.version :as fv]
            [logseq.api.db-based :as db-based-api]
            [logseq.sdk.core]
            [logseq.sdk.experiments]
            [logseq.sdk.git]
            [logseq.sdk.utils :as sdk-utils]
            [reitit.frontend.easy :as rfe]))

(defn get_state_from_store
  [^js path]
  (when-let [path (if (string? path) [path] (bean/->clj path))]
    (some->> path
             (map #(if (string/starts-with? % "@")
                     (subs % 1)
                     (keyword %)))
             (get-in @state/state)
             (#(if (util/atom? %) @% %))
             (sdk-utils/normalize-keyword-for-json)
             (bean/->js))))

(defn set_state_from_store
  [^js path ^js value]
  (when-let [path (if (string? path) [path] (bean/->clj path))]
    (some->> path
             (map #(if (string/starts-with? % "@")
                     (subs % 1)
                     (keyword %)))
             (into [])
             (#(state/set-state! % (bean/->clj value))))))

(defn get_app_info
  ;; get app base info
  []
  (-> (sdk-utils/normalize-keyword-for-json
       {:version fv/version
        :supportDb true})
      (bean/->js)))

(def get_user_configs
  (fn []
    (bean/->js
     (sdk-utils/normalize-keyword-for-json
      {:preferred-language      (:preferred-language @state/state)
       :preferred-theme-mode    (:ui/theme @state/state)
       :preferred-format        (state/get-preferred-format)
       :preferred-workflow      (state/get-preferred-workflow)
       :preferred-todo          (state/get-preferred-todo)
       :preferred-date-format   (state/get-date-formatter)
       :preferred-start-of-week (state/get-start-of-week)
       :current-graph           (state/get-current-repo)
       :show-brackets           (state/show-brackets?)
       :enabled-journals        (state/enable-journals?)
       :enabled-flashcards      (state/enable-flashcards?)
       :me                      (state/get-me)}))))

(def get_current_graph_configs
  (fn [& keys]
    (some-> (state/get-config)
            (#(if (seq keys) (get-in % (map keyword keys)) %))
            (bean/->js))))

(def set_current_graph_configs
  (fn [^js configs]
    (when-let [configs (bean/->clj configs)]
      (when (map? configs)
        (doseq [[k v] configs]
          (config-handler/set-config! k v))))))

(def get_current_graph_favorites
  (fn []
    (if (config/db-based-graph?)
      (db-based-api/get-favorites)
      (some->> (:favorites (state/get-config))
               (remove string/blank?)
               (filter string?)
               (bean/->js)))))

(def get_current_graph_recent
  (fn []
    (some->> (recent-handler/get-recent-pages)
             (map #(db-utils/entity (:db/id %)))
             (remove nil?)
             (sdk-utils/normalize-keyword-for-json)
             (bean/->js))))

(def get_current_graph
  (fn []
    (when-let [repo (state/get-current-repo)]
      (when-not (= config/demo-repo repo)
        (bean/->js {:url  repo
                    :name (util/node-path.basename repo)
                    :path (config/get-repo-dir repo)})))))

(def show_themes
  (fn []
    (state/pub-event! [:modal/show-themes-modal])))

(def set_theme_mode
  (fn [mode]
    (state/set-theme-mode! mode)))

(def relaunch
  (fn []
    (ipc/ipc "relaunchApp")))

(def quit
  (fn []
    (ipc/ipc "quitApp")))

(def open_external_link
  (fn [url]
    (when (re-find #"https?://" url)
      (js/apis.openExternal url))))

(def invoke_external_command
  (fn [type & args]
    (when-let [id (and (string/starts-with? type "logseq.")
                       (-> (string/replace type #"^logseq." "")
                           (util/safe-lower-case)
                           (keyword)))]
      (when-let [action (get-in (palette-handler/get-commands-unique) [id :action])]
        (apply plugin-handler/hook-lifecycle-fn! id action args)))))

;; flag - boolean | 'toggle'
(def set_left_sidebar_visible
  (fn [flag]
    (if (= flag "toggle")
      (state/toggle-left-sidebar!)
      (state/set-state! :ui/left-sidebar-open? (boolean flag)))
    nil))

;; flag - boolean | 'toggle'
(def set_right_sidebar_visible
  (fn [flag]
    (if (= flag "toggle")
      (state/toggle-sidebar-open?!)
      (state/set-state! :ui/sidebar-open? (boolean flag)))
    nil))

(def clear_right_sidebar_blocks
  (fn [^js opts]
    (state/clear-sidebar-blocks!)
    (when-let [opts (and opts (bean/->clj opts))]
      (and (:close opts) (state/hide-right-sidebar!)))
    nil))

(def push_state
  (fn [^js k ^js params ^js query]
    (let [k (keyword k)
          page? (= k :page)
          params (bean/->clj params)
          query (bean/->clj query)]
      (if page?
        (-> (:name params)
            (route-handler/redirect-to-page! {:anchor (:anchor query) :push true}))
        (rfe/push-state k params query)))))

(def replace_state
  (fn [^js k ^js params ^js query]
    (let [k (keyword k)
          page? (= k :page)
          params (bean/->clj params)
          query (bean/->clj query)]
      (if-let [page-name (and page? (:name params))]
        (route-handler/redirect-to-page! page-name {:anchor (:anchor query) :push false})
        (rfe/replace-state k params query)))))
