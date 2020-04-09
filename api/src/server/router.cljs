(ns server.router
  (:require ["express" :as express]
            [goog.object :as gobj]
            ["request" :as request]))

(def router (express/Router.))

(def config
  {:client_id js/process.env.GITHUB_APP_KEY
   :client_secret js/process.env.GITHUB_APP_SECRET
   :redirect_uri js/process.env.GITHUB_REDIRECT_URI})

;; utils
(def dev? ^boolean goog.DEBUG)

(def cookie-domain (if dev? "" ".logseq.now.sh"))

(def cookie-options
  {:maxAge (* 1000 60 60 24 30)         ; 30 days
   :httpOnly true
   :signed true
   :secure (not dev?)
   :path "/"
   :domain cookie-domain})

(.get router "/login/github"
      (fn [req res]
        (let [oauth-url
              (str "https://github.com/login/oauth/authorize?response_type=code&client_id="
                   (:client_id config)
                   "&redirect_uri="
                   (:redirect_uri config)
                   "&scope=user%3Aemail%2Crepo")]
          (.redirect res 301 oauth-url))))

(.get router "/oauth/github"
      (fn [req res]
        (let [code (gobj/getValueByKeys req "query" "code")
              req-url "https://github.com/login/oauth/access_token"
              options {:headers {:Content-Type "application/json"
                                 :Accept "application/json"}
                       :body (js/JSON.stringify
                              (clj->js (assoc config :code code)))}]
          (request req-url (clj->js options)
                   (fn [error response]
                     (if error
                       (.send res #js {:success false
                                       :error error})
                       (let [body (js/JSON.parse (gobj/get response "body"))]
                         (if-let [error (gobj/get body "error")]
                           (.send res #js {:success false
                                           :error error})
                           (let [access-token (gobj/get body "access_token")]
                             (.cookie res "id" access-token #js {:signed true})
                             (.send res #js {:success true
                                             :body body}))))))))))

(.get router "/token/github"
      (fn [req res]
        (js/console.dir req)
        ;; get access token from the cookie
        ;; req.cookies.cookie1
        (if-let [access-token (gobj/getValueByKeys req "signedCookies" "id")]
          (.send res #js {:success true
                          :body #js {:access_token access-token}})
          (.send res #js {:success false
                          :error "No cookies"}))))
