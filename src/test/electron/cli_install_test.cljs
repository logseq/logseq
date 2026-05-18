(ns electron.cli-install-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [electron.cli-install :as cli-install]))

(defn- path-join
  [& parts]
  (string/join "/" parts))

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
       :t t
       :log-info! (fn [& _])
       :log-warn! (fn [& _])}
      opts))
    {:writes @writes
     :chmods @chmods
     :messages @messages
     :errors @errors}))

(deftest install-cli-launcher-shows-success-dialog
  (testing "successful Unix install writes to ~/.local/bin and reports the user-facing directory"
    (let [result (run-install! {:existing-files #{"/app/logseq-cli.js"}})]
      (is (= "/home/me/.local/bin/logseq" (ffirst (:writes result))))
      (is (= [["/home/me/.local/bin/logseq" "755"]] (:chmods result)))
      (is (= [] (:errors result)))
      (is (= [{:title "Logseq"
               :message "Logseq CLI was installed to ~/.local/bin"}]
             (:messages result))))))

(deftest install-cli-launcher-keeps-windows-path
  (testing "Windows keeps the existing Windows install path behavior and reports that directory"
    (let [windows-dir "C:/Users/me/AppData/Local/Microsoft/WindowsApps"
          result (run-install! {:windows? true
                                :cli-dir windows-dir
                                :existing-files #{"/app/logseq-cli.js"}})]
      (is (= (str windows-dir "/logseq.cmd") (ffirst (:writes result))))
      (is (= [] (:chmods result)))
      (is (= [] (:errors result)))
      (is (= [{:title "Logseq"
               :message (str "Logseq CLI was installed to " windows-dir)}]
             (:messages result))))))

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
