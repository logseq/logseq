(ns frontend.worker.search-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.worker.search :as search]
            [logseq.db :as ldb]))

(defn- sql-placeholder-count
  [sql]
  (count (re-seq #"\?" sql)))

(defn- checking-db
  []
  #js {:exec (fn [opts]
               (let [sql (aget opts "sql")
                     bind (aget opts "bind")
                     expected (sql-placeholder-count sql)
                     actual (count bind)]
                 (when-not (= expected actual)
                   (throw (js/Error. (str "Bind index " (inc expected) " is out of range."))))
                 #js []))})

(deftest ensure-highlighted-snippet-adds-marker
  (testing "adds highlight markers for first matching term"
    (is (= "今天学习$pfts_2lqh>$中文$<pfts_2lqh$"
           (search/ensure-highlighted-snippet nil "今天学习中文" "中文")))
    (is (= "$pfts_2lqh>$今天$<pfts_2lqh$学习$pfts_2lqh>$中文$<pfts_2lqh$"
           (search/ensure-highlighted-snippet "今天学习$pfts_2lqh>$中文$<pfts_2lqh$" nil "今天 中文")))
    (is (= "Hello $pfts_2lqh>$World$<pfts_2lqh$"
           (search/ensure-highlighted-snippet nil "Hello World" "world")))
    (is (= "$pfts_2lqh>$Hello$<pfts_2lqh$ Clojure $pfts_2lqh>$World$<pfts_2lqh$"
           (search/ensure-highlighted-snippet "$pfts_2lqh>$Hello$<pfts_2lqh$ Clojure World" nil "hello world")))))

(deftest ensure-highlighted-snippet-keeps-existing
  (testing "keeps snippet when already highlighted"
    (is (= "Hi $pfts_2lqh>$Logseq$<pfts_2lqh$"
           (search/ensure-highlighted-snippet "Hi $pfts_2lqh>$Logseq$<pfts_2lqh$" "Hi Logseq" "logseq")))))

(deftest ensure-highlighted-snippet-preserves-original-title-case
  (testing "uses original title casing while keeping case-insensitive term matching"
    (let [snippet "clojure is a dynamic and $pfts_2lqh>$functional$<pfts_2lqh$ dialect of the programming $pfts_2lqh>$language$<pfts_2lqh$ lisp on the java platform."
          title "Clojure is a dynamic and functional dialect of the programming language Lisp on the Java platform."
          result (search/ensure-highlighted-snippet snippet title "functional language")]
      (is (= "Clojure is a dynamic and $pfts_2lqh>$functional$<pfts_2lqh$ dialect of the programming $pfts_2lqh>$language$<pfts_2lqh$ Lisp on the Java platform." result)))))

(deftest ensure-highlighted-snippet-no-match
  (testing "returns base text when no match"
    (is (= "Nothing here"
           (search/ensure-highlighted-snippet nil "Nothing here" "中文")))))

(deftest ensure-highlighted-snippet-appends-tail-ellipsis-when-truncated
  (testing "append trailing ... when result doesn't keep original text tail"
    (let [text (str "match starts here " (apply str (repeat 320 "x")))
          result (search/ensure-highlighted-snippet nil text "match")]
      (is (re-find #"\$pfts_2lqh>\$match\$<pfts_2lqh\$" result))
      (is (string/ends-with? result "...")))))

(deftest ensure-highlighted-snippet-windowed
  (testing "keeps prefix and shows window around match"
    (let [prefix (apply str (apply str (repeat 10 "甲乙丙丁戊己庚辛壬癸，子丑寅卯辰巳午未申酉戌亥。")))
          text (str prefix "Clojure是Lisp编程语言在Java平台上的现代、动态及函数式方言。")
          result (search/ensure-highlighted-snippet nil text "函数式")
          ellipsis "\u00A0\u00A0\u00A0...\u00A0\u00A0\u00A0"]
      (is (string/starts-with? result (str (subs prefix 0 50) ellipsis)))
      (is (re-find #"\u00A0\u00A0\u00A0\.\.\.\u00A0\u00A0\u00A0动态及\$pfts_2lqh>\$函数式\$<pfts_2lqh\$" result)))
    (let [prefix (apply str (repeat 10 "ABCDEFG, HIJKLMN, OPQRST, UVWXYZ."))
          text (str prefix "Clojure is a dynamic and functional dialect of the programming language Lisp on the Java platform.")
          result (search/ensure-highlighted-snippet nil text "functional")
          ellipsis "\u00A0\u00A0\u00A0...\u00A0\u00A0\u00A0"]
      (is (string/starts-with? result (str (subs prefix 0 50) ellipsis)))
      (is (re-find #"\u00A0\u00A0\u00A0\.\.\.\u00A0\u00A0\u00A0Clojure is a dynamic and \$pfts_2lqh>\$functional\$<pfts_2lqh\$" result)))))

(deftest ensure-highlighted-snippet-multi-term-merged
  (testing "two terms within distance merge into one window"
    (let [prefix (apply str (repeat 20 "甲乙丙丁戊己庚辛壬癸，子丑寅卯辰巳午未申酉戌亥。"))
          text (str prefix "Clojure是Lisp编程语言在Java平台上的现代、动态及函数式方言。")
          result (search/ensure-highlighted-snippet nil text "编程 函数式")
          ellipsis "\u00A0\u00A0\u00A0...\u00A0\u00A0\u00A0"]
      (is (string/starts-with? result (str (subs prefix 0 50) ellipsis)))
      (is (re-find #"\$pfts_2lqh>\$编程\$<pfts_2lqh\$语言在Java平台上的现代、动态及\$pfts_2lqh>\$函数式\$<pfts_2lqh\$" result))
      (is (re-find #"\u00A0\u00A0\u00A0\.\.\.\u00A0\u00A0\u00A0" result))
      (is (not (re-find #"\u00A0\u00A0\u00A0\.\.\.\u00A0\u00A0\u00A0.*\u00A0\u00A0\u00A0\.\.\.\u00A0\u00A0\u00A0" result))))
    (let [prefix (apply str (repeat 20 "ABCDEFG, HIJKLMN, OPQRST, UVWXYZ."))
          text (str prefix "Clojure is a dynamic and functional dialect of the programming language Lisp on the Java platform.")
          result (search/ensure-highlighted-snippet nil text "dynamic language")
          ellipsis "\u00A0\u00A0\u00A0...\u00A0\u00A0\u00A0"]
      (is (string/starts-with? result (str (subs prefix 0 50) ellipsis)))
      (is (re-find #"\$pfts_2lqh>\$dynamic\$<pfts_2lqh\$ and functional dialect of the programming \$pfts_2lqh>\$language\$<pfts_2lqh\$" result))
      (is (re-find #"\u00A0\u00A0\u00A0\.\.\.\u00A0\u00A0\u00A0" result))
      (is (not (re-find #"\u00A0\u00A0\u00A0\.\.\.\u00A0\u00A0\u00A0.*\u00A0\u00A0\u00A0\.\.\.\u00A0\u00A0\u00A0" result))))))

(deftest ensure-highlighted-snippet-multi-term-split
  (testing "two terms far apart split into two windows"
    (let [filler (apply str (repeat 20 "甲乙丙丁戊己庚辛壬癸，子丑寅卯辰巳午未申酉戌亥。"))
          text (str "君不见黄河之水天上来，" filler "奔流到海不复回")
          result (search/ensure-highlighted-snippet nil text "黄河 到海")]
      (is (string/starts-with? result "君不见$pfts_2lqh>$黄河$<pfts_2lqh$之水天上来，"))
      (is (re-find #"\u00A0\u00A0\u00A0\.\.\.\u00A0\u00A0\u00A0奔流\$pfts_2lqh>\$到海\$<pfts_2lqh\$" result))
      (is (not (re-find #"\u00A0\u00A0\u00A0\.\.\.\u00A0\u00A0\u00A0.*\u00A0\u00A0\u00A0\.\.\.\u00A0\u00A0\u00A0" result))))
    (let [prefix (apply str (repeat 20 "甲乙丙丁戊己庚辛壬癸，子丑寅卯辰巳午未申酉戌亥。"))
          far (apply str (repeat 20 "甲乙丙丁戊己庚辛壬癸，子丑寅卯辰巳午未申酉戌亥。"))
          text (str prefix "仙人抚我顶，" far "结发受长生")
          result (search/ensure-highlighted-snippet nil text "仙人 长生")
          ellipsis "\u00A0\u00A0\u00A0...\u00A0\u00A0\u00A0"]
      (is (string/starts-with? result (str (subs prefix 0 50) ellipsis)))
      (is (re-find #"\u00A0\u00A0\u00A0\.\.\.\u00A0\u00A0\u00A0\$pfts_2lqh>\$仙人\$<pfts_2lqh\$" result))
      (is (re-find #"\u00A0\u00A0\u00A0\.\.\.\u00A0\u00A0\u00A0结发受\$pfts_2lqh>\$长生\$<pfts_2lqh\$" result))
      (is (re-find #"\u00A0\u00A0\u00A0\.\.\.\u00A0\u00A0\u00A0.*\u00A0\u00A0\u00A0\.\.\.\u00A0\u00A0\u00A0" result)))
    (let [prefix (apply str (repeat 20 "ABCDEFG, HIJKLMN, OPQRST, UVWXYZ."))
          far (apply str (repeat 20 "ABCDEFG, HIJKLMN, OPQRST, UVWXYZ."))
          text (str prefix "life it seems will fade away, " far "now i will just say good-bye")
          result (search/ensure-highlighted-snippet nil text "fade say")
          ellipsis "\u00A0\u00A0\u00A0...\u00A0\u00A0\u00A0"]
      (is (string/starts-with? result (str (subs prefix 0 50) ellipsis)))
      (is (re-find #"\u00A0\u00A0\u00A0...\u00A0\u00A0\u00A0life it seems will \$pfts_2lqh>\$fade\$<pfts_2lqh\$" result))
      (is (re-find #"\u00A0\u00A0\u00A0...\u00A0\u00A0\u00A0now i will just \$pfts_2lqh>\$say\$<pfts_2lqh\$" result))
      (is (re-find #"\u00A0\u00A0\u00A0\.\.\.\u00A0\u00A0\u00A0.*\u00A0\u00A0\u00A0\.\.\.\u00A0\u00A0\u00A0" result)))
    (let [prefix (apply str (repeat 48 "A"))
          far (apply str (repeat 260 "B"))
          text (str prefix "token" far " ending target")
          result (search/ensure-highlighted-snippet nil text "token target")]
      (is (string/starts-with? result (str prefix "$pfts_2lqh>$token$<pfts_2lqh$")))
      (is (re-find #"\$pfts_2lqh>\$target\$<pfts_2lqh\$" result))
      (is (re-find #"\u00A0\u00A0\u00A0\.\.\.\u00A0\u00A0\u00A0" result))
      (is (not (re-find #"\u00A0\u00A0\u00A0\.\.\.\u00A0\u00A0\u00A0.*\u00A0\u00A0\u00A0\.\.\.\u00A0\u00A0\u00A0" result))))))

(deftest ensure-highlighted-snippet-overlap-prefers-non-overlap-hit
  (testing "highlights non-overlap occurrences when shorter query term overlaps longer one"
    (let [text "十步杀一人，千里不留行。北国风光，千里冰封，万里雪飘。"
          result (search/ensure-highlighted-snippet nil text "十步 杀一人")]
      (is (= "$pfts_2lqh>$十步$<pfts_2lqh$$pfts_2lqh>$杀一人$<pfts_2lqh$，千里不留行。北国风光，千里冰封，万里雪飘。"
             result)))
    (let [text "十步杀一人，千里不留行。北国风光，千里冰封，万里雪飘。"
          result (search/ensure-highlighted-snippet nil text "千里 千")]
      (is (= "十步杀一人，$pfts_2lqh>$千里$<pfts_2lqh$不留行。北国风光，$pfts_2lqh>$千$<pfts_2lqh$里冰封，万里雪飘。"
             result)))
    (let [text "十步杀一人，千里不留行。北国风光，千里冰封，万里雪飘。"
          result (search/ensure-highlighted-snippet nil text "千 千里")]
      (is (= "十步杀一人，$pfts_2lqh>$千里$<pfts_2lqh$不留行。北国风光，$pfts_2lqh>$千$<pfts_2lqh$里冰封，万里雪飘。"
             result)))
    (let [text "十步杀一人，千里不留行。北国风光，千里冰封，万里雪飘。"
          result (search/ensure-highlighted-snippet nil text "千里不留行 千里")]
      (is (= "十步杀一人，$pfts_2lqh>$千里不留行$<pfts_2lqh$。北国风光，$pfts_2lqh>$千里$<pfts_2lqh$冰封，万里雪飘。"
             result)))
    (let [text "十步杀一人，千里不留行。北国风光，千里冰封，万里雪飘。"
          result (search/ensure-highlighted-snippet nil text "千里不留行 千里不")]
      (is (= "十步杀一人，$pfts_2lqh>$千里不留行$<pfts_2lqh$。北国风光，千里冰封，万里雪飘。"
             result)))
    (let [text "Clojure is a dynamic and functional dialect of the programming language Lisp on the Java platform."
          result (search/ensure-highlighted-snippet nil text "programming i")]
      (is (= "Clojure $pfts_2lqh>$i$<pfts_2lqh$s a dynamic and functional dialect of the $pfts_2lqh>$programming$<pfts_2lqh$ language Lisp on the Java platform."
             result)))
    (let [text "Clojure is a dynamic and functional dialect of the programming language Lisp on the Java platform."
          result (search/ensure-highlighted-snippet nil text "functional f")]
      (is (= "Clojure is a dynamic and $pfts_2lqh>$functional$<pfts_2lqh$ dialect o$pfts_2lqh>$f$<pfts_2lqh$ the programming language Lisp on the Java platform."
             result)))
    (let [text "Clojure is a dynamic and functional dialect of the programming language Lisp on the Java platform."
          result (search/ensure-highlighted-snippet nil text "Clojure l")]
      (is (= "$pfts_2lqh>$Clojure$<pfts_2lqh$ is a dynamic and functiona$pfts_2lqh>$l$<pfts_2lqh$ dialect of the programming language Lisp on the Java platform."
             result)))
    (let [text "Clojure is a dynamic and functional dialect of the programming language Lisp on the Java platform."
          result (search/ensure-highlighted-snippet nil text "dynamic dy")]
      (is (= "Clojure is a $pfts_2lqh>$dynamic$<pfts_2lqh$ and functional dialect of the programming language Lisp on the Java platform."
             result)))))

(deftest code-block-predicate
  (testing "matches display-type code first"
    (with-redefs [ldb/page? (constantly false)
                  ldb/class-instance? (fn [_ _] false)]
      (is (true? (#'search/code-block? nil {:logseq.property.node/display-type :code})))
      (is (false? (#'search/code-block? nil {:logseq.property.node/display-type :math})))))

  (testing "falls back to Code class instance when display-type is missing"
    (with-redefs [ldb/page? (constantly false)
                  ldb/class-instance? (fn [code-class block]
                                        (and (= :code-class code-class)
                                             (= "code block" (:block/title block))))]
      (is (true? (#'search/code-block? :code-class {:block/title "code block"})))
      (is (false? (#'search/code-block? :code-class {:block/title "normal block"})))))

  (testing "excludes page entities in code-only mode"
    (with-redefs [ldb/page? (constantly true)
                  ldb/class-instance? (fn [_ _] true)]
      (is (false? (#'search/code-block? :code-class {:logseq.property.node/display-type :code}))))))

(deftest hidden-entity-includes-recycled-entities
  (testing "recycled roots are hidden"
    (is (true? (#'search/hidden-entity? {:logseq.property/deleted-at 1}))))

  (testing "entities on recycled pages are hidden"
    (is (true? (#'search/hidden-entity? {:block/page {:logseq.property/deleted-at 1}})))))

(deftest search-blocks-aux-bind-count
  (testing "namespace match SQL keeps bind count aligned"
    (let [sql "select id, page, title, rank from blocks_fts where title match ? or title match ? order by rank limit ?"
          result (#'search/search-blocks-aux (checking-db) sql "a/b" "a/b" nil 10 true)]
      (is (some? result))
      (is (empty? result))))

  (testing "namespace non-match SQL without page keeps bind count aligned"
    (let [sql "select id, page, title, rank from blocks_fts where title like ? limit ?"
          result (#'search/search-blocks-aux (checking-db) sql "a/" "%a/%" nil 10)]
      (is (some? result))
      (is (empty? result))))

  (testing "namespace non-match SQL with page keeps bind count aligned"
    (let [sql "select id, page, title, rank from blocks_fts where page = ? and title like ? limit ?"
          result (#'search/search-blocks-aux (checking-db) sql "a/" "%a/%" "page-1" 10)]
      (is (some? result))
      (is (empty? result)))))

(deftest search-blocks-large-graph-benchmark-regression
  (testing "cmd-k and autocomplete queries must not scan the full Datascript graph while typing"
    (let [db (checking-db)]
      (is (empty? (search/search-blocks (atom :large-db) db "alpha" {:limit 10}))))))

(deftest search-blocks-fuzzy-matches-from-search-db
  (testing "subsequence fuzzy matching comes from the search db without an in-memory index"
    (let [calls (atom [])
          db #js {:exec (fn [opts]
                          (let [sql (aget opts "sql")
                                bind (js->clj (aget opts "bind"))]
                            (swap! calls conj {:sql sql :bind bind})
                            (if (and (string/includes? sql "lower(title) like ?")
                                     (= "%n%w%p%" (first bind)))
                              (clj->js [["67e55044-10b1-426f-9247-bb680e5fe0c8"
                                         "67e55044-10b1-426f-9247-bb680e5fe0c8"
                                         "New Project"]])
                              #js [])))}]
      (with-redefs [search/combine-results (fn [_db results] results)
                    search/search-result->block-result
                    (fn [_conn _q _code-class _option result]
                      result)]
        (let [result (vec (search/search-blocks (atom :large-db) db "nwp" {:limit 10}))]
          (is (= [{:id "67e55044-10b1-426f-9247-bb680e5fe0c8"
                   :page "67e55044-10b1-426f-9247-bb680e5fe0c8"
                   :title "New Project"}]
                 (mapv #(select-keys % [:id :page :title]) result)))
          (is (pos? (:keyword-score (first result)))))
        (is (some #(= ["%n%w%p%" 40] (:bind %)) @calls))))))

(deftest search-blocks-fuzzy-prioritizes-page-candidates
  (testing "large graphs keep page rows in the bounded fuzzy candidate window"
    (let [page-id "67e55044-10b1-426f-9247-bb680e5fe0c8"
          block-id "8f14e45f-ea6e-4be8-b53f-bf0f2ca8a5db"
          calls (atom [])
          db #js {:exec (fn [opts]
                          (let [sql (aget opts "sql")]
                            (swap! calls conj sql)
                            (if (and (string/includes? sql "order by id = page desc")
                                     (string/includes? sql "lower(title) like ?"))
                              (clj->js [[page-id page-id "New Project"]
                                        [block-id page-id "New Project task"]])
                              (clj->js [[block-id page-id "New Project task"]]))))}]
      (with-redefs [search/combine-results (fn [_db results] results)
                    search/search-result->block-result
                    (fn [_conn _q _code-class _option result]
                      result)]
        (let [result (vec (search/search-blocks (atom :large-db) db "nwp" {:limit 10}))]
          (is (some #(= page-id (:id %)) result))
          (is (some #(string/includes? % "order by id = page desc") @calls)))))))

(defn- test-uuid-string
  [n]
  (let [hex (.toString n 16)]
    (str "00000000-0000-0000-0000-"
         (subs (str "000000000000" hex) (count hex)))))

(deftest combine-results-large-result-benchmark
  (testing "large search result sets combine without quadratic scans and keep page boost ranking"
    (let [ids (mapv test-uuid-string (range 1 2501))
          page-id (ids 42)
          keyword-results (map-indexed
                           (fn [idx id]
                             {:id id
                              :title (str "Result " idx)
                              :keyword-score (if (= id page-id) 0.5 1.0)})
                           ids)
          blocks (into {}
                       (map-indexed
                        (fn [idx id]
                          [id {:db/id idx
                               :block/uuid (uuid id)
                               :block/title (str "Result " idx)
                               :page? (= id page-id)}])
                        ids))]
      (with-redefs [d/entity (fn [_db [_attr id]]
                               (get blocks (str id)))
                    d/pull-many (fn [_db _selector lookup-refs]
                                  (mapv (fn [[_attr id]]
                                          (get blocks (str id)))
                                        lookup-refs))
                    ldb/hidden? (constantly false)
                    ldb/page? :page?]
        (let [started (system-time)
              result (doall (search/combine-results :db keyword-results))
              elapsed-ms (- (system-time) started)]
          (is (< elapsed-ms 40)
              (str "combine-results should stay fast for large result sets, took " elapsed-ms "ms"))
          (is (= (count ids) (count result)))
          (is (= page-id (:id (first result)))
              "page boost should still rank matching pages ahead of equally relevant blocks"))))))

(deftest search-blocks-applies-final-limit
  (testing "cmd-k only materializes the requested number of combined results"
    (let [rows (mapv (fn [n]
                       {:id (test-uuid-string n)
                        :page (test-uuid-string n)
                        :title (str "logseq result " n)
                        :keyword-score 1})
                     (range 1 101))]
      (with-redefs [search/combine-results (fn [_db results]
                                             (doall results)
                                             rows)
                    search/search-result->block-result
                    (fn [_conn _q _code-class _option result]
                      result)]
        (is (= 10
               (count (search/search-blocks (atom :large-db)
                                            (checking-db)
                                            "logseq"
                                            {:limit 10 :enable-snippet? false}))))))))

(deftest search-blocks-can-return-matched-count
  (testing "cmd-k can show total matched nodes while returning the first page only"
    (let [rows (mapv (fn [n]
                       {:id (test-uuid-string n)
                        :page (test-uuid-string n)
                        :title (str "logseq result " n)
                        :keyword-score 1})
                     (range 1 101))
          blocks (into {}
                       (map (fn [{:keys [id title]}]
                              [id {:db/id id
                                   :block/uuid (uuid id)
                                   :block/title title}])
                            rows))]
      (with-redefs [search/combine-results (fn [_db results]
                                             (doall results)
                                             rows)
                    d/entity (fn [_db [_attr id]]
                               (get blocks (str id)))
                    ldb/page? (constantly false)
                    ldb/built-in? (constantly false)]
        (let [result (search/search-blocks (atom :large-db)
                                           (checking-db)
                                           "logseq"
                                           {:limit 10
                                            :enable-snippet? false
                                            :include-matched-count? true})]
          (is (= 10 (count (:items result))))
          (is (= 100 (:matched-count result))))))))

(deftest search-result-omits-empty-optional-fields
  (testing "search responses avoid serializing nil optional fields for every row"
    (let [block-id #uuid "00000000-0000-0000-0000-000000000123"
          block {:db/id 1
                 :block/uuid block-id
                 :block/title "logseq result"}]
      (with-redefs [d/entity (fn [_db [_attr id]]
                               (when (= id block-id)
                                 block))
                    ldb/page? (constantly false)
                    ldb/built-in? (constantly false)]
        (let [result (#'search/search-result->block-result
                      (atom :db)
                      "logseq"
                      nil
                      {:enable-snippet? false}
                      {:id (str block-id)
                       :page (str block-id)
                       :title "logseq result"})]
          (is (= "logseq result" (:block/title result)))
          (is (not (contains? result :block/parent)))
          (is (not (contains? result :block/tags)))
          (is (not (contains? result :logseq.property/icon)))
          (is (not (contains? result :alias))))))))

(deftest upsert-blocks-batches-rows-into-single-sql-statement
  (let [calls (atom [])
        tx #js {:exec (fn [opts]
                        (swap! calls conj {:sql (aget opts "sql")
                                           :bind (js->clj (aget opts "bind"))}))}
        db #js {:transaction (fn [f] (f tx))}
        blocks (clj->js [{:id "67e55044-10b1-426f-9247-bb680e5fe0c8"
                          :title "alpha"
                          :page "67e55044-10b1-426f-9247-bb680e5fe0c8"}
                         {:id "8f14e45f-ea6e-4be8-b53f-bf0f2ca8a5db"
                          :title "beta"
                          :page "8f14e45f-ea6e-4be8-b53f-bf0f2ca8a5db"}
                         {:id "9d5ed678-fe57-4bcf-bf4d-6f2fd5f8995d"
                          :title "gamma"
                          :page "9d5ed678-fe57-4bcf-bf4d-6f2fd5f8995d"}])]
    (search/upsert-blocks! db blocks)
    (is (= 1 (count @calls)))
    (is (= "INSERT INTO blocks (id, title, page) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?) ON CONFLICT (id) DO UPDATE SET (title, page) = (excluded.title, excluded.page)"
           (:sql (first @calls))))
    (is (= ["67e55044-10b1-426f-9247-bb680e5fe0c8" "alpha" "67e55044-10b1-426f-9247-bb680e5fe0c8"
            "8f14e45f-ea6e-4be8-b53f-bf0f2ca8a5db" "beta" "8f14e45f-ea6e-4be8-b53f-bf0f2ca8a5db"
            "9d5ed678-fe57-4bcf-bf4d-6f2fd5f8995d" "gamma" "9d5ed678-fe57-4bcf-bf4d-6f2fd5f8995d"]
           (:bind (first @calls))))))

(deftest upsert-blocks-throws-on-invalid-input
  (let [tx #js {:exec (fn [_opts] nil)}
        db #js {:transaction (fn [f] (f tx))}
        error (try
                (search/upsert-blocks! db (clj->js [{:id "not-uuid" :title "alpha" :page "not-uuid"}]))
                nil
                (catch :default e e))]
    (is (some? error))
    (is (re-find #"Search upsert-blocks wrong data"
                 (or (ex-message error) (str error))))))
