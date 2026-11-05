(ns frontend.handler.profiler-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.context.i18n :refer [t]]
            [frontend.handler.notification :as notification]
            [frontend.handler.profiler :as profiler]))

(defn ^:export test-fn-to-profile
  [x]
  x)

(defn- thrown-register-data
  [fn-sym]
  (try
    (profiler/register-fn! fn-sym)
    (is false "expected register-fn! to throw")
    nil
    (catch :default e
      (ex-data e))))

(deftest register-fn-rejects-unknown-or-unqualified-names
  (testing "unqualified name"
    (is (= {:fn-sym 'cc :reason :unqualified}
           (thrown-register-data 'cc))))
  (testing "unknown qualified name"
    (is (= {:fn-sym 'frontend.handler.profiler-test/missing-fn
            :reason :not-found}
           (thrown-register-data 'frontend.handler.profiler-test/missing-fn)))))

(deftest register-fn-from-ui-notifies-instead-of-throwing
  (testing "unqualified name"
    (let [notifications (atom [])]
      (with-redefs [notification/show! (fn [& args] (swap! notifications conj args))]
        (is (nil? (profiler/register-fn-from-ui! 'cc)))
        (is (= [[(t :profiler/fn-unqualified-error) :error]] @notifications))
        (is (not (contains? @profiler/*fn-symbol->origin-fn 'cc))))))
  (testing "unknown qualified name"
    (let [notifications (atom [])
          fn-sym 'frontend.handler.profiler-test/missing-fn]
      (with-redefs [notification/show! (fn [& args] (swap! notifications conj args))]
        (is (nil? (profiler/register-fn-from-ui! fn-sym)))
        (is (= [[(t :profiler/fn-not-found-error (str fn-sym)) :error]] @notifications))
        (is (not (contains? @profiler/*fn-symbol->origin-fn fn-sym)))))))

(deftest register-fn-registers-and-unregisters-existing-fn
  (let [fn-sym 'frontend.handler.profiler-test/test-fn-to-profile]
    (try
      (profiler/register-fn-from-ui! fn-sym)
      (is (contains? @profiler/*fn-symbol->origin-fn fn-sym))
      (finally
        (profiler/unregister-fn! fn-sym)
        (is (not (contains? @profiler/*fn-symbol->origin-fn fn-sym)))))))
