(ns frontend.handler.git
  (:require [frontend.util :as util :refer-macros [profile]]
            [promesa.core :as p]
            [lambdaisland.glogi :as log]
            [frontend.state :as state]
            [frontend.db :as db]
            [frontend.git :as git]
            [frontend.date :as date]
            [frontend.handler.notification :as notification]
            [frontend.handler.route :as route-handler]
            [frontend.handler.common :as common-handler]
            [frontend.config :as config]
            [cljs-time.local :as tl]
            [clojure.string :as string]
            [goog.object :as gobj]))

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
   (when (and (not (config/local-db? repo-url))
              (not (util/electron?)))
     (-> (p/let [result (git/add repo-url file)]
           (when update-status?
             (common-handler/check-changed-files-status)))
         (p/catch (fn [error]
                    (println "git add '" file "' failed: " error)
                    (js/console.error error)))))))

(defn commit-and-force-push!
  [commit-message pushing?]
  (when-let [repo (frontend.state/get-current-repo)]
    (->
     (p/let [remote-oid (common-handler/get-remote-ref repo)
             commit-oid (git/commit repo commit-message (array remote-oid))
             result (git/write-ref! repo commit-oid)
             token (common-handler/get-github-token repo)
             push-result (git/push repo token true)]
       (reset! pushing? false)
       (notification/clear! nil)
       (route-handler/redirect! {:to :home}))
     (p/catch (fn [error]
                (log/error :git/commit-and-force-push! error))))))

(defn git-set-username-email!
  [repo-url {:keys [name email]}]
  (when (and name email)
    (git/set-username-email
     (config/get-repo-dir repo-url)
     name
     email)))

(defn show-commit-modal!
  [modal]
  (fn [e]
    (when (and
          (string/starts-with? (state/get-current-repo) "https://")
          (not (util/input? (gobj/get e "target")))
          (not (gobj/get e "shiftKey"))
          (not (gobj/get e "ctrlKey"))
          (not (gobj/get e "altKey"))
          (not (gobj/get e "metaKey")))
     (when-let [repo-url (state/get-current-repo)]
       (when-not (state/get-edit-input-id)
         (util/stop e)
         (state/set-modal! modal))))))
