(ns frontend.fixtures
  (:require [cljs.test :refer [deftest is are testing use-fixtures run-tests]]
            [frontend.modules.outliner.state :as outliner-state]
            [frontend.tools.react-impl :as r]
            [frontend.db.conn :as conn]))

(defn react-components
  [f]
  (reset! r/react-components {})
  (let [r (f)]
    (reset! r/react-components {})
    r))

(defn outliner-position-state
  [f]
  (reset! outliner-state/position-state {})
  (let [r (f)]
    (reset! outliner-state/position-state {})
    r))

(defn outliner-db
  [f]
  (let [fresh-db (conn/create-outliner-db)]
    (reset! conn/outliner-db fresh-db)
    (let [r (f)]
      (reset! outliner-state/position-state fresh-db)
      r)))
