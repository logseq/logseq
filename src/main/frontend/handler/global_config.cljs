(ns frontend.handler.global-config
  "This ns is a system component that encapsulates global config functionality.
  Unlike repo config, this also manages a directory for configuration. This
  component depends on a repo."
  (:require [borkdude.rewrite-edn :as rewrite]
            [clojure.edn :as edn]
            [electron.ipc :as ipc]
            [frontend.fs :as fs]
            [frontend.state :as state]
            [logseq.common.path :as path]
            [promesa.core :as p]
            [shadow.resource :as rc]))

;; Use defonce to avoid broken state on dev reload
;; Also known as home directory a.k.a. '~'
(defonce root-dir
  (atom nil))

(defn global-config-dir
  "Fetch config dir in a global config context"
  []
  (path/path-join @root-dir "config"))

(defn global-config-path
  "Fetch config path in a global config context"
  []
  (path/path-join @root-dir "config" "config.edn"))

(defn set-global-config-state!
  [content]
  (let [config (edn/read-string content)]
    (state/set-global-config! config content)
    config))

(def default-content (rc/inline "templates/global-config.edn"))

(defn- ensure-global-config-file!
  "Creates ~/.logseq/config/config.edn and its parent directory if they do not exist."
  []
  (let [config-dir (global-config-dir)
        config-path (global-config-path)]
    (p/let [_ (fs/mkdir-if-not-exists config-dir)
            file-exists? (fs/create-if-not-exists nil nil config-path default-content)]
      (when-not file-exists?
        (set-global-config-state! default-content)))))

(defn restore-global-config!
  "Sets global config state from config file"
  []
  (let [config-path (global-config-path)]
    (p/let [config-content (fs/read-file nil config-path)]
      (set-global-config-state! config-content))))

(defn set-global-config-kv!
  [k v]
  (p/let [_ (ensure-global-config-file!)]
    (let [result (rewrite/parse-string
                  (or (state/get-global-config-str-content) "{}"))
          ks (if (sequential? k) k [k])
          v (cond->> v
              (map? v)
              (reduce-kv (fn [a k v] (rewrite/assoc a k v)) (rewrite/parse-string "{}")))
          new-result (if (and (= 1 (count ks))
                              (nil? v))
                       (rewrite/dissoc result (first ks))
                       (rewrite/assoc-in result ks v))
          new-str-content (str new-result)]
      (p/do!
       (fs/write-file! (global-config-path) new-str-content)
       (state/set-global-config! (rewrite/sexpr new-result) new-str-content)))))

(defn start
  "This component has three responsibilities on start:
- Fetch root-dir for later use with config paths
- Create a global config dir and file if it doesn't exist
- Manage ui state of global config"
  [_opts]
  (-> (p/do!
       (p/let [root-dir' (ipc/ipc "getLogseqDotDirRoot")]
         (reset! root-dir root-dir'))
       (ensure-global-config-file!)
       (restore-global-config!))
      (p/timeout 6000)
      (p/catch (fn [e]
                 (js/console.error "cannot start global-config" e)))))
