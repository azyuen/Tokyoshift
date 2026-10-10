# TOKYO SHIFT — CHARACTER BIBLE v1

Version: 1.1 — 9 October 2026
Status: adopted foundation; Sayaka/Reika story-role revision explicitly approved by owner on 9 October 2026.
Original repository audit: bc491c0, updated through 3632145.
Deployment source check: 0bc3b0b (subsequent changes since that audit were build/cache files).
This is narrative documentation. It does not implement dialogue selection or a branching Story Mode engine.

## Authority and status

Tokyo SHIFT has one fictional world. A character's personality, past and knowledge do not change between Career and Story Mode.

The owner approved deploying the reviewed v1 so individualised dialogue and micro-cutscenes can be written now, while deeper Story Mode history, mysteries, antagonists and underground affiliations can be designed much later.

Status vocabulary:
- **Established** records facts discovered in the existing repository.
- **V1 foundation** is the creative profile material accepted for ongoing authoring by the deployment approval. It does not claim to have existed in older code.
- **Unresolved / conditional** remains a proposal where the review explicitly identified a decision still needed, particularly player identity and ownership of the opening history.
- **Story seed** is an opportunity, not a guaranteed event or outcome.
- **Variable future** belongs to an individual save or story branch.

The foundational profiles below are usable now. Explicitly conditional material must not be presented as settled fact. The 9 October update **does** authorise Sayaka's new opening/Ginza/professional reveal sequence and Reika's Shinagawa slot, but does not resolve the protagonist-identity model, migrate the opening to Ren, or assign substitute identities. The runtime opening still addresses the selected $PLAYER.

## Future depth and revelation policy

V1 is deliberately not an exhaustive account of anybody's life. Missing information is unknown, not proof that nothing happened.

Career normally exposes public personality, observed conduct, practical relationships and small glimpses. Story Mode can later expose motives, concealed history, underground racing involvement, morally troubling choices, antagonists, loyalties, mysteries and conflicting accounts.

A future revelation should explain or complicate established conduct rather than silently negate explicit facts. Someone being warm, helpful or professional does not prove they have no hidden affiliations. Equally, being reserved does not prove they have a dark secret. V1 assigns no new underground memberships or villains.

Keep these layers separate:
1. Fixed past: approved events before the game, regardless of selected character or mode.
2. Public reputation: what others generally believe; may be incomplete or wrong.
3. Private truth: authored facts that only specified characters know.
4. Knowledge and beliefs: who knows, suspects, misunderstands or has not learned each fact.
5. Revelation: when and to whom a fact becomes available in a particular save.
6. Variable future: decisions and outcomes that have not happened at game start.

When a deeper history is designed later, record its fact, approximate timing, truth status, knowers, suspects, false beliefs, reveal conditions and continuity constraints here or in an explicitly linked canon extension. Do not put a spoiler into generic Career dialogue merely because the writer can read it. A hidden pre-game fact remains the same truth in all modes even if Career never reveals it.

Future betrayal, redemption, romance, allegiance changes and Tokyo Championship outcomes remain open. No biography should make player choice impossible. If a desired twist genuinely conflicts with an explicit fact, identify the conflict and obtain a deliberate canon revision instead of covertly rewriting it.

These are authoring rules. Runtime knowledge flags, branches and reveal gates will need implementation when the relevant scenes are built.

# 1. Existing-character audit

## Scope

The review covered character-related data and call sites across 82 JavaScript source files, the asset inventory, selection/profile handling, meets, races, crew recruitment, tuner assignments, Central Tokyo, tutorials, cutscenes, magazines and story-like references.

Magazine artwork was visually inspected. Large principal-character PNG payloads could not be rendered through the connector during the audit; sprite paths and mappings were inspected, but this was not a complete pixel-level visual review. Do not infer unseen clothing, facial details or ages from that audit.

Primary evidence:
- src/data/characters.js: identities, ages, hometowns, biographies, quotes, regions, visual mappings.
- src/data/crewRoster.js: recruitment eligibility and signature cars.
- src/data/crewDialogue.js: recruitment slots and shared fallback copy.
- src/data/cutscenes.js: opening, family references, invitations, pink slips and regional scenes.
- src/data/tunerChallenges.js: recurring final rivals and challenge-car assignments.
- src/data/tunerShops.js: mechanics, venues and specialist builds.
- src/data/crewSystem.js: recruitment, loan cars and crew battles.
- src/scenes/MeetScene.js: regional greetings, encounters and pink-slip responses.
- src/scenes/CentralTokyoScene.js: Auto Market, Ginza and Drag Complex.
- src/scenes/CharacterSelectScene.js: custom names, seven appearances and starter choice.
- src/scenes/GarageScene.js and DynoScene.js: Daichi, tutorials and workshop dialogue.
- src/ui/MangaCutscene.js and RegionalChallengeTableau.js: actor/quote presentation.
- src/data/carMagazine.js and assets/Ui/magazine_*: Street File content.

The audit is a dated snapshot, not a claim that every identified implementation issue remains present forever.

## Cast inventory

**Current R458 roster: 60 named character entries:** seven regional principals, 42 regional supporting racers (including Reika, **not** Sayaka), Daichi, nine standalone story/Central Tokyo characters (including Sayaka), and Arkon Den. Thus 59 ordinary in-world characters and one developer character. The original 7 October audit counted 59 entries before Reika replaced Sayaka's street slot and Sayaka became a separate story NPC.

| Principal / ID | Established age / hometown | Region | Existing personality | Audit final-round car |
|---|---|---|---|---|
| Emi Kanzaki / emiKanzaki | 20 / Setagaya | ODAIBA | Bright, reactive, competitive | Civic EK9 |
| Ren Mizuno / renMizuno | 20 / Saitama | SHINAGAWA | Quiet, observant, technically clean | RX-8 |
| Kaito Fujimori / kaitoFujimori | 23 / Tokyo | TATSUMI | Reserved, disciplined, respected | Evo III |
| Aya Kurose / ayaKurose | 21 / Yokohama | SHIBUYA | Composed, sharp-witted, competitive | Skyline R32 |
| Haru Tachibana / haruTachibana | 19 / Chiba | YOKOHAMA | Enthusiastic, impulsive, inexperienced | Skyline R32 |
| Reina Shibata / reinaShibata | 22 / Kawasaki | DAIKOKU | Analytical, blunt, perceptive | 3000GT VR-4 |
| Riku Akamine / rikuAkamine | 21 / Shibuya | SHINJUKU | Charismatic, cocky showman | 3000GT VR-4 |

Final-round cars are event assignments, not permanent ownership.

| Region | Recruitment signature associations |
|---|---|
| ODAIBA | Aoi Shindou — EJ1; Yuto Asakura — AE86; Mika Hoshino — Civic EF; Kaori Nishimura — Supra A60; Shun Amamiya — FC; Takumi Serizawa — EK9 |
| SHINAGAWA | Akira Shimizu — AE86; Natsumi Kagawa — EF; Rei Takamura — A60; Goro Nakajima — EK9; Tetsuya Kanda — FC; **Reika Tachibana — RX-8** |
| TATSUMI | Sota Kisaragi — A60; Yui Naruse — EK9; Daigo Moriyama — FC; Risa Tachikawa — RX-8; Masato Kurogane — S2000; Tetsu Nakahara — Evo III |
| SHIBUYA | Haru Sakurai — FC; Miu Tanaka — EK9; Renji Aoki — RX-8; Kento Fujisawa — S2000; Rina Tachibana — Evo III; Itsuki Kuroda — R32 |
| YOKOHAMA | Masato Ishikawa — R32; Mika Hayase — RX-8; Reina Kuroda — S2000; Ryohei Takeda — Evo III; Shun Mizuno — FD; Yui Kanzaki — Evo V |
| DAIKOKU | Sho Nakamura — S2000; Milo Arai — Evo III; Nao Fujita — R32; Aki Senda — FD; Tetsuo Mori — NSX; Kazuo Tanaka — 3000GT |
| SHINJUKU | Daigo Arakawa — 3000GT; Emi Saionji — 22B; Kaede Tachibana — Evo V; Ren Kurosawa — Evo VI; Rin Amamiya — JZA80; Sora Kanzaki — R34 |

| Venue | Character |
|---|---|
| Shinonome workshops | Daichi Sakamoto |
| Odaiba / ESPRIT | Takumi Serizawa |
| Shinagawa / Spoon | Natsumi Kagawa |
| Tatsumi / JUN | Tetsu Nakahara |
| Shibuya / Amuse | Itsuki Kuroda |
| Yokohama / Mine's | Reina Kuroda |
| Daikoku / RE Amemiya | Nao Fujita |
| Shinjuku / Top Secret | Daigo Arakawa |
| Auto Market new cars | Haruto Mizuno |
| Auto Market used cars | Kenji Okabe |
| Auto Market wheels | Yuna Kisaragi |
| Ginza | Sayaka Fujieda |
| Drag Complex owner | Ryuji Takahashi |
| Drag Complex manager | Masato Kuroda |
| Chief starter | Hiroshi Sato |
| Track mechanic | Kenta Ishikawa |
| Timing / telemetry | Tomo Sakamoto |

Arkon Den is explicitly a developer persona. Ethan Yuen is a targeted player-profile reference in compensation content, not a separate ordinary NPC. Substitute male/female sprites currently have no independent named identities. Magazine illustrations have no explicit character-ID assignment. The player's father and family are unnamed.

