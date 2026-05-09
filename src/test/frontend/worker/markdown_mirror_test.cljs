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

(defn- page-marker [uuid]
  (str "id:: " uuid))

(defn- js-error
  [message data]
  (let [error (js/Error. message)]
    (doseq [[k v] data]
      (aset error (name k) v))
    error))

(defn- first-block [page]
  (-> page :block/_page first))

(defn- block-id-comment [block]
  (str "<!-- id: " (:db/id block) " -->"))

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

(deftest normalized-title-collisions-write-distinct-stable-paths-test
  (let [page-uuid-1 #uuid "11111111-1111-4111-8111-111111111111"
        page-uuid-2 #uuid "22222222-2222-4222-8222-222222222222"
        conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "A/B"
                                           :block/uuid page-uuid-1}
                                   :blocks [{:block/title "first"}]}
                                  {:page {:block/title "A:B"
                                           :block/uuid page-uuid-2}
                                   :blocks [{:block/title "second"}]}]})
        pages (->> ["A/B" "A:B"]
                   (map #(db-test/find-page-by-title @conn %))
                   (sort-by (comp str :block/uuid)))
        paths (mapv #(markdown-mirror/page-relative-path @conn %) pages)]
    (is (= ["pages/A_B.md"
            "pages/A_B (2).md"]
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
          page (db-test/find-page-by-title @conn "Source")
          block (first-block page)]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (is (= (str (page-marker (:block/uuid page)) "\n\n"
                                "- See [[Foo]] " (block-id-comment block))
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

(deftest block-db-id-comments-are-written-to-each-block-first-line-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "33333333-3333-4333-8333-333333333333"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Block Ids"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "hello"}
                                              {:block/title "world"}]}]})
          page (db-test/find-page-by-title @conn "Block Ids")
          hello (db-test/find-block-by-content @conn "hello")
          world (db-test/find-block-by-content @conn "world")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (is (= (str (page-marker page-uuid) "\n\n"
                                "- hello " (block-id-comment hello) "\n"
                                "- world " (block-id-comment world))
                           (get @files (page-path "pages/Block Ids.md"))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest block-db-id-comment-is-only-written-to-first-rendered-line-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "33333333-3333-4333-8333-333333333334"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Multiline"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "block line1\nblock line2"}]}]})
          page (db-test/find-page-by-title @conn "Multiline")
          block (db-test/find-block-by-content @conn "block line1\nblock line2")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (is (= (str (page-marker page-uuid) "\n\n"
                                "- block line1 " (block-id-comment block) "\n"
                                "  block line2")
                           (get @files (page-path "pages/Multiline.md"))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest empty-block-db-id-comment-does-not-add-extra-content-space-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "33333333-3333-4333-8333-333333333338"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Empty"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title ""}]}]})
          page (db-test/find-page-by-title @conn "Empty")
          block (first-block page)]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (is (= (str (page-marker page-uuid) "\n\n"
                                "- " (block-id-comment block))
                           (get @files (page-path "pages/Empty.md"))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest nested-block-db-id-comments-preserve-indent-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "33333333-3333-4333-8333-333333333335"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Nested"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "parent"
                                               :build/children [{:block/title "child"}]}]}]})
          page (db-test/find-page-by-title @conn "Nested")
          parent (db-test/find-block-by-content @conn "parent")
          child (db-test/find-block-by-content @conn "child")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (is (= (str (page-marker page-uuid) "\n\n"
                                "- parent " (block-id-comment parent) "\n"
                                "  - child " (block-id-comment child))
                           (get @files (page-path "pages/Nested.md"))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest code-blocks-do-not-receive-db-id-comments-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "33333333-3333-4333-8333-333333333336"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Code Mirror"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "(println \"hi\")"
                                               :build/tags [:logseq.class/Code-block]
                                               :build/properties {:logseq.property.node/display-type :code
                                                                  :logseq.property.code/lang "clojure"}}
                                              {:block/title "normal"}]}]})
          page (db-test/find-page-by-title @conn "Code Mirror")
          normal (db-test/find-block-by-content @conn "normal")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (is (= (str (page-marker page-uuid) "\n\n"
                                "- ```clojure\n"
                                "  (println \"hi\")\n"
                                "  ```\n"
                                "- normal " (block-id-comment normal))
                           (get @files (page-path "pages/Code Mirror.md"))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest property-value-lines-do-not-consume-block-db-id-comments-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          page-uuid #uuid "33333333-3333-4333-8333-333333333337"
          conn (db-test/create-conn-with-blocks
                {:properties {:user.property/notes {:logseq.property/type :default}}
                 :pages-and-blocks [{:page {:block/title "Properties"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "body"
                                               :build/properties {:user.property/notes "property value bullet"}}
                                              {:block/title "after"}]}]})
          page (db-test/find-page-by-title @conn "Properties")
          body (db-test/find-block-by-content @conn "body")
          after (db-test/find-block-by-content @conn "after")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (is (= (str (page-marker page-uuid) "\n\n"
                                "- body " (block-id-comment body) "\n"
                                "  * notes::\n"
                                "    - property value bullet\n"
                                "- after " (block-id-comment after))
                           (get @files (page-path "pages/Properties.md"))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest enabled-electron-edit-writes-page-mirror-test
  (async done
    (let [{:keys [platform files writes]} (fake-platform)
          page-uuid #uuid "33333333-3333-4333-8333-333333333333"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Page A"
                                             :block/uuid page-uuid}
                                     :blocks [{:block/title "hello"}
                                              {:block/title "world"}]}]})
          page (db-test/find-page-by-title @conn "Page A")
          hello (db-test/find-block-by-content @conn "hello")
          world (db-test/find-block-by-content @conn "world")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (let [path (page-path "pages/Page A.md")
                          content (str (page-marker page-uuid) "\n\n"
                                       "- hello " (block-id-comment hello) "\n"
                                       "- world " (block-id-comment world))]
                      (is (= content (get @files path)))
                      (is (= [[path content]] @writes)))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest missing-mirror-file-read-still-writes-page-mirror-test
  (async done
    (let [{:keys [platform files writes]} (fake-platform)
          missing-error (js-error "ENOENT: missing mirror file" {:code "ENOENT"})
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Page A"}
                                     :blocks [{:block/title "hello"}]}]})
          page (db-test/find-page-by-title @conn "Page A")
          block (db-test/find-block-by-content @conn "hello")]
      (-> (markdown-mirror/<mirror-page!
           test-repo @conn (:db/id page)
           {:platform (assoc-in platform [:storage :read-text!]
                                (fn [_path] (p/rejected missing-error)))})
          (p/then (fn [_]
                    (let [path (page-path "pages/Page A.md")
                          content (str (page-marker (:block/uuid page)) "\n\n"
                                       "- hello " (block-id-comment block))]
                      (is (= content (get @files path)))
                      (is (= [[path content]] @writes)))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest unexpected-mirror-file-read-error-rejects-page-mirror-test
  (async done
    (let [{:keys [platform writes]} (fake-platform)
          read-error (ex-info "permission denied" {:code :eacces})
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Page A"}
                                     :blocks [{:block/title "hello"}]}]})
          page (db-test/find-page-by-title @conn "Page A")]
      (-> (markdown-mirror/<mirror-page!
           test-repo @conn (:db/id page)
           {:platform (assoc-in platform [:storage :read-text!]
                                (fn [_path] (p/rejected read-error)))})
          (p/then (fn [_]
                    (is false "Expected mirror write to reject when read fails unexpectedly")))
          (p/catch (fn [error]
                     (is (= read-error error))
                     (is (empty? @writes))))
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
          page (db-test/find-page-by-title @conn "Issue")
          block (db-test/find-block-by-content @conn "TODO body")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (let [content (get @files (page-path "pages/Issue.md"))]
                      (is (= (str (page-marker (:block/uuid page)) "\n"
                                  "* reproducible-steps::\n"
                                  "  - Open settings\n\n"
                                  "- TODO ## TODO body " (block-id-comment block) "\n"
                                  "  * reproducible-steps::\n"
                                  "    - Click mirror\n"
                                  "  * rating:: 5")
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
          page (db-test/find-page-by-title @conn "Formats")
          heading (db-test/find-block-by-content @conn "Heading block")
          quote-block (db-test/find-block-by-content @conn "quote line 1\nquote line 2")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (let [content (get @files (page-path "pages/Formats.md"))]
                      (is (= (str (page-marker (:block/uuid page)) "\n\n"
                                  "- ## Heading block " (block-id-comment heading) "\n"
                                  "- > quote line 1 " (block-id-comment quote-block) "\n"
                                  "  > quote line 2\n"
                                  "- ```clojure\n"
                                  "  (println \"hi\")\n"
                                  "  (+ 1 2)\n"
                                  "  ```")
                             content)))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest page-mirror-preserves-numbered-list-markers-status-and-tags-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Ordered"}
                                     :blocks [{:block/title "first"
                                               :build/tags [:Project]
                                               :build/properties {:logseq.property/status :logseq.property/status.todo
                                                                  :logseq.property/order-list-type "number"}
                                               :build/children [{:block/title "child"}]}
                                              {:block/title "second"
                                              :build/properties {:logseq.property/order-list-type "number"}}]}]})
          page (db-test/find-page-by-title @conn "Ordered")
          first-block (db-test/find-block-by-content @conn "first")
          child (db-test/find-block-by-content @conn "child")
          second (db-test/find-block-by-content @conn "second")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (let [content (get @files (page-path "pages/Ordered.md"))]
                      (is (= (str (page-marker (:block/uuid page)) "\n\n"
                                  "1. TODO first #Project " (block-id-comment first-block) "\n"
                                  "  - child " (block-id-comment child) "\n"
                                  "2. second " (block-id-comment second))
                             content)))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest page-mirror-does-not-treat-numbered-content-lines-as-blocks-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Numbered Content"}
                                     :blocks [{:block/title "intro\n1. continuation"
                                               :build/tags [:Project]}
                                              {:block/title "1. code line"
                                               :build/tags [:Snippet]
                                               :build/properties {:logseq.property.node/display-type :code}}
                                              {:block/title "second"
                                              :build/tags [:Next]
                                               :build/properties {:logseq.property/status :logseq.property/status.todo}}]}]})
          page (db-test/find-page-by-title @conn "Numbered Content")
          intro (db-test/find-block-by-content @conn "intro\n1. continuation")
          second (db-test/find-block-by-content @conn "second")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (let [content (get @files (page-path "pages/Numbered Content.md"))]
                      (is (= (str (page-marker (:block/uuid page)) "\n\n"
                                  "- intro #Project " (block-id-comment intro) "\n"
                                  "  1. continuation\n"
                                  "- ``` #Snippet\n"
                                  "  1. code line\n"
                                  "  ```\n"
                                  "- TODO second #Next " (block-id-comment second))
                             content)))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest page-mirror-renders-embedded-node-content-and-tags-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          target-uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
          embed-uuid #uuid "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Source"}
                                     :blocks [{:block/title ""
                                               :block/uuid embed-uuid
                                               :build/keep-uuid? true}]}
                                    {:page {:block/title "Target Page"}
                                     :blocks [{:block/title "Target"
                                               :block/uuid target-uuid
                                               :build/keep-uuid? true
                                               :build/tags [:Project]
                                               :build/children [{:block/title "Target child"}]}]}]})
          embed-eid (:db/id (d/entity @conn [:block/uuid embed-uuid]))
          target-eid (:db/id (d/entity @conn [:block/uuid target-uuid]))
          _ (d/transact! conn [{:db/id embed-eid :block/link target-eid}])
          page (db-test/find-page-by-title @conn "Source")
          target (d/entity @conn [:block/uuid target-uuid])
          child (db-test/find-block-by-content @conn "Target child")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (let [content (get @files (page-path "pages/Source.md"))]
                      (is (= (str (page-marker (:block/uuid page)) "\n\n"
                                  "- Target #Project " (block-id-comment target) "\n"
                                  "  - Target child " (block-id-comment child))
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
          page (db-test/find-page-by-title @conn "Page Props")
          block (db-test/find-block-by-content @conn "body")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (let [content (get @files (page-path "pages/Page Props.md"))]
                      (is (= (str (page-marker (:block/uuid page)) "\n"
                                  "* p1::\n"
                                  "  - hello\n"
                                  "* p2:: 1\n"
                                  "* p3::\n"
                                  "  - Author 1\n\n"
                                  "- body " (block-id-comment block))
                             content)))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest page-mirror-exports-node-property-values-as-page-refs-test
  (async done
    (let [{:keys [platform files]} (fake-platform)
          conn (db-test/create-conn-with-blocks
                {:properties {:friend {:logseq.property/type :node}}
                 :pages-and-blocks [{:page {:block/title "Alice"
                                             :build/properties {:friend [:build/page {:block/title "Bob"}]}}
                                     :blocks [{:block/title "knows"}]}
                                    {:page {:block/title "Bob"}}]})
          page (db-test/find-page-by-title @conn "Alice")
          block (db-test/find-block-by-content @conn "knows")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (is (= (str (page-marker (:block/uuid page)) "\n"
                                "* friend:: [[Bob]]\n\n"
                                "- knows " (block-id-comment block))
                           (get @files (page-path "pages/Alice.md"))))))
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
          journal (db-test/find-journal-by-journal-day @conn 20260505)
          block (db-test/find-block-by-content @conn "TODO hello great test")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id journal) {:platform platform})
          (p/then (fn [_]
                    (let [content (get @files (page-path "journals/2026_05_05.md"))]
                      (is (= (str (page-marker (:block/uuid journal)) "\n"
                                  "* p1::\n"
                                  "  - hey\n\n"
                                  "- TODO hello great test " (block-id-comment block) "\n"
                                  "  * p1::\n"
                                  "    - hello\n"
                                  "  * p2:: 1\n"
                                  "  * p3::\n"
                                  "    - Author 1")
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
                    (let [page-a (db-test/find-page-by-title @conn "Page A")
                          journal (db-test/find-journal-by-journal-day @conn 20240508)
                          project (db-test/find-page-by-title @conn "Project")
                          alpha (db-test/find-block-by-content @conn "alpha")
                          journal-block (db-test/find-block-by-content @conn "journal")
                          class-block (db-test/find-block-by-content @conn "class")]
                      (is (= (str (page-marker (:block/uuid page-a)) "\n\n"
                                  "- alpha " (block-id-comment alpha))
                             (get @files (page-path "pages/Page A.md"))))
                      (is (= (str (page-marker (:block/uuid journal)) "\n\n"
                                  "- journal " (block-id-comment journal-block))
                             (get @files (page-path "journals/2024_05_08.md"))))
                      (is (= (str (page-marker (:block/uuid project)) "\n\n"
                                  "- class " (block-id-comment class-block))
                             (get @files (page-path "pages/Project.md")))))
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
          page (db-test/find-page-by-title @conn "Page A")
          block (db-test/find-block-by-content @conn "desktop")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (is (= (str (page-marker page-uuid) "\n\n"
                                "- desktop " (block-id-comment block))
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
          journal (db-test/find-journal-by-journal-day @conn 20240506)
          block (db-test/find-block-by-content @conn "journal item")]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id journal) {:platform platform})
          (p/then (fn [_]
                    (is (= (str (page-marker (:block/uuid journal)) "\n\n"
                                "- journal item " (block-id-comment block))
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
                    (is (= (str (page-marker page-uuid) "\n\n"
                                "- after " (block-id-comment block))
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
            (is (= [[(page-path "pages/Page A.md")
                     (str (page-marker page-uuid) "\n\n"
                          "- latest " (block-id-comment block))]]
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
          block (db-test/find-block-by-content @conn "body")
          old-path (page-path "pages/Old Name.md")
          _ (swap! files assoc old-path (str (page-marker page-uuid) "\n\n"
                                             "- body"))
          tx-report (d/with @conn [{:db/id (:db/id page)
                                    :block/title "New Name"
                                    :block/name "new name"}])
          _ (d/reset-conn! conn (:db-after tx-report))]
      (markdown-mirror/set-enabled! test-repo true)
      (-> (markdown-mirror/<handle-tx-report! test-repo conn tx-report {:platform platform})
          (p/then (fn [_]
                    (is (= [old-path] @deletes))
                    (is (= (str (page-marker page-uuid) "\n\n"
                                "- body " (block-id-comment block))
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
          block (db-test/find-block-by-content @conn "body")
          old-path (page-path "pages/Old Name2.md")
          new-path (page-path "pages/New Name2.md")
          content (str (page-marker page-uuid) "\n\n"
                       "- body " (block-id-comment block))
          ;; pre-populate both old and new paths with same content
          _ (swap! files assoc old-path content)
          _ (swap! files assoc new-path content)
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
          _ (swap! files assoc old-path (str (page-marker page-uuid) "\n\n"
                                             "- body"))
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
          block (db-test/find-block-by-content @conn "same")
          path (page-path "pages/Page A.md")
          _ (swap! files assoc path (str (page-marker page-uuid) "\n\n"
                                         "- same " (block-id-comment block)))]
      (-> (markdown-mirror/<mirror-page! test-repo @conn (:db/id page) {:platform platform})
          (p/then (fn [_]
                    (is (empty? @writes))
                    (is (= (str (page-marker page-uuid) "\n\n"
                                "- same " (block-id-comment block))
                           (get @files path)))))
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
