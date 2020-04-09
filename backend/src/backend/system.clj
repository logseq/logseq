(ns backend.system
  (:require [io.pedestal.http :as server]
            [reitit.ring :as ring]
            [reitit.http :as http]
            [reitit.coercion.spec]
            [reitit.swagger :as swagger]
            [reitit.swagger-ui :as swagger-ui]
            [reitit.http.coercion :as coercion]
            [reitit.dev.pretty :as pretty]
            [reitit.http.interceptors.parameters :as parameters]
            [reitit.http.interceptors.muuntaja :as muuntaja]
            [reitit.http.interceptors.exception :as exception]
            [reitit.http.interceptors.multipart :as multipart]
            [reitit.http.interceptors.dev :as dev]
            [reitit.http.spec :as spec]
            [spec-tools.spell :as spell]
            [io.pedestal.http :as server]
            [reitit.pedestal :as pedestal]
            [clojure.core.async :as a]
            [muuntaja.core :as m]
            [com.stuartsierra.component :as component]
            [backend.components.http :as component-http]
            [backend.components.hikari :as hikari]
            [backend.routes :as routes]
            [backend.config :as config]
            [io.pedestal.http.ring-middlewares :as ring-middlewares]))

(def router
  (pedestal/routing-interceptor
   (http/router
    routes/routes

    {;:reitit.interceptor/transform dev/print-context-diffs ;; pretty context diffs
     ;;:validate spec/validate ;; enable spec validation for route data
     ;;:reitit.spec/wrap spell/closed ;; strict top-level validation
     ;; :exception pretty/exception
     :data {:coercion reitit.coercion.spec/coercion
            :muuntaja m/instance
            :interceptors [;; swagger feature
                           swagger/swagger-feature
                           ;; query-params & form-params
                           (parameters/parameters-interceptor)
                           ;; content-negotiation
                           (muuntaja/format-negotiate-interceptor)
                           ;; encoding response body
                           (muuntaja/format-response-interceptor)
                           ;; exception handling
                           ;; (exception/exception-interceptor)
                           ;; decoding request body
                           (muuntaja/format-request-interceptor)
                           ;; coercing response bodys
                           (coercion/coerce-response-interceptor)
                           ;; coercing request parameters
                           (coercion/coerce-request-interceptor)
                           ;; multipart
                           (multipart/multipart-interceptor)]}})

   ;; optional default ring handler (if no routes have matched)
   (ring/routes
    (swagger-ui/create-swagger-ui-handler
     {:path "/swagger"
      :config {:validatorUrl nil
               :operationsSorter "alpha"}})
    (ring/create-resource-handler)
    (ring/create-default-handler))))

(defn merge-interceptors-map
  [system-map interceptors]
  (update system-map :io.pedestal.http/interceptors
          (fn [old]
            (vec (concat interceptors old)))))

(defn new-system
  [{:keys [env port hikari-spec] :as config}]
  (let [service-map (-> {:env env
                         ::server/type :jetty
                         ::server/port port
                         ::server/join? false
                         ;; no pedestal routes
                         ::server/routes []
                         ;; allow serving the swagger-ui styles & scripts from self
                         ;; ::server/secure-headers {:content-security-policy-settings
                         ;;                          {:default-src "'self'"
                         ;;                           :style-src "'self' 'unsafe-inline'"
                         ;;                           :script-src "'self' 'unsafe-inline'"}}
                         ::server/secure-headers {:content-security-policy-settings {:object-src "'none'"}}
                         ::server/resource-path "/public"}
                        (server/default-interceptors)
                        ;; use the reitit router
                        (pedestal/replace-last-interceptor router))
        service-map (merge-interceptors-map
                     service-map
                     [ring-middlewares/cookies
                      server/html-body])
        service-map (if config/dev? (server/dev-interceptors service-map) service-map)]
    (component/system-map :service-map service-map
                          :hikari (hikari/new-hikari-cp hikari-spec)
                          :http
                          (component/using
                           (component-http/new-server)
                           [:service-map]))))
