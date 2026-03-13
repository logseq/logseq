(ns frontend.security-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.security :as security]))

(deftest sanitize-html-uses-logseq-sanitization-policy
  (testing "sanitize-html delegates to DOMPurify with the repository's supported plugin policy"
    (let [called (atom nil)
          html "<p onclick=\"alert('x')\">safe</p><iframe src=\"logseq://plugin/frame\" is=\"plugin-frame\"></iframe><script>alert('x')</script>"
          fake-purify #js {:sanitize (fn [input opts]
                                       (reset! called {:input input
                                                       :opts (js->clj opts)})
                                       "<p>safe</p><iframe src=\"logseq://plugin/frame\" is=\"plugin-frame\"></iframe>")}]
      (with-redefs [security/get-dompurify (fn [] fake-purify)]
        (is (= "<p>safe</p><iframe src=\"logseq://plugin/frame\" is=\"plugin-frame\"></iframe>"
               (security/sanitize-html html)))
        (is (= html (:input @called)))
        (is (= ["iframe"] (get-in @called [:opts "ADD_TAGS"])))
        (is (= ["is"] (get-in @called [:opts "ADD_ATTR"])))
        (is (= true (get-in @called [:opts "ALLOW_UNKNOWN_PROTOCOLS"])))))))

(deftest resolve-dompurify-fails-fast-on-unsupported-shapes
  (testing "unsupported module shapes fail explicitly instead of falling through to a later sanitize call"
    (let [bad-module-error (try
                             (#'security/resolve-dompurify #js {})
                             nil
                             (catch js/Error error
                               error))
          bad-factory-error (try
                              (#'security/resolve-dompurify (fn [_] #js {}))
                              nil
                              (catch js/Error error
                                error))]
      (is (= "Unsupported DOMPurify module shape" (.-message bad-module-error)))
      (is (= "DOMPurify factory did not return a sanitizer instance"
             (.-message bad-factory-error))))))

(deftest get-dompurify-caches-the-resolved-instance
  (testing "the DOMPurify instance is resolved once and then reused"
    (let [calls (atom 0)
          cache (volatile! nil)
          fake-instance #js {:sanitize (fn [_ _] "<p>safe</p>")}]
      (with-redefs [security/resolve-dompurify (fn [_]
                                                 (swap! calls inc)
                                                 fake-instance)]
        (is (identical? fake-instance (#'security/get-dompurify #js {} cache)))
        (is (identical? fake-instance (#'security/get-dompurify #js {} cache)))
        (is (= 1 @calls))))))
