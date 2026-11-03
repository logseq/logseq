(ns electron.cli-install-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [electron.cli-install :as cli-install]))

(defn- path-join
  [& parts]
  (apply str (interpose "/" parts)))

(defn- t
  [k & args]
  (case k
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
       :packaged? true
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
     :deferred @deferred}))

(deftest install-cli-launcher-does-not-show-success-dialog
  (testing "successful Unix install writes to ~/.local/bin without showing a success dialog"
    (let [result (run-install! {:existing-files #{"/app/logseq-cli.js"}})]
      (is (= "/home/me/.local/bin/logseq" (ffirst (:writes result))))
      (is (= [["/home/me/.local/bin/logseq" "755"]] (:chmods result)))
      (is (= [] (:errors result)))
      (is (= [] (:messages result)))
      (is (= [] (:deferred result))))))

(deftest install-cli-launcher-resolves-packaged-cli-at-runtime
  (doseq [{:keys [platform windows? exe-path appimage-path cli-path stable-exe]}
          [{:platform "Linux AppImage"
            :windows? false
            :exe-path "/tmp/.mount_LogseqA1B2C3/logseq"
            :appimage-path "/home/me/Logseq.AppImage"
            :cli-path "/tmp/.mount_LogseqA1B2C3/resources/app.asar/js/logseq-cli.js"
            :stable-exe "/home/me/Logseq.AppImage"}
           {:platform "macOS"
            :windows? false
            :exe-path "/Applications/Logseq.app/Contents/MacOS/Logseq"
            :cli-path "/Applications/Logseq.app/Contents/Resources/app.asar/js/logseq-cli.js"
            :stable-exe "/Applications/Logseq.app/Contents/MacOS/Logseq"}
           {:platform "Windows"
            :windows? true
            :exe-path "C:\\Program Files\\Logseq\\Logseq.exe"
            :cli-path "C:\\Program Files\\Logseq\\resources\\app.asar\\js\\logseq-cli.js"
            :stable-exe "C:\\Program Files\\Logseq\\Logseq.exe"}]]
    (testing platform
      (let [result (run-install! {:windows? windows?
                                  :cli-path cli-path
                                  :exe-path exe-path
                                  :appimage-path appimage-path
                                  :existing-files #{cli-path}})
            content (second (first (:writes result)))]
        (is (string/includes? content stable-exe))
        (is (string/includes? content "process.resourcesPath"))
        (is (string/includes? content "process.argv.splice(1,0,cli)"))
        (is (not (string/includes? content cli-path)))
        (when (= platform "Linux AppImage")
          (let [restart (run-install! {:cli-path "/tmp/.mount_LogseqD4E5F6/resources/app.asar/js/logseq-cli.js"
                                       :exe-path "/tmp/.mount_LogseqD4E5F6/logseq"
                                       :appimage-path appimage-path
                                       :existing-files #{"/tmp/.mount_LogseqD4E5F6/resources/app.asar/js/logseq-cli.js"
                                                         "/home/me/.local/bin/logseq"}
                                       :existing-contents {"/home/me/.local/bin/logseq" content}})]
            (is (= [] (:writes restart)))
            (is (= [] (:errors restart)))))))))

(deftest install-cli-launcher-keeps-windows-path
  (testing "Windows keeps the existing Windows install path behavior without showing a success dialog"
    (let [windows-dir "C:/Users/me/AppData/Local/Microsoft/WindowsApps"
          result (run-install! {:windows? true
                                :cli-dir windows-dir
                                :existing-files #{"/app/logseq-cli.js"}})]
      (is (= (str windows-dir "/logseq.cmd") (ffirst (:writes result))))
      (is (= [] (:chmods result)))
      (is (= [] (:errors result)))
      (is (= [] (:messages result)))
      (is (= [] (:deferred result))))))

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
