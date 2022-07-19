(ns frontend.extensions.calc-test
  (:require [clojure.test :as test :refer [are deftest testing]]
            [clojure.string :as str]
            [clojure.edn :as edn]
            [frontend.extensions.calc :as calc]))

(defn convert-bigNum [b]
  (edn/read-string (str b)))

(defn run [expr]
  {:pre [(string? expr)]}
  (convert-bigNum (calc/eval (calc/parse expr))))

(deftest basic-arithmetic
  (testing "numbers are parsed as expected"
    (are [value expr] (= value (run expr))
      1          "1"
      1          "   1  "
      98123      "98123"
      1.0        " 1.0 "
      22.1124131 "22.1124131"
      100.01231  " 100.01231 "
      0.01231    " .01231 "
      0.015       ".015 "
      -0.2       "-.2"
      -0.3       "- .3")
    (testing "even when they have the commas in the wrong place"
      (are [value expr] (= value (run expr))
        98123      "9812,3"
        98123      "98,123"
        98123      "9,8,123"
        1123.0     " 112,3.0 "
        22.1124131 "2,2.1124131"
        100.01231  " 1,00.01231 "))
    (testing "even when they are negative"
      (are [value expr] (= value (run expr))
        -98123      "-98123"
        -1123.0     " -112,3.0 "
        -22.1124131 "-2,2.1124131"))
    (testing "even as percentages"
      (are [value expr] (= value (run expr))
        0.01          "1%"
        1.0           " 100.00% "
        0.00169781231 "0.169781231%")))
  (testing "basic operations work"
    (are [value expr] (= value (run expr))
      1             "1 + 0"
      1             "1 + 1 - 1 "
      3             "1+2"
      3             " 1 +2 "
      1             "(2-1 ) "
      211           "100  + 111"
      2111          "1,000  + 11,11"
      -111          "1,000  + -11,11"
      0             "1 + 2 + 3 + 4 + 5 -1-2-3-4-5"
      1             "1 * 1"
      -1            "1 * -1"
      2             "1*2"
      -2            "-1*2"
      9             " 3 *3"
      1             " 2 * 3 / 3 / 2"
      -1            " 2 * 3 / 3 / -2"
      #?(:clj 1/2
         :cljs 0.5) " 1 / 2"
      0.5           " 1/ 2.0"
      2.0           "2*100%"
      0.01          "2%/2"
      500e3         "50% * 1e6"))
  (testing "operator precedence"
    (are [value expr] (= value (run expr))
      1     "1 + 0 * 2"
      1     "2 * 1 - 1 "
      4     "8 / 4 + 2 * 1 - 25 * 0 / 1"
      14.0  "3 *2 ^ 2 + 1 * 2"
      74.0  "((3*2) ^ 2 + 1) * 2"
      -74.0 "((3*2) ^ 2 + 1) * -2"
      74.0  "-((3*2) ^ 2 + 1) * -2"
      432.0 "(3*2) ^ (2 + 1) * 2"
      97.0  "(2 * 3) * 2 ^ (2 * 2) + 1"
      4.0   "2 * 3 / 2 ^ 2 * 2 + 1"))
  (testing "scientific numbers"
    (are [value expr] (= value (run expr))
      1.0e1    "1.0e01"
      1.23e-10 "123.0e-12"
      12.3     "123.0e-1"
      -12.3    "-123.0e-1"
      12.3     "123.0E-1"
      12300     "123.0E+2"
      2.0      "1e0 + 1e0"
      10       ".1e2"
      0.001    ".1e-2"
      -0.045   "-.45e-1"
      -210     "-.21e3"))
  (testing "avoiding rounding errors"
    (are [value expr] (= value (run expr))
      3.3 "1.1 + 2.2"
      2.2 "3.3 - 1.1"
      0.0001 "1/10000"
      1e-7 "1/10000000")))

