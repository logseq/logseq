(ns frontend.fixtures
  (:require [datascript.core :as d]
            [frontend.config :as config]
            [frontend.db-schema :as db-schema]
            [frontend.db.conn :as conn]
            [frontend.db.react :as db-react]
            [frontend.react :as react-test]
            [frontend.react-impls :as react-impls]
            [frontend.state :as state]))

(defn load-test-env
  [f]
  (with-redefs [config/test? true] (f)))

(defn react-components
  [f]
  (reset! db-react/query-state {})
  (let [r (f)]
    (reset! db-react/query-state {})
    r))

(defn- reset-datascript
  [repo]
  (let [db-name (conn/datascript-db repo)
        db-conn (d/create-conn db-schema/schema)]
    (conn/reset-conn! conn/conns {})
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
