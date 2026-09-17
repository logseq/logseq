(ns logseq.api.plugin-test
  (:require [cljs.test :refer [async deftest is use-fixtures]]
            [clojure.string :as string]
            [frontend.fs :as fs]
            [frontend.handler.command-palette :as palette-handler]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.state :as state]
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

  (is (true? (api-plugin/register_plugin_simple_command
              "test-plugin"
              #js [#js {:key "open-panel"
                        :label "Open panel"
                        :type "command"}
                   #js ["callback"]]
              false)))
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
  (is (some? (get-in (state/get-state) [:search/engines "test-pluginDemo Search"])))
  (api-plugin/unregister_search_services "test-plugin")
  (is (nil? (get-in (state/get-state) [:search/engines "test-pluginDemo Search"]))))

(deftest storage-paths-stay-inside-plugin-root
  (let [root "/tmp/logseq/plugins"]
    (is (true? (#'api-plugin/sub-path? root (str root "/storages/demo/notes.txt"))))
    (is (false? (#'api-plugin/sub-path? root "/etc/passwd")))
    (is (false? (#'api-plugin/sub-path? root (str root "/../secrets.txt"))))
    (is (thrown-with-msg?
         js/Error
         #"write file denied"
         (#'api-plugin/assert-storage-path! root "/etc/passwd" "write")))
    (is (= (str root "/storages/demo/notes.txt")
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

(deftest plugin-storage-file-round-trip
  (async done
    (let [files (atom {"/tmp/plugins/storages/test-plugin/notes.json" "stored"})]
      (-> (p/with-redefs [plugin-handler/get-ls-dotdir-root (constantly "/tmp/plugins")
                          fs/file-exists? (fn
                                            ([path]
                                             (p/resolved
                                              (or (contains? @files path)
                                                  (string/starts-with? path "/tmp/plugins"))))
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
                                       (p/resolved true))]
            (p/let [written (api-plugin/write_plugin_storage_file "test-plugin" "notes.json" "hello" false)
                    exists? (api-plugin/exist_plugin_storage_file "test-plugin" "notes.json" false)
                    content (api-plugin/read_plugin_storage_file "test-plugin" "notes.json" false)
                    _ (api-plugin/unlink_plugin_storage_file "test-plugin" "notes.json" false)
                    exists-after? (api-plugin/exist_plugin_storage_file "test-plugin" "notes.json" false)]
              (is (string? written))
              (is (true? exists?))
              (is (= "hello" content))
              (is (false? exists-after?))))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally done)))))
