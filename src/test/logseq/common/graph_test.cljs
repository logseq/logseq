(ns logseq.common.graph-test
  (:require [cljs.test :refer [deftest is]]
            [clojure.string :as string]
            [frontend.test.node-helper :as node-helper]
            [logseq.common.config :as common-config]
            [logseq.common.graph :as common-graph]
            ["fs" :as fs]
            ["os" :as os]
            ["path" :as node-path]))

(defn- with-graphs-dir-env
  [value f]
  (let [original (.-LOGSEQ_GRAPHS_DIR js/process.env)]
    (try
      (if (nil? value)
        (js-delete js/process.env "LOGSEQ_GRAPHS_DIR")
        (set! (.-LOGSEQ_GRAPHS_DIR js/process.env) value))
      (f)
      (finally
        (if (nil? original)
          (js-delete js/process.env "LOGSEQ_GRAPHS_DIR")
          (set! (.-LOGSEQ_GRAPHS_DIR js/process.env) original))))))

(deftest get-db-based-graphs-canonicalizes-legacy-prefixed-directory-names
  (let [graphs-dir (node-helper/create-tmp-dir "common-graph")
        _ (doseq [dir ["demo"
                       "logseq_db_demo"
                       "logseq_db_logseq_db_demo"
                       "logseq_local_file-graph"
                       "Unlinked graphs"]]
            (fs/mkdirSync (node-path/join graphs-dir dir) #js {:recursive true}))]
    (with-redefs [common-graph/get-db-graphs-dir (fn [] graphs-dir)]
      (let [graphs (common-graph/get-db-based-graphs)]
        (is (= #{"logseq_db_demo"} (set graphs)))
        (is (not-any? #(string/starts-with? % "logseq_db_logseq_db_") graphs))))))

(deftest get-db-based-graphs-decodes-encoded-graph-directories
  (let [graphs-dir (node-helper/create-tmp-dir "common-graph-encoded")
        _ (doseq [dir ["foo~2Fbar"
                       "a~3Ab"
                       "space name"
                       "space~20name"
                       "space%20name"
                       "Unlinked graphs"]]
            (fs/mkdirSync (node-path/join graphs-dir dir) #js {:recursive true}))]
    (with-redefs [common-graph/get-db-graphs-dir (fn [] graphs-dir)]
      (let [graphs (set (common-graph/get-db-based-graphs))]
        (is (= #{"logseq_db_foo/bar"
                 "logseq_db_a:b"
                 "logseq_db_space name"}
               graphs))))))

(deftest get-db-based-graphs-ignores-legacy-graph-dir-encodings
  (let [graphs-dir (node-helper/create-tmp-dir "common-graph-legacy")
        _ (doseq [dir ["foo++bar"
                       "a+3A+b"
                       "Unlinked graphs"]]
            (fs/mkdirSync (node-path/join graphs-dir dir) #js {:recursive true}))]
    (with-redefs [common-graph/get-db-graphs-dir (fn [] graphs-dir)]
      (is (= [] (common-graph/get-db-based-graphs))))))

(deftest get-db-based-graphs-ignores-padded-directory-names
  (let [graphs-dir (node-helper/create-tmp-dir "common-graph-whitespace")]
    (doseq [dir ["alpha" " alpha " " padded-only " "   " "~20encoded-leading" "encoded-trailing~20"]]
      (fs/mkdirSync (node-path/join graphs-dir dir) #js {:recursive true}))
    (with-redefs [common-graph/get-db-graphs-dir (fn [] graphs-dir)]
      (is (= ["logseq_db_alpha"] (vec (common-graph/get-db-based-graphs)))))))

(deftest get-db-graphs-dir-uses-default-when-env-unset
  (with-graphs-dir-env nil
    (fn []
      (is (= (node-path/join (.homedir os) "logseq" "graphs")
             (common-graph/get-db-graphs-dir)))
      (is (= common-config/default-graphs-dir
             (common-graph/get-default-graphs-dir))))))

(deftest get-db-graphs-dir-uses-logseq-graphs-dir-env
  (with-graphs-dir-env "/custom/graphs"
    (fn []
      (is (= "/custom/graphs" (common-graph/get-db-graphs-dir))))))

(deftest get-db-graphs-dir-expands-home-in-env
  (with-graphs-dir-env "~/Documents/Logseq"
    (fn []
      (is (= (node-path/join (.homedir os) "Documents" "Logseq")
             (common-graph/get-db-graphs-dir))))))
