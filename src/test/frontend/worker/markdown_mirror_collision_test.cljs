(ns frontend.worker.markdown-mirror-collision-test
  "Two pages must never share one mirror file: not through case, not through a
  literal ` (n)` title, and not after a rename shifts a stem group."
  (:require [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.test.node-helper :as node-helper]
            [frontend.worker.markdown-mirror :as markdown-mirror]
            [frontend.worker.platform.node :as platform-node]
            [logseq.db.test.helper :as db-test]
            [promesa.core :as p]))

(def ^:private test-repo "logseq_db_mirror-collision")

(defn- mirror-file
  [relative-path]
  (str (markdown-mirror/repo-mirror-dir test-repo) "/" relative-path))

(defn- fake-platform
  "Mirror storage on a case-sensitive file system (Linux), or, with
  `:case-insensitive? true`, on one that resolves case variants of a path to
  one file and keeps the name the file was created with (macOS, Windows).
  A delete lands after the writes started with it, as a slower `fs.rm` would."
  ([] (fake-platform {}))
  ([{:keys [case-insensitive?]}]
   (let [files (atom {}) ; file key -> content
         names (atom {}) ; file key -> path the file was created with
         file-key (if case-insensitive? string/lower-case identity)
         put-file! (fn [path content]
                     (swap! names update (file-key path) #(or % path))
                     (swap! files assoc (file-key path) content))]
     {:platform {:env {:runtime :node}
                 :storage {:read-text! (fn [path] (p/resolved (get @files (file-key path))))
                           :write-text-atomic! (fn [path content]
                                                 (put-file! path content)
                                                 (p/resolved nil))
                           :delete-file! (fn [path]
                                           (p/create
                                            (fn [resolve _reject]
                                              (js/setTimeout (fn []
                                                               (swap! files dissoc (file-key path))
                                                               (swap! names dissoc (file-key path))
                                                               (resolve nil))
                                                             0))))
                           :read-dir! (fn [dir]
                                        (p/resolved
                                         (vec (keep (fn [path]
                                                      (when (string/starts-with? path (str dir "/"))
                                                        (let [file-name (subs path (inc (count dir)))]
                                                          (when-not (string/includes? file-name "/")
                                                            file-name))))
                                                    (vals @names)))))}
                 :broadcast {:post-message! (fn [& _] nil)}}
      :files files
      :put-file! (fn [relative-path content] (put-file! (mirror-file relative-path) content))
      :read-file (fn [relative-path] (get @files (file-key (mirror-file relative-path))))
      :file-exists? (fn [relative-path] (contains? @files (file-key (mirror-file relative-path))))})))

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
         (let [{:keys [platform read-file file-exists?]} (fake-platform)
               ;; sorts first, so it takes index 1 of the "Foo" group once renamed
               bar-uuid #uuid "11111111-1111-4111-8111-111111111111"
               foo-uuid #uuid "22222222-2222-4222-8222-222222222222"
               conn (db-test/create-conn-with-blocks
                     {:pages-and-blocks [{:page {:block/title "Bar" :block/uuid bar-uuid}
                                          :blocks [{:block/title "bar body"}]}
                                         {:page {:block/title "Foo" :block/uuid foo-uuid}
                                          :blocks [{:block/title "foo body"}]}]})]
           (markdown-mirror/set-enabled! test-repo true)
           (-> (p/let [_ (markdown-mirror/<mirror-repo! test-repo @conn {:platform platform})
                       bar-id (:db/id (d/entity @conn [:block/uuid bar-uuid]))
                       tx-report (d/transact! conn [[:db/add bar-id :block/title "Foo"]
                                                    [:db/add bar-id :block/name "foo"]])
                       _ (markdown-mirror/<handle-tx-report! test-repo conn tx-report {:platform platform})]
                 (is (= ["pages/Foo.md" "pages/Foo (2).md"] (paths-by-uuid @conn [bar-uuid foo-uuid])))
                 (is (string/includes? (str (read-file "pages/Foo.md")) "bar body")
                     "the renamed page is mirrored at its assigned path")
                 (is (string/includes? (str (read-file "pages/Foo (2).md")) "foo body")
                     "the page whose duplicate index shifted is mirrored at its assigned path")
                 (is (not (file-exists? "pages/Bar.md"))
                     "the renamed page's old file is removed"))
               (p/catch (fn [error] (is false (str error))))
               (p/finally (fn []
                            (markdown-mirror/set-enabled! test-repo false)
                            (done)))))))

(defn- with-mirror-enabled
  [done <f]
  (markdown-mirror/set-enabled! test-repo true)
  (-> (<f)
      (p/catch (fn [error] (is false (str error))))
      (p/finally (fn []
                   (markdown-mirror/set-enabled! test-repo false)
                   (done)))))

(defn- rename-page!
  [conn page-uuid title]
  (let [page-id (:db/id (d/entity @conn [:block/uuid page-uuid]))]
    (d/transact! conn [[:db/add page-id :block/title title]
                       [:db/add page-id :block/name (string/lower-case title)]])))

