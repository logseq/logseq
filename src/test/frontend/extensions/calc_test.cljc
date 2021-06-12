(ns frontend.extensions.calc-test
  (:require [clojure.test :as test :refer [deftest testing is are]]
            [frontend.extensions.calc :as calc]))

(defn run [expr]
  {:pre [(string? expr)]}
  (first (calc/eval (calc/parse expr))))

(deftest basic-arithmetic
  (testing "numbers are parsed as expected"
    (are [value expr] (= value (run expr))
      1          "1"
      1          "   1  "
      98123      "98123"
      1.0        " 1.0 "
      22.1124131 "22.1124131"
      100.01231  " 100.01231 "))
  (testing "basic operations work"
    (are [value expr] (= value (run expr))
      1             "1 + 0"
      1             "1 + 1 - 1 "
      3             "1+2"
      3             " 1 +2 "
      1             "(2-1 ) "
      211           "100  + 111"
      0             "1 + 2 + 3 + 4 + 5 -1-2-3-4-5"
      1             "1 * 1"
      2             "1*2"
      9             " 3 *3"
      1             " 2 * 3 / 3 / 2"
      #?(:clj 1/2
         :cljs 0.5) " 1 / 2"
      0.5           " 1/ 2.0"))
  (testing "power"
    (are [value expr] (= value (run expr))
      1.0   "1 ^ 0"
      4.0   "2^2 "
      27.0  " 3^ 3"
      16.0  "2 ^ 2 ^ 2"
      256.0 "4.000 ^ 4.0"))
  (testing "operator precedence"
    (are [value expr] (= value (run expr))
      1     "1 + 0 * 2"
      1     "2 * 1 - 1 "
      4     "8 / 4 + 2 * 1 - 25 * 0 / 1"
      14.0  "3 *2 ^ 2 + 1 * 2"
      74.0  "((3*2) ^ 2 + 1) * 2"
      432.0 "(3*2) ^ (2 + 1) * 2"
      97.0  "(2 * 3) * 2 ^ (2 * 2) + 1"
      4.0   "2 * 3 / 2 ^ 2 * 2 + 1"))
  (testing "scientific numbers"
    (are [value expr] (= value (run expr))
      1.0e1    "1.0e01"
      1.23e-10 "123.0e-12"
      12.3     "123.0e-1"
      12.3     "123.0E-1"
      2.0      "1e0 + 1e0"))
  (testing "scientific functions"
    (are [value expr] (= value (run expr))
      1.0  "cos( 0 * 1 )"
      0.0  "sin( 1 -1 )"
      0.0  "atan(tan(0))"
      1.0  "sin(asin(0)) + 1"
      0.0  "acos(cos(0))"
      5.0  "2 * log(10) + 3"
      10.0 "ln(1) + 10")))

(deftest variables
  (testing "variables can be remembered"
    (are [final-env expr] (let [env (calc/new-env)]
                            (calc/eval env (calc/parse expr))
                            (= final-env @env))
      {"a" 1}        "a = 1"
      {"variable" 1} "variable = 1 + 0 * 2"
      {"x" 1}        "x= 2 * 1 - 1 "
      {"y" 4}        "y =8 / 4 + 2 * 1 - 25 * 0 / 1"
      {"zzz" 14.0}   "zzz=3 *2 ^ 2 + 1 * 2"
      {"foo" 74.0}   "foo = (((3*2) ^ 2 + 1) * 2)"))
  (testing "variables can have underscores"
    (are [final-env expr] (let [env (calc/new-env)]
                            (calc/eval env (calc/parse expr))
                            (= final-env @env))
      {"a_a" 1}         "a_a = 1"
      {"x_yy_zzz" 1}    "x_yy_zzz= 1"
      {"foo_bar_baz" 1} "foo_bar_baz = 1 + 0 * 2"))
  (testing "variables can be reused"
    (are [final-env exprs] (let [env (calc/new-env)]
                             (doseq [expr exprs]
                               (calc/eval env (calc/parse expr)))
                             (= final-env @env))
      {"a" 1 "b" 2}          ["a = 1" "b = a + 1"]
      {"a_a" 1 "b_b" 2}      ["a_a = 1" "b_b = a_a + 1"]
      {"variable" 1 "x" 0.0} ["variable = 1 + 0 * 2" "x = log(variable)"]
      {"x" 1 "u" 23 "v" 24}  ["x= 2 * 1 - 1 " "23 + 54" "u= 23" "v = x + u"]))
  (testing "variables can be rewritten"
    (are [final-env exprs] (let [env (calc/new-env)]
                             (doseq [expr exprs]
                               (calc/eval env (calc/parse expr)))
                             (= final-env @env))
      {"a" 2}              ["a = 1" "a = 2"]
      {"a" 2 "b" 2}        ["a = 1" "b = a + 1" "a = b"]
      {"variable" 1 "x" 0} ["variable = 1 + 0 * 2" "x = log(variable)" "x = variable - 1"])))
