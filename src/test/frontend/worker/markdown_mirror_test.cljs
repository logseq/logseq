(ns frontend.worker.markdown-mirror-test
  (:require [clojure.string :as string]
            [cljs.test :refer [async deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.db-listener :as db-listener]
            [frontend.worker.markdown-mirror :as markdown-mirror]
            [frontend.worker.platform :as worker-platform]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [promesa.core :as p]))

(def test-repo "logseq_db_graph-xxx")

(defn- fake-platform
  ([] (fake-platform {:runtime :node}))
  ([env]
   (let [files (atom {})
         writes (atom [])
         deletes (atom [])]
     {:platform {:env env
                 :storage {:read-text! (fn [path]
                                         (p/resolved (get @files path)))
                           :resolve-text-path (fn [path]
                                                (str "/tmp/logseq/" path))
                           :write-text-atomic! (fn [path content]
                                                 (swap! writes conj [path content])
                                                 (swap! files assoc path content)
                                                 (p/resolved nil))
                           :delete-file! (fn [path]
                                           (swap! deletes conj path)
                                           (swap! files dissoc path)
                                           (p/resolved nil))}
                 :broadcast {:post-message! (fn [& _] nil)}}
      :files files
      :writes writes
      :deletes deletes})))

(defn- page-path [path]
  (str (markdown-mirror/repo-mirror-dir test-repo) "/" path))

(defn- sidecar-page-path [page-uuid]
  (page-path (str ".logseq/pages/" page-uuid ".json")))

(defn- parse-json
  [content]
  (js->clj (js/JSON.parse content) :keywordize-keys true))

(defn- markdown-writes
  [writes]
  (filterv #(string/ends-with? (first %) ".md") @writes))

(defn- first-block [page]
  (-> page :block/_page first))

(defn- block-by-title [db title]
  (->> (d/datoms db :avet :block/title title)
       (map #(d/entity db (:e %)))
       (filter :block/page)
       first))

(defn- page-block-titles
  [db page-title]
  (let [page (db-test/find-page-by-title db page-title)]
    (->> (:block/_parent page)
         (sort-by :block/order)
         (mapv :block/title))))

(defn- child-block-titles
  [db block-uuid]
  (->> (:block/_parent (d/entity db [:block/uuid block-uuid]))
       (sort-by :block/order)
       (mapv :block/title)))

(defn- block-title-includes?
  [db block-uuid s]
  (string/includes? (:block/title (d/entity db [:block/uuid block-uuid])) s))

(defn- block-status-ident
  [db block-uuid]
  (:db/ident (:logseq.property/status
              (d/pull db [{:logseq.property/status [:db/ident]}] [:block/uuid block-uuid]))))

(defn- block-tag-idents
  [db block-uuid]
  (set (map :db/ident (:block/tags (d/entity db [:block/uuid block-uuid])))))

(defn- page-marker [uuid]
  (str "id:: " uuid))

(defn- plain-block-line
  [title]
  (str "- " title))

(defn- page-markdown
  [page-uuid titles]
  (str (page-marker page-uuid) "\n\n"
       (string/join "\n" (map plain-block-line titles))))

(defn- run-sidecar-edit-case!
  [{:keys [case-id initial-blocks edited-titles expected-existing-titles]}]
  (let [{:keys [platform files]} (fake-platform)
        page-uuid (random-uuid)
        page-title (str "Sidecar Edit Case " case-id)
        conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title page-title
                                           :block/uuid page-uuid}
                                   :blocks (mapv (fn [{:keys [uuid title]}]
                                                   {:block/title title
                                                    :block/uuid uuid})
                                                 initial-blocks)}]})
        page (db-test/find-page-by-title @conn page-title)
        relative-path (str "pages/" page-title ".md")
        storage-path (page-path relative-path)
        edited-content (page-markdown page-uuid edited-titles)]
    (p/let [_ (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
            _ (is (string? (get @files (sidecar-page-path page-uuid))) case-id)
            _ (swap! files assoc storage-path edited-content)
            result (markdown-mirror/<import-file-content! test-repo conn relative-path edited-content {:platform platform})
            _ (is (= :imported (:status result)) case-id)
            _ (is (= edited-titles (page-block-titles @conn page-title)) case-id)
            _ (doseq [[block-uuid expected-title] expected-existing-titles]
                (is (= expected-title (:block/title (d/entity @conn [:block/uuid block-uuid]))) case-id))
            refreshed-page (db-test/find-page-by-title @conn page-title)
            _ (markdown-mirror/<mirror-page! test-repo @conn (:db/id refreshed-page) {:platform platform})]
      (is (= edited-content (get @files storage-path)) case-id))))

(defn- run-sidecar-edit-cases!
  [cases]
  (reduce (fn [chain edit-case]
            (p/then chain #(run-sidecar-edit-case! edit-case)))
          (p/resolved nil)
          cases))

(defn- insert-at
  [v idx item]
  (vec (concat (subvec v 0 idx) [item] (subvec v idx))))

(defn- remove-at
  [v idx]
  (vec (concat (subvec v 0 idx) (subvec v (inc idx)))))

(defn- update-at
  [v idx f]
  (assoc v idx (f (nth v idx))))

(defn- next-seed
  [seed]
  (mod (+ (* seed 1103515245) 12345) 2147483647))

(defn- random-edit-case
  [seed]
  (let [state (atom seed)
        next-int (fn [n]
                   (let [seed' (swap! state next-seed)]
                     (mod seed' n)))
        initial-count (+ 4 (next-int 4))
        initial-items (mapv (fn [idx]
                              {:uuid (random-uuid)
                               :title (str "r" seed "-block-" idx)})
                            (range initial-count))]
    (loop [step 0
           items initial-items]
      (if (= step 8)
        {:case-id (str "random-" seed)
         :initial-blocks initial-items
         :edited-titles (mapv :title items)
         :expected-existing-titles (->> items
                                        (keep (fn [{:keys [uuid title]}]
                                                (when uuid [uuid title])))
                                        (into {}))}
        (let [op (next-int 3)
              items' (case op
                       0 (let [idx (next-int (count items))]
                           (update-at items idx #(update % :title str " edited-" step)))
                       1 (let [idx (next-int (inc (count items)))]
                           (insert-at items idx {:title (str "r" seed "-new-" step)}))
                       2 (if (> (count items) 2)
                           (remove-at items (next-int (count items)))
                           items))]
          (recur (inc step) items'))))))

(defn- block-line
  [_uuid title]
  (plain-block-line title))

(defn- <mirror-repo!
  [& args]
  (if-let [f (resolve 'frontend.worker.markdown-mirror/<mirror-repo!)]
    (apply f args)
    (p/resolved ::missing-mirror-repo-fn)))

(deftest repo-mirror-dir-is-under-mirror-markdown-test
  (is (= "graph-xxx/mirror/markdown"
         (markdown-mirror/repo-mirror-dir test-repo))))

(deftest normalize-file-name-is-cross-platform-and-deterministic-test
  (testing "invalid filesystem characters and path separators are replaced"
    (is (= "A_B_C_D_E_F_G_H"
           (markdown-mirror/normalize-file-stem "A/B\\C:D<E>F\"G|H"))))

  (testing "trailing spaces and dots are removed"
    (is (= "title"
           (markdown-mirror/normalize-file-stem "title.  "))))

  (testing "unicode is normalized before sanitizing"
    (is (= (markdown-mirror/normalize-file-stem "e\u0301")
           (markdown-mirror/normalize-file-stem "\u00e9"))))

  (testing "reserved Windows device names are rejected"
    (is (nil? (markdown-mirror/normalize-file-stem "CON")))
    (is (nil? (markdown-mirror/normalize-file-stem "lpt9")))))

(deftest same-title-pages-write-distinct-stable-friendly-paths-test
  (let [page-uuid-1 #uuid "11111111-1111-4111-8111-111111111111"
        page-uuid-2 #uuid "22222222-2222-4222-8222-222222222222"
        conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "Same Name"
                                           :block/uuid page-uuid-1}
                                   :blocks [{:block/title "first"}]}
                                  {:page {:block/title "Same Name"
                                           :block/uuid page-uuid-2}
                                   :blocks [{:block/title "second"}]}]})
        pages (->> (d/datoms @conn :avet :block/title "Same Name")
                   (map #(d/entity @conn (:e %)))
                   (filter #(nil? (:block/page %)))
                   (sort-by (comp str :block/uuid)))
        paths (mapv #(markdown-mirror/page-relative-path @conn %) pages)]
    (is (= ["pages/Same Name.md"
            "pages/Same Name (2).md"]
           paths))))

(deftest page-references-remain-wiki-links-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "11111111-1111-4111-8111-111111111113"
          block-uuid #uuid "11111111-1111-4111-8111-111111111114"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Source"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "See [[Foo]]"
                                               :block/uuid block-uuid}]}
                                    {:page {:block/title "Foo"}
                                     :blocks [{:block/title "target"}]}
                                    {:page {:block/title "Foo"}
                                     :blocks [{:block/title "duplicate"}]}]})
          page (db-test/find-page-by-title @conn "Source")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (is (= (str (page-marker page-uuid) "\n\n"
                                (block-line block-uuid "See [[Foo]]"))
                           (get @files (page-path "pages/Source.md"))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest page-mirror-omits-id-for-ordinary-leaf-blocks-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "11111111-1111-4111-8111-111111111115"
          block-uuid #uuid "11111111-1111-4111-8111-111111111116"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Sparse"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "hello"
                                               :block/uuid block-uuid}]}]})
          page (db-test/find-page-by-title @conn "Sparse")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (is (= (str (page-marker page-uuid) "\n\n"
                                (plain-block-line "hello"))
                           (get @files (page-path "pages/Sparse.md"))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest page-mirror-omits-id-for-blocks-with-sync-bookkeeping-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "11111111-1111-4111-8111-111111111120"
          block-uuid #uuid "11111111-1111-4111-8111-111111111121"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Sync Bookkeeping"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "hello"
                                               :block/uuid block-uuid}]}]})
          block (d/entity @conn [:block/uuid block-uuid])
          _ (d/transact! conn [{:db/id (:db/id block)
                                :block/tx-id 42
                                :block/collapsed? false}])
          page (db-test/find-page-by-title @conn "Sync Bookkeeping")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (is (= (str (page-marker page-uuid) "\n\n"
                                (plain-block-line "hello"))
                           (get @files (page-path "pages/Sync Bookkeeping.md"))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest page-mirror-omits-id-for-referenced-blocks-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "11111111-1111-4111-8111-111111111117"
          target-uuid #uuid "11111111-1111-4111-8111-111111111118"
          referrer-uuid #uuid "11111111-1111-4111-8111-111111111119"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Referenced"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "target"
                                               :block/uuid target-uuid}
                                              {:block/title "referrer"
                                               :block/uuid referrer-uuid}]}]})
          page (db-test/find-page-by-title @conn "Referenced")
          target (d/entity @conn [:block/uuid target-uuid])
          referrer (d/entity @conn [:block/uuid referrer-uuid])
          _ (d/transact! conn [[:db/add (:db/id referrer) :block/refs (:db/id target)]])]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (is (= (str (page-marker page-uuid) "\n\n"
                                "- target\n"
                                "- referrer")
                           (get @files (page-path "pages/Referenced.md"))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest block-references-remain-uuid-links-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "11111111-1111-4111-8111-111111111121"
          block-referrer-uuid #uuid "11111111-1111-4111-8111-111111111122"
          block-target-uuid #uuid "11111111-1111-4111-8111-111111111123"
          page-target-uuid #uuid "11111111-1111-4111-8111-111111111124"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Block Ref Source"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title (str "See [[" block-target-uuid "]] and [[" page-target-uuid "]]")
                                               :block/uuid block-referrer-uuid}
                                              {:block/title "target block"
                                               :block/uuid block-target-uuid}]}
                                    {:page {:block/title "Target Page"
                                            :block/uuid page-target-uuid}
                                     :blocks []}]})
          page (db-test/find-page-by-title @conn "Block Ref Source")
          referrer (d/entity @conn [:block/uuid block-referrer-uuid])
          block-target (d/entity @conn [:block/uuid block-target-uuid])
          page-target (db-test/find-page-by-title @conn "Target Page")
          _ (d/transact! conn [[:db/add (:db/id referrer) :block/refs (:db/id block-target)]
                               [:db/add (:db/id referrer) :block/refs (:db/id page-target)]])]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (is (= (str (page-marker page-uuid) "\n\n"
                                "- See [[" block-target-uuid "]] and [[Target Page]]\n"
                                "- target block")
                           (get @files (page-path "pages/Block Ref Source.md"))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest affected-page-ids-detects-edited-block-page-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "Page A"}
                                   :blocks [{:block/title "before"}]}]})
        page (db-test/find-page-by-title @conn "Page A")
        block (first-block page)
        tx-report (d/with @conn [{:db/id (:db/id block)
                                  :block/title "after"}])]
    (is (= #{(:db/id page)}
           (markdown-mirror/affected-page-ids tx-report)))))

