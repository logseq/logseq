(ns frontend.git
  (:refer-clojure :exclude [clone])
  (:require [promesa.core :as p]
            [frontend.util :as util]
            [frontend.config :refer [dir]]))

(defn clone
  [username token repo]
  (js/git.clone (clj->js
              {:dir dir
               :url repo
               :corsProxy "https://cors.isomorphic-git.org"
               :singleBranch true
               :depth 1
               :username username
               :token token
               })))

(defn list-files
  []
  (js/git.listFiles (clj->js
                  {:dir dir
                   :ref "HEAD"})))

(defn pull
  [username token]
  (js/git.pull (clj->js
             {:dir dir
              :ref "master"
              :username username
              :token token
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
  (js/git.push (clj->js
                {:dir dir
                 :remote "origin"
                 :ref "master"
                 :token token})))

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
