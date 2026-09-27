(ns frontend.handler.global-config-test
  (:require ["fs" :as fs-node]
            ["fs/promises" :as fsp]
            [clojure.edn :as edn]
            [cljs.test :refer [is]]
            [electron.ipc :as ipc]
            [frontend.fs :as fs]
            [frontend.handler.config :as config-handler]
            [frontend.handler.global-config :as global-config-handler]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [frontend.test.node-fixtures :as node-fixtures]
            [frontend.test.node-helper :as test-node-helper]
            [frontend.util :as util]
            [promesa.core :as p]))

(defn- create-global-root-without-config
  "Mirrors a fresh Logseq DB install: ~/.logseq exists, but config/config.edn does not."
  []
  (let [root-dir (test-node-helper/create-tmp-dir)]
    (reset! global-config-handler/root-dir root-dir)
    root-dir))

(defn- delete-global-root
  [root-dir]
  (reset! global-config-handler/root-dir nil)
  (when (and root-dir (fs-node/existsSync root-dir))
    (fs-node/rmSync root-dir #js {:recursive true :force true})))

(defn- read-global-config
  []
  (edn/read-string (str (fs-node/readFileSync (global-config-handler/global-config-path)))))

(deftest-async start-creates-missing-global-config-edn
  {:before (node-fixtures/setup-get-fs!)
   :after (node-fixtures/restore-get-fs!)}
  (let [root-dir (create-global-root-without-config)
        previous-state (state/get-state)
        config-path (global-config-handler/global-config-path)]
    (is (not (fs-node/existsSync config-path))
        "precondition: global config.edn is missing")
    (-> (p/with-redefs [ipc/ipc (fn [op & _args]
                                  (is (= "getLogseqDotDirRoot" op))
                                  (p/resolved root-dir))]
          (p/do!
           (global-config-handler/start {:repo "logseq_db_global_config"})
           (is (fs-node/existsSync (global-config-handler/global-config-dir))
               "start creates ~/.logseq/config when it is missing")
           (is (fs-node/existsSync config-path)
               "start creates ~/.logseq/config/config.edn when it is missing")
           (is (map? (read-global-config))
               "created config.edn is readable edn")
           (is (map? (state/get-global-config))
               "global config state is restored after create")))
        (p/finally
         (fn []
           (state/replace-state! previous-state)
           (delete-global-root root-dir))))))

(deftest-async set-global-config-kv-creates-missing-global-config-edn
  {:before (node-fixtures/setup-get-fs!)
   :after (node-fixtures/restore-get-fs!)}
  (let [root-dir (create-global-root-without-config)
        previous-state (state/get-state)
        config-path (global-config-handler/global-config-path)
        shortcuts {:ui/toggle-theme "t z"}]
    (is (not (fs-node/existsSync config-path))
        "precondition: global config.edn is missing")
    (-> (p/with-redefs [fs/write-file! fsp/writeFile]
          (p/do!
           (global-config-handler/set-global-config-kv! :shortcuts shortcuts)
           (is (fs-node/existsSync (global-config-handler/global-config-dir))
               "shortcut save creates ~/.logseq/config when it is missing")
           (is (fs-node/existsSync config-path)
               "shortcut save creates ~/.logseq/config/config.edn when it is missing")
           (is (= shortcuts (:shortcuts (read-global-config)))
               "created config.edn persists the shortcut change")
           (is (= shortcuts (:shortcuts (state/get-global-config)))
               "in-memory global config includes the shortcut change")))
        (p/finally
         (fn []
           (state/replace-state! previous-state)
           (delete-global-root root-dir))))))

(deftest-async persist-user-shortcuts-batch-creates-missing-global-config-edn
  {:before (node-fixtures/setup-get-fs!)
   :after (node-fixtures/restore-get-fs!)}
  (let [root-dir (create-global-root-without-config)
        previous-state (state/get-state)
        config-path (global-config-handler/global-config-path)]
    (is (not (fs-node/existsSync config-path))
        "precondition: global config.edn is missing")
    (-> (p/with-redefs [config-handler/set-config! (fn [_k _v] nil)
                        util/electron? (constantly true)
                        fs/write-file! fsp/writeFile]
          (p/do!
           (shortcut/persist-user-shortcuts-batch! [[:ui/toggle-theme "t z"]])
           (is (fs-node/existsSync config-path)
               "keyboard shortcut save creates missing global config.edn")
           (is (= {:ui/toggle-theme "t z"}
                  (:shortcuts (read-global-config))))))
        (p/finally
         (fn []
           (state/replace-state! previous-state)
           (delete-global-root root-dir))))))