# 2. Existing canon discovered

The opening states that the player's family gave them their first personally owned car, they recently moved close enough to participate, their father raced professionally, watching him inspired them, and Daichi is their childhood friend. These statements currently apply through $PLAYER regardless of selection. The father's death is NOT established by “would've”.

Tomo is explicitly Daichi's younger brother and a shy, clever timing assistant. Daichi is 22; Tomo's age was not authored.

Regional crews predate recruitment. Each region has six recruitable supporters and one non-recruitable principal rival. Joining the player's crew is a variable future event and does not erase earlier relationships. Crew loan cars remain associated with their member.

Daichi explains that racers drive cars they can access while having a car they are known for. Preferences, signature cars, event assignments and actual ownership must remain distinct. Generated cars do not automatically acquire a detailed provenance.

**Superseded by the 9 October decision:** Sayaka's former Shinagawa racing/recruitment slot belongs to Reika Tachibana. Sayaka is one recurring non-racing story character: family friend and first-car deliverer, later revealed as Ginza's curator/manager, then revealed as the player's father's former racing-team strategist who joins the professional crew. These are successive disclosures, not separate Sayakas.

Street File artwork describes the player's cars, rivals, hero cars and save moments. Four cover/inset sets exist, while the audited resolver returns Issue 01. No named editor, fixed champion or cast member's past victory is established by the illustrations.

Beyond the explicit family/opening relationships, named personal friendships, romances and grudges were largely unwritten. Repeated surnames do not establish kinship.

# 3. Contradictions and unresolved decisions

1. **Player appearance versus identity:** selection uses a custom player name and numbered appearances; substitution preserves the NPC identity with a different sprite. Canonical-person selection would instead require that person to exist only once. The current Career interpretation must not be silently changed by this document.
2. **Shared opening:** the reviewed recommendation is to attach its detailed history permanently to Ren and later give the others appropriate openings. This remains CONDITIONAL, not an enacted migration. Do not assign it to Ren as settled fact or to all seven as fixed canon.
3. **Rookie versus event strength:** Haru's rookie biography and Riku's Skilled label coexist with strong final-round AI. Experience, temperament and event skill are different. Do not invent months of training based on rapid player progression.
4. **Cars:** preferred lists, recruitment signatures and event pools differ. This is compatible with access to multiple cars but does not prove ownership or borrowing provenance for each one.
5. **Placeholder profiles:** Shinjuku supporters originally share much prose; Yokohama profiles are thin. V1 differentiates them.
6. **Recruitment copy:** overrides are mostly empty and some candidates lack explicit entries, using shared fallback text. Generic copy is not a common personality.
7. **Daichi:** the older asset README describes eight flexible/selectable characters; runtime excludes him. Treat him as workshop companion, not an ordinary selectable/recruitable rival.
8. **Main cast visuals (R458):** `assets/Characters/Main/home_daichi_*` supplies workshop Daichi for Home, Canal Yard, Warehouse HQ and dyno; future pro-series racing clothing awaits new art. `assets/Characters/Main/home_sayaka_*` supplies her opening appearance, `assets/Characters/Main/ginza_sayaka_*` her curator role, and `assets/Characters/Main/race_sayaka_*` her professional strategist role. Reika uses `assets/Characters/Shinagawa/reika_tachibana_*`. Retired duplicate Central/Shinagawa Sayaka art no longer needs to load; there is only one Sayaka. Emi Kanzaki is a selectable Odaiba main rival using root `assets/Characters/emi_kanzaki_*.png` sprites.
9. **Substitution:** visual replacement does not solve the semantic problem of two copies of a selected canonical identity. Roster and race fallbacks also matter.
10. **Drag Complex pool:** the audited generic rival pool is empty after region exclusivity, yet bracket generation uses it. Do not canonise unreliable generated identities.
11. **Cutscene source:** dragComplexInvitation is duplicated; the later property wins. Preview mechanics/final rivals and example signature cars are not historical evidence.
12. **Racing descriptions:** circuit/braking/overtaking language can describe interests or experience outside current drag gameplay; it does not prove unimplemented player events happened.
13. **Pink slips:** shared systems can offer wagers across the eligible cast. Use reluctance/preferences, not invented absolute prohibitions that contradict gameplay. Loan cars cannot be wagered.
14. **Developer content:** compensation scenes are outside ordinary world history.

These are documentation findings, not instructions to implement unrelated fixes during dialogue work.

# 4. Character hierarchy

- Tier A: the seven principals, Daichi, Tomo and Sayaka.
- Tier B: seven regional mechanics; Kaori Nishimura, Daigo Moriyama, Kazuo Tanaka; Haruto, Kenji, Yuna; Ryuji, Masato Kuroda, Hiroshi, Kenta.
- Tier C: the other 32 regional supporting racers, now including Reika Tachibana.
- Outside ordinary canon: Arkon Den.
- Unresolved identity: substitute appearances.

Tier controls narrative depth, not ability or guaranteed race results.

# Character profiles

All newly supplied history, occupations and relationships below are V1 foundation except explicitly conditional items and open story seeds. Example lines demonstrate voice, not events that necessarily happened.
Known authored ages are preserved. Suggested ages/pronouns in sparse profiles remain provisional rather than visual claims. Aki retains they/them.
Default knowledge boundary: personal experience, professional knowledge and information actually received; never universal access to other profiles or save events.

## Tier A

### Ren Mizuno — The Quiet Ace
ID: renMizuno

Established identity: 20, male, Saitama upbringing; Shinagawa principal. Learned in an ordinary family car. Calm, observant, competitive; prefers AE86/FC and clean execution.

Daily life: parts-distribution assistant, ordinary routine, exact memory for driving sensations. He looks unambitious because he dislikes declaring ambitions before he can justify them.
Persona: patient and economical in public; privately stubborn, replaying mistakes. Notices exclusion but helps indirectly. Attentive, adaptable and dependable; restraint can become avoidance. Would rather practise than admit a remark hurt.
Values: careful with money, uncomfortable with inherited reputation. Calculated driving risks are easier than emotional ones. Respects honest improvement; dislikes excuses and comparisons with another career.
Conditional past: ONLY IF the opening-history decision is approved, Ren is Daichi's childhood friend and child of the unnamed professional racer; the ordinary learning car and first family-gifted personally owned car need not be the same. Father's name, career level, current circumstances and death are unassigned.
Starting ambition: establish results that belong to him.
Relationships: Daichi is the friend around whom he need not perform competence (childhood duration conditional). Natsumi has inspected his work and finds him teachable. Emi is a recurring competitive acquaintance. Kaito is known mainly by reputation.
Knowledge: knows Daichi's family and Tomo's timing job, not Tomo's private professional insecurity. Conditional father-origin material also conditions his concern over surname recognition. Incorrectly believes asking for advice weakens independence.
Racing: smooth starts, responsive gearing, repeatable shifts; lightweight cars expose mistakes. Either start type. More reluctant to wager a personally meaningful car, without restricting player choice.
Voice: short, direct; little slang; dry observation; emotion in an unusually candid sentence. Never declares himself destined champion.
- Greeting: “You're early. I thought I was early.”
- Challenge: “Same distance. Let's see.”
- Win: “The second shift made the difference.”
- Loss: “I rushed it. You didn't.”
- Impressed: “I thought you'd run out of gear.”
- Annoyed: “I heard you the first time.”
- Private, conditional origin: “I'd like one result nobody compares with his.”
Career glimpse: recognises Daichi's handwriting; an explicitly childhood object requires origin resolution.
Hooks: independence, accepting help, the meaning of inherited reputation if approved.
Constraints: quiet is not empty. Do not invent father's death or achievements. Any approved origin stays true when Ren is an NPC.

### Emi Kanzaki — The Momentum
ID: emiKanzaki

Established: 20, female, Setagaya; Odaiba principal; bright, fearless, perceptive; reads hesitation; prefers EK9/22B.
Daily life: recreation-centre shifts and occasional local activity organisation. Good at getting people involved, less good at noticing they want to stop.
Persona: warm, quick, competitive; privately unsettled by people she cannot read. Turns serious conversations into challenges because the rules feel clearer. Encouraging and adaptable but intrusive, impatient and overconfident about motives.
Values: spends on experiences/useful upgrades; recognition means belonging. Risk feels manageable when she thinks she understands the opponent. Respects commitment; dislikes time-wasting.
Past: Aoi brought her to Odaiba. Kaori taught her to watch an entire run. Pushed Aoi into an unwanted rematch, apologised, but still struggles with the habit.
Ambition: become someone stronger drivers actively prepare for.
Relationships: Aoi is a friend, not subordinate; Kaori mentors her; Ren's unreadability frustrates and interests her; knows Riku socially without trusting every story.
Knowledge: knows Aoi's confidence can exceed comfort. Suspects Ren hides nerves, but does not know private feelings about his family. Wrongly equates visible hesitation with doubt.
Racing: reactive timing, usable midrange, rolling runs; practical mechanics rather than encyclopaedic knowledge. Personal rivalry can make pink slips tempting.
Voice: quick, direct, lightly teasing, short questions; moderate everyday slang. Never has impossible psychological certainty.
- “There you are. I was getting bored.”
- “Ready, or still deciding?”
- “You waited. I didn't.”
- “Fine. That gap wasn't there.”
- “You changed your timing. Nice.”
- “Just tell me you don't want to.”
- “I thought I was helping. I made it worse.”
Glimpse: accepts Aoi declining a rematch after catching her own objection.
Hooks: listening, friendship under competition, people not being telemetry.
Constraints: perceptiveness is fallible; brightness is not naïveté; no assumed Kanzaki kinship.

