(ns frontend.fs.memory-fs
  "Memory FS backed by lightning-fs

   Paths are denoted by `memory://`. No open-dir/get-files support."
  (:require [cljs-bean.core :as bean]
            [frontend.db :as db]
            [frontend.fs.protocol :as protocol]
            [logseq.common.path :as path]
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
                                                         (mapv #(path/path-join dir %) rpaths)))))]
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


(defn- <exists?
  "dir is path, without memory:// prefix for simplicity"
  [dir]
  (-> (js/window.pfs.stat dir)
      (p/then (fn [stat]
                (not (nil? stat))))
      (p/catch (fn [_]
                 nil))))

(defn- <mkdir-recur!
  "mkdir, recursively create parent directories if not exist

   lightning-fs does not support's :recursive in mkdir options"
  [dir]
  (p/let [fpath (path/url-to-path dir)
          sub-dirs (p/loop [top-parent fpath
                            remains []]
                     (p/let [exists? (<exists? top-parent)]
                       (if exists?
                         (reverse remains) ;; top-parent is the first non-exist dir
                         (p/recur (path/parent top-parent)
                                  (conj remains top-parent)))))]
    (p/loop [remains sub-dirs]
      (if (empty? remains)
        (p/resolved nil)
        (p/do! (js/window.pfs.mkdir (first remains))
               (p/recur (rest remains)))))))

(defrecord MemoryFs []
  protocol/Fs
  (mkdir! [_this dir]
    (when js/window.pfs
      (let [fpath (path/url-to-path dir)]
        (-> (js/window.pfs.mkdir fpath)
            (p/catch (fn [error] (println "(memory-fs)Mkdir error: " error)))))))

  (mkdir-recur! [_this dir]
    (when js/window.pfs
      (let [fpath (path/url-to-path dir)]
        (-> (<mkdir-recur! fpath)
            (p/catch (fn [error] (println "(memory-fs)Mkdir-recur error: " error)))))))

  (readdir [_this dir]
    (when js/window.pfs
      (let [fpath (path/url-to-path dir)]
        (-> (<readdir fpath)
            (p/then (fn [rpaths]
                      (mapv #(path/path-join "memory://" %) rpaths)))
            (p/catch (fn [error]
                       (println "(memory-fs)Readdir error: " error)
                       (p/rejected error)))))))

  (unlink! [_this _repo path opts]
    (when js/window.pfs
      (p/let [fpath (path/url-to-path path)
              stat (js/window.pfs.stat fpath)]
        (if (= (.-type stat) "file")
          (js/window.pfs.unlink fpath opts)
          (p/rejected "Unlinking a directory is not allowed, use rmdir! instead")))))
  (rmdir! [_this dir]
    (let [fpath (path/url-to-path dir)]
      (js/window.workerThread.rimraf fpath)))
  (read-file [_this dir path options]
    (let [fpath (path/url-to-path (path/path-join dir path))]
      (js/window.pfs.readFile fpath (clj->js options))))
  (write-file! [_this repo dir rpath content _opts]
    (p/let [fpath (path/url-to-path (path/path-join dir rpath))
            containing-dir (path/parent fpath)
            _ (<ensure-dir! containing-dir)
            _ (js/window.pfs.writeFile fpath content)]
      (db/set-file-content! repo rpath content)
      (db/set-file-last-modified-at! repo rpath (js/Date.))))
  (rename! [_this _repo old-path new-path]
    (let [old-path (path/url-to-path old-path)
          new-path (path/url-to-path new-path)]
      (js/window.pfs.rename old-path new-path)))
  (stat [_this fpath]
    (let [fpath (path/url-to-path fpath)]
      (js/window.pfs.stat fpath)))

  (open-dir [_this _dir]
    nil)
  (get-files [_this _path-or-handle]
    nil)
  (watch-dir! [_this _dir _options]
    nil)
  (unwatch-dir! [_this _dir]
    nil))
