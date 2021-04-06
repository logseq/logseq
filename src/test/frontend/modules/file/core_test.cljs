(ns frontend.modules.file.core-test
  (:require [cljs.test :refer [deftest is are testing use-fixtures run-tests] :as test]
            [cljs-run-test :refer [run-test]]
            [frontend.modules.file.core :as file]
            [clojure.string :as str]))

(deftest test-transform-content
  (let [s "#### abc\n\n"
        r " abc"]
    (is (= r (file/clip-content s)))))

(comment
  (run-test test-transform-content))

(def tree
  '({:block/pre-block? true,
     :block/uuid #uuid "60643869-3b5b-4e1b-a1f8-28ec965abb4c",
     :block/left {:db/id 20},
     :block/body
     ({:block/uuid #uuid "60643869-6feb-4b4a-87b0-7a8a76cf2746",
       :block/refs (),
       :block/anchor "level_1",
       :block/children
       #{[:block/uuid #uuid "60643869-c9dc-4a06-b1c3-e86bad631b3a"]},
       :block/body [],
       :block/meta
       {:timestamps [], :properties [], :start-pos 30, :end-pos 41},
       :block/level 2,
       :block/tags [],
       :block/title [["Plain" "level 1"]]}
      {:block/uuid #uuid "60643869-c9dc-4a06-b1c3-e86bad631b3a",
       :block/refs (),
       :block/anchor "level_1_1",
       :block/children
       #{[:block/uuid #uuid "60643869-3d80-4926-8854-5de911fb2aca"]},
       :block/body [],
       :block/meta
       {:timestamps [], :properties [], :start-pos 41, :end-pos 55},
       :block/level 3,
       :block/tags [],
       :block/title [["Plain" "level 1-1"]]}
      {:block/uuid #uuid "60643869-3d80-4926-8854-5de911fb2aca",
       :block/refs (),
       :block/anchor "level_1_1_1",
       :block/children #{},
       :block/body [],
       :block/meta
       {:timestamps [], :properties [], :start-pos 55, :end-pos 72},
       :block/level 4,
       :block/tags [],
       :block/title [["Plain" "level 1-1-1"]]}
      {:block/uuid #uuid "60643869-39d5-497e-b300-fa49993f6fda",
       :block/refs (),
       :block/anchor "level_2",
       :block/children #{},
       :block/body [],
       :block/meta
       {:timestamps [], :properties [], :start-pos 72, :end-pos 83},
       :block/level 2,
       :block/tags [],
       :block/title [["Plain" "level 2"]]}),
     :block/format :markdown,
     :block/level 2,
     :block/refs-with-children (),
     :block/content "---\ntitle: Mar 31th, 2021\n---\n",
     :db/id 24,
     :block/parent {:db/id 20},
     :block/page {:db/id 20},
     :block/file {:db/id 16}}
    {:block/uuid #uuid "60643869-6feb-4b4a-87b0-7a8a76cf2746",
     :block/left {:db/id 24},
     :block/anchor "level_1",
     :block/children
     ({:block/uuid #uuid "60643869-c9dc-4a06-b1c3-e86bad631b3a",
       :block/left {:db/id 25},
       :block/anchor "level_1_1",
       :block/children
       ({:block/uuid #uuid "60643869-3d80-4926-8854-5de911fb2aca",
         :block/left {:db/id 26},
         :block/anchor "level_1_1_1",
         :block/body [],
         :block/format :markdown,
         :block/level 4,
         :block/title [["Plain" "level 1-1-1"]],
         :block/refs-with-children (),
         :block/content "#### level 1-1-1\n",
         :db/id 27,
         :block/parent {:db/id 26},
         :block/page {:db/id 20},
         :block/file {:db/id 16}}),
       :block/body [],
       :block/format :markdown,
       :block/level 3,
       :block/title [["Plain" "level 1-1"]],
       :block/refs-with-children (),
       :block/content "### level 1-1",
       :db/id 26,
       :block/parent {:db/id 25},
       :block/page {:db/id 20},
       :block/file {:db/id 16}}),
     :block/body [],
     :block/format :markdown,
     :block/level 2,
     :block/title [["Plain" "level 1"]],
     :block/refs-with-children (),
     :block/content "## level 1\n",
     :db/id 25,
     :block/parent {:db/id 20},
     :block/page {:db/id 20},
     :block/file {:db/id 16}}
    {:block/uuid #uuid "60643869-39d5-497e-b300-fa49993f6fda",
     :block/left {:db/id 25},
     :block/anchor "level_2",
     :block/repo "logseq_local_test_navtive_fs",
     :block/body [],
     :block/format :markdown,
     :block/level 2,
     :block/title [["Plain" "level 2"]],
     :block/refs-with-children (),
     :block/content "## level 2",
     :db/id 28,
     :block/parent {:db/id 20},
     :block/page {:db/id 20},
     :block/file {:db/id 16}}))

(defn- clip-first-space [s]
  (str/replace s #"\n\s+" "\n"))

(deftest test-tree->file-content
  (let [r "---\ntitle: Mar 31th, 2021\n---\n##  level 1\n###  level 1-1\n####  level 1-1-1\n##  level 2"
        r (clip-first-space r)]
    (is (= r (file/tree->file-content tree 2)))))

(comment
  (run-test test-tree->file-content))
