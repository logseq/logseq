(ns electron.fs-watcher
  "This ns is a wrapper around the chokidar file watcher,
  https://www.npmjs.com/package/chokidar. File watcher events are sent to the
  `file-watcher` ipc channel"
  (:require [cljs-bean.core :as bean]
            ["fs" :as fs]
            ["chokidar" :as watcher]
            [electron.utils :as utils]
            [electron.logger :as logger]
            ["electron" :refer [app]]
            [electron.window :as window]
            [logseq.common.graph :as common-graph]))

;; TODO: explore different solutions for different platforms
;; 1. https://github.com/Axosoft/nsfw

(defonce polling-interval 10000)
;; dir -> Watcher
(defonce *file-watcher (atom {})) ;; val: [watcher watcher-del-f]

(defonce file-watcher-chan "file-watcher")
(defn- send-file-watcher! [dir type payload]
  (let [send-fn (fn [^js win]
                  (when-not (.isDestroyed win)
                    (.. win -webContents
                        (send file-watcher-chan
                              (bean/->js {:type type :payload payload})))
                    true))
        wins (if (:global-dir payload)
               (window/get-all-windows)
               (window/get-graph-all-windows dir))]
    (if (or (contains? #{"unlinkDir" "addDir"} type)
            ;; Only change events to a global dir are emitted to all windows.
            ;; Add* events are not emitted to all since each client adds
            ;; files at different times.
            (and (:global-dir payload) (= "change" type)))
      ;; notify every windows
      (doseq [win wins] (send-fn win))

      ;; Should only send to one window; then dbsync will do his job
      ;; If no window is on this graph, just ignore
      (let [sent? (some send-fn wins)]
        (when-not sent? (logger/warn ::send
                                     "unhandled file event will cause uncatched file modifications!. target:" dir))))))

(defn- publish-file-event!
  [dir path event options]
  (let [dir-path? (= dir path)
        content (when (and (not= event "unlink")
                           (not dir-path?)
                           (utils/should-read-content? path))
                  (utils/read-file path))
        stat (when (and (not= event "unlink")
                        (not dir-path?))
               (fs/statSync path))]
    (send-file-watcher! dir event (merge {:dir (utils/fix-win-path! dir)
                                          :path (utils/fix-win-path! path)
                                          :content content
                                          :stat stat}
                                         (select-keys options [:global-dir])))))
(defn- create-dir-watcher
  [dir options]
  (let [watcher-opts (clj->js
                      {:ignored (fn [path]
                                  (common-graph/ignored-path? dir path))
                       :ignoreInitial true
                       :ignorePermissionErrors true
                       :interval polling-interval
                       :binaryInterval polling-interval
                       :persistent true
                       :disableGlobbing true
                       :usePolling false
                       :awaitWriteFinish true})
        dir-watcher (.watch watcher dir watcher-opts)]
    ;; TODO: batch sender
    (.on dir-watcher "unlinkDir"
         (fn [path]
           (logger/warn ::on-unlink-dir {:path path})
           (when (= dir path)
             (publish-file-event! dir dir "unlinkDir" options))))
    (.on dir-watcher "addDir"
         (fn [path]
           (when (= dir path)
             (publish-file-event! dir dir "addDir" options))))
    (.on dir-watcher "add"
         (fn [path]
           (publish-file-event! dir path "add" options)))
    (.on dir-watcher "change"
         (fn [path]
           (publish-file-event! dir path "change" options)))
    (.on dir-watcher "unlink"
         ;; delay 500ms for syncing disks
         (fn [path]
           (logger/debug ::on-unlink {:path path})
           (js/setTimeout #(when (not (fs/existsSync path))
                             (publish-file-event! dir path "unlink" options))
                          500)))
    (.on dir-watcher "error"
         (fn [path]
           (logger/warn ::on-error "Watch error happened:" {:path path})))

    dir-watcher))

(defn- seed-client-with-initial-global-dir-data
  "Ensures that secondary clients initialize their databases efficiently and in
  the same way as the primary client. This fn achieves this by creating a
  temporary watcher whose sole purpose is to seed the db and then close  when
  its done seeding a.k.a. ready event fires."
  [dir options]
  (let [dir-watcher (create-dir-watcher dir options)]
    (.on dir-watcher "ready" (fn []
                               (.close dir-watcher)))))

(defn- create-and-save-watcher
  [dir options]
  (let [dir-watcher (create-dir-watcher dir options)
        watcher-del-f #(.close dir-watcher)]
    (swap! *file-watcher assoc dir [dir-watcher watcher-del-f])
    ;; electron app extends `EventEmitter`
    ;; TODO check: duplicated with the logic in "window-all-closed" ?
    (.on app "quit" watcher-del-f)))

(defn- watch-global-dir!
  "Only one watcher exists per global dir so only create the watcher for the
  primary client. Secondary clients only seed their client database."
  [dir options]
  (if (get @*file-watcher dir)
    (seed-client-with-initial-global-dir-data dir options)
    (create-and-save-watcher dir options)))

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
  [dir options]
  (if (:global-dir options)
    (watch-global-dir! dir options)
    (when-not (get @*file-watcher dir)
      (if (fs/existsSync dir)
        (create-and-save-watcher dir options)
        ;; retry if the `dir` not exists, which is useful when a graph's folder is
        ;; back after refreshing the window
        (js/setTimeout #(watch-dir! dir options) 5000)))))

(defn close-watcher!
  "If no `dir` provided, close all watchers;
   Otherwise, close the specific watcher if exists"
  ([]
   (doseq [[watcher watcher-del-f] (vals @*file-watcher)]
     (.close watcher)
     (.removeListener app "quit" watcher-del-f))
   (reset! *file-watcher {}))
  ([dir]
   (let [[watcher watcher-del-f] (get @*file-watcher dir)]
     (when watcher
       (.close watcher)
       (.removeListener app "quit" watcher-del-f)
       (swap! *file-watcher dissoc dir)))))
