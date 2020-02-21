(defproject backend "0.1.0-SNAPSHOT"
  :description "FIXME: write description"
  :url "http://example.com/FIXME"
  :license {:name "EPL-2.0 OR GPL-2.0-or-later WITH Classpath-exception-2.0"
            :url "https://www.eclipse.org/legal/epl-2.0/"}
  :dependencies [[org.clojure/clojure "1.10.0"]
                 [clj-social "0.1.6"]
                 [org.postgresql/postgresql "42.2.8"]
                 [org.clojure/java.jdbc "0.7.10"]
                 [honeysql "0.9.8"]
                 [hikari-cp "2.9.0"]
                 [toucan "1.15.0"]
                 [ragtime "0.8.0"]
                 [com.taoensso/timbre "4.10.0"]
                 [org.clojure/tools.namespace "0.3.1"]
                 [buddy/buddy-sign "3.1.0"]
                 [buddy/buddy-hashers "1.4.0"]
                 [enlive "1.1.6"]
                 [io.pedestal/pedestal.service "0.5.5"]
                 [io.pedestal/pedestal.jetty "0.5.5"]
                 [metosin/reitit-pedestal "0.4.2"]
                 [metosin/reitit "0.4.2"]
                 [metosin/jsonista "0.2.5"]
                 [aero "1.1.6"]
                 [com.stuartsierra/component "0.4.0"]
                 [com.taoensso/nippy "2.14.0"]
                 ]
  ;; :main backend.core
  :profiles {:repl {:dependencies [[io.pedestal/pedestal.service-tools "0.5.7"]]
                    :source-paths ["src/backend" "dev"]}
             :uberjar {:main backend.core
                       :aot :all}}
  :repl-options {:init-ns user}
  :jvm-opts ["-Duser.timezone=UTC" "-Dclojure.spec.check-asserts=true"]
  :aliases {"migrate"  ["run" "-m" "user/migrate"]
            "rollback" ["run" "-m" "user/rollback"]})
