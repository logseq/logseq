(ns frontend.ai.text-encoder
  "Plugin service for text encoder (AI)"
  (:require [promesa.core :as p]
            [frontend.state :as state]
            [frontend.handler.plugin :as plugin-handler]
            [cljs-bean.core :as bean]))

(defn- call-text-encoder-service!
  "Handling communication with text encoder plugin
  When reply? is true, it will listen to the `service:<event>:<name>:reply `event
  and return a promise of the result"
  ([service event payload] (call-text-encoder-service! service event payload false))
  ([service event payload reply?]
   (when-let [^js pl (plugin-handler/get-plugin-inst (:pid service))]
     (let [{:keys [name]} service
           hookEvent (str "service:" event ":" name)]
       (.call (.-caller pl) hookEvent (bean/->js (merge {:graph (state/get-current-repo)} payload)))
       (when reply?
         (-> (p/create (fn [resolve _rej]
                     (.once (.-caller pl) (str hookEvent ":reply")
                            (fn [^js e]
                              (resolve (bean/->clj e))))))
             (p/timeout 20000)
             (p/catch #(prn "Timeout waiting reply from text encoder service" hookEvent %))))))))

(defn- text-encode'
  [text service]
  (call-text-encoder-service! service "textEncoder:textEncode" {:text text} true))

(defn text-encode
  "Return a promise of the encoded text"
  ([text]
   (text-encode' text (when state/lsp-enabled?
                        (->> (state/get-all-plugin-services-with-type :text-encoder)
                             (first)))))
  ([text encoder-name]
   (text-encode' text (when state/lsp-enabled?
                        (->> (state/get-all-plugin-services-with-type :text-encoder)
                             (filter #(= (:name %) encoder-name))
                             (first))))))
