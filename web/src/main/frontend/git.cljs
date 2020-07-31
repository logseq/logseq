(ns frontend.git
  (:refer-clojure :exclude [clone merge])
  (:require [promesa.core :as p]
            [frontend.util :as util]
            [clojure.string :as string]
            [clojure.set :as set]
            [frontend.state :as state]
            [goog.object :as gobj]
            [cljs-bean.core :as bean]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]))

;; TODO: move to a js worker

(defonce default-branch "master")
;; only support Github now
(defn auth
  [token]
  {:username (get-in @state/state [:me :name])
   :token token})

(defn set-username-email
  [dir username email]
  (util/p-handle (js/window.git.config (clj->js
                                        {:global true
                                         :dir dir
                                         :path "user.name"
                                         :value username}))
                 (fn [result]
                   (js/window.git.config (clj->js
                                          {:global true
                                           :dir dir
                                           :path "user.email"
                                           :value email})))
                 (fn [error]
                   (prn "error:" error))))

(defn with-auth
  [token m]
  (clj->js
   (clojure.core/merge (auth token)
                       m)))

(defn clone
  [repo-url token]
  (js/window.git.clone (with-auth token
                         {:dir (util/get-repo-dir repo-url)
                          :url repo-url
                          :corsProxy (or
                                      (:cors-proxy (state/get-config repo-url))
                                      "https://cors-proxy-logseq.vercel.app")
                          :singleBranch true
                          :depth 1})))

(defn list-files
  [repo-url]
  (js/window.git.listFiles (clj->js
                            {:dir (util/get-repo-dir repo-url)
                             :ref "HEAD"})))

(defn fetch
  [repo-url token]
  (js/window.git.fetch (with-auth token
                         {:dir (util/get-repo-dir repo-url)
                          :ref default-branch
                          :singleBranch true
                          :depth 100
                          :tags false})))

(defn merge
  [repo-url]
  (js/window.git.merge (clj->js
                        {:dir (util/get-repo-dir repo-url)
                         :ours default-branch
                         :theirs (str "remotes/origin/" default-branch)
                         :fastForwardOnly true})))

(defn checkout
  [repo-url]
  (js/window.git.checkout (clj->js
                           {:dir (util/get-repo-dir repo-url)
                            :ref default-branch})))

(defn log
  [repo-url token depth]
  (and js/window.git
       (js/window.git.log (with-auth token
                            {:dir (util/get-repo-dir repo-url)
                             :ref default-branch
                             :depth depth
                             :singleBranch true}))))

(defn pull
  [repo-url token]
  (js/window.git.pull (with-auth token
                        {:dir (util/get-repo-dir repo-url)
                         :ref default-branch
                         :singleBranch true
                         :fast true})))
(defn add
  [repo-url file]
  (when js/window.git
    (js/window.git.add (clj->js
                        {:dir (util/get-repo-dir repo-url)
                         :filepath file}))))

(defn remove-file
  [repo-url file]
  (js/window.git.remove (clj->js
                         {:dir (util/get-repo-dir repo-url)
                          :filepath file})))

(defn rename
  [repo-url old-file new-file]
  (util/p-handle
   (add repo-url new-file)
   (fn [_]
     (remove-file repo-url old-file))))

(defn commit
  [repo-url message]
  (let [{:keys [name email]} (:me @state/state)]
    (js/window.git.commit (clj->js
                           {:dir (util/get-repo-dir repo-url)
                            :message message
                            :author {:name name
                                     :email email}}))))

(defn read-commit
  [repo-url oid]
  (js/window.git.readCommit (clj->js
                             {:dir (util/get-repo-dir repo-url)
                              :oid oid})))

(defn push
  ([repo-url token]
   (push repo-url token false))
  ([repo-url token force?]
   (js/window.git.push (with-auth token
                         {:dir (util/get-repo-dir repo-url)
                          :remote "origin"
                          :ref default-branch
                          :force force?}))))

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
       (let [dir (util/get-repo-dir repo-url)]
         (p/let [diffs (js/window.workerThread.getFileStateChanges hash-1 hash-2 dir)
                 diffs (cljs-bean.core/->clj diffs)
                 diffs (remove #(= (:type %) "equal") diffs)
                 diffs (map (fn [diff]
                              (update diff :path #(subs % 1))) diffs)]
           diffs))))

;; https://isomorphic-git.org/docs/en/statusMatrix
;; TODO: status should not be `pulling`, otherwise the `:deleted` part is weird.
;; (defn get-status-matrix
;;   ([repo-url]
;;    (get-status-matrix repo-url "master"))
;;   ([repo-url branch]
;;    (p/let [matrix (js/window.git.statusMatrix
;;                    (clj->js
;;                     {:dir (util/get-repo-dir repo-url)
;;                      :ref "HEAD"}))]
;;      (let [matrix (bean/->clj matrix)]
;;        ;; added, modified, deleted
;;        {:added (->> (filter (fn [[_file head-status _workdir-status _stage-status]]
;;                               (= head-status 0))
;;                             matrix)
;;                     (map first))
;;         :modified (->> (filter (fn [[_file _head-status workdir-status _stage-status]]
;;                                  (= workdir-status 2))
;;                                matrix)
;;                        (map first))
;;         :deleted (->> (filter (fn [[_file _head-status workdir-status _stage-status]]
;;                                 (= workdir-status 0))
;;                               matrix)
;;                       (map first))}))))

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

(defn get-local-diffs
  [repo-url remote-id local-id]
  (get-diffs repo-url remote-id local-id))

(defn read-blob
  [repo-url oid path]
  (js/window.git.readBlob (clj->js
                           {:dir (util/get-repo-dir repo-url)
                            :gitdir (str (util/get-repo-dir repo-url) ".git")
                            :oid oid
                            :path path})))

;; * await git.writeRef({
;;                       *   fs,
;;                       *   dir: '/tutorial',
;;                       *   ref: 'refs/heads/another-branch',
;;                       *   value: 'HEAD'
;;                       * })
(defn write-ref!
  [repo-url oid]
  (js/window.git.writeRef (clj->js
                           {:dir (util/get-repo-dir repo-url)
                            :ref (str "refs/heads/" default-branch)
                            :value oid
                            :force true})))

;; "git log -1 --pretty=\"format:%cI\""
;; FIXME: Uncaught (in promise) ObjectTypeAssertionFail: Object 0698e8812d6f7b37dc98aea28de2d04714cead80 was anticipated to be a commit but it is a blob. This is probably a bug deep in isomorphic-git!
;; (defn get-last-modified-date
;;   [repo-url token path]
;;   (let [dir (util/get-repo-dir repo-url)]
;;     (p/let [commits (log repo-url token 1)
;;             commit (first commits)
;;             time (try
;;                    (p/let [o (js/window.git.readObject #js {:dir dir
;;                                                      :oid (gobj/get commit "oid")
;;                                                      :filepath path})
;;                            oid (gobj/get o "oid")
;;                            commit (read-commit repo-url oid)]
;;                      (-> (gobj/get commit "author")
;;                          (gobj/get "timestamp")))
;;                      (catch js/Error e
;;                        nil))]
;;       (when time
;;         (-> (* time 1000)
;;             (tc/to-date-time)
;;             (t/to-default-time-zone))))))
