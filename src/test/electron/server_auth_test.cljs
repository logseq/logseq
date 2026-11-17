(ns electron.server-auth-test
  (:require [cljs.test :refer [deftest is testing]]
            [electron.server-auth :as server-auth]))

(deftest api-authentication-requires-configured-bearer-token
  (doseq [[tokens header allowed?]
          [[nil "Bearer configured-token" false]
           [[] "Bearer configured-token" false]
           [["configured-token"] nil false]
           [["configured-token"] "" false]
           [["configured-token"] "Bearer " false]
           [["configured-token"] "Bearer wrong-token" false]
           [["configured-token"] "configured-token" false]
           [["configured-token"] "Basic configured-token" false]
           [["configured-token"] "prefix Bearer configured-token" false]
           [[nil {} {:value nil} {:value ""}] "Bearer " false]
           [["configured-token"] "Bearer configured-token" true]
           [[{:value "configured-token"}] "Bearer configured-token" true]
           [["other-token" {:value "configured-token"}] "bearer configured-token" true]]]
    (testing (str "tokens=" (pr-str tokens) ", header=" (pr-str header))
      (is (= allowed?
             (try
               (server-auth/validate-auth-token header tokens)
               true
               (catch js/Error _ false)))))))
