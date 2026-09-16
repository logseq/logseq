(ns frontend.commands-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.commands :as commands]))

(deftest command-search-aliases-cover-deprecated-embed-commands
  (is (= ["embed" "block embed" "page embed"]
         (#'commands/command-search-aliases ["Node embed"])))
  (is (nil? (#'commands/command-search-aliases ["Embed HTML"]))))

(deftest get-matched-commands-redirects-embed-aliases-to-node-embed
  (testing "Deprecated /embed, /block embed, and /page embed resolve to Node embed"
    (let [node-embed (with-meta
                       ["Node embed" [[:editor/search-block :embed]] "Embed a node here" :icon/blockEmbed]
                       {:aliases ["embed" "block embed" "page embed"]})
          embed-html ["Embed HTML" [] "" :icon/htmlEmbed]
          commands [embed-html node-embed]]
      (doseq [query ["embed" "block embed" "page embed"]]
        (is (= "Node embed"
               (ffirst (commands/get-matched-commands query commands)))
            (str "Query " (pr-str query) " should rank Node embed first"))))))