(deftest scientific-functions
  (testing "power"
    (are [value expr] (= value (run expr))
      1.0    "1 ^ 0"
      4.0    "2^2 "
      -9.0    "-3^2 "
      9.0    "(-3)^2 "
      27.0   " 3^ 3"
      0.125  " 2^ -3"
      512.0   "2 ^ 3 ^ 2"
      256.0  "4.000 ^ 4.0"
      2.0    "4^0.5"
      0.1    "100^(-0.5)"
      125.0  "25^(3/2)"
      4096.0 "200% ^ 12"))
  (testing "functions"
    (are [value expr] (= value (run expr))
      2.0  "sqrt( 4 )"
      3.0  "abs( 3 )"
      3.0  "abs( -3 )"
      1.0  "cos( 0 * 1 )"
      0.0  "sin( 1 -1 )"
      0.0  "atan(tan(0))"
      1.0  "sin(asin(0)) + 1"
      1.0  "-sin(asin(0)) + 1"
      0.0  "acos(cos(0))"
      5.0  "2 * log(10) + 3"
      1.0  "-2 * log(10) + 3"
      10.0 "ln(1) + 10"
      1.0  "exp(0)"
      2.0  "ln(exp(2))")))

(deftest additional-operators
  (testing "mod"
    (are [value expr] (= value (run expr))
      0.0    "1 mod 1"
      1.0    "7 mod 3"
      3.0    "7 mod 4"
      0.5    "4.5 mod 2"
      -3.0   "-7 mod 4"))
  (testing "factorial"
    (are [value expr] (= value (run expr))
      1.0     "0!"
      1.0     "1!"
      6.0     "3.0!"
      -120.0  "-5!"
      124.0   "(2+3)!+4"
      240.0   "10 * 4!")))

(deftest variables
  (testing "variables can be remembered"
    (are [final-env expr] (let [env (calc/new-env)]
                            (calc/eval env (calc/parse expr))
                            (= final-env (into {} (for [[k v] @env] [k (convert-bigNum v)]))))
      {"a" 1}        "a = 1"
      {"a" -1}       "a = -1"
      {"k9" 27}       "k9 = 27"
      {"variable" 1} "variable = 1 + 0 * 2"
      {"x" 1}        "x= 2 * 1 - 1 "
      {"y" 4}        "y =8 / 4 + 2 * 1 - 25 * 0 / 1"
      {"y" 4}        "y =8 / 4 + 2 * 1 - 25 * 0 / 1"
      {"zzz" 14.0}   "zzz=3 *2 ^ 2 + 1 * 2"
      {"foo" 74.0}   "foo = (((3*2) ^ 2 + 1) * 2)"))
  (testing "variables can have underscores"
    (are [final-env expr] (let [env (calc/new-env)]
                            (calc/eval env (calc/parse expr))
                            (= final-env (into {} (for [[k v] @env] [k (convert-bigNum v)]))))
      {"a_a" 1}         "a_a = 1"
      {"_foo" 1}        "_foo = 1"
      {"x_yy_zzz" 1}    "x_yy_zzz= 1"
      {"foo_bar_baz" 1} "foo_bar_baz = 1 + -0 * 2"))
  (testing "variables can be reused"
    (are [final-env exprs] (let [env (calc/new-env)]
                             (doseq [expr exprs]
                               (calc/eval env (calc/parse expr)))
                            (= final-env (into {} (for [[k v] @env] [k (convert-bigNum v)]))))
      {"a" 1 "b" 2}          ["a = 1" "b = a + 1"]
      {"a" 1 "b" 0}          ["a = 1" "b = -a + 1"]
      {"a" 1 "b" 3}          ["a = 1" "b=a*2+1"]
      {"a_a" 1 "b_b" 2}      ["a_a = 1" "b_b = a_a + 1"]
      {"variable" 1 "x" 0.0} ["variable = 1 + 0 * 2" "x = log(variable)"]
      {"x" 1 "u" 23 "v" 24}  ["x= 2 * 1 - 1 " "23 + 54" "u= 23" "v = x + u"]))
  (testing "variables can be rewritten"
    (are [final-env exprs] (let [env (calc/new-env)]
                             (doseq [expr exprs]
                               (calc/eval env (calc/parse expr)))
                            (= final-env (into {} (for [[k v] @env] [k (convert-bigNum v)]))))
      {"a" 2}              ["a = 1" "a = 2"]
      {"a" 2 "b" 2}        ["a = 1" "b = a + 1" "a = b"]
      {"variable" 1 "x" 0} ["variable = 1 + 0 * 2" "x = log(variable)" "x = variable - 1"])))

(deftest last-value
  (testing "last value is set"
    (are [values exprs] (= values (calc/eval-lines (str/join "\n" exprs)))
      ["42" "126"]            ["6*7" "last*3"]
      ["25" "5"]              ["3^2+4^2" "sqrt(last)"]
      ["6" nil nil nil "12"]  ["2*3" "# a comment" "" "   " "last*2"])))

