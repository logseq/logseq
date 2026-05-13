(ns frontend.extensions.sci-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.extensions.sci :as sci]
            [frontend.handler.notification :as notification]
            [logseq.sdk.ui :as sdk-ui]))

(deftest eval-string-keeps-current-entrypoint-contract
  (testing "default helpers stay available"
    (is (= 6 (sci/eval-string "(sum [1 2 3])")))
    (is (= 2 (sci/eval-string "(average [1 2 3])")))
    (is (= 3 (sci/eval-string "(+ block 1)"
                              {:namespaces {'user {'block 2}}})))
    (is (= 3 (sci/eval-string "(+ block 1)"
                              {:bindings {'block 2}})))
    (is (= 11 (sci/eval-string "(+ block 1)"
                               {:namespaces {'user {'block 10}}
                                :bindings {'block 2}})))
    (is (= 6 (sci/eval-string "(sum [1 2 3])"
                              {:namespaces {'user {'block 2}}}))))
  (testing "function values can still be evaluated and invoked later"
    (let [f (sci/eval-string "(fn [result] (count result))")]
      (is (fn? f))
      (is (= 3 (sci/call-fn f [1 2 3]))))))

(deftest show-msg-still-parses-hiccup-strings
  (let [captured (atom nil)]
    (with-redefs [notification/show!
                  (fn [content status clear? uid timeout _]
                    (reset! captured {:content content
                                      :status status
                                      :clear? clear?
                                      :uid uid
                                      :timeout timeout})
                    :test-key)]
      (is (= "test-key"
             (sdk-ui/-show_msg "[:div {:class \"from-sci\"} \"Hello\"]" :success nil)))
      (is (= [:div {:class "from-sci"} "Hello"]
             (:content @captured)))
      (is (= :success (:status @captured)))
      (is (true? (:clear? @captured))))))
