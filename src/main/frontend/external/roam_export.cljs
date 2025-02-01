(ns ^:no-doc frontend.external.roam-export
  (:require [clojure.set :as s]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [frontend.db.async :as db-async]
            [frontend.state :as state]
            [promesa.core :as p]))

(def todo-marker-regex
  #"^(NOW|LATER|TODO|DOING|WAITING|WAIT|CANCELED|CANCELLED|STARTED|IN-PROGRESS)")

(def done-marker-regex #"^DONE")

(def nano-char-range "_-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")

(defn- nano-id-char []
  (rand-nth nano-char-range))

(defn nano-id []
  (->> (repeatedly 9 nano-id-char)
       (string/join)))

(defn <uuid->uid-map []
  (let [repo (state/get-current-repo)]
    (p/let [result (db-async/<q repo {:transact-db? false}
                                '[:find (pull ?r [:block/uuid])
                                  :in $
                                  :where
                                  [?b :block/refs ?r]])]
      (->> result
           (map (comp :block/uuid first))
           (distinct)
           (map (fn [uuid] [uuid (nano-id)]))
           (into {})))))

(defn update-content [content uuid->uid-map]
  (when content                         ; page block doesn't have content
    (let [uuids (keys uuid->uid-map)]
      (reduce
       (fn [acc uuid]
         (if (string/includes? acc (str uuid))
           (string/replace acc (str uuid) (get uuid->uid-map uuid))
           acc))
       content
       uuids))))

(defn update-uid [{:block/keys [uuid title] :as b}
                  uuid->uid-map]
  (cond-> b
    (contains? uuid->uid-map uuid)
    (assoc :block/uid (get uuid->uid-map uuid))

    (some (fn [id] (string/includes? (str title) (str id))) (keys uuid->uid-map))
    (update :block/title #(update-content % uuid->uid-map))))

(defn update-todo [{:block/keys [title] :as block}]
  (if title
    (update block :block/title
            (fn [c]
              (-> c
                  (string/replace todo-marker-regex "{{[[TODO]]}}")
                  (string/replace done-marker-regex "{{[[DONE]]}}")
                  (string/replace "{{embed " "{{embed: ")
                  (string/trim))))
    block))

(defn traverse
  [keyseq vec-tree]
  (p/let [uuid->uid-map (<uuid->uid-map)]
    (walk/postwalk
     (fn [x]
       (cond
         (and (map? x) (contains? x :block/uuid))
         (-> x

             (update-uid uuid->uid-map)

             (update-todo)

             (s/rename-keys {:block/title :page/title})

             (select-keys keyseq))

         :else
         x))
     vec-tree)))
