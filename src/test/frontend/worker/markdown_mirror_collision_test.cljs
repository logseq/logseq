(ns frontend.worker.markdown-mirror-collision-test
  "Two pages must never share one mirror file: not through case, not through a
  literal ` (n)` title, and not after a rename shifts a stem group."
  (:require [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.worker.markdown-mirror :as markdown-mirror]
            [logseq.db.test.helper :as db-test]
            [promesa.core :as p]))

(def ^:private test-repo "logseq_db_mirror-collision")

(defn- fake-platform
  []
  (let [files (atom {})]
    {:platform {:env {:runtime :node}
                :storage {:read-text! (fn [path] (p/resolved (get @files path)))
                          :write-text-atomic! (fn [path content]
                                                (swap! files assoc path content)
                                                (p/resolved nil))
                          :delete-file! (fn [path]
                                          (swap! files dissoc path)
                                          (p/resolved nil))}
                :broadcast {:post-message! (fn [& _] nil)}}
     :files files}))

(defn- paths-by-uuid
  [db uuids]
  (mapv #(markdown-mirror/page-relative-path db (d/entity db [:block/uuid %])) uuids))

(deftest titles-differing-only-in-case-get-distinct-files-test
  (let [uuid-1 #uuid "11111111-1111-4111-8111-111111111111"
        uuid-2 #uuid "22222222-2222-4222-8222-222222222222"
        conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "Notes" :block/uuid uuid-1}}
                                  {:page {:block/title "notes" :block/uuid uuid-2}}]})
        [path-1 path-2] (paths-by-uuid @conn [uuid-1 uuid-2])]
    (is (= "pages/Notes.md" path-1))
    (is (not= (string/lower-case path-1) (string/lower-case path-2))
        "the two files are distinct on a case-insensitive file system")))

(deftest a-literal-suffixed-title-is-not-reused-as-a-duplicate-name-test
  (let [uuid-1 #uuid "11111111-1111-4111-8111-111111111111"
        uuid-2 #uuid "22222222-2222-4222-8222-222222222222"
        uuid-3 #uuid "33333333-3333-4333-8333-333333333333"
        conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "Foo (2)" :block/uuid uuid-1}}
                                  {:page {:block/title "Foo" :block/uuid uuid-2}}
                                  {:page {:block/title "Foo" :block/uuid uuid-3}}]})
        paths (paths-by-uuid @conn [uuid-1 uuid-2 uuid-3])]
    (is (= "pages/Foo (2).md" (first paths)))
    (is (= 3 (count (set paths))) "every page has its own file")))

(deftest rename-into-a-stem-group-rewrites-the-shifted-page-test
  (async done
         (let [{:keys [platform files]} (fake-platform)
               ;; sorts first, so it takes index 1 of the "Foo" group once renamed
               bar-uuid #uuid "11111111-1111-4111-8111-111111111111"
               foo-uuid #uuid "22222222-2222-4222-8222-222222222222"
               conn (db-test/create-conn-with-blocks
                     {:pages-and-blocks [{:page {:block/title "Bar" :block/uuid bar-uuid}
                                          :blocks [{:block/title "bar body"}]}
                                         {:page {:block/title "Foo" :block/uuid foo-uuid}
                                          :blocks [{:block/title "foo body"}]}]})
               has-body? (fn [body] (some #(string/includes? % body) (vals @files)))]
           (markdown-mirror/set-enabled! test-repo true)
           (-> (p/let [_ (markdown-mirror/<mirror-repo! test-repo @conn {:platform platform})
                       bar-id (:db/id (d/entity @conn [:block/uuid bar-uuid]))
                       tx-report (d/transact! conn [[:db/add bar-id :block/title "Foo"]
                                                    [:db/add bar-id :block/name "foo"]])
                       _ (markdown-mirror/<handle-tx-report! test-repo conn tx-report {:platform platform})]
                 (is (has-body? "bar body") "the renamed page is mirrored")
                 (is (has-body? "foo body") "the page whose duplicate index shifted is still mirrored")
                 (is (not (contains? @files (str (markdown-mirror/repo-mirror-dir test-repo) "/pages/Bar.md")))
                     "the renamed page's old file is removed"))
               (p/catch (fn [error] (is false (str error))))
               (p/finally (fn []
                            (markdown-mirror/set-enabled! test-repo false)
                            (done)))))))
