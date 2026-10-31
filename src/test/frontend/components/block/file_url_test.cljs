(ns frontend.components.block.file-url-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.block :as block]
            [frontend.handler.assets :as assets-handler]))

(deftest string-of-url-decodes-file-url-path-test
  (testing "percent-encoded spaces in a file:// URL become spaces in the native path"
    (let [url ["Complex" {:protocol "file" :link "/tmp/path%20spaces/qa%20image.png"}]
          path (#'block/string-of-url url)]
      (is (= "/tmp/path spaces/qa image.png" path))
      (is (= "assets:///tmp/path%20spaces/qa%20image.png"
             (assets-handler/file-path->assets-url path))
          "The assets:// URL must be encoded once, not %2520.")))
  (testing "a file:// URL with literal spaces resolves to the same path"
    (is (= "/tmp/path spaces/qa image.png"
           (#'block/string-of-url ["Complex" {:protocol "file" :link "/tmp/path spaces/qa image.png"}]))))
  (testing "a malformed percent sequence is kept as written"
    (is (= "/tmp/100%.png"
           (#'block/string-of-url ["Complex" {:protocol "file" :link "/tmp/100%.png"}])))))
