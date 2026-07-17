(ns logseq.melange.bridge.platform.datascript-storage
  "Primitive DataScript storage protocol adapter."
  (:require [datascript.storage :refer [IStorage]]))

(defn create
  [store! restore]
  (reify IStorage
    (-store [_ address-data delete-addresses]
      (store! address-data delete-addresses))
    (-restore [_ address]
      (restore address))))
