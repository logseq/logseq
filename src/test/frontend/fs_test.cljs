(ns frontend.fs-test
  (:require [clojure.test :refer [is use-fixtures]]
            [frontend.test.fixtures :as fixtures]
            [frontend.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [frontend.test.node-helper :as test-node-helper]
            [frontend.fs :as fs]
            [promesa.core :as p]
            ["fs" :as fs-node]
            ["path" :as node-path]))

(use-fixtures :once fixtures/redef-get-fs)

(deftest-async create-if-not-exists-creates-correctly
  ;; dir needs to be an absolute path for fn to work correctly
  (let [dir (node-path/resolve (test-node-helper/create-tmp-dir))
        some-file (node-path/join dir "something.txt")]

    (->
     (p/do!
      (fs/create-if-not-exists nil dir some-file "NEW")
      (is (fs-node/existsSync some-file)
          "something.txt created correctly")
      (is (= "NEW"
             (str (fs-node/readFileSync some-file)))
          "something.txt has correct content"))

     (p/finally
      (fn []
        (fs-node/unlinkSync some-file)
        (fs-node/rmdirSync dir))))))

(deftest-async create-if-not-exists-does-not-create-correctly
  (let [dir (node-path/resolve (test-node-helper/create-tmp-dir))
        some-file (node-path/join dir "something.txt")]
    (fs-node/writeFileSync some-file "OLD")

    (->
     (p/do!
      (fs/create-if-not-exists nil dir some-file "NEW")
      (is (= "OLD" (str (fs-node/readFileSync some-file)))
          "something.txt has not been touched and old content still exists"))

     (p/finally
      (fn []
        (fs-node/unlinkSync some-file)
        (fs-node/rmdirSync dir))))))
