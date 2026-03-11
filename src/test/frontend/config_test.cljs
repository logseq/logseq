(ns frontend.config-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.config :as config]
            [frontend.state :as state]
            [logseq.common.config :as common-config]))

(deftest get-local-dir-uses-encoded-directory-name
  (with-redefs [state/state (atom {:system/info {:home-dir "/tmp/home"}})]
    (is (= "/tmp/home/logseq/graphs/foo~2Fbar"
           (config/get-local-dir (str common-config/db-version-prefix "foo/bar"))))))
