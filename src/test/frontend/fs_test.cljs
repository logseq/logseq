(ns frontend.fs-test
  (:require ["fs" :as fs-node]
            ["path" :as node-path]
            [cljs.test :refer [is]]
            [frontend.fs :as fs]
            [frontend.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [frontend.test.node-fixtures :as node-fixtures]
            [frontend.test.node-helper :as test-node-helper]
            [promesa.core :as p]))

(deftest-async create-if-not-exists-creates-correctly
  {:before (node-fixtures/setup-get-fs!)
   :after (node-fixtures/restore-get-fs!)}
  ;; dir needs to be an absolute path for fn to work correctly
  (let [dir (node-path/resolve (test-node-helper/create-tmp-dir))
        some-file (node-path/join dir "something.txt")]

    (->
     (p/do!
      (fs/create-if-not-exists nil nil some-file "NEW")
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
  {:before (node-fixtures/setup-get-fs!)
   :after (node-fixtures/restore-get-fs!)}
  (let [dir (node-path/resolve (test-node-helper/create-tmp-dir))
        some-file (node-path/join dir "something.txt")]
    (fs-node/writeFileSync some-file "OLD")

    (->
     (p/do!
      (fs/create-if-not-exists nil nil some-file "NEW")
      (is (= "OLD" (str (fs-node/readFileSync some-file)))
          "something.txt has not been touched and old content still exists"))

     (p/finally
       (fn []
         (fs-node/unlinkSync some-file)
         (fs-node/rmdirSync dir))))))
