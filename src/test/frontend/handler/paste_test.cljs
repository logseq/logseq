(ns frontend.handler.paste-test
  (:require [cljs.test :refer [deftest are]]
            [goog.object :as gobj]
            [frontend.handler.paste :as paste-handler]))

(deftest try-parse-as-json-result-parse-test
  (are [x y] (let [result (#'paste-handler/try-parse-as-json x)
                   obj-result (if (object? result) result #js{})]
               (gobj/get obj-result "foo") ;; This op shouldn't throw
               (gobj/getValueByKeys obj-result "foo" "bar") ;; This op shouldn't throw
               (gobj/equals result y))
    "{\"number\": 1234}" #js{:number 1234}
    "1234" 1234
    "null" nil
    "true" true
    "[1234, 5678]" #js[1234 5678]
    ;; invalid JSON
    "{number: 1234}" #js{}))

(deftest try-parse-as-json-result-get-test
  (are [x y z] (let [result (#'paste-handler/try-parse-as-json x)
                     obj-result (if (object? result) result #js{})]
                 (and (gobj/equals (gobj/get obj-result "foo") y)
                      (gobj/equals (gobj/getValueByKeys obj-result "foo" "bar") z)))
    "{\"foo\": {\"bar\": 1234}}" #js{:bar 1234} 1234
    "{\"number\": 1234}" nil nil
    "1234" nil nil
    "null" nil nil
    "true" nil nil
    "[{\"number\": 1234}]" nil nil
    ;; invalid JSON
    "{number: 1234}" nil nil))