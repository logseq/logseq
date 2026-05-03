(ns logseq.cli.commands.export-obsidian-test
  (:require ["child_process" :as child-process]
            [cljs.test :refer [deftest is]]
            [clojure.string :as string]
            [logseq.cli.commands.export-obsidian :as export-obsidian]))

(defn- sh
  [cmd]
  (child-process/spawnSync (first cmd)
                           (clj->js (rest cmd))
                           #js {:stdio "pipe"}))

(deftest export-obsidian-help
  (let [result (sh ["node" "cli.mjs" "export-obsidian" "--help"])
        stdout (str (.-stdout result))]
    (is (zero? (.-status result)))
    (is (string/includes? stdout "Usage: logseq export-obsidian [options]"))
    (is (string/includes? stdout "--input"))
    (is (string/includes? stdout "--output"))))

(deftest export-obsidian-sanitizes-file-stems
  (let [sanitize-file-stem #'export-obsidian/sanitize-file-stem]
    (is (= "Project-Notes" (sanitize-file-stem " Project/Notes. ")))
    (is (= "a-b-c" (sanitize-file-stem "a:b*c")))
    (is (= "untitled" (sanitize-file-stem "...\n")))))

(deftest export-obsidian-plans-duplicate-page-files
  (let [plan-page-files #'export-obsidian/plan-page-files
        result (plan-page-files [{:uuid "aaaaaaaa-0000-0000-0000-000000000000"
                                  :title "Same"
                                  :content "body"}
                                 {:uuid "bbbbbbbb-0000-0000-0000-000000000000"
                                  :title "Same"
                                  :content " "}
                                 {:uuid "cccccccc-0000-0000-0000-000000000000"
                                  :title "Bad/Title:*"
                                  :content "body"}])]
    (is (= 2 (count (:planned result))))
    (is (= 1 (:skipped result)))
    (is (= ["Bad-Title--.md" "Same.md"]
           (sort (map :file-name (:planned result)))))
    (is (= [:duplicate-title :skip-empty-duplicate]
           (sort (map :type (:warnings result)))))))

(deftest export-obsidian-rewrites-asset-links
  (let [rewrite-asset-links #'export-obsidian/rewrite-asset-links
        content "See [[Home]], ![[diagram.png]], and [[manual.pdf|the manual]]."]
    (is (= "See [[Home]], ![[assets/diagram-uuid.png]], and [[assets/manual-uuid.pdf|the manual]]."
           (rewrite-asset-links content
                                #{"Home"}
                                {"diagram.png" "assets/diagram-uuid.png"
                                 "manual.pdf" "assets/manual-uuid.pdf"})))))
