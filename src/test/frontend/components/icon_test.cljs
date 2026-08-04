(ns frontend.components.icon-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [frontend.components.icon :as icon]))

(defn- source-for
  [relative-file]
  (.toString
   (fs/readFileSync (node-path/join (.cwd js/process) relative-file) "utf8")))

(defn- form-source
  [source marker]
  (let [start (string/index-of source marker)
        end (when start
              (or (some->> ["\n(hsx/defc " "\n(defn" "\n(defmethod"]
                           (keep #(string/index-of source % (inc start)))
                           seq
                           (apply min))
                  (count source)))]
    (when (and start end)
      (subs source start end))))

(deftest node-icon-precedence-matches-sidebar-and-command-results-test
  (let [own-icon {:type :emoji :id "sparkles"}
        tag-icon {:type :tabler-icon :id "rocket" :color "#ff0000"}
        tag {:db/id 2
             :db/ident :user.class/project
             :logseq.property/icon tag-icon}]
    (testing "the node's own icon wins"
      (is (= own-icon
             (icon/get-node-icon {:db/id 1
                                  :block/tags [tag]
                                  :logseq.property/icon own-icon}
                                 {}))))
    (testing "an inherited tag icon is retained for ordinary blocks"
      (is (= tag-icon
             (icon/get-node-icon {:db/id 1 :block/tags [tag]} {}))))
    (testing "page, class, and property fallbacks stay deterministic"
      (is (= "file"
             (icon/get-node-icon {:db/id 1
                                  :block/name "page"
                                  :block/tags [{:db/ident :logseq.class/Page}]}
                                 {})))
      (is (= "hash"
             (icon/get-node-icon {:db/id 1
                                  :block/tags [{:db/ident :logseq.class/Tag}]}
                                 {})))
      (is (= "letter-p"
             (icon/get-node-icon {:db/id 1
                                  :block/tags [{:db/ident :logseq.class/Property}]}
                                 {}))))))

(deftest favorites-and-recent-items-preserve-the-current-node-icon-test
  (let [cmdk-source (source-for "src/main/frontend/components/cmdk/core.cljs")
        recent-source (form-source cmdk-source "(defn- recent-page-items")
        sidebar-source (source-for "src/main/frontend/components/left_sidebar.cljs")
        page-name-source (form-source sidebar-source
                                     "(hsx/defc ^:large-vars/cleanup-todo page-name")]
    (is (some? recent-source))
    (is (some? page-name-source))
    (is (not (string/includes? recent-source ":ignore-current-icon? true"))
        "Recent results use the same own-icon precedence as favorites.")
    (is (string/includes? page-name-source "icon/get-node-icon-cp page"))))
