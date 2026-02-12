(ns frontend.state-test
  (:require [clojure.test :refer [deftest is]]
            [frontend.state :as state]))

(deftest merge-configs
  (let [global-config
        {:shortcuts {:ui/toggle-theme "t z"}
         :ui/enable-tooltip? true}
        local-config {:ui/enable-tooltip? false}]
    (is (= local-config
           (dissoc (state/merge-configs global-config local-config) :shortcuts))
        "Later config overrides all non-map values")
    (is (= {:start-of-week 6 :shortcuts {:ui/toggle-theme "t z"}}
           (select-keys (state/merge-configs {:start-of-week 6}
                                             global-config
                                             local-config)
                        [:start-of-week :shortcuts]))
        "Earlier configs set default values"))

  (is (= {:shortcuts {:ui/toggle-theme "t z"
                      :ui/toggle-brackets "t b"
                      :editor/up ["ctrl+p" "up"]}}
         (state/merge-configs {:shortcuts {:ui/toggle-theme "t z"}}
                              {:shortcuts {:ui/toggle-brackets "t b"}}
                              {:shortcuts {:editor/up ["ctrl+p" "up"]}}))
      "Map values get merged across configs"))

(deftest get-ref-open-blocks-level
  (with-redefs [state/get-config (constantly {:ref/default-open-blocks-level 3})]
    (is (= 3 (state/get-ref-open-blocks-level))
        "Uses current config key when present"))

  (with-redefs [state/get-config (constantly {:ref/linked-references-collapsed-threshold 0})]
    (is (= 0 (state/get-ref-open-blocks-level))
        "Supports legacy linked references collapse key"))

  (with-redefs [state/get-config (constantly {:ref/default-open-blocks-level 12})]
    (is (= 9 (state/get-ref-open-blocks-level))
        "Caps values at 9"))

  (with-redefs [state/get-config (constantly {:ref/linked-references-collapsed-threshold -1})]
    (is (= 2 (state/get-ref-open-blocks-level))
        "Falls back to default for invalid values")))
