(ns frontend.worker.platform-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.worker.platform :as platform]
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
