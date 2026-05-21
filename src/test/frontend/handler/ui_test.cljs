(ns frontend.handler.ui-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.config :as config]
            [frontend.handler.ui :as ui-handler]
            [frontend.util :as util]))

(deftest open-new-window-or-tab-uses-graph-id-on-web-test
  (let [opened (atom [])
        original-open (.-open js/window)]
    (try
      (set! (.-open js/window)
            (fn [url target]
              (swap! opened conj [url target])))
      (with-redefs [util/electron? (constantly false)
                    config/app-website "http://localhost:3001"]
        (ui-handler/open-new-window-or-tab! {:repo "logseq_db_demo"
                                             :graph-id "graph uuid"}))
      (is (= [["http://localhost:3001#/?graph-id=graph%20uuid" "_blank"]]
             @opened))
      (finally
        (set! (.-open js/window) original-open)))))
