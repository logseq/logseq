(ns frontend.fixtures
  (:require [cljs.test :refer [deftest is are testing use-fixtures run-tests]]
            [frontend.modules.outliner.state :as outliner-state]
            [frontend.react-impls :as react-impls]
            [frontend.react :as react-test]
            [frontend.db.conn :as conn]
            [rum.core :as rum]))

(defn react-components
  [f]
  (reset! react-test/react-components {})
  (let [r (f)]
    (reset! react-test/react-components {})
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
    (reset! conn/outliner-db @fresh-db)
    (let [r (f)]
      (reset! outliner-state/position-state @fresh-db) r)))

(defn react-impl
  [f]
  (reset! react-impls/react react-test/react)
  (let [r (f)]
    (reset! react-impls/react rum/react) r))


