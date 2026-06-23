(ns logseq.outliner.property-position-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.outliner.property :as outliner-property]))

(deftest asset-property-uses-normal-property-position-by-default
  (is (false?
       (outliner-property/property-with-other-position?
        nil
        {}
        {:db/ident :user.property/attachment
         :logseq.property/type :asset}))))
