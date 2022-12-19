(ns frontend.fs.sync-test
  (:require [frontend.fs.sync :as sync]
            [clojure.test :refer [deftest are is]]))

(deftest ignored?
  (are [x y] (= y (sync/ignored? x))
    ".git" true
    ".gitignore" true
    ".DS_store" true
    "foo/.DS_store" true
    "logseq/graphs-txid.edn" true
    "logseq/version-files/1.md" true
    "logseq/bak/1.md" true
    "node_modules/test" true
    "foo/node_modules/" true
    "backup~" true
    "foo/backup~" true
    "foo/.test.md" true
    "pages/test.md" false
    "journals/2022_01_01.md" false
    ))


(deftest diff-file-metadata-sets
  (are [x y z] (= x (sync/diff-file-metadata-sets y z))
    #{}
    #{(sync/->FileMetadata 1 2 "3" 4 5 nil nil nil)}
    #{(sync/->FileMetadata 1 2 "3" 4 5 nil nil nil)}

    #{}
    #{(sync/->FileMetadata 1 2 "3" 4 5 nil nil nil)}
    #{(sync/->FileMetadata 1 22 "3" 4 6 nil nil nil)}

    #{(sync/->FileMetadata 1 2 "3" 4 5 nil nil nil)}
    #{(sync/->FileMetadata 1 2 "3" 4 5 nil nil nil)}
    #{(sync/->FileMetadata 1 22 "3" 4 4 nil nil nil) (sync/->FileMetadata 1 22 "3" 44 5 nil nil nil)}

    #{}
    #{(sync/->FileMetadata 1 2 "3" 4 5 nil nil nil)}
    #{(sync/->FileMetadata 1 2 "3" 4 4 nil nil nil) (sync/->FileMetadata 1 2 "3" 4 6 nil nil nil)}

    )
  )

(deftest sync-state--recent-remote->local-files
  (let [item1       {:remote->local-type :update
                     :checksum           "checksum1"
                     :path               "path1"}
        item2       {:remote->local-type :update
                     :checksum           "checksum2"
                     :path               "path2"}
        item-map    (fn [items] (into {} (map (juxt :path identity)) items))
        sync-state  (sync/sync-state)
        sync-state1 (sync/sync-state--add-recent-remote->local-files sync-state [item1 item2])]

    (is (= (assoc sync-state
                  :recent-remote->local-files-map
                  (item-map [item1 item2])
                  :recent-remote->local-files
                  (set [item1 item2]))
           sync-state1))

    (let [item3 (assoc item1 :checksum "checksum3")
          sync-state2 (sync/sync-state--add-recent-remote->local-files sync-state1 [item3])]
      (is (= (-> sync-state1
                 (assoc-in [:recent-remote->local-files-map (:path item1) :checksum] (:checksum item3))
                 (assoc :recent-remote->local-files (set [item2 item3])))
             sync-state2))

      (let [sync-state3 (sync/sync-state--remove-recent-remote->local-files sync-state2 [item2])]
        (is (= (-> sync-state2
                   (update :recent-remote->local-files-map dissoc (:path item2))
                   (update :recent-remote->local-files disj (:path item2)))
               sync-state3))

        (let [sync-state4 (sync/sync-state--remove-recent-remote->local-files sync-state3 [item3])]
          (is (= (-> sync-state3
                     (update :recent-remote->local-files-map dissoc (:path item3))
                     (update :recent-remote->local-files disj (:path item3)))
                 sync-state4)))))))
