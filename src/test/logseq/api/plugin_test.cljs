(ns logseq.api.plugin-test
  (:require [cljs.test :refer [async deftest is use-fixtures]]
            [clojure.string :as string]
            [electron.ipc :as ipc]
            [frontend.common.idb :as idb]
            [frontend.config :as config]
            [frontend.fs :as fs]
            [frontend.handler.command-palette :as palette-handler]
            [frontend.handler.common.plugin :as plugin-common-handler]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.object :as gobj]
            [logseq.api.plugin :as api-plugin]
            [logseq.api.test-helper :as api-test]
            [promesa.core :as p]))

(use-fixtures :each {:before api-test/start-plugin-api-db!
                     :after api-test/destroy-plugin-api-db!})

(deftest caller-plugin-id-reads-window-global
  (let [previous (gobj/get js/window "$$callerPluginID")]
    (try
      (gobj/set js/window "$$callerPluginID" "demo-plugin")
      (is (= "demo-plugin" (api-plugin/get-caller-plugin-id)))
      (finally
        (if (nil? previous)
          (js-delete js/window "$$callerPluginID")
          (gobj/set js/window "$$callerPluginID" previous))))))

(deftest plugin-hooks-install-and-match
  (is (true? (api-plugin/install-plugin-hook "test-plugin" "hook:editor:inputSelectionEnd" #js {:once true})))
  (is (true? (api-plugin/should-exec-plugin-hook "test-plugin" "hook:editor:inputSelectionEnd")))
  (is (false? (api-plugin/should-exec-plugin-hook "missing" "hook:editor:inputSelectionEnd")))
  (api-plugin/uninstall-plugin-hook "test-plugin" "hook:editor:inputSelectionEnd")
  (is (false? (api-plugin/should-exec-plugin-hook "test-plugin" "hook:editor:inputSelectionEnd"))))

(deftest slash-and-simple-commands-register-in-state
  (api-test/install-test-plugin!)
  (is (true? (api-plugin/register_plugin_slash_command
              "test-plugin"
              #js ["Say Hi" #js [#js ["editor/clear-current-slash"]]])))
  (is (contains? (get-in (state/get-state) [:plugin/installed-slash-commands :test-plugin])
                 "Say Hi"))
  (api-plugin/unregister_plugin_slash_command "test-plugin" "Say Hi")
  (is (nil? (get-in (state/get-state) [:plugin/installed-slash-commands :test-plugin "Say Hi"])))

  (api-plugin/register_plugin_simple_command
   "test-plugin"
   #js [#js {:key "open-panel"
             :label "Open panel"
             :type "command"}
        #js ["callback"]]
   false)
  (is (seq (get-in (state/get-state) [:plugin/simple-commands :test-plugin])))
  (api-plugin/unregister_plugin_simple_command "test-plugin" "open-panel")
  (is (empty? (get-in (state/get-state) [:plugin/simple-commands :test-plugin]))))

(deftest simple-command-with-palette-registers-palette-entry
  (api-test/install-test-plugin!)
  (api-plugin/register_plugin_simple_command
   "test-plugin"
   #js [#js {:key "palette-cmd"
             :label "Palette command"
             :type "command"}
        #js ["callback"]]
   true)
  (is (contains? (palette-handler/get-commands-unique)
                 :plugin.test-plugin/palette-cmd))
  (api-plugin/unregister_plugin_simple_command "test-plugin" "palette-cmd")
  (is (not (contains? (palette-handler/get-commands-unique)
                      :plugin.test-plugin/palette-cmd))))

(deftest ui-item-and-search-service-registration
  (api-test/install-test-plugin!)
  (is (true? (api-plugin/register_plugin_ui_item
              "test-plugin"
              "toolbar"
              #js {:key "demo-button"
                   :template "<i></i>"})))
  (is (= "demo-button"
         (:key (second (first (get-in (state/get-state)
                                      [:plugin/installed-ui-items :test-plugin]))))))
  (api-plugin/register_search_service "test-plugin" "Demo Search" #js {:placeholder "Find"})
  (is (some? (get-in (state/get-state) [:search/engines ":test-pluginDemo Search"])))
  (api-plugin/unregister_search_services "test-plugin")
  (is (nil? (get-in (state/get-state) [:search/engines ":test-pluginDemo Search"]))))

(deftest storage-paths-stay-inside-plugin-root
  (let [root "/tmp/logseq/plugins"]
    (is (true? (#'api-plugin/sub-path? root (str root "/storages/demo/notes.txt"))))
    (is (false? (#'api-plugin/sub-path? root "/etc/passwd")))
    (is (false? (#'api-plugin/sub-path? root (str root "/../secrets.txt"))))
    (is (thrown-with-msg?
         js/Error
         #"write file denied"
         (#'api-plugin/assert-storage-path! root "/etc/passwd" "write")))
    (is (= (str root "/notes.txt")
           (#'api-plugin/storage-file-path root "notes.txt" "write")))))

(deftest binary-content-detection-and-storage-root
  (is (true? (#'api-plugin/binary-content? (js/ArrayBuffer. 8))))
  (is (true? (#'api-plugin/binary-content? (js/Uint8Array. 4))))
  (is (true? (#'api-plugin/binary-content? #js {:type "Buffer" :data #js [1 2 3]})))
  (is (false? (#'api-plugin/binary-content? "plain text")))
  (is (= "storages/demo-plugin"
         (#'api-plugin/plugin-storage-sub-root "demo-plugin")))
  (is (= "storages/nested"
         (#'api-plugin/plugin-storage-sub-root "/tmp/plugins/nested"))))

(deftest install-plugin-requires-repo-and-id
  (is (thrown-with-msg?
       js/Error
       #"\[required\] :repo :id"
       (api-plugin/__install_plugin #js {:name "broken"}))))

(deftest get-external-plugin-returns-nil-without-core
  (is (nil? (api-plugin/get_external_plugin "missing-plugin"))))

(deftest invoke-external-plugin-cmd-dispatches-registered-command
  (api-test/install-test-plugin!)
  (api-plugin/register_plugin_simple_command
   "test-plugin"
   #js [#js {:key "run-me"
             :label "Run me"
             :type "command"}
        #js ["callback"]]
   false)
  (let [events (atom [])]
    (with-redefs [state/pub-event! (fn [event] (swap! events conj event))]
      (api-plugin/invoke_external_plugin_cmd "test-plugin" "commands" "run-me" #js ["arg"])
      (is (= :exec-plugin-cmd (ffirst @events)))
      (is (= "run-me" (get-in (first @events) [1 :key]))))))

(deftest exist-plugin-storage-file-is-false-without-root
  (async done
    (-> (p/with-redefs [plugin-handler/get-ls-dotdir-root (constantly nil)]
          (p/let [exists? (api-plugin/exist_plugin_storage_file "test-plugin" "notes.json" false)]
            (is (false? exists?))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(defn- with-plugin-fs
  [files f]
  (p/with-redefs [plugin-handler/get-ls-dotdir-root (constantly "/tmp/plugins")
                  config/get-current-repo-assets-root (constantly "/tmp/graph/assets")
                  fs/file-exists? (fn
                                    ([path]
                                     (p/resolved
                                      (or (contains? @files path)
                                          (string/starts-with? path "/tmp/plugins")
                                          (string/starts-with? path "/tmp/graph"))))
                                    ([_dir path]
                                     (p/resolved (contains? @files path))))
                  fs/mkdir-recur! (fn [_] (p/resolved true))
                  fs/write-plain-text-file! (fn [_repo _dir path content _opts]
                                              (swap! files assoc path content)
                                              (p/resolved true))
                  fs/read-file (fn [_dir path]
                                 (p/resolved (get @files path)))
                  fs/unlink! (fn [_repo path _opts]
                               (swap! files dissoc path)
                               (p/resolved true))
                  fs/rmdir! (fn [path]
                              (swap! files (fn [current]
                                             (into {}
                                                   (remove (fn [[file-path]]
                                                             (string/starts-with? file-path path))
                                                           current))))
                              (p/resolved true))]
    (f)))

(deftest plugin-storage-file-round-trip
  (async done
    (let [files (atom {"/tmp/plugins/storages/test-plugin/notes.json" "stored"})]
      (-> (with-plugin-fs
            files
            (fn []
              (p/let [written (api-plugin/write_plugin_storage_file "test-plugin" "notes.json" "hello" false)
                      exists? (api-plugin/exist_plugin_storage_file "test-plugin" "notes.json" false)
                      content (api-plugin/read_plugin_storage_file "test-plugin" "notes.json" false)
                      _ (api-plugin/unlink_plugin_storage_file "test-plugin" "notes.json" false)
                      exists-after? (api-plugin/exist_plugin_storage_file "test-plugin" "notes.json" false)]
                (is (string? written))
                (is (true? exists?))
                (is (= "hello" content))
                (is (false? exists-after?)))))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally done)))))

(deftest plugin-package-and-dotdir-file-io
  (async done
    (let [files (atom {"/tmp/plugins/demo/package.json" "{\"name\":\"demo\"}"
                       "/tmp/plugins/demo/readme.md" "# Demo"})]
      (-> (with-plugin-fs
            files
            (fn []
              (p/with-redefs [util/electron? (constantly true)]
                (p/let [pkg (api-plugin/load_plugin_config "/tmp/plugins/demo")
                        readme (api-plugin/load_plugin_readme "/tmp/plugins/demo")
                        _ (api-plugin/save_plugin_package_json "/tmp/plugins/demo" #js {:name "demo" :version "2.0.0"})
                        saved (get @files "/tmp/plugins/demo/package.json")
                        tmp-path (api-plugin/write_user_tmp_file "scratch.txt" "tmp-content")
                        dotdir-path (api-plugin/write_dotdir_file "notes.txt" "dot" "docs")
                        assets-path (api-plugin/write_assetsdir_file "logo.txt" "asset" "brand")]
                  (is (= "{\"name\":\"demo\"}" pkg))
                  (is (= "# Demo" readme))
                  (is (re-find #"2.0.0" saved))
                  (is (= "/tmp/plugins/tmp/scratch.txt" tmp-path))
                  (is (= "/tmp/plugins/docs/notes.txt" dotdir-path))
                  (is (= "/tmp/graph/assets/brand/logo.txt" assets-path))
                  (is (= "tmp-content" (get @files tmp-path)))
                  (is (= "dot" (get @files dotdir-path)))
                  (is (= "asset" (get @files assets-path)))))))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally done)))))

(deftest write-assetsdir-file-is-false-without-root
  (with-redefs [config/get-current-repo-assets-root (constantly nil)]
    (is (false? (api-plugin/write_assetsdir_file "logo.txt" "asset" "brand")))))

(deftest list-and-clear-plugin-storage-files
  (async done
    (let [files (atom {"/tmp/plugins/storages/test-plugin/a.json" "a"
                       "/tmp/plugins/storages/test-plugin/b.json" "b"})]
      (-> (with-plugin-fs
            files
            (fn []
              (p/with-redefs [ipc/ipc (fn [op & args]
                                        (if (= :listdir op)
                                          (let [path (first args)]
                                            (p/resolved #js [(str path "/a.json")
                                                             (str path "/b.json")]))
                                          (p/resolved nil)))]
                (p/let [listed (api-plugin/list_plugin_storage_files "test-plugin" false)
                        _ (api-plugin/clear_plugin_storage_files "test-plugin" false)]
                  (is (= ["a.json" "b.json"] (js->clj listed)))
                  (is (empty? @files))))))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally done)))))

(deftest user-preferences-and-plugin-settings-use-idb
  (async done
    (let [store (atom {})]
      (-> (p/with-redefs [plugin-handler/get-ls-dotdir-root (constantly "/tmp/plugins")
                          idb/get-item (fn [key] (p/resolved (get @store key)))
                          idb/set-item! (fn [key value]
                                          (swap! store assoc key value)
                                          (p/resolved true))
                          idb/remove-item! (fn [key]
                                             (swap! store dissoc key)
                                             (p/resolved true))]
            (p/let [empty-prefs (api-plugin/load_user_preferences)
                    _ (api-plugin/save_user_preferences #js {:theme "dark"})
                    prefs (api-plugin/load_user_preferences)
                    settings-before (api-plugin/load_plugin_user_settings "test-plugin")
                    _ (api-plugin/save_plugin_user_settings "test-plugin" #js {:open true})
                    settings (api-plugin/load_plugin_user_settings "test-plugin")
                    _ (api-plugin/unlink_plugin_user_settings "test-plugin")
                    settings-after (api-plugin/load_plugin_user_settings "test-plugin")]
              (is (object? empty-prefs))
              (is (= "dark" (aget prefs "theme")))
              (is (= "/tmp/plugins/settings/test-plugin.json" (first settings-before)))
              (is (true? (aget (second settings) "open")))
              (is (empty? (js->clj (second settings-after))))))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally done)))))

(deftest installed-web-plugins-round-trip
  (async done
    (let [data (atom #js {})
          saved (atom 0)]
      (-> (p/with-redefs [plugin-handler/make-fn-to-load-dotdir-json
                          (fn [_dirname default]
                            (fn [_key]
                              (p/resolved ["/tmp/plugins/installed-plugins-for-web/all.json"
                                           (or @data default)])))
                          plugin-handler/make-fn-to-save-dotdir-json
                          (fn [_dirname]
                            (fn [_key value]
                              (swap! saved inc)
                              (reset! data value)
                              (p/resolved true)))]
            (p/let [plugin (js-obj "key" "web-plugin" "name" "Web")
                    _ (api-plugin/save_installed_web_plugin plugin)
                    _ (api-plugin/load_installed_web_plugins)
                    saved-plugin (aget @data "web-plugin")
                    _ (api-plugin/unlink_installed_web_plugin "web-plugin")]
              (is (pos? @saved))
              (is (= "Web" (some-> saved-plugin (aget "name"))))
              (is (nil? (aget @data "web-plugin")))))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally done)))))

(deftest validate-external-plugins-forwards-ipc
  (async done
    (let [calls (atom [])]
      (-> (p/with-redefs [ipc/ipc (fn [& args]
                                    (swap! calls conj args)
                                    (p/resolved #js {:ok true}))]
            (p/let [result (api-plugin/validate_external_plugins #js ["https://example.com/plugin.zip"])]
              (is (= :validateUserExternalPlugins (ffirst @calls)))
              (is (true? (aget result "ok")))))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally done)))))

(deftest get-external-plugin-serializes-plugin-instance
  (with-redefs [plugin-handler/get-plugin-inst
                (fn [pid]
                  (when (= "demo" pid)
                    #js {:toJSON (fn [] #js {:id "demo"})}))]
    (is (= "demo" (aget (api-plugin/get_external_plugin "demo") "id")))
    (is (nil? (api-plugin/get_external_plugin "missing")))))

(deftest invoke-external-plugin-model-calls-user-model
  (let [calls (atom [])]
    (with-redefs [plugin-handler/call-plugin-user-model!
                  (fn [pid key args]
                    (swap! calls conj [pid key args])
                    :ok)]
      (is (= :ok (api-plugin/invoke_external_plugin_cmd "demo" "models" "ping" #js [1])))
      (is (= "demo" (ffirst @calls)))
      (is (= "ping" (second (first @calls)))))))

(deftest install-plugin-dispatches-marketplace-install
  (let [installed (atom nil)]
    (with-redefs [plugin-common-handler/install-marketplace-plugin!
                  (fn [manifest]
                    (reset! installed manifest)
                    :queued)]
      (is (= :queued (api-plugin/__install_plugin #js {:repo "logseq/demo" :id "demo"})))
      (is (= {:repo "logseq/demo" :id "demo"} @installed)))))

(deftest unregister-all-slash-and-simple-commands
  (api-test/install-test-plugin!)
  (api-plugin/register_plugin_slash_command
   "test-plugin"
   #js ["One" #js [#js ["editor/clear-current-slash"]]])
  (api-plugin/register_plugin_slash_command
   "test-plugin"
   #js ["Two" #js [#js ["editor/clear-current-slash"]]])
  (api-plugin/unregister_plugin_slash_command "test-plugin")
  (is (empty? (get-in (state/get-state) [:plugin/installed-slash-commands :test-plugin])))
  (api-plugin/register_plugin_simple_command
   "test-plugin"
   #js [#js {:key "a" :label "A" :type "command"} #js ["callback"]]
   false)
  (api-plugin/register_plugin_simple_command
   "test-plugin"
   #js [#js {:key "b" :label "B" :type "command"} #js ["callback"]]
   false)
  (api-plugin/unregister_plugin_simple_command "test-plugin")
  (is (empty? (get-in (state/get-state) [:plugin/simple-commands :test-plugin]))))
