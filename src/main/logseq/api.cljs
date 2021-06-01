(ns ^:no-doc logseq.api
  (:require [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.db.utils :as db-utils]
            [frontend.handler.block :as block-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.dnd :as editor-dnd-handler]
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
            [frontend.commands :as commands]
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
(def ^:export check_editing
  (fn []
    (if (state/get-edit-input-id)
      (str (:block/uuid (state/get-edit-block))) false)))

(def ^:export insert_at_editing_cursor
  (fn [content]
    (when-let [input-id (state/get-edit-input-id)]
      (commands/simple-insert! input-id content {}))))

(def ^:export get_current_block
  (fn []
    (let [block (state/get-edit-block)
          block (or block (state/get-last-edit-block))
          block (and block (db-utils/pull (:db/id block)))]
      (bean/->js (normalize-keyword-for-json block)))))

(def ^:export get_current_block_content
  (fn []
    (state/get-edit-content)))

(def ^:export get_current_page
  (fn []
    (when-let [page (state/get-current-page)]
      (when-let [page (db-model/get-page page)]
        (bean/->js (normalize-keyword-for-json (db-utils/pull (:db/id page))))))))

(def ^:export edit_block
  (fn [block-uuid {:keys [pos] :or {pos :max} :as opts}]
    (when-let [block-uuid (and block-uuid (medley/uuid block-uuid))]
      (when-let [block (db-model/query-block-by-uuid block-uuid)]
        (editor-handler/edit-block! block pos nil block-uuid)))))

(def ^:export insert_block
  (fn [block-uuid-or-page-name content ^js opts]
    (let [{:keys [before sibling isPageBlock props]} (bean/->clj opts)
          page-name (and isPageBlock block-uuid-or-page-name)
          block-uuid (if isPageBlock nil (medley/uuid block-uuid-or-page-name))
          new-block (editor-handler/api-insert-new-block!
                     content {:block-uuid block-uuid :sibling? sibling :page page-name})]

      (bean/->js (normalize-keyword-for-json new-block)))))

(def ^:export remove_block
  (fn [block-uuid ^js opts]
    (let [{:keys [includeChildren]} (bean/->clj opts)
          repo (state/get-current-repo)]
      (editor-handler/delete-block-aux!
       {:block/uuid (medley/uuid block-uuid) :repo repo} includeChildren))))

(def ^:export update_block
  (fn [block-uuid content ^js opts]
    (let [opts (and opts (bean/->clj opts))
          repo (state/get-current-repo)
          editing? (string/ends-with? (state/get-edit-input-id) block-uuid)]

      (if editing?
        (state/set-edit-content! (state/get-edit-input-id) content)
        (editor-handler/save-block! repo (medley/uuid block-uuid) content)))))

(def ^:export move_block
  (fn [src-block-uuid target-block-uuid ^js opts]

    (let [{:keys [before children]} (bean/->clj opts)
          top? (boolean before)
          nested? (boolean children)
          src-block-uuid (db-model/query-block-by-uuid (medley/uuid src-block-uuid))
          target-block-uuid (db-model/query-block-by-uuid (medley/uuid target-block-uuid))]
      (editor-dnd-handler/move-block src-block-uuid target-block-uuid top? nested?))))

(def ^:export get_block
  (fn [id-or-uuid ^js opts]
    (when-let [block (cond
                       (number? id-or-uuid) (db-utils/pull id-or-uuid)
                       (string? id-or-uuid) (db-model/query-block-by-uuid id-or-uuid))]
      (when-let [uuid (:block/uuid block)]
        (let [{:keys [includeChildren]} (bean/->clj opts)
              block (if (not includeChildren) block (first (outliner-tree/blocks->vec-tree [block] uuid)))]
          (bean/->js (normalize-keyword-for-json block)))))))

(def ^:export upsert_block_property
  (fn [block-uuid key value]
    (editor-handler/set-block-property! (medley/uuid block-uuid) key value)))

(def ^:export remove_block_property
  (fn [block-uuid key]
    (editor-handler/remove-block-property! (medley/uuid block-uuid) key)))

(def ^:export get_block_property
  (fn [block-uuid key]
    (when-let [block (db-model/query-block-by-uuid block-uuid)]
      (get (:block/properties block) (keyword key)))))

(def ^:export get_block_properties
  (fn [block-uuid]
    (when-let [block (db-model/query-block-by-uuid block-uuid)]
      (bean/->js (normalize-keyword-for-json (:block/properties block))))))

(def ^:export get_current_page_blocks_tree
  (fn []
    (when-let [page (state/get-current-page)]
      (let [blocks (db-model/get-page-blocks-no-cache page)
            blocks (outliner-tree/blocks->vec-tree blocks page)
            ;; clean key
            blocks (normalize-keyword-for-json blocks)]
        (bean/->js blocks)))))

(def ^:export get_page_blocks_tree
  (fn [page-name]
    (when-let [_ (db-model/get-page page-name)]
      (let [blocks (db-model/get-page-blocks-no-cache page-name)
            blocks (outliner-tree/blocks->vec-tree blocks page-name)
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
