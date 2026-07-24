(ns frontend.worker.search-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.worker.search :as search]
            [frontend.worker.search-benchmark :as search-benchmark]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]))

(defn- process-cpu-time-ms
  []
  (let [usage (.cpuUsage js/process)]
    (/ (+ (.-user usage) (.-system usage)) 1000)))

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
    (let [sql "select id, page, title, rank from blocks_fts where title match ? or title match ? limit ?"
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

(deftest search-blocks-escapes-quotes-for-fts
  (testing "user quote characters are escaped before SQLite FTS receives them"
    (let [fts-binds (atom [])
          db #js {:exec (fn [opts]
                          (let [sql (aget opts "sql")
                                bind (js->clj (aget opts "bind"))]
                            (when (string/includes? sql "title match ?")
                              (swap! fts-binds conj (first bind)))
                            #js []))}]
      (with-redefs [search/combine-results (fn [_db results] results)
                    d/db? (constantly false)
                    search/search-result->block-result
                    (fn [_conn _q _code-class _option result]
                      result)]
        (is (empty? (search/search-blocks (atom :large-db) db "\"" {:limit 10})))
        (is (empty? (search/search-blocks (atom :large-db) db "foo \"bar" {:limit 10})))
        (is (empty? (search/search-blocks (atom :large-db) db "foo \"bar AND baz" {:limit 10})))
        (is (empty? (search/search-blocks (atom :large-db) db "foo \"bar or baz" {:limit 10})))
        (is (empty? (search/search-blocks (atom :large-db) db "foo \"bar not baz" {:limit 10})))
        (is (= ["\"\"\"\"*"
                "\"foo \"\"bar\"*"
                "\"foo \"\"bar AND baz\"*"
                "\"foo \"\"bar OR baz\"*"
                "\"foo \"\"bar NOT baz\"*"]
               @fts-binds))))))

(deftest search-blocks-quotes-dangling-boolean-operators-for-fts
  (testing "dangling boolean operators are treated as literal text before SQLite FTS receives them"
    (let [fts-binds (atom [])
          db #js {:exec (fn [opts]
                          (let [sql (aget opts "sql")
                                bind (js->clj (aget opts "bind"))]
                            (when (string/includes? sql "title match ?")
                              (swap! fts-binds conj (first bind)))
                            #js []))}]
      (with-redefs [search/combine-results (fn [_db results] results)
                    search/search-result->block-result
                    (fn [_conn _q _code-class _option result]
                      (assoc result :block/uuid (uuid (:id result))))]
        (is (empty? (search/search-blocks (atom :large-db) db "xxx and " {:limit 10})))
        (is (empty? (search/search-blocks (atom :large-db) db "xxx AND " {:limit 10})))
        (is (empty? (search/search-blocks (atom :large-db) db "xxx or " {:limit 10})))
        (is (empty? (search/search-blocks (atom :large-db) db "xxx NOT " {:limit 10})))
        (is (empty? (search/search-blocks (atom :large-db) db "xxx & " {:limit 10})))
        (is (empty? (search/search-blocks (atom :large-db) db "xxx | " {:limit 10})))
        (is (= ["\"xxx AND \"*"
                "\"xxx AND \"*"
                "\"xxx OR \"*"
                "\"xxx NOT \"*"
                "\"xxx AND \"*"
                "\"xxx OR \"*"]
               @fts-binds))))))

(deftest search-blocks-large-graph-benchmark-regression
  (testing "cmd-k and autocomplete queries must not scan the full Datascript graph while typing"
    (let [calls (atom [])
          db #js {:exec (fn [opts]
                          (let [sql (aget opts "sql")
                                bind (aget opts "bind")
                                expected (sql-placeholder-count sql)
                                actual (count bind)]
                            (swap! calls conj sql)
                            (when-not (= expected actual)
                              (throw (js/Error. (str "Bind index " (inc expected) " is out of range."))))
                            #js []))}]
      (is (empty? (search/search-blocks (atom :large-db) db "alpha" {:limit 10})))
      (is (not-any? #(string/includes? % "order by rank") @calls)))))

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
                      (assoc result :block/uuid (uuid (:id result))))]
        (let [result (vec (search/search-blocks (atom :large-db) db "nwp" {:limit 10}))]
          (is (= [{:id "67e55044-10b1-426f-9247-bb680e5fe0c8"
                   :page "67e55044-10b1-426f-9247-bb680e5fe0c8"
                   :title "New Project"}]
                 (mapv #(select-keys % [:id :page :title]) result)))
          (is (pos? (:keyword-score (first result)))))
        (is (some #(= ["%n%w%p%" 40] (:bind %)) @calls))))))

(deftest search-blocks-fuzzy-prioritizes-page-candidates
  (testing "large graphs keep page rows first without sorting the whole blocks table"
    (let [page-id "67e55044-10b1-426f-9247-bb680e5fe0c8"
          block-id "8f14e45f-ea6e-4be8-b53f-bf0f2ca8a5db"
          calls (atom [])
          db #js {:exec (fn [opts]
                          (let [sql (aget opts "sql")]
                            (swap! calls conj sql)
                            (cond
                              (string/includes? sql "title = ? COLLATE NOCASE")
                              #js []

                              (and (string/includes? sql "id = page")
                                   (string/includes? sql "lower(title) like ?"))
                              (clj->js [[page-id page-id "New Project"]])

                              :else
                              (clj->js [[block-id page-id "New Project task"]]))))}]
      (with-redefs [search/combine-results (fn [_db results] results)
                    search/search-result->block-result
                    (fn [_conn _q _code-class _option result]
                      result)]
        (let [result (vec (search/search-blocks (atom :large-db) db "nwp" {:limit 10}))]
          (is (some #(= page-id (:id %)) result))
          (is (= page-id (:id (first result))))
          (is (some #(string/includes? % "id = page") @calls))
          (is (not-any? #(string/includes? % "order by id = page desc") @calls)))))))

(deftest search-blocks-skips-fuzzy-for-multi-term-keyword-hits
  (testing "exact multi-term FTS hits do not pay a broad fuzzy LIKE scan"
    (let [page-id "29089538-74f7-44b6-954b-494ca9e82182"
          calls (atom [])
          db #js {:exec (fn [opts]
                          (let [sql (aget opts "sql")]
                            (swap! calls conj sql)
                            (cond
                              (string/includes? sql "lower(title) like ?")
                              (throw (js/Error. "fuzzy LIKE should not run"))

                              (string/includes? sql "title match ?")
                              (clj->js [[page-id page-id "Page-10000" -16 nil]])

                              :else
                              #js [])))}]
      (with-redefs [search/combine-results (fn [_db results] results)
                    search/search-result->block-result
                    (fn [_conn _q _code-class _option result]
                      result)]
        (let [result (vec (search/search-blocks (atom :large-db)
                                                db
                                                "page 10000"
                                                {:limit 10}))]
          (is (= [{:id page-id
                   :page page-id
                   :title "Page-10000"}]
                 (mapv #(select-keys % [:id :page :title]) result)))
          (is (some #(string/includes? % "title match ?") @calls))
          (is (not-any? #(string/includes? % "lower(title) like ?") @calls)))))))

(defn- test-uuid-string
  [n]
  (let [hex (.toString n 16)]
    (str "00000000-0000-0000-0000-"
         (subs (str "000000000000" hex) (count hex)))))

(deftest search-blocks-skips-fts-for-enough-exact-title-hits
  (testing "very common exact titles avoid expensive FTS scans"
    (let [calls (atom [])
          exact-rows (mapv (fn [n]
                             [(test-uuid-string n)
                              (test-uuid-string 999)
                              "Block"])
                           (range 100 200))
          db #js {:exec (fn [opts]
                          (let [sql (aget opts "sql")]
                            (swap! calls conj sql)
                            (cond
                              (string/includes? sql "title = ? COLLATE NOCASE")
                              (clj->js exact-rows)

                              (string/includes? sql "title match ?")
                              (throw (js/Error. "FTS should not run"))

                              (string/includes? sql "lower(title) like ?")
                              (throw (js/Error. "fuzzy LIKE should not run"))

                              :else
                              #js [])))}]
      (with-redefs [search/combine-results (fn [_db results] results)
                    search/search-result->block-result
                    (fn [_conn _q _code-class _option result]
                      (assoc result :block/uuid (uuid (:id result))))]
        (let [result (vec (search/search-blocks (atom :large-db)
                                                db
                                                "block"
                                                {:limit 10
                                                 :search-limit 100}))]
          (is (= 10 (count result)))
          (is (every? #(= "Block" (:title %)) result))
          (is (some #(string/includes? % "title = ? COLLATE NOCASE") @calls))
          (is (not-any? #(string/includes? % "title match ?") @calls))
          (is (not-any? #(string/includes? % "lower(title) like ?") @calls)))))))

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
        (let [started (process-cpu-time-ms)
              result (doall (search/combine-results :db keyword-results))
              elapsed-ms (- (process-cpu-time-ms) started)]
          (is (< elapsed-ms 200)
              (str "combine-results should stay fast for large result sets, took " elapsed-ms "ms CPU"))
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
                    d/db? (constantly false)
                    search/search-result->block-result
                    (fn [_conn _q _code-class _option result]
                      (assoc result :block/uuid (uuid (:id result))))]
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

(deftest search-result-keeps-tag-identities-for-ui-entity-predicates
  (let [page-id #uuid "00000000-0000-0000-0000-000000000124"
        page-tag {:db/id 2
                  :db/ident :logseq.class/Page
                  :block/title "Page"}
        page {:db/id 1
              :block/uuid page-id
              :block/title "Foo"
              :block/tags [page-tag]}]
    (with-redefs [d/entity (fn [_db [_attr id]]
                             (when (= id page-id)
                               page))
                  ldb/page? (constantly true)
                  ldb/built-in? (constantly false)
                  ldb/hidden? (constantly false)]
      (let [result (#'search/search-result->block-result
                    (atom :db)
                    "Foo"
                    nil
                    {:enable-snippet? false}
                    {:id (str page-id)
                     :page (str page-id)
                     :title "Foo"})]
        (is (= [page-tag] (:block/tags result)))))))

(deftest block-index-includes-page-alias-titles
  (testing "page aliases can be matched by page-ref autocomplete search"
    (let [page-id #uuid "00000000-0000-0000-0000-000000000234"
          page {:db/id 1
                :block/uuid page-id
                :block/title "Artificial Intelligence"
                :block/alias [{:db/id 2
                               :block/uuid #uuid "00000000-0000-0000-0000-000000000235"
                               :block/title "ai"}]}]
      (with-redefs [ldb/page? (fn [entity] (= (:db/id entity) (:db/id page)))
                    ldb/object? (constantly false)
                    ldb/journal? (constantly false)
                    ldb/closed-value? (constantly false)
                    ldb/hidden? (constantly false)
                    ldb/get-title-with-parents (fn [entity] (:block/title entity))]
        (let [indexed (search/block->index page)]
          (is (= (str page-id) (:id indexed)))
          (is (= "Artificial Intelligence ai" (:title indexed))))))))

(deftest block-index-does-not-generate-vector-embedding
  (testing "desktop vector embeddings are supplied by the platform embedding backend"
    (let [block-id #uuid "00000000-0000-0000-0000-000000000238"
          page-id #uuid "00000000-0000-0000-0000-000000000239"
          block {:db/id 1
                 :block/uuid block-id
                 :block/title "Local-first semantic search"
                 :block/page {:block/uuid page-id}}]
      (with-redefs [ldb/page? (constantly false)
                    ldb/object? (constantly false)
                    ldb/journal? (constantly false)
                    ldb/closed-value? (constantly false)
                    ldb/get-title-with-parents (fn [entity] (:block/title entity))]
        (let [indexed (search/block->index block)]
          (is (= "Local-first semantic search" (:title indexed)))
          (is (not (contains? indexed :embedding))))))))

(deftest block-index-includes-own-title-vector-title-when-enabled
  (testing "vector-only text uses the same indexed block title without local block context"
    (let [page-id #uuid "00000000-0000-0000-0000-000000000240"
          block-id #uuid "00000000-0000-0000-0000-000000000241"
          page {:db/id 1
                :page? true
                :block/uuid page-id
                :block/title "Search Design"}
          grandparent {:db/id 2
                       :block/uuid #uuid "00000000-0000-0000-0000-000000000242"
                       :block/title "Architecture"
                       :block/parent page}
          parent {:db/id 3
                  :block/uuid #uuid "00000000-0000-0000-0000-000000000243"
                  :block/title "Vector index"
                  :block/parent grandparent}
          prev-sibling {:db/id 4
                        :block/uuid #uuid "00000000-0000-0000-0000-000000000244"
                        :block/title "Keyword search"
                        :block/order "a"}
          sibling-anchor {:db/id 5
                          :block/uuid block-id
                          :block/title "Hybrid retrieval"
                          :block/order "b"}
          next-sibling {:db/id 6
                        :block/uuid #uuid "00000000-0000-0000-0000-000000000245"
                        :block/title "Ranking policy"
                        :block/order "c"}
          child {:db/id 7
                 :block/uuid #uuid "00000000-0000-0000-0000-000000000246"
                 :block/title "Cross block context"
                 :block/order "a"}
          block (assoc sibling-anchor
                       :block/page page
                       :block/parent (assoc parent :block/_parent [prev-sibling sibling-anchor next-sibling])
                       :block/_parent [child])]
      (with-redefs [ldb/page? (fn [entity] (true? (:page? entity)))
                    ldb/object? (constantly false)
                    ldb/journal? (constantly false)
                    ldb/closed-value? (constantly false)
                    ldb/hidden? (constantly false)
                    ldb/get-title-with-parents (fn [entity] (:block/title entity))]
        (let [indexed (search/block->index block {:include-vector-title? true})]
          (is (= "Hybrid retrieval" (:title indexed)))
          (is (= "Hybrid retrieval" (:vector-title indexed))))))))

(deftest block-index-skips-vector-title-when-disabled
  (let [block-id #uuid "00000000-0000-0000-0000-000000000247"
        page-id #uuid "00000000-0000-0000-0000-000000000248"
        block {:db/id 1
               :block/uuid block-id
               :block/title "Hybrid retrieval"
               :block/page {:block/uuid page-id}}]
    (with-redefs [ldb/page? (constantly false)
                  ldb/object? (constantly false)
                  ldb/journal? (constantly false)
                  ldb/closed-value? (constantly false)
                  ldb/get-title-with-parents (fn [entity] (:block/title entity))]
      (let [indexed (search/block->index block)]
        (is (= "Hybrid retrieval" (:title indexed)))
        (is (not (contains? indexed :vector-title)))))))

(deftest build-blocks-indice-uses-block-index
  (testing "large pages do not sort siblings for vector title context"
    (let [page-id #uuid "00000000-0000-0000-0000-000000000250"
          page {:db/id 1
                :page? true
                :block/uuid page-id
                :block/title "Search Perf"}
          blocks (mapv (fn [idx]
                         {:db/id (+ 100 idx)
                          :block/uuid (uuid (test-uuid-string (+ 250 idx)))
                          :block/title (str "Sibling " idx)
                          :block/order idx
                          :block/parent page
                          :block/page page})
                       (range 40))
          page (assoc page :block/_parent blocks)
          blocks (mapv #(assoc % :block/parent page) blocks)
          sort-calls (atom 0)]
      (with-redefs [search/get-all-blocks (fn [_db] blocks)
                    ldb/sort-by-order (fn [children]
                                        (swap! sort-calls inc)
                                        (sort-by :block/order children))
                    ldb/page? (fn [entity] (true? (:page? entity)))
                    ldb/object? (constantly false)
                    ldb/journal? (constantly false)
                    ldb/closed-value? (constantly false)
                    ldb/hidden? (constantly false)
                    ldb/get-title-with-parents (fn [entity] (:block/title entity))]
        (let [indexed (search/build-blocks-indice :db {:include-vector-title? true})]
          (is (= 40 (count indexed)))
          (is (zero? @sort-calls))
          (is (every? #(= (:title %) (:vector-title %)) indexed)))))))

(deftest sync-search-indice-indexes-only-directly-affected-blocks
  (testing "moving a block under a parent does not expand indexing to the parent"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Teams"}
                                     :blocks [{:block/title "which team is Manu in?"}
                                              {:block/title "Spurs"}]}]})
          manu (db-test/find-block-by-content @conn "which team is Manu in?")
          spurs (db-test/find-block-by-content @conn "Spurs")
          tx-report (d/transact! conn [[:db/add (:db/id spurs) :block/parent (:db/id manu)]])
          blocks-to-add (:blocks-to-add (search/sync-search-indice tx-report {:include-vector-title? true}))
          spurs-index (some #(when (= "Spurs" (:title %)) %) blocks-to-add)
          titles (set (map :title blocks-to-add))]
      (is (contains? titles "Spurs"))
      (is (not (contains? titles "which team is Manu in?")))
      (is (= "Spurs" (:vector-title spurs-index)))))

  (testing "reordering a sibling does not expand indexing to adjacent siblings"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Teams"}
                                     :blocks [{:block/title "Spurs"
                                               :block/order "a"}
                                              {:block/title "Which team is Tony in?"
                                               :block/order "b"}]}]})
          spurs (db-test/find-block-by-content @conn "Spurs")
          tx-report (d/transact! conn [[:db/add (:db/id spurs) :block/order "c"]])
          blocks-to-add (:blocks-to-add (search/sync-search-indice tx-report {:include-vector-title? true}))
          spurs-index (some #(when (= "Spurs" (:title %)) %) blocks-to-add)
          titles (set (map :title blocks-to-add))]
      (is (contains? titles "Spurs"))
      (is (not (contains? titles "Which team is Tony in?")))
      (is (= "Spurs" (:vector-title spurs-index))))))

(deftest sync-search-indice-reindexes-descendant-pages-when-page-parent-changes
  (let [parent-a-uuid (random-uuid)
        parent-b-uuid (random-uuid)
        child-uuid (random-uuid)
        grandchild-uuid (random-uuid)
        conn (db-test/create-conn)
        page-tag :logseq.class/Page]
    (d/transact! conn [{:block/uuid parent-a-uuid
                        :block/title "Parent A"
                        :block/name "parent a"
                        :block/tags [page-tag]}
                       {:block/uuid parent-b-uuid
                        :block/title "Parent B"
                        :block/name "parent b"
                        :block/tags [page-tag]}
                       {:block/uuid child-uuid
                        :block/title "Child Page"
                        :block/name "child page"
                        :block/tags [page-tag]
                        :block/parent [:block/uuid parent-a-uuid]
                        :block/order "a"}
                       {:block/uuid grandchild-uuid
                        :block/title "Grand Page"
                        :block/name "grand page"
                        :block/tags [page-tag]
                        :block/parent [:block/uuid child-uuid]
                        :block/order "a"}])
    (let [tx-report (d/transact! conn [[:db/add [:block/uuid child-uuid]
                                        :block/parent [:block/uuid parent-b-uuid]]])
          blocks-to-add (:blocks-to-add (search/sync-search-indice tx-report {:include-vector-title? true}))
          titles (set (map :title blocks-to-add))]
      (is (contains? titles "Parent B/Child Page"))
      (is (contains? titles "Parent B/Child Page/Grand Page"))
      (is (every? #(= (:title %) (:vector-title %)) blocks-to-add)))))

(deftest sync-search-indice-skips-vector-title-when-disabled
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "Teams"}
                                   :blocks [{:block/title "Spurs"}]}]})
        spurs (db-test/find-block-by-content @conn "Spurs")
        tx-report (d/transact! conn [[:db/add (:db/id spurs) :block/title "San Antonio Spurs"]])
        blocks-to-add (:blocks-to-add (search/sync-search-indice tx-report))
        spurs-index (some #(when (= "San Antonio Spurs" (:title %)) %) blocks-to-add)]
    (is (some? spurs-index))
    (is (not (contains? spurs-index :vector-title)))))

(def ^:private sync-search-indice-performance-block-count 300)
(def ^:private sync-search-indice-performance-max-ms 1000)

(defn- run-sync-search-indice-new-blocks-case
  [include-vector-title?]
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "Bulk Insert"}}]})
        page (db-test/find-page-by-title @conn "Bulk Insert")
        now 1760000000000
        tx-report (d/transact! conn
                               (mapv (fn [idx]
                                       {:block/uuid (random-uuid)
                                        :block/title (str "Inserted " idx)
                                        :block/page (:db/id page)
                                        :block/parent (:db/id page)
                                        :block/order (str "a" idx)
                                        :block/created-at now
                                        :block/updated-at now})
                                     (range sync-search-indice-performance-block-count)))
        started (process-cpu-time-ms)
        blocks-to-add (:blocks-to-add
                       (search/sync-search-indice
                        tx-report
                        {:include-vector-title? include-vector-title?}))
        elapsed-ms (- (process-cpu-time-ms) started)]
    {:blocks-to-add blocks-to-add
     :elapsed-ms elapsed-ms}))

(deftest sync-search-indice-300-new-blocks-performance-when-semantic-search-enabled
  (let [{:keys [blocks-to-add elapsed-ms]} (run-sync-search-indice-new-blocks-case true)]
    (println (str "sync-search-indice 300 new blocks with semantic search enabled took " elapsed-ms "ms CPU"))
    (is (= sync-search-indice-performance-block-count (count blocks-to-add)))
    (is (< elapsed-ms sync-search-indice-performance-max-ms))
    (is (every? :vector-title blocks-to-add))
    (is (every? #(= (:title %) (:vector-title %)) blocks-to-add))))

(deftest sync-search-indice-300-new-blocks-performance-when-semantic-search-disabled
  (let [{:keys [blocks-to-add elapsed-ms]} (run-sync-search-indice-new-blocks-case false)]
    (println (str "sync-search-indice 300 new blocks with semantic search disabled took " elapsed-ms "ms CPU"))
    (is (= sync-search-indice-performance-block-count (count blocks-to-add)))
    (is (< elapsed-ms sync-search-indice-performance-max-ms))
    (is (not-any? #(contains? % :vector-title) blocks-to-add))))

(deftest sync-search-indice-300-new-blocks-does-not-check-page-descendants
  (let [page-checks (atom 0)]
    (with-redefs [ldb/page? (fn [_entity]
                              (swap! page-checks inc)
                              false)]
      (let [{:keys [blocks-to-add]} (run-sync-search-indice-new-blocks-case true)]
        (is (= sync-search-indice-performance-block-count (count blocks-to-add)))
        (is (<= @page-checks (* 2 sync-search-indice-performance-block-count)))))))

(deftest sync-search-indice-removes-page-descendants-when-page-is-deleted
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "Deleted page"}
                                   :blocks [{:block/title "Parent"
                                             :build/children [{:block/title "Child"}]}]}]})
        page (db-test/find-page-by-title @conn "Deleted page")
        parent (db-test/find-block-by-content @conn "Parent")
        child (db-test/find-block-by-content @conn "Child")
        tx-report (d/transact! conn [[:db/add (:db/id page) :logseq.property/deleted-at 1760000000000]])
        blocks-to-remove-set (:blocks-to-remove-set (search/sync-search-indice tx-report))]
    (is (contains? blocks-to-remove-set (str (:block/uuid page))))
    (is (contains? blocks-to-remove-set (str (:block/uuid parent))))
    (is (contains? blocks-to-remove-set (str (:block/uuid child))))))

(deftest sync-search-indice-removes-block-descendants-when-parent-block-is-deleted
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "Deleted block"}
                                   :blocks [{:block/title "Parent"
                                             :build/children [{:block/title "Child"}]}]}]})
        parent (db-test/find-block-by-content @conn "Parent")
        child (db-test/find-block-by-content @conn "Child")
        tx-report (d/transact! conn [[:db/add (:db/id parent) :logseq.property/deleted-at 1760000000000]])
        blocks-to-remove-set (:blocks-to-remove-set (search/sync-search-indice tx-report))]
    (is (contains? blocks-to-remove-set (str (:block/uuid parent))))
    (is (contains? blocks-to-remove-set (str (:block/uuid child))))))

(deftest sync-search-indice-removes-block-descendants-when-parent-becomes-hidden
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "Hidden move"}
                                   :blocks [{:block/title "Hidden parent"
                                             :logseq.property/hide? true}
                                            {:block/title "Moved parent"
                                             :build/children [{:block/title "Moved child"}]}]}]})
        hidden-parent (db-test/find-block-by-content @conn "Hidden parent")
        moved-parent (db-test/find-block-by-content @conn "Moved parent")
        moved-child (db-test/find-block-by-content @conn "Moved child")
        tx-report (d/transact! conn [[:db/add (:db/id moved-parent) :block/parent (:db/id hidden-parent)]])
        blocks-to-remove-set (:blocks-to-remove-set (search/sync-search-indice tx-report))]
    (is (contains? blocks-to-remove-set (str (:block/uuid moved-parent))))
    (is (contains? blocks-to-remove-set (str (:block/uuid moved-child))))))

(deftest sync-search-indice-adds-block-descendants-when-parent-becomes-visible
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "Visible move"}
                                   :blocks [{:block/title "Hidden parent"
                                             :logseq.property/hide? true
                                             :build/children [{:block/title "Moved parent"
                                                               :build/children [{:block/title "Moved child"}]}]}]}]})
        page (db-test/find-page-by-title @conn "Visible move")
        moved-parent (db-test/find-block-by-content @conn "Moved parent")
        tx-report (d/transact! conn [[:db/add (:db/id moved-parent) :block/parent (:db/id page)]])
        blocks-to-add (:blocks-to-add (search/sync-search-indice tx-report))
        titles (set (map :title blocks-to-add))]
    (is (contains? titles "Moved parent"))
    (is (contains? titles "Moved child"))))

(deftest search-blocks-includes-vector-only-results
  (testing "zvec vector hits are merged into desktop search even when SQLite has no keyword hit"
    (let [page-id (test-uuid-string 900)
          vector-id (test-uuid-string 901)
          blocks {vector-id {:db/id 901
                             :block/uuid (uuid vector-id)
                             :block/title "Semantic only result"
                             :block/page {:block/uuid (uuid page-id)}}}
          query-embedding [0.1 0.2 0.3]
          vector-queries (atom [])
          vector-index {:query (fn [embedding limit page]
                                 (swap! vector-queries conj {:embedding embedding
                                                             :limit limit
                                                             :page page})
                                 [{:id vector-id
                                   :page page-id
                                   :vector-score 0.91}])}]
      (with-redefs [d/entity (fn [_db [_attr id]]
                               (get blocks (str id)))
                    d/pull-many (fn [_db _selector lookup-refs]
                                  (mapv (fn [[_attr id]]
                                          (get blocks (str id)))
                                        lookup-refs))
                    ldb/hidden? (constantly false)
                    ldb/page? (constantly false)
                    ldb/built-in? (constantly false)]
        (let [result (vec (search/search-blocks (atom :db)
                                                (checking-db)
                                                vector-index
                                                "meaning based query"
                                                {:limit 10
                                                 :enable-snippet? false
                                                 :feature/enable-semantic-search? true
                                                 :query-embedding query-embedding}))]
          (is (= [{:db/id 901
                   :block/title "Semantic only result"}]
                 (mapv #(select-keys % [:db/id :block/title]) result)))
          (is (= 1 (count @vector-queries)))
          (is (= query-embedding
                 (:embedding (first @vector-queries)))))))))

(deftest search-blocks-excludes-built-in-class-vector-results-when-built-ins-disabled
  (testing "built-in classes do not hide user block vector matches in block reference search"
    (let [built-in-id (test-uuid-string 905)
          user-id (test-uuid-string 906)
          page-id (test-uuid-string 907)
          blocks {built-in-id {:db/id 905
                               :block/uuid (uuid built-in-id)
                               :block/title "Cards"
                               :block/page {:block/uuid (uuid page-id)}
                               :logseq.property/built-in? true}
                  user-id {:db/id 906
                           :block/uuid (uuid user-id)
                           :block/title "which team is Manu in?"
                           :block/page {:block/uuid (uuid page-id)}}}
          vector-index {:query (fn [_embedding _limit _page]
                                 [{:id built-in-id
                                   :page page-id
                                   :vector-score 0.99}
                                  {:id user-id
                                   :page page-id
                                   :vector-score 0.98}])}]
      (with-redefs [d/entity (fn [_db [_attr id]]
                               (get blocks (str id)))
                    d/pull-many (fn [_db _selector lookup-refs]
                                  (mapv (fn [[_attr id]]
                                          (get blocks (str id)))
                                        lookup-refs))
                    ldb/hidden? (constantly false)
                    ldb/page? (constantly false)
                    ldb/built-in? (fn [block]
                                    (true? (:logseq.property/built-in? block)))
                    ldb/class? (fn [block]
                                 (= (:db/id block) 905))]
        (let [result (vec (search/search-blocks (atom :db)
                                                (checking-db)
                                                vector-index
                                                "manu spurs"
                                                {:limit 10
                                                 :built-in? false
                                                 :enable-snippet? false
                                                 :feature/enable-semantic-search? true
                                                 :query-embedding [0.1 0.2 0.3]}))]
          (is (= ["which team is Manu in?"]
                 (mapv :block/title result))))))))

(deftest search-blocks-limits-vector-results-before-combining
  (testing "large graph vector search caps semantic hits and drops low scores before merging"
    (let [page-id (test-uuid-string 930)
          vector-ids (mapv test-uuid-string (range 931 1931))
          blocks (into {}
                       (map-indexed (fn [idx id]
                                      [id {:db/id (+ 931 idx)
                                           :block/uuid (uuid id)
                                           :block/title (if (even? idx)
                                                          (str "Strong vector result " idx)
                                                          (str "Weak vector result " idx))
                                           :block/page {:block/uuid (uuid page-id)}}])
                                    vector-ids))
          consumed (atom 0)
          query-limits (atom [])
          vector-results (fn vector-results [ids]
                           (lazy-seq
                            (when-let [ids (seq ids)]
                              (let [id (first ids)
                                    idx @consumed]
                                (cons (do
                                        (swap! consumed inc)
                                        {:id id
                                         :page page-id
                                         :vector-score (if (even? idx) 0.51 0.5)})
                                      (vector-results (rest ids)))))))
          vector-index {:query (fn [_embedding limit _page]
                                 (swap! query-limits conj limit)
                                 (take limit (vector-results vector-ids)))}]
      (with-redefs [d/entity (fn [_db [_attr id]]
                               (get blocks (str id)))
                    d/pull-many (fn [_db _selector lookup-refs]
                                  (mapv (fn [[_attr id]]
                                          (get blocks (str id)))
                                        lookup-refs))
                    ldb/hidden? (constantly false)
                    ldb/page? (constantly false)
                    ldb/built-in? (constantly false)]
        (let [result (doall (search/search-blocks (atom :db)
                                                  (checking-db)
                                                  vector-index
                                                  "semantic large graph"
                                                  {:limit 50
                                                   :enable-snippet? false
                                                   :feature/enable-semantic-search? true
                                                   :query-embedding [0.1 0.2 0.3]}))]
          (is (= [10] @query-limits))
          (is (= 5 (count result)))
          (is (every? #(string/starts-with? % "Strong")
                      (map :block/title result)))
          (is (= 10 @consumed)))))))

(deftest reciprocal-rank-fusion-promotes-cross-source-agreement
  (testing "a result found by both keyword and vector search outranks a vector-only top hit"
    (let [rrf #'search/reciprocal-rank-fusion
          result (rrf [[{:id "keyword-only"}
                        {:id "shared"}]
                       [{:id "vector-only"}
                        {:id "shared"}]])]
      (is (= ["shared" "keyword-only" "vector-only"]
             (mapv :id result))))))

(deftest search-blocks-hybrid-ranks-keyword-and-vector-results
  (testing "SQLite keyword hits and zvec vector hits share the final ranking"
    (let [keyword-id (test-uuid-string 910)
          vector-id (test-uuid-string 911)
          page-id (test-uuid-string 912)
          blocks {keyword-id {:db/id 910
                              :block/uuid (uuid keyword-id)
                              :block/title "alpha keyword"
                              :block/page {:block/uuid (uuid page-id)}}
                  vector-id {:db/id 911
                             :block/uuid (uuid vector-id)
                             :block/title "related semantic result"
                             :block/page {:block/uuid (uuid page-id)}}}
          db #js {:exec (fn [opts]
                          (let [sql (aget opts "sql")]
                            (cond
                              (string/includes? sql "title match ?")
                              (clj->js [[keyword-id page-id "alpha keyword" -16 nil]])

                              :else
                              #js [])))}
          vector-index {:query (fn [_embedding _limit _page]
                                 [{:id vector-id
                                   :page page-id
                                   :vector-score 4.0}])}]
      (with-redefs [d/entity (fn [_db [_attr id]]
                               (get blocks (str id)))
                    d/pull-many (fn [_db _selector lookup-refs]
                                  (mapv (fn [[_attr id]]
                                          (get blocks (str id)))
                                        lookup-refs))
                    ldb/hidden? (constantly false)
                    ldb/page? (constantly false)
                    ldb/built-in? (constantly false)]
        (let [result (vec (search/search-blocks (atom :db)
                                               db
                                               vector-index
                                               "alpha"
                                               {:limit 10
                                                :enable-snippet? false
                                                :feature/enable-semantic-search? true
                                                :query-embedding [0.4 0.5 0.6]}))]
          (is (= ["alpha keyword" "related semantic result"]
                 (mapv :block/title result))))))))

(deftest search-blocks-filters-weak-vector-result
  (testing "weak semantic hits are dropped even when exact keyword hits exist"
    (let [keyword-id (test-uuid-string 920)
          vector-id (test-uuid-string 921)
          page-id (test-uuid-string 922)
          blocks {keyword-id {:db/id 920
                              :block/uuid (uuid keyword-id)
                              :block/title "alpha"
                              :block/page {:block/uuid (uuid page-id)}}
                  vector-id {:db/id 921
                             :block/uuid (uuid vector-id)
                             :block/title "contextually adjacent but weak"
                             :block/page {:block/uuid (uuid page-id)}}}
          db #js {:exec (fn [opts]
                          (let [sql (aget opts "sql")]
                            (cond
                              (string/includes? sql "title = ?")
                              (clj->js [[keyword-id page-id "alpha"]])

                              :else
                              #js [])))}
          vector-index {:query (fn [_embedding _limit _page]
                                 [{:id vector-id
                                   :page page-id
                                   :vector-score 0.34}])}]
      (with-redefs [d/entity (fn [_db [_attr id]]
                               (get blocks (str id)))
                    d/pull-many (fn [_db _selector lookup-refs]
                                  (mapv (fn [[_attr id]]
                                          (get blocks (str id)))
                                        lookup-refs))
                    ldb/hidden? (constantly false)
                    ldb/page? (constantly false)
                    ldb/built-in? (constantly false)]
        (let [result (vec (search/search-blocks (atom :db)
                                                db
                                                vector-index
                                                "alpha"
                                                {:limit 10
                                                 :enable-snippet? false
                                                 :feature/enable-semantic-search? true
                                                 :query-embedding [0.4 0.5 0.6]}))]
          (is (= ["alpha"]
                 (mapv :block/title result))))))))

(deftest combine-results-uses-vector-context-terms-as-semantic-tie-breaker
  (testing "embedded context terms can promote a lower raw vector hit without page/tag boosts inverting rank"
    (let [unrelated-id (test-uuid-string 930)
          page-id (test-uuid-string 931)
          semantic-id (test-uuid-string 932)
          tag-id (test-uuid-string 933)
          blocks {unrelated-id {:db/id 930
                                :block/uuid (uuid unrelated-id)
                                :block/title "Which team is Tony in?"}
                  page-id {:db/id 931
                           :block/uuid (uuid page-id)
                           :block/title "nba"
                           :page? true}
                  semantic-id {:db/id 932
                               :block/uuid (uuid semantic-id)
                               :block/title "which team is Manu in?"}
                  tag-id {:db/id 933
                          :block/uuid (uuid tag-id)
                          :block/title "generic tagged result"
                          :block/tags [{:db/id 934}]}}]
      (with-redefs [d/entity (fn [_db [_attr id]]
                               (get blocks (str id)))
                    d/pull-many (fn [_db _selector lookup-refs]
                                  (mapv (fn [[_attr id]]
                                          (get blocks (str id)))
                                        lookup-refs))
                    ldb/hidden? (constantly false)
                    ldb/page? :page?]
        (let [db #js {:exec (constantly #js [])}
              vector-index {:query (fn [_embedding _limit _page]
                                      [{:id unrelated-id
                                       :vector-score 0.72
                                       :title "Which team is Tony in?"
                                       :vector-title "Previous: which team is Manu in?\nBlock: Which team is Tony in?\nNext: Spurs"}
                                      {:id page-id
                                       :vector-score 0.70
                                       :title "nba"
                                       :vector-title "Page: nba\nBlock: nba"}
                                      {:id semantic-id
                                       :vector-score 0.69
                                       :title "which team is Manu in?"
                                       :vector-title "Block: which team is Manu in?\nChildren: Spurs"}
                                      {:id tag-id
                                       :vector-score 0.68
                                       :title "generic tagged result"
                                       :vector-title "Block: generic tagged result"}])}
              result (vec (search/search-blocks (atom :db)
                                                db
                                                vector-index
                                                "manu spurs"
                                                {:limit 10
                                                 :enable-snippet? false
                                                 :feature/enable-semantic-search? true
                                                 :query-embedding [0.4 0.5 0.6]}))]
          (is (= ["which team is Manu in?"
                  "Which team is Tony in?"
                  "nba"
                  "generic tagged result"]
                 (mapv :block/title result))))))))

(deftest benchmark-scoring-keeps-keyword-result-ahead-of-strong-vector-only-hit
  (testing "hybrid RRF weighting preserves keyword precision at rank 1"
    (let [keyword-id (test-uuid-string 940)
          vector-id (test-uuid-string 941)
          page-id (test-uuid-string 942)
          blocks {keyword-id {:db/id 940
                              :block/uuid (uuid keyword-id)
                              :block/title "keyword hit"
                              :block/page {:block/uuid (uuid page-id)}}
                  vector-id {:db/id 941
                             :block/uuid (uuid vector-id)
                             :block/title "semantic only"
                             :block/page {:block/uuid (uuid page-id)}}}]
      (with-redefs [d/pull-many (fn [_db _selector lookup-refs]
                                  (mapv (fn [[_attr id]]
                                          (get blocks (str id)))
                                        lookup-refs))
                    ldb/hidden? (constantly false)
                    ldb/page? (constantly false)]
        (let [result (search/combine-results
                      :db
                      [{:id keyword-id
                        :keyword-score 0.1
                        :title "keyword hit"}]
                      [{:id vector-id
                        :vector-score 1000
                        :title "semantic only"}])
              score (search-benchmark/score-results result [keyword-id] 1)]
          (is (= 1 (:recall-at-1 score))))))))

(deftest search-result-keeps-page-title-when-alias-matches
  (testing "alias matches annotate the page result without replacing its title"
    (let [page-id #uuid "00000000-0000-0000-0000-000000000236"
          alias-id #uuid "00000000-0000-0000-0000-000000000237"
          page {:db/id 1
                :block/uuid page-id
                :block/title "Artificial Intelligence"
                :block/alias [{:db/id 2
                               :block/uuid alias-id
                               :block/title "ai"}]}]
      (with-redefs [d/entity (fn [_db [_attr id]]
                               (when (= id page-id)
                                 page))
                    ldb/page? (fn [entity] (= (:db/id entity) (:db/id page)))
                    ldb/built-in? (constantly false)
                    ldb/hidden? (constantly false)]
        (let [result (#'search/search-result->block-result
                      (atom :db)
                      "ai"
                      nil
                      {:enable-snippet? false}
                      {:id (str page-id)
                       :page (str page-id)
                       :title "Artificial Intelligence ai"})]
          (is (= "Artificial Intelligence" (:block/title result)))
          (is (= {:block/uuid alias-id
                  :block/title "ai"}
                 (:alias result))))))))

(deftest search-result-detects-alias-match-from-pulled-result-map
  (testing "pulled search result maps include aliases for alias-match detection"
    (let [page-id #uuid "00000000-0000-0000-0000-000000000238"
          alias-id #uuid "00000000-0000-0000-0000-000000000239"
          block-key :frontend.worker.search/block
          page {:db/id 1
                :block/uuid page-id
                :block/title "Artificial Intelligence"
                :block/alias [{:block/uuid alias-id
                               :block/title "ai"}]}]
      (with-redefs [d/entity (fn [& _]
                               (throw (js/Error. "search result block should come from pull map")))
                    ldb/page? (fn [entity] (= (:db/id entity) (:db/id page)))
                    ldb/built-in? (constantly false)
                    ldb/hidden? (constantly false)]
        (let [result (#'search/search-result->block-result
                      (atom :db)
                      "ai"
                      nil
                      {:enable-snippet? false}
                      {:id (str page-id)
                       :page (str page-id)
                       :title "Artificial Intelligence ai"
                       block-key page})]
          (is (= "Artificial Intelligence" (:block/title result)))
          (is (= {:block/uuid alias-id
                  :block/title "ai"}
                 (:alias result))))))))

(deftest search-result-keeps-page-title-when-canonical-title-matches
  (testing "page results display the canonical title when the indexed title also contains aliases"
    (let [page-id #uuid "00000000-0000-0000-0000-000000000240"
          page {:db/id 1
                :block/uuid page-id
                :block/title "Artificial Intelligence"
                :block/alias [{:db/id 2
                               :block/uuid #uuid "00000000-0000-0000-0000-000000000241"
                               :block/title "ai"}]}]
      (with-redefs [d/entity (fn [_db [_attr id]]
                               (when (= id page-id)
                                 page))
                    ldb/page? (fn [entity] (= (:db/id entity) (:db/id page)))
                    ldb/built-in? (constantly false)
                    ldb/hidden? (constantly false)]
        (let [result (#'search/search-result->block-result
                      (atom :db)
                      "Artificial"
                      nil
                      {:enable-snippet? false}
                      {:id (str page-id)
                       :page (str page-id)
                       :title "Artificial Intelligence ai"})]
          (is (= "Artificial Intelligence" (:block/title result)))
          (is (not (contains? result :alias))))))))

(deftest search-result-replaces-page-title-uuid-refs-without-alias-title
  (testing "page result titles resolve uuid refs but do not display alias titles from the search index"
    (let [page-id #uuid "00000000-0000-0000-0000-000000000246"
          ref-id #uuid "00000000-0000-0000-0000-000000000247"
          page {:db/id 1
                :block/uuid page-id
                :block/title (str "Artificial [[" ref-id "]]")
                :block/refs [{:block/uuid ref-id
                              :block/title "Machine Learning"}]
                :block/alias [{:db/id 2
                               :block/uuid #uuid "00000000-0000-0000-0000-000000000248"
                               :block/title "ai"}]}]
      (with-redefs [d/entity (fn [_db [_attr id]]
                               (when (= id page-id)
                                 page))
                    ldb/page? (fn [entity] (= (:db/id entity) (:db/id page)))
                    ldb/object? (constantly false)
                    ldb/built-in? (constantly false)
                    ldb/hidden? (constantly false)]
        (let [result (#'search/search-result->block-result
                      (atom :db)
                      "Artificial"
                      nil
                      {:enable-snippet? false}
                      {:id (str page-id)
                       :page (str page-id)
                       :title "Artificial [[Machine Learning]] ai"})]
          (is (= "Artificial [[Machine Learning]]" (:block/title result)))
          (is (not (contains? result :alias))))))))

(deftest search-result-snippet-uses-canonical-page-title
  (testing "page snippets do not display alias titles from the search index"
    (let [page-id #uuid "00000000-0000-0000-0000-000000000242"
          page {:db/id 1
                :block/uuid page-id
                :block/title "Artificial Intelligence"
                :block/alias [{:db/id 2
                               :block/uuid #uuid "00000000-0000-0000-0000-000000000243"
                               :block/title "ai"}]}]
      (with-redefs [d/entity (fn [_db [_attr id]]
                               (when (= id page-id)
                                 page))
                    ldb/page? (fn [entity] (= (:db/id entity) (:db/id page)))
                    ldb/built-in? (constantly false)
                    ldb/hidden? (constantly false)]
        (let [result (#'search/search-result->block-result
                      (atom :db)
                      "Artificial"
                      nil
                      {:enable-snippet? true}
                      {:id (str page-id)
                       :page (str page-id)
                       :title "Artificial Intelligence ai"
                       :snippet "$pfts_2lqh>$Artificial$<pfts_2lqh$ Intelligence ai"})]
          (is (= "$pfts_2lqh>$Artificial$<pfts_2lqh$ Intelligence" (:block/title result)))
          (is (not (contains? result :alias))))))))

(deftest search-result-keeps-valid-page-snippet
  (testing "page snippets are preserved when they only contain canonical title text"
    (let [page-id #uuid "00000000-0000-0000-0000-000000000244"
          page {:db/id 1
                :block/uuid page-id
                :block/title "Artificial Intelligence"
                :block/alias [{:db/id 2
                               :block/uuid #uuid "00000000-0000-0000-0000-000000000245"
                               :block/title "ai"}]}]
      (with-redefs [d/entity (fn [_db [_attr id]]
                               (when (= id page-id)
                                 page))
                    ldb/page? (fn [entity] (= (:db/id entity) (:db/id page)))
                    ldb/built-in? (constantly false)
                    ldb/hidden? (constantly false)]
        (let [result (#'search/search-result->block-result
                      (atom :db)
                      "Artificial"
                      nil
                      {:enable-snippet? true}
                      {:id (str page-id)
                       :page (str page-id)
                       :title "Artificial Intelligence ai"
                       :snippet "$pfts_2lqh>$Artificial$<pfts_2lqh$ Intelligence"})]
          (is (= "$pfts_2lqh>$Artificial$<pfts_2lqh$ Intelligence" (:block/title result)))
          (is (not (contains? result :alias))))))))
(deftest search-result-includes-block-unique-title
  (testing "search responses include the title cmdk should render"
    (let [conn (db-test/create-conn-with-blocks
                {:classes {:Project {:block/title "Project"}
                           :Area {:block/title "Area"}
                           :user.class/Milestone {:block/title "Milestone"
                                                  :build/class-extends [:Project]}
                           :other.class/Milestone {:block/title "Milestone"
                                                   :build/class-extends [:Area]}}})
          milestone (d/entity @conn :user.class/Milestone)
          result (#'search/search-result->block-result
                  conn
                  "stone"
                  nil
                  {:enable-snippet? true}
                  {:id (str (:block/uuid milestone))
                   :page (str (:block/uuid milestone))
                   :title "Milestone"})]
      (is (= "Project/Mile$pfts_2lqh>$stone$<pfts_2lqh$"
             (:block.temp/unique-title result)))
      (is (= "Mile$pfts_2lqh>$stone$<pfts_2lqh$"
             (:block/title result))))))

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
