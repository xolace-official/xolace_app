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

// ---------------------------------------------------------------------------
// Exercise seed data — 6 exercises for beta.
// Run: bunx convex run seed:seedExercises
// Safe to re-run — upserts by title.
// ---------------------------------------------------------------------------

const EXERCISES = [
  {
    title: "let_it_land",
    type: "grounding" as const,
    targetEmotions: ["sadness", "confusion", "relief", "loneliness"],
    intensityRange: { min: 2, max: 7 },
    estimatedMinutes: 1.5,
    steps: [
      {
        order: 1,
        type: "text" as const,
        content: "You named it. Let's just sit with that for a moment.",
        durationSeconds: 4,
      },
      {
        order: 2,
        type: "text" as const,
        content: "{{mirror_line}}",
        defaultContent: "What you named is here with you.",
        durationSeconds: 3,
        slotKeys: ["mirror_line"],
      },
      {
        order: 3,
        type: "breath" as const,
        content: "Breathe with it.",
        breathPattern: "physiological_sigh" as const,
        breathCycles: 2,
        hapticIntensity: "light" as const,
      },
      {
        order: 4,
        type: "text" as const,
        content: "Notice where in your body '{{user_phrase}}' lives right now. Not to fix it. Just so it knows you heard it.",
        defaultContent: "Notice where this lives in your body right now. Not to fix it. Just so it knows you heard it.",
        durationSeconds: 6,
        slotKeys: ["user_phrase"],
      },
      {
        order: 5,
        type: "text" as const,
        content: "You don't have to do anything with it.",
        durationSeconds: 6,
      },
    ],
  },
  {
    title: "find_your_edges",
    type: "body_scan" as const,
    targetEmotions: ["numbness", "confusion"],
    intensityRange: { min: 1, max: 5 },
    estimatedMinutes: 2,
    steps: [
      {
        order: 1,
        type: "text" as const,
        content: "Before anything else, let's find where you are.",
        durationSeconds: 5,
      },
      {
        order: 2,
        type: "text" as const,
        content: "Look around. Don't move your head much — just your eyes.",
        durationSeconds: 4,
      },
      {
        order: 3,
        type: "text" as const,
        content: "Find three things. A corner. A shadow. A color. Anything.",
        durationSeconds: 6,
      },
      {
        order: 4,
        type: "text" as const,
        content: "Now feel your feet. Whatever they're touching.",
        durationSeconds: 5,
      },
      {
        order: 5,
        type: "text" as const,
        content: "Your back. Against what's behind it.",
        durationSeconds: 5,
      },
      {
        order: 6,
        type: "text" as const,
        content: "Hands. What temperature are they.",
        durationSeconds: 6,
      },
      {
        order: 7,
        type: "breath" as const,
        content: "One slow exhale.",
        breathPattern: "slow_exhale" as const,
        breathCycles: 1,
      },
      {
        order: 8,
        type: "text" as const,
        content: "You're here. That's enough.",
        durationSeconds: 5,
      },
    ],
  },
  {
    title: "make_room",
    type: "cognitive_reframe" as const,
    targetEmotions: ["overwhelm", "helplessness", "dread", "anxiety"],
    intensityRange: { min: 4, max: 9 },
    estimatedMinutes: 1.5,
    steps: [
      {
        order: 1,
        type: "text" as const,
        content: "{{mirror_line}}",
        defaultContent: "You're carrying something heavy.",
        durationSeconds: 4,
        slotKeys: ["mirror_line"],
      },
      {
        order: 2,
        type: "text" as const,
        content: "What if you didn't have to make this smaller right now?",
        durationSeconds: 4,
      },
      {
        order: 3,
        type: "breath" as const,
        content: "Breathing in; imagine giving it room.\nBreathing out; rest beside it.",
        breathPattern: "extended_exhale" as const,
        breathCycles: 3,
      },
      {
        order: 4,
        type: "text" as const,
        content: "It doesn't have to leave to stop hurting.",
        durationSeconds: 6,
        syncToBreath: true,
        breathPattern: "slow_exhale" as const,
        breathCycles: 1,
      },
      {
        order: 5,
        type: "text" as const,
        content: "You stayed.",
        durationSeconds: 5,
      },
    ],
  },
  {
    title: "speak_to_it",
    type: "journaling_prompt" as const,
    targetEmotions: ["anger", "frustration"],
    intensityRange: { min: 3, max: 8 },
    estimatedMinutes: 2.5,
    steps: [
      {
        order: 1,
        type: "text" as const,
        content: "Something in you is {{user_emotion}}.",
        defaultContent: "Something in you is stirred up.",
        durationSeconds: 5,
        slotKeys: ["user_emotion"],
      },
      {
        order: 2,
        type: "text" as const,
        content: "Not all of you. Something.",
        durationSeconds: 4,
      },
      {
        order: 3,
        type: "text" as const,
        content: "If it could speak, what does it want you to know?",
        durationSeconds: 6,
      },
      {
        order: 4,
        type: "private_prompt" as const,
        content: "This stays on your phone. No one else will see it.",
        promptPlaceholder: "What does it want you to know?",
        promptMaxSeconds: 60,
      },
      {
        order: 5,
        type: "text" as const,
        content: "You heard it. That matters.",
        durationSeconds: 4,
      },
      {
        order: 6,
        type: "text" as const,
        content: "You stayed.",
        durationSeconds: 5,
      },
    ],
  },
  {
    title: "soften_toward_it",
    type: "self_compassion" as const,
    targetEmotions: ["shame"],
    intensityRange: { min: 3, max: 8 },
    estimatedMinutes: 1.5,
    steps: [
      {
        order: 1,
        type: "text" as const,
        content: "You said: '{{user_phrase}}'.",
        defaultContent: "You named something hard.",
        durationSeconds: 4,
        slotKeys: ["user_phrase"],
      },
      {
        order: 2,
        type: "text" as const,
        content: "Right now, in this moment, you're not the only one feeling something like this.",
        durationSeconds: 5,
      },
      {
        order: 3,
        type: "text" as const,
        content: "Place a hand somewhere on yourself. Chest, arm, face, wherever feels natural.",
        durationSeconds: 5,
      },
      {
        order: 4,
        type: "haptic" as const,
        content: "",
        defaultContent: "Feel your hand resting there.",
        hapticIntensity: "medium" as const,
        durationSeconds: 4,
      },
      {
        order: 5,
        type: "text" as const,
        content: "If you could offer yourself one kind sentence, what would it be?",
        durationSeconds: 6,
      },
      {
        order: 6,
        type: "text" as const,
        content: "You don't have to say it out loud. Just let yourself hear it.",
        durationSeconds: 6,
        syncToBreath: true,
        breathPattern: "slow_exhale" as const,
        breathCycles: 1,
      },
      {
        order: 7,
        type: "text" as const,
        content: "That was kind. You stayed.",
        durationSeconds: 5,
      },
    ],
  },
  {
    title: "reset",
    type: "breathing" as const,
    targetEmotions: ["anxiety", "overwhelm", "dread"],
    intensityRange: { min: 5, max: 10 },
    estimatedMinutes: 1,
    steps: [
      {
        order: 1,
        type: "text" as const,
        content: "Three breaths. That's it.",
        durationSeconds: 3,
      },
      {
        order: 2,
        type: "breath" as const,
        content: "",
        breathPattern: "physiological_sigh" as const,
        breathCycles: 3,
        hapticIntensity: "light" as const,
      },
      {
        order: 3,
        type: "text" as const,
        content: "That was enough.",
        durationSeconds: 4,
      },
      {
        order: 4,
        type: "text" as const,
        content: "Okay.",
        durationSeconds: 4,
      },
    ],
  },
];

