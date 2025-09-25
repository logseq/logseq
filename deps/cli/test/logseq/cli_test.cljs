(ns logseq.cli-test
  (:require ["child_process" :as child-process]
            [cljs.test :refer [is deftest]]
            [clojure.string :as string]))

(defn- sh
  "Run shell cmd synchronously and silently. Stdout/stderr can be inspected as needed"
  [cmd]
  (child-process/spawnSync (first cmd)
                           (clj->js (rest cmd))
                           #js {:stdio "pipe"}))

(deftest basic-help
  (let [start-time (cljs.core/system-time)
        result (sh ["node" "cli.mjs" "--help"])
        end-time (cljs.core/system-time)]

    (is (string/includes? (str (.-stdout result))
                          "Usage: logseq [command]"))

    (let [max-time (-> 0.25 (* (if js/process.env.CI 2 1)))]
      (is (< (-> end-time (- start-time) (/ 1000)) max-time)
          (str "Printing CLI help takes less than " max-time "s")))))