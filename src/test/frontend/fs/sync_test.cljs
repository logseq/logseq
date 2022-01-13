(ns frontend.fs.sync-test
  (:require [clojure.string :as string]
            [cljs.test :refer [deftest is]]
            [frontend.fs.sync :as sync]))


(defn- create-txns [test-txns]
  (map-indexed (fn [idx [txtype txcontent]]
          {:TXId idx :TXType txtype :TXContent (string/join "\n" txcontent)})
        test-txns))

(def txns-1
  (create-txns
   [["update_files"
     ["f1" "f2"]]
    ["update_files"
     ["f2" "f1"]]]))

(def txns-2
  (create-txns
   [["update_files"
     ["f1"]]
    ["delete_files"
     ["f1"]]]))

(def txns-3
  (create-txns
   [["update_files"
     ["f1"]]
    ["rename_file"
     ["f1" "f2"]]
    ["delete_files"
     ["f2"]]]))

(def txns-4
  (create-txns
   [["delete_files"
     ["f2" "f3"]]]))

(deftest test-FileTxnSet
  (is (=
       (seq (sync/update-txns (.-EMPTY sync/FileTxnSet) txns-1))
       [(sync/->FileTxn "f1" "f1" true false 0)
        (sync/->FileTxn "f2" "f2" true false 1)]))
  (is (=
       (seq (sync/update-txns (.-EMPTY sync/FileTxnSet) txns-2))
       [(sync/->FileTxn "f1" "f1" false true 0)]))
  (is (=
       (seq (sync/update-txns (.-EMPTY sync/FileTxnSet) txns-3))
       [(sync/->FileTxn "f1" "f2" false true 0)]))
  (is (=
       (seq (sync/update-txns (.-EMPTY sync/FileTxnSet) txns-4))
       [(sync/->FileTxn "f2" "f2" false true 0)
        (sync/->FileTxn "f3" "f3" false true 1)])))