/**
 * Seed the 6 beta exercises into the library.
 *
 * Run: bunx convex run seed:seedExercises
 * Safe to re-run — upserts by title.
 */
export const seedExercises = internalAction({
  args: {},
  handler: async (ctx) => {
    await ctx.runMutation(internal.exercises.seed, { exercises: EXERCISES });
    console.log(`[seed] ${EXERCISES.length} exercises seeded.`);
    return { seeded: true, count: EXERCISES.length };
  },
});

// ---------------------------------------------------------------------------
// Quotes seed — 130+ curated quotes across 18 emotional themes.
//
// Run: bunx convex run seed:seedQuotes
// Safe to re-run — quotes:seed skips if library is not empty.
// Pass force=true to override: bunx convex run seed:seedQuotes '{"force":true}'
// ---------------------------------------------------------------------------

const QUOTES: {
  text: string;
  themes: string[];
  source?: string;
  language: string;
}[] = [
  // ── Assist 1: resilience · self-compassion · relationships · grief-and-loss · change · anxiety ──
  {
    text: "You may encounter many defeats, but you must not be defeated. In fact, it may be necessary to encounter the defeats, so you can know who you are.",
    themes: ["resilience"],
    source: "Maya Angelou",
    language: "en",
  },
  {
    text: "There is a crack in everything. That's how the light gets in.",
    themes: ["resilience", "change"],
    source: "Leonard Cohen",
    language: "en",
  },
  {
    text: "Talk to yourself like you would to someone you love.",
    themes: ["self-compassion"],
    source: "Brené Brown",
    language: "en",
  },
  {
    text: "What is to give light must endure burning.",
    themes: ["resilience"],
    source: "Viktor E. Frankl",
    language: "en",
  },
  {
    text: "The wound is the place where the Light enters you.",
    themes: ["grief-and-loss", "resilience"],
    source: "Rumi",
    language: "en",
  },
  {
    text: "Do not feel lonely, the entire universe is inside you.",
    themes: ["self-compassion"],
    source: "Rumi",
    language: "en",
  },
  {
    text: "Anxiety is the dizziness of freedom.",
    themes: ["anxiety"],
    source: "Søren Kierkegaard",
    language: "en",
  },
  {
    text: "Grief is the price we pay for love.",
    themes: ["grief-and-loss", "relationships"],
    source: "Queen Elizabeth II",
    language: "en",
  },
  {
    text: "Love after love, the person you will greet again is yourself.",
    themes: ["self-compassion", "change"],
    source: "Derek Walcott",
    language: "en",
  },
  {
    text: "The only way to make sense out of change is to plunge into it, move with it, and join the dance.",
    themes: ["change"],
    source: "Alan Watts",
    language: "en",
  },
  {
    text: "We are healed from suffering only by experiencing it to the full.",
    themes: ["grief-and-loss"],
    source: "Marcel Proust",
    language: "en",
  },
  {
    text: "You do not have to be good. You only have to let the soft animal of your body love what it loves.",
    themes: ["self-compassion"],
    source: "Mary Oliver",
    language: "en",
  },
  {
    text: "No feeling is final.",
    themes: ["resilience", "anxiety"],
    source: "Rainer Maria Rilke",
    language: "en",
  },
  {
    text: "The meeting of two personalities is like the contact of two chemical substances: if there is any reaction, both are transformed.",
    themes: ["relationships", "change"],
    source: "Carl Jung",
    language: "en",
  },
  {
    text: "To love at all is to be vulnerable.",
    themes: ["relationships"],
    source: "C. S. Lewis",
    language: "en",
  },
  {
    text: "Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.",
    themes: ["anxiety", "self-compassion"],
    source: "Thich Nhat Hanh",
    language: "en",
  },
  {
    text: "Life is a balance of holding on and letting go.",
    themes: ["change", "grief-and-loss"],
    source: "Rumi",
    language: "en",
  },
  {
    text: "Out of suffering have emerged the strongest souls; the most massive characters are seared with scars.",
    themes: ["resilience"],
    source: "Khalil Gibran",
    language: "en",
  },
  {
    text: "Sometimes the bravest and most important thing you can do is just show up.",
    themes: ["resilience"],
    source: "Brené Brown",
    language: "en",
  },
  {
    text: "The best way out is always through.",
    themes: ["grief-and-loss", "resilience"],
    source: "Robert Frost",
    language: "en",
  },
  {
    text: "You yourself, as much as anybody in the entire universe, deserve your love and affection.",
    themes: ["self-compassion"],
    source: "Buddha",
    language: "en",
  },
  {
    text: "Friendship marks a life even more deeply than love. Love risks degenerating into obsession, friendship is never anything but sharing.",
    themes: ["relationships"],
    source: "Elie Wiesel",
    language: "en",
  },
  {
    text: "Nothing is so painful to the human mind as a great and sudden change.",
    themes: ["change", "anxiety"],
    source: "Mary Shelley",
    language: "en",
  },
  {
    text: "Grief can be a burden, but also an anchor. You get used to the weight, how it holds you in place.",
    themes: ["grief-and-loss"],
    source: "Sarah Dessen",
    language: "en",
  },
  {
    text: "Do not anticipate trouble, or worry about what may never happen. Keep in the sunlight.",
    themes: ["anxiety"],
    source: "Benjamin Franklin",
    language: "en",
  },
  {
    text: "When we are no longer able to change a situation, we are challenged to change ourselves.",
    themes: ["change", "resilience"],
    source: "Viktor E. Frankl",
    language: "en",
  },
  {
    text: "The emotion that can break your heart is sometimes the very one that heals it.",
    themes: ["relationships", "grief-and-loss"],
    source: "Nicholas Sparks",
    language: "en",
  },
  {
    text: "Be patient toward all that is unsolved in your heart and try to love the questions themselves.",
    themes: ["anxiety", "self-compassion"],
    source: "Rainer Maria Rilke",
    language: "en",
  },
  {
    text: "What breaks us apart also has the power to put us back together again.",
    themes: ["relationships", "resilience"],
    source: "bell hooks",
    language: "en",
  },
  {
    text: "Tears are words that need to be written.",
    themes: ["grief-and-loss"],
    source: "Paulo Coelho",
    language: "en",
  },

  // ── Assist 2: identity · loneliness · healing · acceptance · purpose · self-worth ──
  {
    text: "I took a deep breath and listened to the old brag of my heart: I am, I am, I am.",
    themes: ["identity", "self-worth"],
    source: "Sylvia Plath",
    language: "en",
  },
  {
    text: "To be nobody but yourself in a world which is doing its best, night and day, to make you everybody else means to fight the hardest battle which any human being can fight; and never stop fighting.",
    themes: ["identity"],
    source: "E.E. Cummings",
    language: "en",
  },
  {
    text: "I am large, I contain multitudes.",
    themes: ["identity"],
    source: "Walt Whitman",
    language: "en",
  },
  {
    text: "Not until we are lost do we begin to find ourselves.",
    themes: ["identity"],
    source: "Henry David Thoreau",
    language: "en",
  },
  {
    text: "Knowing yourself is the beginning of all wisdom.",
    themes: ["identity", "purpose"],
    source: "Aristotle",
    language: "en",
  },
  {
    text: "You are not a drop in the ocean. You are the entire ocean in a drop.",
    themes: ["identity", "self-worth"],
    source: "Rumi",
    language: "en",
  },
  {
    text: "We know what we are, but know not what we may be.",
    themes: ["identity"],
    source: "William Shakespeare",
    language: "en",
  },
  {
    text: "Perhaps all the dragons in our lives are princesses who are only waiting to see us act, just once, with beauty and courage.",
    themes: ["identity", "healing"],
    source: "Rainer Maria Rilke",
    language: "en",
  },
  {
    text: "The unexamined life is not worth living.",
    themes: ["identity", "purpose"],
    source: "Socrates",
    language: "en",
  },
  {
    text: "What I am is good enough if I would only be it openly.",
    themes: ["identity", "self-worth"],
    source: "Carl Rogers",
    language: "en",
  },
  {
    text: "Loneliness is the poverty of self; solitude is the richness of self.",
    themes: ["loneliness"],
    source: "May Sarton",
    language: "en",
  },
  {
    text: "Language has created the word loneliness to express the pain of being alone, and it has created the word solitude to express the glory of being alone.",
    themes: ["loneliness"],
    source: "Paul Tillich",
    language: "en",
  },
  {
    text: "All great and precious things are lonely.",
    themes: ["loneliness"],
    source: "John Steinbeck",
    language: "en",
  },
  {
    text: "I exist as I am, that is enough.",
    themes: ["loneliness", "self-worth"],
    source: "Walt Whitman",
    language: "en",
  },
  {
    text: "The worst loneliness is not to be comfortable with yourself.",
    themes: ["loneliness", "self-worth"],
    source: "Mark Twain",
    language: "en",
  },
  {
    text: "Inside myself is a place where I live all alone and that is where you renew your springs that never dry up.",
    themes: ["loneliness"],
    source: "Pearl S. Buck",
    language: "en",
  },
  {
    text: "What a lovely surprise to finally discover how unlonely being alone can be.",
    themes: ["loneliness", "acceptance"],
    source: "Ellen Burstyn",
    language: "en",
  },
  {
    text: "The soul that sees beauty may sometimes walk alone.",
    themes: ["loneliness"],
    source: "Johann Wolfgang von Goethe",
    language: "en",
  },
  {
    text: "In solitude the mind gains strength and learns to lean upon itself.",
    themes: ["loneliness"],
    source: "Laurence Sterne",
    language: "en",
  },
  {
    text: "There is a loneliness that can be rocked. Arms crossed, knees drawn up, holding, holding on.",
    themes: ["loneliness"],
    source: "Toni Morrison",
    language: "en",
  },
  {
    text: "Give sorrow words; the grief that does not speak knits up the o'erwrought heart and bids it break.",
    themes: ["healing"],
    source: "William Shakespeare",
    language: "en",
  },
  {
    text: "Although the world is full of suffering, it is also full of the overcoming of it.",
    themes: ["healing", "acceptance"],
    source: "Helen Keller",
    language: "en",
  },
  {
    text: "One does not become enlightened by imagining figures of light, but by making the darkness conscious.",
    themes: ["healing"],
    source: "Carl Jung",
    language: "en",
  },
  {
    text: "Sometimes the most important thing in a whole day is the rest we take between two deep breaths.",
    themes: ["healing"],
    source: "Etty Hillesum",
    language: "en",
  },
  {
    text: "In three words I can sum up everything I've learned about life: it goes on.",
    themes: ["healing", "acceptance"],
    source: "Robert Frost",
    language: "en",
  },
  {
    text: "We cannot change anything unless we accept it.",
    themes: ["acceptance"],
    source: "Carl Jung",
    language: "en",
  },
  {
    text: "The curious paradox is that when I accept myself just as I am, then I can change.",
    themes: ["acceptance", "self-worth"],
    source: "Carl Rogers",
    language: "en",
  },
  {
    text: "Not everything that is faced can be changed, but nothing can be changed until it is faced.",
    themes: ["acceptance"],
    source: "James Baldwin",
    language: "en",
  },
  {
    text: "You must give up the life you planned in order to have the life that is waiting for you.",
    themes: ["acceptance"],
    source: "Joseph Campbell",
    language: "en",
  },
  {
    text: "Accept the things to which fate binds you, and love the people with whom fate brings you together, and do so with all your heart.",
    themes: ["acceptance"],
    source: "Marcus Aurelius",
    language: "en",
  },
  {
    text: "You can't stop the waves, but you can learn to surf.",
    themes: ["acceptance"],
    source: "Jon Kabat-Zinn",
    language: "en",
  },
  {
    text: "Be yourself; everyone else is already taken.",
    themes: ["acceptance", "identity"],
    source: "Oscar Wilde",
    language: "en",
  },
  {
    text: "Life can only be understood backwards; but it must be lived forwards.",
    themes: ["acceptance"],
    source: "Søren Kierkegaard",
    language: "en",
  },
  {
    text: "He who has a why to live for can bear almost any how.",
    themes: ["purpose"],
    source: "Friedrich Nietzsche",
    language: "en",
  },
  {
    text: "The purpose of life is not to be happy. It is to be useful, to be honorable, to be compassionate, to have it make some difference that you have lived and lived well.",
    themes: ["purpose"],
    source: "Ralph Waldo Emerson",
    language: "en",
  },
  {
    text: "Many people die with their music still in them. Too often it is because they are always getting ready to live. Before they know it, time runs out.",
    themes: ["purpose"],
    source: "Oliver Wendell Holmes Sr.",
    language: "en",
  },
  {
    text: "What man actually needs is not a tensionless state but rather the striving and struggling for a worthwhile goal, a freely chosen task.",
    themes: ["purpose"],
    source: "Viktor Frankl",
    language: "en",
  },
  {
    text: "Don't ask what the world needs. Ask what makes you come alive, and go do it. Because what the world needs is people who have come alive.",
    themes: ["purpose"],
    source: "Howard Thurman",
    language: "en",
  },
  {
    text: "It is not enough to be busy. So are the ants. The question is: What are we busy about?",
    themes: ["purpose"],
    source: "Henry David Thoreau",
    language: "en",
  },
  {
    text: "Tell me, what is it you plan to do with your one wild and precious life?",
    themes: ["purpose"],
    source: "Mary Oliver",
    language: "en",
  },
  {
    text: "Efforts and courage are not enough without purpose and direction.",
    themes: ["purpose"],
    source: "John F. Kennedy",
    language: "en",
  },
  {
    text: "The place God calls you to is the place where your deep gladness and the world's deep hunger meet.",
    themes: ["purpose"],
    source: "Frederick Buechner",
    language: "en",
  },
  {
    text: "No one can make you feel inferior without your consent.",
    themes: ["self-worth"],
    source: "Eleanor Roosevelt",
    language: "en",
  },
  {
    text: "Owning our story and loving ourselves through that process is the bravest thing that we will ever do.",
    themes: ["self-worth"],
    source: "Brené Brown",
    language: "en",
  },
  {
    text: "You alone are enough. You have nothing to prove to anybody.",
    themes: ["self-worth"],
    source: "Maya Angelou",
    language: "en",
  },
  {
    text: "If only you could sense how important you are to the lives of those you meet; how important you can be to people you may never even dream of.",
    themes: ["self-worth"],
    source: "Fred Rogers",
    language: "en",
  },

  // ── Assist 3: burnout · hope · growth · fear · motivation · inspiration ──
  {
    text: "I have found that if you love life, life will love you back.",
    themes: ["hope", "inspiration"],
    source: "Arthur Rubinstein",
    language: "en",
  },
  {
    text: "The only way to deal with an unfree world is to become so absolutely free that your very existence is an act of rebellion.",
    themes: ["motivation", "inspiration"],
    source: "Albert Camus",
    language: "en",
  },
  {
    text: "I will not rescue you. For you are not powerless.",
    themes: ["motivation"],
    source: "Audre Lorde",
    language: "en",
  },
  {
    text: "It is worth being forcefully reminded that the world is larger than our anxieties about it.",
    themes: ["fear"],
    source: "Alain de Botton",
    language: "en",
  },
  {
    text: "May your choices reflect your hopes, not your fears.",
    themes: ["hope", "fear"],
    source: "Nelson Mandela",
    language: "en",
  },
  {
    text: "I am not afraid of storms, for I am learning how to sail my ship.",
    themes: ["fear", "growth"],
    source: "Louisa May Alcott",
    language: "en",
  },
  {
    text: "The oak fought the wind and was broken, the willow bent when it must and survived.",
    themes: ["burnout", "growth"],
    source: "Robert Jordan",
    language: "en",
  },
  {
    text: "There is a stubbornness about me that never can bear to be frightened at the will of others. My courage always rises at every attempt to intimidate me.",
    themes: ["fear", "motivation"],
    source: "Jane Austen",
    language: "en",
  },
  {
    text: "We are all in the gutter, but some of us are looking at the stars.",
    themes: ["hope", "inspiration"],
    source: "Oscar Wilde",
    language: "en",
  },
  {
    text: "You must rest. A field that has rested gives a bountiful crop.",
    themes: ["burnout"],
    source: "Ovid",
    language: "en",
  },
  {
    text: "It is during our darkest moments that we must focus to see the light.",
    themes: ["hope"],
    source: "Aristotle",
    language: "en",
  },
  {
    text: "Do not let your grand ambitions stand in the way of small, meaningful steps.",
    themes: ["motivation", "growth"],
    source: "Thomas Carlyle",
    language: "en",
  },
  {
    text: "The completely clear individual is a myth. We are all messy, and that is where the growth happens.",
    themes: ["growth"],
    source: "Carl Rogers",
    language: "en",
  },
  {
    text: "There are years that ask questions and years that answer.",
    themes: ["growth"],
    source: "Zora Neale Hurston",
    language: "en",
  },
  {
    text: "The cure for anything is salt water: sweat, tears or the sea.",
    themes: ["burnout"],
    source: "Isak Dinesen",
    language: "en",
  },
  {
    text: "It is not the mountain we conquer, but ourselves.",
    themes: ["growth", "motivation"],
    source: "Edmund Hillary",
    language: "en",
  },
  {
    text: "Fear is a habit; I am not afraid.",
    themes: ["fear"],
    source: "Ayn Rand",
    language: "en",
  },
  {
    text: "You must build your own world, or be crushed by the one others construct for you.",
    themes: ["motivation"],
    source: "Anaïs Nin",
    language: "en",
  },
  {
    text: "We must be willing to let go of the life we planned so as to have the life that is waiting for us.",
    themes: ["growth", "fear"],
    source: "Joseph Campbell",
    language: "en",
  },
  {
    text: "The weight of the world is too heavy to carry alone, and you were never meant to.",
    themes: ["burnout"],
    source: "James Baldwin",
    language: "en",
  },
  {
    text: "Everything you have ever wanted is on the other side of fear.",
    themes: ["fear", "inspiration"],
    source: "George Addair",
    language: "en",
  },
  {
    text: "What is necessary is to look at things as they are, and to move forward without false illusions.",
    themes: ["motivation"],
    source: "Simone de Beauvoir",
    language: "en",
  },
  {
    text: "I have run out of words, run out of juice, run out of everything but the sheer will to keep existing.",
    themes: ["burnout"],
    source: "Sylvia Plath",
    language: "en",
  },
  {
    text: "To be creative means to be in love with life. You can be creative only if you love life enough that you want to enhance its beauty.",
    themes: ["inspiration"],
    source: "Osho",
    language: "en",
  },
  {
    text: "In the midst of winter, I found there was, within me, an invincible summer.",
    themes: ["hope", "burnout"],
    source: "Albert Camus",
    language: "en",
  },
  {
    text: "We do not heal the past by dwelling there; we heal the past by living fully in the present.",
    themes: ["growth"],
    source: "Marianne Williamson",
    language: "en",
  },
  {
    text: "Fear is only as deep as the mind allows.",
    themes: ["fear"],
    source: "Japanese Proverb",
    language: "en",
  },
  {
    text: "The soul usually knows what to do to heal itself. The challenge is to silence the mind.",
    themes: ["burnout"],
    source: "Caroline Myss",
    language: "en",
  },
  {
    text: "Go to the edge of the cliff and jump off. Build your wings on the way down.",
    themes: ["motivation", "inspiration"],
    source: "Ray Bradbury",
    language: "en",
  },
  {
    text: "Hope is the thing with feathers that perches in the soul and sings the tune without the words.",
    themes: ["hope"],
    source: "Emily Dickinson",
    language: "en",
  },
  {
    text: "It takes courage to grow up and become who you really are.",
    themes: ["growth", "fear"],
    source: "E.E. Cummings",
    language: "en",
  },
  {
    text: "I have been tired for so long that I have forgotten what it feels like to be alive without a weight on my chest.",
    themes: ["burnout"],
    source: "Virginia Woolf",
    language: "en",
  },
  {
    text: "Do not desire to be clean of all your stains; they are the maps of where you have been.",
    themes: ["growth"],
    source: "Leo Tolstoy",
    language: "en",
  },
  {
    text: "One can choose to go back toward safety or forward toward growth. Growth must be chosen again and again; fear must be overcome again and again.",
    themes: ["growth", "fear"],
    source: "Abraham Maslow",
    language: "en",
  },
  {
    text: "Action is a great restorer and builder of confidence. Inaction is not only the result, but the cause, of fear.",
    themes: ["fear", "motivation"],
    source: "Norman Vincent Peale",
    language: "en",
  },
  {
    text: "The greatest thing in the world is not so much where we stand, as in what direction we are moving.",
    themes: ["growth", "inspiration"],
    source: "Oliver Wendell Holmes Jr.",
    language: "en",
  },
  {
    text: "I am dripping with exhaustion, yet my mind refuses to sleep. It feels like a machine that forgot how to turn off.",
    themes: ["burnout"],
    source: "Franz Kafka",
    language: "en",
  },
  {
    text: "I dwell in possibility.",
    themes: ["hope", "inspiration"],
    source: "Emily Dickinson",
    language: "en",
  },
  {
    text: "Even a happy life cannot be without a measure of darkness, and the word happy would lose its meaning if it were not balanced by sadness.",
    themes: ["hope"],
    source: "Carl Jung",
    language: "en",
  },
  {
    text: "The world breaks everyone and afterward many are strong at the broken places.",
    themes: ["growth", "burnout"],
    source: "Ernest Hemingway",
    language: "en",
  },
  {
    text: "The question isn't who is going to let me; it's who is going to stop me.",
    themes: ["motivation"],
    source: "Ayn Rand",
    language: "en",
  },
  {
    text: "A genuine text or piece of art allows us to see ourselves clearly, even the parts we hide.",
    themes: ["inspiration"],
    source: "bell hooks",
    language: "en",
  },
  {
    text: "The light is not at the end of the tunnel. The light is within you, and you must carry it through.",
    themes: ["hope"],
    source: "Kahlil Gibran",
    language: "en",
  },
  {
    text: "Tension is who you think you should be. Relaxation is who you are.",
    themes: ["burnout"],
    source: "Chinese Proverb",
    language: "en",
  },
  {
    text: "The most beautiful things in the world cannot be seen or even touched, they must be felt with the heart.",
    themes: ["inspiration"],
    source: "Helen Keller",
    language: "en",
  },
];

/**
 * Seed the quote library from the curated 130+ pool.
 *
 * Run once: bunx convex run seed:seedQuotes
 * Force re-seed: bunx convex run seed:seedQuotes '{"force":true}'
 */
export const seedQuotes = internalAction({
  args: { force: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const result: { inserted?: number; skipped?: boolean } =
      await ctx.runMutation(internal.quotes.seed, {
        quotes: QUOTES,
        force: args.force,
      });
    if (result.skipped) {
      console.log("[seed] Quote library already populated — pass force=true to override.");
    } else {
      console.log(`[seed] ${result.inserted} quotes seeded.`);
    }
    return result;
  },
});