### Kaito Fujimori — The Night Runner
ID: kaitoFujimori

Established: 23, male, Tokyo; Tatsumi principal; respected, reserved, uninterested in fame; arrives late/leaves quickly; R32/Evo III preferences.
Daily life: evening commercial print-finishing shifts. Some “mystery” is simply timetable and preference for home.
Persona: measured and self-contained; privately considerate, awkward and literal. Honours arrangements better than making them. Disciplined and fair but lets silence become inconsiderate; hopes complications disappear if untouched.
Values: enough money for independence; distrusts fame more than wealth. Deliberate demanding risks. Respects preparation; dislikes being volunteered for publicity.
Past: learned sustained pace from Daigo Moriyama and received harsher criticism from Masato Kurogane. Declined Masato Kuroda's promotional test appearance because publicity obligations felt intrusive.
Ambition: serious racing without becoming a public personality.
Relationships: respects Moriyama, sometimes resents Kurogane's judgement; unresolved courteous business connection with promoter Kuroda; Aya is a benchmark, not automatically intimate.
Knowledge: Kaito and Masato Kuroda know the declined terms; others generally only know he did not attend. Suspects Aya understands his aversion; may be wrong.
Racing: long runs, stable delivery, repeatability; working mechanical knowledge, leaves specialist fabrication to others. Pink slips less interesting than strong opposition.
Voice: restrained complete sentences, little slang, fair rather than icy; literal humour. Never performs being unknowable.
- “You're still here.”
- “Long run? I have time for one.”
- “You were quicker at the start.”
- “You held the pace. Good run.”
- “That stayed strong right to the end.”
- “Ask me before putting my name on it.”
- “I didn't refuse the racing.”
Glimpse: unused guest credential.
Hooks: boundaries versus avoidance, organised competition, explaining himself.
Constraints: declined appearance was not a scandal/disqualification. No secret professional-champion history is established; adding incompatible achievements requires review.

### Aya Kurose — The Ice Line
ID: ayaKurose

Established: 21, female, Yokohama upbringing; Shibuya principal; expressway background, sharp wit, composure, remembers losses; R32/FC preferences.
Daily life: small design/print-studio assistant with strong visual judgement; dislikes being decoration.
Persona: controlled and exact; privately funny, sentimental over mundane objects and harsh on herself. Courageous and persistent; keeps score too long and mistakes accepting apology for surrender.
Values: selective purchases, maintains possessions; wants respect for judgement. Sustained speed interests her, improvisation disguised as bravery does not. Respects preparation, resents condescension.
Past: knew Reina Kuroda in Yokohama before Shibuya. Early embarrassing defeat taught her composure is not preparation; no tragedy is required.
Ambition: consistency against the strongest drivers.
Relationships: older technical contact Reina Kuroda; trusted observer Rina; demanded Riku correct an exaggerated clip caption; respects Kaito's driving, dislikes his disappearing.
Knowledge: understands Riku exaggerates, not all his reasons. Suspects Rina sees sensitivity to failure. Wrongly believes everyone remembers her mistakes equally vividly.
Racing: measured rolling starts, response/stability on long pulls; precise technical questions. Pink slips require explicit controlled terms.
Voice: concise, lightly cutting, low slang, understated emotion; punctures pretension. Never only threats or prophecy.
- “You found the place.”
- “Long enough to settle it?”
- “Better. Still behind.”
- “Yes. I saw the gap.”
- “That wasn't luck.”
- “Take the caption down.”
- “Everyone else forgot. I haven't.”
Glimpse: Riku asks before posting.
Hooks: forgiveness, visibility, competitive respect developing in an open direction.
Constraints: Yokohama past survives Shibuya affiliation; reserved is not universally hostile.

### Haru Tachibana — The Rookie Spark
ID: haruTachibana

Established: 19, male, Chiba; Yokohama principal; friendly, impulsive, enthusiastic, limited money/inexperience; EK9/AE86 preferences.
Daily life: bicycle-shop part-time work and general technical study. Good at small repairs, wildly optimistic about larger job durations.
Persona: chatty enthusiasm; privately embarrassed at gaps in knowledge. Jokes after failure, asks quietly later. Curious and generous; overcommits, buys wrong bargains, confuses enthusiasm with readiness.
Values: counts fuel money but forgets consumables. Wants respect beyond being the younger mascot. Risk judgement worsens with excitement. Respects patient explanations, hates ridicule for questions.
Past: Shun Mizuno helped with a minor roadside problem; Reina Kuroda checked later work. Newer to Yokohama racing than to loving cars.
Ambition: a serious run earning an unqualified compliment.
Relationships: admires Shun, seeks Reina Kuroda's approval, trades questions/bargains with Sho; Emi encourages and sometimes winds him up.
Knowledge: basics and car facts, not universal diagnosis. Suspects others merely tolerate him. Mistakenly equates expense with useful improvement.
Racing: light cars/response/repetition, excitable launches, improving rolling judgement. Pink-slip enthusiasm can outrun prudence; refusal remains valid.
Voice: expressive, self-correcting, occasional unfinished sentences, everyday slang. Never babyish.
- “Wait—did you change the wheels?”
- “One run. A sensible one.”
- “I did that properly this time!”
- “I knew it. I still did it.”
- “How did you make that look easy?”
- “I'm asking because I don't know.”
- “Do they actually want me here?”
Glimpse: notebook drawings acquire maintenance figures with actual progression.
Hooks: affordability, dependability, chosen racing identity.
Constraints: rookie is not child; strong event runs do not erase inexperience; no assumed Tachibana family links.

### Reina Shibata — The Tuner
ID: reinaShibata

Established: 22, female, Kawasaki; Daikoku principal; confident, analytical, blunt; feel verified with data; 22B/Evo III preferences.
Daily life: suspension preparation/alignment. Explains complex problems well but forgets owners may not want a complete critique.
Persona: assured/practical; privately fears merely sounding certain. Affection through details. Perceptive and hardworking; struggles to say “I don't know”, sounds dismissive when interested.
Values: tools/results over prestige pricing; risks more to test an idea she publicly defended. Respects honest logs, dislikes invented explanations.
Past: Kazuo gave early opportunities; Nao taught diagnostic discipline. Aki found an intermittent wiring fault Reina had blamed on tuning. Reina fixed the car and thanked Aki privately but never publicly corrected who solved it.
Ambition: respected judgement without compulsory certainty.
Relationships: Kazuo mentor, Nao technical equal she sometimes treats as examiner, Aki knows credit omission, Daichi friendly professional contact with differing approaches.
Knowledge: Reina and Aki know who diagnosed the fault; Kazuo/Nao need not. She wrongly thinks admitting it would destroy credibility.
Racing: repeatable traction, efficient shifts, measured adjustments; standing tests traction, rolling exposes delivery. Demonstrable advantage tempts pink slips.
Voice: specific observation then recommendation, direct, dry, low slang. Never supernatural diagnosis.
- “Has it always made that noise?”
- “Same conditions. Then we'll know.”
- “It put the power down.”
- “Driver this time. Not the setup.”
- “That's a useful result.”
- “A bigger number isn't an explanation.”
- “I should have said whose idea it was.”
Glimpse: explicitly credits Aki for a small adjustment.
Hooks: honesty, accepting help, confidence after mistakes.
Constraints: not Reina Kuroda; expertise has limits.

### Riku Akamine — The Showman
ID: rikuAkamine

Established: 21, male, Shibuya upbringing; Shinjuku principal; charismatic/cocky/socially connected; bets, power, NOS; FC/R32 preferences.
Daily life: casual event promotion and freelance video editing. Useful socially: missing people, introductions, lost phones.
Persona: entertaining and expansive; privately fears irrelevance when crowds leave. Socially brave and generous with attention; exaggerates, overpromises, jokes too late.
Values: spends on presentation/people, budgets poorly; status means belonging. Takes more risk when watched. Respects self-deprecating humour, dislikes dismissal.
Past: Renji helped build initial contacts. Aya forced a caption correction when charm failed. Daigo Arakawa refuses to let him promise unfinished builds.
Ambition: turn prominence into racing credibility.
Relationships: Renji can puncture stories; Aya respected critic, not enemy; Arakawa demanding collaborator; Miu enjoys events but objects to being used as audience.
Knowledge: has a modest paid filming commitment not disclosed to regional crew. Renji only knows he is busy. Wrongly thinks honest uncertainty disappoints everyone.
Racing: opportunistic, aggressive, close finishes/NOS; knows effects better than fabrication. Enjoys pink-slip theatre but can fear/regret stakes.
Voice: quick, playful, audience-aware, moderate slang; jokes disappear under genuine pressure. Never glib through another person's distress.
- “Good. Someone photogenic brought a car.”
- “Give me a finish worth watching.”
- “Tell me you caught that.”
- “Yes, you can keep the footage.”
- “Okay. No joke—that was quick.”
- “I said I'd sort it.”
- “If I stop organising things, do they still call?”
Glimpse: puts phone away for a serious mechanical problem.
Hooks: attention/friendship, commercial opportunity, promises charm cannot keep.
Constraints: showmanship is not proof of criminality; not automatically every Special Challenger.

