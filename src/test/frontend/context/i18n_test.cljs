(ns frontend.context.i18n-test
  (:require [frontend.context.i18n :as i18n]
            [frontend.state :as state]
            [cljs.test :refer [deftest is testing use-fixtures]]))

(use-fixtures :once (fn [f]
                      (f)
                      (state/set-state! :preferred-language nil)))

(deftest translations
  (testing "ui translations"
    (state/set-preferred-language! :en)
    (is (= "About Logseq"
           (i18n/t :help/about)))

    (state/set-preferred-language! :es)
    (is (= "Acerca de Logseq"
           (i18n/t :help/about))))

  (testing "command and category translations"
    (state/set-preferred-language! :en)
    (is (= "Go to journals"
           (i18n/t :command.go/journals))
        "Check config/config")
    (is (= "Basics"
           (i18n/t :shortcut.category/basics))
        "Check config/category")

    (state/set-preferred-language! :es)
    (is (= "Ir a los diarios"
           (i18n/t :command.go/journals)))))
