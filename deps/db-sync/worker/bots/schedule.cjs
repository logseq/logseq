const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const weekdaysChinese = ["日", "一", "二", "三", "四", "五", "六"];

function weeklyProposal(prompt, timeZone, agent) {
  const chinese = prompt.match(/每(?:周|星期)([日一二三四五六天])/);
  const english = prompt.match(/\b(?:every|on)\s+(sun|mon|tue|wed|thu|fri|sat)(?:day|sday|nesday|rsday|urday)?s?\b/i);
  const weekday = chinese ? weekdaysChinese.indexOf(chinese[1].replace("天", "日"))
    : weekdays.findIndex(day => day.toLowerCase() === english?.[1].toLowerCase());
  if (weekday < 0) return null;
  const time = prompt.match(/(?:\bat\s+|\s|^)([01]?\d|2[0-3]):([0-5]\d)(?:\b|$)/i);
  const chineseHour = prompt.match(/(上[午]|下[午]|晚[上])?\s*([01]?\d|2[0-3])点(?:([0-5]?\d)分?)?/);
  let hour = Number(time?.[1] ?? chineseHour?.[2] ?? 9);
  if (hour < 12 && ["下午", "晚上"].includes(chineseHour?.[1])) hour += 12;
  return {prompt, weekday, hour, minute: Number(time?.[2] ?? chineseHour?.[3] ?? 0), timeZone, agent};
}

function nextWeekly(rule, now = Date.now()) {
  const format = new Intl.DateTimeFormat("en-US", {
    timeZone: rule.timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });
  const weekday = weekdays[rule.weekday];
  const hour = String(rule.hour).padStart(2, "0");
  const minute = String(rule.minute).padStart(2, "0");
  const start = (Math.floor(now / 60000) + 1) * 60000;
  for (let instant = start; instant < start + 8 * 86400000; instant += 60000) {
    const parts = Object.fromEntries(format.formatToParts(instant).map(part => [part.type, part.value]));
    if (parts.weekday === weekday && parts.hour === hour && parts.minute === minute) return new Date(instant);
  }
  throw new Error("No scheduled occurrence was found");
}

module.exports = {weeklyProposal, nextWeekly};
