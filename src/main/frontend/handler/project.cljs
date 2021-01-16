(ns frontend.handler.project
  (:require [frontend.state :as state]
            [frontend.jsutil :as util :refer-macros [profile]]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.handler.notification :as notification]
            [lambdaisland.glogi :as log]))

(defn get-current-project
  [current-repo projects]
  (let [project (some (fn [p]
                        (when (= (:repo p) current-repo)
                          p))
                  projects)
        project-name (:name project)]
    (when-not (string/blank? project-name) project-name)))

;; project exists and current user owns it
;; if project not exists, the server will create it
(defn project-exists?
  [project]
  (let [projects (set (map :name (:projects (state/get-me))))]
    (and (seq projects) (contains? projects project))))

(defn create-project!
  ([ok-handler]
   (create-project! (state/get-current-project) ok-handler))
  ([project ok-handler]
   (when (state/logged?)
     (let [config (state/get-config)
           data {:name project
                 :repo (state/get-current-repo)
                 :settings (or (get config :project)
                               {:name project})}]
       (util/post (str config/api "projects")
                  data
                  (fn [result]
                    (when-not (:message result) ; exists
                      (swap! state/state
                             update-in [:me :projects]
                             (fn [projects]
                               (util/distinct-by :name (conj projects (:result result)))))
                      ;; update config
                      (ok-handler project)))
                  (fn [error]
                    (js/console.dir error)
                    (notification/show! (util/format "Project \"%s\" already taken, please change to another name." project) :error)))))))

(defn exists-or-create!
  [ok-handler modal-content]
  (when (state/logged?)
    (if-let [project (state/get-current-project)]
      (if (project-exists? project)
        (ok-handler project)
        (create-project! ok-handler))
      (state/set-modal! modal-content))))

(defn add-project!
  [project ok-handler]
  (when (state/logged?)
    (create-project! project
                     (fn [project]
                       (when ok-handler (ok-handler project))
                       (notification/show! (util/format "Project \"%s\" was created successfully." project) :success)
                       (state/close-modal!)))))

(defn sync-project-settings!
  ([]
   (when-let [project-name (state/get-current-project)]
     (let [settings (:project (state/get-config))]
       (sync-project-settings! project-name settings))))
  ([project-name settings]
   (when (state/logged?)
     (when-let [repo (state/get-current-repo)]
       (if (project-exists? project-name)
         (util/post (str config/api "projects/" project-name)
                    {:name project-name
                     :settings settings
                     :repo repo}
                    (fn [response]
                      (notification/show! "Project settings changed successfully!" :success))
                    (fn [error]
                      (println "Project settings updated failed, reason: ")
                      (js/console.dir error)))
         (when (and settings
                    (not (string/blank? (:name settings)))
                    (>= (count (string/trim (:name settings))) 2))
           (add-project! (:name settings) nil)))))))

(defn update-project
  [project-name data]
  (let [url (util/format "%sprojects/%s" config/api project-name)]
    (js/Promise.
      (fn [resolve reject]
        (util/post url data
          (fn [result]
            (resolve result))
          (fn [error]
            (log/error :project/http-update-failed error)
            (reject error)))))))

(defn delete-project
  [project-name]
  (let [url (util/format "%sprojects/%s" config/api project-name)]
    (js/Promise.
      (fn [resolve reject]
        (util/delete url
          (fn [result]
            (resolve result))
          (fn [error]
            (log/error :project/http-delete-failed error)
            (reject error)))))))
