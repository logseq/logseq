(ns logseq.cli.command.skill-test
  (:require ["fs" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [logseq.cli.command.skill :as skill-command]
            [logseq.common.path :as path]))

(deftest test-skill-command-entries
  (let [entries skill-command/entries
        by-cmds (group-by :cmds entries)]
    (testing "registers skill show and skill install entries"
      (is (= 2 (count entries)))
      (is (= :skill-show (:command (first (get by-cmds ["skill" "show"])))))
      (is (= :skill-install (:command (first (get by-cmds ["skill" "install"])))))
      (is (contains? (get-in (first (get by-cmds ["skill" "install"])) [:spec]) :global)))))

(deftest test-resolve-install-target
  (testing "resolves local install path under cwd"
    (let [result (skill-command/resolve-install-target {:global? false
                                                        :cwd "/tmp/work"
                                                        :home-dir "/Users/demo"})]
      (is (true? (:ok? result)))
      (is (= "/tmp/work/.agents/skills/logseq-cli" (:dir result)))
      (is (= "/tmp/work/.agents/skills/logseq-cli/SKILL.md" (:file result)))))

  (testing "resolves global install path under home dir"
    (let [result (skill-command/resolve-install-target {:global? true
                                                        :cwd "/tmp/work"
                                                        :home-dir "/Users/demo"})]
      (is (true? (:ok? result)))
      (is (= "/Users/demo/.agents/skills/logseq-cli" (:dir result)))
      (is (= "/Users/demo/.agents/skills/logseq-cli/SKILL.md" (:file result)))))

  (testing "returns typed error when home dir is missing for global install"
    (let [result (skill-command/resolve-install-target {:global? true
                                                        :cwd "/tmp/work"
                                                        :home-dir ""})]
      (is (false? (:ok? result)))
      (is (= :skill-home-dir-unavailable (get-in result [:error :code]))))))

(deftest test-resolve-skill-source-path
  (let [exists-sync (.-existsSync fs)]
    (testing "picks first existing candidate path"
      (set! (.-existsSync fs)
            (fn [path]
              (= path "/opt/logseq/skills/logseq-cli/SKILL.md")))
      (try
        (let [result (skill-command/resolve-skill-source-path
                      ["/opt/logseq/skills/logseq-cli/SKILL.md"
                       "/fallback/skills/logseq-cli/SKILL.md"])]
          (is (true? (:ok? result)))
          (is (= "/opt/logseq/skills/logseq-cli/SKILL.md" (:path result))))
        (finally
          (set! (.-existsSync fs) exists-sync))))

    (testing "returns typed error when no candidates exist"
      (set! (.-existsSync fs) (fn [_] false))
      (try
        (let [result (skill-command/resolve-skill-source-path
                      ["/missing/a.md" "/missing/b.md"])]
          (is (false? (:ok? result)))
          (is (= :skill-source-not-found (get-in result [:error :code])))
          (is (string/includes? (get-in result [:error :message]) "/missing/a.md"))
          (is (string/includes? (get-in result [:error :message]) "/missing/b.md")))
        (finally
          (set! (.-existsSync fs) exists-sync))))))

(deftest test-execute-skill-show
  (let [read-file-sync (.-readFileSync fs)]
    (set! (.-readFileSync fs)
          (fn [path encoding]
            (is (= "/tmp/skill/SKILL.md" path))
            (is (= "utf8" encoding))
            "# skill\ncontent"))
    (try
      (let [result (skill-command/execute-skill-show {:type :skill-show
                                                      :source-path "/tmp/skill/SKILL.md"}
                                                     {})]
        (is (= :ok (:status result)))
        (is (= :human (:output-format result)))
        (is (= "# skill\ncontent" (get-in result [:data :message]))))
      (finally
        (set! (.-readFileSync fs) read-file-sync)))))

(deftest test-execute-skill-install
  (let [mkdir-sync (.-mkdirSync fs)
        write-file-sync (.-writeFileSync fs)
        read-file-sync (.-readFileSync fs)
        captured (atom [])]
    (set! (.-mkdirSync fs)
          (fn [path opts]
            (swap! captured conj [:mkdir path (js->clj opts :keywordize-keys true)])))
    (set! (.-readFileSync fs)
          (fn [path encoding]
            (swap! captured conj [:read path encoding])
            "# skill\nfrom source"))
    (set! (.-writeFileSync fs)
          (fn [path payload encoding]
            (swap! captured conj [:write path payload encoding])))
    (try
      (let [result (skill-command/execute-skill-install {:type :skill-install
                                                         :source-path "/opt/logseq/skills/logseq-cli/SKILL.md"
                                                         :destination-dir "/tmp/work/.agents/skills/logseq-cli"
                                                         :destination-file "/tmp/work/.agents/skills/logseq-cli/SKILL.md"
                                                         :global? false}
                                                        {})]
        (is (= :ok (:status result)))
        (is (= "/tmp/work/.agents/skills/logseq-cli/SKILL.md" (get-in result [:data :installed-path])))
        (is (= "/opt/logseq/skills/logseq-cli/SKILL.md" (get-in result [:data :source-path])))
        (is (= [[:mkdir "/tmp/work/.agents/skills/logseq-cli" {:recursive true}]
                [:read "/opt/logseq/skills/logseq-cli/SKILL.md" "utf8"]
                [:write "/tmp/work/.agents/skills/logseq-cli/SKILL.md" "# skill\nfrom source" "utf8"]]
               @captured)))
      (finally
        (set! (.-mkdirSync fs) mkdir-sync)
        (set! (.-readFileSync fs) read-file-sync)
        (set! (.-writeFileSync fs) write-file-sync)))))

(deftest test-execute-skill-install-preserves-other-skills
  (let [tmp-root (.mkdtempSync fs (node-path/join (.tmpdir os) "logseq-skill-test-"))
        source-path (node-path/join tmp-root "source-skill.md")
        destination-dir (node-path/join tmp-root ".agents" "skills" "logseq-cli")
        destination-file (node-path/join destination-dir "SKILL.md")
        existing-file (node-path/join tmp-root ".agents" "skills" "existing-skill" "SKILL.md")]
    (try
      (fs/mkdirSync (node-path/join tmp-root ".agents" "skills" "existing-skill") #js {:recursive true})
      (fs/writeFileSync source-path "# installed\ncontent" "utf8")
      (fs/writeFileSync existing-file "keep me" "utf8")
      (let [result (skill-command/execute-skill-install {:type :skill-install
                                                         :source-path source-path
                                                         :destination-dir destination-dir
                                                         :destination-file destination-file
                                                         :global? false}
                                                        {})]
        (is (= :ok (:status result)))
        (is (= "# installed\ncontent" (fs/readFileSync destination-file "utf8")))
        (is (= "keep me" (fs/readFileSync existing-file "utf8"))))
      (finally
        (fs/rmSync tmp-root #js {:recursive true :force true})))))

(deftest test-execute-skill-install-global-prefers-home-env
  (let [tmp-root (.mkdtempSync fs (node-path/join (.tmpdir os) "logseq-skill-home-"))
        source-path (node-path/join tmp-root "source-skill.md")
        installed-file (path/path-join tmp-root ".agents" "skills" "logseq-cli" "SKILL.md")
        previous-home (.. js/process -env -HOME)]
    (try
      (fs/writeFileSync source-path "# installed\ncontent" "utf8")
      (set! (.. js/process -env -HOME) tmp-root)
      (let [result (skill-command/execute-skill-install {:type :skill-install
                                                         :source-path source-path
                                                         :global? true}
                                                        {})]
        (is (= :ok (:status result)))
        (is (= installed-file (get-in result [:data :installed-path])))
        (is (= "# installed\ncontent" (fs/readFileSync installed-file "utf8"))))
      (finally
        (if (some? previous-home)
          (set! (.. js/process -env -HOME) previous-home)
          (js-delete (.-env js/process) "HOME"))
        (fs/rmSync tmp-root #js {:recursive true :force true})))))

(deftest test-execute-skill-install-write-error
  (let [mkdir-sync (.-mkdirSync fs)
        write-file-sync (.-writeFileSync fs)
        read-file-sync (.-readFileSync fs)]
    (set! (.-mkdirSync fs) (fn [_ _] nil))
    (set! (.-readFileSync fs) (fn [_ _] "# skill"))
    (set! (.-writeFileSync fs)
          (fn [_ _ _]
            (throw (ex-info "write failed" {:code "EACCES"}))))
    (try
      (let [result (skill-command/execute-skill-install {:type :skill-install
                                                         :source-path "/opt/logseq/skills/logseq-cli/SKILL.md"
                                                         :destination-dir "/tmp/work/.agents/skills/logseq-cli"
                                                         :destination-file "/tmp/work/.agents/skills/logseq-cli/SKILL.md"
                                                         :global? false}
                                                        {})]
        (is (= :error (:status result)))
        (is (= :skill-install-failed (get-in result [:error :code]))))
      (finally
        (set! (.-mkdirSync fs) mkdir-sync)
        (set! (.-readFileSync fs) read-file-sync)
        (set! (.-writeFileSync fs) write-file-sync)))))
