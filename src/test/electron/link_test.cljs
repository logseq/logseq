(ns electron.link-test
  (:require [cljs.test :refer [deftest is]]
            [electron.link :as link]))

(deftest logseq-links-open-through-electron-shell
  (is (true?
       (link/shell-open-url?
        (js/URL. "logseq://graph/demo?block-id=00000000-0000-0000-0000-000000000001"))))
  (is (true? (link/shell-open-url? (js/URL. "https://logseq.com"))))
  (is (false? (link/shell-open-url? (js/URL. "file:///tmp/graph.edn")))))
