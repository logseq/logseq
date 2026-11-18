(ns frontend.commands-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.commands :as commands]
            [frontend.state :as state]))

(deftest get-matched-commands-matches-command-groups
  (testing "English users can filter slash commands by visible group name"
    (with-redefs [state/get-state (constantly {:preferred-language :en})]
      (let [matched (commands/get-matched-commands
                     "status"
                     [["Todo" [[:editor/set-block-marker "TODO"]] "" :icon/circle "Task status"]
                      ["Done" [[:editor/set-block-marker "DONE"]] "" :icon/check "Task status"]
                      ["Query" [[:editor/insert-query]] "" :icon/search "Advanced"]])]
        (is (= #{"Todo" "Done"}
               (set (map first matched)))))))

  (testing "localized users can filter slash commands by English group name"
    (with-redefs [state/get-state (constantly {:preferred-language :fr})]
      (let [matched (commands/get-matched-commands
                     "task status"
                     [(with-meta ["A faire" [[:editor/set-block-marker "TODO"]] "" :icon/circle "Statut de tache"]
                        {:en-text "Todo"
                         :en-group-name "Task status"})
                      (with-meta ["Requete" [[:editor/insert-query]] "" :icon/search "Avancé"]
                        {:en-text "Query"
                         :en-group-name "Advanced"})])]
        (is (= ["A faire"]
               (map first matched)))))))

(deftest registered-slash-commands-use-the-pass-t-fn
  (testing "registered commands are translated by each commands-map pass, so the English pass feeds cross-language search"
    (let [registered @commands/*extend-slash-commands
          t-fn (fn [k & _] (str "T:" (name k)))]
      (reset! commands/*extend-slash-commands
              [(fn [t-fn]
                 [(t-fn :editor.slash/cloze)
                  [[:editor/input "{{cloze }}"]]
                  (t-fn :editor.slash/cloze-desc)
                  :icon/brackets-contain
                  (t-fn :editor.slash/group-format)])])
      (try
        (let [cloze (some #(when (= "T:cloze" (first %)) %)
                          (commands/commands-map (constantly "") t-fn))]
          (is (= "T:cloze-desc" (nth cloze 2)))
          (is (= "T:group-format" (commands/command-group-name cloze))))
        (finally
          (reset! commands/*extend-slash-commands registered))))))
