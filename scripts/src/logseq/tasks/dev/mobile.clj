(ns logseq.tasks.dev.mobile
  "Tasks for mobile development"
  (:require [babashka.fs :as fs]
            [babashka.tasks :refer [shell]]
            [clojure.string :as string]
            [logseq.tasks.util :as task-util])
  (:import [java.nio.file FileAlreadyExistsException]))

(def ^:private dev-server-port "3002")
(def ^:private ssl-dir "ssl/mobile-dev")
(def ^:private ssl-lock-file "ssl/mobile-dev/.cert.lock")
(def ^:private ssl-ca-keystore "ssl/mobile-dev/ca-keystore.jks")
(def ^:private ssl-ca-cert "ssl/mobile-dev/logseq-dev-ca.cer")
(def ^:private ssl-keystore "ssl/mobile-dev/keystore.jks")
(def ^:private ssl-server-cert "ssl/mobile-dev/logseq-dev-server.cer")
(def ^:private ssl-server-csr "ssl/mobile-dev/logseq-dev-server.csr")
(def ^:private ssl-password "shadow-cljs")

(defn- local-ip
  []
  (letfn [(interface-ip [interface]
            (let [{:keys [exit out]} (shell {:out :string
                                             :err :string
                                             :continue true
                                             :shutdown nil}
                                            (str "ipconfig getifaddr " interface))
                  ip (string/trim (or out ""))]
              (when (and (zero? exit) (not (string/blank? ip)))
                ip)))]
    (or (interface-ip "en0")
        (interface-ip "en1")
        (throw (ex-info "Failed to detect local network IP" {})))))

(defn- dev-server-url
  []
  (format "https://%s:%s/mobile" (local-ip) dev-server-port))

(defn- with-ssl-cert-lock!
  [f]
  (fs/create-dirs ssl-dir)
  (loop [attempt 0]
    (let [locked? (try
                    (fs/create-file ssl-lock-file)
                    true
                    (catch FileAlreadyExistsException _
                      false))]
      (when-not locked?
        (when (> attempt 600)
          (throw (ex-info "Timed out waiting for mobile HTTPS certificate lock"
                          {:lock-file ssl-lock-file})))
        (Thread/sleep 100)
        (recur (inc attempt)))))
  (try
    (f)
    (finally
      (fs/delete-if-exists ssl-lock-file))))

(defn- usable-keystore?
  []
  (and (fs/exists? ssl-keystore)
       (fs/exists? ssl-ca-keystore)
       (fs/exists? ssl-ca-cert)
       (zero? (:exit (shell {:continue true :out :string :err :string :shutdown nil}
                            (str "keytool -list"
                                 " -keystore " ssl-keystore
                                 " -storepass " ssl-password
                                 " -alias logseq-dev"))))
       (zero? (:exit (shell {:continue true :out :string :err :string :shutdown nil}
                            (str "keytool -list"
                                 " -keystore " ssl-ca-keystore
                                 " -storepass " ssl-password
                                 " -alias logseq-dev-ca"))))))

(defn- backup-existing-ssl-files!
  []
  (when (and (fs/exists? ssl-keystore)
             (not (usable-keystore?)))
    (let [backup (str ssl-keystore ".bak." (System/currentTimeMillis))]
      (println "Backing up incompatible HTTPS keystore to" backup)
      (fs/move ssl-keystore backup {:replace-existing true})))
  (when-not (usable-keystore?)
    (doseq [path [ssl-ca-keystore ssl-ca-cert ssl-server-cert ssl-server-csr]]
      (fs/delete-if-exists path))))