### Daichi Sakamoto — The Builder
ID: daichiSakamoto

Established: 22, male, Kawaguchi; mechanic/tutorial companion; Tomo's older brother; practical, loyal; traction, cooling, boost response, reliability; Evo III/22B preferences.
Persona: young tradesperson trying to make being indispensable sustainable. Warm through actions, awkward through words, quietly funny. Helpful responsibility can become tired control.
Values: money means workshop security. Respects preparation and honest fault descriptions; dislikes guaranteeing untested work.
Past: small repairs for friends/local work; Natsumi supplied occasional advice/parts contacts, not all his ability. Childhood friendship with Ren remains conditional on the opening decision. Ryuji offered steadier Complex work; Daichi declined for his own direction. Tomo was hired separately.
Ambition: a workshop that is more than endless favours.
Relationships: protective brother; longstanding friend to Ren with childhood duration unresolved; Natsumi respected contact; Reina Shibata technical friend; Ryuji professional acquaintance.
Knowledge: knows the separate employment events; does not know Tomo suspects influence. Wrongly thinks explaining worries burdens others.
Racing: capable, sympathetic starts and consistency, not ordinary recruitment rival. Cautious pink-slip advice without forbidding choice.
Voice: plain, practical, reassuring, one instruction at a time, dry humour; no humiliating beginners.
- “You're back. How did it feel?”
- “Baseline first. Then change something.”
- “Good. Now we know.”
- “Nothing to prove with a broken car.”
- “Tell me what you changed.”
- “I like being needed. That's part of the problem.”
Glimpse: drawer labelled for Tomo.
Hooks: accepting help, fair charging, supporting without managing.
Constraints: 22, not retired middle-aged racing legend; not universally connected or informed.

### Tomo Sakamoto — The Quiet Signal
ID: tomoSakamoto

Established: male, Daichi's younger brother; shy/clever Complex timing assistant. Proposed age 19.
Persona: hesitant socially, confident on defined discrepancies; considerate, precise, deadpan. May correct a number when emotional acknowledgement is needed.
Past: measuring interested him while watching Daichi. Earned role by identifying a timing-data issue in a practical assessment.
Ambition: trusted as Tomo, not just Daichi's brother.
Relationships: loves Daichi but anticipates overshadowing; Kenta closest daily colleague; Hiroshi trusts checked work; Sota discusses logs.
Knowledge: knows assessment went well; wrongly suspects Daichi arranged job. Does not know Daichi declined a separate position; Ryuji and Daichi do.
Values: careful saver, dislikes publicity, wants professional credit; cautious with others' equipment.
Racing: no assigned personal car/pro racing history. Telemetry skill does not imply elite driving.
Voice: soft starts, precise endings, low slang; hesitation vanishes in technical emergencies, never a stammering caricature.
- “Oh. You found the timing room.”
- “Can we check the raw trace?”
- “It repeats. We can trust it.”
- “That one's mine. I'll correct it.”
- “You did that without changing the setup?”
- “Did they ask for me, or for your brother?”
Glimpse: corrected printout signed “T. Sakamoto”.
Hooks: independence, confronting assumption, public credit.
Constraints: younger than Daichi; shy is not helpless; only logs received are known.

### Sayaka Fujieda — The Family Friend / Curator / Pro Strategist
ID: sayakaFujieda

**Owner-approved canon (9 October):** 47, female, longtime family friend of the selected player's father from his racing days. **Not** a Shinagawa regional racer, rival, wager target or regional crew recruit. Controlled, perceptive, warm in small ways, and professionally discreet.
**Fixed past:** she knew the player's father during his active racing years and served as a racing-team strategist for his team. She later built a career in collector provenance, specialist automotive transactions and curating/managing the private Ginza collection. She retains competition contacts such as Tetsuya, Kaori and Masato Kuroda.
**Career story sequence (fixed truth, staged knowledge):**
1. **Opening / delivered keys:** Sayaka arrives with the first car the player's family has given them. She openly identifies herself as their father's old racing friend. She does **not** explain her work in Ginza or her former strategist role. The existing Daichi workshop/origin/tutorial dialogue follows her delivery; no father death is established.
2. **Ginza invitation / first revelation:** on the private gallery invitation, the player recognises Sayaka. She reveals she is the **curator and manager of the Ginza collection**, not simply a family acquaintance. She still withholds her strategic racing past.
3. **Professional circuit / second revelation and recruitment:** after the player's genuine seven-member regional crew is assembled and the Ginza meeting has happened, Sayaka explains she planned strategy for the father's racing team and **joins the player's professional team as strategist**. She advises/scouts rather than occupies a driving slot. The pro-circuit introduction is a once-per-save manga scene; no bonus physics or simulated race advantage is implied.
**Career knowledge gates:** the player knows the family link from opening; knows the Ginza role only from `ginzaInvitation`; knows her prior strategic role and team affiliation only from `proCircuitStrategistReveal`. Sayaka knows all three facts from the start. Other characters may know only their own dealings; generic street-racer lines cannot disclose her pro past early. Save history is tracked in `cutscenesSeen` rather than a new eighth regional crew member.
Persona: understands emotional and financial car value, sometimes treats people like carefully managed inventory. Courteous/exact; privately likes plain food and unpretentious company. Withholds context believing she knows what others need.
Ambition: safeguard Ginza's credibility while helping the next generation stand on its own merit.
Relationships: the player's father is her longstanding friend and former team colleague; a familiar adult to the player. Tetsuya and Kaori are old competition contacts, Kenji a business contact, Masato Kuroda an event contact; Daichi knows her through the family handoff. These connections do not establish the father's name or present whereabouts.
Knowledge: entrusted records, not every car's complete history. Suspects one consignment file incomplete; does not know why. Kenji knows one document missing, not the entire transaction. Missing provenance is not proof of crime.
Values: status is a market force, not moral worth. Calculated financial/racing risk and verifiable provenance. Business ownership, curation and strategist duties can coexist.
Voice: concise complete sentences, polite/direct, minimal slang, dry transactional humour; personally warmer with the player than with an ordinary customer.
- “Your father and I go back a long way.”
- “You should be the one to take the keys.”
- “A story is not a service record.”
- “Let's make the terms clear.”
- “Seven drivers. That's a team worth planning for.”
- “I'll revise the plan.”
Glimpse: recognises Kaori's old entry handwriting.
Hooks: family ties, provenance, access, professional strategy and inherited expectations.
**Constraints:** never put her into Shinagawa meets, regional challenges, street recruitment, pink slips or character-rival pools. She is a separate, non-driving professional strategist only at the final reveal. Ginza stock is not all personally owned. The father and protagonist's canonical identity remain unresolved beyond current $PLAYER-scoped opening history.

## Tier B

These characters use the existing signature associations above where applicable. Additional history is V1 foundation. New ages and pronouns remain provisional where original data was silent. Supporting knowledge does not include other characters' private profiles.

### Takumi Serizawa — Odaiba / ESPRIT
ID: takumiSerizawa

Established: 49, male, Toyosu; patient veteran mechanic, conservative occasional racer, signature EK9.
Foundation: general workshop work preceded specialist preparation. Remembers everyone's unfinished jobs, forgets his coffee; generosity disrupts his schedule. Wants younger mechanics to stop treating preventable failures as rites of passage.
Relationships/knowledge: knows Kaori's practical preferences and Emi's impatience, not her private fears. Treats Daichi as a young colleague, not an apprentice he owns.
Racing/values: reliability, aero balance, clean launches; calculated occasional pink slips rather than habitual wagering.
Voice: patient, amused, practical clauses; never humiliates ignorance.
- “Coffee's fresh. Advice depends on the question.”
- “One run. Then tyre pressures.”
- “Good. We can repeat that.”
- “No, louder isn't a diagnosis.”
Glimpse/hook: old job card with Kaori; needs to delegate.
Constraint: mechanical experience does not contradict a low driving skill label.

### Natsumi Kagawa — Shinagawa / Spoon
ID: natsumiKagawa

Established: 42, female, Oi; blunt/good-humoured mechanic, signature EF.
Foundation: dependable everyday cars before specialist work. Loves clever modifications, hates marketing copy; dismisses aesthetics too quickly.
Relationships/knowledge: Daichi through parts/repair work; Ren through local preparation; Rei through electronics. Knows inspection findings, not emotional readiness.
Racing/values: durable launches, clear costs, workmanship; reluctant but not absolutely opposed to pink slips.
Voice: brisk/direct, warm underneath; never calls beginners stupid.
- “Bonnet up. Story afterwards.”
- “Let's see what reaches the ground.”
- “Good. Nothing expensive complained.”
- “You can say you don't know.”
Glimpse/hook: Daichi returns a spotless borrowed tool; expansion versus protecting time.
Constraint: old previews do not make her Shinagawa's final rival.

### Tetsu Nakahara — Tatsumi / JUN
ID: tetsuNakahara

Established: 38, male, Katsushika; eccentric/friendly mechanic, signature Evo III.
Foundation: industrial equipment repair as well as cars; labelled containers in an apparently chaotic bag. Calls racing “testing” to avoid admitting enjoyment.
Relationships/knowledge: knows Sota's standards, Moriyama's habits; fabrication exchanges with Milo. Does not know Kaito's private business decisions.
Racing/values: drivetrain/traction, unusual solutions only after testing; mechanically obsessive but not magical.
Voice: conversational digressions, then a useful observation; never random nonsense.
- “I brought the small bag. Mostly.”
- “One run. Strictly research.”
- “Ha! That stays.”
- “Bad result. Excellent clue.”
Glimpse/hook: keeps every timing slip; can he admit wanting to win?
Constraint: improvisation cannot make impossible repairs.

