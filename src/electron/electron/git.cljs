(ns electron.git
  (:require ["child_process" :as child-process]
            ["simple-git" :as simple-git]
            [goog.object :as gobj]
            [electron.state :as state]
            [electron.utils :as utils]
            [promesa.core :as p]
            [clojure.string :as string]))

(def spawn-sync (gobj/get child-process "spawnSync"))

(defonce gits
  (atom {}))

(defn installed?
  []
  (let [command (spawn-sync "git"
                            #js ["--version"]
                            #js {:stdio "ignore"})]
    (if-let [error (gobj/get command "error")]
      (do
        (js/console.error error)
        false)
      true)))

(defn get-git
  []
  (when (installed?)
    (when-let [path (:graph/current @state/state)]
      (if-let [result (get @gits path)]
        result
        (let [result (simple-git path)]
          (swap! gits assoc path result)
          result)))))

(defn init!
  ([]
   (init! (get-git)))
  ([^js git]
   (when git
     (.init git false))))

(defn add-all!
  ([]
   (add-all! (get-git)))
  ([^js git]
   (when git
     (.add git "./*" (fn [error] (js/console.error error))))))

(defn add-all-and-commit!
  ([]
   (add-all-and-commit! "Auto saved by Logseq"))
  ([message]
   (when-let [git ^js (get-git)]
     (p/let [_ (init! git)
             _ (add-all! git)]
       (.commit git message)))))

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
  (when-let [git ^js (get-git)]
    (let [args (if (string? args)
                 (split-args args)
                 args)
          ok-handler (if ok-handler
                       ok-handler
                       (fn [result]
                         (utils/send-to-renderer "notification" {:type "success"
                                                                 :payload result})))
          error-handler (if error-handler
                          error-handler
                          (fn [error]
                            (js/console.dir error)
                            (utils/send-to-renderer "notification" {:type "error"
                                                                    :payload (.toString error)})))]
      (p/let [_ (when (= (first args) "commit")
                  (add-all!))]
        (->
         (p/let [result (.raw git (clj->js args))]
           (when ok-handler
             (ok-handler result)))
         (p/catch error-handler))))))

(defn auto-commit-current-graph!
  []
  (when (and (installed?)
             (not (state/git-auto-commit-disabled?)))
    (state/clear-git-commit-interval!)
    (p/let [_ (add-all-and-commit!)]
      (let [seconds (state/get-git-commit-seconds)]
        (when (int? seconds)
          (let [interval (js/setInterval add-all-and-commit! (* seconds 1000))]
            (state/set-git-commit-interval! interval)))))))