(defn- generate-dev-ssl-cert!
  [ip]
  (let [san (str "SAN=ip:" ip ",dns:localhost,ip:127.0.0.1")]
    (shell {:shutdown nil}
           (str "keytool -genkeypair"
                " -alias logseq-dev-ca"
                " -keyalg RSA"
                " -keysize 2048"
                " -validity 3650"
                " -keystore " ssl-ca-keystore
                " -storepass " ssl-password
                " -keypass " ssl-password
                " -dname \"CN=Logseq Mobile Dev CA, OU=Logseq Development, O=Logseq, L=Local, ST=Local, C=US\""
                " -ext bc=ca:true"
                " -ext ku=keyCertSign,cRLSign"))
    (shell {:shutdown nil}
           (str "keytool -exportcert"
                " -rfc"
                " -alias logseq-dev-ca"
                " -keystore " ssl-ca-keystore
                " -storepass " ssl-password
                " -file " ssl-ca-cert))
    (shell {:shutdown nil}
           (str "keytool -genkeypair"
                " -alias logseq-dev"
                " -keyalg RSA"
                " -keysize 2048"
                " -validity 365"
                " -keystore " ssl-keystore
                " -storepass " ssl-password
                " -keypass " ssl-password
                " -dname \"CN=" ip ", OU=Logseq Development, O=Logseq, L=Local, ST=Local, C=US\""
                " -ext " san))
    (shell {:shutdown nil}
           (str "keytool -certreq"
                " -alias logseq-dev"
                " -keystore " ssl-keystore
                " -storepass " ssl-password
                " -file " ssl-server-csr))
    (shell {:shutdown nil}
           (str "keytool -gencert"
                " -alias logseq-dev-ca"
                " -keystore " ssl-ca-keystore
                " -storepass " ssl-password
                " -infile " ssl-server-csr
                " -outfile " ssl-server-cert
                " -rfc"
                " -validity 365"
                " -ext " san
                " -ext KU=digitalSignature,keyEncipherment"
                " -ext EKU=serverAuth"))
    (shell {:shutdown nil}
           (str "keytool -importcert"
                " -noprompt"
                " -trustcacerts"
                " -alias logseq-dev-ca"
                " -file " ssl-ca-cert
                " -keystore " ssl-keystore
                " -storepass " ssl-password))
    (shell {:shutdown nil}
           (str "keytool -importcert"
                " -noprompt"
                " -trustcacerts"
                " -alias logseq-dev"
                " -file " ssl-server-cert
                " -keystore " ssl-keystore
                " -storepass " ssl-password))))

(defn ensure-dev-ssl-cert!
  "Creates the local Shadow CLJS dev HTTPS keystore and exported iOS trust CA."
  []
  (with-ssl-cert-lock!
   (fn []
     (let [ip (local-ip)]
       (backup-existing-ssl-files!)
       (when-not (usable-keystore?)
         (generate-dev-ssl-cert! ip))
       (println "Shadow CLJS HTTPS keystore:" ssl-keystore)
       (println "Install and fully trust this CA certificate on iOS:" ssl-ca-cert)
       (println "Mobile dev server URL:" (dev-server-url))))))

(defn ensure-dev-ssl-cert-task
  []
  (ensure-dev-ssl-cert!))

(defn- open-dev-app
  "Opens mobile app when watch process has built main.js"
  [shell-opts cmd]
  (let [start-time (java.time.Instant/now)]
    (loop [n 1000]
      (if (and (fs/exists? "static/mobile/js/main.js")
               (task-util/file-modified-later-than? "static/mobile/js/main.js" start-time))
        (shell (merge {:shutdown nil} shell-opts) cmd)
        (println "Waiting for app to build..."))
      (Thread/sleep 1000)
      (when-not (or (and (fs/exists? "ios/App/App/public/js/main.js")
                         (task-util/file-modified-later-than? "ios/App/App/public/js/main.js" start-time))
                    (and (fs/exists? "android/App/src/main/assets/public/js/main.js")
                         (task-util/file-modified-later-than? "android/App/src/main/assets/public/js/main.js" start-time)))
        (recur (dec n))))))

(defn app-watch
  "Watches environment to reload cljs, css and other assets for mobile"
  []
  (ensure-dev-ssl-cert!)
  (doseq [cmd ["pnpm clean"
               "pnpm mobile-watch"]]
    (println cmd)
    (shell {:shutdown nil
            :extra-env {"LOGSEQ_SHADOW_HTTPS" "true"}}
           cmd)))

(defn cap-run-ios
  "Copy assets files to iOS build directory, and run app in Xcode"
  []
  (ensure-dev-ssl-cert!)
  (open-dev-app {:extra-env {"LOGSEQ_APP_SERVER_URL" (dev-server-url)}}
                "pnpm exec cap sync ios")
  (shell {:shutdown nil} "pnpm exec cap open ios"))

(defn cap-run-android
  "Copy assets files to Android build directory, and run app in Android Studio"
  []
  (ensure-dev-ssl-cert!)
  (open-dev-app {:extra-env {"LOGSEQ_APP_SERVER_URL" (dev-server-url)}}
                "pnpm exec cap sync android")
  (shell {:shutdown nil} "pnpm exec cap open android"))

(defn run-ios-release
  "Build iOS app release"
  []
  (shell {:shutdown nil} "git checkout capacitor.config.ts")
  (shell {:shutdown nil} "pnpm run-ios-release"))

(defn run-android-release
  "Build Android app release"
  []
  (shell {:shutdown nil} "git checkout capacitor.config.ts")
  (shell {:shutdown nil} "pnpm run-android-release"))