### Itsuki Kuroda — Shibuya / Amuse
ID: itsukiKuroda

Established: 29, male, Ebisu; inventive low-key custom tuner, signature R32.
Foundation: fabrication before exhaust/street preparation; difficult commissions interest him, finishing times are underestimated. Wants a personal build without neglecting paying work.
Relationships/knowledge: Haru Sakurai/Yuna through fitment; Milo through fabrication. Knows measured tolerances, not unseen specifications.
Racing/values: functional individuality; calculated stakes on his own work can appeal.
Voice: calm, slightly meandering, physically precise; no untested guarantees.
- “It looks odd because it clears.”
- “Let's find out if the idea survives.”
- “Good. Now I'll make it tidy.”
- “That measurement matters more than the photo.”
Glimpse/hook: unfinished personal part keeps moving benches.
Constraint: no assumed Kuroda kinship.

### Reina Kuroda — Yokohama / Mine's
ID: reinaKuroda

Established: confident/relentless mechanic and high-speed racer; signature S2000, GT-R preferences.
Provisional demographics: woman, early thirties.
Foundation: calibration specialist irritated by ignored advice; dependable, overly demanding.
Relationships/knowledge: inspected Haru's work, knows Shun professionally, knew Aya in Yokohama. Recognises Haru's potential but not how strongly he seeks approval.
Racing/values: response and sustained delivery; calculated stakes. Wants customers to understand rather than repeat faults.
Voice: brisk/decisive, exact praise; never calls a genuine safety lift cowardice.
- “Tell me what changed.”
- “Keep it clean through the top end.”
- “That response is better.”
- “If something's wrong, lift.”
Glimpse/hook: keeps Haru's first satisfactory inspection sheet.
Constraint: distinct from Reina Shibata; no assumed Kuroda family.

### Nao Fujita — Daikoku / RE Amemiya
ID: naoFujita

Established: 32, female, Kanagawa; dry methodical diagnostician, signature R32.
Foundation: reputation for intermittent faults; likes helping but sometimes enjoys disproving a diagnosis too much. Wants a process not wholly dependent on herself.
Relationships/knowledge: Reina Shibata/Aki/Kazuo through work; does not automatically know their private omissions.
Racing/values: cooling, ignition, fuelling, tested reliability; narrows uncertainty, selective with money/risk.
Voice: dry, methodical, quietly playful; never calls unresolved faults solved.
- “Good news. It does fail consistently.”
- “One clean run should tell us.”
- “Nothing failed. I'm delighted.”
- “Let's stop guessing expensively.”
Glimpse/hook: notebook contains crossed-out diagnoses.
Constraint: evidence-based expertise, not infallibility.

### Daigo Arakawa — Shinjuku / Top Secret
ID: daigoArakawa

Established: mechanic, “The Authority”, polished builds/disciplined driving, signature 3000GT.
Provisional demographics: man, late thirties.
Foundation: workshop coordinator absorbing last-minute promises; competent, rigid about deadlines, enjoys terrible novelty keyrings.
Relationships/knowledge: Riku through preparation, Tetsuo through machining. Detects overpromising without knowing every contract.
Racing/values: controlled boost/thermal margin; prepared explicit risk; wants work represented accurately.
Voice: firm, spare, procedural; authority is not ownership of people.
- “Appointment, emergency, or optimism?”
- “The car is ready. Are you?”
- “That's what we prepared for.”
- “You promised it. I haven't finished it.”
Glimpse/hook: absurd keyring among meticulous keys; expectations versus capacity.
Constraint: no inferred criminal authority or relation to Moriyama.

### Kaori Nishimura — Odaiba mentor
ID: kaoriNishimura

Established: 44, female, Minato; calm veteran/mentor, signature A60.
Foundation: small professional-services business; racing provides uncomplicated enjoyment. Patient with beginners, resents being everyone's substitute parent.
Relationships/knowledge: Takumi/Sayaka through earlier entries; mentors Emi without deciding her future. Knows specific old events, not all current rumours.
Racing/values: reliable high-speed balance; can accept stakes without a gambling identity.
Voice: warm authority, gentle understatement.
- “You don't have to impress me before saying hello.”
- “Stay with the run.”
- “Experience helped. So did preparation.”
- “No, I'm not settling that argument.”
Glimpse/hook: Sayaka uses an old event nickname; mentoring boundaries.
Constraint: mentoring does not prove parenthood/professional racing.

### Daigo Moriyama — Tatsumi's old hand
ID: daigoMoriyama

Established: 52, male, Adachi; patient bay-road veteran, signature FC.
Foundation: practical maintenance work, selective late nights. Likes younger racers, dislikes nostalgia dismissing them; conceals fatigue too long.
Relationships/knowledge: Kaito through repeated runs, Ryuji through older circles; respects Kurogane but rejects gatekeeping.
Racing/values: smooth sustained runs, durability, interesting opponents over stakes.
Voice: dry/unhurried, ordinary words.
- “You picked a cold night.”
- “No hurry before the start.”
- “Still works.”
- “Good. Now don't turn it into a speech.”
Glimpse/hook: old photo near Ryuji; limits without losing enjoyment.
Constraint: no invented secret championship title.

### Kazuo Tanaka — Daikoku's veteran builder
ID: kazuoTanaka

Established: 53, male, Yokohama; gruff/patient builder, signature 3000GT.
Foundation: engine/drivetrain workshop operator, gave Reina Shibata opportunities. Generous teaching, sometimes overvalues doing everything personally.
Relationships/knowledge: Tetsuo/Nao through work; does not know Reina's credit omission.
Racing/values: mechanical honesty/durable torque; wants the next generation independent.
Voice: concrete/blunt, affectionate complaint.
- “You eat before coming here?”
- “Build it properly. Then run it.”
- “That'll do. Check it anyway.”
- “Pay the person who did the work.”
Glimpse/hook: old apprentice note signed by Reina.
Constraint: craft pride must not become contempt for hiring specialists.

### Haruto Mizuno — Auto Market new cars
ID: harutoMizuno

Established: polished/upbeat/product-focused specialist.
Provisional: man, late twenties.
Foundation: proud of making purchases understandable; rehearses explanations, flustered by requests for subjective opinion.
Relationships/knowledge: works with Kenji/Yuna; no assigned relation to Ren/Shun. Knows advertised stock specifications, not buyers' finances.
Racing: no personal car/racing career assigned.
Voice: tidy enthusiastic sentences, minimal slang.
- “What do you need the car to do?”
- “Let's compare them properly.”
- “Good choice for that brief.”
- “I can explain the difference without the brochure.”
Glimpse/hook: scripts become handwritten practical questions.
Constraint: game “new” category does not establish real-world current production.

### Kenji Okabe — Auto Market used cars
ID: kenjiOkabe

Established: friendly/shrewd dealer of modified used cars.
Provisional: man, forties.
Foundation: inspections/small sales before current trade. Enjoys deals, may talk past awkward details before correcting himself. Repeat customers matter.
Relationships/knowledge: Sayaka/Natsumi business contacts; documented/disclosed history only. Knows gallery document missing, not explanation.
Voice: conversational/persuasive/grounded.
- “Look it over. Then we'll talk.”
- “Condition first. Price second.”
- “Fair deal. We both eat.”
- “That part of the history isn't verified.”
Glimpse/hook: voluntarily corrects optimistic listing.
Constraint: shrewd is not proof of dishonesty; uncertain history remains uncertain.

### Yuna Kisaragi — wheels and fitment
ID: yunaKisaragi

Established: exacting/stylish/enthusiastic specialist.
Provisional: woman, mid-twenties.
Foundation: visual customisation led to learning engineering. Annoyed when function and appearance are treated as enemies.
Relationships/knowledge: Itsuki/Haru Sakurai through work; no assigned Sota kinship. Knows measured clearance, not unseen suspension.
Racing: no assigned personal racing record.
Voice: energetic/specific/lightly teasing.
- “Which look are you after?”
- “Turn it full lock. Both ways.”
- “There. It fits and looks right.”
- “A photograph doesn't show rubbing.”
Glimpse/hook: beautiful rejected wheel tagged with practical fault.
Constraint: cannot sell impossible fitment as expertise.

### Ryuji Takahashi — Drag Complex owner
ID: ryujiTakahashi

Established: old-school racer, understated owner, serious about proper racing.
Provisional: man, late fifties.
Foundation: invested in organised competition for reliable timing/clear terms. Fair, but assumes his institutional approach is best.
Relationships/knowledge: Moriyama from earlier circles; employs manager/starter/mechanic/telemetry staff. Knows Daichi declined separate work and Tomo earned his job.
Ambition: Complex survives beyond his supervision.
Voice: plain authority, little ceremony.
- “Welcome. Learn the procedure.”
- “The board settles the time.”
- “Good run. Keep the slip.”
- “Rules apply when they're inconvenient too.”
Glimpse/hook: less composed younger self in a photo.
Constraint: does not secretly control the entire Tokyo scene by virtue of ownership.

### Masato Kuroda — Drag Complex manager
ID: masatoKuroda

