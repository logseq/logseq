(ns frontend.handler.metadata
  (:require [frontend.state :as state]
            [frontend.handler.file :as file-handler]
            [cljs.reader :as reader]
            [frontend.config :as config]
            [frontend.db :as db]
            [clojure.string :as string]
            [promesa.core :as p]))

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
              ks (if (vector? k) k [k])
              new-metadata (assoc-in metadata ks v)
              new-metadata (if encrypted?
                             (assoc new-metadata :db/encrypted? true)
                             new-metadata)
              new-content (pr-str new-metadata)]
          (file-handler/set-file-content! repo path new-content))))))

(defn set-db-encrypted-secret!
  [encrypted-secret]
  (when-not (string/blank? encrypted-secret)
    (set-metadata! :db/encrypted-secret encrypted-secret)))
