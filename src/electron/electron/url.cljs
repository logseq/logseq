(ns electron.url
  (:require [electron.handler :as handler]
            [electron.utils :refer [send-to-renderer get-URL-decoded-params]]
            [clojure.string :as string]
            [promesa.core :as p]))

(defn local-url-handler
  [^js win parsed-url url-path]
  (cond
    (= "open" url-path)
    (let [[graph _page _block-id] (get-URL-decoded-params parsed-url ["graph" "page" "block-id"])
          graph-name (handler/get-graph-name graph)]
      (if graph-name
        (p/let [_ (handler/broadcast-persist-graph! graph-name)]
          (send-to-renderer win "openNewWindowOfGraph" graph-name))
        (if graph
          (send-to-renderer "notification" {:type "error"
                                            :payload (str "Open link failed. Cannot match graph name `" graph
                                                          "` to any linked graph for action `open`.")})
          (send-to-renderer "notification" {:type "error"
                                            :payload (str "Open link failed. Missing required parameter `graph=<graph name>` for action `open`. Typo?")}))))
    :else
    (send-to-renderer "notification" {:type "error"
                                      :payload (str "Open link failed. Cannot match `" url-path
                                                    "` to any action.")})))

(defn logseq-url-handler
  [^js win parsed-url]
  (let [url-host (.-host parsed-url)
        url-path (string/replace (.-pathname parsed-url) "/" "")]
    (cond
      (= "auth-callback" url-host)
      (send-to-renderer win "loginCallback" (.get (.-searchParams parsed-url) "code"))

      (= "local" url-host)
      (local-url-handler win parsed-url url-path)

      :else
      (send-to-renderer "notification" {:type "error"
                                        :payload (str "Open link failed. Cannot match `" url-host
                                                      "` to any target.")}))))