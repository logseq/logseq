(ns frontend.handler.crypt
  (:require [frontend.common.thread-api :refer [def-thread-api]]))

(def-thread-api :thread-api/request-e2ee-password
  []
  {:password "test-password"})
