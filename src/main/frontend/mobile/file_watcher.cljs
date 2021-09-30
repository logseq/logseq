(ns frontend.mobile.file-watcher
  (:require [frontend.mobile.util :as mobile-util]
            [cljs-bean.core :as bean]
            [promesa.core :as p]
            [cljs.core.async :as async]
            [cljs.core.async.interop :refer [<p!]]
            [frontend.db.model :as model]
            [frontend.handler.file :as file-handler]
            [clojure.string :as string]
            [frontend.fs :as fs]
            [frontend.config :as config]
            [frontend.state :as state]))

;; file watcher applies to android only

;; bit mask of file event
;; https://developer.android.com/reference/android/os/FileObserver#ALL_EVENTS
(def modify 2)
(def create 256)

(def alter-file-chan (async/chan))

(defn modify? [event]
  (not (zero? (bit-and event modify))))

(defn handle-file-change [e]
  (js/console.log "#event" (bean/->clj e))
  (p/let [repo (state/get-current-repo)
          dir  (config/get-repo-dir (state/get-current-repo))
          {:keys [event file]} (bean/->clj e)
          _ (js/console.log "#event" event "#file" file)]
    (when (and event file (modify? event))
      (p/let [db-content (model/get-file file)
              _ (js/console.log "#db-content" db-content)
              path (string/replace file dir "")
              {:keys [type uri]} (fs/stat dir path)
              _ (js/console.log "#type" type "#uri" uri)
              content (when (= type "file") (fs/read-file dir uri))
              _ (js/console.log "#content" content)
              _ (js/console.log "#modify" (modify? event))]
        (when
            (and content db-content
                 (not= (string/trim content) (string/trim db-content)))
          _ (js/console.log "#db-content" db-content)
          _ (js/console.log "#content" content)
          (js/console.log "##alter file" uri)
          (async/put! alter-file-chan [repo file content {:re-render-root? true :from-disk? true}]))))))


(defn listen-file-changes []
  (js/console.log "#register-mobile-file-watcher-listener")

  (.addListener mobile-util/file-watcher
                "fileChanged"
                handle-file-change)

  (async/go-loop []
    (let [args (async/<! alter-file-chan)]
      (js/console.log "#apply-alter-file" args)
      (<p! (apply file-handler/alter-file args)))
    (recur)))


;; ;;file path
;; ;; "/storage/emulated/0/test/logseq/config.edn"
;; (fs/read-file (config/get-repo-dir (state/get-current-repo))   "/storage/emulated/0/test/logseq/config.edn")

;; (fs/stat (config/get-repo-dir (state/get-current-repo))    "/storage/emulated/0/test/logseq/config.edn")

;; (def eee #js {:event 8, :file "/storage/emulated/0/test/journals/2021_09_30.md"})

;; (file-handler/alter-file
;;  (state/get-current-repo)
;;  "/storage/emulated/0/test/journals/2021_09_30.md"
;;  "- 123\n" {:re-render-root? true :from-disk? true})
