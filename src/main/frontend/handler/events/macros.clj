(ns frontend.handler.events.macros
  "Macros for defining frontend RFX event registrations.")

(defmacro defevent!
  [event-id args & body]
  (let [args (if (empty? args) ['_event] args)]
    `(frontend.handler.events/register-event-definition!
      ~event-id
      (fn ~args
        ~@body))))
