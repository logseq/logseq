(ns frontend.test.fixtures
  (:require [datascript.core :as d]
            [logseq.db.frontend.schema :as db-schema]
            [frontend.db.conn :as conn]
            [frontend.db.react :as react]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper]))

(defn react-components
  [f]
  (reset! react/query-state {})
  (let [r (f)]
    (reset! react/query-state {})
    r))

(defn- reset-datascript
  [repo]
  (let [db-name (conn/datascript-db repo)
        db-conn (d/create-conn db-schema/schema)]
    (state/set-current-repo! repo)
    (swap! conn/conns assoc db-name db-conn)))

(defn reset-db
  [f]
  (let [repo test-helper/test-db]
    (reset-datascript repo)
    (let [r (f)]
      (reset-datascript repo) r)))
