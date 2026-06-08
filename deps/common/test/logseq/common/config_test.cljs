(ns logseq.common.config-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.common.config :as common-config]))

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

(deftest local-relative-asset?
  (testing "local-relative-asset?"
    (is (common-config/local-relative-asset? "assets/test.png"))
    (is (common-config/local-relative-asset? "../assets/test.png"))
    (is (common-config/local-relative-asset? "./assets/test.png"))
    (is (not (common-config/local-relative-asset? "assets://")))
    (is (not (common-config/local-relative-asset? "assets://test.png")))
    (is (not (common-config/local-relative-asset? "http://assets/test.png")))
    (is (not (common-config/local-relative-asset? "file://assets/test.png")))
    (is (not (common-config/local-relative-asset? nil))))
  (testing "Windows backslash paths"
    (is (common-config/local-relative-asset? "assets\\test.png"))))
