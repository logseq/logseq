(ns mobile.components.header-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.components.repo :as repo]
            [frontend.handler.user :as user-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [mobile.components.header :as mobile-header]))

(deftest native-top-bar-home-buttons-include-sync-action-for-local-graph-test
  (let [configured (atom nil)
        native-top-bar #js {:configure (fn [payload]
                                         (reset! configured (js->clj payload :keywordize-keys true)))}]
    (with-redefs [mobile-util/native-platform? (constantly true)
                  mobile-util/native-ipad? (constantly false)
                  mobile-util/native-android? (constantly false)
                  mobile-util/native-top-bar native-top-bar]
      (#'mobile-header/configure-native-top-bar!
       {:tab "home"
        :title "Test3"
        :show-local-upload? true}))
    (is (= ["home-setting" "sync"]
           (mapv :id (:rightButtons @configured))))
    (is (= "circle.fill"
           (-> @configured :rightButtons second :systemIcon)))))

(deftest native-top-bar-sync-tap-uploads-local-graph-test
  (let [listener (atom nil)
        graph {:url "logseq_db_mobile"}
        upload-calls (atom [])
        native-top-bar #js {:addListener (fn [event f]
                                           (is (= "buttonTapped" event))
                                           (reset! listener f))}]
    (reset! @#'mobile-header/native-top-bar-listener? false)
    (reset! @#'mobile-header/native-top-bar-listener-version nil)
    (with-redefs [mobile-util/native-platform? (constantly true)
                  mobile-util/native-top-bar native-top-bar
                  state/get-current-repo (constantly "logseq_db_mobile")
                  state/get-repos (constantly [graph])
                  user-handler/logged-in? (constantly true)
                  user-handler/rtc-group? (constantly true)
                  repo/upload-local-graph-with-confirm! (fn [graph]
                                                          (swap! upload-calls conj graph))]
      (#'mobile-header/register-native-top-bar-events! (atom nil))
      (@listener #js {:id "sync"}))
    (is (= [graph] @upload-calls))))

(deftest native-top-bar-registers-current-listener-after-hot-reload-test
  (let [listener (atom nil)
        native-top-bar #js {:addListener (fn [_event f]
                                           (reset! listener f))}]
    (reset! @#'mobile-header/native-top-bar-listener? true)
    (reset! @#'mobile-header/native-top-bar-listener-version nil)
    (with-redefs [mobile-util/native-platform? (constantly true)
                  mobile-util/native-top-bar native-top-bar]
      (#'mobile-header/register-native-top-bar-events! (atom nil)))
    (is (some? @listener))))
