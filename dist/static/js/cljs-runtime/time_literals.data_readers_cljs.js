goog.provide('time_literals.data_readers_cljs');
time_literals.data_readers_cljs.date = (function time_literals$data_readers_cljs$date(x){
return java.time.LocalDate.parse(x);
});
time_literals.data_readers_cljs.instant = (function time_literals$data_readers_cljs$instant(x){
return java.time.Instant.parse(x);
});
time_literals.data_readers_cljs.time = (function time_literals$data_readers_cljs$time(x){
return java.time.LocalTime.parse(x);
});
time_literals.data_readers_cljs.offset_time = (function time_literals$data_readers_cljs$offset_time(x){
return java.time.OffsetTime.parse(x);
});
time_literals.data_readers_cljs.duration = (function time_literals$data_readers_cljs$duration(x){
return java.time.Duration.parse(x);
});
time_literals.data_readers_cljs.period = (function time_literals$data_readers_cljs$period(x){
return java.time.Period.parse(x);
});
time_literals.data_readers_cljs.zoned_date_time = (function time_literals$data_readers_cljs$zoned_date_time(x){
return java.time.ZonedDateTime.parse(x);
});
time_literals.data_readers_cljs.offset_date_time = (function time_literals$data_readers_cljs$offset_date_time(x){
return java.time.OffsetDateTime.parse(x);
});
time_literals.data_readers_cljs.date_time = (function time_literals$data_readers_cljs$date_time(x){
return java.time.LocalDateTime.parse(x);
});
time_literals.data_readers_cljs.year = (function time_literals$data_readers_cljs$year(x){
return java.time.Year.parse(x);
});
time_literals.data_readers_cljs.year_month = (function time_literals$data_readers_cljs$year_month(x){
return java.time.YearMonth.parse(x);
});
time_literals.data_readers_cljs.zone = (function time_literals$data_readers_cljs$zone(x){
return java.time.ZoneId.of(x);
});
time_literals.data_readers_cljs.day_of_week = (function time_literals$data_readers_cljs$day_of_week(x){
return java.time.DayOfWeek.valueOf(x);
});
time_literals.data_readers_cljs.month = (function time_literals$data_readers_cljs$month(x){
return java.time.Month.valueOf(x);
});
time_literals.data_readers_cljs.month_day = (function time_literals$data_readers_cljs$month_day(x){
return java.time.MonthDay.parse(x);
});

//# sourceMappingURL=time_literals.data_readers_cljs.js.map
