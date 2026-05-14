goog.provide('cljc.java_time.extn.calendar_awareness');
/**
 * If true, the lib will try to add more helpful messages to exceptions
 */
cljc.java_time.extn.calendar_awareness.helpful_exception_messages_QMARK_ = (function cljc$java_time$extn$calendar_awareness$helpful_exception_messages_QMARK_(){
return null;
});
cljc.java_time.extn.calendar_awareness.helpful_exception_message = "Hi there! - It looks like you might be trying to do something with a java.time.Instant that would require it to be 'calendar-aware',\n   but in fact Instant has no facility with working with years, months, days etc. Think of it as just \n   a milli/nanosecond offset from the UNIX epoch.\n   \n   To get around this, consider converting the Instant to a \n   ZonedDateTime first or for formatting/parsing specifically, you might add a zone to your formatter.\n    see https://stackoverflow.com/a/27483371/1700930. \n    \n    You can disable these custom exceptions by setting -Dcljc.java-time.disable-helpful-exception-messages=true";

//# sourceMappingURL=cljc.java_time.extn.calendar_awareness.js.map
