(ns electron.updater
  (:require [electron.utils :refer [mac? win32? prod?]]
            [frontend.version :refer [version]]
            [clojure.string :as string]
            [promesa.core :as p]
            [cljs-bean.core :as bean]
            ["os" :as os]
            ["fs" :as fs]
            ["path" :as path]
            ["electron" :refer [ipcMain app]]
            ["open" :as open]))

(def fetch (js/require "node-fetch"))
(def *update-ready-to-install (atom nil))
(def *update-pending (atom nil))

;Event: 'error'
;Event: 'checking-for-update'
;Event: 'update-available'
;Event: 'update-not-available'
;Event: 'download-progress'
;Event: 'update-downloaded'
;Event: 'completed'

(defn get-latest-artifact-info
  [repo]
  (let [;endpoint "https://update.electronjs.org/xyhp915/cljs-todo/darwin-x64/0.0.7"
        endpoint (str "https://update.electronjs.org/" repo "/" (if mac? "darwin" "win32") "-x64/" version)]
    (p/catch
     (p/let [res (fetch endpoint)
             status (.-status res)
             text (.text res)]
       (if (.-ok res)
         (let [info (if-not (string/blank? text) (js/JSON.parse text))]
           (bean/->clj info))
         (throw (js/Error. (str "[" status "] " text)))))
     (fn [e]
       (js/console.warn "[update server error] " e)
       (throw e)))))

(defn check-for-updates
  [{:keys [repo ^js logger ^js win]}]
  (let [debug (partial (.-warn logger) "[updater]")
        emit (fn [type payload]
               (.. win -webContents
                   (send "updates-callback" (bean/->js {:type type :payload payload}))))]
    (debug "check for updates #" repo version)
    (p/create
     (fn [resolve reject]
       (emit "checking-for-update" nil)
       (-> (p/let
            [artifact (get-latest-artifact-info repo)
             url (if-not artifact (emit "update-not-available" nil) (:url artifact))
             _ (if url (emit "update-available" (bean/->js artifact)) (throw (js/Error. "download url not exists")))
               ;; start download FIXME: user's preference about auto download
             ^js dl-res (fetch url)
             _ (if-not (.-ok dl-res) (throw (js/Error. "download resource not available")))
             dest-info (p/create
                        (fn [resolve1 reject1]
                          (let [headers (. dl-res -headers)
                                total-size (js/parseInt (.get headers "content-length"))
                                body (.-body dl-res)
                                start-at (.now js/Date)
                                *downloaded (atom 0)
                                dest-basename (path/basename url)
                                tmp-dest-file (path/join (os/tmpdir) (str dest-basename ".pending"))
                                dest-file (.createWriteStream fs tmp-dest-file)]
                            (doto body
                              (.on "data" (fn [chunk]
                                            (let [downloaded (+ @*downloaded (.-length chunk))
                                                  percent (.toFixed (/ (* 100 downloaded) total-size) 2)
                                                  elapsed (/ (- (js/Date.now) start-at) 1000)]
                                              (.write dest-file chunk)
                                              (emit "download-progress" {:total      total-size
                                                                         :downloaded downloaded
                                                                         :percent    percent
                                                                         :elapsed    elapsed})
                                              (reset! *downloaded downloaded))))
                              (.on "error" (fn [e]
                                             (reject1 e)))
                              (.on "end" (fn [e]
                                           (.close dest-file)
                                           (let [dest-file (string/replace tmp-dest-file ".pending" "")]
                                             (fs/renameSync tmp-dest-file dest-file)
                                             (resolve1 (merge artifact {:dest-file dest-file})))))))))]
             (reset! *update-ready-to-install dest-info)
             (emit "update-downloaded" dest-info)
             (resolve nil))
           (p/catch
            (fn [e]
              (emit "error" e)
              (reject e)))
           (p/finally
             (fn []
               (emit "completed" nil))))))))

(defn init-updater
  [{:keys [repo logger ^js win] :as opts}]
  (let [check-channel "check-for-updates"
        install-channel "install-updates"
        check-listener (fn [e & args]
                         (when-not @*update-pending
                           (reset! *update-pending true)
                           (p/finally
                             (check-for-updates (merge opts {:args args}))
                             #(reset! *update-pending nil))))
        install-listener (fn [e quit-app?]
                           (when-let [dest-file (:dest-file @*update-ready-to-install)]
                             (open dest-file)
                             (and quit-app? (js/setTimeout #(.quit app) 1000))))]
    (.handle ipcMain check-channel check-listener)
    (.handle ipcMain install-channel install-listener)
    #(do
       (.removeHandler ipcMain install-listener)
       (.removeHandler ipcMain check-channel)
       (reset! *update-pending nil))))
