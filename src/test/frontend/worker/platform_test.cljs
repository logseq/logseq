(ns frontend.worker.platform-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.worker.platform :as platform]
            [frontend.worker.platform.browser :as platform-browser]
            [promesa.core :as p]))

(deftest kv-get-normalizes-undefined-to-nil-test
  (async done
         (-> (platform/kv-get {:kv {:get (fn [_k]
                                           (p/resolved js/undefined))}}
                              "key")
             (p/then (fn [value]
                       (is (nil? value))
                       (is (not (identical? js/undefined value)))))
             (p/catch (fn [e]
                        (is false (str e))))
             (p/finally done))))

(deftest read-secret-text-normalizes-undefined-to-nil-test
  (async done
         (-> (platform/read-secret-text {:crypto {:read-secret-text (fn [_key]
                                                                      (p/resolved js/undefined))}}
                                        "secret")
             (p/then (fn [value]
                       (is (nil? value))
                       (is (not (identical? js/undefined value)))))
             (p/catch (fn [e]
                        (is false (str e))))
             (p/finally done))))

(deftest browser-platform-mirror-storage-is-unsupported-test
  (let [original-location (.-location js/globalThis)]
    (try
      (set! (.-location js/globalThis) #js {:href "http://localhost/?electron=true"
                                            :search "?electron=true"})
      (let [storage (:storage (platform-browser/browser-platform))]
        (doseq [[f args] [[(:mirror-read-text! storage) ["mirror.md"]]
                          [(:write-text-atomic! storage) ["mirror.md" "content"]]
                          [(:delete-file! storage) ["mirror.md"]]]]
          (try
            (apply f args)
            (is false "Expected browser mirror storage to throw")
            (catch :default e
              (is (= {:platform :browser
                      :feature :markdown-mirror}
                     (ex-data e)))))))
      (finally
        (set! (.-location js/globalThis) original-location)))))
