open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let time hour minute second millisecond : Input_plan.time_of_day =
  { hour; minute; second; millisecond }

let offset direction amount unit_ : Input_plan.offset =
  { direction; amount; unit_ }

let () =
  Fest.test "DB input planning classifies exact contextual inputs" (fun () ->
      expect_equal "current page"
        (Input_plan.plan ~namespace_:None ~name:"current-page")
        Input_plan.Current_page;
      expect_equal "query page"
        (Input_plan.plan ~namespace_:None ~name:"query-page")
        Input_plan.Query_page;
      expect_equal "current block"
        (Input_plan.plan ~namespace_:None ~name:"current-block")
        Input_plan.Current_block;
      expect_equal "parent block"
        (Input_plan.plan ~namespace_:None ~name:"parent-block")
        Input_plan.Parent_block;
      expect_equal "today"
        (Input_plan.plan ~namespace_:None ~name:"today")
        Input_plan.Today;
      expect_equal "yesterday"
        (Input_plan.plan ~namespace_:None ~name:"yesterday")
        Input_plan.Yesterday;
      expect_equal "tomorrow"
        (Input_plan.plan ~namespace_:None ~name:"tomorrow")
        Input_plan.Tomorrow;
      expect_equal "right now"
        (Input_plan.plan ~namespace_:None ~name:"right-now-ms")
        Input_plan.Right_now_ms;
      expect_equal "qualified special input is unresolved"
        (Input_plan.plan ~namespace_:(Some "other") ~name:"today")
        Input_plan.Unresolved);
  Fest.test "DB input planning decodes relative journal dates" (fun () ->
      expect_equal "day before"
        (Input_plan.plan ~namespace_:None ~name:"-3d")
        (Input_plan.Relative_date (offset Input_plan.Minus 3 Input_plan.Days));
      expect_equal "qualified week after"
        (Input_plan.plan ~namespace_:(Some "today") ~name:"+2w")
        (Input_plan.Relative_date (offset Input_plan.Plus 2 Input_plan.Weeks));
      expect_equal "month before"
        (Input_plan.plan ~namespace_:None ~name:"-4m")
        (Input_plan.Relative_date (offset Input_plan.Minus 4 Input_plan.Months));
      expect_equal "year after"
        (Input_plan.plan ~namespace_:None ~name:"+5y")
        (Input_plan.Relative_date (offset Input_plan.Plus 5 Input_plan.Years));
      expect_equal "unsupported relative namespace"
        (Input_plan.plan ~namespace_:(Some "other") ~name:"+1d")
        (Input_plan.Invalid_relative_namespace "other");
      expect_equal "missing relative unit"
        (Input_plan.plan ~namespace_:None ~name:"+1")
        Input_plan.Invalid_relative_format);
  Fest.test "DB input planning decodes relative timestamp boundaries" (fun () ->
      expect_equal "positive milliseconds"
        (Input_plan.plan ~namespace_:None ~name:"+1d-ms")
        (Input_plan.Relative_date_time
           (offset Input_plan.Plus 1 Input_plan.Days, time 23 59 59 999));
      expect_equal "negative milliseconds"
        (Input_plan.plan ~namespace_:None ~name:"-1d-ms")
        (Input_plan.Relative_date_time
           (offset Input_plan.Minus 1 Input_plan.Days, time 0 0 0 0));
      expect_equal "start"
        (Input_plan.plan ~namespace_:None ~name:"+1m-start")
        (Input_plan.Relative_date_time
           (offset Input_plan.Plus 1 Input_plan.Months, time 0 0 0 0));
      expect_equal "end"
        (Input_plan.plan ~namespace_:None ~name:"-1y-end")
        (Input_plan.Relative_date_time
           (offset Input_plan.Minus 1 Input_plan.Years, time 23 59 59 999));
      expect_equal "clock"
        (Input_plan.plan ~namespace_:None ~name:"+2w-123456789")
        (Input_plan.Relative_date_time
           (offset Input_plan.Plus 2 Input_plan.Weeks, time 12 34 56 789));
      expect_equal "capped clock"
        (Input_plan.plan ~namespace_:None ~name:"-2d-996099999")
        (Input_plan.Relative_date_time
           (offset Input_plan.Minus 2 Input_plan.Days, time 23 59 59 999));
      expect_equal "missing timestamp suffix"
        (Input_plan.plan ~namespace_:None ~name:"+1d-")
        Input_plan.Invalid_relative_format);
  Fest.test "DB input planning decodes today timestamp aliases" (fun () ->
      expect_equal "start alias"
        (Input_plan.plan ~namespace_:None ~name:"start-of-today-ms")
        (Input_plan.Today_time (time 0 0 0 0));
      expect_equal "end alias"
        (Input_plan.plan ~namespace_:None ~name:"end-of-today-ms")
        (Input_plan.Today_time (time 23 59 59 999));
      expect_equal "hour"
        (Input_plan.plan ~namespace_:None ~name:"today-12")
        (Input_plan.Today_time (time 12 0 0 0));
      expect_equal "minute"
        (Input_plan.plan ~namespace_:None ~name:"today-1234")
        (Input_plan.Today_time (time 12 34 0 0));
      expect_equal "second"
        (Input_plan.plan ~namespace_:None ~name:"today-123456")
        (Input_plan.Today_time (time 12 34 56 0));
      expect_equal "millisecond"
        (Input_plan.plan ~namespace_:None ~name:"today-123456789")
        (Input_plan.Today_time (time 12 34 56 789));
      expect_equal "qualified today clock remains accepted"
        (Input_plan.plan ~namespace_:(Some "other") ~name:"today-end")
        (Input_plan.Today_time (time 23 59 59 999)));
  Fest.test "DB input planning normalizes deprecated date inputs" (fun () ->
      expect_equal "deprecated day"
        (Input_plan.plan ~namespace_:None ~name:"3d")
        (Input_plan.Relative_date (offset Input_plan.Minus 3 Input_plan.Days));
      expect_equal "deprecated before"
        (Input_plan.plan ~namespace_:None ~name:"3d-before")
        (Input_plan.Relative_date (offset Input_plan.Minus 3 Input_plan.Days));
      expect_equal "deprecated after"
        (Input_plan.plan ~namespace_:None ~name:"3d-after")
        (Input_plan.Relative_date (offset Input_plan.Plus 3 Input_plan.Days));
      expect_equal "deprecated before milliseconds"
        (Input_plan.plan ~namespace_:None ~name:"3d-before-ms")
        (Input_plan.Relative_date_time
           (offset Input_plan.Minus 3 Input_plan.Days, time 0 0 0 0));
      expect_equal "deprecated after milliseconds"
        (Input_plan.plan ~namespace_:None ~name:"3d-after-ms")
        (Input_plan.Relative_date_time
           (offset Input_plan.Plus 3 Input_plan.Days, time 23 59 59 999));
      expect_equal "unknown input"
        (Input_plan.plan ~namespace_:None ~name:"unknown")
        Input_plan.Unresolved)