(deftest formatting
  (testing "display normal"
    (are [values exprs] (= values (calc/eval-lines (str/join "\n" exprs)))
      [nil "1000000"]     [":format norm" "1e6" ]
      [nil "1000000"]     [":format norm 7" "1e6"]
      [nil "1e+6"]        [":format norm 6" "1e6"]
      [nil "3.14"]        [":format norm 3" "PI"]
      [nil "3"]           [":format norm 1" "E"]
      [nil "0.000123"]    [":format norm 5" "0.000123"]
      [nil "1.23e-4"]     [":format norm 4" "0.000123"]
      [nil "123400000"]   [":format normal 9" "1.234e8"]
      [nil "1.234e+8"]    [":format normal 8" "1.234e8"]))
  (testing "display fixed"
    (are [values exprs] (= values (calc/eval-lines (str/join "\n" exprs)))
      [nil "0.123450"]    [":format fix 6" "0.12345"]
      [nil "0.1235"]      [":format fix 4" "0.12345"]
      [nil "2.7183"]      [":format fixed 4" "E"]
      [nil "0.001"]       [":format fix 3" "0.0005"]
      [nil "4.000e-4"]    [":format fix 3" "0.0004"]
      [nil "1.00e+21"]    [":format fixed 2" "1e21+0.1"]))
  (testing "display scientific"
    (are [values exprs] (= values (calc/eval-lines (str/join "\n" exprs)))
      [nil "1e+6"]        [":format sci" "1e6"]
      [nil "3.142e+0"]    [":format sci 3" "PI"]
      [nil "3.14e+2"]     [":format scientific" "3.14*10^2"])))

(deftest fractions
  (testing "mixed numbers"
    (are [value expr] (= value (run expr))
      0          "0 0/1"
      1          "0 1/1"
      1          "1 0/1"
      2.5        "2 1/2"
      2.5        "2 1/2"
      -4.28      "-4 7/25"
      2.00101    "2 101/100000"
      -99.2      "-99 8/40"))
  (testing "display fractions"
    (are [values exprs] (= values (calc/eval-lines (str/join "\n" exprs)))
      [nil "4 3/8"]           [":format frac" "4.375"]
      [nil "-7 1/4"]          [":format fraction" "-7.25"]
      [nil "2"]               [":format fractions" "19/20 + 1 1/20"]
      [nil "-2"]              [":format frac" "19/17 - 3 2/17"]
      [nil "3.14157"]         [":format frac" "3.14157"]
      [nil "3 14157/100000"]  [":format frac 100000" "3.14157"]))
  (testing "display improper fractions"
    (are [values exprs] (= values (calc/eval-lines (str/join "\n" exprs)))
      [nil "35/8"]            [":format improper" "4.375"]
      [nil "-29/4"]           [":format imp" "-7.25"]
      [nil "3.14157"]         [":format improper" "3.14157" ]
      [nil "314157/100000"]   [":format imp 100000" "3.14157"])))

(deftest base-conversion
  (testing "mixed base input"
    (are [value expr] (= value (run expr))
      255.0     "0xff"
      511.0     "0x0A + 0xF5 + 0x100"
      83.0      "0o123"
      324.0     "0x100 + 0o100 + 0b100"
      32.0      "0b100 * 0b1000"))
  (testing "mixed base output"
    (are [values exprs] (= values (calc/eval-lines (str/join "\n" exprs)))
      ["12345" "0x3039"]          ["12345" ":hex"]
      ["12345" "0o30071"]         ["12345" ":oct"]
      ["12345" "0b11000000111001"]["12345" ":bin"]
      [nil "0b100000000"]         [":bin" "0b10000 * 0b10000"]
      [nil "-0xff"]               [":hex" "-255"])))

(deftest comments
  (testing "comments are ignored"
    (are [value expr] (= value (run expr))
      nil    "# this comment is ignored"
      nil    "    # this comment is ignored   "
      8.0    "2*4# double 4"
      10.0   "2*5 # double 5"
      12.0   "2*6  # double 6"
      14.0   "2*7  # 99")))

(deftest failure
  (testing "expressions that don't match the spec fail"
    (are [expr] (calc/failure? (calc/eval (calc/new-env) (calc/parse expr)))
      "foo_ ="
      "foo__ ="
      "oo___ ="
      " . "
      "_ = 2"
      "__ = 4"
      "PI = 3.14"
      "foo_3  = _")))
