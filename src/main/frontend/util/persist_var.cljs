(ns frontend.util.persist-var
  "System-component-like ns that provides an atom-like abstraction over an edn
  file"
  (:require [frontend.config :as config]
            [frontend.state :as state]
            [frontend.fs :as fs]
            [frontend.util :as util]
            [cljs.reader :as reader]
            [promesa.core :as p]))


(defn- load-rpath 
  "Returns the relative path to the file that stores the persist-var"
  [location]
  (str config/app-name "/" location ".edn"))

(defprotocol ILoad
  (-load [this])
  (-loaded? [this]))

(defprotocol ISave
  (-save [this]))

(defprotocol IResetValue
  (-reset-value! [this new graph]))

(deftype PersistVar [*value location]
  IResetValue
  (-reset-value! [_ new graph]
    (reset! *value (assoc-in @*value [graph :value] new)))

  ILoad
  (-load [_]
    (if (config/demo-graph?)
      (p/resolved nil)
      (let [repo (state/get-current-repo)
            dir (config/get-repo-dir repo)
            path (load-rpath location)]
        (p/let [file-exists? (fs/file-exists? dir path)]
          (when file-exists?
            (-> (p/chain (fs/stat dir path)
                         (fn [stat]
                           (when stat
                             (fs/read-file dir path)))
                         (fn [content]
                           (when (not-empty content)
                             (try (reader/read-string content)
                                  (catch :default e
                                    (println (util/format "read persist-var failed: %s" (load-rpath location)))
                                    (js/console.dir e)))))
                         (fn [value]
                           (when (some? value)
                             (swap! *value (fn [o]
                                             (-> o
                                                 (assoc-in [repo :loaded?] true)
                                                 (assoc-in [repo :value] value)))))))
                (p/catch (fn [e]
                           (println (util/format "load persist-var failed: %s: %s" (load-rpath location) e))))))))))
  (-loaded? [_]
    (get-in @*value [(state/get-current-repo) :loaded?]))

  ISave
  (-save [_]
    (if (config/demo-graph?)
      (p/resolved nil)
      (let [path (load-rpath location)
            repo (state/get-current-repo)
            content (str (get-in @*value [repo :value]))
            dir (config/get-repo-dir repo)]
        (fs/write-file! repo dir path content {:skip-compare? true}))))

  IDeref
  (-deref [_this]
    (get-in @*value [(state/get-current-repo) :value]))

  IReset
  (-reset!
    ;; "Deprecated - use (.reset-value! o) instead."
    [_ new-value]
    (swap! *value (fn [_] (assoc-in @*value [(state/get-current-repo) :value] new-value))))

  IPrintWithWriter
  (-pr-writer [_ w _opts]
    (write-all w (str "#PersistVar[" @*value ", loc: " location "]"))))


(def *all-persist-vars (atom []))

(defn load-vars []
  (p/all (mapv -load @*all-persist-vars)))

(defn persist-var
  "This var is stored at logseq/LOCATION.edn"
  [init-value location]
  (let [var (->PersistVar (atom {(state/get-current-repo)
                                 {:value init-value
                                  :loaded? false}})
                          location)]
    (swap! *all-persist-vars conj var)
    var))

(defn persist-save [v]
  {:pre [(satisfies? ISave v)]}
  (-save v))

(comment
  (do
    (def bbb (persist-var 1 "aaa"))
    (-save bbb)

    ))
