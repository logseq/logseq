(ns frontend.commands-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.commands :as commands]
            [frontend.state :as state]))

(deftest get-matched-commands-matches-command-groups
  (testing "English users can filter slash commands by visible group name"
    (with-redefs [state/state (atom {:preferred-language :en})]
      (let [matched (commands/get-matched-commands
                     "status"
                     [["Todo" [[:editor/set-block-marker "TODO"]] "" :icon/circle "Task status"]
                      ["Done" [[:editor/set-block-marker "DONE"]] "" :icon/check "Task status"]
                      ["Query" [[:editor/insert-query]] "" :icon/search "Advanced"]])]
        (is (= #{"Todo" "Done"}
               (set (map first matched)))))))

  (testing "localized users can filter slash commands by English group name"
    (with-redefs [state/state (atom {:preferred-language :fr})]
      (let [matched (commands/get-matched-commands
                     "task status"
                     [(with-meta ["A faire" [[:editor/set-block-marker "TODO"]] "" :icon/circle "Statut de tache"]
                        {:en-text "Todo"
                         :en-group-name "Task status"})
                      (with-meta ["Requete" [[:editor/insert-query]] "" :icon/search "Avance"]
                        {:en-text "Query"
                         :en-group-name "Advanced"})])]
        (is (= ["A faire"]
               (map first matched)))))))
