(ns electron.interop-test
  (:require [cljs.test :refer [deftest is testing]]
            [electron.interop :as interop]))

(deftest default-function-or-module-test
  (testing "uses native ESM default export when it is callable"
    (let [open-fn (fn [& args] args)
          module #js {:default open-fn}]
      (is (identical? open-fn (interop/default-function-or-module module)))))
  (testing "keeps CommonJS function exports callable"
    (let [open-fn (fn [& args] args)]
      (is (identical? open-fn (interop/default-function-or-module open-fn)))))
  (testing "falls back to module when default is not callable"
    (let [module #js {:default "not-callable"}]
      (is (identical? module (interop/default-function-or-module module))))))
