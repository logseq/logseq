(ns frontend.helper
  (:require [cljs-time.format :as tf]
            [cljs-time.core :as t]
            [frontend.util :as util]
            [frontend.state :as state]
            [frontend.config :as config]
            [promesa.core :as p]))

(defn request-app-tokens!
  [ok-handler error-handler]
  (let [repos (:repos (state/get-me))
        installation-ids (->> (map :installation_id repos)
                              (remove nil?)
                              (distinct))]
    (when (or (seq repos)
            (seq installation-ids))
      (util/post (str config/api "refresh_github_token")
        {:installation-ids installation-ids
         :repos repos}
        (fn [result]
          (state/set-github-installation-tokens! result)
          (when ok-handler (ok-handler)))
        (fn [error]
          (println "Something wrong!")
          (js/console.dir error)
          (when error-handler (error-handler)))))))

(defn get-github-token*
  [repo]
  (when repo
    (let [{:keys [token expires_at] :as token-state}
          (state/get-github-token repo)
          expires-at (tf/parse (tf/formatters :date-time-no-ms) expires_at)
          request-time-gap (t/minutes 1)
          expired? (t/after? (t/now) (t/plus expires-at request-time-gap))]
      {:expired? expired?
       :token token})))

(defn get-github-token
  ([]
   (get-github-token  (state/get-current-repo)))
  ([repo]
   (js/Promise.
     (fn [resolve reject]
       (let [{:keys [expired? token]} (get-github-token* repo)]
        (if-not expired?
          (resolve token)
          (request-app-tokens!
            (fn []
              (let [{:keys [expired? token]} (get-github-token* repo)]
                (if-not expired?
                  (resolve token)
                  (do (js/console.error "Failed to get GitHub token.")
                      (reject)))))
            nil)))))))


