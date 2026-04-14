import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// ---------------------------------------------------------------------------
// Curated beta launch pool — 125 real-world reflections.
//
// Selection criteria:
//   - Specific, scene-grounded first-person voice (an action, object, or place)
//   - "I recognise myself in this" quality — not descriptions of emotions
//   - Distinct granular labels to maximise matching surface area
//   - Timestamps preserved from source data for organic spread
//
// Sources:
//   - src/components/extras/reflections-seed.json  (100 entries — all selected)
//   - src/components/extras/deep-research-report.md (25 entries selected from 87)
// ---------------------------------------------------------------------------

const BATCH_A = [
  {
    displayText:
      "I keep waking up at 3am with my chest tight and my mind already running through everything that could go wrong today. By the time my alarm goes off I'm exhausted from a day I haven't even started yet.",
    primaryEmotion: "anxiety",
    granularLabel: "anticipatory dread",
    thematicTags: ["work", "health"],
    intensity: 7,
    addedAt: 1744156800000,
  },
  {
    displayText:
      "I sat in the parking lot for twenty minutes before going inside. I don't know what I was waiting for. Permission, maybe. Or just a version of myself that doesn't feel this heavy.",
    primaryEmotion: "numbness",
    granularLabel: "present but not there",
    thematicTags: ["identity", "self-worth"],
    intensity: 6,
    addedAt: 1744070400000,
  },
  {
    displayText:
      "Everyone keeps telling me how proud they are. I smile and say thank you and then I go home and sit in silence because none of this feels like what I thought it would feel like.",
    primaryEmotion: "loneliness",
    granularLabel: "performing strength for others",
    thematicTags: ["family", "belonging", "identity"],
    intensity: 7,
    addedAt: 1743984000000,
  },
  {
    displayText:
      "I refreshed my email eleven times in the last hour. I know nothing is coming. But my body won't believe my brain.",
    primaryEmotion: "anxiety",
    granularLabel: "can't switch off",
    thematicTags: ["work"],
    intensity: 5,
    addedAt: 1743897600000,
  },
  {
    displayText:
      "I miss someone who's still here. They're right next to me and I miss them. I don't know how to explain that without sounding crazy.",
    primaryEmotion: "sadness",
    granularLabel: "quiet disconnection",
    thematicTags: ["relationships"],
    intensity: 6,
    addedAt: 1743811200000,
  },
  {
    displayText:
      "I don't think I'm depressed. I think I just forgot what it feels like to want something. Everything is fine on paper and completely flat in my chest.",
    primaryEmotion: "numbness",
    granularLabel: "going through motions",
    thematicTags: ["purpose", "identity"],
    intensity: 5,
    addedAt: 1743724800000,
  },
  {
    displayText:
      "My hands are shaking and I haven't even opened the message yet. I already know it's bad. I can feel it in my stomach.",
    primaryEmotion: "anxiety",
    granularLabel: "waiting for something bad",
    thematicTags: ["work", "relationships"],
    intensity: 8,
    addedAt: 1743638400000,
  },
  {
    displayText:
      "I cried in the shower today for no reason I can name. Not sad exactly. Just full. Like everything I've been holding finally leaked out when no one was watching.",
    primaryEmotion: "overwhelm",
    granularLabel: "emotional overflow",
    thematicTags: ["self-worth", "health"],
    intensity: 6,
    addedAt: 1743552000000,
  },
  {
    displayText:
      "I keep saying yes to things I don't want to do because I'm terrified that if I stop being useful, people will stop wanting me around.",
    primaryEmotion: "anxiety",
    granularLabel: "responsibility weight",
    thematicTags: ["self-worth", "relationships"],
    intensity: 7,
    addedAt: 1743465600000,
  },
  {
    displayText:
      "It's been six months and I still reach for my phone to text them. The muscle memory is the cruelest part.",
    primaryEmotion: "grief",
    granularLabel: "phantom presence",
    thematicTags: ["loss", "relationships"],
    intensity: 7,
    addedAt: 1743379200000,
  },
  {
    displayText:
      "I got the promotion and felt nothing. Just immediately started worrying about the next thing. I don't know when I stopped being able to feel good news.",
    primaryEmotion: "numbness",
    granularLabel: "numb-but-functional",
    thematicTags: ["work", "purpose"],
    intensity: 5,
    addedAt: 1744156800000,
  },
  {
    displayText:
      "I'm so tired of being the strong one. Everyone leans on me and nobody asks how I'm doing. I don't even know if I'd answer honestly if they did.",
    primaryEmotion: "loneliness",
    granularLabel: "invisible to the people closest to me",
    thematicTags: ["family", "relationships", "self-worth"],
    intensity: 7,
    addedAt: 1744070400000,
  },
  {
    displayText:
      "I keep comparing myself to people who started at the same time as me and it's eating me alive. I know comparison is pointless but knowing that doesn't make it stop.",
    primaryEmotion: "shame",
    granularLabel: "I should be further along",
    thematicTags: ["work", "self-worth"],
    intensity: 6,
    addedAt: 1743984000000,
  },
  {
    displayText:
      "I don't even know who I'm angry at anymore. Myself probably. For letting it get this bad. For not saying something when I had the chance.",
    primaryEmotion: "anger",
    granularLabel: "stuck resentment",
    thematicTags: ["relationships", "self-worth"],
    intensity: 6,
    addedAt: 1743897600000,
  },
  {
    displayText:
      "I'm in a room full of people laughing and I'm performing so hard right now. Smiling at the right moments. Saying the right things. Inside it's just static.",
    primaryEmotion: "loneliness",
    granularLabel: "surrounded and alone",
    thematicTags: ["belonging", "identity"],
    intensity: 7,
    addedAt: 1743811200000,
  },
  {
    displayText:
      "I can feel the anxiety sitting in my jaw. Clenched all day. I only notice when I try to eat and it hurts to chew.",
    primaryEmotion: "anxiety",
    granularLabel: "physical tension",
    thematicTags: ["health", "work"],
    intensity: 5,
    addedAt: 1743724800000,
  },
  {
    displayText:
      "The thing nobody tells you about grief is that it's boring. It's the same emptiness every morning. The same absence at dinner. It doesn't build to anything. It just sits there.",
    primaryEmotion: "grief",
    granularLabel: "invisible grief",
    thematicTags: ["loss"],
    intensity: 6,
    addedAt: 1743638400000,
  },
  {
    displayText:
      "I spent two hours on a task that should take twenty minutes because I'm so scared of getting it wrong. Every sentence I write I delete and rewrite. It's paralyzing.",
    primaryEmotion: "anxiety",
    granularLabel: "perfectionist spiral",
    thematicTags: ["work", "self-worth"],
    intensity: 6,
    addedAt: 1743552000000,
  },
  {
    displayText:
      "I look at my bank account and my whole body goes cold. It's not even that bad objectively. But the feeling of not having enough makes everything else feel fragile.",
    primaryEmotion: "anxiety",
    granularLabel: "scarcity dread",
    thematicTags: ["finances"],
    intensity: 7,
    addedAt: 1743465600000,
  },
  {
    displayText:
      "My mom called and I let it ring. I'll call her back later and pretend I was busy. The truth is I just can't carry her worry on top of mine right now.",
    primaryEmotion: "overwhelm",
    granularLabel: "compassion fatigue",
    thematicTags: ["family"],
    intensity: 5,
    addedAt: 1743379200000,
  },
  {
    displayText:
      "I had a good day today. Like actually good. And instead of just enjoying it I spent the whole evening waiting for something to ruin it. I can't trust good things anymore.",
    primaryEmotion: "anxiety",
    granularLabel: "anticipatory dread",
    thematicTags: ["identity", "health"],
    intensity: 5,
    addedAt: 1744156800000,
  },
  {
    displayText:
      "I don't recognize myself in photos anymore. Not in a body image way. In a who-is-that-person way. Like I'm looking at someone I used to know.",
    primaryEmotion: "confusion",
    granularLabel: "caught between two selves",
    thematicTags: ["identity"],
    intensity: 6,
    addedAt: 1744070400000,
  },
  {
    displayText:
      "They apologized and I said it was fine and now I'm lying in bed furious. It wasn't fine. I just didn't know how to say that without making everything worse.",
    primaryEmotion: "anger",
    granularLabel: "swallowed rage",
    thematicTags: ["relationships"],
    intensity: 7,
    addedAt: 1743984000000,
  },
  {
    displayText:
      "I've been scrolling for three hours. Not looking for anything. Just avoiding the silence. The silence is where all the thoughts live.",
    primaryEmotion: "numbness",
    granularLabel: "checked out",
    thematicTags: ["purpose"],
    intensity: 4,
    addedAt: 1743897600000,
  },
  {
    displayText:
      "Everyone back home thinks I have it figured out because I'm abroad. I can't tell them I eat alone every night and don't know a single person I'd call if something happened.",
    primaryEmotion: "loneliness",
    granularLabel: "geographic loneliness",
    thematicTags: ["belonging", "family", "identity"],
    intensity: 8,
    addedAt: 1743811200000,
  },
  {
    displayText:
      "I keep starting things and not finishing them. Books, projects, conversations. Everything gets to 60% and then I just... stop. I don't know if it's laziness or something deeper.",
    primaryEmotion: "frustration",
    granularLabel: "stalled momentum",
    thematicTags: ["purpose", "self-worth"],
    intensity: 5,
    addedAt: 1743724800000,
  },
  {
    displayText:
      "I said the wrong thing again. I can feel it. The way their face changed for half a second before they covered it. Now it's going to replay in my head for the next three days.",
    primaryEmotion: "shame",
    granularLabel: "replaying what I said wrong",
    thematicTags: ["relationships", "self-worth"],
    intensity: 7,
    addedAt: 1743638400000,
  },
  {
    displayText:
      "Some days the sadness is sharp and I can point at it. Today it's just a fog. Everywhere and nowhere. I can't fight fog.",
    primaryEmotion: "sadness",
    granularLabel: "flat",
    thematicTags: ["health"],
    intensity: 5,
    addedAt: 1743552000000,
  },
  {
    displayText:
      "I'm holding so many people's secrets and problems and none of them know about each other and none of them know about mine.",
    primaryEmotion: "overwhelm",
    granularLabel: "invisible weight",
    thematicTags: ["relationships", "self-worth"],
    intensity: 6,
    addedAt: 1743465600000,
  },
  {
    displayText:
      "I feel like I'm watching my life from behind glass. Everything is happening. I'm technically there. But I can't feel any of it.",
    primaryEmotion: "numbness",
    granularLabel: "dissociation",
    thematicTags: ["identity", "health"],
    intensity: 7,
    addedAt: 1743379200000,
  },
  {
    displayText:
      "I worked so hard to get out and now I'm here and I can't tell anyone it's not what I thought it would be. The guilt of that is heavier than whatever I'm actually feeling.",
    primaryEmotion: "confusion",
    granularLabel: "moral vertigo",
    thematicTags: ["identity", "family", "belonging"],
    intensity: 7,
    addedAt: 1744156800000,
  },
  {
    displayText:
      "My body is so tired but my mind won't stop. I've been lying here for two hours thinking about a conversation from 2019.",
    primaryEmotion: "anxiety",
    granularLabel: "can't switch off",
    thematicTags: ["health", "relationships"],
    intensity: 6,
    addedAt: 1744070400000,
  },
  {
    displayText:
      "I don't want to be comforted. I don't want advice. I just want someone to sit with me and not try to fix it.",
    primaryEmotion: "sadness",
    granularLabel: "deep loneliness",
    thematicTags: ["belonging"],
    intensity: 6,
    addedAt: 1743984000000,
  },
  {
    displayText:
      "I'm angry at myself for still caring. They moved on months ago and I'm still here checking if they watched my story. It's embarrassing.",
    primaryEmotion: "shame",
    granularLabel: "lingering attachment",
    thematicTags: ["relationships", "self-worth"],
    intensity: 6,
    addedAt: 1743897600000,
  },
  {
    displayText:
      "The worst part is I don't even know what I'd say if someone asked what's wrong. It's not one thing. It's everything pressing down at the same time until I can't sort any of it out.",
    primaryEmotion: "overwhelm",
    granularLabel: "can't untangle",
    thematicTags: ["health", "purpose"],
    intensity: 7,
    addedAt: 1743811200000,
  },
  {
    displayText:
      "I've been putting on this face for so long I'm starting to forget what's underneath it. I don't think I'm faking it anymore. I think the mask just became my face.",
    primaryEmotion: "numbness",
    granularLabel: "identity erosion",
    thematicTags: ["identity", "belonging"],
    intensity: 6,
    addedAt: 1743724800000,
  },
  {
    displayText:
      "I deleted the text before sending it. Again. I keep almost reaching out and then convincing myself I'm being too much.",
    primaryEmotion: "loneliness",
    granularLabel: "self-silencing",
    thematicTags: ["relationships", "self-worth"],
    intensity: 5,
    addedAt: 1743638400000,
  },
  {
    displayText:
      "My dad would never understand any of this. He came from nothing and built everything and here I am with all of it struggling to get out of bed. I feel like a waste of his sacrifice.",
    primaryEmotion: "shame",
    granularLabel: "unearned struggle",
    thematicTags: ["family", "identity", "self-worth"],
    intensity: 8,
    addedAt: 1743552000000,
  },
  {
    displayText:
      "Something small happened today — someone held the door for me and I almost cried. I think I've been running on empty longer than I realized.",
    primaryEmotion: "overwhelm",
    granularLabel: "emotional overflow",
    thematicTags: ["health"],
    intensity: 5,
    addedAt: 1743465600000,
  },
  {
    displayText:
      "I keep thinking about the person I was two years ago and I don't know if I'm better or worse. Just different. And the not knowing bothers me more than either answer would.",
    primaryEmotion: "confusion",
    granularLabel: "lost direction",
    thematicTags: ["identity", "purpose"],
    intensity: 5,
    addedAt: 1743379200000,
  },
  {
    displayText:
      "I'm not sad about the breakup anymore. I'm sad about who I became in it. How small I made myself. How long I pretended that was love.",
    primaryEmotion: "sadness",
    granularLabel: "retroactive clarity",
    thematicTags: ["relationships", "identity"],
    intensity: 7,
    addedAt: 1744156800000,
  },
  {
    displayText:
      "I don't know why I feel guilty for resting. I worked all week. I earned this. But my body is on the couch and my brain is screaming that I'm falling behind.",
    primaryEmotion: "anxiety",
    granularLabel: "guilt-laced rest",
    thematicTags: ["work", "self-worth"],
    intensity: 5,
    addedAt: 1744070400000,
  },
  {
    displayText:
      "They said 'you seem fine' and I wanted to scream. Fine is the performance. Fine is the costume. Nobody asks what's under fine.",
    primaryEmotion: "frustration",
    granularLabel: "unseen pain",
    thematicTags: ["belonging", "relationships"],
    intensity: 7,
    addedAt: 1743984000000,
  },
];

