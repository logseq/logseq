(ns electron.fs-watcher
  (:require [cljs-bean.core :as bean]
            ["fs" :as fs]
            ["chokidar" :as watcher]
            [electron.utils :as utils]
            ["electron" :refer [app]]
            [frontend.util.fs :as util-fs]
            [electron.window :as window]))

;; TODO: explore different solutions for different platforms
;; 1. https://github.com/Axosoft/nsfw

(defonce polling-interval 10000)
;; dir -> Watcher
(defonce *file-watcher (atom {})) ;; val: [watcher watcher-del-f]

(defonce file-watcher-chan "file-watcher")
(defn- send-file-watcher! [dir type payload]
  ;; Should only send to one window; then dbsync will do his job
  (some (fn [^js win]
          (when-not (.isDestroyed win)
            (.. win -webContents
                (send file-watcher-chan
                      (bean/->js {:type type :payload payload})))
            true)) ;; break some loop on success
        (window/get-graph-all-windows dir)))

(defn- publish-file-event!
  [dir path event]
  (send-file-watcher! dir event {:dir (utils/fix-win-path! dir)
                                 :path (utils/fix-win-path! path)
                                 :content (utils/read-file path)
                                 :stat (fs/statSync path)}))

(defn watch-dir!
  [_win dir]
  (when (and (fs/existsSync dir)
             (not (get @*file-watcher dir)))
    (let [watcher (.watch watcher dir
                          (clj->js
                           {:ignored (fn [path]
                                       (util-fs/ignored-path? dir path))
                            :ignoreInitial false
                            :ignorePermissionErrors true
                            :interval polling-interval
                            :binaryInterval polling-interval
                            :persistent true
                            :disableGlobbing true
                            :usePolling false
                            :awaitWriteFinish true}))
          watcher-del-f #(.close watcher)]
      (swap! *file-watcher assoc dir [watcher watcher-del-f])
      ;; TODO: batch sender
      (.on watcher "add"
           (fn [path]
             (publish-file-event! dir path "add")))
      (.on watcher "change"
           (fn [path]
             (publish-file-event! dir path "change")))
      (.on watcher "unlink"
           (fn [path]
             (send-file-watcher! dir "unlink"
                                 {:dir (utils/fix-win-path! dir)
                                  :path (utils/fix-win-path! path)})))
      (.on watcher "error"
           (fn [path]
             (println "Watch error happened: "
                      {:path path})))

      (.on app "quit" watcher-del-f)

      true)))

(defn close-watcher!
  ([]
   (doseq [[watcher watcher-del-f] (vals @*file-watcher)]
     (.close watcher)
     (.on app "quit" watcher-del-f))
   (reset! *file-watcher {}))
  ([dir]
   (let [wins (window/get-graph-all-windows dir)
         [watcher watcher-del-f] (get @*file-watcher dir)]
     (when (and (<= (count wins) 1)
                watcher)
       (.close watcher)
       (.on app "quit" watcher-del-f)
       (swap! *file-watcher dissoc dir)))))
