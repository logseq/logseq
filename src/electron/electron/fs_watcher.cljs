(ns electron.fs-watcher
  "This ns is a wrapper around the @parcel/watcher.

  File watcher events are sent to the `file-watcher` ipc channel"
  (:require ["@parcel/watcher" :as parcel-watcher]
            ["electron" :refer [app]]
            ["fs" :as fs]
            ["fs/promises" :as fsp]
            [cljs-bean.core :as bean]
            [electron.logger :as logger]
            [electron.utils :as utils]
            [electron.window :as window]
            [promesa.core :as p]
            [logseq.common.path :as path]))

;; dir -> {:unsubscribe-fn}
(defonce *parcel-watcher (atom {}))

(defonce file-watcher-chan "file-watcher")
(defn- send-file-watcher! [dir type payload]
  (let [send-fn (fn [^js win]
                  (when-not (.isDestroyed win)
                    (.. win -webContents
                        (send file-watcher-chan
                              (bean/->js {:type type :payload payload})))
                    true))
        wins (if (nil? dir) ;; global file
               (window/get-all-windows)
               (window/get-graph-all-windows dir))]
    (if (nil? dir)
      ;; notify every windows
      (doseq [win wins] (send-fn win))

      ;; Should only send to one window; then dbsync will do his job
      ;; If no window is on this graph, just ignore
      (let [sent? (some send-fn wins)]
        (when-not sent? (logger/warn ::send
                                     "unhandled file event will cause uncatched file modifications!. target:" dir))))))

(defn- publish-file-event!
  ([dir path event stat content]
   (send-file-watcher! dir event {:dir (utils/fix-win-path! dir)
                                  :path (utils/fix-win-path! path)
                                  :content content
                                  :stat stat}))
  ([dir path event stat]
  (send-file-watcher! dir event {:dir (utils/fix-win-path! dir)
                                 :path (utils/fix-win-path! path)
                                 ;; :content ""
                                 :stat stat}))
  ([dir path event]
   (send-file-watcher! dir event {:dir (utils/fix-win-path! dir)
                                  :path (utils/fix-win-path! path)
                                  :stat nil})))
(defn- create-dir-watcher
  [dir]
  (p/let [_ (prn :watcher @*parcel-watcher)
          handle-event (fn [event]
                         (let [path (.-path event)
                               type (.-type event)
                               rpath (path/trim-dir-prefix dir path)]
                           (prn :event :dir dir :path rpath :type type)
                           (p/let [^js stat (-> (fsp/stat path)
                                                (p/catch (fn [] nil)))]
                             (cond
                               (= type "delete")
                               (p/let [^js stat (-> (p/delay 800)
                                                    (p/then (fn [] (fsp/stat path)))
                                                    (p/catch (constantly nil)))]
                                 (cond (and (= dir path)
                                            (nil? stat))
                                       (do (prn "top dir gone")
                                           (publish-file-event! dir dir "top-dir-gone"))

                                       stat ;; deleted then appeared, ignore this event
                                       nil

                                       rpath
                                       (do
                                         (prn "file/dir gone" rpath)
                                         (publish-file-event! dir rpath "unlink"))))


                               (nil? stat)
                               (prn :dir-gone event)

                               (.isDirectory stat)
                               (when (= dir path)
                                 (prn "top dir event" :top-dir-gone {:dir dir}))

                               ;; file updated or created
                               (or (contains? #{"create" "update"} type)
                                   (.isFile stat))
                               (let [size (.-size stat)
                                     mtime (.-mtimeMs stat)
                                     ctime (.-birthtimeMs stat)
                                     type (condp = type
                                            "update" "change"
                                            "create" "add")
                                     stat {:size size
                                           :mtime mtime
                                           :ctime ctime}]
                                 (prn "create/update event" type rpath stat)
                                 (publish-file-event! dir rpath type stat))

                               :else
                               (prn "change/add event" event)))))
          subscription (.subscribe parcel-watcher
                                   dir
                                   (fn [err #^js events]
                                     (prn ::watcher err events)
                                     (doseq [event events]
                                       (handle-event event)))
                                   (clj->js {:ignore ["**/.*"
                                                      "**/.*/**"
                                                      "**/node_modules"
                                                      "**/node_modules/**"
                                                      "**/*.swp"
                                                      "logseq/bak"
                                                      "logseq/version-files"
                                                      "logseq/broken-config.edn"
                                                      "logseq/metadata.edn"
                                                      "logseq/pages-metadata.edn"
                                                      "logseq/graphs-txid.edn"]}))]
    (swap! *parcel-watcher assoc dir subscription)
    subscription))


(.on app "quit" (fn []
                  (doseq [sub (vals @*parcel-watcher)]
                    (when-let [unsub-f (.-unsubscribe sub)]
                      (prn ::unsub... unsub-f)
                      (unsub-f)))))


(defn watch-file!
  "Watch a file and emit file events.

   @parcel/watcher does not support file watching, so we use dir watching instead"
  [fpath]
  (let [dir (path/dirname fpath)
        fname (path/filename fpath)]
    (when-not (get @*parcel-watcher fpath)
      (p/let [subscription (.subscribe parcel-watcher
                                       dir
                                       (fn [err #^js events]
                                         (when-not err
                                           (doseq [event events]
                                             (let [path (.-path event)
                                                   type (.-type event)
                                                   rpath (path/trim-dir-prefix dir path)]
                                               (when (= rpath fname)
                                                 (condp contains? type
                                                   #{"update" "create"}
                                                   (p/let [^js stat (fsp/stat path)
                                                           content (fsp/readFile path #js {:encoding "utf8"})
                                                           stat {:size (.-size stat)
                                                                 :mtime (.-mtimeMs stat)
                                                                 :ctime (.-birthtimeMs stat)}]
                                                     (publish-file-event! nil fpath "change" stat content))
                                                   #{"delete"}
                                                   (publish-file-event! nil fpath "unlink"))))))))]
        (swap! *parcel-watcher assoc fpath subscription)))))

(defn watch-dir!
  "Watches a directory and emits file events. In addition to file
  watching, clients rely on watchers to initially seed their database with
  the file contents of a dir. This is done with the ignoreInitial option
  set to false, https://github.com/paulmillr/chokidar#path-filtering. The
  watcher emits addDir and add file events which then seed the client database.
  This fn has the following options:

* :global-dir - Boolean that indicates the watched directory is global. This
  type of directory has different behavior then a normal watcher as it
  broadcasts its change events to all clients. This option needs to be passed to
  clients in order for them to identify the correct db"
  [dir]
  (when-not (get @*parcel-watcher dir)
    (if (fs/existsSync dir)
      (create-dir-watcher dir)
      ;; retry if the `dir` not exists, which is useful when a graph's folder is
      ;; back after refreshing the window
      (js/setTimeout #(watch-dir! dir) 5000))))


(defn close-watcher!
  "If no `dir` provided, close all watchers;
   Otherwise, close the specific watcher if exists"
  ([]
   (doseq [sub (vals @*parcel-watcher)]
     (prn ::xxx sub)
     (let [unsub-f (some-> sub .-unsubscribe)]
       (unsub-f)))
   (reset! *parcel-watcher {}))
  ([dir]

   (let [sub (get @*parcel-watcher dir)
         unsub-f (some-> sub .-unsubscribe)]
     (when sub
       (prn :unsub-f)
       (unsub-f)
       (swap! *parcel-watcher dissoc dir)))))
