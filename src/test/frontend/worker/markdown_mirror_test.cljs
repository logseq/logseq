(ns frontend.worker.markdown-mirror-test
  (:require [cljs.test :refer [async deftest is testing]]
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
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Source"}
                                     :blocks [{:block/title "See [[Foo]]"}]}
                                    {:page {:block/title "Foo"}
                                     :blocks [{:block/title "target"}]}
                                    {:page {:block/title "Foo"}
                                     :blocks [{:block/title "duplicate"}]}]})
          page (db-test/find-page-by-title @conn "Source")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (is (= "- See [[Foo]]"
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
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Page A"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "hello"}
                                              {:block/title "world"}]}]})
          page (db-test/find-page-by-title @conn "Page A")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (let [path (page-path "pages/Page A.md")]
                      (is (= "- hello\n- world" (get @files path)))
                      (is (= [[path "- hello\n- world"]] @writes)))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest page-mirror-exports-property-values-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          conn (db-test/create-conn-with-blocks
                {:properties {:user.property/reproducible-steps {:logseq.property/type :default}
                              :user.property/rating {:logseq.property/type :number}}
                 :pages-and-blocks [{:page {:block/title "Issue"
                                             :build/properties {:user.property/reproducible-steps "Open settings"
                                                                :logseq.property/heading 1}}
                                     :blocks [{:block/title "TODO body"
                                               :build/properties {:logseq.property/status :logseq.property/status.todo
                                                                  :user.property/reproducible-steps "Click mirror"
                                                                  :user.property/rating 5
                                                                  :logseq.property/heading 2}}]}]})
          page (db-test/find-page-by-title @conn "Issue")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (let [content (get @files (page-path "pages/Issue.md"))]
                      (is (= "reproducible-steps:: Open settings\n- ## TODO body\n  Status:: Todo\n  reproducible-steps:: Click mirror\n  rating:: 5"
                             content)))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest page-mirror-preserves-markdown-semantic-block-formatting-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Formats"}
                                     :blocks [{:block/title "Heading block"
                                               :build/properties {:logseq.property/heading 2}}
                                              {:block/title "quote line 1\nquote line 2"
                                               :build/tags [:logseq.class/Quote-block]
                                               :build/properties {:logseq.property.node/display-type :quote}}
                                              {:block/title "(println \"hi\")\n(+ 1 2)"
                                               :build/tags [:logseq.class/Code-block]
                                               :build/properties {:logseq.property.node/display-type :code
                                                                  :logseq.property.code/lang "clojure"}}]}]})
          page (db-test/find-page-by-title @conn "Formats")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (let [content (get @files (page-path "pages/Formats.md"))]
                      (is (= "- ## Heading block\n- > quote line 1\n  > quote line 2\n- ```clojure\n  (println \"hi\")\n  (+ 1 2)\n  ```"
                             content)))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest page-mirror-exports-page-property-values-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          conn (db-test/create-conn-with-blocks
                {:properties {:user.property/p1 {:logseq.property/type :default}
                              :user.property/p2 {:logseq.property/type :number}
                              :user.property/p3 {:logseq.property/type :default}}
                 :pages-and-blocks [{:page {:block/title "Page Props"
                                             :build/properties {:user.property/p1 "hello"
                                                                :user.property/p2 1
                                                                :user.property/p3 "Author 1"}}
                                     :blocks [{:block/title "body"}]}]})
          page (db-test/find-page-by-title @conn "Page Props")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (let [content (get @files (page-path "pages/Page Props.md"))]
                      (is (= "p1:: hello\np2:: 1\np3:: Author 1\n- body"
                             content)))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest journal-mirror-exports-page-and-block-property-values-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          conn (db-test/create-conn-with-blocks
                {:properties {:user.property/p1 {:logseq.property/type :default}
                              :user.property/p2 {:logseq.property/type :number}
                              :user.property/p3 {:logseq.property/type :default}}
                 :pages-and-blocks [{:page {:block/title "May 5th, 2026"
                                             :block/name "may 5th, 2026"
                                             :block/journal-day 20260505
                                             :block/tags #{:logseq.class/Journal}
                                             :build/properties {:user.property/p1 "hey"}}
                                     :blocks [{:block/title "TODO hello great test"
                                               :build/properties {:logseq.property/status :logseq.property/status.todo
                                                                  :user.property/p1 "hello"
                                                                  :user.property/p2 1
                                                                  :user.property/p3 "Author 1"}}]}]})
          journal (db-test/find-journal-by-journal-day @conn 20260505)]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id journal) {:platform platform})
          (p/then (fn [_]
                    (let [content (get @files (page-path "journals/2026_05_05.md"))]
                      (is (= "p1:: hey\n- TODO hello great test\n  Status:: Todo\n  p1:: hello\n  p2:: 1\n  p3:: Author 1"
                             content)))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest full-regeneration-writes-existing-non-built-in-non-property-pages-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          conn (db-test/create-conn-with-blocks
                {:properties {:rating {:logseq.property/type :default}}
                 :pages-and-blocks [{:page {:block/title "Page A"}
                                     :blocks [{:block/title "alpha"}]}
                                    {:page {:block/title "Journal"
                                            :block/journal-day 20240508
                                            :block/tags #{:logseq.class/Journal}}
                                     :blocks [{:block/title "journal"}]}
                                    {:page {:block/title "Built In"
                                            :build/properties {:logseq.property/built-in? true}}
                                     :blocks [{:block/title "system"}]}
                                    {:page {:block/title "Project"
                                            :block/tags #{:logseq.class/Tag}
                                            :db/ident :user.class/Project}
                                     :blocks [{:block/title "class"}]}
                                    {:page {:block/title "rating"
                                            :block/tags #{:logseq.class/Property}
                                            :db/ident :user.property/rating}
                                     :blocks [{:block/title "property"}]}]})]
      (-> (<mirror-repo! test-repo @conn {:platform platform})
          (p/then (fn [result]
                    (is (not= ::missing-mirror-repo-fn result))
                    (is (= "- alpha"
                           (get @files (page-path "pages/Page A.md"))))
                    (is (= "- journal"
                           (get @files (page-path "journals/2024_05_08.md"))))
                    (is (= "- class"
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
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Page A"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "desktop"}]}]})
          page (db-test/find-page-by-title @conn "Page A")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (is (= "- desktop"
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
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:build/journal 20240506}
                                     :blocks [{:block/title "journal item"}]}]})
          journal (db-test/find-journal-by-journal-day @conn 20240506)]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id journal) {:platform platform})
          (p/then (fn [_]
                    (is (= "- journal item"
                           (get @files (page-path "journals/2024_05_06.md"))))))
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
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Page A"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "before"}]}]})
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
            (is (= [[(page-path "pages/Page A.md") "- latest"]]
                   @writes)))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest rename-removes-old-mirror-path-test
  (async done
    (let [{:keys [platform files deletes]} (fake-platform)
          page-uuid #uuid "55555555-5555-4555-8555-555555555555"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Old Name"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "body"}]}]})
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
                    (is (= "- body"
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

(deftest unchanged-content-skips-write-test
  (async done
    (let [{:keys [platform files writes]} (fake-platform)
          page-uuid #uuid "77777777-7777-4777-8777-777777777777"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Page A"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "same"}]}]})
          page (db-test/find-page-by-title @conn "Page A")
          path (page-path "pages/Page A.md")
          _ (swap! files assoc path "- same")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (is (empty? @writes))
                    (is (= "- same" (get @files path)))))
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
