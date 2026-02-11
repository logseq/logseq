(ns logseq.db-sync.common-test
  (:require [cljs.test :refer [async deftest is]]
            [logseq.db-sync.common :as common]
            [promesa.core :as p]))

(defn- make-stmt [calls result]
  (let [stmt (js-obj)]
    (aset stmt
          "bind"
          (fn [& args]
            (swap! calls assoc :bind-args (vec args))
            stmt))
    (aset stmt
          "all"
          (fn []
            (swap! calls update :all-count (fnil inc 0))
            result))
    stmt))

(deftest d1-all-falls-back-when-with-session-missing-test
  (async done
         (let [calls (atom {})
               result #js {:results #js [#js {"id" "u1"}]}
               stmt (make-stmt calls result)
               db #js {:prepare (fn [sql]
                                  (swap! calls assoc :prepare-sql sql)
                                  stmt)}]
           (-> (p/let [query-result (common/<d1-all db
                                                    "select id from users where id = ?"
                                                    "u1")]
                 (is (= result query-result))
                 (is (= "select id from users where id = ?"
                        (:prepare-sql @calls)))
                 (is (= ["u1"] (:bind-args @calls)))
                 (is (= 1 (:all-count @calls))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest d1-all-uses-with-session-mode-when-provided-test
  (async done
         (let [calls (atom {})
               result #js {:results #js [#js {"id" "u1"}]}
               stmt (make-stmt calls result)
               session #js {:prepare (fn [sql]
                                       (swap! calls assoc :prepare-sql sql)
                                       stmt)}
               db #js {:prepare (fn [_]
                                  (throw (js/Error. "db.prepare should not be called")))
                       :withSession (fn [& args]
                                      (swap! calls assoc :with-session-args (vec args))
                                      session)}]
           (-> (p/let [query-result (common/<d1-all db
                                                    {:session "first-primary"}
                                                    "select id from users where id = ?"
                                                    "u1")]
                 (is (= result query-result))
                 (is (= ["first-primary"] (:with-session-args @calls)))
                 (is (= "select id from users where id = ?"
                        (:prepare-sql @calls)))
                 (is (= ["u1"] (:bind-args @calls)))
                 (is (= 1 (:all-count @calls))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest d1-all-uses-default-with-session-when-no-mode-test
  (async done
         (let [calls (atom {})
               result #js {:results #js []}
               stmt (make-stmt calls result)
               session #js {:prepare (fn [sql]
                                       (swap! calls assoc :prepare-sql sql)
                                       stmt)}
               db #js {:prepare (fn [_]
                                  (throw (js/Error. "db.prepare should not be called")))
                       :withSession (fn [& args]
                                      (swap! calls assoc :with-session-args (vec args))
                                      session)}]
           (-> (p/let [query-result (common/<d1-all db "select 1")]
                 (is (= result query-result))
                 (is (= [] (:with-session-args @calls)))
                 (is (= "select 1" (:prepare-sql @calls)))
                 (is (nil? (:bind-args @calls)))
                 (is (= 1 (:all-count @calls))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))
