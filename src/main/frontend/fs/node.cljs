(ns frontend.fs.node
  "Implementation of fs protocol for Electron, based on nodejs"
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [electron.ipc :as ipc]
            [frontend.config :as config]
            [frontend.fs.protocol :as protocol]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [logseq.common.path :as path]
            [promesa.core :as p]))

(defn- write-file-impl!
  [repo dir rpath content {:keys [ok-handler error-handler]} _stat]
  (let [file-fpath (path/path-join dir rpath)]
    (p/catch
        (p/let [result (ipc/ipc "writeFile" repo file-fpath content)]
          (when ok-handler
            (ok-handler repo rpath result)))
        (fn [error]
          (if error-handler
            (error-handler error)
            (log/error :write-file-failed error))))))

(defn- open-dir
  "Open a new directory"
  [dir]
  (p/let [dir-path (or dir (util/mocked-open-dir-path))
          result (if dir-path
                   (do
                     (println "NOTE: Using mocked dir" dir-path)
                     (ipc/ipc "getFiles" dir-path))
                   (ipc/ipc "openDir" {}))
          result (bean/->clj result)]
    result))

(defn- wrap-throw-ex-info
  [p]
  (p/catch p (fn [e] (throw (ex-info (str e) {})))))

(defrecord Node []
  protocol/Fs
  (mkdir! [_this dir]
    (-> (ipc/ipc "mkdir" dir)
        (p/then (fn [_] (js/console.log (str "Directory created: " dir))))
        (p/catch (fn [error]
                   (when-not (string/includes? (str error) "EEXIST")
                     (js/console.error (str "Error creating directory: " dir) error))))))

  (mkdir-recur! [_this dir]
    (ipc/ipc "mkdir-recur" dir))

  (readdir [_this dir]                  ; recursive
    (wrap-throw-ex-info
     (p/then (ipc/ipc "readdir" dir)
             bean/->clj)))

  (unlink! [_this repo path _opts]
    (ipc/ipc "unlink"
             (config/get-repo-dir repo)
             path))
  (rmdir! [_this _dir]
    ;; !Too dangerous! We'll never implement this.
    nil)

  (read-file [_this dir path _options]
    (let [path (if (nil? dir)
                 path
                 (path/path-join dir path))]
      (wrap-throw-ex-info (ipc/ipc "readFile" path))))

  (read-file-raw [_this dir path _options]
    (let [path (if (nil? dir)
                 path
                 (path/path-join dir path))]
      (wrap-throw-ex-info (ipc/ipc "readFileRaw" path))))

  (write-file! [this repo dir path content opts]
    (p/let [fpath (path/path-join dir path)
            stat (p/catch
                  (protocol/stat this fpath)
                  (fn [_e] :not-found))
            parent-dir (path/parent fpath)
            _ (protocol/mkdir-recur! this parent-dir)]
      (write-file-impl! repo dir path content opts stat)))

  (rename! [_this _repo old-path new-path]
    (ipc/ipc "rename" old-path new-path))
  ;; copy with overwrite, without confirmation
  (copy! [_this repo old-path new-path]
    (ipc/ipc "copyFile" repo old-path new-path))
  (stat [_this fpath]
    (-> (ipc/ipc "stat" fpath)
        (p/then bean/->clj)))

  (open-dir [_this dir]
    (open-dir dir))

  (get-files [_this dir]
    (-> (ipc/ipc "getFiles" dir)
        (p/then (fn [result]
                  (:files (bean/->clj result))))))

  (watch-dir! [_this _dir _options])

  (unwatch-dir! [_this _dir]))