(def ^:private upper-uuid #uuid "11111111-1111-4111-8111-111111111111")
(def ^:private lower-uuid #uuid "22222222-2222-4222-8222-222222222222")

(defn- notes-pages-conn
  "`Notes` sorts first, so it keeps `pages/Notes.md` and `notes` gets the suffix."
  []
  (db-test/create-conn-with-blocks
   {:pages-and-blocks [{:page {:block/title "Notes" :block/uuid upper-uuid}
                        :blocks [{:block/title "upper body"}]}
                       {:page {:block/title "notes" :block/uuid lower-uuid}
                        :blocks [{:block/title "lower body"}]}]}))

(deftest a-departing-page-keeps-the-file-a-case-variant-takes-over-test
  (async done
         (let [{:keys [platform read-file file-exists?]} (fake-platform {:case-insensitive? true})
               conn (notes-pages-conn)]
           (with-mirror-enabled
            done
            #(p/let [_ (markdown-mirror/<mirror-repo! test-repo @conn {:platform platform})
                     _ (is (= ["pages/Notes.md" "pages/notes (2).md"]
                              (paths-by-uuid @conn [upper-uuid lower-uuid])))
                     tx-report (rename-page! conn upper-uuid "Other")
                     _ (markdown-mirror/<handle-tx-report! test-repo conn tx-report {:platform platform})]
               (is (= ["pages/Other.md" "pages/notes.md"]
                      (paths-by-uuid @conn [upper-uuid lower-uuid])))
               (is (string/includes? (str (read-file "pages/Other.md")) "upper body"))
               (is (string/includes? (str (read-file "pages/notes.md")) "lower body")
                   "the departing page's old path `pages/Notes.md` is the surviving page's file")
               (is (not (file-exists? "pages/notes (2).md"))
                   "the surviving page's old file is removed"))))))

(deftest a-case-only-rename-keeps-the-page-file-test
  (async done
         (let [{:keys [platform read-file]} (fake-platform {:case-insensitive? true})
               conn (db-test/create-conn-with-blocks
                     {:pages-and-blocks [{:page {:block/title "notes" :block/uuid lower-uuid}
                                          :blocks [{:block/title "lower body"}]}]})]
           (with-mirror-enabled
            done
            #(p/let [_ (markdown-mirror/<mirror-repo! test-repo @conn {:platform platform})
                     tx-report (rename-page! conn lower-uuid "Notes")
                     _ (markdown-mirror/<handle-tx-report! test-repo conn tx-report {:platform platform})]
               (is (string/includes? (str (read-file "pages/Notes.md")) "lower body")
                   "the old path `pages/notes.md` is the page's own new file"))))))

(deftest regenerating-removes-a-legacy-case-variant-file-test
  (async done
         (let [{:keys [platform put-file! read-file file-exists?]} (fake-platform)
               conn (notes-pages-conn)]
           ;; written on Linux before case variants were grouped: one file per exact title
           (put-file! "pages/Notes.md" "legacy upper")
           (put-file! "pages/notes.md" "legacy lower")
           (with-mirror-enabled
            done
            #(p/let [_ (markdown-mirror/<mirror-repo! test-repo @conn {:platform platform})]
               (is (string/includes? (str (read-file "pages/Notes.md")) "upper body"))
               (is (string/includes? (str (read-file "pages/notes (2).md")) "lower body"))
               (is (not (file-exists? "pages/notes.md"))
                   "the stale copy of the page that moved to `notes (2).md` is removed"))))))

(deftest regenerating-keeps-a-page-file-listed-under-another-case-test
  (async done
         (let [{:keys [platform put-file! read-file]} (fake-platform {:case-insensitive? true})
               conn (notes-pages-conn)]
           ;; the file system keeps the name `notes.md` when `pages/Notes.md` is written
           (put-file! "pages/notes.md" "legacy")
           (with-mirror-enabled
            done
            #(p/let [_ (markdown-mirror/<mirror-repo! test-repo @conn {:platform platform})]
               (is (string/includes? (str (read-file "pages/Notes.md")) "upper body"))
               (is (string/includes? (str (read-file "pages/notes (2).md")) "lower body")))))))

(deftest writing-a-moved-page-removes-its-legacy-file-test
  (async done
         (let [{:keys [platform put-file! read-file file-exists?]} (fake-platform)
               conn (notes-pages-conn)]
           (put-file! "pages/Notes.md" "legacy upper")
           (put-file! "pages/notes.md" "legacy lower")
           (with-mirror-enabled
            done
            #(p/let [block-id (:db/id (db-test/find-block-by-content @conn "lower body"))
                     tx-report (d/transact! conn [[:db/add block-id :block/title "lower body edited"]])
                     _ (markdown-mirror/<handle-tx-report! test-repo conn tx-report {:platform platform})]
               (is (string/includes? (str (read-file "pages/notes (2).md")) "lower body edited"))
               (is (file-exists? "pages/Notes.md") "the other page's file is kept")
               (is (not (file-exists? "pages/notes.md"))
                   "the stale copy at the page's pre-upgrade path is removed"))))))

(deftest node-platform-reads-mirror-dir-file-names-test
  (async done
         (let [root-dir (node-helper/create-tmp-dir "markdown-mirror-read-dir")]
           (-> (p/let [platform (platform-node/node-platform {:root-dir root-dir})
                       storage (:storage platform)
                       _ ((:write-text-atomic! storage) "graph-a/mirror/markdown/pages/page.md" "mirror")
                       names ((:read-dir! storage) "graph-a/mirror/markdown/pages")
                       missing ((:read-dir! storage) "graph-a/mirror/markdown/journals")]
                 (is (= ["page.md"] names))
                 (is (= [] missing) "a missing directory has no files"))
               (p/catch (fn [error] (is false (str error))))
               (p/finally done)))))
