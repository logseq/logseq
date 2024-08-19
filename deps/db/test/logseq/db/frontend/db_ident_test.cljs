(ns logseq.db.frontend.db-ident-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.db.frontend.db-ident :as db-ident]))

(deftest create-db-ident-from-name
  (is (= "Whiteboard-Object"
         ;; Example from docs graph
         (name (db-ident/create-db-ident-from-name "user.class" "Whiteboard/Object")))
      "ident names must not have '/' because it is a special symbol for the reader")

  ;; https://github.com/logseq/db-test/issues/4
  (is (= "Deep-Neural-Networks-DNN"
         (name (db-ident/create-db-ident-from-name "user.class" "Deep Neural Networks (DNN)")))
      "ident names don't fail on special characters like parenthesis")

  (is (seq (name (db-ident/create-db-ident-from-name "user.class" "123")))
      "ident names can only have numbers"))