(deftest affected-page-ids-detects-referrers-when-referenced-page-renamed-test
  (let [target-uuid #uuid "22222222-2222-4222-8222-222222222231"
        referrer-uuid #uuid "22222222-2222-4222-8222-222222222232"
        conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "Source"}
                                   :blocks [{:block/title (str "See [[" target-uuid "]]")
                                             :block/uuid referrer-uuid}]}
                                  {:page {:block/title "Old Target"
                                           :block/name "old target"
                                           :block/uuid target-uuid}
                                   :blocks []}]})
        source (db-test/find-page-by-title @conn "Source")
        target (db-test/find-page-by-title @conn "Old Target")
        referrer (d/entity @conn [:block/uuid referrer-uuid])
        _ (d/transact! conn [[:db/add (:db/id referrer) :block/refs (:db/id target)]])
        tx-report (d/with @conn [{:db/id (:db/id target)
                                  :block/title "New Target"
                                  :block/name "new target"}])]
    (is (= #{(:db/id source) (:db/id target)}
           (markdown-mirror/affected-page-ids tx-report)))))

(deftest enabled-electron-edit-writes-page-mirror-test
  (async done
    (let [{:keys [platform files writes]} (fake-platform)
          page-uuid #uuid "33333333-3333-4333-8333-333333333333"
          block-uuid-1 #uuid "33333333-3333-4333-8333-333333333334"
          block-uuid-2 #uuid "33333333-3333-4333-8333-333333333335"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Page A"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "hello"
                                               :block/uuid block-uuid-1}
                                              {:block/title "world"
                                               :block/uuid block-uuid-2}]}]})
          page (db-test/find-page-by-title @conn "Page A")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (let [path (page-path "pages/Page A.md")
                          content (str (page-marker page-uuid) "\n\n"
                                       (block-line block-uuid-1 "hello") "\n"
                                       (block-line block-uuid-2 "world"))]
                      (is (= content (get @files path)))
                      (is (= [[path content]] (markdown-writes writes)))
                      (let [sidecar (parse-json (get @files (sidecar-page-path page-uuid)))]
                        (is (= 1 (:version sidecar)))
                        (is (= (str page-uuid) (:page-uuid sidecar)))
                        (is (= [(str block-uuid-1) (str block-uuid-2)]
                               (mapv :uuid (:blocks sidecar))))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest page-mirror-exports-property-values-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "22222222-2222-4222-8222-222222222221"
          block-uuid #uuid "22222222-2222-4222-8222-222222222222"
          conn (db-test/create-conn-with-blocks
                {:properties {:user.property/reproducible-steps {:logseq.property/type :default}
                              :user.property/rating {:logseq.property/type :number}}
                 :pages-and-blocks [{:page {:block/title "Issue"
                                             :block/uuid page-uuid
                                             :build/properties {:user.property/reproducible-steps "Open settings"
                                                                :logseq.property/heading 1}}
                                     :blocks [{:block/title "TODO body"
                                               :block/uuid block-uuid
                                               :build/properties {:logseq.property/status :logseq.property/status.todo
                                                                  :user.property/reproducible-steps "Click mirror"
                                                                  :user.property/rating 5
                                                                  :logseq.property/heading 2}}]}]})
          page (db-test/find-page-by-title @conn "Issue")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (let [content (get @files (page-path "pages/Issue.md"))]
                      (is (= (str (page-marker page-uuid) "\n"
                                  "reproducible-steps:: Open settings\n\n"
                                  "- TODO body\n"
                                  "  reproducible-steps:: Click mirror\n"
                                  "  rating:: 5")
                             content)))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest page-mirror-exports-page-property-values-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "22222222-2222-4222-8222-222222222223"
          block-uuid #uuid "22222222-2222-4222-8222-222222222224"
          conn (db-test/create-conn-with-blocks
                {:properties {:user.property/p1 {:logseq.property/type :default}
                              :user.property/p2 {:logseq.property/type :number}
                              :user.property/p3 {:logseq.property/type :default}}
                 :pages-and-blocks [{:page {:block/title "Page Props"
                                             :block/uuid page-uuid
                                             :build/properties {:user.property/p1 "hello"
                                                                :user.property/p2 1
                                                                :user.property/p3 "Author 1"}}
                                     :blocks [{:block/title "body"
                                               :block/uuid block-uuid}]}]})
          page (db-test/find-page-by-title @conn "Page Props")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (let [content (get @files (page-path "pages/Page Props.md"))]
                      (is (= (str (page-marker page-uuid) "\n"
                                  "p1:: hello\n"
                                  "p2:: 1\n"
                                  "p3:: Author 1\n\n"
                                  (block-line block-uuid "body"))
                             content)))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest journal-mirror-exports-page-and-block-property-values-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "44444444-4444-4444-8444-444444444441"
          block-uuid #uuid "44444444-4444-4444-8444-444444444442"
          conn (db-test/create-conn-with-blocks
                {:properties {:user.property/p1 {:logseq.property/type :default}
                              :user.property/p2 {:logseq.property/type :number}
                              :user.property/p3 {:logseq.property/type :default}}
                 :pages-and-blocks [{:page {:block/title "May 5th, 2026"
                                             :block/name "may 5th, 2026"
                                             :block/uuid page-uuid
                                             :block/journal-day 20260505
                                             :block/tags #{:logseq.class/Journal}
                                             :build/properties {:user.property/p1 "hey"}}
                                     :blocks [{:block/title "TODO hello great test"
                                               :block/uuid block-uuid
                                               :build/properties {:logseq.property/status :logseq.property/status.todo
                                                                  :user.property/p1 "hello"
                                                                  :user.property/p2 1
                                                                  :user.property/p3 "Author 1"}}]}]})
          journal (db-test/find-journal-by-journal-day @conn 20260505)]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id journal) {:platform platform})
          (p/then (fn [_]
                    (let [content (get @files (page-path "journals/2026_05_05.md"))]
                      (is (= (str (page-marker page-uuid) "\n"
                                  "p1:: hey\n\n"
                                  "- TODO hello great test\n"
                                  "  p1:: hello\n"
                                  "  p2:: 1\n"
                                  "  p3:: Author 1")
                             content)))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest page-mirror-exports-block-tags-and-task-status-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "44444444-4444-4444-8444-444444444451"
          block-uuid #uuid "44444444-4444-4444-8444-444444444452"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Tagged Tasks"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "ship it"
                                               :block/uuid block-uuid
                                               :build/tags [:tag-alpha :logseq.class/Task]
                                               :build/properties {:logseq.property/status :logseq.property/status.todo}}]}]})
          page (db-test/find-page-by-title @conn "Tagged Tasks")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (is (= (str (page-marker page-uuid) "\n\n"
                                "- TODO ship it #tag-alpha")
                           (get @files (page-path "pages/Tagged Tasks.md"))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-rendered-block-tags-and-task-status-roundtrip-without-title-noise-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "44444444-4444-4444-8444-444444444453"
          block-uuid #uuid "44444444-4444-4444-8444-444444444454"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Tagged Task Roundtrip"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "ship it"
                                               :block/uuid block-uuid
                                               :build/tags [:tag-alpha :logseq.class/Task]
                                               :build/properties {:logseq.property/status :logseq.property/status.todo}}]}]})
          page (db-test/find-page-by-title @conn "Tagged Task Roundtrip")
          relative-path "pages/Tagged Task Roundtrip.md"
          storage-path (page-path relative-path)]
      (-> (p/let [_ (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
                  content (get @files storage-path)
                  result (markdown-mirror/<import-file-content! test-repo conn relative-path content {:platform platform})]
            (is (= :skipped (:status result)))
            (is (= "ship it" (:block/title (d/entity @conn [:block/uuid block-uuid]))))
            (is (= :logseq.property/status.todo (block-status-ident @conn block-uuid)))
            (is (contains? (block-tag-idents @conn block-uuid) :user.class/tag-alpha))
            (is (contains? (block-tag-idents @conn block-uuid) :logseq.class/Task)))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest full-regeneration-writes-existing-non-built-in-non-property-pages-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "55555555-5555-4555-8555-555555555551"
          page-block-uuid #uuid "55555555-5555-4555-8555-555555555552"
          journal-uuid #uuid "55555555-5555-4555-8555-555555555553"
          journal-block-uuid #uuid "55555555-5555-4555-8555-555555555554"
          class-uuid #uuid "55555555-5555-4555-8555-555555555555"
          class-block-uuid #uuid "55555555-5555-4555-8555-555555555556"
          conn (db-test/create-conn-with-blocks
                {:properties {:rating {:logseq.property/type :default}}
                 :pages-and-blocks [{:page {:block/title "Page A"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "alpha"
                                               :block/uuid page-block-uuid}]}
                                    {:page {:block/title "Journal"
                                            :block/uuid journal-uuid
                                            :block/journal-day 20240508
                                            :block/tags #{:logseq.class/Journal}}
                                     :blocks [{:block/title "journal"
                                               :block/uuid journal-block-uuid}]}
                                    {:page {:block/title "Built In"
                                            :build/properties {:logseq.property/built-in? true}}
                                     :blocks [{:block/title "system"}]}
                                    {:page {:block/title "Project"
                                            :block/uuid class-uuid
                                            :block/tags #{:logseq.class/Tag}
                                            :db/ident :user.class/Project}
                                     :blocks [{:block/title "class"
                                               :block/uuid class-block-uuid}]}
                                    {:page {:block/title "rating"
                                            :block/tags #{:logseq.class/Property}
                                            :db/ident :user.property/rating}
                                     :blocks [{:block/title "property"}]}]})]
      (-> (<mirror-repo! test-repo @conn {:platform platform})
          (p/then (fn [result]
                    (is (not= ::missing-mirror-repo-fn result))
                    (is (= (str (page-marker page-uuid) "\n\n"
                                (block-line page-block-uuid "alpha"))
                           (get @files (page-path "pages/Page A.md"))))
                    (is (= (str (page-marker journal-uuid) "\n\n"
                                (block-line journal-block-uuid "journal"))
                           (get @files (page-path "journals/2024_05_08.md"))))
                    (is (= (str (page-marker class-uuid) "\n\n"
                                (block-line class-block-uuid "class"))
                           (get @files (page-path "pages/Project.md"))))
                    (is (nil? (get @files (page-path "pages/Built In.md"))))
                    (is (nil? (get @files (page-path "pages/rating.md"))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest electron-browser-worker-runtime-is-supported-test
  (async done
    (let [{:keys [platform files]} (fake-platform {:runtime :browser
                                                   :owner-source :electron})
          page-uuid #uuid "88888888-8888-4888-8888-888888888888"
          block-uuid #uuid "88888888-8888-4888-8888-888888888889"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Page A"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "desktop"
                                               :block/uuid block-uuid}]}]})
          page (db-test/find-page-by-title @conn "Page A")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (is (= (str (page-marker page-uuid) "\n\n"
                                (block-line block-uuid "desktop"))
                           (get @files (page-path "pages/Page A.md"))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest non-electron-browser-runtime-is-skipped-test
  (async done
    (let [{:keys [platform writes]} (fake-platform {:runtime :browser
                                                    :owner-source :browser})
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Page A"}
                                     :blocks [{:block/title "web"}]}]})
          page (db-test/find-page-by-title @conn "Page A")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [result]
                    (is (= :skipped (:status result)))
                    (is (= :unsupported-runtime (:reason result)))
                    (is (empty? @writes))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest enabled-electron-edit-writes-journal-mirror-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "77777777-7777-4777-8777-777777777771"
          block-uuid #uuid "77777777-7777-4777-8777-777777777772"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:build/journal 20240506
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "journal item"
                                               :block/uuid block-uuid}]}]})
          journal (db-test/find-journal-by-journal-day @conn 20240506)]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id journal) {:platform platform})
          (p/then (fn [_]
                    (is (= (str (page-marker page-uuid) "\n\n"
                                (block-line block-uuid "journal item"))
                           (get @files (page-path "journals/2024_05_06.md"))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest generated-journal-mirror-file-imports-back-into-db-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "77777777-7777-4777-8777-777777777773"
          block-uuid #uuid "77777777-7777-4777-8777-777777777774"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:build/journal 20240507
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "before"
                                               :block/uuid block-uuid}]}]})
          journal (db-test/find-journal-by-journal-day @conn 20240507)
          relative-path "journals/2024_05_07.md"
          storage-path (page-path relative-path)]
      (-> (p/let [_ (markdown-mirror/<mirror-page! test-repo @conn (:db/id journal) {:platform platform})
                  generated (get @files storage-path)
                  _ (swap! files assoc storage-path (string/replace generated "- before" "- after"))
                  result (markdown-mirror/<handle-file-event! test-repo conn {:type :changed
                                                                              :relative-path relative-path}
                                                              {:platform platform})]
            (is (string/includes? generated (page-marker page-uuid)))
            (is (not (string/includes? generated "  id:: ")))
            (is (= :imported (:status result)))
            (is (= "after" (:block/title (d/entity @conn [:block/uuid block-uuid])))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest disabled-setting-does-not-write-mirror-test
  (async done
    (let [{:keys [platform writes]} (fake-platform)
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Page A"}
                                     :blocks [{:block/title "before"}]}]})
          page (db-test/find-page-by-title @conn "Page A")
          block (first-block page)
          tx-report (d/with @conn [{:db/id (:db/id block)
                                    :block/title "after"}])]
      (markdown-mirror/set-enabled! test-repo false)
      (-> (markdown-mirror/<handle-tx-report! test-repo conn tx-report {:platform platform})
          (p/then (fn [_]
                    (is (empty? @writes))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest db-listener-transact-writes-updated-page-mirror-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "33333333-3333-4333-8333-333333333334"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Page A"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "before"}]}]})
          page (db-test/find-page-by-title @conn "Page A")
          block (first-block page)]
      (markdown-mirror/set-enabled! test-repo true)
      (db-listener/listen-db-changes! test-repo conn :handler-keys [:markdown-mirror])
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (with-redefs [worker-platform/current (constantly platform)]
                      (ldb/transact! conn [{:db/id (:db/id block)
                                            :block/title "after"}] {:outliner-op :save-block}))
                    (markdown-mirror/<flush-repo! test-repo {:platform platform})))
          (p/then (fn [_]
                    (is (= (str (page-marker page-uuid) "\n\n- after")
                           (get @files (page-path "pages/Page A.md"))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest disabling-setting-drops-queued-mirror-work-test
  (async done
    (let [{:keys [platform writes]} (fake-platform)
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Page A"}
                                     :blocks [{:block/title "before"}]}]})
          page (db-test/find-page-by-title @conn "Page A")
          block (first-block page)
          tx-report (d/with @conn [{:db/id (:db/id block)
                                    :block/title "after"}])]
      (markdown-mirror/set-enabled! test-repo true)
      (-> (p/let [_ (markdown-mirror/<handle-tx-report! test-repo conn tx-report {:platform platform
                                                                                   :defer? true})
                  _ (markdown-mirror/set-enabled! test-repo false)
                  _ (markdown-mirror/<flush-repo! test-repo {:platform platform})]
            (is (empty? @writes)))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest repeated-edits-coalesce-to-latest-content-test
  (async done
    (let [{:keys [platform writes]} (fake-platform)
          page-uuid #uuid "44444444-4444-4444-8444-444444444444"
          block-uuid #uuid "44444444-4444-4444-8444-444444444445"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Page A"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "before"
                                               :block/uuid block-uuid}]}]})
          page (db-test/find-page-by-title @conn "Page A")
          block (first-block page)
          tx-report-1 (d/with @conn [{:db/id (:db/id block)
                                      :block/title "middle"}])
          _ (d/reset-conn! conn (:db-after tx-report-1))
          tx-report-2 (d/with @conn [{:db/id (:db/id block)
                                      :block/title "latest"}])]
      (markdown-mirror/set-enabled! test-repo true)
      (-> (p/let [_ (markdown-mirror/<handle-tx-report! test-repo conn tx-report-1 {:platform platform
                                                                                     :defer? true})
                  _ (markdown-mirror/<handle-tx-report! test-repo conn tx-report-2 {:platform platform
                                                                                     :defer? true})
                  _ (markdown-mirror/<flush-repo! test-repo {:platform platform})]
            (is (= [[(page-path "pages/Page A.md")
                     (str (page-marker page-uuid) "\n\n"
                          (block-line block-uuid "latest"))]]
                   (markdown-writes writes))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest file-origin-tx-does-not-rewrite-edited-mirror-file-test
  (async done
    (let [{:keys [platform files writes]} (fake-platform)
          page-uuid #uuid "22222222-2222-4222-8222-222222222251"
          block-uuid #uuid "22222222-2222-4222-8222-222222222252"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "File Origin Quiet"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "before"
                                               :block/uuid block-uuid}]}]})
          path (page-path "pages/File Origin Quiet.md")
          edited-content (str (page-marker page-uuid) "\n\n- after")
          block (d/entity @conn [:block/uuid block-uuid])
          tx-report (d/with @conn [{:db/id (:db/id block)
                                    :block/title "after"}])
          tx-report' (assoc tx-report :tx-meta {:markdown-mirror/source :file
                                                 :markdown-mirror/path "pages/File Origin Quiet.md"})]
      (markdown-mirror/set-enabled! test-repo true)
      (swap! files assoc path edited-content)
      (-> (markdown-mirror/<handle-tx-report! test-repo conn tx-report' {:platform platform})
          (p/then (fn [result]
                    (is (= :skipped (:status result)))
                    (is (= edited-content (get @files path)))
                    (is (empty? (markdown-writes writes)))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest referenced-page-rename-updates-referrer-mirror-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          target-uuid #uuid "22222222-2222-4222-8222-222222222241"
          referrer-uuid #uuid "22222222-2222-4222-8222-222222222242"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Source"}
                                     :blocks [{:block/title (str "See [[" target-uuid "]]")
                                               :block/uuid referrer-uuid}]}
                                    {:page {:block/title "Old Target"
                                             :block/name "old target"
                                             :block/uuid target-uuid}
                                     :blocks []}]})
          source (db-test/find-page-by-title @conn "Source")
          target (db-test/find-page-by-title @conn "Old Target")
          referrer (d/entity @conn [:block/uuid referrer-uuid])
          source-path (page-path "pages/Source.md")
          _ (d/transact! conn [[:db/add (:db/id referrer) :block/refs (:db/id target)]])]
      (markdown-mirror/set-enabled! test-repo true)
      (-> (p/let [_ (markdown-mirror/<mirror-page! test-repo @conn (:db/id source) {:platform platform})
                  _ (is (string/includes? (get @files source-path) "[[Old Target]]"))
                  tx-report (d/with @conn [{:db/id (:db/id target)
                                            :block/title "New Target"
                                            :block/name "new target"}])
                  _ (markdown-mirror/<handle-tx-report! test-repo conn tx-report {:platform platform})]
            (is (string/includes? (get @files source-path) "[[New Target]]")))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest rename-removes-old-mirror-path-test
  (async done
    (let [{:keys [platform files deletes]} (fake-platform)
          page-uuid #uuid "55555555-5555-4555-8555-555555555555"
          block-uuid #uuid "55555555-5555-4555-8555-555555555557"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Old Name"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "body"
                                               :block/uuid block-uuid}]}]})
          page (db-test/find-page-by-title @conn "Old Name")
          old-path (page-path "pages/Old Name.md")
          _ (swap! files assoc old-path "- body")
          tx-report (d/with @conn [{:db/id (:db/id page)
                                    :block/title "New Name"
                                    :block/name "new name"}])
          _ (d/reset-conn! conn (:db-after tx-report))]
      (markdown-mirror/set-enabled! test-repo true)
      (-> (markdown-mirror/<handle-tx-report! test-repo conn tx-report {:platform platform})
          (p/then (fn [_]
                    (is (= [old-path] @deletes))
                    (is (= (str (page-marker page-uuid) "\n\n"
                                (block-line block-uuid "body"))
                           (get @files (page-path "pages/New Name.md"))))
                    (is (nil? (get @files old-path)))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest rename-with-unchanged-content-removes-old-mirror-path-test
  (async done
    (let [{:keys [platform files deletes]} (fake-platform)
          page-uuid #uuid "55555555-5555-4555-8555-555555555556"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Old Name2"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "body"}]}]})
          page (db-test/find-page-by-title @conn "Old Name2")
          old-path (page-path "pages/Old Name2.md")
          new-path (page-path "pages/New Name2.md")
          ;; pre-populate both old and new paths with same content
          _ (swap! files assoc old-path "- body")
          _ (swap! files assoc new-path "- body")
          tx-report (d/with @conn [{:db/id (:db/id page)
                                    :block/title "New Name2"
                                    :block/name "new name2"}])
          _ (d/reset-conn! conn (:db-after tx-report))]
      (markdown-mirror/set-enabled! test-repo true)
      (-> (markdown-mirror/<handle-tx-report! test-repo conn tx-report {:platform platform})
          (p/then (fn [_]
                    ;; old-path must be cleaned up even though new-path was unchanged
                    (is (= [old-path] @deletes))
                    (is (nil? (get @files old-path)))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest delete-removes-mirror-file-test
  (async done
    (let [{:keys [platform files deletes writes]} (fake-platform)
          page-uuid #uuid "66666666-6666-4666-8666-666666666666"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Delete Me"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "body"}]}]})
          page (db-test/find-page-by-title @conn "Delete Me")
          old-path (page-path "pages/Delete Me.md")
          _ (swap! files assoc old-path "- body")
          tx-report (d/with @conn [[:db/retractEntity (:db/id page)]])
          _ (d/reset-conn! conn (:db-after tx-report))]
      (markdown-mirror/set-enabled! test-repo true)
      (-> (markdown-mirror/<handle-tx-report! test-repo conn tx-report {:platform platform})
          (p/then (fn [_]
                    (is (= [old-path] @deletes))
                    (is (empty? @writes))
                    (is (nil? (get @files old-path)))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest unchanged-generated-content-skips-write-test
  (async done
    (let [{:keys [platform files writes]} (fake-platform)
          page-uuid #uuid "77777777-7777-4777-8777-777777777777"
          block-uuid #uuid "77777777-7777-4777-8777-777777777778"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Page A"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "same"
                                               :block/uuid block-uuid}]}]})
          page (db-test/find-page-by-title @conn "Page A")
          path (page-path "pages/Page A.md")
          content (str (page-marker page-uuid) "\n\n"
                       (block-line block-uuid "same"))
          _ (swap! files assoc path content)]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (is (empty? (markdown-writes writes)))
                    (is (string? (get @files (sidecar-page-path page-uuid))))
                    (is (= content (get @files path)))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest windows-reserved-journal-filename-fails-with-diagnostic-test
  (async done
    (let [{:keys [platform writes]} (fake-platform)
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "CON"
                                             :block/name "con"
                                             :block/journal-day 20240507
                                             :block/tags #{:logseq.class/Journal}}
                                     :blocks [{:block/title "journal"}]}]})
          journal (db-test/find-journal-by-journal-day @conn 20240507)]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id journal) {:platform platform
                                                                           :journal-file-stem-fn (constantly "CON")})
          (p/then (fn [result]
                    (is (= :error (:status result)))
                    (is (= :invalid-file-name (:reason result)))
                    (is (empty? @writes))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest duplicate-journal-day-fails-without-overwrite-test
  (async done
    (let [{:keys [platform writes]} (fake-platform)
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "May 7th, 2024"
                                             :block/name "may 7th, 2024"
                                             :block/journal-day 20240507
                                             :block/tags #{:logseq.class/Journal}}
                                     :blocks [{:block/title "first"}]}
                                    {:page {:block/title "May 07, 2024"
                                             :block/name "may 07, 2024"
                                             :block/journal-day 20240507
                                             :block/tags #{:logseq.class/Journal}}
                                     :blocks [{:block/title "second"}]}]})
          journal (db-test/find-journal-by-journal-day @conn 20240507)]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id journal) {:platform platform})
          (p/then (fn [result]
                    (is (= :error (:status result)))
                    (is (= :duplicate-journal-day (:reason result)))
                    (is (empty? @writes))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-file-edit-transacts-local-db-test
  (async done
    (let [page-uuid #uuid "99999999-9999-4999-8999-999999999999"
          block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Import Page"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "before"
                                               :block/uuid block-uuid}]}]})
          relative-path "pages/Import Page.md"
          content (str (page-marker page-uuid) "\n"
                       "- after")]
      (-> (markdown-mirror/<import-file-content! test-repo conn relative-path content {})
          (p/then (fn [result]
                    (is (= :imported (:status result)))
                    (is (= "after" (:block/title (d/entity @conn [:block/uuid block-uuid]))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-task-status-marker-updates-block-status-test
  (async done
    (let [page-uuid #uuid "99999999-9999-4999-8999-99999999996e"
          block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaae5"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Task Status Import"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "before"
                                               :block/uuid block-uuid}]}]})
          content (str (page-marker page-uuid) "\n"
                       "- DONE finish")]
      (-> (markdown-mirror/<import-file-content! test-repo conn "pages/Task Status Import.md" content {})
          (p/then (fn [result]
                    (is (= :imported (:status result)))
                    (is (= "finish" (:block/title (d/entity @conn [:block/uuid block-uuid]))))
                    (is (= :logseq.property/status.done (block-status-ident @conn block-uuid)))
                    (is (contains? (block-tag-idents @conn block-uuid) :logseq.class/Task))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-removing-task-status-marker-clears-block-status-test
  (async done
    (let [page-uuid #uuid "99999999-9999-4999-8999-99999999996c"
          block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaae8"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Task Status Removal"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "finish"
                                               :block/uuid block-uuid
                                               :build/tags [:logseq.class/Task]
                                               :build/properties {:logseq.property/status :logseq.property/status.todo}}]}]})
          content (str (page-marker page-uuid) "\n"
                       "- finish")]
      (-> (markdown-mirror/<import-file-content! test-repo conn "pages/Task Status Removal.md" content {})
          (p/then (fn [result]
                    (is (= :imported (:status result)))
                    (is (= "finish" (:block/title (d/entity @conn [:block/uuid block-uuid]))))
                    (is (nil? (block-status-ident @conn block-uuid)))
                    (is (not (contains? (block-tag-idents @conn block-uuid) :logseq.class/Task)))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-custom-task-status-marker-updates-block-status-test
  (async done
    (let [page-uuid #uuid "99999999-9999-4999-8999-99999999996d"
          block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaae6"
          status-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaae7"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Custom Status Import"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "before"
                                               :block/uuid block-uuid}]}]})
          status-property (d/entity @conn :logseq.property/status)
          _ (d/transact! conn [{:db/ident :logseq.property/status.blocked
                                :block/uuid status-uuid
                                :block/page :logseq.property/status
                                :block/parent :logseq.property/status
                                :block/title "Blocked"
                                :logseq.property/created-from-property :logseq.property/status
                                :block/closed-value-property (:db/id status-property)
                                :block/order "zz"}])
          content (str (page-marker page-uuid) "\n"
                       "- BLOCKED wait on review")]
      (-> (markdown-mirror/<import-file-content! test-repo conn "pages/Custom Status Import.md" content {})
          (p/then (fn [result]
                    (is (= :imported (:status result)))
                    (is (= "wait on review" (:block/title (d/entity @conn [:block/uuid block-uuid]))))
                    (is (= :logseq.property/status.blocked (block-status-ident @conn block-uuid)))
                    (is (contains? (block-tag-idents @conn block-uuid) :logseq.class/Task))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-unmarked-block-edit-keeps-existing-block-identity-test
  (async done
    (let [page-uuid #uuid "99999999-9999-4999-8999-999999999994"
          block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaab1"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Unmarked Edit"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "before"
                                               :block/uuid block-uuid}]}]})
          content (str (page-marker page-uuid) "\n"
                       "- after")]
      (-> (markdown-mirror/<import-file-content! test-repo conn "pages/Unmarked Edit.md" content {})
          (p/then (fn [result]
                    (is (= :imported (:status result)))
                    (is (= "after" (:block/title (d/entity @conn [:block/uuid block-uuid]))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-unmarked-block-delete-keeps-surviving-block-identity-test
  (async done
    (let [page-uuid #uuid "99999999-9999-4999-8999-999999999993"
          keep-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaab2"
          delete-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaab3"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Unmarked Delete"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "keep"
                                               :block/uuid keep-uuid}
                                              {:block/title "delete"
                                               :block/uuid delete-uuid}]}]})
          content (str (page-marker page-uuid) "\n"
                       "- keep")]
      (-> (markdown-mirror/<import-file-content! test-repo conn "pages/Unmarked Delete.md" content {})
          (p/then (fn [result]
                    (is (= :imported (:status result)))
                    (is (= "keep" (:block/title (d/entity @conn [:block/uuid keep-uuid]))))
                    (is (nil? (d/entity @conn [:block/uuid delete-uuid])))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-delete-parent-block-deletes-child-block-test
  (async done
    (let [page-uuid #uuid "99999999-9999-4999-8999-999999999975"
          parent-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaad1"
          child-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaad2"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Delete Parent"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "1"
                                               :block/uuid parent-uuid
                                               :build/children [{:block/title "2"
                                                                 :block/uuid child-uuid}]}]}]})
          content (str (page-marker page-uuid) "\n")]
      (-> (markdown-mirror/<import-file-content! test-repo conn "pages/Delete Parent.md" content {})
          (p/then (fn [result]
                    (is (= :imported (:status result)))
                    (is (nil? (d/entity @conn [:block/uuid parent-uuid])))
                    (is (nil? (d/entity @conn [:block/uuid child-uuid])))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-delete-consecutive-child-blocks-from-md-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "99999999-9999-4999-8999-999999999976"
          parent-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaacb"
          child-2-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaacc"
          child-3-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaacd"
          child-4-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaace"
          child-5-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaacf"
          sibling-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaad0"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Delete Consecutive Children"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "1"
                                               :block/uuid parent-uuid
                                               :build/children [{:block/title "2"
                                                                 :block/uuid child-2-uuid}
                                                                {:block/title "3"
                                                                 :block/uuid child-3-uuid}
                                                                {:block/title "4"
                                                                 :block/uuid child-4-uuid}
                                                                {:block/title "5"
                                                                 :block/uuid child-5-uuid}]}
                                              {:block/title "6"
                                               :block/uuid sibling-uuid}]}]})
          page (db-test/find-page-by-title @conn "Delete Consecutive Children")
          relative-path "pages/Delete Consecutive Children.md"
          storage-path (page-path relative-path)
          content (str (page-marker page-uuid) "\n\n"
                       "- 1\n"
                       "  - 4\n"
                       "  - 5\n"
                       "- 6")]
      (-> (p/let [_ (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
                  _ (swap! files assoc storage-path content)
                  result (markdown-mirror/<import-file-content! test-repo conn relative-path content {:platform platform})]
            (is (= :imported (:status result)))
            (is (nil? (d/entity @conn [:block/uuid child-2-uuid])))
            (is (nil? (d/entity @conn [:block/uuid child-3-uuid])))
            (is (= ["4" "5"] (child-block-titles @conn parent-uuid)))
            (is (= ["1" "6"] (page-block-titles @conn "Delete Consecutive Children"))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-delete-parent-block-with-surviving-child-marker-is-rejected-test
  (async done
    (let [page-uuid #uuid "99999999-9999-4999-8999-999999999974"
          parent-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaad3"
          child-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaad4"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Delete Parent Reject"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "1"
                                               :block/uuid parent-uuid
                                               :build/children [{:block/title "2"
                                                                 :block/uuid child-uuid}]}]}]})
          content (str (page-marker page-uuid) "\n"
                       "  - 2")]
      (-> (markdown-mirror/<import-file-content! test-repo conn "pages/Delete Parent Reject.md" content {})
          (p/then (fn [result]
                    (is (= :error (:status result)))
                    (is (= :orphaned-block (:reason result)))
                    (is (= ["1"] (page-block-titles @conn "Delete Parent Reject")))
                    (is (= ["2"] (child-block-titles @conn parent-uuid)))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-indented-block-id-line-is-rejected-test
  (async done
    (let [page-uuid #uuid "99999999-9999-4999-8999-999999999973"
          block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaad5"
          old-id-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaad6"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Ignore Block Id"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "before"
                                               :block/uuid block-uuid}]}]})
          content (str (page-marker page-uuid) "\n"
                       "- after\n"
                       "  id:: " old-id-uuid)]
      (-> (markdown-mirror/<import-file-content! test-repo conn "pages/Ignore Block Id.md" content {})
          (p/then (fn [result]
                    (is (= :error (:status result)))
                    (is (= :block-id-marker-not-supported (:reason result)))
                    (is (= "before" (:block/title (d/entity @conn [:block/uuid block-uuid]))))
                    (is (nil? (d/entity @conn [:block/uuid old-id-uuid])))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-delete-multiple-unmarked-blocks-from-md-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "99999999-9999-4999-8999-999999999972"
          keep-a-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaad7"
          delete-a-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaad8"
          delete-b-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaad9"
          keep-b-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaada"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Delete Multiple"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "keep a"
                                               :block/uuid keep-a-uuid}
                                              {:block/title "delete a"
                                               :block/uuid delete-a-uuid}
                                              {:block/title "delete b"
                                               :block/uuid delete-b-uuid}
                                              {:block/title "keep b"
                                               :block/uuid keep-b-uuid}]}]})
          page (db-test/find-page-by-title @conn "Delete Multiple")
          relative-path "pages/Delete Multiple.md"
          storage-path (page-path relative-path)
          content (str (page-marker page-uuid) "\n\n"
                       "- keep a\n"
                       "- keep b")]
      (-> (p/let [_ (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
                  _ (swap! files assoc storage-path content)
                  result (markdown-mirror/<import-file-content! test-repo conn relative-path content {:platform platform})]
            (is (= :imported (:status result)))
            (is (some? (d/entity @conn [:block/uuid keep-a-uuid])))
            (is (some? (d/entity @conn [:block/uuid keep-b-uuid])))
            (is (nil? (d/entity @conn [:block/uuid delete-a-uuid])))
            (is (nil? (d/entity @conn [:block/uuid delete-b-uuid])))
            (is (= ["keep a" "keep b"] (page-block-titles @conn "Delete Multiple"))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-delete-multiple-unmarked-blocks-with-children-from-md-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "99999999-9999-4999-8999-999999999971"
          keep-a-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaadb"
          parent-a-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaadc"
          child-a-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaadd"
          parent-b-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaade"
          child-b-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaadf"
          keep-b-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaae0"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Delete Multiple Trees"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "keep a"
                                               :block/uuid keep-a-uuid}
                                              {:block/title "delete parent a"
                                               :block/uuid parent-a-uuid
                                               :build/children [{:block/title "delete child a"
                                                                 :block/uuid child-a-uuid}]}
                                              {:block/title "delete parent b"
                                               :block/uuid parent-b-uuid
                                               :build/children [{:block/title "delete child b"
                                                                 :block/uuid child-b-uuid}]}
                                              {:block/title "keep b"
                                               :block/uuid keep-b-uuid}]}]})
          page (db-test/find-page-by-title @conn "Delete Multiple Trees")
          relative-path "pages/Delete Multiple Trees.md"
          storage-path (page-path relative-path)
          content (str (page-marker page-uuid) "\n\n"
                       "- keep a\n"
                       "- keep b")]
      (-> (p/let [_ (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
                  _ (swap! files assoc storage-path content)
                  result (markdown-mirror/<import-file-content! test-repo conn relative-path content {:platform platform})]
            (is (= :imported (:status result)))
            (is (some? (d/entity @conn [:block/uuid keep-a-uuid])))
            (is (some? (d/entity @conn [:block/uuid keep-b-uuid])))
            (is (nil? (d/entity @conn [:block/uuid parent-a-uuid])))
            (is (nil? (d/entity @conn [:block/uuid child-a-uuid])))
            (is (nil? (d/entity @conn [:block/uuid parent-b-uuid])))
            (is (nil? (d/entity @conn [:block/uuid child-b-uuid])))
            (is (= ["keep a" "keep b"] (page-block-titles @conn "Delete Multiple Trees"))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-concat-unmarked-siblings-from-md-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "99999999-9999-4999-8999-999999999970"
          first-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaae1"
          second-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaae2"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Concat Siblings"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "alpha"
                                               :block/uuid first-uuid}
                                              {:block/title "bravo"
                                               :block/uuid second-uuid}]}]})
          page (db-test/find-page-by-title @conn "Concat Siblings")
          relative-path "pages/Concat Siblings.md"
          storage-path (page-path relative-path)
          content (str (page-marker page-uuid) "\n\n"
                       "- alpha bravo")]
      (-> (p/let [_ (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
                  _ (swap! files assoc storage-path content)
                  result (markdown-mirror/<import-file-content! test-repo conn relative-path content {:platform platform})]
            (is (= :imported (:status result)))
            (is (= "alpha bravo" (:block/title (d/entity @conn [:block/uuid first-uuid]))))
            (is (nil? (d/entity @conn [:block/uuid second-uuid])))
            (is (= ["alpha bravo"] (page-block-titles @conn "Concat Siblings"))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-concat-unmarked-parent-and-child-from-md-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "99999999-9999-4999-8999-99999999996f"
          parent-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaae3"
          child-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaae4"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Concat Parent Child"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "parent"
                                               :block/uuid parent-uuid
                                               :build/children [{:block/title "child"
                                                                 :block/uuid child-uuid}]}]}]})
          page (db-test/find-page-by-title @conn "Concat Parent Child")
          relative-path "pages/Concat Parent Child.md"
          storage-path (page-path relative-path)
          content (str (page-marker page-uuid) "\n\n"
                       "- parent child")]
      (-> (p/let [_ (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
                  _ (swap! files assoc storage-path content)
                  result (markdown-mirror/<import-file-content! test-repo conn relative-path content {:platform platform})]
            (is (= :imported (:status result)))
            (is (= "parent child" (:block/title (d/entity @conn [:block/uuid parent-uuid]))))
            (is (nil? (d/entity @conn [:block/uuid child-uuid])))
            (is (= ["parent child"] (page-block-titles @conn "Concat Parent Child"))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-unmarked-block-insert-keeps-existing-block-identity-test
  (async done
    (let [page-uuid #uuid "99999999-9999-4999-8999-999999999992"
          block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaab4"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Unmarked Insert"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "existing"
                                               :block/uuid block-uuid}]}]})
          content (str (page-marker page-uuid) "\n"
                       "- existing\n"
                       "- inserted")]
      (-> (markdown-mirror/<import-file-content! test-repo conn "pages/Unmarked Insert.md" content {})
          (p/then (fn [result]
                    (is (= :imported (:status result)))
                    (is (= "existing" (:block/title (d/entity @conn [:block/uuid block-uuid]))))
                    (is (some? (block-by-title @conn "inserted")))
                    (is (= ["existing" "inserted"]
                           (page-block-titles @conn "Unmarked Insert")))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-unmarked-block-insert-before-existing-preserves-sync-identity-test
  (async done
    (let [page-uuid #uuid "99999999-9999-4999-8999-999999999991"
          block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaab5"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Unmarked Insert Before"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "existing"
                                               :block/uuid block-uuid}]}]})
          content (str (page-marker page-uuid) "\n"
                       "- inserted\n"
                       "- existing")]
      (-> (markdown-mirror/<import-file-content! test-repo conn "pages/Unmarked Insert Before.md" content {})
          (p/then (fn [result]
                    (is (= :imported (:status result)))
                    (is (= "existing" (:block/title (d/entity @conn [:block/uuid block-uuid]))))
                    (is (some? (block-by-title @conn "inserted")))
                    (is (= ["inserted" "existing"]
                           (page-block-titles @conn "Unmarked Insert Before")))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-sidecar-preserves-edited-block-identity-when-inserting-before-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "99999999-9999-4999-8999-999999999981"
          a-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaac1"
          b-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaac2"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Sidecar Insert Edit"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "alpha"
                                               :block/uuid a-uuid}
                                              {:block/title "bravo"
                                               :block/uuid b-uuid}]}]})
          page (db-test/find-page-by-title @conn "Sidecar Insert Edit")
          relative-path "pages/Sidecar Insert Edit.md"
          storage-path (page-path relative-path)]
      (-> (p/let [_ (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
                  _ (is (string? (get @files (sidecar-page-path page-uuid))))
                  _ (swap! files assoc storage-path
                           (str (page-marker page-uuid) "\n\n"
                                "- inserted\n"
                                "- alpha edited\n"
                                "- bravo"))
                  result (markdown-mirror/<import-file-content! test-repo conn relative-path (get @files storage-path) {:platform platform})]
            (is (= :imported (:status result)))
            (is (= "alpha edited" (:block/title (d/entity @conn [:block/uuid a-uuid]))))
            (is (= "bravo" (:block/title (d/entity @conn [:block/uuid b-uuid]))))
            (is (= ["inserted" "alpha edited" "bravo"]
                   (page-block-titles @conn "Sidecar Insert Edit"))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-sidecar-duplicates-selected-sibling-blocks-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "99999999-9999-4999-8999-99999999997e"
          one-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaf1"
          two-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaf2"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Duplicate Siblings"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "1"
                                               :block/uuid one-uuid}
                                              {:block/title "2"
                                               :block/uuid two-uuid}]}]})
          page (db-test/find-page-by-title @conn "Duplicate Siblings")
          relative-path "pages/Duplicate Siblings.md"
          storage-path (page-path relative-path)]
      (-> (p/let [_ (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
                  _ (swap! files assoc storage-path
                           (str (page-marker page-uuid) "\n\n"
                                "- 1\n"
                                "- 2\n"
                                "- 1\n"
                                "- 2"))
                  result (markdown-mirror/<import-file-content! test-repo conn relative-path (get @files storage-path) {:platform platform})]
            (is (= :imported (:status result)))
            (is (= "1" (:block/title (d/entity @conn [:block/uuid one-uuid]))))
            (is (= "2" (:block/title (d/entity @conn [:block/uuid two-uuid]))))
            (is (= ["1" "2" "1" "2"]
                   (page-block-titles @conn "Duplicate Siblings")))
            (is (= 4 (count (page-block-titles @conn "Duplicate Siblings")))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-sidecar-deletes-bottom-duplicate-block-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "99999999-9999-4999-8999-99999999997d"
          top-one-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaf3"
          top-two-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaf4"
          bottom-one-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaf5"
          bottom-two-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaf6"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Delete Bottom Duplicate"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "1"
                                               :block/uuid top-one-uuid}
                                              {:block/title "2"
                                               :block/uuid top-two-uuid}
                                              {:block/title "1"
                                               :block/uuid bottom-one-uuid}
                                              {:block/title "2"
                                               :block/uuid bottom-two-uuid}]}]})
          page (db-test/find-page-by-title @conn "Delete Bottom Duplicate")
          relative-path "pages/Delete Bottom Duplicate.md"
          storage-path (page-path relative-path)]
      (-> (p/let [_ (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
                  _ (swap! files assoc storage-path
                           (str (page-marker page-uuid) "\n\n"
                                "- 1\n"
                                "- 2\n"
                                "- 2"))
                  result (markdown-mirror/<import-file-content! test-repo conn relative-path (get @files storage-path) {:platform platform})]
            (is (= :imported (:status result)))
            (is (some? (d/entity @conn [:block/uuid top-one-uuid])))
            (is (some? (d/entity @conn [:block/uuid top-two-uuid])))
            (is (nil? (d/entity @conn [:block/uuid bottom-one-uuid])))
            (is (some? (d/entity @conn [:block/uuid bottom-two-uuid])))
            (is (= ["1" "2" "2"]
                   (page-block-titles @conn "Delete Bottom Duplicate"))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-sidecar-deletes-bottom-duplicate-block-pair-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "99999999-9999-4999-8999-99999999997c"
          top-one-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaf7"
          top-two-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaf8"
          bottom-one-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaf9"
          bottom-two-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaafa"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Delete Bottom Duplicate Pair"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "1"
                                               :block/uuid top-one-uuid}
                                              {:block/title "2"
                                               :block/uuid top-two-uuid}
                                              {:block/title "1"
                                               :block/uuid bottom-one-uuid}
                                              {:block/title "2"
                                               :block/uuid bottom-two-uuid}]}]})
          page (db-test/find-page-by-title @conn "Delete Bottom Duplicate Pair")
          relative-path "pages/Delete Bottom Duplicate Pair.md"
          storage-path (page-path relative-path)]
      (-> (p/let [_ (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
                  _ (swap! files assoc storage-path
                           (str (page-marker page-uuid) "\n\n"
                                "- 1\n"
                                "- 2"))
                  result (markdown-mirror/<import-file-content! test-repo conn relative-path (get @files storage-path) {:platform platform})]
            (is (= :imported (:status result)))
            (is (some? (d/entity @conn [:block/uuid top-one-uuid])))
            (is (some? (d/entity @conn [:block/uuid top-two-uuid])))
            (is (nil? (d/entity @conn [:block/uuid bottom-one-uuid])))
            (is (nil? (d/entity @conn [:block/uuid bottom-two-uuid])))
            (is (= ["1" "2"]
                   (page-block-titles @conn "Delete Bottom Duplicate Pair"))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-sidecar-adds-block-after-duplicate-import-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "99999999-9999-4999-8999-99999999997b"
          one-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaafb"
          two-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaafc"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Duplicate Then Add"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "1"
                                               :block/uuid one-uuid}
                                              {:block/title "2"
                                               :block/uuid two-uuid}]}]})
          page (db-test/find-page-by-title @conn "Duplicate Then Add")
          relative-path "pages/Duplicate Then Add.md"
          storage-path (page-path relative-path)]
      (-> (p/let [_ (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
                  _ (swap! files assoc storage-path
                           (str (page-marker page-uuid) "\n\n"
                                "- 1\n"
                                "- 2\n"
                                "- 1\n"
                                "- 2"))
                  duplicate-result (markdown-mirror/<import-file-content! test-repo conn relative-path (get @files storage-path) {:platform platform})
                  _ (swap! files assoc storage-path
                           (str (page-marker page-uuid) "\n\n"
                                "- 1\n"
                                "- 2\n"
                                "- 1\n"
                                "- 2\n"
                                "- 3"))
                  add-result (markdown-mirror/<import-file-content! test-repo conn relative-path (get @files storage-path) {:platform platform})]
            (is (= :imported (:status duplicate-result)))
            (is (= :imported (:status add-result)))
            (is (= ["1" "2" "1" "2" "3"]
                   (page-block-titles @conn "Duplicate Then Add"))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-sidecar-adds-task-marker-after-duplicate-import-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "99999999-9999-4999-8999-99999999997a"
          one-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaafd"
          two-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaafe"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Duplicate Then Todo"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "1"
                                               :block/uuid one-uuid}
                                              {:block/title "2"
                                               :block/uuid two-uuid}]}]})
          page (db-test/find-page-by-title @conn "Duplicate Then Todo")
          relative-path "pages/Duplicate Then Todo.md"
          storage-path (page-path relative-path)]
      (-> (p/let [_ (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
                  _ (swap! files assoc storage-path
                           (str (page-marker page-uuid) "\n\n"
                                "- 1\n"
                                "- 2\n"
                                "- 1\n"
                                "- 2"))
                  duplicate-result (markdown-mirror/<import-file-content! test-repo conn relative-path (get @files storage-path) {:platform platform})
                  _ (swap! files assoc storage-path
                           (str (page-marker page-uuid) "\n\n"
                                "- 1\n"
                                "- 2\n"
                                "- 1\n"
                                "- TODO 2"))
                  todo-result (markdown-mirror/<import-file-content! test-repo conn relative-path (get @files storage-path) {:platform platform})
                  blocks (sort-by :block/order (:block/_parent (db-test/find-page-by-title @conn "Duplicate Then Todo")))
                  bottom-two (last blocks)]
            (is (= :imported (:status duplicate-result)))
            (is (= :imported (:status todo-result)))
            (is (= ["1" "2" "1" "2"]
                   (page-block-titles @conn "Duplicate Then Todo")))
            (is (= :logseq.property/status.todo (block-status-ident @conn (:block/uuid bottom-two))))
            (is (contains? (block-tag-idents @conn (:block/uuid bottom-two)) :logseq.class/Task)))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-sidecar-imports-one-space-indented-new-child-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "99999999-9999-4999-8999-999999999982"
          block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaac5"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Sidecar One Space Child"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "block"
                                               :block/uuid block-uuid}]}]})
          page (db-test/find-page-by-title @conn "Sidecar One Space Child")
          relative-path "pages/Sidecar One Space Child.md"
          storage-path (page-path relative-path)]
      (-> (p/let [_ (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
                  _ (swap! files assoc storage-path
                           (str (page-marker page-uuid) "\n\n"
                                "- block\n"
                                " - child"))
                  result (markdown-mirror/<import-file-content! test-repo conn relative-path (get @files storage-path) {:platform platform})]
            (is (= :imported (:status result)))
            (is (= ["block"] (page-block-titles @conn "Sidecar One Space Child")))
            (is (= ["child"] (child-block-titles @conn block-uuid))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-sidecar-keeps-existing-one-space-indented-child-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "99999999-9999-4999-8999-999999999985"
          block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaac9"
          child-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaca"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Sidecar Existing One Space Child"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "block"
                                               :block/uuid block-uuid
                                               :build/children [{:block/title "child"
                                                                 :block/uuid child-uuid}]}]}]})
          page (db-test/find-page-by-title @conn "Sidecar Existing One Space Child")
          relative-path "pages/Sidecar Existing One Space Child.md"
          storage-path (page-path relative-path)]
      (-> (p/let [_ (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
                  _ (swap! files assoc storage-path
                           (str (page-marker page-uuid) "\n\n"
                                "- block\n"
                                " - child"))
                  result (markdown-mirror/<import-file-content! test-repo conn relative-path (get @files storage-path) {:platform platform})]
            (is (contains? #{:imported :skipped} (:status result)))
            (is (= ["block"] (page-block-titles @conn "Sidecar Existing One Space Child")))
            (is (= ["child"] (child-block-titles @conn block-uuid)))
            (is (= "child" (:block/title (d/entity @conn [:block/uuid child-uuid])))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-sidecar-rejects-ambiguous-unmarked-duplicate-edit-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "99999999-9999-4999-8999-999999999980"
          block-uuid-1 #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaac3"
          block-uuid-2 #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaac4"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Sidecar Ambiguous"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "same"
                                               :block/uuid block-uuid-1}
                                              {:block/title "same"
                                               :block/uuid block-uuid-2}]}]})
          page (db-test/find-page-by-title @conn "Sidecar Ambiguous")
          relative-path "pages/Sidecar Ambiguous.md"
          storage-path (page-path relative-path)]
      (-> (p/let [_ (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
                  _ (is (string? (get @files (sidecar-page-path page-uuid))))
                  _ (swap! files assoc storage-path
                           (str (page-marker page-uuid) "\n\n"
                                "- same edited\n"
                                "- same"))
                  result (markdown-mirror/<import-file-content! test-repo conn relative-path (get @files storage-path) {:platform platform})]
            (is (= :error (:status result)))
            (is (= :ambiguous-unmarked-blocks (:reason result)))
            (is (= ["same" "same"]
                   (page-block-titles @conn "Sidecar Ambiguous"))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-sidecar-matches-regenerated-markdown-after-file-edits-test
  (async done
    (let [cases (mapv
                 (fn [{:keys [case-id initial edited expected]}]
                   {:case-id case-id
                    :initial-blocks initial
                    :edited-titles edited
                    :expected-existing-titles expected})
                 (let [a1 (random-uuid) b1 (random-uuid) c1 (random-uuid)
                       a2 (random-uuid) b2 (random-uuid) c2 (random-uuid)
                       a3 (random-uuid) b3 (random-uuid) c3 (random-uuid)
                       a4 (random-uuid) b4 (random-uuid)
                       a5 (random-uuid) b5 (random-uuid)
                       a6 (random-uuid) b6 (random-uuid) c6 (random-uuid)
                       a7 (random-uuid) b7 (random-uuid) c7 (random-uuid)
                       a8 (random-uuid) b8 (random-uuid) c8 (random-uuid)
                       a9 (random-uuid) b9 (random-uuid) c9 (random-uuid)
                       a10 (random-uuid) b10 (random-uuid) c10 (random-uuid)
                       a11 (random-uuid) b11 (random-uuid) c11 (random-uuid)
                       a12 (random-uuid) b12 (random-uuid) c12 (random-uuid)]
                   [{:case-id "edit-first"
                     :initial [{:uuid a1 :title "a1"} {:uuid b1 :title "b1"} {:uuid c1 :title "c1"}]
                     :edited ["a1 edited" "b1" "c1"]
                     :expected {a1 "a1 edited" b1 "b1" c1 "c1"}}
                    {:case-id "edit-middle"
                     :initial [{:uuid a2 :title "a2"} {:uuid b2 :title "b2"} {:uuid c2 :title "c2"}]
                     :edited ["a2" "b2 edited" "c2"]
                     :expected {a2 "a2" b2 "b2 edited" c2 "c2"}}
                    {:case-id "edit-last"
                     :initial [{:uuid a3 :title "a3"} {:uuid b3 :title "b3"} {:uuid c3 :title "c3"}]
                     :edited ["a3" "b3" "c3 edited"]
                     :expected {a3 "a3" b3 "b3" c3 "c3 edited"}}
                    {:case-id "insert-before-first"
                     :initial [{:uuid a4 :title "a4"} {:uuid b4 :title "b4"}]
                     :edited ["new before" "a4" "b4"]
                     :expected {a4 "a4" b4 "b4"}}
                    {:case-id "insert-after-last"
                     :initial [{:uuid a5 :title "a5"} {:uuid b5 :title "b5"}]
                     :edited ["a5" "b5" "new after"]
                     :expected {a5 "a5" b5 "b5"}}
                    {:case-id "insert-middle"
                     :initial [{:uuid a6 :title "a6"} {:uuid b6 :title "b6"} {:uuid c6 :title "c6"}]
                     :edited ["a6" "new middle" "b6" "c6"]
                     :expected {a6 "a6" b6 "b6" c6 "c6"}}
                    {:case-id "delete-first"
                     :initial [{:uuid a7 :title "a7"} {:uuid b7 :title "b7"} {:uuid c7 :title "c7"}]
                     :edited ["b7" "c7"]
                     :expected {b7 "b7" c7 "c7"}}
                    {:case-id "delete-middle"
                     :initial [{:uuid a8 :title "a8"} {:uuid b8 :title "b8"} {:uuid c8 :title "c8"}]
                     :edited ["a8" "c8"]
                     :expected {a8 "a8" c8 "c8"}}
                    {:case-id "delete-last"
                     :initial [{:uuid a9 :title "a9"} {:uuid b9 :title "b9"} {:uuid c9 :title "c9"}]
                     :edited ["a9" "b9"]
                     :expected {a9 "a9" b9 "b9"}}
                    {:case-id "insert-before-edited-first"
                     :initial [{:uuid a10 :title "a10"} {:uuid b10 :title "b10"} {:uuid c10 :title "c10"}]
                     :edited ["new first" "a10 edited" "b10" "c10"]
                     :expected {a10 "a10 edited" b10 "b10" c10 "c10"}}
                    {:case-id "delete-middle-edit-last"
                     :initial [{:uuid a11 :title "a11"} {:uuid b11 :title "b11"} {:uuid c11 :title "c11"}]
                     :edited ["a11" "c11 edited"]
                     :expected {a11 "a11" c11 "c11 edited"}}
                    {:case-id "same-count-edit-is-existing-block-edit"
                     :initial [{:uuid a12 :title "a12"} {:uuid b12 :title "b12"} {:uuid c12 :title "c12"}]
                     :edited ["a12" "replacement text" "c12"]
                     :expected {a12 "a12" b12 "replacement text" c12 "c12"}}]))]
      (-> (run-sidecar-edit-cases! cases)
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-sidecar-random-file-edit-cases-match-regenerated-markdown-test
  (async done
    (let [cases (mapv random-edit-case (range 20 40))]
      (-> (run-sidecar-edit-cases! cases)
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-file-edit-can-change-generated-block-content-immediately-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "99999999-9999-4999-8999-999999999991"
          block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Immediate Edit"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "before"
                                               :block/uuid block-uuid}]}]})
          page (db-test/find-page-by-title @conn "Immediate Edit")
          relative-path "pages/Immediate Edit.md"
          storage-path (page-path relative-path)
          handlers (atom {})
          watcher #js {}
          _ (set! (.-on watcher)
                  (fn [event handler]
                    (swap! handlers assoc event handler)
                    watcher))
          _ (set! (.-close watcher) (fn [] nil))]
      (-> (p/let [_ (markdown-mirror/<start-file-watcher! test-repo conn {:platform platform
                                                                          :chokidar-watch! (fn [_path _opts] watcher)
                                                                          :ignored-recent-write-ms 60000})
                  _ (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
                  generated (get @files storage-path)
                  _ (swap! files assoc storage-path (string/replace generated "- before" "- after"))
                  result ((get @handlers "change") (str "/tmp/logseq/" storage-path))
                  _ (markdown-mirror/stop-file-watcher! test-repo)]
            (is (= :imported (:status result)))
            (is (= "after" (:block/title (d/entity @conn [:block/uuid block-uuid])))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-watcher-imports-one-space-indented-journal-child-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "99999999-9999-4999-8999-999999999983"
          block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaac6"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "May 6th, 2026"
                                             :block/name "may 6th, 2026"
                                             :block/journal-day 20260506
                                             :block/tags #{:logseq.class/Journal}
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "block"
                                               :block/uuid block-uuid}]}]})
          page (db-test/find-journal-by-journal-day @conn 20260506)
          relative-path "journals/2026_05_06.md"
          storage-path (page-path relative-path)
          handlers (atom {})
          watcher #js {}
          _ (set! (.-on watcher)
                  (fn [event handler]
                    (swap! handlers assoc event handler)
                    watcher))
          _ (set! (.-close watcher) (fn [] nil))]
      (-> (p/let [_ (markdown-mirror/<start-file-watcher! test-repo conn {:platform platform
                                                                          :chokidar-watch! (fn [_path _opts] watcher)
                                                                          :ignored-recent-write-ms 0})
                  _ (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
                  _ (swap! files assoc storage-path
                           (str (page-marker page-uuid) "\n\n"
                                "- block\n"
                                " - child"))
                  result ((get @handlers "change") (str "/tmp/logseq/" storage-path))
                  _ (markdown-mirror/stop-file-watcher! test-repo)]
            (is (= :imported (:status result)))
            (is (= ["block"] (page-block-titles @conn "May 6th, 2026")))
            (is (= ["child"] (child-block-titles @conn block-uuid))))
          (p/catch (fn [e]
                     (markdown-mirror/stop-file-watcher! test-repo)
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-existing-block-page-ref-edit-creates-page-test
  (async done
    (let [page-uuid #uuid "99999999-9999-4999-8999-999999999990"
          block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Ref Edit"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "before"
                                               :block/uuid block-uuid}]}]})
          relative-path "pages/Ref Edit.md"
          content (str (page-marker page-uuid) "\n"
                       "- [[foo]] test")]
      (-> (markdown-mirror/<import-file-content! test-repo conn relative-path content {})
          (p/then (fn [result]
                    (let [foo (db-test/find-page-by-title @conn "foo")
                          block (d/entity @conn [:block/uuid block-uuid])]
                      (is (= :imported (:status result)))
                      (is (some? foo))
                      (is (block-title-includes? @conn block-uuid "[[foo]]"))
                      (is (= #{(:db/id foo)} (set (map :db/id (:block/refs block))))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-existing-block-hashtag-edit-creates-tag-test
  (async done
    (let [page-uuid #uuid "99999999-9999-4999-8999-999999999988"
          block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Tag Edit"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "before"
                                               :block/uuid block-uuid}]}]})
          content (str (page-marker page-uuid) "\n"
                       "- object 1 #tag1")]
      (-> (markdown-mirror/<import-file-content! test-repo conn "pages/Tag Edit.md" content {})
          (p/then (fn [result]
                    (let [tag (db-test/find-page-by-title @conn "tag1")
                          block (d/entity @conn [:block/uuid block-uuid])
                          block-content-ref-ids (->> (:block/refs block)
                                                     (remove #(= :block/tags (:db/ident %)))
                                                     (map :db/id)
                                                     set)]
                      (is (= :imported (:status result)))
                      (is (some? tag))
                      (is (some #(= :logseq.class/Tag (:db/ident %)) (:block/tags tag)))
                      (is (block-title-includes? @conn block-uuid "#tag1"))
                      (is (= #{(:db/id tag)} (set (map :db/id (:block/tags block)))))
                      (is (= #{(:db/id tag)} block-content-ref-ids)))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-adding-hashtag-block-preserves-previous-hashtag-block-tag-test
  (async done
    (let [page-uuid #uuid "99999999-9999-4999-8999-999999999977"
          block1-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaafb"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Tag Append"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "block 1"
                                               :block/uuid block1-uuid}]}]})
          first-content (str (page-marker page-uuid) "\n"
                             "- block 1 #tag1")
          second-content (str (page-marker page-uuid) "\n"
                              "- block 1 #tag1\n"
                              "- block 2 #tag2")]
      (-> (p/let [first-result (markdown-mirror/<import-file-content! test-repo conn "pages/Tag Append.md" first-content {})
                  second-result (markdown-mirror/<import-file-content! test-repo conn "pages/Tag Append.md" second-content {})]
            (let [block1 (d/entity @conn [:block/uuid block1-uuid])
                  page-titles (page-block-titles @conn "Tag Append")]
              (is (= :imported (:status first-result)))
              (is (= :imported (:status second-result)))
              (is (contains? (set (map :block/title (:block/tags block1))) "tag1"))
              (is (= ["block 1" "block 2 #tag2"] page-titles))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-existing-block-preserves-continuation-markdown-test
  (async done
    (let [page-uuid #uuid "99999999-9999-4999-8999-999999999987"
          block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Continuation Edit"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "before"
                                               :block/uuid block-uuid}]}]})
          content (str (page-marker page-uuid) "\n"
                       "- intro\n"
                       "  > quoted\n"
                       "  ```clojure\n"
                       "  - not a child\n"
                       "  ```")]
      (-> (markdown-mirror/<import-file-content! test-repo conn "pages/Continuation Edit.md" content {})
          (p/then (fn [result]
                    (let [page (db-test/find-page-by-title @conn "Continuation Edit")
                          page-blocks (map #(d/entity @conn (:e %))
                                           (d/datoms @conn :avet :block/page (:db/id page)))]
                      (is (= :imported (:status result)))
                      (is (= "intro\n> quoted\n```clojure\n- not a child\n```"
                             (:block/title (d/entity @conn [:block/uuid block-uuid]))))
                      (is (= 1 (count page-blocks))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-inserted-block-preserves-continuation-markdown-test
  (async done
    (let [page-uuid #uuid "99999999-9999-4999-8999-999999999986"
          block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Continuation Insert"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "existing"
                                               :block/uuid block-uuid}]}]})
          content (str (page-marker page-uuid) "\n"
                       "- existing\n"
                       "- inserted\n"
                       "  > quote")]
      (-> (markdown-mirror/<import-file-content! test-repo conn "pages/Continuation Insert.md" content {})
          (p/then (fn [result]
                    (is (= :imported (:status result)))
                    (is (some? (block-by-title @conn "inserted\n> quote")))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-top-level-markdown-without-block-is-rejected-test
  (async done
    (let [page-uuid #uuid "99999999-9999-4999-8999-999999999985"
          block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Top Level Markdown"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "existing"
                                               :block/uuid block-uuid}]}]})
          content (str (page-marker page-uuid) "\n"
                       "> top-level quote")]
      (-> (markdown-mirror/<import-file-content! test-repo conn "pages/Top Level Markdown.md" content {})
          (p/then (fn [result]
                    (is (= :error (:status result)))
                    (is (= :unsupported-top-level-markdown (:reason result)))
                    (is (= "existing" (:block/title (d/entity @conn [:block/uuid block-uuid]))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-property-edits-are-ignored-test
  (async done
    (let [block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab"
          conn (db-test/create-conn-with-blocks
                {:properties {:user.property/rating {:logseq.property/type :number}}
                 :pages-and-blocks [{:page {:block/title "Property Ignore"}
                                     :blocks [{:block/title "task"
                                               :block/uuid block-uuid
                                               :build/properties {:user.property/rating 5}}]}]})
          page (db-test/find-page-by-title @conn "Property Ignore")
          content (str (page-marker (:block/uuid page)) "\n"
                       "- task\n"
                       "  rating:: 10")]
      (-> (markdown-mirror/<import-file-content! test-repo conn "pages/Property Ignore.md" content {})
          (p/then (fn [result]
                    (is (= :skipped (:status result)))
                    (is (= 5 (:logseq.property/value
                              (:user.property/rating (d/entity @conn [:block/uuid block-uuid])))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-inserted-block-does-not-rewrite-edited-file-test
  (async done
    (let [{:keys [platform files writes]} (fake-platform)
          page-uuid #uuid "99999999-9999-4999-8999-999999999997"
          block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaac"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Insert Page"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "existing"
                                               :block/uuid block-uuid}]}]})
          content (str (page-marker page-uuid) "\n"
                       "- existing\n"
                       "- inserted")
          path (page-path "pages/Insert Page.md")
          _ (swap! files assoc path content)]
      (-> (markdown-mirror/<import-file-content! test-repo conn "pages/Insert Page.md" content {:platform platform})
          (p/then (fn [result]
                    (is (= :imported (:status result)))
                    (is (some? (block-by-title @conn "inserted")))
                    (is (= content (get @files path)))
                    (is (empty? (markdown-writes writes)))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-inserted-block-page-ref-creates-page-test
  (async done
    (let [{:keys [platform]} (fake-platform)
          page-uuid #uuid "99999999-9999-4999-8999-999999999989"
          block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Inserted Ref"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "existing"
                                               :block/uuid block-uuid}]}]})
          content (str (page-marker page-uuid) "\n"
                       "- existing\n"
                       "- [[foo]] test")]
      (-> (markdown-mirror/<import-file-content! test-repo conn "pages/Inserted Ref.md" content {:platform platform})
          (p/then (fn [result]
                    (let [foo (db-test/find-page-by-title @conn "foo")
                          block (first (filter #(block-title-includes? @conn (:block/uuid %) "[[foo]]")
                                               (map #(d/entity @conn (:e %))
                                                    (d/datoms @conn :avet :block/page (:db/id (db-test/find-page-by-title @conn "Inserted Ref"))))))]
                      (is (= :imported (:status result)))
                      (is (some? foo))
                      (is (some? block))
                      (is (= #{(:db/id foo)} (set (map :db/id (:block/refs block))))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-missing-block-deletes-block-test
  (async done
    (let [page-uuid #uuid "99999999-9999-4999-8999-999999999996"
          keep-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaad"
          delete-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaae"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Delete Block"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "keep"
                                               :block/uuid keep-uuid}
                                              {:block/title "delete"
                                               :block/uuid delete-uuid}]}]})
          content (str (page-marker page-uuid) "\n"
                       "- keep")]
      (-> (markdown-mirror/<import-file-content! test-repo conn "pages/Delete Block.md" content {})
          (p/then (fn [result]
                    (is (= :imported (:status result)))
                    (is (some? (d/entity @conn [:block/uuid keep-uuid])))
                    (is (nil? (d/entity @conn [:block/uuid delete-uuid])))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-new-page-file-creates-page-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          conn (db-test/create-conn-with-blocks {:pages-and-blocks []})]
      (-> (markdown-mirror/<import-file-content! test-repo conn "pages/New Imported.md" "- hello" {:platform platform})
          (p/then (fn [result]
                    (is (= :imported (:status result)))
                    (is (some? (db-test/find-page-by-title @conn "New Imported")))
                    (is (some? (block-by-title @conn "hello")))
                    (is (string/includes? (get @files (page-path "pages/New Imported.md"))
                                          "id:: "))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-new-journal-file-creates-journal-test
  (async done
    (let [conn (db-test/create-conn-with-blocks {:pages-and-blocks []})]
      (-> (markdown-mirror/<import-file-content! test-repo conn "journals/2026_05_05.md" "- journal item" {})
          (p/then (fn [result]
                    (is (= :imported (:status result)))
                    (is (some? (db-test/find-journal-by-journal-day @conn 20260505)))
                    (is (some? (block-by-title @conn "journal item")))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-new-file-existing-page-marker-fails-test
  (async done
    (let [existing-page-uuid #uuid "99999999-9999-4999-8999-999999999994"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Existing"
                                             :block/uuid existing-page-uuid}
                                     :blocks [{:block/title "existing"}]}]})
          content (str (page-marker existing-page-uuid) "\n- copied")]
      (-> (markdown-mirror/<import-file-content! test-repo conn "pages/New With Marker.md" content {})
          (p/then (fn [result]
                    (is (= :error (:status result)))
                    (is (= :new-file-has-page-marker (:reason result)))
                    (is (nil? (db-test/find-page-by-title @conn "New With Marker")))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-file-delete-is-ignored-test
  (async done
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Delete Event"}
                                     :blocks [{:block/title "safe"}]}]})]
      (-> (markdown-mirror/<handle-file-event! test-repo conn {:type :deleted
                                                               :relative-path "pages/Delete Event.md"} {})
          (p/then (fn [result]
                    (is (= :skipped (:status result)))
                    (is (= :ignored-delete-event (:reason result)))
                    (is (some? (db-test/find-page-by-title @conn "Delete Event")))
                    (is (some? (block-by-title @conn "safe")))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest chokidar-watcher-imports-new-markdown-files-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          conn (db-test/create-conn-with-blocks {:pages-and-blocks []})
          handlers (atom {})
          watched (atom nil)
          closed? (atom false)
          watcher #js {}
          _ (set! (.-on watcher)
                  (fn [event handler]
                    (swap! handlers assoc event handler)
                    watcher))
          _ (set! (.-close watcher)
                  (fn []
                    (reset! closed? true)))
          chokidar-watch! (fn [path opts]
                            (reset! watched [path opts])
                            watcher)
          relative-path "pages/Watcher New.md"
          storage-path (page-path relative-path)]
      (swap! files assoc storage-path "- from watcher")
      (-> (p/let [start-result (markdown-mirror/<start-file-watcher! test-repo conn {:platform platform
                                                                                     :chokidar-watch! chokidar-watch!})
                  event-result ((get @handlers "add") (str "/tmp/logseq/" storage-path))
                  _ (markdown-mirror/stop-file-watcher! test-repo)]
            (is (= :watching (:status start-result)))
            (is (= [(str "/tmp/logseq/" (markdown-mirror/repo-mirror-dir test-repo))
                    {:ignore-initial true
                     :alwaysStat true
                     :await-write-finish {:stability-threshold 200
                                          :poll-interval 50}}]
                   @watched))
            (is (= :imported (:status event-result)))
            (is (some? (db-test/find-page-by-title @conn "Watcher New")))
            (is (some? (block-by-title @conn "from watcher")))
            (is (true? @closed?)))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-watcher-skips-large-file-before-reading-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          conn (db-test/create-conn-with-blocks {:pages-and-blocks []})
          read-count (atom 0)
          platform' (assoc-in platform [:storage :read-text!]
                              (fn [path]
                                (swap! read-count inc)
                                (p/resolved (get @files path))))
          handlers (atom {})
          watcher #js {}
          _ (set! (.-on watcher)
                  (fn [event handler]
                    (swap! handlers assoc event handler)
                    watcher))
          _ (set! (.-close watcher) (fn [] nil))
          relative-path "journals/2026_05_05.md"
          storage-path (page-path relative-path)
          stats #js {:size 11}]
      (swap! files assoc storage-path "- too large")
      (-> (p/let [_ (markdown-mirror/<start-file-watcher! test-repo conn {:platform platform'
                                                                          :chokidar-watch! (fn [_path _opts] watcher)
                                                                          :max-import-bytes 10})
                  result ((get @handlers "change") (str "/tmp/logseq/" storage-path) stats)
                  _ (markdown-mirror/stop-file-watcher! test-repo)]
            (is (= :skipped (:status result)))
            (is (= :file-too-large (:reason result)))
            (is (= 0 @read-count))
            (is (nil? (db-test/find-journal-by-journal-day @conn 20260505))))
          (p/catch (fn [e]
                     (markdown-mirror/stop-file-watcher! test-repo)
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))
