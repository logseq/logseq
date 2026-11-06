(ns logseq.db-sync.common-mutation-test
  (:require [cljs.test :refer [async deftest is]]
            [logseq.db-sync.common :as common]
            [promesa.core :as p]))

(defn- fake-db [calls]
  (let [stmt (js-obj)]
    (aset stmt "bind" (fn [& args]
                        (swap! calls assoc :bind-args (vec args))
                        stmt))
    (aset stmt "run" (fn []
                       (swap! calls update :run-count (fnil inc 0))
                       #js {:success true}))
    #js {:prepare (fn [sql]
                    (swap! calls assoc :prepare-sql sql)
                    stmt)}))

;; Fails if, in `<d1-run`, `if` becomes `if-not` or `seq` becomes `empty?`.
(deftest d1-run-binds-args-test
  (async done
         (let [with-args (atom {})
               without-args (atom {})]
           (-> (p/let [_ (common/<d1-run (fake-db with-args) "delete from users where id = ? and graph = ?" "u1" "g1")
                       _ (common/<d1-run (fake-db without-args) "delete from users")]
                 (is (= ["u1" "g1"] (:bind-args @with-args)) "args are bound")
                 (is (= 1 (:run-count @with-args)))
                 (is (not (contains? @without-args :bind-args)) "no args: nothing is bound")
                 (is (= 1 (:run-count @without-args))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))
