(ns logseq.tasks.ios-build-config-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]))

(def child-process (js/require "node:child_process"))
(def fs (js/require "node:fs"))

(def project-file
  (let [candidates ["ios/App/App.xcodeproj/project.pbxproj"
                    "../ios/App/App.xcodeproj/project.pbxproj"]]
    (or (some #(when (.existsSync fs %) %) candidates)
        (throw (js/Error. "Unable to find iOS Xcode project file")))))

(def target-build-configs
  {:Logseq {:Debug "504EC3171FED79650016851F"
            :Release "504EC3181FED79650016851F"}
   :ShareViewController {:Debug "5FFF7D7627E343FA00B00DA8"
                         :Release "5FFF7D7727E343FA00B00DA8"}
   :shortcutsExtension {:Debug "D3490CD62E7CE9EB00E796A6"
                        :Release "D3490CD72E7CE9EB00E796A6"}})

(defn- plist-value [build-config-id key]
  (string/trim
   (.toString
    (.execFileSync child-process
                   "/usr/libexec/PlistBuddy"
                   #js ["-c"
                        (str "Print :objects:" build-config-id ":buildSettings:" key)
                        project-file]))))

(defn- version-parts [version]
  (mapv #(js/parseInt % 10) (string/split version #"\.")))

(defn- compare-version [a b]
  (let [a-parts (version-parts a)
        b-parts (version-parts b)
        length (max (count a-parts) (count b-parts))]
    (loop [index 0]
      (if (= index length)
        0
        (let [a-part (get a-parts index 0)
              b-part (get b-parts index 0)
              comparison (compare a-part b-part)]
          (if (zero? comparison)
            (recur (inc index))
            comparison))))))

(defn- deployment-target [target configuration]
  (plist-value (get-in target-build-configs [target configuration])
               "IPHONEOS_DEPLOYMENT_TARGET"))

(deftest app-extensions-do-not-require-newer-ios-than-containing-app
  (doseq [configuration [:Debug :Release]
          extension [:ShareViewController :shortcutsExtension]]
    (testing (str (name extension) " " (name configuration))
      (let [app-target (deployment-target :Logseq configuration)
            extension-target (deployment-target extension configuration)]
        (is (not (pos? (compare-version extension-target app-target)))
            (str extension " " configuration " deployment target "
                 extension-target " must not exceed Logseq "
                 configuration " deployment target " app-target))))))
