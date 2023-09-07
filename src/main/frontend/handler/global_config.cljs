(ns frontend.handler.global-config
  "This ns is a system component that encapsulates global config functionality.
  Unlike repo config, this also manages a directory for configuration. This
  component depends on a repo."
  (:require [frontend.fs :as fs]
            [frontend.state :as state]
            [promesa.core :as p]
            [shadow.resource :as rc]
            [clojure.edn :as edn]
            [electron.ipc :as ipc]
            [borkdude.rewrite-edn :as rewrite]
            [logseq.common.path :as path]))

;; Use defonce to avoid broken state on dev reload
;; Also known as home directory a.k.a. '~'
(defonce root-dir
  (atom nil))

(defn global-config-dir
  "Fetch config dir in a global config context"
  []
  (path/path-join @root-dir "config"))

(defn safe-global-config-dir
  "Fetch config dir in a general context, not just for global config"
  []
  (when @root-dir (global-config-dir)))

(defn global-config-path
  "Fetch config path in a global config context"
  []
  (path/path-join @root-dir "config" "config.edn"))

(defn safe-global-config-path
  "Fetch config path in a general context, not just for global config"
  []
  (when @root-dir (global-config-path)))

(defn set-global-config-state!
  [content]
  (let [config (edn/read-string content)]
    (state/set-global-config! config content)
    config))

(def default-content (rc/inline "templates/global-config.edn"))

(defn- create-global-config-file-if-not-exists
  [repo-url]
  (let [config-dir (global-config-dir)
        config-path (global-config-path)]
    (p/let [_ (fs/mkdir-if-not-exists config-dir)
            file-exists? (fs/create-if-not-exists repo-url nil config-path default-content)]
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
    (fs/write-file! nil nil (global-config-path) new-str-content {:skip-compare? true})
    (state/set-global-config! (rewrite/sexpr new-result) new-str-content)))

(defn start
  "This component has four responsibilities on start:
- Fetch root-dir for later use with config paths
- Manage ui state of global config
- Create a global config dir and file if it doesn't exist
- Start a file watcher for global config dir if it's not already started.
  Watcher ensures client db is seeded with correct file data."
  [{:keys [repo]}]
  (-> (p/do!
       (p/let [root-dir' (ipc/ipc "getLogseqDotDirRoot")]
         (reset! root-dir root-dir'))
       (restore-global-config!)
       (create-global-config-file-if-not-exists repo)
       ;; FIXME: should use a file watcher instead of dir watcher
       (fs/watch-dir! (global-config-dir) {:global-dir true}))
      (p/timeout 6000)
      (p/catch (fn [e]
                 (js/console.error "cannot start global-config" e)))))
