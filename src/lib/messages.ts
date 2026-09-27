import type { DayPart } from "./time";

export type MessageTag =
  | "any"
  | DayPart
  | "low"
  | "high"
  | "streak"
  | "overdue"
  | "productive"
  | "nojournal"
  | "journaled"
  | "new"
  | "focus";

export type Message = { id: string; text: string; tags: MessageTag[] };

export type MessageContext = {
  dayPart: DayPart;
  lastMood: number | null;
  streak: number;
  overdue: number;
  tasksDoneToday: number;
  wroteToday: boolean;
  isNew: boolean;
  focusToday: number;
};

// Placeholders: {name}, {pet}, {streak}
const RAW: [MessageTag[], string][] = [
  // anytime
  [["any"], "Tiny steps still move you forward. 🐾"],
  [["any"], "You don't have to remember everything. That's what I'm here for!"],
  [["any"], "Hi {name}! {pet} saved you a comfy spot. ☁️"],
  [["any"], "Progress, not perfection. Always."],
  [["any"], "Your brain is for having ideas, not holding them. Tuck them here!"],
  [["any"], "Drink some water? {pet} just did. 💧"],
  [["any"], "One thing at a time. You've got this."],
  [["any"], "Fun fact: squirrels plant thousands of trees by 'forgetting' acorns. Your forgotten ideas can grow too. 🌳"],
  [["any"], "It's okay to rest. Rest is productive too."],
  [["any"], "Checking one box counts. Seriously."],
  [["any"], "You're doing better than you think, {name}."],
  [["any"], "A messy list is better than no list. 📝"],
  [["any"], "Be proud of the small wins today."],
  [["any"], "{pet} believes in you. {pet} is very wise. 🌰"],
  [["any"], "Deep breath in… and out. Ready?"],
  [["any"], "Showing up is the hardest part. You're already here!"],
  [["any"], "Your future self says thank you for writing that down."],
  [["any"], "Plot twist: you're the main character. ✨"],
  [["any"], "Stretch break? Reach for the sky like a tree! 🌲"],
  [["any"], "You can do hard things. You've done them before."],
  [["any"], "Don't forget to celebrate yourself today. 🎈"],
  [["any"], "Kindness to yourself is still kindness."],
  [["any"], "What's one thing that would make today lighter?"],
  [["any"], "Good things take time. So do good squirrels. 🐿️"],
  [["any"], "Your pace is the right pace."],
  [["any"], "{pet} did a little happy dance just because you opened the app."],
  [["any"], "Remember: done is better than perfect."],
  [["any"], "The best time to start was yesterday. The second best is now. ⏳"],
  [["any"], "Collect moments, not just tasks."],
  [["any"], "Your notes are safe and cozy in Tuckbury. 🏡"],
  [["any"], "Every list you finish is a little victory parade. 🎉"],
  [["any"], "Be gentle with yourself. You're learning as you go."],
  [["any"], "Pro tip: type 'Groceries: milk, eggs, bread' in quick add. Magic! 🪄"],
  [["any"], "Pro tip: 'Submit report friday 5pm' sets the deadline for you."],
  [["any"], "Did you know? You can tap me for another message. 👆"],
  [["any"], "Pro tip: write a letter to future you in the Time Capsule. 💌"],
  [["any"], "Ideas are like acorns. Collect them now, sort them later."],
  [["any"], "You're allowed to change the plan."],
  [["any"], "Sunshine mode: activated. ☀️"],
  [["any"], "Hey {name}, you matter. Just a reminder."],
  // time of day
  [["morning"], "Good morning, {name}! What's the one thing that matters most today? 🌅"],
  [["morning"], "Rise and shine! {pet} already stretched their tail. 🐿️"],
  [["morning"], "Fresh day, fresh page. Let's make it a good one."],
  [["morning"], "Morning! Coffee, tea, or pure determination? ☕"],
  [["morning"], "Start small: pick one task and give it 25 minutes. 🍅"],
  [["morning"], "New day, new acorns to collect. 🌰"],
  [["afternoon"], "Afternoon check-in: how's it going, {name}?"],
  [["afternoon"], "Halfway there! A snack break might help. 🍪"],
  [["afternoon"], "Post-lunch slump? A quick focus session can reset you."],
  [["afternoon"], "You've made it through half the day. That's something!"],
  [["afternoon"], "Take a stretch, then tackle the next thing. 🙆"],
  [["evening"], "Evening, {name}. Time to wind down soon. 🌇"],
  [["evening"], "What went well today? Even small things count."],
  [["evening"], "The day's almost done. Be proud of what you did."],
  [["evening"], "A little journal before bed? {pet} loves bedtime stories. 📔"],
  [["evening"], "Plan tomorrow in two minutes, sleep better tonight."],
  [["night"], "It's late, {name}. Your to-dos will wait. Sleep is important. 🌙"],
  [["night"], "Night owl mode! Just don't forget to rest. 🦉"],
  [["night"], "{pet} is yawning… maybe you should too? 😴"],
  [["night"], "Stars are out. Time to let your brain rest. ✨"],
  [["night"], "Whatever didn't get done today can be tomorrow's win."],
  // mood
  [["low"], "Rough days happen. You don't have to fix everything today. 💛"],
  [["low"], "It's okay to not be okay. {pet} is right here with you."],
  [["low"], "Be soft with yourself today. Even one small thing is plenty."],
  [["low"], "Hard days are part of the story, not the whole story."],
  [["low"], "Maybe today's task is just: rest, eat something, drink water."],
  [["low"], "You got through every hard day so far. That's a 100% record."],
  [["low"], "Sending you a warm, fluffy squirrel hug. 🤗"],
  [["low"], "No pressure today. Just be here. That's enough."],
  [["low"], "Would writing it down help? The journal is always listening. 📔"],
  [["high"], "Look at you glowing! Keep that energy, {name}! ✨"],
  [["high"], "Good vibes detected! {pet} is doing cartwheels. 🤸"],
  [["high"], "You're on a roll! What's next on the list?"],
  [["high"], "Happy you = happy {pet}. 🌈"],
  [["high"], "Bottle up this feeling. Maybe in a Time Capsule? 💌"],
  // streak
  [["streak"], "🔥 {streak}-day journal streak! You're unstoppable."],
  [["streak"], "{streak} days in a row! {pet} is so proud. 🐿️💛"],
  [["streak"], "Your streak is {streak} days strong. Consistency looks good on you!"],
  [["streak"], "{streak} days of showing up for yourself. That's beautiful."],
  [["streak"], "Keep the flame alive! {streak} days and counting 🔥"],
  [["streak", "nojournal"], "Your {streak}-day streak is waiting for today's entry! 📔"],
  // overdue
  [["overdue"], "A few things slipped past their deadline. No stress, pick just one. 🌱"],
  [["overdue"], "Overdue isn't failure. It's just a nudge. Let's tackle one?"],
  [["overdue"], "Some tasks are waiting for you. Or… reschedule them. That's allowed too!"],
  [["overdue"], "Tiny tip: finish the smallest overdue task first. Momentum is magic. ✨"],
  [["overdue"], "{pet} found some overdue acorns. Want to sort them out together?"],
  // productive
  [["productive"], "Look at all those checked boxes! 🎉"],
  [["productive"], "You've been crushing it today, {name}!"],
  [["productive"], "Productivity level: legendary squirrel. 🐿️👑"],
  [["productive"], "Every checkmark makes {pet} do a little hop!"],
  [["productive"], "You got things done today. Take a moment to enjoy that."],
  [["productive"], "Done and done! Don't forget to reward yourself. 🍦"],
  // journal
  [["nojournal"], "How was your day? {pet} would love to hear about it. 📔"],
  [["nojournal"], "Two minutes of journaling can clear a whole cloud of thoughts. ☁️"],
  [["nojournal"], "Today's page is still blank. Want to fill it with a few words?"],
  [["nojournal"], "Pick a mood, write one sentence. That's a journal entry!"],
  [["nojournal", "evening"], "Before the day ends: one line about today? 🌇"],
  [["journaled"], "Today's journal: done! Your future self will love reading it. 💌"],
  [["journaled"], "You wrote today. That's self-care in action. 🌿"],
  [["journaled"], "Another day, another page in your story. 📖"],
  // focus
  [["focus"], "Nice focus session! Your brain deserves a stretch. 🧠"],
  [["focus"], "Deep work unlocked. {pet} is impressed. 🍅"],
  [["focus"], "Focused minutes add up to big things."],
  // new users
  [["new"], "Welcome to Tuckbury, {name}! I'm {pet}. Let's tuck away your first thought. 🌰"],
  [["new"], "New here? Try the quick add box and just type anything!"],
  [["new"], "Every great journey starts with a single note. 📝"],
  [["new"], "Tip: write your first journal entry to start your streak! 🔥"],
];

