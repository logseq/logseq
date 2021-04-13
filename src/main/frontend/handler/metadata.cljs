(ns frontend.handler.metadata
  (:require [frontend.state :as state]
            [frontend.handler.file :as file-handler]
            [cljs.reader :as reader]
            [frontend.config :as config]
            [frontend.db :as db]
            [datascript.db :as ddb]
            [clojure.string :as string]
            [promesa.core :as p]
            [medley.core :as medley]))

(def default-metadata-str "{}")

(defn set-metadata!
  [k v]
  (when-let [repo (state/get-current-repo)]
    (let [encrypted? (= k :db/encrypted-secret)
          path (config/get-metadata-path)
          file-content (db/get-file-no-sub path)]
      (p/let [_ (file-handler/create-metadata-file repo false)]
        (let [metadata-str (or file-content default-metadata-str)
              metadata (try
                         (reader/read-string metadata-str)
                         (catch js/Error e
                           (println "Parsing metadata.edn failed: ")
                           (js/console.dir e)
                           {}))
              new-metadata (cond
                             (= k :block/properties)
                             (update metadata :block/properties v) ; v should be a function
                             :else
                             (let [ks (if (vector? k) k [k])]
                               (assoc-in metadata ks v)))
              new-metadata (if encrypted?
                             (assoc new-metadata :db/encrypted? true)
                             new-metadata)
              _ (prn "New metadata:\n" new-metadata)
              new-content (pr-str new-metadata)]
          (file-handler/set-file-content! repo path new-content))))))

(defn set-db-encrypted-secret!
  [encrypted-secret]
  (when-not (string/blank? encrypted-secret)
    (set-metadata! :db/encrypted-secret encrypted-secret)))

(defn- handler-properties!
  [all-properties properties-tx]
  (reduce
   (fn [acc datom]
     (let [v (:v datom)
           id (or (get v :id)
                  (get v :title))]
       (if id
         (let [added? (ddb/datom-added datom)
               remove-all-properties? (and (not added?)
                                           ;; only id
                                           (= 1 (count v)))]
           (if remove-all-properties?
             (dissoc acc id)
             (assoc acc id v)))
         acc)))
   all-properties
   properties-tx))

(defn update-properties!
  [properties-tx]
  (set-metadata! :block/properties #(handler-properties! % properties-tx)))
