(ns frontend.worker.handler.page.db-based.page-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db.test.helper :as db-test]
            [logseq.db :as ldb]
            [frontend.worker.handler.page.db-based.page :as worker-db-page]))

(deftest create-class
  (let [conn (db-test/create-conn)
        _ (worker-db-page/create! conn "movie" {:class? true})
        _ (worker-db-page/create! conn "Movie" {:class? true})
        movie-class (->> (d/q '[:find [(pull ?b [*]) ...] :in $ ?title :where [?b :block/title ?title]]
                              @conn "movie")
                         first)
        Movie-class (->> (d/q '[:find [(pull ?b [*]) ...] :in $ ?title :where [?b :block/title ?title]]
                              @conn "Movie")
                         first)]

    (is (ldb/class? movie-class) "Creates a class")
    (is (ldb/class? Movie-class) "Creates another class with a different case sensitive name")
    (is (not= movie-class Movie-class) "The two classes are not the same")))