(ns ^:no-doc frontend.external.roam-export
  (:require [clojure.set :as s]
            [clojure.string :as str]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [frontend.db :as db]
            [frontend.state :as state]))

(def todo-marker-regex
  #"^(NOW|LATER|TODO|DOING|WAITING|WAIT|CANCELED|CANCELLED|STARTED|IN-PROGRESS)")

(def done-marker-regex #"^DONE")

(def nano-char-range "_-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")

(defn- nano-id-char []
  (rand-nth nano-char-range))

(defn nano-id []
  (->> (repeatedly 9 nano-id-char)
       (str/join)))

(defn uuid->uid-map []
  (let [db (db/get-db (state/get-current-repo))]
    (->>
     (d/q '[:find (pull ?r [:block/uuid])
            :in $
            :where
            [?b :block/refs ?r]] db)
     (map (comp :block/uuid first))
     (distinct)
     (map (fn [uuid] [uuid (nano-id)]))
     (into {}))))

(defn update-content [content uuid->uid-map]
  (when content                         ; page block doesn't have content
    (let [uuids (keys uuid->uid-map)]
     (reduce
      (fn [acc uuid]
        (if (str/includes? acc (str uuid))
          (str/replace acc (str uuid) (get uuid->uid-map uuid))
          acc))
      content
      uuids))))

(defn update-uid [{:block/keys [uuid content] :as b}
                  uuid->uid-map]
  (cond-> b
    (contains? uuid->uid-map uuid)
    (assoc :block/uid (get uuid->uid-map uuid))

    (some (fn [id] (str/includes? (str content) (str id))) (keys uuid->uid-map))
    (update :block/content #(update-content % uuid->uid-map))))

(defn update-todo [{:block/keys [content] :as block}]
  (if content
    (update block :block/content
            (fn [c]
              (-> c
                  (str/replace todo-marker-regex "{{[[TODO]]}}")
                  (str/replace done-marker-regex "{{[[DONE]]}}")
                  (str/replace "{{embed " "{{embed: ")
                  (str/trim))))
    block))

(defn traverse
  [keyseq vec-tree]
  (let [uuid->uid-map (uuid->uid-map)]
    (walk/postwalk
     (fn [x]
       (cond
         (and (map? x) (contains? x :block/uuid))
         (-> x

             (update-uid uuid->uid-map)

             (update-todo)

             (s/rename-keys {:block/original-name :page/title
                             :block/content :block/string})

             (select-keys keyseq))

         :else
         x))
     vec-tree)))
