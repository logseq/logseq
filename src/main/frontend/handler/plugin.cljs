(ns frontend.handler.plugin
  (:require [promesa.core :as p]
            [rum.core :as rum]
            [frontend.util :as util]
            [frontend.fs :as fs]
            [frontend.format.mldoc :refer [->MldocMode] :as mldoc]
            [frontend.handler.notification :as notifications]
            [frontend.storage :as storage]
            [camel-snake-kebab.core :as csk]
            [frontend.state :as state]
            [medley.core :as md]
            [electron.ipc :as ipc]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [lambdaisland.glogi :as log]
            [frontend.format :as format]))

(defonce lsp-enabled?
  (and (util/electron?)
       (= (storage/get "developer-mode") "true")))

(defn invoke-exported-api
  [type & args]
  (try
    (apply js-invoke js/logseq.api type args)
    (catch js/Error e (js/console.error e))))

;; state handlers
(defn register-plugin
  [pl]
  (swap! state/state update-in [:plugin/installed-plugins] assoc (keyword (:id pl)) pl))

(defn unregister-plugin
  [id]
  (js/LSPluginCore.unregister id))

(defn host-mounted!
  []
  (and lsp-enabled? (js/LSPluginCore.hostMounted)))

(defn register-plugin-slash-command
  [pid [cmd actions]]
  (when-let [pid (keyword pid)]
    (when (contains? (:plugin/installed-plugins @state/state) pid)
      (do (swap! state/state update-in [:plugin/installed-commands pid]
                 (fnil merge {}) (hash-map cmd (mapv #(conj % {:pid pid}) actions)))
          true))))

(defn unregister-plugin-slash-command
  [pid]
  (swap! state/state md/dissoc-in [:plugin/installed-commands (keyword pid)]))

(defn register-plugin-simple-command
  ;; action => [:action-key :event-key]
  [pid {:keys [key label type] :as cmd} action]
  (when-let [pid (keyword pid)]
    (when (contains? (:plugin/installed-plugins @state/state) pid)
      (do (swap! state/state update-in [:plugin/simple-commands pid]
                 (fnil conj []) [type cmd action pid])
          true))))

(defn unregister-plugin-simple-command
  [pid]
  (swap! state/state md/dissoc-in [:plugin/simple-commands (keyword pid)]))

(defn register-plugin-ui-item
  [pid {:keys [key type template] :as opts}]
  (when-let [pid (keyword pid)]
    (when (contains? (:plugin/installed-plugins @state/state) pid)
      (do (swap! state/state update-in [:plugin/installed-ui-items pid]
                 (fnil conj []) [type opts pid])
          true))))

(defn unregister-plugin-ui-items
  [pid]
  (swap! state/state assoc-in [:plugin/installed-ui-items (keyword pid)] []))

(defn update-plugin-settings
  [id settings]
  (swap! state/state update-in [:plugin/installed-plugins id] assoc :settings settings))

(defn parse-user-md-content
  [content {:keys [url]}]
  (try
    (if-not (string/blank? content)
      (let [content (if-not (string/blank? url)
                      (string/replace
                       content #"!\[[^\]]*\]\((.*?)\s*(\"(?:.*[^\"])\")?\s*\)"
                       (fn [[matched link]]
                         (if (and link (not (string/starts-with? link "http")))
                           (string/replace matched link (util/node-path.join url link))
                           matched)))
                      content)]
        (format/to-html content :markdown (mldoc/default-config :markdown))))
    (catch js/Error e
      (log/error :parse-user-md-exception e)
      content)))

(defn open-readme!
  [url item display]
  (when url
    (-> (p/let [content (invoke-exported-api "load_plugin_readme" url)
                content (parse-user-md-content content item)]
          (state/set-state! :plugin/active-readme [content item])
          (state/set-modal! display))
        (p/catch #(notifications/show! "No README file." :warn)))))

(defn load-unpacked-plugin
  []
  (if util/electron?
    (p/let [path (ipc/ipc "openDialogSync")]
      (when-not (:plugin/selected-unpacked-pkg @state/state)
        (state/set-state! :plugin/selected-unpacked-pkg path)))))

(defn reset-unpacked-state
  []
  (state/set-state! :plugin/selected-unpacked-pkg nil))

(defn hook-plugin
  [tag type payload plugin-id]
  (when lsp-enabled?
    (js-invoke js/LSPluginCore
               (str "hook" (string/capitalize (name tag)))
               (name type)
               (if (coll? payload)
                 (bean/->js (into {} (for [[k v] payload] [(csk/->camelCase k) (if (uuid? v) (str v) v)])))
                 payload)
               (if (keyword? plugin-id) (name plugin-id) plugin-id))))

(defn hook-plugin-app
  ([type payload] (hook-plugin-app type payload nil))
  ([type payload plugin-id] (hook-plugin :app type payload plugin-id)))

(defn hook-plugin-editor
  ([type payload] (hook-plugin-editor type payload nil))
  ([type payload plugin-id] (hook-plugin :editor type payload plugin-id)))

(defn get-ls-dotdir-root
  []
  (ipc/ipc "getLogseqDotDirRoot"))

(defn- get-user-default-plugins
  []
  (p/catch
   (p/let [files ^js (ipc/ipc "getUserDefaultPlugins")
           files (js->clj files)]
     (map #(hash-map :url %) files))
   (fn [e]
     (js/console.error e))))

;; components
(rum/defc lsp-indicator < rum/reactive
  []
  (let [text (state/sub :plugin/indicator-text)]
    (if (= text "END")
      [:span]
      [:div
       {:style
        {:width           "100%"
         :height          "100vh"
         :display         "flex"
         :align-items     "center"
         :justify-content "center"}}
       [:span
        {:style
         {:color     "#aaa"
          :font-size "38px"}} (or text "Loading ...")]])))

(defn init-plugins
  [callback]

  (let [el (js/document.createElement "div")]
    (.appendChild js/document.body el)
    (rum/mount
     (lsp-indicator) el))

  (state/set-state! :plugin/indicator-text "Loading...")

  (p/then
   (p/let [root (get-ls-dotdir-root)
           _ (.setupPluginCore js/LSPlugin (bean/->js {:localUserConfigRoot root}))
           _ (doto js/LSPluginCore
               (.on "registered"
                    (fn [^js pl]
                      (register-plugin
                       (bean/->clj (.parse js/JSON (.stringify js/JSON pl))))))

               (.on "unregistered" (fn [pid]
                                     (let [pid (keyword pid)]
                                        ;; plugins
                                       (swap! state/state md/dissoc-in [:plugin/installed-plugins (keyword pid)])
                                        ;; commands
                                       (unregister-plugin-slash-command pid)
                                       (unregister-plugin-simple-command pid)
                                       (unregister-plugin-ui-items pid))))

               (.on "disabled" (fn [pid]
                                 (unregister-plugin-slash-command pid)
                                 (unregister-plugin-simple-command pid)
                                 (unregister-plugin-ui-items pid)))

               (.on "theme-changed" (fn [^js themes]
                                      (swap! state/state assoc :plugin/installed-themes
                                             (vec (mapcat (fn [[_ vs]] (bean/->clj vs)) (bean/->clj themes))))))

               (.on "theme-selected" (fn [^js opts]
                                       (let [opts (bean/->clj opts)
                                             url (:url opts)
                                             mode (:mode opts)]
                                         (when mode (state/set-theme! mode))
                                         (state/set-state! :plugin/selected-theme url))))

               (.on "settings-changed" (fn [id ^js settings]
                                         (let [id (keyword id)]
                                           (when (and settings
                                                      (contains? (:plugin/installed-plugins @state/state) id))
                                             (update-plugin-settings id (bean/->clj settings)))))))

           default-plugins (get-user-default-plugins)

           _ (.register js/LSPluginCore (bean/->js (if (seq default-plugins) default-plugins [])) true)])
   #(do
      (state/set-state! :plugin/indicator-text "END")
      (callback))))

(defn setup!
  "setup plugin core handler"
  [callback]
  (if (not lsp-enabled?)
    (callback)
    (init-plugins callback)))
