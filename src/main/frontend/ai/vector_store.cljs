(ns frontend.ai.vector-store
  "Provides a stable interface for vector store, hide the implementation details"
  (:require ["@logseq/logmind" :refer [VectorStorage]]
            [promesa.core :as p]))

;; Provides basic vector storage interfaces
;; Create a vector store atom, which is a map handling all vecs

(defonce *stores (atom {}))
(defonce js-vector-store-class VectorStorage)

(defn create
  "Get a vector store handler in the app runtime state
   It the store is persisted, it will be loaded from the disk
   If the handler is already created, return a rejected promise.
   - id-str: identifier for the vector store (should be unique!)
   - dim: dimension of the vector
   
   Returns a promise of the vector store prepared (loaded, and the num of vecs that loaded)
   or throw an error if the store already exists"
  [id-str dim]
  ;; Check if the store already exists
  (if (contains? @*stores id-str)
    (@*stores id-str)
    (let [store (VectorStorage. id-str dim)]
      (swap! *stores assoc id-str store)
      (p/let [_ (.initialize store)
              _ (.load store)]
        store))))

(defn add
  "Add a record to the vector store
   - store: store handler (conn)
   - embed: the vector to be added
   - key: identifier for the record
   - data: attached metadata for the record (notice: IPC required, so don't send big objects)
   
   Returns a promise of the vector store addition
   or throw an error if the store doesn't exist"
  ([store embed key]
   (.add store embed key))
  ([store embed key data]
   (.add store embed key data)))

;; (defn addmany
;;   "Add multiple records to the vector store
;;    - store: store handler (conn)
;;    - embed: the vector to be added
;;    - key: identifier for the record
;;    - data: attached metadata for the record (notice: IPC required, so don't send big objects)
   
;;    Returns a promise of the vector store addition
;;    or throw an error if the store doesn't exist"
;;   ([store embeds key]
;;    (.addmany store embeds key))
;;   ([store embeds key data]
;;    (.addmany store embeds key data)))

(defn rm
  "Remove a record from the vector store
   - store: store handler (conn)
   - key: identifier for the record
   
   Returns a promise of the vector store removal
   true for success, false for failure
   or throw an error if the store doesn't exist"
    [store key]
    (.remove store key))

(defn search
  "Search for records in the vector store
   - store: store handler (conn)
   - embed: the vector to be searched
   - return-k: number of records to be returned
   
   Returns a promise of the vector store search
   which contains a list of records
   or throw an error if the store doesn't exist"
    [store embed return-k]
    (.search store embed return-k))

(defn reset
  "Remove all records from the vector store
   - id-str: identifier for the vector store
   
   Returns a promise of the vector store reseting
   or throw an error if the store doesn't exist"
    [id-str]
    (let [store (@*stores id-str)]
      (when-not store
        (throw (js/Error. (str "Vector store " id-str " doesn't exist"))))
      (.reset store)
      (swap! *stores dissoc id-str)))
