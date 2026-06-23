(ns electron.cli-install-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [electron.cli-install :as cli-install]
            [logseq.common.path :as path]))

(defn- path-join
  [& parts]
  (apply path/path-join parts))

(defn- t
  [k & args]
  (case k
    :electron/cli-installed (str "Logseq CLI was installed to " (first args))
    :electron/cli-install-failed (str "Failed to install Logseq CLI.\n" (first args))))

(deftest preferred-unix-cli-dir-prefers-local-bin
  (testing "macOS/Linux CLI launcher directory is ~/.local/bin, not the first writable PATH directory"
    (let [created (atom [])]
      (is (= "/home/me/.local/bin"
             (cli-install/preferred-unix-cli-dir
              {:home-dir "/home/me"
               :path-join path-join
               :ensure-dir! #(swap! created conj %)
               :writable-dir? (fn [dir]
                                (#{"first-writable-path-dir" "/home/me/.local/bin"} dir))})))
      (is (= ["/home/me/.local/bin"] @created)))))

(defn- run-install!
  [opts]
  (let [writes (atom [])
        chmods (atom [])
        messages (atom [])
        errors (atom [])
        deferred (atom [])
        files (atom (set (:existing-files opts)))
        contents (atom (:existing-contents opts))]
    (cli-install/install-cli-launcher!
     (merge
      {:windows? false
       :cli-path "/app/logseq-cli.js"
       :cli-dir "/home/me/.local/bin"
       :exe-path "/Applications/Logseq.app/Contents/MacOS/Logseq"
       :path-join path-join
       :exists? #(contains? @files %)
       :read-file! #(get @contents %)
       :write-file! (fn [path content]
                      (swap! writes conj [path content])
                      (swap! files conj path))
       :chmod! #(swap! chmods conj [%1 %2])
       :show-message-box! #(swap! messages conj %)
       :show-error-box! (fn [title content]
                          (swap! errors conj {:title title :content content}))
       :defer! #(swap! deferred conj %)
       :t t
       :log-info! (fn [& _])
       :log-warn! (fn [& _])}
      opts))
    {:writes @writes
     :chmods @chmods
     :messages @messages
     :errors @errors
     :deferred @deferred
     :messages-atom messages}))

(defn- run-deferred!
  [result]
  (doseq [f (:deferred result)]
    (f))
  (assoc result :messages @(:messages-atom result)))

(deftest install-cli-launcher-shows-success-dialog
  (testing "successful Unix install writes to ~/.local/bin and reports the user-facing directory"
    (let [result (run-install! {:existing-files #{"/app/logseq-cli.js"}})]
      (is (= "/home/me/.local/bin/logseq" (ffirst (:writes result))))
      (is (= [["/home/me/.local/bin/logseq" "755"]] (:chmods result)))
      (is (= [] (:errors result)))
      (is (= [] (:messages result)))
      (is (= 1 (count (:deferred result))))
      (let [result (run-deferred! result)]
      (is (= [{:title "Logseq"
               :message "Logseq CLI was installed to ~/.local/bin"}]
             (:messages result)))))))

(deftest install-cli-launcher-uses-stable-appimage-path
  (testing "Linux AppImage launchers use APPIMAGE instead of the temporary mounted executable path"
    (let [result (run-install! {:existing-files #{"/app/logseq-cli.js"}
                                :exe-path "/tmp/.mount_LogseqA1B2C3/logseq"
                                :appimage-path "/home/me/Logseq.AppImage"})
          content (second (first (:writes result)))]
      (is (string/includes? content "\"/home/me/Logseq.AppImage\""))
      (is (not (string/includes? content "/tmp/.mount_LogseqA1B2C3/logseq"))))))

(deftest install-cli-launcher-skips-dialog-when-appimage-mount-path-changes
  (testing "Linux AppImage restarts do not rewrite the launcher when only the temporary mount path changes"
    (let [stable-content (str "#!/usr/bin/env sh\n"
                              "# " cli-install/CLI_LAUNCHER_MARKER "\n"
                              "set -eu\n"
                              "ELECTRON_RUN_AS_NODE=1 exec \"/home/me/Logseq.AppImage\" \"/app/logseq-cli.js\" \"$@\"\n")
          result (run-install! {:existing-files #{"/app/logseq-cli.js" "/home/me/.local/bin/logseq"}
                                :existing-contents {"/home/me/.local/bin/logseq" stable-content}
                                :exe-path "/tmp/.mount_LogseqD4E5F6/logseq"
                                :appimage-path "/home/me/Logseq.AppImage"})]
      (is (= [] (:writes result)))
      (is (= [] (:chmods result)))
      (is (= [] (:messages result)))
      (is (= [] (:errors result))))))

(deftest install-cli-launcher-keeps-windows-path
  (testing "Windows keeps the existing Windows install path behavior and reports that directory"
    (let [windows-dir "C:/Users/me/AppData/Local/Microsoft/WindowsApps"
          result (run-install! {:windows? true
                                :cli-dir windows-dir
                                :existing-files #{"/app/logseq-cli.js"}})]
      (is (= (str windows-dir "/logseq.cmd") (ffirst (:writes result))))
      (is (= [] (:chmods result)))
      (is (= [] (:errors result)))
      (is (= [] (:messages result)))
      (is (= 1 (count (:deferred result))))
      (let [result (run-deferred! result)]
      (is (= [{:title "Logseq"
               :message (str "Logseq CLI was installed to " windows-dir)}]
             (:messages result)))))))

(deftest install-cli-launcher-shows-error-dialog-on-failure
  (testing "installer failures are visible through an Electron error dialog"
    (let [result (run-install! {:existing-files #{"/app/logseq-cli.js"}
                                :write-file! (fn [& _]
                                               (throw (js/Error. "disk full")))})]
      (is (= [] (:messages result)))
      (is (= "Logseq" (:title (first (:errors result)))))
      (is (string/includes? (:content (first (:errors result)))
                            "Failed to install Logseq CLI"))
      (is (string/includes? (:content (first (:errors result)))
                            "disk full")))))

(deftest install-cli-launcher-shows-error-dialog-when-directory-selection-fails
  (testing "directory selection failures are visible through an Electron error dialog"
    (let [result (run-install! {:existing-files #{"/app/logseq-cli.js"}
                                :cli-dir nil
                                :cli-dir! (fn []
                                            (throw (js/Error. "permission denied")))})]
      (is (= [] (:messages result)))
      (is (= "Logseq" (:title (first (:errors result)))))
      (is (string/includes? (:content (first (:errors result)))
                            "permission denied")))))