Established: professional/organised manager/promoter.
Provisional: man, late thirties.
Foundation: enjoys making events work, fears nobody notices except failures. Smooth publicly, dryly exasperated privately.
Relationships/knowledge: Ryuji/Hiroshi colleagues, Sayaka business contact; knows Kaito's declined terms, not complete emotional history.
Values: revenue enables events, not proof of merit.
Voice: confident concise logistics, restrained humour.
- “You're expected. Sign in here.”
- “Three races. Read the restrictions.”
- “That result stands.”
- “A sponsor request isn't a rule change.”
Glimpse/hook: invitation filed as “declined”, not “failed to attend”.
Constraint: distinct from Kurogane and Ishikawa.

### Hiroshi Sato — chief starter
ID: hiroshiSato

Established: focused/authoritative starter and umpire.
Provisional: man, late forties.
Foundation: friendly off duty, absolute about staging attention; remembers procedural errors more than insults.
Relationships/knowledge: trusts checked work by Tomo and inspections by Kenta. Private rivalries unknown unless event-relevant.
Racing: no current personal car assigned.
Voice: short work instructions, relaxed off-duty sentences.
- “Morning. Coffee before the queue?”
- “Stage when instructed.”
- “Clean start. Official time follows.”
- “Back out. We reset properly.”
Glimpse/hook: helps nervous entrants rehearse procedure.
Constraint: fairness not negotiable through friendship.

### Kenta Ishikawa — track mechanic
ID: kentaIshikawa

Established: young/practical track mechanic.
Provisional: man, 21.
Foundation: general service work before events; sociable/volunteering, embarrassed to escalate problems.
Relationships/knowledge: Tomo closest daily friend, respects Hiroshi, admires Daichi's range. Knows Tomo worries about credit, not necessarily his exact false belief.
Ambition: trusted with larger responsibilities.
Voice: practical/friendly, less polished than management.
- “Give me a minute to check it.”
- “Let's do the boring bit first.”
- “Ready. Properly ready.”
- “I need a second opinion.”
Glimpse/hook: Tomo checks trace while Kenta checks connector.
Constraint: no assumed relationship to Masato Ishikawa.

## Tier C

Use the audit's signature-car map. These concise profiles supplement existing regional roles. They know observed local history, not private Tier A facts. Stakes/race outcomes remain save-dependent; no new absolute pink-slip prohibition is implied.

### Aoi Shindou
ID: aoiShindou — Odaiba; established 26, female, Odaiba hometown; EJ1.
Social/upbeat developing racer; café-shift work explains familiar faces. Brought Emi to a meet. Introduces newcomers, sometimes laughs along while uncomfortable. Wants confidence without compulsory enthusiasm. Responsive NA builds, manageable standing starts.
Voice: welcoming/plain. “You can park with us.” / “Good run. I need a minute before another.”
Constraint: friendliness is not automatic consent. Hook: asserting a boundary without losing warmth.

### Yuto Asakura
ID: yutoAsakura — Odaiba; established 32, male, Koto; AE86.
Methodical benchmark racer; warehouse scheduling work. Reliable, mildly pedantic about meeting times. Knows Takumi through preparation. Repeatable gearing/launches; dislikes changing three things together. Wants useful benchmarks rather than fame.
“Same setup as last time.” / “You moved the target. Good.”
Constraint: certainty about measured performance does not extend to motives.

### Mika Hoshino
ID: mikaHoshino — Odaiba; established 35, female, Shin-Kiba; EF.
Dry tuner-driver; suspension workshop work, labels tests. Exchanges setup arguments with Nao, not all her contacts. Turns leisure into experiments; chassis knowledge rather than every electronics specialty.
“I changed one thing. Personal growth.” / “Well, that was the wrong thing.”
Hook: enjoying a run without extracting a test result.

### Shun Amamiya
ID: shunAmamiya — Odaiba; established 25, male, Ariake; FC.
Flashy technical wildcard; custom-electronics installation, Itsuki project acquaintance. Abandons effective solutions once bored. Responsive turbo experiments/difficult opposition.
“It's unconventional, not unfinished.” / “Fine. The conventional one won.”
Constraint: no inferred relationship to Rin or RE Amemiya. Hook: novelty versus finishing.

### Akira Shimizu
ID: akiraShimizu — Shinagawa; established 29, male, Shinagawa; AE86.
Tidy working-life racer; office administrator with predictable timetable. Goro a reliable local acquaintance. Wants absorbing hobby without consuming life; clean launches, modest street changes, measured stakes.
“One run. I have work tomorrow.” / “That was worth being slightly late.”
Constraint: ordinary job is not secretly a cover unless deliberately authored later.

### Rei Takamura
ID: reiTakamura — Shinagawa; established 31, male, Konan; A60.
Electronics/data professional; logging acquaintance Sota. Helpful/exact, sometimes wrong kind of precision for a human question. Wants practical advice used. Rolling tests/gearing.
“What did it do before the shift?” / “The trace is clear. Your explanation isn't.”
Constraint: data cannot reveal unmeasured intentions.

### Goro Nakajima
ID: goroNakajima — Shinagawa; established 39, male, Samezu; EK9.
Intimidating/loyal, explicitly not reckless. Building maintenance, carries things without seeking praise. Natsumi trusts borrowed tools returned. Protection can become unwanted intervention. Decisive launches/durable drivetrains.
“Need a hand?” / “No speeches. Line up.”
Constraint: “enforcer” is not proof of organised crime.

### Reika Tachibana
ID: reikaTachibana — Shinagawa; owner-approved woman, 47; signature RX-8.
Replaces Sayaka's **street racing** slot, not her biography or relationships. Elegant, controlled and calculating, with a similar mature presence but an independent competitive identity. Studies launches, logs opponent habits and varies gearing or risk only when the evidence justifies it. An expert regional strategist/racer who can join the player's standard seven-driver crew in Shinagawa; she is **not** the father's former team strategist and has no automatic Ginza affiliation.
Voice: quietly competitive, direct, understated. “The first run tells me what the second will cost you.” / “Good. Now I know what I missed.”
Constraint: shares a surname with Haru/Rina/Kaede Tachibana but no kinship is established. No Sayaka family history or delayed revelations belong to her.

### Tetsuya Kanda
ID: tetsuyaKanda — Shinagawa; established 55, male, Takanawa; FC.
Veteran with executive appearance; procurement consultant, Sayaka's older competition contact. Patient until politeness is mistaken for agreement. Wants interesting racing, not a monument to the past. Smooth/stable, selective stakes.
“I heard the proposal. I haven't agreed.” / “Good. You made that worthwhile.”
Constraint: knows particular old events, not everybody's history.

### Sota Kisaragi
ID: sotaKisaragi — Tatsumi; established 27, male, Edogawa; A60.
Systems specialist; controls technician and occasional Tomo technical correspondent. Overvalues easy measurements. Wants explanations surviving repetition. Rolling tests/shift optimisation.
“Run it again under the same conditions.” / “Interesting. That shouldn't match—and it does.”
Constraint: no assumed Yuna relationship.

### Yui Naruse
ID: yuiNaruse — Tatsumi; established 30, female, Koto; EK9.
Controlled/repeatable racer; quality-inspection work, enjoys disorganised crafts privately. Knows Risa enough to refuse pressure. Wants precision chosen rather than compulsory. Traction/clean quarter miles.
“One clean run.” / “No, I'm done for tonight.”
Constraint: consistency is not immunity to error.

### Risa Tachikawa
ID: risaTachikawa — Tatsumi; established 34, female, Setagaya; RX-8.
Sharp challenger seeking strong fields; equipment sales. Competitive even while “only comparing”. Knows Yui and can accept direct refusal. Adaptive/high grip, greater risk tolerance than Yui.
“Who's quickest tonight?” / “Good. I picked the right car to chase.”
Constraint: weaker drivers are not targets of hostility.

### Masato Kurogane
ID: masatoKurogane — Tatsumi; established 45, male, Nerima; S2000.
Demanding respected technical driver; precision-machining supervisor. Advised Kaito; debates harsh teaching with Moriyama. Useful standards can become gatekeeping. Whole-car balance/disciplined starts.
“More power won't finish that shift.” / “That was good. Don't make me repeat it.”
Constraint: “master” does not make every judgement right.

### Haru Sakurai
ID: haruSakurai — Shibuya; established 23, male, Shibuya; FC.
Relaxed stylist/functionally prepared builds; clothing alterations/retail. Yuna/Itsuki fitment contacts. Pretends taste is effortless after hours of work. Wants respect beyond photos.
“Yes, the colour was deliberate.” / “Looks good standing still. Better moving.”
Constraint: distinct from Haru Tachibana.

### Miu Tanaka
ID: miuTanaka — Shibuya; established 20, female, Setagaya; EK9.
Expressive fashion-circle arrival; styling assistant. Enjoys Riku's events, dislikes promotional scenery role. Impulsive presentation, serious competence. Light response/lively cash races.
“I picked the car too, you know.” / “Ugh. Fine. That shift was awful.”
Constraint: no assumed Kazuo relationship.

### Renji Aoki
ID: renjiAoki — Shibuya; established 24, male, Nakano; RX-8.
Sociable rumour collector; late hospitality work. Helped Riku find contacts. Passes amusing stories before checking fairness; wants welcome everywhere. Adaptable/strong starts.
“I heard a version of that.” / “Hang on. Who actually saw it?”
Constraint: social reach is not omniscience.