export const MESSAGES: Message[] = RAW.map(([tags, text], i) => ({ id: `m${i + 1}`, tags, text }));

function eligible(m: Message, ctx: MessageContext): boolean {
  return m.tags.every((t) => {
    switch (t) {
      case "any":
        return true;
      case "morning":
      case "afternoon":
      case "evening":
      case "night":
        return ctx.dayPart === t;
      case "low":
        return ctx.lastMood !== null && ctx.lastMood <= 2;
      case "high":
        return ctx.lastMood !== null && ctx.lastMood >= 4;
      case "streak":
        return ctx.streak >= 3;
      case "overdue":
        return ctx.overdue > 0;
      case "productive":
        return ctx.tasksDoneToday > 0;
      case "nojournal":
        return !ctx.wroteToday;
      case "journaled":
        return ctx.wroteToday;
      case "new":
        return ctx.isNew;
      case "focus":
        return ctx.focusToday > 0;
    }
  });
}

/** Weighted pick: context-specific messages are more likely than generic ones. */
export function pickMessage(
  ctx: MessageContext,
  recentIds: string[] = [],
  rand: () => number = Math.random,
): Message {
  const pool = MESSAGES.filter((m) => eligible(m, ctx));
  const fresh = pool.filter((m) => !recentIds.includes(m.id));
  const candidates = fresh.length ? fresh : pool;
  const weights = candidates.map((m) => {
    const specific = m.tags.filter((t) => t !== "any").length;
    // Supportive messages dominate on low-mood days.
    const lowBoost = ctx.lastMood !== null && ctx.lastMood <= 2 && m.tags.includes("low") ? 4 : 0;
    return 1 + specific * 3 + lowBoost;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

export function renderMessage(m: Message, vars: { name: string; pet: string; streak: number }): string {
  return m.text
    .replaceAll("{name}", vars.name || "friend")
    .replaceAll("{pet}", vars.pet)
    .replaceAll("{streak}", String(vars.streak));
}
