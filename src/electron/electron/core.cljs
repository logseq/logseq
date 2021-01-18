(ns electron.core
  (:require ["electron" :refer [app BrowserWindow crashReporter protocol session]]
            ["fs" :as fs]
            ["path" :as p]
            ["url" :as u]))

(def main-window (atom nil))

(defn init-browser []

  (let [options {:width 800
                 :height 600}]
    (reset! main-window (BrowserWindow. (clj->js options))))

  (let [f (fn [request callback]
            (let [url (u/URL. (.-url request))]
              (if (empty? (.-port url))
                (let [path (.-pathname url)
                      path (cond
                             (= "/" path)
                             (str path "/static/index.html")

                             (= "/" (last path))
                             (str path "/index.html")

                             :else path)
                      path (.normalize p (str js/__dirname "/../" path))
                      resp (.createReadStream fs path)]
                  (callback resp))
                (.uninterceptProtocol protocol "http"))))]
    (.interceptFileProtocol protocol "http" f))

  ^html (.loadURL @main-window (str "http://localhost/"))
  ^js (.on @main-window "closed" #(reset! main-window nil)))

(defn main []
  ; CrashReporter can just be omitted
  (.start crashReporter
          (clj->js
           {:companyName "Logseq"
            :productName "logseq"
            :submitURL "https://example.com/submit-url"
            :autoSubmit false}))

  (.on app "window-all-closed" #(when-not (= js/process.platform "darwin")
                                  (.quit app)))
  (.on app "ready" init-browser))