### Kento Fujisawa
ID: kentoFujisawa — Shibuya; established 26, male, Meguro; S2000.
Dry minimalist; product-design assistant. Itsuki professional contact, respects Yuna's functional eye. Confuses personal taste with objective quality. Wants fewer things done better; balanced quarter-mile builds/moderate stakes.
“It doesn't need another trim piece.” / “Fair. It did need that adjustment.”
Constraint: minimalism is not contempt for colourful cars.

### Rina Tachibana
ID: rinaTachibana — Shibuya; established 25, female, Shibuya; Evo III.
Perceptive Night Editor; editorial production work, NOT automatically Street File editor. Aya's trusted observer. Sometimes decides meaning before listening. Adaptive setups/selective opposition.
“I noticed. I'm asking why.” / “Interesting. I read that wrong.”
Constraint: no assumed Haru/Kaede relation.

### Masato Ishikawa
ID: masatoIshikawa — Yokohama; provisional man, 35; R32.
Established calm high-speed regular; port logistics planner. Cheerful about schedules until his own is disturbed; Reina Kuroda preparation contact. Wants strength throughout run.
“Plenty left after the launch.” / “You kept pulling. That's the difference.”
Constraint: no assumed Kenta relationship.

### Mika Hayase
ID: mikaHayase — Yokohama; provisional woman, 28; RX-8.
Established measured/technical racer; laboratory technician, warm off-line, dislikes avoidable mess. Knows Yui Kanzaki. Can assume caution is the only responsible approach. Repeatable balanced runs.
“Let's make it repeatable.” / “Yes, I enjoyed it. I'm checking the time.”
Constraint: distinct from Mika Hoshino.

### Ryohei Takeda
ID: ryoheiTakeda — Yokohama; provisional man, 27; Evo III.
Established direct launch specialist; warehouse equipment operator. Practices with Haru but struggles to verbalise feel. Wants recognition beyond first sixty feet.
“Watch the first sixty feet.” / “You had the start. I had the excuses.”
Constraint: strong starts do not imply recklessness.

### Shun Mizuno
ID: shunMizuno — Yokohama; provisional man, 33; FD.
Established smooth seasoned racer; vehicle-delivery coordinator. Helped Haru roadside, offers advice without adopting him. Quiet impatience with wasted preparation.
“Nothing rushed. Nothing wasted.” / “You're smoother than last time.”
Constraint: no assumed Ren/Haruto kinship.

### Yui Kanzaki
ID: yuiKanzaki — Yokohama; provisional woman, 24; Evo V.
Established sharp/fearless challenger; restaurant supervisor, strong immediate decisions/weak long planning. Competitive friend Mika Hayase. Wants decisions to count.
“Pick the run. Then commit.” / “I committed to the wrong gear.”
Constraint: no assumed Emi/Sora kinship.

### Sho Nakamura
ID: shoNakamura — Daikoku; established 23, male, Kawasaki; S2000.
Curious young gearhead/serious builds; workshop assistant. Questions with Haru, seeks Tetsuo approval. Changes too much, wants credit before documentation.
“I only changed two things this time.” / “Okay. Three if that counts.”
Constraint: growing knowledge, not universal expertise.

### Milo Arai
ID: miloArai — Daikoku; established 29, female, Tsurumi; Evo III.
Energetic fabricator; small fabrication business. Work exchanges with Itsuki/Tetsu. Pride can make her refuse a perfectly adequate bought part and waste money.
“I can make that.” / “Yes, buying it would have been quicker.”
Hook: craft versus sustainable business.

### Aki Senda
ID: akiSenda — Daikoku; established 27, they/them, Shin-Koyasu; FD.
Exact electronics specialist; independent wiring/calibration. Knows Reina Shibata's misattributed diagnosis, has not confronted her. Values evidence and credit.
“The sensor disagrees.” / “Keep the result. Put the right name on it.”
Constraint: reserve does not mean absent boundaries; Reina's secret isn't public.

### Tetsuo Mori
ID: tetsuoMori — Daikoku; established 38, male, Daikoku; NSX.
Loud/good-humoured machinist; long Kazuo association, occasional Arakawa work. Loves dramatic demonstrations, meticulous inspection afterwards.
“Now that sounded healthy.” / “More boost later. Check it first.”
Constraint: jokes cannot turn recklessness into expertise.

### Emi Saionji
ID: emiSaionji — Shinjuku; provisional woman, 29; 22B.
Precision racer; finance operations, likes measurable competition after ambiguous workdays. Friendly Kaede, prickly when underestimated.
“No adjustment between runs.” / “Close. I want the actual number.”
Constraint: surname/car does not establish wealth.

### Kaede Tachibana
ID: kaedeTachibana — Shinjuku; provisional woman, 26; Evo V.
Night runner; late hotel shifts. Calm in others' crises, indecisive over own plans. Knows Emi Saionji. Response/clear start procedure.
“I've dealt with louder people tonight.” / “Good run. I'm still deciding about the rematch.”
Constraint: no inferred Tachibana family.

### Ren Kurosawa
ID: renKurosawa — Shinjuku; provisional man, 31; Evo VI.
Technical racer; industrial maintenance. Methodical with Arakawa, dislikes Riku's premature promises; pedantic wording.
“Possible isn't the same as ready.” / “Now it's ready.”
Constraint: distinct from Ren Mizuno; practical expertise, not prophecy.

### Rin Amamiya
ID: rinAmamiya — Shinjuku; provisional woman, 24; JZA80.
Challenger; freelance photographer. Difficult shots/opponents interest her, routine work suffers. Knows Riku through events.
“One run before the light goes.” / “Fine. You get the good angle.”
Constraint: no inferred Shun/RE Amemiya relationship.

### Sora Kanzaki
ID: soraKanzaki — Shinjuku; provisional man, 28; R34.
Ace; facilities engineer. Polished/competitive, awkward with uncomplicated friendliness. Knows Ren Kurosawa through technical discussion. Wants benchmark status without life becoming only results.
“Bring the run you meant to do.” / “That was yours. I won't dress it up.”
Constraint: no assumed Kanzaki network.

## Outside ordinary canon: Arkon Den
ID: arkonDen

Developer cameo, compensation/debug scenes and clearly noncanonical jokes only. Do not resolve personal conflicts, fund plots or explain ordinary results through Arkon. The Ethan Yuen compensation reference is not an additional NPC biography.

## Substitute appearances

No independent names/history assigned. The unresolved choices:
- Custom-avatar Career can keep an existing NPC identity with another appearance.
- Canonical protagonist selection needs a distinct person in the vacated rival slot.
A reserve can inherit event responsibilities, never the selected character's childhood, relationships or secrets. Do not implement either semantic model merely by reading this document.

# Relationship map

Except Daichi–Tomo and the unresolved player-opening link, specific interpersonal additions are V1 foundation rather than claims of pre-existing code.

| Network | Connections | Tension |
|---|---|---|
| Workshop/family | $PLAYER–father–Sayaka (friendship from racing days), Ren–Daichi (childhood conditional), Daichi–Tomo, Daichi–Natsumi, Daichi–Reina Shibata | Independence, trust, old racing connections, accepting help |
| Odaiba | Aoi–Emi, Emi–Kaori, Kaori–Takumi, Kaori–Sayaka | Encouragement versus pressure |
| Tatsumi | Kaito–Moriyama/Kurogane, Sota–Tomo, Tetsu–Sota | Different teaching/discipline |
| Shibuya | Aya–Rina/Riku, Riku–Renji/Miu, Haru Sakurai–Yuna–Itsuki | Visibility, consent, reputation |
| Yokohama | Haru–Shun/Reina Kuroda/Sho, Aya–Reina Kuroda | Welcome versus respect |
| Daikoku | Reina Shibata–Kazuo/Nao/Aki, Milo–Itsuki/Tetsu, Tetsuo–Kazuo | Credit, craft pride, uncertainty |
| Organised racing | Ryuji–Masato Kuroda/Hiroshi, Tomo–Kenta, Kaito–Masato, Sayaka–Masato | Credibility and commerce |
| Provenance | Sayaka–Kenji–Natsumi, Yuna–Itsuki | Known, claimed, verified |
| Shinagawa tactics | Reika–the Shinagawa crew | Competitor preparation, analysis and adaptation; no family link |
| Professional mentorship | Sayaka–$PLAYER and their recruited seven drivers | Delayed disclosure, planning and earned leadership |
| Shinjuku | Riku–Arakawa–Ren Kurosawa, Rin–Riku | Promises versus completion |

No additional siblings from repeated surnames. No compulsory romances. Aya/Kaito's respect and Emi/Ren's acquaintance can develop in multiple directions. Recruitment changes participation, not earlier truth. Professional disagreement is not automatic enmity.

# World timeline

Relative dates avoid unnecessary calendar constraints. New events are V1 foundation; opening-history assignment remains conditional.

