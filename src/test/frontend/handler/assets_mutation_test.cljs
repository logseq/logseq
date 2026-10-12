(ns frontend.handler.assets-mutation-test
  (:require [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.fs :as fs]
            [frontend.handler.assets :as assets]
            [frontend.state :as state]
            [frontend.util :as util]
            [promesa.core :as p]))

(deftest alias-enabled-needs-electron-and-the-setting-test
  (with-redefs [util/electron? (constantly false)
                state/get-state (constantly {:assets/alias-enabled? true})]
    (is (not (assets/alias-enabled?)) "not in the browser"))
  (with-redefs [util/electron? (constantly true)
                state/get-state (constantly {:assets/alias-enabled? false})]
    (is (not (assets/alias-enabled?)) "not when the setting is off"))
  (with-redefs [util/electron? (constantly true)
                state/get-state (constantly {:assets/alias-enabled? true})]
    (is (assets/alias-enabled?))))

(deftest clean-path-prefix-strips-the-assets-dir-test
  (is (= "@alias/a.png" (assets/clean-path-prefix "../assets/@alias/a.png")))
  (is (assets/check-alias-path? "../assets/@alias/a.png"))
  (is (nil? (assets/clean-path-prefix nil))))

(deftest normalize-asset-resource-url-keeps-protocol-links-test
  (with-redefs [util/electron? (constantly false)]
    (is (= "https://example.com/a.png"
           (assets/normalize-asset-resource-url "https://example.com/a.png")))))

(deftest normalize-asset-resource-url-decodes-an-encoded-absolute-path-once-test
  (with-redefs [util/electron? (constantly false)]
    (is (= "file:///home/a%20b.png"
           (assets/normalize-asset-resource-url "/home/a%20b.png")))
    (is (= "file:///home/a%20b.png"
           (assets/normalize-asset-resource-url "/home/a b.png")))))

(deftest resolve-asset-real-path-url-decodes-an-encoded-path-once-test
  (with-redefs [util/electron? (constantly false)
                config/get-repo-dir (constantly "/graph")]
    (is (= (#'assets/resolve-asset-real-path-url "repo" "assets/a b.png")
           (#'assets/resolve-asset-real-path-url "repo" "assets/a%20b.png")))))

(deftest resolve-asset-real-path-url-protects-a-windows-drive-only-in-electron-test
  (with-redefs [util/electron? (constantly true)
                config/get-repo-dir (constantly "C:/graph")]
    (is (= "assets:///C/logseq__colon/graph/assets/a.png"
           (#'assets/resolve-asset-real-path-url "repo" "assets/a.png"))))
  (with-redefs [util/electron? (constantly false)
                config/get-repo-dir (constantly "C:/graph")]
    (is (= "file:///C:/graph/assets/a.png"
           (#'assets/resolve-asset-real-path-url "repo" "assets/a.png")))))

(deftest make-data-url-returns-a-blob-url-test
  (async done
    (-> (p/with-redefs [state/get-current-repo (constantly "repo")
                        config/get-repo-dir (constantly "/graph")
                        fs/read-file-raw (fn [_dir _path _opts] (p/resolved (js/Uint8Array. #js [1 2 3])))]
          (assets/<make-data-url "assets/a.png"))
        (p/then (fn [url]
                  (is (string? url))
                  (is (string/starts-with? (str url) "blob:"))))
        (p/catch (fn [e] (is false (str e))))
        (p/finally done))))

(deftest uint8-rejects-an-object-with-data-that-is-not-a-buffer-test
  (is (thrown-with-msg? js/Error #"unsupported binary payload"
                        (assets/->uint8 #js {:data #js [1 2]})))
  (is (= [1 2] (js->clj (js/Array.from (assets/->uint8 #js {:type "Buffer" :data #js [1 2]}))))))
