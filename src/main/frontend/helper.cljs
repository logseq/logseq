(ns frontend.helper
  (:require [cljs-time.format :as tf]
            [cljs-time.core :as t]
            [lambdaisland.glogi :as log]
            [frontend.util :as util]
            [frontend.state :as state]
            [frontend.config :as config]
            [frontend.spec :as spec]))

(defn request-app-tokens!
  [ok-handler error-handler]
  (let [repos (state/get-repos)
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
          (log/error :token/http-request-failed error)
          (js/console.dir error)
          (when error-handler (error-handler)))))))

(defn- get-github-token*
  [repo]
  (spec/validate :repos/url repo)
  (when repo
    (let [{:keys [token expires_at] :as token-state}
          (state/get-github-token repo)]
      (spec/validate :repos/repo token-state)
      (if (and (map? token-state)
               (string? expires_at))
        (let [expires-at (tf/parse (tf/formatters :date-time-no-ms) expires_at)
              now (t/now)
              expired? (t/after? now expires-at)]
          {:exist? true
           :expired? expired?
           :token token})
        {:exist? false}))))

(defn get-github-token
  ([]
   (get-github-token  (state/get-current-repo)))
  ([repo]
   (js/Promise.
     (fn [resolve reject]
       (let [{:keys [expired? token exist?]} (get-github-token* repo)
             valid-token? (and exist? (not expired?))]
        (if valid-token?
          (resolve token)
          (request-app-tokens!
            (fn []
              (let [{:keys [expired? token exist?] :as token-m} (get-github-token* repo)
                    valid-token? (and exist? (not expired?))]
                (if valid-token?
                  (resolve token)
                  (do (log/error :token/failed-get-token token-m)
                      (reject)))))
            nil)))))))


