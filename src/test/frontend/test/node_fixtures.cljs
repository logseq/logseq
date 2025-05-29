(ns frontend.test.node-fixtures
  (:require [cljs.test :refer [async]]
            [frontend.fs :as fs]
            [frontend.fs.test-node :as test-node]))

(let [get-fs-fn (atom nil)]
  (def redef-get-fs
    "Redef fs/get-fs to an implementation that is valid for node tests"
    {:before (fn []
               (async done
                      (reset! get-fs-fn fs/get-fs)
                      (set! fs/get-fs (constantly (test-node/->NodeTestfs)))
                      (done)))
     :after (fn [] (set! fs/get-fs @get-fs-fn))}))
