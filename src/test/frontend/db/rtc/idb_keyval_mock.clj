(ns frontend.db.rtc.idb-keyval-mock
  (:require [frontend.test.helper :as test-helper]))



(defmacro with-reset-idb-keyval-mock
  [reset & body]
  `(test-helper/with-reset ~reset
     [idb-keyval/set frontend.db.rtc.idb-keyval-mock/set
      idb-keyval/get frontend.db.rtc.idb-keyval-mock/get
      idb-keyval/del frontend.db.rtc.idb-keyval-mock/del
      idb-keyval/keys frontend.db.rtc.idb-keyval-mock/keys
      idb-keyval/newStore frontend.db.rtc.idb-keyval-mock/new-store]
     ~@body))
