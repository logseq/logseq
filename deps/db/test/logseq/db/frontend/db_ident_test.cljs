(ns logseq.db.frontend.db-ident-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.db.frontend.db-ident :as db-ident]))

(deftest create-db-ident-from-name
  (is (= "Whiteboard-Object"
         ;; Example from docs graph
         (name (db-ident/create-db-ident-from-name "user.class" "Whiteboard/Object")))
      "ident names must not have '/' because it is a special symbol for the reader"))