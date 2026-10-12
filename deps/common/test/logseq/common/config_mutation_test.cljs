(ns logseq.common.config-mutation-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.common.config :as common-config]))

;; Fails if, in `protocol-path?`, `some?` becomes `nil?`.
(deftest protocol-path?-test
  (is (true? (common-config/protocol-path? "https://logseq.com/a.png")))
  (is (true? (common-config/protocol-path? "assets://a.png")))
  (is (false? (common-config/protocol-path? "../assets/a.png"))))

;; Fails if, in `remove-asset-protocol`, `if` becomes `if-not`.
(deftest remove-asset-protocol-test
  (is (= "file:///home/me/graph/assets/a.png"
         (common-config/remove-asset-protocol "assets:///home/me/graph/assets/a.png")))
  (is (= "../assets/a.png" (common-config/remove-asset-protocol "../assets/a.png"))))
