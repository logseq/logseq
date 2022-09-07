(ns electron.fs-watcher
  (:require [cljs-bean.core :as bean]
            ["fs" :as fs]
            ["chokidar" :as watcher]
            [electron.utils :as utils]
            ["electron" :refer [app]]
            [electron.window :as window]))

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
        wins (window/get-graph-all-windows dir)]
    (if (contains? #{"unlinkDir" "addDir"} type)
      ;; notify every windows
      (doseq [win wins] (send-fn win))

      ;; Should only send to one window; then dbsync will do his job
      ;; If no window is on this graph, just ignore
      (let [sent? (some send-fn wins)]
        (when-not sent? (.warn utils/logger
                               (str "unhandled file event will cause uncatched file modifications!. target:" dir)))))))

(defn- publish-file-event!
  [dir path event]
  (let [dir-path? (= dir path)
        content (when (and (not= event "unlink")
                           (not dir-path?)
                           (utils/should-read-content? path))
                  (utils/read-file path))
        stat (when (and (not= event "unlink")
                        (not dir-path?))
               (fs/statSync path))]
    (send-file-watcher! dir event {:dir (utils/fix-win-path! dir)
                                   :path (utils/fix-win-path! path)
                                   :content content
                                   :stat stat})))

(defn watch-dir!
  "Watch a directory if no such file watcher exists"
  [dir]
  (when-not (get @*file-watcher dir)
    (if (fs/existsSync dir)
      (let [watcher-opts (clj->js
                          {:ignored (fn [path]
                                      (utils/ignored-path? dir path))
                           :ignoreInitial false
                           :ignorePermissionErrors true
                           :interval polling-interval
                           :binaryInterval polling-interval
                           :persistent true
                           :disableGlobbing true
                           :usePolling false
                           :awaitWriteFinish true})
            dir-watcher (.watch watcher dir watcher-opts)
            watcher-del-f #(.close dir-watcher)]
        (swap! *file-watcher assoc dir [dir-watcher watcher-del-f])
        ;; TODO: batch sender
        (.on dir-watcher "unlinkDir"
             (fn [path]
               (when (= dir path)
                 (publish-file-event! dir dir "unlinkDir"))))
        (.on dir-watcher "addDir"
             (fn [path]
               (when (= dir path)
                 (publish-file-event! dir dir "addDir"))))
        (.on dir-watcher "add"
             (fn [path]
               (publish-file-event! dir path "add")))
        (.on dir-watcher "change"
             (fn [path]
               (publish-file-event! dir path "change")))
        (.on dir-watcher "unlink"
             ;; delay 500ms for syncing disks
             (fn [path]
               (js/setTimeout #(when (not (fs/existsSync path))
                                 (publish-file-event! dir path "unlink"))
                              500)))
        (.on dir-watcher "error"
             (fn [path]
               (.warn utils/logger "Watch error happened: "
                      (str {:path path}))))

        ;; electron app extends `EventEmitter`
        ;; TODO check: duplicated with the logic in "window-all-closed" ?
        (.on app "quit" watcher-del-f)

        true)
      ;; retry if the `dir` not exists, which is useful when a graph's folder is
      ;; back after refreshing the window
      (js/setTimeout #(watch-dir! dir) 5000))))

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
