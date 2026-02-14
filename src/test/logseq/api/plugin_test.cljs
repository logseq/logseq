(ns logseq.api.plugin-test
  (:require [cljs.test :refer [async deftest is testing]]
            [logseq.api.plugin :as plugin]
            [promesa.core :as p]))

(deftest read-plugin-storage-file-missing-file-test
  (testing "missing plugin storage files read as nil"
    (async done
           (p/with-redefs [plugin/read_dotdir_file
                           (fn [_file _sub-root]
                             (p/rejected (js/Error. "file not existed")))]
             (-> (plugin/read_plugin_storage_file "test-plugin" "missing.edn" false)
                 (p/then (fn [result]
                           (is (nil? result))))
                 (p/finally done)))))))

(deftest read-plugin-storage-file-keeps-non-missing-errors-test
  (testing "non-missing storage errors still reject"
    (async done
           (let [error (js/Error. "read file denied")]
             (p/with-redefs [plugin/read_dotdir_file
                             (fn [_file _sub-root]
                               (p/rejected error))]
               (-> (plugin/read_plugin_storage_file "test-plugin" "secrets.edn" false)
                   (p/then (fn [_]
                             (is false "read should reject")))
                   (p/catch (fn [result]
                              (is (identical? error result))))
                   (p/finally done)))))))
