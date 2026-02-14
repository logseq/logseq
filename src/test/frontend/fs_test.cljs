(ns frontend.fs-test
  (:require ["fs" :as fs-node]
            ["path" :as node-path]
            [cljs.test :refer [is]]
            [frontend.config :as config]
            [frontend.fs :as fs]
            [frontend.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [frontend.test.node-fixtures :as node-fixtures]
            [frontend.test.node-helper :as test-node-helper]
            [frontend.util :as util]
            [logseq.common.config :as common-config]
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

(deftest-async write-asset-file-ensures-db-assets-dir-test
  (let [repo-dir (node-path/resolve (test-node-helper/create-tmp-dir))
        file-name "asset.txt"
        payload "asset payload"
        calls (atom [])
        old-window (.-window js/globalThis)
        had-window? (.call (.-hasOwnProperty (.-prototype js/Object))
                           js/globalThis
                           "window")
        window #js {:apis #js {:writeFileBytes
                               (fn [file-path data]
                                 (swap! calls conj [:write file-path data])
                                 (p/resolved true))}}]
    (js/Object.defineProperty js/globalThis
                              "window"
                              #js {:value window
                                   :configurable true
                                   :writable true})
    (p/with-redefs [config/get-repo-dir (constantly repo-dir)
                    util/electron? (constantly true)
                    fs/mkdir-recur! (fn [dir]
                                      (swap! calls conj [:mkdir dir])
                                      (p/resolved nil))]
      (-> (p/do!
           (fs/write-asset-file! "repo" file-name payload)
           (let [assets-dir (node-path/join repo-dir common-config/local-assets-dir)
                 asset-path (node-path/join assets-dir file-name)]
             (is (= [[:mkdir assets-dir]
                     [:write asset-path payload]]
                    @calls))))
          (p/finally
            (fn []
              (if had-window?
                (js/Object.defineProperty js/globalThis
                                          "window"
                                          #js {:value old-window
                                               :configurable true
                                               :writable true})
                (js/Reflect.deleteProperty js/globalThis "window"))
              (fs-node/rmdirSync repo-dir)))))))
