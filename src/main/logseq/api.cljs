(ns logseq.api
  "Logseq API for plugins usage"
  (:require [cljs-bean.core :as bean]
            [cljs.reader]
            [electron.ipc :as ipc]
            [frontend.config :as config]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.search :as search-handler]
            [frontend.loader :as loader]
            [frontend.modules.layout.core]
            [frontend.state :as state]
            [logseq.api.app :as api-app]
            [logseq.api.db :as api-db]
            [logseq.api.db-based :as db-based-api]
            [logseq.api.db-based.cli :as cli-based-api]
            [logseq.api.editor :as api-editor]
            [logseq.api.file-based :as file-based-api]
            [logseq.api.plugin :as api-plugin]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.sdk.assets :as sdk-assets]
            [logseq.sdk.core]
            [logseq.sdk.experiments]
            [logseq.sdk.git]
            [logseq.sdk.ui :as sdk-ui]
            [logseq.sdk.utils :as sdk-utils]
            [promesa.core :as p]))

;; Alert: All apis shouldn't invoke any reactive queries

;; plugin apis
(def ^:export get_caller_plugin_id api-plugin/get-caller-plugin-id)
(def ^:export install_plugin_hook api-plugin/install-plugin-hook)
(def ^:export uninstall_plugin_hook api-plugin/uninstall-plugin-hook)
(def ^:export should_exec_plugin_hook api-plugin/should-exec-plugin-hook)
(def ^:export load_plugin_config api-plugin/load_plugin_config)
(def ^:export load_plugin_readme api-plugin/load_plugin_readme)
(def ^:export save_plugin_package_json api-plugin/save_plugin_package_json)
(def ^:export write_dotdir_file api-plugin/write_dotdir_file)
(def ^:export write_assetsdir_file api-plugin/write_assetsdir_file)
(def ^:export write_user_tmp_file api-plugin/write_user_tmp_file)
(def ^:export write_plugin_storage_file api-plugin/write_plugin_storage_file)
(def ^:export read_plugin_storage_file api-plugin/read_plugin_storage_file)
(def ^:export unlink_plugin_storage_file api-plugin/unlink_plugin_storage_file)
(def ^:export exist_plugin_storage_file api-plugin/exist_plugin_storage_file)
(def ^:export clear_plugin_storage_files api-plugin/clear_plugin_storage_files)
(def ^:export list_plugin_storage_files api-plugin/list_plugin_storage_files)
(def ^:export load_user_preferences api-plugin/load_user_preferences)
(def ^:export save_user_preferences api-plugin/save_user_preferences)
(def ^:export load_plugin_user_settings api-plugin/load_plugin_user_settings)
(def ^:export save_plugin_user_settings api-plugin/save_plugin_user_settings)
(def ^:export load_installed_web_plugins api-plugin/load_installed_web_plugins)
(def ^:export save_installed_web_plugin api-plugin/save_installed_web_plugin)
(def ^:export unlink_installed_web_plugin api-plugin/unlink_installed_web_plugin)
(def ^:export unlink_plugin_user_settings api-plugin/unlink_plugin_user_settings)
(def ^:export register_plugin_slash_command api-plugin/register_plugin_slash_command)
(def ^:export register_plugin_simple_command api-plugin/register_plugin_simple_command)
(def ^:export unregister_plugin_simple_command api-plugin/unregister_plugin_simple_command)
(def ^:export register_search_service api-plugin/register_search_service)
(def ^:export unregister_search_services api-plugin/unregister_search_services)
(def ^:export register_plugin_ui_item api-plugin/register_plugin_ui_item)
(def ^:export get_external_plugin api-plugin/get_external_plugin)
(def ^:export invoke_external_plugin_cmd api-plugin/invoke_external_plugin_cmd)
(def ^:export validate_external_plugins api-plugin/validate_external_plugins)
(def ^:export __install_plugin api-plugin/__install_plugin)

