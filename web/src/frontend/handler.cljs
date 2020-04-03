(ns frontend.handler
  (:refer-clojure :exclude [clone load-file])
  (:require [frontend.git :as git]
            [frontend.fs :as fs]
            [frontend.state :as state]
            [frontend.db :as db]
            [frontend.storage :as storage]
            [frontend.util :as util]
            [frontend.config :as config]
            [clojure.walk :as walk]
            [clojure.string :as string]
            [promesa.core :as p]
            [cljs-bean.core :as bean]
            [reitit.frontend.easy :as rfe]
            [goog.crypt.base64 :as b64]
            [goog.object :as gobj]
            [rum.core :as rum]
            [datascript.core :as d])
  (:import [goog.events EventHandler]))

;; We only support Github token now
(defn load-file
  [repo-url path state-handler]
  (util/p-handle (fs/read-file (git/get-repo-dir repo-url) path)
                 (fn [content]
                   (state-handler content))))

(defn- hidden?
  [path patterns]
  (some (fn [pattern]
          (or
           (= path pattern)
           (and (string/starts-with? pattern "/")
                (= (str "/" (first (string/split path #"/")))
                   pattern)))) patterns))

(defn load-files
  [repo-url]
  (util/p-handle (git/list-files repo-url)
                 (fn [files]
                   (when (> (count files) 0)
                     (let [files (js->clj files)]
                       (if (contains? (set files) config/hidden-file)
                         (load-file repo-url config/hidden-file
                                    (fn [patterns-content]
                                      (when patterns-content
                                        (let [patterns (string/split patterns-content #"\n")
                                              files (remove (fn [path] (hidden? path patterns)) files)]
                                          (db/transact-files! repo-url files)))))
                         (p/promise (db/transact-files! repo-url files))))))))


;; TODO: remove this
(declare load-repo-to-db!)

(defn get-latest-commit
  [handler]
  (-> (git/log (db/get-current-repo)
               (db/get-github-token)
               1)
      (.then (fn [commits]
               (handler (first commits))))
      (.catch (fn [error]
                (prn "get latest commit failed: " error)))))

(defonce latest-commit (atom nil))

;; TODO: Maybe replace with fetch?
;; TODO: callback hell
(defn pull
  [repo-url token]
  (prn "pushing? " (:pushing? @state/state))
  (when-not (:pushing? @state/state)
    (util/p-handle
     (git/pull repo-url token)
     (fn [result]
       (get-latest-commit
        (fn [commit]
          (when (or (nil? @latest-commit)
                    (and @latest-commit
                         commit
                         (not= (gobj/get commit "oid")
                               (gobj/get @latest-commit "oid"))))
            (prn "New commit oid: " (gobj/get commit "oid"))
            (-> (load-files repo-url)
                (p/then
                 (fn []
                   (load-repo-to-db! repo-url)))))
          (reset! latest-commit commit)))))))

(defn periodically-pull
  [repo-url]
  (when-let [token (db/get-github-token)]
    (pull repo-url token)
    (js/setInterval #(pull repo-url token)
                    (* 10 1000))))

;; TODO: update latest commit
(defn push
  [repo-url file message]
  (swap! state/state assoc :pushing? true)
  (let [token (db/get-github-token)]
    (git/add-commit-push
     repo-url
     file
     message
     token
     (fn []
       (prn "Push successfully!")
       (swap! state/state assoc :pushing? false))
     (fn []
       (prn "Failed to push.")
       (swap! state/state assoc :pushing? false)))))

(defn clone
  [repo]
  (let [token (db/get-github-token)]
    (util/p-handle
     (do
       (db/set-repo-cloning repo true)
       (git/clone repo token))
     (fn []
       (db/set-repo-cloning repo false)
       (db/mark-repo-as-cloned repo)
       (db/set-current-repo! repo)
       ;; load contents
       (load-files repo))
     (fn [e]
       (db/set-repo-cloning repo false)
       (prn "Clone failed, reason: " e)))))

(defn new-notification
  [text]
  (js/Notification. "Gitnotes" #js {:body text
                                    ;; :icon logo
                                    }))

(defn request-notifications
  []
  (util/p-handle (.requestPermission js/Notification)
                 (fn [result]
                   (storage/set :notification-permission-asked? true)

                   (when (= "granted" result)
                     (storage/set :notification-permission? true)))))

(defn request-notifications-if-not-asked
  []
  (when-not (storage/get :notification-permission-asked?)
    (request-notifications)))

;; notify deadline or scheduled tasks
(defn run-notify-worker!
  []
  (when (storage/get :notification-permission?)
    (let [notify-fn (fn []
                      (let [tasks (:tasks @state/state)
                            tasks (flatten (vals tasks))]
                        (doseq [{:keys [marker title] :as task} tasks]
                          (when-not (contains? #{"DONE" "CANCElED" "CANCELLED"} marker)
                            (doseq [[type {:keys [date time] :as timestamp}] (:timestamps task)]
                              (let [{:keys [year month day]} date
                                    {:keys [hour min]
                                     :or {hour 9
                                          min 0}} time
                                    now (util/get-local-date)]
                                (when (and (contains? #{"Scheduled" "Deadline"} type)
                                           (= (assoc date :hour hour :minute min) now))
                                  (let [notification-text (str type ": " (second (first title)))]
                                    (new-notification notification-text)))))))))]
      (notify-fn)
      (js/setInterval notify-fn (* 1000 60)))))

(defn show-notification!
  [text]
  (swap! state/state assoc
         :notification/show? true
         :notification/text text)
  (js/setTimeout #(swap! state/state assoc
                         :notification/show? false
                         :notification/text nil)
                 3000))

(defn alter-file
  [path commit-message content]
  (let [token (db/get-github-token)
        repo-url (db/get-current-repo)]
    (util/p-handle
     (fs/write-file (git/get-repo-dir repo-url) path content)
     (fn [_]
       (rfe/push-state :file {:path (b64/encodeString path)})
       (db/reset-file! repo-url path content)

       (git/add-commit-push repo-url
                            path
                            commit-message
                            token
                            (fn []
                              ;; (show-notification! "File updated!")
                              )
                            (fn [error]
                              (prn "Failed to update file, error: " error)))))))

(defn clear-storage
  [repo-url]
  (js/window.pfs._idb.wipe)
  (clone repo-url))

(defn check
  [heading]
  (let [{:heading/keys [repo file marker meta uuid]} heading
        pos (:pos meta)
        repo (db/entity (:db/id repo))
        file (db/entity (:db/id file))
        repo-url (:repo/url repo)
        file (:file/path file)
        token (db/get-github-token)]
    (when-let [content (db/get-file-content repo-url file)]
      (let [content' (str (subs content 0 pos)
                          (-> (subs content pos)
                              (string/replace-first marker "DONE")))]
        (util/p-handle
         (fs/write-file (git/get-repo-dir repo-url) file content')
         (fn [_]
           (prn "check successfully, " file)
           (db/reset-file! repo-url file content')
           (push repo-url file (util/format "`%s` marked as DONE." marker))))))))

(defn uncheck
  [heading]
  (let [{:heading/keys [repo file marker meta]} heading
        pos (:pos meta)
        repo (db/entity (:db/id repo))
        file (db/entity (:db/id file))
        repo-url (:repo/url repo)
        file (:file/path file)
        token (db/get-github-token)]
    (when-let [content (db/get-file-content repo-url file)]
      (let [content' (str (subs content 0 pos)
                          (-> (subs content pos)
                              (string/replace-first "DONE" "TODO")))]
        (util/p-handle
         (fs/write-file (git/get-repo-dir repo-url) file content')
         (fn [_]
           (prn "uncheck successfully, " file)
           (db/reset-file! repo-url file content')
           (push repo-url file "DONE rollbacks to TODO.")))))))

(defn load-all-contents!
  [repo-url ok-handler]
  (let [files (db/get-repo-files repo-url)]
    (-> (p/all (for [file files]
                 (load-file repo-url file
                            (fn [content]
                              (db/set-file-content! repo-url file content)))))
        (p/then
         (fn [_]
           (ok-handler))))))

(defonce headings-atom (atom nil))

(defn load-repo-to-db!
  [repo-url]
  (load-all-contents! repo-url
                      (fn []
                        (let [headings (db/extract-all-headings repo-url)]
                          (reset! headings-atom headings)
                          (db/reset-headings! repo-url headings)))))


;; (defn sync
;;   []
;;   (let [[_user token repos] (get-user-token-repos)]
;;     (doseq [repo repos]
;;       (pull repo token))))

(defn get-github-access-token
  ([]
   (util/fetch (str config/api "token/github")
               (fn [resp]
                 (if (:success resp)
                   (db/transact-github-token! (get-in resp [:body :access_token]))
                   (prn "Get token failed, error: " resp)))
               (fn [error]
                 (prn "Get token failed, error: " error))))
  ([code]
   (util/fetch (str config/api "oauth/github?code=" code)
               (fn [resp]
                 (if (:success resp)
                   (do
                     (db/transact-github-token! (get-in resp [:body :access_token]))
                     ;; redirect to home
                     (rfe/push-state :home))
                   (prn "Get token failed, error: " resp)))
               (fn [error]
                 (prn "Get token failed, error: " error)))))

(defn clone-and-pull
  [repo]
  (p/then (clone repo)
          (fn []
            (periodically-pull repo))))

(defn set-route-match!
  [route]
  (swap! state/state assoc :route-match route))

(defn set-ref-component!
  [k ref]
  (swap! state/state assoc :ref-components k ref))

(defn set-root-component!
  [comp]
  (swap! state/state assoc :root-component comp))

(defn re-render!
  []
  (when-let [comp (get @state/state :root-component)]
    (rum/request-render comp)))

(defn db-listen-to-tx!
  []
  (d/listen! db/conn :persistence
             (fn [tx-report] ;; FIXME do not notify with nil as db-report
               ;; FIXME do not notify if tx-data is empty
               (when-let [db (:db-after tx-report)]
                 (prn "DB changed, re-rendered!")
                 (re-render!)
                 (js/setTimeout (fn []
                                  (db/persist db)) 0)))))

(defn start!
  []
  (db/restore!)
  (db-listen-to-tx!)
  (when-let [first-repo (first (db/get-repos))]
    (db/set-current-repo! first-repo))
  (let [repos (db/get-repos)]
    (doseq [repo repos]
      (periodically-pull repo))))
