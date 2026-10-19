(ns logseq.cli.common-test
  (:require ["fs-extra" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [async deftest is]]
            [frontend.test.node-helper :as node-helper]
            [logseq.cli.common :as cli-common]
            [logseq.common.graph-dir :as graph-dir]
            [promesa.core :as p]))

(deftest unlink-preserves-data-and-uses-canonical-graph-identity
  (async done
         (let [root (node-helper/create-tmp-dir "unlink-graph")
               graphs (node-path/join root "graphs")]
           (-> (p/run! (fn [name]
                         (let [encoded (graph-dir/encode-graph-dir-name name)
                               source (node-path/join graphs encoded)
                               destination (node-path/join graphs "Unlinked graphs" encoded)]
                           (fs/mkdirSync source #js {:recursive true})
                           (fs/writeFileSync (node-path/join source "db.sqlite") "saved data")
                           (p/let [moved (cli-common/<unlink-graph! graphs (str "logseq_db_" name))]
                             (is (= (node-path/resolve destination) moved))
                             (is (not (fs/existsSync source)))
                             (is (= "saved data" (fs/readFileSync (node-path/join moved "db.sqlite") "utf8"))))))
                       ["foo/bar" "space name" "副本"])
               (p/catch #(is false (str %)))
               (p/finally (fn [] (fs/removeSync root) (done)))))))

(deftest unlink-custom-storage-preserves-standard-sibling
  (async done
         (let [root (node-helper/create-tmp-dir "unlink-custom")
               standard (node-path/join root "graphs" "demo")
               custom (node-path/join root "custom-graphs" "demo")]
           (doseq [[directory marker] [[standard "standard"] [custom "custom"]]]
             (fs/mkdirSync directory #js {:recursive true})
             (fs/writeFileSync (node-path/join directory "marker") marker))
           (-> (cli-common/<unlink-graph! (node-path/dirname custom) "logseq_db_demo")
               (p/then (fn [moved]
                         (is (= (node-path/resolve root "custom-graphs" "Unlinked graphs" "demo") moved))
                         (is (= "custom" (fs/readFileSync (node-path/join moved "marker") "utf8")))
                         (is (not (fs/existsSync custom)))
                         (is (fs/existsSync standard))))
               (p/catch #(is false (str %)))
               (p/finally (fn [] (fs/removeSync root) (done)))))))
