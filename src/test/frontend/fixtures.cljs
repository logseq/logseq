(ns frontend.fixtures
  (:require [cljs.test :refer [deftest is are testing use-fixtures run-tests]]
            [frontend.modules.outliner.state :as outliner-state]
            [frontend.tools.react-impl :as r]))

(defn react-components
  [f]
  (reset! r/react-components {})
  (f)
  (reset! r/react-components {}))

(defn outliner-position-state
  [f]
  (reset! outliner-state/position-state {})
  (f)
  (reset! outliner-state/position-state {}))