;; app/graph
(def ^:export check_current_is_db_graph config/db-based-graph?)
(def ^:export get_state_from_store api-app/get_state_from_store)
(def ^:export set_state_from_store api-app/set_state_from_store)
(def ^:export get_app_info api-app/get_app_info)
(def ^:export get_user_configs api-app/get_user_configs)
(def ^:export get_current_graph_configs api-app/get_current_graph_configs)
(def ^:export set_current_graph_configs api-app/set_current_graph_configs)
(def ^:export get_current_graph_favorites api-app/get_current_graph_favorites)
(def ^:export get_current_graph_recent api-app/get_current_graph_recent)
(def ^:export get_current_graph api-app/get_current_graph)
(def ^:export show_themes api-app/show_themes)
(def ^:export set_theme_mode api-app/set_theme_mode)
(def ^:export relaunch api-app/relaunch)
(def ^:export quit api-app/quit)
(def ^:export open_external_link api-app/open_external_link)
(def ^:export invoke_external_command api-app/invoke_external_command)
(def ^:export set_left_sidebar_visible api-app/set_left_sidebar_visible)
(def ^:export set_right_sidebar_visible api-app/set_right_sidebar_visible)
(def ^:export clear_right_sidebar_blocks api-app/clear_right_sidebar_blocks)
(def ^:export push_state api-app/push_state)
(def ^:export replace_state api-app/replace_state)

;; db
(def ^:export q api-db/q)
(def ^:export datascript_query api-db/datascript_query)
(def ^:export custom_query api-db/custom_query)

;; editor
(def ^:export prepend_block_in_page api-editor/prepend_block_in_page)
(def ^:export append_block_in_page api-editor/append_block_in_page)
(def ^:export check_editing api-editor/check_editing)
(def ^:export clear_selected_blocks api-editor/clear_selected_blocks)
(def ^:export create_journal_page api-editor/create_journal_page)
(def ^:export create_page api-editor/create_page)
(def ^:export delete_page api-editor/delete_page)
(def ^:export download_graph_db api-editor/download_graph_db)
(def ^:export download_graph_pages api-editor/download_graph_pages)
(def ^:export edit_block api-editor/edit_block)
(def ^:export exec_git_command api-editor/exec_git_command)
(def ^:export exit_editing_mode api-editor/exit_editing_mode)
(def ^:export get_all_pages api-editor/get_all_pages)
(def ^:export get_block api-editor/get_block)
(def ^:export get_block_properties api-editor/get_block_properties)
(def ^:export get_block_property api-editor/get_block_property)
(def ^:export get_current_block api-editor/get_current_block)
(def ^:export get_current_page api-editor/get_current_page)
(def ^:export get_current_page_blocks_tree api-editor/get_current_page_blocks_tree)
(def ^:export get_editing_block_content api-editor/get_editing_block_content)
(def ^:export get_editing_cursor_position api-editor/get_editing_cursor_position)
(def ^:export get_next_sibling_block api-editor/get_next_sibling_block)
(def ^:export get_page api-editor/get_page)
(def ^:export get_page_blocks_tree api-editor/get_page_blocks_tree)
(def ^:export get_page_linked_references api-editor/get_page_linked_references)
(def ^:export get_page_properties api-editor/get_page_properties)
(def ^:export get_previous_sibling_block api-editor/get_previous_sibling_block)
(def ^:export get_selected_blocks api-editor/get_selected_blocks)
(def ^:export insert_at_editing_cursor api-editor/insert_at_editing_cursor)
(def ^:export insert_batch_block api-editor/insert_batch_block)
(def ^:export insert_block api-editor/insert_block)
(def ^:export move_block api-editor/move_block)
(def ^:export new_block_uuid api-editor/new_block_uuid)
(def ^:export open_in_right_sidebar api-editor/open_in_right_sidebar)
(def ^:export remove_block api-editor/remove_block)
(def ^:export remove_block_property api-editor/remove_block_property)
(def ^:export rename_page api-editor/rename_page)
(def ^:export restore_editing_cursor api-editor/restore_editing_cursor)
(def ^:export save_focused_code_editor_content api-editor/save_focused_code_editor_content)
(def ^:export select_block api-editor/select_block)
(def ^:export set_block_collapsed api-editor/set_block_collapsed)
(def ^:export update_block api-editor/update_block)
(def ^:export upsert_block_property api-editor/upsert_block_property)

;; ui
(def ^:export show_msg sdk-ui/-show_msg)
(def ^:export query_element_rect sdk-ui/query_element_rect)
(def ^:export query_element_by_id sdk-ui/query_element_by_id)

;; assets
(def ^:export make_asset_url sdk-assets/make_url)

