(ns frontend.worker.platform-browser-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.worker.platform.browser :as platform-browser]
            [goog.object :as gobj]
            [promesa.core :as p]))

(defn- fake-pfs
  [files]
  #js {:readFile (fn [path]
                   (if (contains? @files path)
                     (p/resolved (get @files path))
                     (p/rejected (js/Error. (str "ENOENT: " path)))))
       :writeFile (fn [path payload]
                    (swap! files assoc path payload)
                    (p/resolved nil))
       :stat (fn [path]
               (if-let [payload (get @files path)]
                 (p/resolved #js {:size (.-byteLength payload)
                                   :type "file"})
                 (p/rejected (js/Error. (str "ENOENT: " path)))))
       :mkdir (fn [path]
                (swap! files assoc path (js/Uint8Array. #js []))
                (p/resolved nil))})

(deftest browser-platform-asset-read-uses-renderer-memory-path-test
  (async done
         (let [repo "logseq_db_Lambda RTC"
               file-name "69fb07e1-852f-4896-9d30-761843368fdb.png"
               payload (js/Uint8Array. #js [1 2 3])
               files (atom {"/Lambda%20RTC/assets/69fb07e1-852f-4896-9d30-761843368fdb.png" payload})
               original-pfs (gobj/get js/globalThis "pfs")
               original-location (gobj/get js/globalThis "location")]
           (gobj/set js/globalThis "pfs" (fake-pfs files))
           (gobj/set js/globalThis "location" #js {:href "http://localhost/" :search ""})
           (-> (p/let [platform (platform-browser/browser-platform)
                       read-payload ((get-in platform [:storage :asset-read-bytes!])
                                     repo
                                     file-name)]
                 (is (= payload read-payload)))
               (p/catch (fn [error]
                          (is false (str "unexpected error: " error))))
               (p/finally
                 (fn []
                   (if (some? original-pfs)
                     (gobj/set js/globalThis "pfs" original-pfs)
                     (gobj/remove js/globalThis "pfs"))
                   (if (some? original-location)
                     (gobj/set js/globalThis "location" original-location)
                     (gobj/remove js/globalThis "location"))
                   (done)))))))

(defn- fake-sqlite
  "installOpfsSAHPoolVfs that rejects with `errors` in order, then resolves; records the options of each call."
  [errors calls]
  (let [*errors (atom errors)]
    #js {:installOpfsSAHPoolVfs (fn [opts]
                                  (swap! calls conj (js->clj opts :keywordize-keys true))
                                  (if-let [e (first @*errors)]
                                    (do (swap! *errors rest) (p/rejected e))
                                    (p/resolved #js {:pool true})))}))

(defn- busy-error []
  (doto (js/Error. "Access Handles cannot be created if there is another open Access Handle")
    (gobj/set "name" "NoModificationAllowedError")))

(defn- <install [sqlite]
  (p/let [platform (platform-browser/browser-platform)]
    ((get-in platform [:storage :install-opfs-pool]) sqlite "logseq-pool-test")))

(deftest install-opfs-pool-retries-while-another-worker-holds-the-files-test
  (async done
         (let [calls (atom [])
               original-location (gobj/get js/globalThis "location")]
           (gobj/set js/globalThis "location" #js {:href "http://localhost/" :search ""})
           (-> (p/let [pool (<install (fake-sqlite [(busy-error) (busy-error)] calls))]
                 (is (true? (.-pool ^js pool)) "the pool installs once the old worker lets go of the files")
                 (is (= [false true true] (mapv :forceReinitIfPreviouslyFailed @calls))
                     "retries ask sqlite to try again instead of returning the cached failure"))
               (p/catch (fn [error]
                          (is false (str "unexpected error: " error))))
               (p/finally
                 (fn []
                   (gobj/set js/globalThis "location" original-location)
                   (done)))))))

(deftest install-opfs-pool-gives-up-after-20-busy-attempts-test
  (async done
         (let [calls (atom [])
               original-location (gobj/get js/globalThis "location")]
           (gobj/set js/globalThis "location" #js {:href "http://localhost/" :search ""})
           (-> (<install (fake-sqlite (repeatedly 100 busy-error) calls))
               (p/then (fn [_] (is false "expected the install to fail")))
               (p/catch (fn [error]
                          (is (= "NoModificationAllowedError" (.-name ^js error)))
                          (is (= 20 (count @calls)) "each busy attempt is retried once, 20 attempts in all")))
               (p/finally
                 (fn []
                   (gobj/set js/globalThis "location" original-location)
                   (done)))))))

(deftest install-opfs-pool-does-not-retry-other-errors-test
  (async done
         (let [calls (atom [])
               original-location (gobj/get js/globalThis "location")]
           (gobj/set js/globalThis "location" #js {:href "http://localhost/" :search ""})
           (-> (<install (fake-sqlite [(js/Error. "Missing required OPFS APIs.")] calls))
               (p/then (fn [_] (is false "expected the install to fail")))
               (p/catch (fn [error]
                          (is (= "Missing required OPFS APIs." (.-message ^js error)))
                          (is (= 1 (count @calls)) "an error that waiting can't fix fails at once")))
               (p/finally
                 (fn []
                   (gobj/set js/globalThis "location" original-location)
                   (done)))))))

(deftest install-opfs-pool-does-not-retry-a-no-modification-error-of-another-kind-test
  (async done
         (let [calls (atom [])
               original-location (gobj/get js/globalThis "location")
               other (doto (js/Error. "The file is read-only") (gobj/set "name" "NoModificationAllowedError"))]
           (gobj/set js/globalThis "location" #js {:href "http://localhost/" :search ""})
           (-> (<install (fake-sqlite [other] calls))
               (p/then (fn [_] (is false "expected the install to fail")))
               (p/catch (fn [error]
                          (is (= "The file is read-only" (.-message ^js error)))
                          (is (= 1 (count @calls)) "an error that waiting can't fix fails at once")))
               (p/finally
                 (fn []
                   (gobj/set js/globalThis "location" original-location)
                   (done)))))))
