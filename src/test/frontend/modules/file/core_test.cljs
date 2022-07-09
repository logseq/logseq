(ns frontend.modules.file.core-test
  (:require [cljs.test :refer [use-fixtures] :as test]
            [frontend.test.fixtures :as fixtures]
            [frontend.test.helper :as helper]))


(def test-db helper/test-db)

(use-fixtures :each
  fixtures/load-test-env
  fixtures/react-components
  fixtures/reset-db)
