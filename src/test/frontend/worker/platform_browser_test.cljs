(ns frontend.worker.platform-browser-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.worker.platform :as platform]
            [frontend.worker.platform.browser :as platform-browser]
            [goog.object :as gobj]
            [logseq.db :as ldb]))

(def ^:private js-api-global-name "LogseqMelangeDbWorkerJsApi")

(defn- restore-global!
  [present? value]
  (if present?
    (gobj/set js/globalThis js-api-global-name value)
    (gobj/remove js/globalThis js-api-global-name)))

(deftest browser-platform-loads-melange-js-api-package-test
  (let [original-present? (gobj/containsKey js/globalThis js-api-global-name)
        original-value (gobj/get js/globalThis js-api-global-name)]
    (gobj/remove js/globalThis js-api-global-name)
    (try
      (try
        (let [platform (platform-browser/browser-platform)]
          (is (= :browser (get-in platform [:env :runtime])))
          (is (fn? (get-in platform [:storage :list-graphs])))
          (is (fn? (get-in platform [:sqlite :init!]))))
        (catch :default e
          (is false (str "browser platform should load from package: " e))))
      (finally
        (restore-global! original-present? original-value)))))

(deftest browser-post-message-uses-cljs-transit-test
  (let [original-post-message (gobj/get js/self "postMessage")
        messages (atom [])]
    (gobj/set js/self "postMessage" #(swap! messages conj %))
    (try
      (platform/post-message! {:env {:runtime :browser}
                               :broadcast {:post-message!
                                           (fn [& _args]
                                             (throw (js/Error. "unexpected JS API post-message call")))}}
                              :graph/ready
                              {:ok true})
      (is (= 1 (count @messages)))
      (let [[type payload] (ldb/read-transit-str (first @messages))]
        (is (= :graph/ready type))
        (is (= {:ok true} payload)))
      (finally
        (gobj/set js/self "postMessage" original-post-message)))))
