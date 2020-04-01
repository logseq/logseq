(ns frontend.git
  (:refer-clojure :exclude [clone])
  (:require [promesa.core :as p]
            [frontend.util :as util]
            [clojure.string :as string]))

;; only support Github now
(defn auth
  [token]
  {:username token
   :password "x-oauth-basic"})

(defn with-auth
  [token m]
  (clj->js
   (merge (auth token)
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

(defn pull
  [repo-url token]
  (js/git.pull (with-auth token
                 {:dir (get-repo-dir repo-url)
                  :ref "master"
                  :singleBranch true})))
(defn add
  [repo-url file]
  (js/git.add (clj->js
               {:dir (get-repo-dir repo-url)
                :filepath file})))

(defn commit
  [repo-url message]
  (js/git.commit (clj->js
                  {:dir (get-repo-dir repo-url)
                   :author {:name "Orgnote"
                            :email "orgnote@hello.world"}
                   :message message})))

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