const BATCH_B = [
  {
    displayText:
      "I had a panic attack in the bathroom at work and then went back to my desk and answered emails. The gap between what's happening inside me and what people see is getting wider every day.",
    primaryEmotion: "anxiety",
    granularLabel: "hidden crisis",
    thematicTags: ["work", "health"],
    intensity: 8,
    addedAt: 1743897600000,
  },
  {
    displayText:
      "I thought moving to a new city would fix something. Turns out I just brought all the same feelings to a place where nobody knows my name.",
    primaryEmotion: "loneliness",
    granularLabel: "geographic loneliness",
    thematicTags: ["belonging", "change"],
    intensity: 7,
    addedAt: 1743811200000,
  },
  {
    displayText:
      "I opened my laptop to work and just stared at the screen for forty minutes. Couldn't start. Couldn't close it. Just frozen in the in-between.",
    primaryEmotion: "numbness",
    granularLabel: "paralysis",
    thematicTags: ["work"],
    intensity: 5,
    addedAt: 1743724800000,
  },
  {
    displayText:
      "I keep almost telling people what's really going on and then I make a joke instead. The jokes are getting darker and nobody's noticed.",
    primaryEmotion: "sadness",
    granularLabel: "hidden behind humor",
    thematicTags: ["belonging", "self-worth"],
    intensity: 6,
    addedAt: 1743638400000,
  },
  {
    displayText:
      "Today I walked for an hour and somewhere around minute forty the tightness in my chest loosened a little. Not gone. Just loosened. That felt like something.",
    primaryEmotion: "relief",
    granularLabel: "small opening",
    thematicTags: ["health"],
    intensity: 3,
    addedAt: 1743552000000,
  },
  {
    displayText:
      "I've been carrying this anger toward my mother for so long it doesn't even feel like anger anymore. It just feels like the shape of our relationship. Like that's all there is.",
    primaryEmotion: "anger",
    granularLabel: "calcified resentment",
    thematicTags: ["family"],
    intensity: 6,
    addedAt: 1743465600000,
  },
  {
    displayText:
      "I'm not allowed to be struggling. Too many people look up to me. Too many people sacrificed too much. So I just don't say anything and hope the weight distributes itself somehow.",
    primaryEmotion: "loneliness",
    granularLabel: "performing strength for others",
    thematicTags: ["family", "belonging"],
    intensity: 8,
    addedAt: 1743379200000,
  },
  {
    displayText:
      "Everything is urgent and nothing matters. I have seventeen tabs open and I can't focus on any of them. My brain is a browser that needs to be force-quit.",
    primaryEmotion: "overwhelm",
    granularLabel: "cognitive overload",
    thematicTags: ["work"],
    intensity: 6,
    addedAt: 1744156800000,
  },
  {
    displayText:
      "I realized I haven't been excited about anything in months. Not dreading anything either. Just... neutral. I miss wanting things.",
    primaryEmotion: "numbness",
    granularLabel: "desire gone flat",
    thematicTags: ["purpose", "identity"],
    intensity: 5,
    addedAt: 1744070400000,
  },
  {
    displayText:
      "I made a mistake at work three weeks ago and I still think about it every single day. Nobody else remembers. But I do. Every detail.",
    primaryEmotion: "shame",
    granularLabel: "ruminating regret",
    thematicTags: ["work", "self-worth"],
    intensity: 6,
    addedAt: 1743984000000,
  },
  {
    displayText:
      "I want to cry but it won't come. Like there's a dam behind my eyes that won't break. The pressure just builds and builds and nothing releases.",
    primaryEmotion: "sadness",
    granularLabel: "can't cry but want to",
    thematicTags: ["health"],
    intensity: 7,
    addedAt: 1743897600000,
  },
  {
    displayText:
      "I don't know how to tell my family that the degree they're paying for is making me miserable. They'd be devastated. So I just keep going.",
    primaryEmotion: "helplessness",
    granularLabel: "trapped by others' investment",
    thematicTags: ["family", "identity", "purpose"],
    intensity: 7,
    addedAt: 1743811200000,
  },
  {
    displayText:
      "I forgave them. Or I said I did. But every time they do something small and careless it all comes flooding back and I realize I haven't forgiven anything.",
    primaryEmotion: "anger",
    granularLabel: "unresolved betrayal",
    thematicTags: ["relationships"],
    intensity: 6,
    addedAt: 1743724800000,
  },
  {
    displayText:
      "I woke up and for about ten seconds everything was quiet. No anxiety. No dread. Just morning. I wish I could live in those ten seconds.",
    primaryEmotion: "relief",
    granularLabel: "fleeting peace",
    thematicTags: ["health"],
    intensity: 3,
    addedAt: 1743638400000,
  },
  {
    displayText:
      "I keep picking up my phone and putting it down. I want to talk to someone but I don't know what I'd say. 'I feel weird' doesn't feel like enough to bother someone with.",
    primaryEmotion: "loneliness",
    granularLabel: "self-dismissing",
    thematicTags: ["belonging", "self-worth"],
    intensity: 5,
    addedAt: 1743552000000,
  },
  {
    displayText:
      "I don't know if I'm burnt out or if this is just what being an adult feels like. Everyone else seems to be handling it. Maybe I'm just not built for this.",
    primaryEmotion: "overwhelm",
    granularLabel: "existential exhaustion",
    thematicTags: ["work", "purpose", "self-worth"],
    intensity: 6,
    addedAt: 1743465600000,
  },
  {
    displayText:
      "I caught myself smiling at a stranger today and it felt foreign. Like I had to remember how. When did something that simple start requiring effort?",
    primaryEmotion: "sadness",
    granularLabel: "hollow",
    thematicTags: ["health", "identity"],
    intensity: 5,
    addedAt: 1743379200000,
  },
  {
    displayText:
      "My friend got engaged and I'm happy for her. I am. But underneath the happiness there's this quiet panic about being left behind. I hate that I can't just be happy without the other thing.",
    primaryEmotion: "anxiety",
    granularLabel: "comparison spiral",
    thematicTags: ["relationships", "self-worth"],
    intensity: 5,
    addedAt: 1744156800000,
  },
  {
    displayText:
      "I keep cleaning the apartment like if I make the outside orderly enough the inside will follow. It hasn't worked yet but I keep trying.",
    primaryEmotion: "anxiety",
    granularLabel: "control-seeking",
    thematicTags: ["health"],
    intensity: 4,
    addedAt: 1744070400000,
  },
  {
    displayText:
      "I told someone how I really felt and they changed the subject. That's the last time I try that for a while.",
    primaryEmotion: "loneliness",
    granularLabel: "rejected vulnerability",
    thematicTags: ["relationships", "belonging"],
    intensity: 7,
    addedAt: 1743984000000,
  },
  {
    displayText:
      "I spent the whole day doing things for other people and now it's 11pm and I haven't eaten. I don't even feel hungry. I feel erased.",
    primaryEmotion: "overwhelm",
    granularLabel: "self-neglect",
    thematicTags: ["health", "self-worth"],
    intensity: 6,
    addedAt: 1743897600000,
  },
  {
    displayText:
      "I'm scared that if I slow down I'll feel everything I've been outrunning. So I just keep going. Add more. Fill every gap. Don't stop moving.",
    primaryEmotion: "dread",
    granularLabel: "avoidance through busyness",
    thematicTags: ["health", "purpose"],
    intensity: 7,
    addedAt: 1743811200000,
  },
  {
    displayText:
      "I stood in the grocery store for ten minutes trying to decide between two kinds of bread and nearly had a meltdown. It's not about the bread. It's that even tiny decisions feel impossible right now.",
    primaryEmotion: "overwhelm",
    granularLabel: "decision paralysis",
    thematicTags: ["health"],
    intensity: 6,
    addedAt: 1743724800000,
  },
  {
    displayText:
      "I wrote a long message explaining everything I've been feeling and then deleted it. The draft folder is where my honesty goes to die.",
    primaryEmotion: "frustration",
    granularLabel: "silenced self-expression",
    thematicTags: ["relationships", "self-worth"],
    intensity: 6,
    addedAt: 1743638400000,
  },
  {
    displayText:
      "I watched a video of myself from a year ago and that person had light in their eyes. I don't know when I lost that. I didn't notice it leaving.",
    primaryEmotion: "sadness",
    granularLabel: "mourning a former self",
    thematicTags: ["identity", "loss"],
    intensity: 7,
    addedAt: 1743552000000,
  },
  {
    displayText:
      "The Sunday dread is already here and it's Saturday afternoon. Two days of freedom and I can't enjoy either one because Monday is already casting its shadow.",
    primaryEmotion: "dread",
    granularLabel: "anticipatory work anxiety",
    thematicTags: ["work"],
    intensity: 6,
    addedAt: 1743465600000,
  },
  {
    displayText:
      "I found an old journal from when I was hopeful about things. Reading it felt like getting a letter from a stranger who happened to have my handwriting.",
    primaryEmotion: "sadness",
    granularLabel: "nostalgia for former self",
    thematicTags: ["identity", "purpose"],
    intensity: 5,
    addedAt: 1743379200000,
  },
  {
    displayText:
      "I'm not lazy. I'm exhausted in a way that sleep doesn't fix. It's like my battery charges to 30% and that's all I get. Every day, 30%.",
    primaryEmotion: "overwhelm",
    granularLabel: "chronic depletion",
    thematicTags: ["health", "work"],
    intensity: 7,
    addedAt: 1744156800000,
  },
  {
    displayText:
      "I'm terrified of being seen and terrified of being invisible and I don't know how both of those things can be true at the same time but they are.",
    primaryEmotion: "confusion",
    granularLabel: "contradictory needs",
    thematicTags: ["identity", "belonging"],
    intensity: 6,
    addedAt: 1744070400000,
  },
  {
    displayText:
      "I helped someone today and it felt good. Genuinely good. Not performative. Just... warm. I forgot I could feel that.",
    primaryEmotion: "relief",
    granularLabel: "unexpected warmth",
    thematicTags: ["belonging"],
    intensity: 3,
    addedAt: 1743984000000,
  },
  {
    displayText:
      "I don't know how to grieve someone who's still alive. They're here but they're not the person I knew. And there's no funeral for that. No card. Just this quiet loss.",
    primaryEmotion: "grief",
    granularLabel: "ambiguous loss",
    thematicTags: ["family", "loss"],
    intensity: 8,
    addedAt: 1743897600000,
  },
  {
    displayText:
      "I've been meaning to call my brother for three weeks. I love him. I just don't have the energy to perform okay for an hour. So another week passes.",
    primaryEmotion: "sadness",
    granularLabel: "withdrawal from love",
    thematicTags: ["family", "health"],
    intensity: 5,
    addedAt: 1743811200000,
  },
  {
    displayText:
      "I keep thinking if I just work harder it'll click. If I just push through one more week. But the weeks keep passing and the click never comes.",
    primaryEmotion: "frustration",
    granularLabel: "diminishing returns",
    thematicTags: ["work", "purpose"],
    intensity: 6,
    addedAt: 1743724800000,
  },
  {
    displayText:
      "They asked me what I wanted for my birthday and I couldn't think of a single thing. Not in a content way. In a nothing-sounds-good way. In a what's-the-point way.",
    primaryEmotion: "numbness",
    granularLabel: "anhedonia",
    thematicTags: ["identity"],
    intensity: 6,
    addedAt: 1743638400000,
  },
  {
    displayText:
      "I'm fine until someone asks me how I am with actual sincerity. Then everything threatens to crack open. So I avoid the people who care the most.",
    primaryEmotion: "overwhelm",
    granularLabel: "fragile composure",
    thematicTags: ["relationships", "belonging"],
    intensity: 7,
    addedAt: 1743552000000,
  },
  {
    displayText:
      "I got through today. That's it. That's the whole achievement. Some days getting through is enough. I'm trying to let that be enough.",
    primaryEmotion: "relief",
    granularLabel: "quiet endurance",
    thematicTags: ["self-worth"],
    intensity: 4,
    addedAt: 1743465600000,
  },
  {
    displayText:
      "I keep replaying the fight in my head but in the replay I say all the things I was too scared to say. The imaginary version of me is so much braver.",
    primaryEmotion: "frustration",
    granularLabel: "powerless retrospect",
    thematicTags: ["relationships"],
    intensity: 5,
    addedAt: 1743379200000,
  },
  {
    displayText:
      "I'm so tired of being grateful. Everyone tells me how lucky I am and I know they're right but gratitude doesn't cancel out the heaviness. They can coexist and that confuses people.",
    primaryEmotion: "confusion",
    granularLabel: "guilty ambivalence",
    thematicTags: ["self-worth", "identity"],
    intensity: 6,
    addedAt: 1744156800000,
  },
  {
    displayText:
      "My therapist moved away and I can't bring myself to start over with someone new. The idea of explaining everything from scratch makes me want to give up on the whole thing.",
    primaryEmotion: "helplessness",
    granularLabel: "exhaustion of re-explaining",
    thematicTags: ["health"],
    intensity: 5,
    addedAt: 1744070400000,
  },
  {
    displayText:
      "I left the party early and sat in my car and breathed. Not because anything happened. Just because being around that many people pretending to have fun was exhausting me at a cellular level.",
    primaryEmotion: "overwhelm",
    granularLabel: "social depletion",
    thematicTags: ["belonging"],
    intensity: 5,
    addedAt: 1743984000000,
  },
  {
    displayText:
      "Money is the thing I think about first in the morning and last at night. Not because I want to. Because the numbers never add up and the fear never goes away.",
    primaryEmotion: "anxiety",
    granularLabel: "financial dread",
    thematicTags: ["finances"],
    intensity: 7,
    addedAt: 1743897600000,
  },
  {
    displayText:
      "I unfollowed everyone who makes me feel behind. My feed is quieter now but so is the voice that says I'm not enough. Small thing. Felt big.",
    primaryEmotion: "relief",
    granularLabel: "reclaiming space",
    thematicTags: ["self-worth", "identity"],
    intensity: 3,
    addedAt: 1743811200000,
  },
  {
    displayText:
      "I dreamed about the house I grew up in again. It was empty this time. I walked through every room looking for something I couldn't name. Woke up with wet eyes.",
    primaryEmotion: "grief",
    granularLabel: "childhood echo",
    thematicTags: ["family", "loss"],
    intensity: 6,
    addedAt: 1743724800000,
  },
  {
    displayText:
      "I don't even know how to explain it to anyone because they'll just say I'm overthinking. So I just keep it to myself and act like everything is fine.",
    primaryEmotion: "loneliness",
    granularLabel: "invisible to the people closest to me",
    thematicTags: ["belonging", "relationships"],
    intensity: 6,
    addedAt: 1743638400000,
  },
  {
    displayText:
      "I owe people money I don't have and every time my phone rings my stomach drops. I've started screening every call. Living in a constant state of bracing.",
    primaryEmotion: "anxiety",
    granularLabel: "financial shame spiral",
    thematicTags: ["finances", "shame"],
    intensity: 8,
    addedAt: 1743552000000,
  },
  {
    displayText:
      "I'm watching everyone around me couple up and settle down and I can't even figure out who I am alone. The timeline I thought I'd follow doesn't exist anymore.",
    primaryEmotion: "confusion",
    granularLabel: "lost timeline",
    thematicTags: ["identity", "relationships", "purpose"],
    intensity: 6,
    addedAt: 1743465600000,
  },
  {
    displayText:
      "The anger came out of nowhere today. One small thing — a spilled cup — and suddenly I was shaking with rage that had nothing to do with coffee. There's something underneath I haven't looked at.",
    primaryEmotion: "anger",
    granularLabel: "displaced rage",
    thematicTags: ["health", "self-worth"],
    intensity: 7,
    addedAt: 1743379200000,
  },
  {
    displayText:
      "Somebody at work got credit for my idea today. I didn't say anything. I never say anything. And then I wonder why I feel invisible.",
    primaryEmotion: "frustration",
    granularLabel: "violated and unseen",
    thematicTags: ["work", "self-worth"],
    intensity: 6,
    addedAt: 1744156800000,
  },
  {
    displayText:
      "I thought about death today. Not in a scary way. More like... wondering what it would feel like to just stop being responsible for everything. To set it all down. I don't want to die. I just want to rest in a way that actually feels like rest.",
    primaryEmotion: "overwhelm",
    granularLabel: "existential fatigue",
    thematicTags: ["health", "purpose"],
    intensity: 9,
    addedAt: 1744070400000,
  },
  {
    displayText:
      "I realized today that I've been apologizing for existing. Sorry for the email. Sorry for asking. Sorry for taking up space. When did I start treating myself like an inconvenience?",
    primaryEmotion: "sadness",
    granularLabel: "chronic self-diminishment",
    thematicTags: ["self-worth", "identity"],
    intensity: 6,
    addedAt: 1743984000000,
  },
  {
    displayText:
      "The house is quiet and I should be grateful for the peace but the quiet is where the loudest thoughts live. I turn on the TV just for noise. Just to not be alone with my own head.",
    primaryEmotion: "loneliness",
    granularLabel: "afraid of own thoughts",
    thematicTags: ["health"],
    intensity: 6,
    addedAt: 1743897600000,
  },
  {
    displayText:
      "I'm not the same person I was before it happened. And people keep waiting for the old me to come back. I don't know how to tell them she's not coming.",
    primaryEmotion: "grief",
    granularLabel: "identity after loss",
    thematicTags: ["loss", "identity", "relationships"],
    intensity: 8,
    addedAt: 1743811200000,
  },
  {
    displayText:
      "I told myself I'd deal with it tomorrow and tomorrow has been going on for about three months now.",
    primaryEmotion: "frustration",
    granularLabel: "chronic avoidance",
    thematicTags: ["purpose", "self-worth"],
    intensity: 4,
    addedAt: 1743724800000,
  },
  {
    displayText:
      "I cooked a real meal for myself tonight instead of cereal. Set the table and everything. Felt stupid at first. Then it felt like the kindest thing anyone's done for me in weeks. And it was me.",
    primaryEmotion: "relief",
    granularLabel: "self-kindness",
    thematicTags: ["self-worth", "health"],
    intensity: 3,
    addedAt: 1743638400000,
  },
  {
    displayText:
      "I keep waiting for someone to notice I'm not okay. But I'm so good at seeming okay that nobody ever does. And I can't decide if that's their failure or mine.",
    primaryEmotion: "sadness",
    granularLabel: "invisible suffering",
    thematicTags: ["belonging", "self-worth"],
    intensity: 7,
    addedAt: 1743552000000,
  },
  {
    displayText:
      "Something shifted today. I don't know what. The weight is still there but it moved slightly and now I can breathe a little deeper. I'll take it.",
    primaryEmotion: "hope",
    granularLabel: "quiet shift",
    thematicTags: ["health"],
    intensity: 3,
    addedAt: 1743465600000,
  },
  {
    displayText:
      "I spent an hour getting ready just to cancel. Couldn't do it. Texted some excuse. The relief lasted about ten seconds before the shame moved in.",
    primaryEmotion: "shame",
    granularLabel: "avoidance guilt",
    thematicTags: ["belonging", "health"],
    intensity: 6,
    addedAt: 1743379200000,
  },
];

