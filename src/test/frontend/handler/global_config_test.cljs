(ns frontend.handler.global-config-test
  (:require ["fs" :as fs-node]
            ["fs/promises" :as fsp]
            ["path" :as node-path]
            [clojure.edn :as edn]
            [cljs.test :refer [is]]
            [frontend.fs :as fs]
            [frontend.handler.global-config :as global-config-handler]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [frontend.test.node-fixtures :as node-fixtures]
            [frontend.test.node-helper :as test-node-helper]
            [promesa.core :as p]))

(defn- create-fresh-global-root
  "Temp ~/.logseq-style root with no config/ directory."
  []
  (let [root-dir (node-path/resolve (test-node-helper/create-tmp-dir))]
    (reset! global-config-handler/root-dir root-dir)
    root-dir))

(defn- delete-global-root
  [root-dir]
  (reset! global-config-handler/root-dir nil)
  (when (and root-dir (fs-node/existsSync root-dir))
    (fs-node/rmSync root-dir #js {:recursive true :force true})))

(deftest-async set-global-config-kv-creates-missing-config-edn
  {:before (node-fixtures/setup-get-fs!)
   :after (node-fixtures/restore-get-fs!)}
  (let [root-dir (create-fresh-global-root)
        previous-state (state/get-state)
        config-dir (global-config-handler/global-config-dir)
        config-path (global-config-handler/global-config-path)]
    (p/with-redefs [fs/write-file! (fn [path content]
                                     (fsp/writeFile path content))]
      (-> (p/do!
           (is (false? (fs-node/existsSync config-dir))
               "fresh install has no global config dir")
           (global-config-handler/set-global-config-kv!
            :shortcuts {:publish/open-dialog []})
           (is (true? (fs-node/existsSync config-path))
               "write creates missing config/config.edn")
           (is (= {:publish/open-dialog []}
                  (:shortcuts (edn/read-string (str (fs-node/readFileSync config-path)))))))
          (p/finally
            (fn []
              (state/replace-state! previous-state)
              (delete-global-root root-dir)))))))

(deftest-async create-then-restore-global-config-on-fresh-install
  {:before (node-fixtures/setup-get-fs!)
   :after (node-fixtures/restore-get-fs!)}
  (let [root-dir (create-fresh-global-root)
        previous-state (state/get-state)
        config-path (global-config-handler/global-config-path)]
    (-> (p/do!
         (#'global-config-handler/create-global-config-file-if-not-exists nil)
         (global-config-handler/restore-global-config!)
         (is (true? (fs-node/existsSync config-path))
             "start create-before-restore writes the default file")
         (is (map? (state/get-global-config))
             "restore loads the newly created file"))
        (p/finally
          (fn []
            (state/replace-state! previous-state)
            (delete-global-root root-dir))))))
