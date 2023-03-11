(ns ^:no-doc frontend.fs.memory-fs
  "Memory FS backed by lightning-fs
   
   denoted by `memory://`"
  (:require [cljs-bean.core :as bean]
            [frontend.db :as db]
            [frontend.fs.protocol :as protocol]
            [frontend.fs2.path :as fs2-path]
            [promesa.core :as p]))

(defn- <readdir
  "Read dir recursively, return all paths
   
   accept dir as path, without memory:// prefix for simplicity"
  [dir]
  (p/let [result (p/loop [result []
                          dirs [dir]]
                   (if (empty? dirs)
                     result
                     (p/let [dir (first dirs)
                             stat (js/window.pfs.stat dir)
                             is-file? (= (.-type stat) "file")
                             result (if is-file?
                                      (conj result dir)
                                      result)
                             dir-content (when-not is-file?
                                           (-> (js/window.pfs.readdir dir)
                                               (p/then bean/->clj)
                                               (p/then (fn [rpaths]
                                                         (mapv #(fs2-path/path-join dir %) rpaths)))))]
                       (p/recur result (concat (rest dirs) dir-content)))))]
    result))


(defn- <ensure-dir!
  "dir is path, without memory:// prefix for simplicity"
  [dir]
  (-> (p/let [stat (js/window.pfs.stat dir)]
        (cond
          (= (.-type stat) "file")
          (p/rejected "Path is a file")

          :else
          (p/resolved nil)))
      (p/catch (fn [_error]
                 (js/window.pfs.mkdir dir)))))
  

(defrecord Bfs []
  protocol/Fs
  (mkdir! [_this dir]
    (when js/window.pfs
      (let [fpath (fs2-path/url-to-path dir)]
        (-> (js/window.pfs.mkdir fpath)
            (p/catch (fn [error] (println "Mkdir error: " error)))))))
  (readdir [_this dir]
    (when js/window.pfs
      (let [fpath (fs2-path/url-to-path dir)]
        (-> (<readdir fpath)
            ;; (p/then bean/->clj)
            (p/then (fn [rpaths]
                      (prn ::debug rpaths)
                      (mapv #(fs2-path/path-join "memory://" %) rpaths)))))))

  (unlink! [_this _repo path opts]
    (when js/window.pfs
      (p/let [fpath (fs2-path/url-to-path path)
              stat (js/window.pfs.stat fpath)]
        (if (= (.-type stat) "file")
          (js/window.pfs.unlink fpath opts)
          (p/rejected "Unlinking a directory is not allowed, use rmdir! instead")))))
  (rmdir! [_this dir]
    (let [fpath (fs2-path/url-to-path dir)]
      (js/window.workerThread.rimraf fpath)))
  (read-file [_this dir path options]
    (let [fpath (fs2-path/url-to-path (fs2-path/path-join dir path))]
      (js/window.pfs.readFile fpath (clj->js options))))
  (write-file! [_this repo dir rpath content _opts]
    (p/let [fpath (fs2-path/url-to-path (fs2-path/path-join dir rpath))
            containing-dir (fs2-path/parent fpath)
            _ (<ensure-dir! containing-dir)
            _ (js/window.pfs.writeFile fpath content)]
      (db/set-file-content! repo rpath content)
      (db/set-file-last-modified-at! repo rpath (js/Date.))))
  (rename! [_this _repo old-path new-path]
    (let [old-path (fs2-path/url-to-path old-path)
          new-path (fs2-path/url-to-path new-path)]
      (js/window.pfs.rename old-path new-path)))
  (stat [_this fpath]
    (let [fpath (fs2-path/url-to-path fpath)]
      (js/window.pfs.stat fpath)))
  (open-dir [_this _dir _ok-handler]
    nil)
  (list-files [_this _path-or-handle _ok-handler]
    nil)
  (watch-dir! [_this _dir _options]
    nil)
  (unwatch-dir! [_this _dir]
    nil))