// From deep-research-report.md — 25 entries that pass the specificity bar.
const BATCH_C = [
  {
    displayText:
      "Every time I pass by our old coffee shop, I remember the last time we laughed there. Now the air feels hollow and I choke up.",
    primaryEmotion: "sadness",
    granularLabel: "memory-triggered grief",
    thematicTags: ["loss", "relationships"],
    intensity: 7,
    addedAt: 1743379200000,
  },
  {
    displayText:
      "My hands shake when I open my bank app. I keep thinking any moment I'll have $0, and I panic over whether I'm just one paycheck away from disaster.",
    primaryEmotion: "anxiety",
    granularLabel: "financial anxiety",
    thematicTags: ["finances", "work"],
    intensity: 7,
    addedAt: 1743465600000,
  },
  {
    displayText:
      "I was walking home tonight and realized I took a deep breath without thinking. It's like my body remembered to relax on its own for the first time.",
    primaryEmotion: "relief",
    granularLabel: "unexpected calm",
    thematicTags: ["health", "self-worth"],
    intensity: 4,
    addedAt: 1743465600000,
  },
  {
    displayText:
      "I keep checking my phone, hoping you'll call me back. It's pathetic, I know, but I feel like a little kid waiting for a parent who never comes.",
    primaryEmotion: "sadness",
    granularLabel: "hopeless waiting",
    thematicTags: ["relationships", "family"],
    intensity: 7,
    addedAt: 1743465600000,
  },
  {
    displayText:
      "Everyone back home thinks I'm living the dream because I never complain. I'm terrified of saying I'm struggling, because I know they'd lose hope in me.",
    primaryEmotion: "loneliness",
    granularLabel: "performing strength for others",
    thematicTags: ["family", "belonging", "identity"],
    intensity: 7,
    addedAt: 1743465600000,
  },
  {
    displayText:
      "My chest aches when I walk past the empty playground where we used to be. I wish I had the courage to tell you how much I miss you, but I'm too afraid of the silence that would follow.",
    primaryEmotion: "sadness",
    granularLabel: "yearning sadness",
    thematicTags: ["loss", "relationships"],
    intensity: 8,
    addedAt: 1743552000000,
  },
  {
    displayText:
      "I have your sweater wrapped around me, trying to feel close. The silence you left behind is heavy and my throat tightens when I think of it.",
    primaryEmotion: "grief",
    granularLabel: "physical grief",
    thematicTags: ["loss", "relationships"],
    intensity: 7,
    addedAt: 1743552000000,
  },
  {
    displayText:
      "Even relaxing feels exhausting because I worry I'll fall behind everything. It's like my brain won't shut up until I'm four tasks ahead of where I am.",
    primaryEmotion: "overwhelm",
    granularLabel: "unable to relax",
    thematicTags: ["work", "self-worth"],
    intensity: 7,
    addedAt: 1743552000000,
  },
  {
    displayText:
      "I wrote a letter to you today, even though you're not here. It's my way of talking, but then I remember it's only me hearing the words.",
    primaryEmotion: "grief",
    granularLabel: "writing goodbye",
    thematicTags: ["loss", "relationships"],
    intensity: 7,
    addedAt: 1743552000000,
  },
  {
    displayText:
      "After weeks of chaos, I finally let myself lie on the couch and do nothing. And you know what? Just existing in that moment felt like a gift.",
    primaryEmotion: "calmness",
    granularLabel: "grateful rest",
    thematicTags: ["health", "purpose"],
    intensity: 3,
    addedAt: 1743724800000,
  },
  {
    displayText:
      "My blood boils every time I remember how they used my secret against me. I want justice, but I have to stay calm for now.",
    primaryEmotion: "frustration",
    granularLabel: "resentment",
    thematicTags: ["relationships", "self-worth"],
    intensity: 8,
    addedAt: 1743811200000,
  },
  {
    displayText:
      "I have your message saved and I read it when I miss you. The smile fades quickly and I'm reminded that you're gone. My throat tightens again each time.",
    primaryEmotion: "grief",
    granularLabel: "persistent longing",
    thematicTags: ["loss", "purpose"],
    intensity: 7,
    addedAt: 1743811200000,
  },
  {
    displayText:
      "I bought a coffee today and remembered how you loved the exact same one. A wave of sadness hit me because I realized you won't be sharing it with me anymore.",
    primaryEmotion: "grief",
    granularLabel: "everyday grief",
    thematicTags: ["loss", "family"],
    intensity: 8,
    addedAt: 1743897600000,
  },
  {
    displayText:
      "After talking to my therapist, I still feel like I'm drowning in things I said wrong to someone. My mind keeps finding new things I did poorly, new ways I probably hurt them. It doesn't matter how many times I've apologized — the noise doesn't stop.",
    primaryEmotion: "shame",
    granularLabel: "relationship guilt",
    thematicTags: ["relationships", "self-worth"],
    intensity: 7,
    addedAt: 1743897600000,
  },
  {
    displayText:
      "I posted on Reddit expecting nothing to happen. I got a bunch of comments. Then I realized: People do care. I never expected it.",
    primaryEmotion: "hope",
    granularLabel: "unexpected kindness",
    thematicTags: ["relationships", "belonging"],
    intensity: 4,
    addedAt: 1743984000000,
  },
  {
    displayText:
      "It feels like something awful is on its way, even though I can't say what it is. Every time I feel peace, a whisper in me warns me it won't last.",
    primaryEmotion: "dread",
    granularLabel: "impending doom",
    thematicTags: ["health", "change"],
    intensity: 9,
    addedAt: 1743984000000,
  },
  {
    displayText:
      "I got promoted last week and everyone congratulates me, but inside I feel like a fraud. I have to keep proving I belong, and it's exhausting.",
    primaryEmotion: "anxiety",
    granularLabel: "self-doubt",
    thematicTags: ["work", "identity"],
    intensity: 7,
    addedAt: 1743984000000,
  },
  {
    displayText:
      "I'm supposed to be the example. My younger siblings look up to me, so how can I tell them I'm lost? I have to stay strong even when I feel like breaking.",
    primaryEmotion: "loneliness",
    granularLabel: "role model pressure",
    thematicTags: ["family", "identity", "self-worth"],
    intensity: 8,
    addedAt: 1743984000000,
  },
  {
    displayText:
      "I was sitting alone at lunch, about to stew in silence, when I randomly ran into an old teammate who asked if I was okay. I was sure they wouldn't care, but they did.",
    primaryEmotion: "hope",
    granularLabel: "unexpected support",
    thematicTags: ["relationships", "belonging"],
    intensity: 5,
    addedAt: 1744070400000,
  },
  {
    displayText:
      "I keep typing out texts to old friends, then deleting them because I don't want to bother anyone with my feelings. So I sit here scrolling on my own.",
    primaryEmotion: "loneliness",
    granularLabel: "fear of burdening others",
    thematicTags: ["relationships", "self-worth"],
    intensity: 7,
    addedAt: 1744070400000,
  },
  {
    displayText:
      "One minute I feel okay, then something small flips a switch and I'm spiraling again. It's like I don't even know which version of me I'll meet today.",
    primaryEmotion: "confusion",
    granularLabel: "mood swings",
    thematicTags: ["self-worth", "health"],
    intensity: 6,
    addedAt: 1743811200000,
  },
  {
    displayText:
      "People tell me I'm 'doing fine', but inside I break a little every time I hear that. I'm still learning how to breathe through this emptiness.",
    primaryEmotion: "grief",
    granularLabel: "forced optimism",
    thematicTags: ["loss", "self-worth"],
    intensity: 6,
    addedAt: 1744070400000,
  },
  {
    displayText:
      "I can't cry, can't scream, can't really feel anything but a fog. Even my favorite song today just made me feel blank.",
    primaryEmotion: "numbness",
    granularLabel: "flat affect",
    thematicTags: ["health", "identity"],
    intensity: 7,
    addedAt: 1743465600000,
  },
  {
    displayText:
      "I keep thinking I'll wake up and this nightmare will be over. But every morning I open my eyes and it's the same world without you.",
    primaryEmotion: "grief",
    granularLabel: "persistent longing",
    thematicTags: ["loss", "purpose"],
    intensity: 7,
    addedAt: 1743897600000,
  },
  {
    displayText:
      "I realized I didn't spend my entire day worrying for once. I was actually present and it's a tiny victory I didn't even notice at first.",
    primaryEmotion: "happiness",
    granularLabel: "mindfulness moment",
    thematicTags: ["health", "purpose"],
    intensity: 4,
    addedAt: 1743811200000,
  },
];

/**
 * Seed the full beta launch pool (125 curated reflections).
 *
 * Run once from the Convex dashboard or CLI:
 *   bunx convex run seed:seedReflections
 *
 * Safe to re-run — each batch upserts by displayText so repeated runs
 * and partial-failure recoveries never produce duplicates.
 */
export const seedReflections = internalAction({
  args: {},
  handler: async (ctx) => {
    // Run all three batches every time; internal.reflections.seed skips
    // any reflection whose displayText already exists in the table.
    await ctx.runMutation(internal.reflections.seed, {
      reflections: [...BATCH_A],
    });
    await ctx.runMutation(internal.reflections.seed, {
      reflections: [...BATCH_B],
    });
    await ctx.runMutation(internal.reflections.seed, {
      reflections: [...BATCH_C],
    });

    const total = BATCH_A.length + BATCH_B.length + BATCH_C.length;
    console.log(`[seed] Seed complete — pool contains up to ${total} reflections.`);
    return { seeded: true, count: total };
  },
});
