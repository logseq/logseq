(ns frontend.git
  (:refer-clojure :exclude [clone])
  (:require [promesa.core :as p]
            [frontend.util :as util]
            [frontend.config :refer [dir]]))

;; only support Github now
(defn auth
  [token]
  (prn {:token token})
  {:onAuth (fn []
             (clj->js
              {:username token
               :password "x-oauth-basic"}))})

(defn with-auth
  [token m]
  (prn {:arguments (merge (auth token)
                          m)})
  (clj->js
   (merge (auth token)
          m)))

(defn clone
  [username token repo]
  (js/git.clone (with-auth token
                  {:dir dir
                   :url repo
                   :corsProxy "https://cors.isomorphic-git.org"
                   :singleBranch true
                   :depth 1})))

(defn list-files
  []
  (js/git.listFiles (clj->js
                     {:dir dir
                      :ref "HEAD"})))

(defn pull
  [username token]
  (js/git.pull (with-auth token
                 {:dir dir
                  :ref "master"
                  :singleBranch true})))
(defn add
  [file]
  (js/git.add (clj->js
               {:dir dir
                :filepath file})))

(defn commit
  [message]
  (js/git.commit (clj->js
                  {:dir dir
                   :author {:name "Orgnote"
                            :email "orgnote@hello.world"}
                   :message message})))

(defn push
  [token]
  (js/git.push (with-auth token
                 {:dir dir
                  :remote "origin"
                  :ref "master"
                  })))

(defn add-commit-push
  [file message token push-ok-handler push-error-handler]
  (util/p-handle
   (let [files (if (coll? file) file [file])]
     (doseq [file files]
       (add file)))
   (fn [_]
     (util/p-handle
      (commit message)
      (fn [_]
        (push token)
        (push-ok-handler))
      push-error-handler))))
