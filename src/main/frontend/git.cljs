(ns frontend.git
  (:refer-clojure :exclude [clone merge])
  (:require [promesa.core :as p]
            [frontend.util :as util]
            [frontend.config :as config]
            [clojure.string :as string]
            [clojure.set :as set]
            [frontend.state :as state]
            [cljs-bean.core :as bean]))

;; only support GitHub now
(defn get-username
  []
  (get-in @state/state [:me :name]))

(defn get-cors-proxy
  [repo-url]
  (or
   (when-not (string/blank? (:cors_proxy (state/get-me)))
     (:cors_proxy (state/get-me)))
   ;; Not working yet
   ;; "https://cors-proxy-logseq.vercel.app"
   "https://cors.logseq.com"))

(defn set-username-email
  [dir username email]
  (-> (p/let [_ (js/window.workerThread.setConfig dir "user.name" username)]
        (js/window.workerThread.setConfig dir "user.email" email))
      (p/catch (fn [error]
                 (prn "Git set config error:" error)))))

(defn clone
  [repo-url token]
  (js/window.workerThread.clone (config/get-repo-dir repo-url)
                                repo-url
                                (get-cors-proxy repo-url)
                                1
                                (state/get-default-branch repo-url)
                                (get-username)
                                token))

(defn list-files
  [repo-url]
  (js/window.workerThread.listFiles (config/get-repo-dir repo-url)
                                    (state/get-default-branch repo-url)))

(defn fetch
  [repo-url token]
  (js/window.workerThread.fetch (config/get-repo-dir repo-url)
                                repo-url
                                (get-cors-proxy repo-url)
                                100
                                (state/get-default-branch repo-url)
                                (get-username)
                                token))

(defn merge
  [repo-url]
  (js/window.workerThread.merge (config/get-repo-dir repo-url)
                                (state/get-default-branch repo-url)))

(defn checkout
  [repo-url]
  (js/window.workerThread.checkout (config/get-repo-dir repo-url)
                                   (state/get-default-branch repo-url)))

(defn log
  [repo-url depth]
  (js/window.workerThread.log (config/get-repo-dir repo-url)
                              (state/get-default-branch repo-url)
                              depth))

(defn pull
  [repo-url token]
  (js/window.workerThread.pull (config/get-repo-dir repo-url)
                               (get-cors-proxy repo-url)
                               (state/get-default-branch repo-url)
                               (get-username)
                               token))

(defn add
  [repo-url file]
  (when js/window.git
    (js/window.workerThread.add (config/get-repo-dir repo-url)
                                file)))

(defn remove-file
  [repo-url file]
  (js/window.workerThread.remove (config/get-repo-dir repo-url)
                                 file))

(defn rename
  [repo-url old-file new-file]
  (util/p-handle
   (add repo-url new-file)
   (fn [_]
     (remove-file repo-url old-file))))

(defn commit
  ([repo-url message]
   (commit repo-url message nil))
  ([repo-url message parent]
   (let [{:keys [name email]} (:me @state/state)]
     (js/window.workerThread.commit (config/get-repo-dir repo-url)
                                    message
                                    name
                                    email
                                    parent))))

(defn add-all
  "Equivalent to `git add --all`. Returns changed files."
  [repo-url]
  (p/let [repo-dir (config/get-repo-dir repo-url)

          ; statusMatrix will return `[]` rather than raising an error if the repo directory does
          ; not exist. So checks whether repo-dir exists before proceeding.
          _ (-> (js/window.pfs.stat repo-dir)
                (p/catch #(p/rejected (str "Cannot find repo dir '"
                                           repo-dir
                                           "' in fs when `git add --all`"))))

          status-matrix (js/window.workerThread.statusMatrixChanged repo-dir)
          changed-files (for [[file head work-dir _stage] status-matrix
                              :when (not= head work-dir)]
                          file)
          unstaged-files (for [[file _head work-dir stage] status-matrix
                               :when (not= work-dir stage)]
                           file)
          _ (p/all (for [file unstaged-files]
                     (add repo-url file)))]
    changed-files))

(defn commit-non-empty
  "Equivalent to `git add --all` and then `git commit` without `--allow-empty`."
  ([repo-url message]
   (commit-non-empty repo-url message nil))
  ([repo-url message parent]
   (p/let [changed-files (add-all repo-url)]
     (if (not-empty changed-files)
       (commit repo-url message parent)
       (p/resolved nil)))))

(defn read-commit
  [repo-url oid]
  (js/window.workerThread.readCommit (config/get-repo-dir repo-url)
                                     oid))


;; FIXME: not working
;; (defn descendent?
;;   [repo-url oid ancestor]
;;   (js/window.workerThread.isDescendent (config/get-repo-dir repo-url)
;;                                        oid
;;                                        ancestor))

(defn descendent?
  [repo-url oid ancestor]
  (p/let [child (read-commit repo-url oid)
          child-data (bean/->clj child)
          parent (read-commit repo-url ancestor)
          parent-data (bean/->clj parent)
          child-time (get-in child-data [:commit :committer :timestamp])
          parent-time (get-in parent-data [:commit :committer :timestamp])]
    (> child-time parent-time)))

(defn push
  ([repo-url token]
   (push repo-url token false))
  ([repo-url token force?]
   (js/window.workerThread.push (config/get-repo-dir repo-url)
                                (get-cors-proxy repo-url)
                                (state/get-default-branch repo-url)
                                force?
                                (get-username)
                                token)))

(defn add-commit
  [repo-url file message commit-ok-handler commit-error-handler]
  (util/p-handle
   (add repo-url file)
   (fn [_]
     (util/p-handle
      (commit repo-url message)
      (fn []
        (commit-ok-handler))
      (fn [error]
        (commit-error-handler error))))))

(defn get-diffs
  [repo-url hash-1 hash-2]
  (and js/window.git
       (let [dir (config/get-repo-dir repo-url)]
         (p/let [diffs (js/window.workerThread.getFileStateChanges hash-1 hash-2 dir)
                 diffs (cljs-bean.core/->clj diffs)
                 diffs (remove #(= (:type %) "equal") diffs)
                 diffs (map (fn [diff]
                              (update diff :path #(subs % 1))) diffs)]
           diffs))))

(defn find-common-base
  ([repo-url remote-id local-id]
   (find-common-base repo-url remote-id local-id (atom [local-id]) (atom [remote-id])))
  ([repo-url remote-id local-id local-commits remote-commits]
   ;; FIXME: p/plet not working
   (p/let
    [local-commit (read-commit repo-url local-id)]
     (p/let [remote-commit (read-commit repo-url remote-id)]
       (let [local-parent (first (get-in (bean/->clj local-commit) [:commit :parent]))

             remote-parent (first (get-in (bean/->clj remote-commit) [:commit :parent]))]
         (swap! local-commits conj local-parent)
         (swap! remote-commits conj remote-parent)
         (let [commons (set/intersection (set @local-commits)
                                         (set @remote-commits))]
           (if (seq commons)
             (first commons)
             (find-common-base repo-url local-parent remote-parent local-commits remote-commits))))))))

(defn read-blob
  [repo-url oid path]
  (js/window.workerThread.readBlob (config/get-repo-dir repo-url)
                                   oid
                                   path))
;; (resolve-ref (state/get-current-repo) "refs/remotes/origin/master")
(defn resolve-ref
  [repo-url ref]
  (js/window.workerThread.resolveRef (config/get-repo-dir repo-url) ref))

(defn write-ref!
  [repo-url oid]
  (js/window.workerThread.writeRef (config/get-repo-dir repo-url)
                                   (state/get-default-branch repo-url)
                                   oid))
