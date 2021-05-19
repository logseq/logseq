(ns ^:no-doc logseq.api
  (:require [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.db.utils :as db-utils]
            [frontend.handler.block :as block-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.modules.outliner.tree :as outliner-tree]
            [frontend.util :as util]
            [electron.ipc :as ipc]
            [promesa.core :as p]
            [sci.core :as sci]
            [lambdaisland.glogi :as log]
            [camel-snake-kebab.core :as csk]
            [cljs-bean.core :as bean]
            [frontend.state :as state]
            [frontend.components.plugins :as plugins]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.notification :as notification]
            [datascript.core :as d]
            [medley.core :as medley]
            [frontend.fs :as fs]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [cljs.reader]
            [reitit.frontend.easy :as rfe]
            [frontend.db.query-dsl :as query-dsl]))

;; helpers
(defn- normalize-keyword-for-json
  [input]
  (when input
    (walk/postwalk
     (fn [a]
       (cond
         (keyword? a) (csk/->camelCase (name a))
         (uuid? a) (str a)
         :else a)) input)))

(defn- parse-hiccup-ui
  [input]
  (when (string? input)
    (try
      (sci/eval-string input {:preset :termination-safe})
      (catch js/Error e
        (js/console.error "[parse hiccup error]" e) input))))

;; base
(def ^:export get_user_configs
  (fn []
    (bean/->js
     (normalize-keyword-for-json
      {:preferred-language (:preferred-language @state/state)
       :preferred-format   (state/get-preferred-format)
       :preferred-workflow (state/get-preferred-workflow)
       :preferred-todo     (state/get-preferred-todo)
       :current-graph (state/get-current-repo)
       :me (state/get-me)}))))

(def ^:export show_themes
  (fn []
    (plugins/open-select-theme!)))

(def ^:export set_theme_mode
  (fn [mode]
    (state/set-theme! (if (= mode "light") "white" "dark"))))

(def ^:export load_plugin_config
  (fn [path]
    (fs/read-file "" (util/node-path.join path "package.json"))))

(def ^:export load_plugin_readme
  (fn [path]
    (fs/read-file "" (util/node-path.join path "readme.md"))))

(def ^:export save_plugin_config
  (fn [path ^js data]
    (let [repo ""
          path (util/node-path.join path "package.json")]
      (fs/write-file! repo "" path (js/JSON.stringify data nil 2) {:skip-mtime? true}))))

(def ^:export write_user_tmp_file
  (fn [file content]
    (p/let [repo ""
            path (plugin-handler/get-ls-dotdir-root)
            path (util/node-path.join path "tmp")
            exist? (fs/file-exists? path "")
            _ (when-not exist? (fs/mkdir! path))
            path (util/node-path.join path file)
            _ (fs/write-file! repo "" path content {:skip-mtime? true})]
      path)))

(def ^:export load_user_preferences
  (fn []
    (p/let [repo ""
            path (plugin-handler/get-ls-dotdir-root)
            path (util/node-path.join path "preferences.json")
            _ (fs/create-if-not-exists repo "" path)
            json (fs/read-file "" path)
            json (if (string/blank? json) "{}" json)]
      (js/JSON.parse json))))

(def ^:export save_user_preferences
  (fn [^js data]
    (when data
      (p/let [repo ""
              path (plugin-handler/get-ls-dotdir-root)
              path (util/node-path.join path "preferences.json")]
        (fs/write-file! repo "" path (js/JSON.stringify data nil 2) {:skip-mtime? true})))))

(def ^:export load_plugin_user_settings
  (fn [key]
    (p/let [repo ""
            path (plugin-handler/get-ls-dotdir-root)
            exist? (fs/file-exists? path "settings")
            _ (when-not exist? (fs/mkdir! (util/node-path.join path "settings")))
            path (util/node-path.join path "settings" (str key ".json"))
            _ (fs/create-if-not-exists repo "" path "{}")
            json (fs/read-file "" path)]
      [path (js/JSON.parse json)])))

(def ^:export save_plugin_user_settings
  (fn [key ^js data]
    (p/let [repo ""
            path (plugin-handler/get-ls-dotdir-root)
            path (util/node-path.join path "settings" (str key ".json"))]
      (fs/write-file! repo "" path (js/JSON.stringify data nil 2) {:skip-mtime? true}))))

(def ^:export register_plugin_slash_command
  (fn [pid ^js cmd-actions]
    (when-let [[cmd actions] (bean/->clj cmd-actions)]
      (plugin-handler/register-plugin-slash-command
       pid [cmd (mapv #(into [(keyword (first %))]
                             (rest %)) actions)]))))

(def ^:export register_plugin_simple_command
  (fn [pid ^js cmd-action]
    (when-let [[cmd action] (bean/->clj cmd-action)]
      (plugin-handler/register-plugin-simple-command
       pid cmd (assoc action 0 (keyword (first action)))))))

;; app
(def ^:export push_state
  (fn [^js k ^js params]
    (rfe/push-state
     (keyword k) (bean/->clj params))))

(def ^:export replace_state
  (fn [^js k ^js params]
    (rfe/replace-state
     (keyword k) (bean/->clj params))))

;; editor
(def ^:export get_current_block
  (fn []
    (let [block (state/get-edit-block)
          block (or block (state/get-last-edit-block))]
      (bean/->js (normalize-keyword-for-json block)))))

(def ^:export get_current_page
  (fn []
    (when-let [page (state/get-current-page)]
      (when-let [page (db-model/get-page page)]
        (bean/->js (normalize-keyword-for-json (db-utils/pull (:db/id page))))))))

(def ^:export insert_block
  (fn [block-uuid content ^js opts]
    (when-let [block-uuid (and block-uuid (medley/uuid block-uuid))]
      (let [{:keys [before sibling props]} (bean/->clj opts)]
        (editor-handler/api-insert-new-block! content {:block-uuid block-uuid :sibling? sibling})))))

(def ^:export get_block
  (fn [id-or-uuid]
    (when-let [ret (cond
                     (number? id-or-uuid) (db-utils/pull id-or-uuid)
                     (string? id-or-uuid) (db-model/query-block-by-uuid id-or-uuid))]
      (when (contains? ret :block/uuid)
        (bean/->js (normalize-keyword-for-json ret))))))

(def ^:export get_current_page_blocks_tree
  (fn []
    (when-let [page (state/get-current-page)]
      (let [blocks (db-model/get-page-blocks-no-cache page)
            blocks (mapv #(-> %
                              (dissoc :block/children)
                              (assoc :block/uuid (str (:block/uuid %))))
                         blocks)
            blocks (outliner-tree/blocks->vec-tree blocks (:db/id (db/get-page (state/get-current-page))))
            ;; clean key
            blocks (normalize-keyword-for-json blocks)]
        (bean/->js blocks)))))

;; db
(defn ^:export q
  [query-string]
  (when-let [repo (state/get-current-repo)]
    (when-let [conn (db/get-conn repo)]
      (when-let [result (query-dsl/query repo query-string)]
        (clj->js @result)))))

(defn ^:export datascript_query
  [query & inputs]
  (when-let [repo (state/get-current-repo)]
    (when-let [conn (db/get-conn repo)]
      (let [query (cljs.reader/read-string query)
            result (apply d/q query conn inputs)]
        (clj->js result)))))

(def ^:export custom_query db/custom-query)

;; helpers
(defn ^:export show_msg
  ([content] (show_msg content :success))
  ([content status] (let [hiccup? (and (string? content) (string/starts-with? (string/triml content) "[:"))
                          content (if hiccup? (parse-hiccup-ui content) content)]
                      (notification/show! content (keyword status)))))
