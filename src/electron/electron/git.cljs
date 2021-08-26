(ns electron.git
  (:require ["dugite" :refer [GitProcess]]
            [goog.object :as gobj]
            [electron.state :as state]
            [electron.utils :as utils]
            [promesa.core :as p]
            [clojure.string :as string]
            ["fs-extra" :as fs]
            ["path" :as path]
            ["os" :as os]))

(defn get-graph-path
  []
  (:graph/current @state/state))

(defn get-graph-git-dir
  []
  (when-let [graph-path (some-> (get-graph-path)
                                (string/replace "/" "_"))]
    (let [dir (.join path (.homedir os) ".logseq" "git" graph-path ".git")]
      (. fs ensureDirSync dir)
      dir)))

(defn run-git!
  [commands]
  (when-let [path (get-graph-path)]
    (when (fs/existsSync path)
      (p/let [result (.exec GitProcess commands path)]
        (if (zero? (gobj/get result "exitCode"))
          (let [result (gobj/get result "stdout")]
            (p/resolved result))
          (let [error (gobj/get result "stderr")]
            (js/console.error error)
            (p/rejected error)))))))

(defn git-dir-exists?
  []
  (try
    (let [p (.join path (get-graph-path) ".git")]
      (.isDirectory (fs/statSync p)))
    (catch js/Error e
      nil)))

(defn init!
  []
  (let [separate-git-dir (get-graph-git-dir)
        args (cond
               (git-dir-exists?)
               ["init"]
               separate-git-dir
               ["init" (str "--separate-git-dir=" separate-git-dir)]
               :else
               ["init"])]
    (run-git! (clj->js args))))

(defn add-all!
  []
  (run-git! #js ["add" "./*"]))

(defn commit!
  [message]
  (run-git! #js ["commit" "-m" message]))

(defn add-all-and-commit!
  ([]
   (add-all-and-commit! "Auto saved by Logseq"))
  ([message]
   (->
    (p/let [_ (init!)
            _ (add-all!)]
      (commit! message))
    (p/catch (fn [error]
               (when-not (string/blank? error)
                 (utils/send-to-renderer "notification" {:type "error"
                                                         :payload error})))))))

(defonce quotes-regex #"\"[^\"]+\"")
(defn wrapped-by-quotes?
  [v]
  (and (string? v) (>= (count v) 2) (= "\"" (first v) (last v))))

(defn unquote-string
  [v]
  (string/trim (subs v 1 (dec (count v)))))

(defn- split-args
  [s]
  (let [quotes (re-seq quotes-regex s)
        non-quotes (string/split s quotes-regex)
        col (if (seq quotes)
              (concat (interleave non-quotes quotes)
                      (drop (count quotes) non-quotes))
              non-quotes)]
    (->> col
         (map (fn [s]
                (if (wrapped-by-quotes? s)
                  [(unquote-string s)]
                  (string/split s #"\s"))))
         (flatten)
         (remove string/blank?))))

(defn raw!
  [args & {:keys [ok-handler error-handler]}]
  (let [args (if (string? args)
               (split-args args)
               args)
        ok-handler (if ok-handler
                     ok-handler
                     (fn [result]
                       (let [result (if (string/blank? result)
                                      (str (first args) " successfully!")
                                      result)]
                         (utils/send-to-renderer "notification" {:type "success"
                                                                 :payload result}))))
        error-handler (if error-handler
                        error-handler
                        (fn [error]
                          ;; TODO: why this happen?
                          (when-not (string/blank? error)
                            (let [error (str (first args) " error: " error)]
                              (utils/send-to-renderer "notification" {:type "error"
                                                                      :payload error})))))]
    (p/let [_ (when (= (first args) "commit")
                (add-all!))]
      (->
       (p/let [result (run-git! (clj->js args))]
         (when ok-handler
           (ok-handler result)))
       (p/catch error-handler)))))

(defn auto-commit-current-graph!
  []
  (when (not (state/git-auto-commit-disabled?))
    (state/clear-git-commit-interval!)
    (p/let [_ (add-all-and-commit!)]
      (let [seconds (state/get-git-commit-seconds)]
        (when (int? seconds)
          (let [interval (js/setInterval add-all-and-commit! (* seconds 1000))]
            (state/set-git-commit-interval! interval)))))))
