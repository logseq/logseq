(ns frontend.fixtures
  (:require [cljs.test :refer [deftest is are testing use-fixtures run-tests]]
            [frontend.react-impls :as react-impls]
            [frontend.react :as react-test]
            [frontend.db.conn :as conn]
            [frontend.db.react :as db-react]
            [rum.core :as rum]
            [datascript.core :as d]
            [frontend.db-schema :as db-schema]
            [frontend.state :as state]))

(defn react-components
  [f]
  (reset! db-react/query-state {})
  (let [r (f)]
    (reset! db-react/query-state {})
    r))

(defn- reset-datascript
  [repo]
  (let [files-db-name (conn/datascript-files-db repo)
        files-db-conn (d/create-conn db-schema/files-db-schema)
        db-name (conn/datascript-db repo)
        db-conn (d/create-conn db-schema/schema)]
    (conn/reset-conn! conn/conns {})
    (swap! conn/conns assoc files-db-name files-db-conn)
    (swap! conn/conns assoc db-name db-conn)))

(defn reset-db
  [f]
  (let [repo (state/get-current-repo)]
    (reset-datascript repo)
    (let [r (f)]
      (reset-datascript repo) r)))

(defn react-impl
  [f]
  (reset! react-impls/react react-test/react)
  (let [r (f)]
    (reset! react-impls/react react-impls/react)
    r))


