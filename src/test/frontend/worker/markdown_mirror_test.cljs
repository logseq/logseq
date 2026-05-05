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

(defn- first-block [page]
  (-> page :block/_page first))

(defn- block-by-title [db title]
  (->> (d/datoms db :avet :block/title title)
       (map #(d/entity db (:e %)))
       (filter :block/page)
       first))

(defn- block-title-includes?
  [db block-uuid s]
  (string/includes? (:block/title (d/entity db [:block/uuid block-uuid])) s))

(defn- page-marker [uuid]
  (str "id:: " uuid))

(defn- block-marker [uuid]
  (str "  id:: " uuid))

(defn- block-line
  [uuid title]
  (str "- " title "\n" (block-marker uuid)))

(defn- nested-block-line
  [uuid title]
  (str "  - " title "\n    id:: " uuid))

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
                    (is (= (str (page-marker page-uuid) "\n\n\n"
                                (block-line block-uuid "See [[Foo]]"))
                           (get @files (page-path "pages/Source.md"))))))
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
                          content (str (page-marker page-uuid) "\n\n\n"
                                       (block-line block-uuid-1 "hello") "\n"
                                       (block-line block-uuid-2 "world"))]
                      (is (= content (get @files path)))
                      (is (= [[path content]] @writes)))))
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
                                  "reproducible-steps:: Open settings\n\n\n"
                                  "- TODO body\n"
                                  (block-marker block-uuid) "\n"
                                  "  Status:: Todo\n"
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
                                  "p3:: Author 1\n\n\n"
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
                                  "p1:: hey\n\n\n"
                                  "- TODO hello great test\n"
                                  (block-marker block-uuid) "\n"
                                  "  Status:: Todo\n"
                                  "  p1:: hello\n"
                                  "  p2:: 1\n"
                                  "  p3:: Author 1")
                             content)))))
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
                    (is (= (str (page-marker page-uuid) "\n\n\n"
                                (block-line page-block-uuid "alpha"))
                           (get @files (page-path "pages/Page A.md"))))
                    (is (= (str (page-marker journal-uuid) "\n\n\n"
                                (block-line journal-block-uuid "journal"))
                           (get @files (page-path "journals/2024_05_08.md"))))
                    (is (= (str (page-marker class-uuid) "\n\n\n"
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
                    (is (= (str (page-marker page-uuid) "\n\n\n"
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
                    (is (= (str (page-marker page-uuid) "\n\n\n"
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
            (is (string/includes? generated (block-marker block-uuid)))
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
                    (is (= "- after"
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
                     (str (page-marker page-uuid) "\n\n\n"
                          (block-line block-uuid "latest"))]]
                   @writes)))
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
                    (is (= (str (page-marker page-uuid) "\n\n\n"
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
          content (str (page-marker page-uuid) "\n\n\n"
                       (block-line block-uuid "same"))
          _ (swap! files assoc path content)]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (is (empty? @writes))
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
                       "- after\n"
                       (block-marker block-uuid))]
      (-> (markdown-mirror/<import-file-content! test-repo conn relative-path content {})
          (p/then (fn [result]
                    (is (= :imported (:status result)))
                    (is (= "after" (:block/title (d/entity @conn [:block/uuid block-uuid]))))))
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
                       "- [[foo]] test\n"
                       (block-marker block-uuid))]
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
                       "- object 1 #tag1\n"
                       (block-marker block-uuid))]
      (-> (markdown-mirror/<import-file-content! test-repo conn "pages/Tag Edit.md" content {})
          (p/then (fn [result]
                    (let [tag (db-test/find-page-by-title @conn "tag1")
                          block (d/entity @conn [:block/uuid block-uuid])]
                      (is (= :imported (:status result)))
                      (is (some? tag))
                      (is (some #(= :logseq.class/Tag (:db/ident %)) (:block/tags tag)))
                      (is (block-title-includes? @conn block-uuid "#tag1"))
                      (is (= #{(:db/id tag)} (set (map :db/id (:block/tags block)))))
                      (is (= #{(:db/id tag)} (set (map :db/id (:block/refs block))))))))
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
                       (block-marker block-uuid) "\n"
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
                       (block-marker block-uuid) "\n"
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
    (let [page-uuid #uuid "99999999-9999-4999-8999-999999999998"
          block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab"
          conn (db-test/create-conn-with-blocks
                {:properties {:user.property/rating {:logseq.property/type :number}}
                 :pages-and-blocks [{:page {:block/title "Property Ignore"}
                                     :blocks [{:block/title "task"
                                               :block/uuid block-uuid
                                               :build/properties {:user.property/rating 5}}]}]})
          page (db-test/find-page-by-title @conn "Property Ignore")
          content (str (page-marker (:block/uuid page)) "\n"
                       "- task\n"
                       (block-marker block-uuid) "\n"
                       "  rating:: 10")]
      (-> (markdown-mirror/<import-file-content! test-repo conn "pages/Property Ignore.md" content {})
          (p/then (fn [result]
                    (is (= :skipped (:status result)))
                    (is (= 5 (:logseq.property/value
                              (:user.property/rating (d/entity @conn [:block/uuid block-uuid])))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-inserted-block-gets-marker-through-suppressed-render-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "99999999-9999-4999-8999-999999999997"
          block-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaac"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Insert Page"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "existing"
                                               :block/uuid block-uuid}]}]})
          content (str (page-marker page-uuid) "\n"
                       "- existing\n"
                       (block-marker block-uuid) "\n"
                       "- inserted")]
      (-> (markdown-mirror/<import-file-content! test-repo conn "pages/Insert Page.md" content {:platform platform})
          (p/then (fn [result]
                    (is (= :imported (:status result)))
                    (is (some? (block-by-title @conn "inserted")))
                    (is (re-find #"(?m)^  id:: [0-9a-fA-F-]{36}$"
                                 (get @files (page-path "pages/Insert Page.md"))))))
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
                       (block-marker block-uuid) "\n"
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

(deftest two-way-missing-block-marker-deletes-block-test
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
                       "- keep\n"
                       (block-marker keep-uuid))]
      (-> (markdown-mirror/<import-file-content! test-repo conn "pages/Delete Block.md" content {})
          (p/then (fn [result]
                    (is (= :imported (:status result)))
                    (is (some? (d/entity @conn [:block/uuid keep-uuid])))
                    (is (nil? (d/entity @conn [:block/uuid delete-uuid])))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest two-way-block-move-is-ignored-test
  (async done
    (let [page-uuid #uuid "99999999-9999-4999-8999-999999999995"
          parent-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaf"
          child-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaab0"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Move Ignore"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "parent"
                                               :block/uuid parent-uuid
                                               :build/children [{:block/title "child"
                                                                 :block/uuid child-uuid}]}]}]})
          child-before (d/entity @conn [:block/uuid child-uuid])
          content (str (page-marker page-uuid) "\n"
                       "- parent\n"
                       (block-marker parent-uuid) "\n"
                       (nested-block-line child-uuid "child"))]
      (-> (markdown-mirror/<import-file-content! test-repo conn "pages/Move Ignore.md" content {})
          (p/then (fn [result]
                    (is (= :skipped (:status result)))
                    (is (= (:db/id (:block/parent child-before))
                           (:db/id (:block/parent (d/entity @conn [:block/uuid child-uuid])))))))
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
                     :await-write-finish {:stability-threshold 200
                                          :poll-interval 50}}]
                   @watched))
            (is (= :imported (:status event-result)))
            (is (some? (db-test/find-page-by-title @conn "Watcher New")))
            (is (some? (block-by-title @conn "from watcher")))
            (is (true? @closed?)))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))
