(ns electron.updater
  (:require [electron.utils :refer [mac? win32? prod? open fetch logger]]
            [frontend.version :refer [version]]
            [clojure.string :as string]
            [promesa.core :as p]
            [cljs-bean.core :as bean]
            [electron.configs :as cfgs]
            ["semver" :as semver]
            ["os" :as os]
            ["fs" :as fs]
            ["path" :as path]
            ["electron" :refer [ipcMain app]]))

(def *update-ready-to-install (atom nil))
(def *update-pending (atom nil))
(def debug (partial (.-warn logger) "[updater]"))

;Event: 'error'
;Event: 'checking-for-update'
;Event: 'update-available'
;Event: 'update-not-available'
;Event: 'download-progress'
;Event: 'update-downloaded'
;Event: 'completed'

(def electron-version
  (let [parts (string/split version #"\.")
        parts (take 3 parts)]
    (string/join "." parts)))

(defn get-latest-artifact-info
  [repo]
  (let [;endpoint "https://update.electronjs.org/xyhp915/cljs-todo/darwin-x64/0.0.4"
        endpoint (str "https://update.electronjs.org/" repo "/" js/process.platform "-" js/process.arch "/" electron-version)]
    (debug "checking" endpoint)
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
  [{:keys           [repo ^js win]
    [auto-download] :args}]
  (let [emit (fn [type payload]
               (.. win -webContents
                   (send "updates-callback" (bean/->js {:type type :payload payload}))))]
    (debug "check for updates #" repo version)
    (p/create
     (fn [resolve reject]
       (emit "checking-for-update" nil)
       (-> (p/let
            [artifact (get-latest-artifact-info repo)

             artifact (when-let [remote-version (and artifact (re-find #"\d+\.\d+\.\d+" (:url artifact)))]
                        (if (and (. semver valid remote-version)
                                 (. semver lt electron-version remote-version)) artifact))

             url (if-not artifact (do (emit "update-not-available" nil) (throw nil)) (:url artifact))
             _ (if url (emit "update-available" (bean/->js artifact)) (throw (js/Error. "download url not exists")))
               ;; start download FIXME: user's preference about auto download
             _ (when-not auto-download (throw nil))
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
              (if e
                (do
                  (emit "error" e)
                  (reject e))
                (resolve nil))))
           (p/finally
             (fn []
               (emit "completed" nil))))))))

(defn init-auto-updater
  [repo]
  (when (.valid semver electron-version)
    (p/let [info (get-latest-artifact-info repo)]
      (when-let [remote-version (and info (re-find #"\d+\.\d+\.\d+" (:url info)))]
        (if (and (. semver valid remote-version)
                 (. semver lt electron-version remote-version))

           ;; start auto updater
          (do
            (debug "Found remote version" remote-version)
            (when mac?
              (when-let [f (js/require "update-electron-app")]
                (f #js{}))))

          (debug "Skip remote version [ahead of pre-release]" remote-version))))))

(defn init-updater
  [{:keys [repo logger ^js win] :as opts}]
  (and prod? (not= false (cfgs/get-item :auto-update)) (init-auto-updater repo))
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
       (.removeHandler ipcMain install-channel)
       (.removeHandler ipcMain check-channel)
       (reset! *update-pending nil))))
