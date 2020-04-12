(ns frontend.git
  (:refer-clojure :exclude [clone merge])
  (:require [promesa.core :as p]
            [frontend.util :as util]
            [clojure.string :as string]
            [frontend.state :as state]))

;; only support Github now
(defn auth
  [token]
  {:username token
   :password "x-oauth-basic"})

(defn set-username-email
  [dir username email]
  (util/p-handle (js/git.config (clj->js
                                 {:dir dir
                                  :path "user.name"
                                  :value username}))
                 (fn [result]
                   (js/git.config (clj->js
                                   {:dir dir
                                    :path "user.email"
                                    :value email})))
                 (fn [error]
                   (prn "error:" error))))

(defn with-auth
  [token m]
  (clj->js
   (clojure.core/merge (auth token)
                       m)))

(defn get-repo-dir
  [repo-url]
  (str "/" (last (string/split repo-url #"/"))))

(defn clone
  [repo-url token]
  (js/git.clone (with-auth token
                  {:dir (get-repo-dir repo-url)
                   :url repo-url
                   :corsProxy "https://cors.isomorphic-git.org"
                   :singleBranch true
                   :depth 1})))

(defn list-files
  [repo-url]
  (js/git.listFiles (clj->js
                     {:dir (get-repo-dir repo-url)
                      :ref "HEAD"})))

(defn fetch
  [repo-url token]
  (js/git.fetch (with-auth token
                  {:dir (get-repo-dir repo-url)
                   :ref "master"
                   :singleBranch true
                   :depth 1
                   :tags false})))

(defn merge
  [repo-url]
  (js/git.merge (clj->js
                 {:dir (get-repo-dir repo-url)
                  :ours "master"
                  :theirs "remotes/origin/master"})))

(defn log
  [repo-url token depth]
  (js/git.log (with-auth token
                {:dir (get-repo-dir repo-url)
                 :ref "master"
                 :depth depth
                 :singleBranch true})))

(defn pull
  [repo-url token]
  (js/git.pull (with-auth token
                 {:dir (get-repo-dir repo-url)
                  :ref "master"
                  :singleBranch true
                  :fast true})))
(defn add
  [repo-url file]
  (js/git.add (clj->js
               {:dir (get-repo-dir repo-url)
                :filepath file})))

(defn commit
  [repo-url message]
  (let [{:keys [name email]} (:me @state/state)]
    (js/git.commit (clj->js
                   {:dir (get-repo-dir repo-url)
                    :message message
                    :author {:name name
                             :email email}}))))

(defn push
  [repo-url token]
  (js/git.push (with-auth token
                 {:dir (get-repo-dir repo-url)
                  :remote "origin"
                  :ref "master"
                  })))

(defn add-commit-push
  [repo-url file message token push-ok-handler push-error-handler]
  (util/p-handle
   (let [files (if (coll? file) file [file])]
     (doseq [file files]
       (add repo-url file)))
   (fn [_]
     (util/p-handle
      (commit repo-url message)
      (fn [_]
        (push repo-url token)
        (push-ok-handler))
      push-error-handler))))

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