;; experiments
(defn ^:export exper_load_scripts
  [pid & scripts]
  (when-let [^js _pl (plugin-handler/get-plugin-inst pid)]
    (some-> (for [s scripts
                  :let [upt-status #(state/upt-plugin-resource pid :scripts s :status %)
                        init? (contains? #{:error nil} (:status (state/get-plugin-resource pid :scripts s)))]]
              (when init?
                (plugin-handler/register-plugin-resources pid :scripts {:key s :src s})
                (upt-status :pending)
                (-> (loader/load s nil {:attributes {:data-ref (name pid)}})
                    (p/then (fn [] (upt-status :done)))
                    (p/catch (fn [] (upt-status :error))))))
            (vec)
            (p/all))))

;; http request
(defonce ^:private *request-k (volatile! 0))

(defn ^:export exper_request
  [pid ^js options]
  (when-let [^js pl (plugin-handler/get-plugin-inst pid)]
    (let [req-id (vreset! *request-k (inc @*request-k))
          req-cb #(plugin-handler/request-callback pl req-id %)]
      (-> (ipc/ipc :httpRequest req-id options)
          (p/then #(req-cb %))
          (p/catch #(req-cb %)))
      req-id)))

(defn ^:export http_request_abort
  [req-id]
  (ipc/ipc :httpRequestAbort req-id))

;; search
(defn ^:export search
  [q' & [opts]]
  (-> (search-handler/search (state/get-current-repo) q' (if opts (js->clj opts :keywordize-keys true) {}))
      (p/then #(bean/->js (sdk-utils/normalize-keyword-for-json %)))))

;; helpers
(defn ^:export set_focused_settings
  [pid]
  (when-let [plugin (state/get-plugin-by-id pid)]
    (state/set-state! :plugin/focused-settings pid)
    (state/pub-event! [:go/plugins-settings pid false (or (:name plugin) (:title plugin))])))

(defn ^:export force_save_graph
  []
  true)

;; db based graph APIs
(def ^:export get_property db-based-api/get-property)
(def ^:export upsert_property db-based-api/upsert-property)
(def ^:export remove_property db-based-api/remove-property)
(def ^:export get_all_tags db-based-api/get-all-tags)
(def ^:export get_all_properties db-based-api/get-all-properties)
(def ^:export get_tag_objects db-based-api/get-tag-objects)
(def ^:export create_tag db-based-api/create-tag)
(def ^:export get_tag db-based-api/get-tag)
(def ^:export add_block_tag db-based-api/add-block-tag)
(def ^:export remove_block_tag db-based-api/remove-block-tag)
(def ^:export add_tag_property db-based-api/tag-add-property)
(def ^:export remove_tag_property db-based-api/tag-remove-property)

;; Internal db-based CLI APIs
;; CLI APIs should use ensure-db-graph unless they have a nested check in cli-common-mcp-tools ns
(defn- ensure-db-graph
  [f]
  (fn ensure-db-graph-wrapper [& args]
    (when-not (sqlite-util/db-based-graph? (state/get-current-repo))
      (throw (ex-info "This endpoint must be called on a DB graph" {})))
    (apply f args)))

(def ^:export list_tags cli-based-api/list-tags)
(def ^:export list_properties cli-based-api/list-properties)
(def ^:export list_pages cli-based-api/list-pages)
(def ^:export get_page_data cli-based-api/get-page-data)
(def ^:export upsert_nodes cli-based-api/upsert-nodes)
(def ^:export import_edn (ensure-db-graph cli-based-api/import-edn))
(def ^:export export_edn (ensure-db-graph cli-based-api/export-edn))

;; file based graph APIs
(def ^:export get_current_graph_templates file-based-api/get_current_graph_templates)
(def ^:export get_template file-based-api/get_template)
(def ^:export insert_template file-based-api/insert_template)
(def ^:export exist_template file-based-api/exist_template)
(def ^:export create_template file-based-api/create_template)
(def ^:export remove_template file-based-api/remove_template)
(def ^:export get_pages_from_namespace file-based-api/get_pages_from_namespace)
(def ^:export get_pages_tree_from_namespace file-based-api/get_pages_tree_from_namespace)
(def ^:export set_blocks_id file-based-api/set_blocks_id)

(comment
  ;; Use the following code to generate export APIs from specific namespaces
  (doseq [k (sort (keys (ns-publics 'logseq.api.editor)))]
    (println (frontend.util/format "(def ^:export %s api-editor/%s)" (str k) (str k)))))
