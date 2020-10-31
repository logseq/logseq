(ns frontend.handler.git
  (:refer-clojure :exclude [clone load-file])
  (:require [frontend.util :as util :refer-macros [profile]]
            [frontend.fs :as fs]
            [promesa.core :as p]
            [frontend.state :as state]
            [frontend.db :as db]
            [frontend.git :as git]
            [frontend.github :as github]
            [cljs-bean.core :as bean]
            [frontend.date :as date]
            [frontend.config :as config]
            [frontend.format :as format]
            [frontend.format.protocol :as protocol]
            [goog.object :as gobj]
            [frontend.handler.notification :as notification]
            [frontend.handler.route :as route-handler]
            [frontend.handler.common :as common-handler]
            [clojure.string :as string]
            [cljs-time.local :as tl]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]))

(defn- set-latest-commit!
  [repo-url hash]
  (db/set-key-value repo-url :git/latest-commit hash))

(defn- set-remote-latest-commit!
  [repo-url hash]
  (db/set-key-value repo-url :git/remote-latest-commit hash))

(defn- set-git-status!
  [repo-url value]
  (db/set-key-value repo-url :git/status value)
  (state/set-git-status! repo-url value))

(defn- set-git-last-pulled-at!
  [repo-url]
  (db/set-key-value repo-url :git/last-pulled-at
                    (date/get-date-time-string (tl/local-now))))

(defn- set-git-error!
  [repo-url value]
  (db/set-key-value repo-url :git/error (if value (str value))))

(defn git-add
  ([repo-url file]
   (git-add repo-url file true))
  ([repo-url file update-status?]
   (p/let [_result (git/add repo-url file)]
     (when update-status?
       (common-handler/check-changed-files-status)))))

(defn get-latest-commit
  ([repo-url handler]
   (get-latest-commit repo-url handler 1))
  ([repo-url handler length]
   (-> (p/let [commits (git/log repo-url length)]
         (handler (if (= length 1)
                    (first commits)
                    commits)))
       (p/catch (fn [error]
                  (println "get latest commit failed: " error)
                  (js/console.log (.-stack error))
                  ;; TODO: safe check
                  (println "It might be an empty repo"))))))

(defn set-latest-commit-if-exists! [repo-url]
  (get-latest-commit
   repo-url
   (fn [commit]
     (when-let [hash (gobj/get commit "oid")]
       (set-latest-commit! repo-url hash)))))

(defn set-remote-latest-commit-if-exists! [repo-url]
  (get-latest-commit
   repo-url
   (fn [commit]
     (when-let [hash (gobj/get commit "oid")]
       (set-remote-latest-commit! repo-url hash)))))

(defn commit-and-force-push!
  [commit-message pushing?]
  (when-let [repo (frontend.state/get-current-repo)]
    (let [remote-oid (db/get-key-value repo
                                       :git/remote-latest-commit)]
      (p/let [commit-oid (git/commit repo commit-message (array remote-oid))
              result (git/write-ref! repo commit-oid)
              push-result (git/push repo
                                    (state/get-github-token repo)
                                    true)]
        (reset! pushing? false)
        (notification/clear! nil)
        (route-handler/redirect! {:to :home})))))

(defn git-set-username-email!
  [repo-url {:keys [name email]}]
  (when (and name email)
    (git/set-username-email
     (util/get-repo-dir repo-url)
     name
     email)))
