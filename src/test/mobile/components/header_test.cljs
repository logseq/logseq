(ns mobile.components.header-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.mobile.util :as mobile-util]
            [mobile.components.header :as mobile-header]))

(deftest native-top-bar-home-buttons-include-local-upload-action-test
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
    (is (= ["home-setting" "upload-local-graph"]
           (mapv :id (:rightButtons @configured))))
    (is (= "icloud.and.arrow.up"
           (-> @configured :rightButtons second :systemIcon)))))
