// Positive sessions across three registers. `register` is how it's written, not how heavy it is.
// Mixed probes carry real worry alongside the good news, so a high score there is earned.
export type Register = "excited" | "warm" | "calm" | "mixed";
export const PROBES: { id: string; register: Register; text: string }[] = [
  { id: "job-caps", register: "excited", text: "I GOT THE JOB!!! I literally can't stop screaming, I can't believe it, I CAN'T BELIEVE IT" },
  { id: "engaged", register: "excited", text: "He proposed!!! I said yes!!! My hands are still shaking, I've never been this happy in my whole life" },
  { id: "exam-pass", register: "excited", text: "PASSED. Every single exam. Everything I worked for all year, it all paid off. I'm crying" },
  { id: "baby", register: "excited", text: "Positive test. After two years of trying. I can't breathe, my chest is so full, I keep looking at it over and over" },
  { id: "love-partner", register: "warm", text: "I love her so much it actually hurts sometimes. Watching her sleep this morning I just felt everything all at once." },
  { id: "proud-run", register: "warm", text: "Ran my first 10k today. Six months ago I couldn't run to the end of the road. Really proud of myself." },
  { id: "relief-scan", register: "warm", text: "Mum's scan came back clear. I didn't realise how scared I'd been until the relief hit. I sat in the car and just breathed." },
  { id: "friends-dinner", register: "warm", text: "Had the whole gang round for dinner, first time in ages. Laughed until my stomach hurt. I feel so lucky to have them." },
  { id: "grateful-quiet", register: "calm", text: "Good day today. Feeling calm and grateful." },
  { id: "hope-therapy", register: "calm", text: "I think I'm starting to feel a bit more hopeful. Therapy is slowly helping and I noticed I laughed at work today." },
  { id: "content-sunday", register: "calm", text: "Quiet Sunday. Coffee, a book, the window open. Nothing to report, just content." },
  { id: "job-nervous", register: "mixed", text: "Got the job!! But it means moving across the country and leaving everyone. So happy and so scared at the same time." },
  { id: "engaged-family", register: "mixed", text: "We're engaged and I'm over the moon, but my family won't accept him and I'm dreading telling them." },
];
