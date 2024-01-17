(ns frontend.worker.rtc.idb-keyval-mock
  (:require [frontend.test.helper :as test-helper]))



(defmacro with-reset-idb-keyval-mock
  [reset & body]
  `(test-helper/with-reset ~reset
     [idb-keyval/set      frontend.worker.rtc.idb-keyval-mock/set
      idb-keyval/setBatch frontend.worker.rtc.idb-keyval-mock/set-batch
      idb-keyval/get      frontend.worker.rtc.idb-keyval-mock/get
      idb-keyval/del      frontend.worker.rtc.idb-keyval-mock/del
      idb-keyval/keys     frontend.worker.rtc.idb-keyval-mock/keys
      idb-keyval/clear    frontend.worker.rtc.idb-keyval-mock/clear
      idb-keyval/newStore frontend.worker.rtc.idb-keyval-mock/new-store]
     ~@body))
