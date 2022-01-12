(ns electron.fs-watcher
  (:require [cljs-bean.core :as bean]
            ["fs" :as fs]
            ["chokidar" :as watcher]
            [electron.utils :as utils]
            ["electron" :refer [app]]))

;; TODO: explore different solutions for different platforms
;; 1. https://github.com/Axosoft/nsfw

(defonce polling-interval 10000)
(defonce file-watcher (atom nil))

(defonce file-watcher-chan "file-watcher")
(defn send-file-watcher! [^js win type payload]
  (when-not (.isDestroyed win)
    (.. win -webContents
        (send file-watcher-chan
              (bean/->js {:type type :payload payload})))))

(defn- publish-file-event!
  [win dir path event]
  (send-file-watcher! win event {:dir (utils/fix-win-path! dir)
                                 :path (utils/fix-win-path! path)
                                 :content (utils/read-file path)
                                 :stat (fs/statSync path)}))

(defn watch-dir!
  [win dir]
  (when (fs/existsSync dir)
    (let [watcher (.watch watcher dir
                          (clj->js
                           {:ignored (fn [path]
                                       (utils/ignored-path? dir path))
                            :ignoreInitial false
                            :ignorePermissionErrors true
                            :interval polling-interval
                            :binaryInterval polling-interval
                            :persistent true
                            :disableGlobbing true
                            :usePolling false
                            :awaitWriteFinish true}))]
      (reset! file-watcher watcher)
      ;; TODO: batch sender
      (.on watcher "add"
           (fn [path]
             (publish-file-event! win dir path "add")))
      (.on watcher "change"
           (fn [path]
             (publish-file-event! win dir path "change")))
      (.on watcher "unlink"
           (fn [path]
             (send-file-watcher! win "unlink"
                                 {:dir (utils/fix-win-path! dir)
                                  :path (utils/fix-win-path! path)})))
      (.on watcher "error"
           (fn [path]
             (println "Watch error happened: "
                      {:path path})))

      (.on app "quit" #(.close watcher))

      true)))

(defn close-watcher!
  []
  (when-let [watcher @file-watcher]
    (.close watcher)))
