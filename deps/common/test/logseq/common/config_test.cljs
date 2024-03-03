(ns logseq.common.config-test
  (:require [logseq.common.config :as common-config]
            [cljs.test :refer [deftest is]]))

(deftest remove-hidden-files
  (let [files ["pages/foo.md" "pages/bar.md"
               "script/README.md" "script/config.edn"
               "dev/README.md" "dev/config.edn"]]
    (is (= ["pages/foo.md" "pages/bar.md"]
           (common-config/remove-hidden-files
            files
            {:hidden ["script" "/dev"]}
            identity))
        "Removes hidden relative files")

    (is (= ["/pages/foo.md" "/pages/bar.md"]
           (common-config/remove-hidden-files
            (map #(str "/" %) files)
            {:hidden ["script" "/dev"]}
            identity))
        "Removes hidden files if they start with '/'")))