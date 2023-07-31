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
    (p/rejected (js/Error. (str "Vector store " id-str " already exists")))
    (let [store (VectorStorage. id-str dim)]
      (swap! *stores assoc id-str store)
      (p/let [_ (.initialize store)]
        (.load store)))))

(defn try-create
  "Get a vector store handler in the app runtime state
   It the store is persisted, it will be loaded from the disk
   If the handler is already created, return a rejected promise.
   - id-str: identifier for the vector store (should be unique!)
   - dim: dimension of the vector
   
   Returns a promise of the vector store prepared (loaded, and the num of vecs that loaded)
   or nil if the store already exists"
  [id-str dim]
  ;; Check if the store already exists
  (if (contains? @*stores id-str)
    nil
    (let [store (VectorStorage. id-str dim)]
      (swap! *stores assoc id-str store)
      (p/let [_ (.initialize store)]
        (.load store)))))

(defn add
  "Add a record to the vector store
   - id-str: identifier for the vector store
   - embed: the vector to be added
   - key: identifier for the record
   - data: attached metadata for the record (notice: IPC required, so don't send big objects)
   
   Returns a promise of the vector store addition
   or throw an error if the store doesn't exist"
    [id-str embed key data]
    (let [store (@*stores id-str)]
      (when-not store
        (throw (js/Error. (str "Vector store " id-str " doesn't exist"))))
      (.add store embed key data)))

(defn rm
  "Remove a record from the vector store
   - id-str: identifier for the vector store
   - key: identifier for the record
   
   Returns a promise of the vector store removal
   or throw an error if the store doesn't exist"
    [id-str key]
    (let [store (@*stores id-str)]
      (when-not store
        (throw (js/Error. (str "Vector store " id-str " doesn't exist"))))
      (.remove store key)))

(defn search
  "Search for records in the vector store
   - id-str: identifier for the vector store
   - embed: the vector to be searched
   - return-k: number of records to be returned
   
   Returns a promise of the vector store search
   which contains a list of records
   or throw an error if the store doesn't exist"
    [id-str embed return-k]
    (let [store (@*stores id-str)]
      (when-not store
        (throw (js/Error. (str "Vector store " id-str " doesn't exist"))))
      (.search store embed return-k)))

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
