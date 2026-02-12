(ns frontend.worker.search-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [frontend.worker.search :as search]
            [logseq.db :as ldb]))

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
