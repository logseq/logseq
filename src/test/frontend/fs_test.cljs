(ns frontend.fs-test
  (:require ["fs" :as fs-node]
            ["fs/promises" :as fsp]
            ["path" :as node-path]
            [cljs.test :refer [is]]
            [electron.ipc :as ipc]
            [frontend.fs :as fs]
            [frontend.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [frontend.test.node-fixtures :as node-fixtures]
            [frontend.test.node-helper :as test-node-helper]
            [frontend.util :as util]
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

(deftest-async write-plain-text-file-propagates-write-failure-test
  {:before (node-fixtures/setup-get-fs!)
   :after (node-fixtures/restore-get-fs!)}
  (let [dir (node-path/resolve (test-node-helper/create-tmp-dir))]
    (-> (fs/write-plain-text-file! nil dir dir "content" {})
        (p/then (fn [_]
                  (is false "Writing to a directory must reject.")))
        (p/catch (fn [error]
                   (is (some? error))))
        (p/finally #(fs-node/rmdirSync dir)))))

(deftest-async write-file-creates-missing-parent-dir-test
  {:before (node-fixtures/setup-get-fs!)
   :after (node-fixtures/restore-get-fs!)}
  (let [repo-dir (node-path/resolve (test-node-helper/create-tmp-dir))
        export-css-path (node-path/join repo-dir "logseq" "export.css")]
    (is (not (fs-node/existsSync (node-path/join repo-dir "logseq")))
        "precondition: logseq/ dir is missing")
    (-> (p/with-redefs [util/electron? (constantly true)
                        ipc/ipc (fn [op _repo path content]
                                  (is (= "writeFile" op))
                                  (fsp/writeFile path content))]
          (p/do!
           (fs/write-file! export-css-path ".foo { color: red; }")
           (is (fs-node/existsSync (node-path/join repo-dir "logseq"))
               "first write creates missing logseq/ parent dir")
           (is (fs-node/existsSync export-css-path)
               "first write creates missing export.css")
           (is (= ".foo { color: red; }"
                  (str (fs-node/readFileSync export-css-path))))))
        (p/finally
         (fn []
           (when (fs-node/existsSync repo-dir)
             (fs-node/rmSync repo-dir #js {:recursive true :force true})))))))