| Period | Events |
|---|---|
| Earlier generation | Kaori, Tetsuya, Moriyama and Kazuo accumulate experience; Ryuji develops racing background. |
| Father's racing era | Sayaka is his longtime friend and works as his racing team's strategist; their exact races and later circumstances remain unassigned. |
| Years before opening | Sayaka develops trading/planning contacts, including Kaori/Tetsuya entries, later managing the Ginza collection. |
| Childhood, conditional | Ren–Daichi friendship and Ren watching his professional-racer father only if origin assignment is approved. |
| Several years before | Daichi gains repair experience; Reina Shibata receives Kazuo opportunities. |
| Before current regional roles | Aya knows Reina Kuroda in Yokohama before Shibuya association. |
| More recently | Aoi introduces Emi; Kaito receives Moriyama/Kurogane advice; Riku builds Renji-linked meet network. |
| Recent pre-game | Shun helps Haru with minor roadside issue; Reina Kuroda checks subsequent work. |
| Before game start | Daichi declines Complex offer; Tomo earns separate role and privately suspects influence. |
| Before game start | Kaito declines promotional appearance; Riku corrects Aya caption; Aki solves fault credited to Reina. |
| Game start | Sayaka delivers the family's first car to $PLAYER, says she knew the father through racing, then Daichi introduces the Tokyo street scene. Reika, not Sayaka, occupies the sixth Shinagawa supporter racing slot. |
| After Ginza invitation | Sayaka discloses her role as Ginza curator and manager; she does not disclose her former racing strategist identity. |
| First legitimate pro-circuit entry following Ginza | With seven regional recruits, Sayaka reveals the old strategist role and joins the player as non-driving team strategist. The seven-driver roster is unchanged. |

No shared fatal accident is needed to connect the cast. Ordinary work, competition and repeat encounters already do.

# Career Mode Easter-egg opportunities

These are scene ideas, not implemented assets or guaranteed events.

| Detail | Later meaning | Gate / boundary |
|---|---|---|
| Ren recognises Daichi handwriting | Familiar relationship | Childhood implication requires origin approval |
| Drawer for Tomo | Daichi quietly makes room | Does not imply Tomo wants workshop employment |
| “T. Sakamoto” printout | Individual professional credit | Others may not notice |
| Ryuji asks Daichi “Still your own place?” | Declined offer | Tomo need not hear |
| Kaito unused credential | Declined publicity, not racing | No public explanation |
| Riku asks Aya before posting | Learned boundary | No full backstory exposition |
| Emi accepts Aoi refusal | Learning not to pressure | Do not repeat mechanically every visit |
| Reina credits Aki small adjustment | Unresolved larger omission | Does not disclose secret to everyone |
| Kaori recognises Sayaka entry notes | Old connection | No invented champion title |
| Sayaka's personal key handover | Familial trust without overt exposition | Keep Ginza/professional roles undisclosed at opening |
| Familiar gallery curator | First reveal reframes the opener | Do not disclose racing-team strategy until genuine pro entry |
| Haru notebook gains maintenance figures | Growing competence | Actual progression required |
| Shun recalls loose connection | Mundane first help | No inflated dramatic rescue |
| Kenji marks “unverified” | Provenance concern | Does not prove theft |
| Arakawa novelty keyring | Human humour | Needs no mystery |
| Nao crossed-out diagnoses | Revisable expertise | Not infallible-genius stereotype |
| Magazine credits mechanic | Craft reputation | Must reflect recorded work |

Most clues fit one exchange/detail. Some scenes are simply funny. Private lines require privacy. Repeated clues gain meaning through context, not escalating exposition. Characters do not congratulate unseen achievements without a plausible information source. Magazines report public/witnessed events, not private thoughts.

# Future Story Mode seeds

All remain unresolved:
1. Ren's independence from father comparisons, conditional on origin decision.
2. Daichi's sustainable workshop direction.
3. Tomo's mistaken hiring assumption.
4. Emi learning where encouragement becomes pressure.
5. Kaito finding acceptable organised-competition terms.
6. Aya choosing visibility and vulnerability.
7. Haru's maintenance affordability, not just purchase cost.
8. Reina correcting technical credit.
9. Riku's modest commercial commitment versus capacity/loyalty.
10. Sayaka's incomplete consignment history: innocent omission, dispute or more serious cause undecided.
11. Complex growth, access and shared authority.
12. Regional loyalties after recruitment.
13. Outgrowing a mentor without humiliating them.
14. A car retaining meaning after sale, loan, loss or return.
15. Optional intimacy growing from events rather than predestination.
16. Later-authored concealed affiliations, underground involvement or antagonistic motives, subject to the future-depth policy. No particular character is assigned these now.

No seed guarantees betrayal, death, romance, championship or reconciliation.

# Canon rules for writers and AI agents

1. One person across modes; different depth of disclosure.
2. Distinguish fixed past, save events, private truth, beliefs and undecided seeds.
3. Adopted foundation is usable; explicit unresolved/conditional material stays unresolved.
4. Character ID is identity, sprite is presentation.
5. Do not silently decide the player-identity model or create a duplicate canonical protagonist.
6. Do not move father/childhood/gifted-car history between protagonists.
7. Preserve established names, ages, hometowns, family and roles unless deliberately revised.
8. Separate preference, signature, event car, access and current ownership.
9. Check save state before mentioning wins, recruitment, transfers, meetings or disclosures.
10. Knowledge requires a source; suspicion is not certainty.
11. False beliefs are not narrator truth.
12. Individual voice survives regional flavour.
13. Preferences permit exceptions; hard constraints do not. Future player choices remain open.
14. Do not infer family from surnames, identity from covers or ownership from generated cars.
15. Previews, developer rewards and placeholders are not reliable history.
16. Driving identity affects decisions/preparation, never hidden physics advantages.
17. Use small scenes to establish tension without resolving arcs.
18. Before each scene check present actors, past events, each actor's knowledge, relationship, voice and continuity constraints.
19. Unknown history is available for future design, not a blank cheque to contradict facts.
20. Deeper revelations require documented truth/knowledge/reveal gates and deliberate continuity review.
21. Do not design future villains, underground memberships or complete plots incidentally while writing today's shop scene.

# Change record

- 2026-10-07: v1 adopted for repository-based authoring after review. Added explicit future-depth policy requested by owner. Retained unresolved identity/origin decisions and provisional demographic details. No runtime or existing dialogue changes.
- 2026-10-09 (R457): owner changed Sayaka to the player's father's racing-era friend, first-car deliverer, Ginza curator/manager and former strategist who joins at legitimate pro entry. Introduced Reika Tachibana as independent 47-year-old Shinagawa tactical racer and sixth regional crew candidate, with uploaded idle/win/loss assets. Added three staged career narrative beats, knowledge gates and explicit separation from seven-driver recruitment. No broader protagonist-identity decision or automatic tactical gameplay buff.
- 2026-10-10 (R458): consolidate Daichi's home/workshop and Sayaka's Ginza visual sets under `assets/Characters/Main`, retire redundant copies, correct Emi's idle/win/loss asset paths to the canonical root folder. Emi was already correctly selectable and Odaiba's main rival; no role reassignment was necessary. Future Daichi pro racing outfit is pending artwork.

- 2026-10-10 (R467): owner approved a new interactive Career opening. The selected driver begins without a car at Tokyo train station, hears Daichi introduce the inaugural car magazine and its retrospective on the unnamed previous Tokyo Champion, takes the train to Shinonome, reads Issue 01 in the office and chooses a family-offered AE86 or Civic EF from a Tokyo Auto Market advertisement. Sayaka, the established family friend, delivers the selected car and mentors the first driving lesson; Daichi follows with tuning and street-racing guidance. The prior sequence remains available only to pre-R467 saves still using legacy onboarding. The historical champion's identity, details of the family friend's car arrangements and the protagonist identity model remain deliberately unresolved; neither the magazine image nor the advertisement assigns ownership to any named actor. The magazine story is introductory public-facing editorial content, not disclosure of Sayaka's concealed professional strategist role.
- 2026-10-10 (R471): Owner refined the station's first encounter: Daichi greets the selected driver by their chosen name, gives a brief magazine introduction and explains the issue's anonymous previous-champion retrospective. He only learns that a family friend will deliver a car from the driver's father; he does **not** know the family friend's identity or that two starter cars exist. The driver leaves by train to Shinonome; the private car-choice irony is preserved for the later Sayaka delivery. Staging uses a silent establishing shot followed by white-background manga dialogue. No existing character history or later reveals change.

- 2026-10-11 (R473): Sayaka's first-car phone call takes place inside Shinonome office, before the car rolls slowly into the garage. Sayaka meets the player at the vehicle, intentionally understates her knowledge of manuals and racing, gives the existing practice lesson, jokes about her car knowledge and leaves alone. Player returns to a quiet workshop checkpoint (`awaitDaichi`); the Daichi follow-up will require a separately authored interaction later and is not automatically played. No new explicit claim about Sayaka's hidden career or her motives is established.

- 2026-10-11 (R474): The next separate tap anywhere in the workshop after Sayaka's farewell reveals Daichi in his full chassis-tuning garage placement and art. His conversation acknowledges the father's starter gift and possible race intent without suggesting prior foreknowledge by Daichi or Sayaka; the existing workshop/street instruction continues. At the end Daichi's temporary arrival pose and introductory prompt disappear, leaving the normal interactive workshop with the chosen car.

- 2026-10-11 (R475): Station conversation uses standard translucent manga backdrop; Daichi fades away afterward and the player explicitly presses GO TO MAP. Real Issue 01 02–03 spread reveals the player's thought after a pause, then a single car-selection prompt. Sayaka's in-office call now shows a phone illustration. Sayaka has a sad pose during the manual explanation, happy after first lesson, blushing when joking about car knowledge, and serious on the final farewell. Her character history is unchanged.
