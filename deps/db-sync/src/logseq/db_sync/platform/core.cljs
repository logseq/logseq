(ns logseq.db-sync.platform.core)

(defn response
  [body init]
  (js/Response. body init))

(defn request
  [url init]
  (js/Request. url init))

(defn request-url
  [request]
  (js/URL. (.-url request)))
