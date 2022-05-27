(ns parse-file
  (:require [logseq.graph-parser.cli :as gp-cli]
            [clojure.pprint :as pprint]
            [datascript.core :as d]))

(defn- colorize-or-pretty-print
  [results]
  (if (zero? (.-status (gp-cli/sh ["which" "puget"] {})))
    (gp-cli/sh ["puget"] {:input (pr-str results)
                          :stdio ["pipe" "inherit" "inherit"]})
    (pprint/pprint results)))

(defn- get-all-page-properties
  [db]
  (->> (d/q '[:find (pull ?b [*])
              :where
              [?b :block/properties]]
            db)
       (map first)
       (map (fn [m] (zipmap (keys (:block/properties m)) (repeat 1))))
       (apply merge-with +)
       (into {})))

(defn- analyze-file
  [db file]
  (let [results (map first
                     (d/q '[:find (pull ?b [:db/id :block/content])
                            :in $ ?path
                            :where
                            [?b :block/page ?page]
                            [?page :block/file ?file]
                            [?file :file/path ?path]]
                          db
                          file))]
    (colorize-or-pretty-print results)
    (println "Block count:" (count results))
    (println "Properties count:" (get-all-page-properties db))))

(defn -main
  "Prints blocks for given file along with basic file stats"
  [& args]
  (when-not (= 2 (count args))
    (throw (ex-info "Usage: $0 DIR FILE" {})))
  (println "Parsing...")
  (let [[dir file] args
        {:keys [conn]} (gp-cli/parse-graph dir
                                           {:verbose false
                                            :files [{:file/path file
                                                     :file/content (gp-cli/slurp file)}]})]
    (analyze-file @conn file)))

(apply -main *command-line-args*)
