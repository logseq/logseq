(ns frontend.components.header-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.components.header :as header]
            [frontend.components.repo :as repo]
            [frontend.handler.user :as user-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [logseq.shui.ui :as shui]))

(deftest current-local-uploadable-graph-selects-current-local-graph-test
  (with-redefs [state/get-current-repo (constantly "logseq_db_demo")
                state/get-repos (constantly [{:url "logseq_db_demo"
                                              :root "/tmp/demo"}
                                             {:url "logseq_db_remote"
                                              :root "/tmp/remote"
                                              :remote? true}])
                user-handler/logged-in? (constantly true)
                user-handler/rtc-group? (constantly true)]
    (is (= {:url "logseq_db_demo"
            :root "/tmp/demo"}
           (header/current-local-uploadable-graph)))))

(deftest current-local-uploadable-graph-skips-remote-graphs-test
  (with-redefs [state/get-current-repo (constantly "logseq_db_remote")
                state/get-repos (constantly [{:url "logseq_db_remote"
                                              :root "/tmp/remote"
                                              :remote? true}])
                user-handler/logged-in? (constantly true)
                user-handler/rtc-group? (constantly true)]
    (is (nil? (header/current-local-uploadable-graph)))))

(deftest current-local-uploadable-graph-selects-native-mobile-local-graph-test
  (with-redefs [mobile-util/native-platform? (constantly true)
                state/get-current-repo (constantly "logseq_db_mobile")
                state/get-repos (constantly [{:url "logseq_db_mobile"}])
                user-handler/logged-in? (constantly true)
                user-handler/rtc-group? (constantly true)]
    (is (= {:url "logseq_db_mobile"}
           (header/current-local-uploadable-graph)))))

(deftest local-graph-sync-button-uses-cloud-icon-and-upload-confirmation-test
  (let [upload-calls (atom [])]
    (with-redefs [ui/tooltip (fn [body title opts]
                               [:tooltip body title opts])
                  shui/button-ghost-icon (fn [icon opts]
                                           [:button icon opts])
                  repo/upload-local-graph-with-confirm! (fn [graph]
                                                          (swap! upload-calls conj graph))]
      (let [graph {:url "logseq_db_demo"
                   :root "/tmp/demo"}
            [_ [_ icon opts] title] (header/local-graph-sync-button graph)]
        (is (= :cloud icon))
        (is (some? title))
        ((:on-click opts) #js {})
        (is (= [graph] @upload-calls))))))
