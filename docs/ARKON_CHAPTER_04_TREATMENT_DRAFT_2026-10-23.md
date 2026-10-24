# TOKYO SHIFT — ARKON DEN // CHAPTER 04: THE PRICE OF TRUST
**Creative treatment v1 • 23 October 2026**  
**Status:** Newly proposed detailed treatment, **not yet owner-approved line-by-line** and **not implemented**. The established Chapter 04 arc and ending are owner-approved in [the parent checkpoint](ARKON_DEN_STORY_ARC_2026-10-23.md).

## What Chapter 04 needs to do
Immediately follow the final anonymous caller's line in live `src/data/arkonChapter03.js`: **“Not fixing. Building. I have a job for you.”** Chapter 03 ended after five paid customer tuning jobs plus Sayaka's MX-5 maximum build, a possible rolling race and their reunion at Canal Yard. Arkon has some welcome short-term cash, but is not established as financially secure. The Porsche job is his first truly high-value commission — and the first time his emerging reputation is tested by pressure, not by mechanical ability alone.

**Dramatic promise:** The chapter should make the audience feel that *Arkon's principles might destroy his business*, then conclude with him staking nearly everything on the battered black RWB Porsche he refused to misrepresent. The acquisition is risky, debt-backed and emotionally meaningful, **not** an overnight wealth unlock. Sayaka's loyalty is quiet, never a cash bailout. The later player-Career RWB is the *same* car that Arkon eventually restores and freely gifts to her in a later chapter.

**Scope:** Approx. 8–10 sequences, ~15–25 minutes of authored content including two short interactive investigation/choice moments and an auction; avoid forced grind, guaranteed racing outcomes, extraneous main-campaign spoilers or big action minigames unsupported by current engines. Existing Stage, Hold, Manga, Phone and Choice patterns from `arkonChapter03.js` are implementation references, *not* assurance the new inspection/auction systems exist.

## Proposed new supporting roles
- **THE CLIENT:** Wealthy collector / speculator selling his RWB. Polished, controlling, under mounting debt pressure. *Do not name or portray as a criminal mastermind yet.* The exact identity is to be selected after scanning existing Character Bible names (avoid using established Daigo/Kazuo or a current rival as a substitute).
- **INDEPENDENT APPRAISER / BROKER:** A technically serious second party present for the Porsche deal, who notices the discrepancy and **witnesses Arkon refuse** to endorse the false condition. Later provides a genuine lead when the fully disclosed car appears at recovery sale. Future Chapter 05 connection: a collector's referral based on firsthand evidence, *not* magical overnight fame. Name and portrait undecided; a textual voice/portrait silhouette is fine initially.
- **SAYAKA FUJIEDA:** Still **full-time Oshiage instructor**, visiting her friend after work. NOT an existing Ginza manager, secret financier, auction fixer or source of free cars.
- **ARKON:** Still proprietor/mechanic working alone at Canal Yard in this chapter. Has real professional paddock experience, humility and technical instinct, but imperfect business judgement.

## Technical incident — recommended
**Primary safety discovery:** A significant earlier rear-quarter impact has left a rear suspension mounting area/chassis geometry improperly repaired. Hidden behind the dramatic RWB bodywork, the superficial finish looks immaculate. Arkon finds:
1. Left and right rear wheel geometry do not match; one side needs implausible correction and alignment cannot be brought within a sensible safe range.
2. Old damage and a poor structural weld/reinforcement are visible once the car is safely lifted and shielding inspected.
3. Previous repair paperwork is incomplete and an allegedly “clean, high-performance-ready” description cannot honestly be certified.

**Secondary value problem:** A persistent engine oil-pressure/health concern makes the car a huge financial risk for any buyer; an independent check in the repossession period labels it **not suitable for operation until repaired**. A later trailer arrival and “Does it run?” / “Not currently” exchange is then truthful. Do not invent catastrophic destruction, make Arkon cause the failure, or run the car on a drag strip with known structural danger.

**Why this fits a genuine RWB:** RWB wide-body conversions are valuable, individually hand-built creations; the owner is buying craftsmanship and provenance as well as the Porsche. The issue is *a previous mishandled collision and hidden mechanical condition*, **not** that all RWB builds are structurally unsafe. Verify exact Porsche generation and available hero artwork before locking detailed mount nomenclature. Background reference: official RWB site `https://rwb.jp/about/` and official `https://rwb.jp/style/rwb-964-wide-body/` (the specific 964 generation is not yet locked by runtime inspection).

## Sequenced treatment

### S01 — THE CALL-BACK / “NOT FIXING. BUILDING.”
**Setting:** Canal Yard workshop, following Chapter 03's last phone call, evening / next morning.  
**Visual:** Arkon tidies tools, eye on overdue invoices; the Civic is parked nearby. A businesslike intermediary calls to confirm an inspection and rebuild/pre-sale preparation; fee several ordinary jobs combined. He doesn't reveal the car.
**Dramatic function:** Genuine work might finally offer breathing space. Arkon is hopeful but has not taken a substantial deposit; his willingness to accept vague terms is a small, credible business mistake.
**Sample:**
- Caller: “We were told you can tell the difference between a fast car and a well-built one.”
- Arkon: “I can usually tell when somebody's paying for neither.”
- Caller: “It's an important car. The owner needs it ready for a buyer.”
- Arkon: “Bring the paperwork with it.”

### S02 — THE BLACK RWB ARRIVES
**Setting:** Canal Yard entrance; transporter lowers the existing black `rwbStellaPorsche`.  
**Visual:** Do not claim an invented new paint/kit. Hero car enters slowly behind characters. A genuine cinematic arrival, visually impressive but restrained. Sayaka visits after her school shift and stops to examine it. The new owner/client is present or phones in.
**Dramatic function:** Set up Sayaka's personal affection for *this exact car*, not an abstract fascination with expensive cars; establish Arkon's amazement and careful attention. This becomes a later gift callback.
**Sample:**
- Sayaka: “You kept that one quiet.”
- Arkon: “I didn't know it was coming.”
- Sayaka: “It's beautiful.”
- Arkon: “You like it?”
- Sayaka: “I can recognise a good car, Arkon.”
- Arkon: “And yet you trusted me with the Mazda.”
- Sayaka: “That was a calculated risk.”
She lightly touches the wheel-arch edge / walks around the car. A brief, unspoken beat as Arkon notices that this rare car has really captured her interest.

### S03 — THE CONTRACT
**Setting:** Client inspection meeting, inside Canal Yard.
**Story:** Client requests mechanical checks and an inspection endorsement describing the car as “ready for spirited use” and “no significant structural concerns” before a prestigious private sale. Completion fee is large, potentially enough to clear rent, replace equipment and stabilise cash flow. A professional appraiser/buyer's intermediary is present or scheduled to witness results.
**Conflict seed:** Arkon asks for a proper engineering inspection and history. Client tries to rush him. The small upfront retainer barely covers specialist inspection time; remaining fee conditional on an acceptable completion report. Show the imbalance without making Arkon gullible.
**Sample:**
- Client: “It needs to look and drive like what it is.”
- Arkon: “Then give me time to find out what it is.”
- Client: “I was told you were quick.”
- Arkon: “Working quickly is different from guessing.”

### S04 — THE WRONG NUMBERS (INTERACTIVE INSPECTION)
**Setting:** Lift / underbody, day.
**Mechanic:** Offer two short inspection paths (A: rear wheel alignment records, B: underside/repaired metal and condition history). Let the player choose investigation order; both converge on the same factual diagnosis. One existing `CHOICE` plus dialog can deliver an MVP; a bespoke tappable inspection hotspot system is an optional later enhancement. No fake physics results; depict plausible inspection readings/parts, not invented precision numbers without setup.
**Reveal:** Rear geometry can't be safely corrected. Removed trim or shielding shows poor previous chassis repair. Maybe a warm-idle oil-pressure concern, but no required dangerous dyno pull. Arkon refuses any performance test until a qualified structural repair inspection is done.
**Sample internal voice:**
- Arkon: “Left side is where it should be. Right side isn't even close.”
- Arkon: “New underseal. Old metal. Someone wanted this to look better than it was.”
- Arkon: “There's no safe setup that fixes a chassis underneath.”
**Emotional role:** The viewer sees Arkon's skill *rather than merely hearing people say he is brilliant*.

### S05 — THE SIGNATURE (MORAL CONFRONTATION)
**Setting:** Client and appraiser at workshop, under the Porsche's shadow.
**Conflict:** Client explicitly asks for a clean certificate, softens into “just leave the structural section unmentioned”, then raises the payment. Private sale means the next owner would rely on Arkon's name. Arkon knows there is a safety risk. Client threatens not to pay the balance and to damage his reputation.
**Choice agency:** Player chooses *HOW* Arkon refuses, **not WHETHER he becomes a dishonest mechanic**. Examples: (A) calmly insist on a complete report and independent structural assessment, or (B) terminate the commission and return an accurate written report to the owner. Both preserve integrity and preserve later RWB acquisition. Choice yields a different line/tone and optional client response, not morality points or a story dead end.
**Sample:**
- Client: “The buyer doesn't need a history lesson.”
- Arkon: “They need to know if the back of the car will stay where Porsche put it.”
- Client: “I'm paying you to make this happen.”
- Arkon: “You're paying for my work. Not my signature on something untrue.”
- Client: “There are plenty of shops in Tokyo.”
- Arkon: “Then find one that hasn't seen the underside.”
**Resolution:** Arkon declines to sign the false statement; sends factual findings to the client, withholds a clean-condition endorsement and will not drive or tune the unsafe car. The appraiser directly observes the refusal. Do not have him illegally leak private material or sabotage the car. Owner takes car; Arkon is left with only a modest retainer, wasted time and unpaid balance.

### S06 — EVENING AFTER THE LOSS (SAYAKA)
**Setting:** Quiet Canal Yard, night, workshop lights half off, rent notice and tool invoices. No soundtrack swell at first. A plain paper bag of takeaway.
**Purpose:** First real emotional low point; Arkon is not collapsed or bitter, but worn out. Sayaka is present, does not pay his debts or claim she can fix everything. She respects him without delivering a long speech.
**Proposed dialogue draft:**
- Sayaka: “You missed dinner.”
- Arkon: “I've been busy not getting paid.”
- Sayaka: “I heard about the Porsche.”
- Arkon: “The owner wanted a report. Just not an accurate one.”
- Sayaka: “You could've taken the money.”
- Arkon: “Yeah.”
- Sayaka: “Would have helped.”
- Arkon: “For me. Not for the person driving it.”
- [A little silence. She sets the food down.]
- Sayaka: “I've spent all day telling beginners when to stop.”
- Arkon: “I'm going to assume that's advice.”
- Sayaka: “Only if you're listening.”
- Arkon: “Are you always like this after work?”
- Sayaka: “Worse. Eat.”
**Subtext:** She appreciates his independent judgement. He lets someone stay when he's struggling — a quiet counterpoint to the Chapter 03 “easier alone” line.
**Optional side beat:** She sees he has kept the Porsche's dimensions/repair notes as a mechanic would, not as a trader. No obligation, sale or secret plan.

### S07 — THE SECOND CALL / A PUBLIC RECOVERY SALE
**Setting:** Days/weeks later, workshop phone. Client has defaulted; recovery agent/lender has control of the car. Appraiser (not Sayaka) calls because Arkon's report was serious and publicly confirmed by the lender's independent condition assessment.
**Sale integrity:** The upcoming lender-managed sale openly states **structural damage, engine/mechanical condition and need for specialist restoration**. Arkon has no undisclosed inside bargain; he wins only if willing to bear a risk other bidders reject. The legal route should be checked by a Japan-based adviser before specifying ownership-transfer language.
**Sample:**
- Appraiser: “Remember the black Porsche?”
- Arkon: “Difficult to forget.”
- Appraiser: “It's being sold by the lender.”
- Arkon: “That's unfortunate.”
- Appraiser: “Their condition report backs up yours. Most buyers have walked.”
- Arkon: “And you're calling because...?”
- Appraiser: “I thought you should know. You understood it better than anyone else who looked.”
- Arkon: “I never said I could afford it.”
- Appraiser: “I never said you could.”

### S08 — NUMBERS ON A PIECE OF PAPER (THE BID)
**Setting:** Canal Yard / auction office; a quiet montage of estimates, loan documents, old savings, hours, parts, transport and storage.
**Financial premise:** The auction's **hammer price is a fraction of the price of a fully sorted car but still substantial**. Arkon supplies real savings/deposit and accepts a documented, secured or privately underwritten restoration loan, with meaningful repayments due; exact financing model, cash UI and target bid are for gameplay/balance design. His money is not multiplied through a miraculous race purse; he does not suddenly become rich or receive a free gift. If using outside financing, Arkon holds documented beneficial ownership subject to debt, so he can eventually clear the lien and legally give the car to Sayaka. No stake silently belongs to her.
**Interaction:** Show one maximum-bid choice/confirmation (“walk away” option can serve as hesitation with a final re-confirmation; story must not lock the campaign into a no-car branch without a designed alternative). Keep the auction tense through a credible second bidder, reserve and fees, not absurd rapid-fire television bidding. This can initially be a scripted `CHOICE`/manga event.
**Sample:**
- Arkon [internal]: “Parts. Structural work. Engine. Storage. Transport. Interest.”
- Arkon [internal]: “I know exactly how much this could ruin me.”
- Arkon [internal]: “And I know how to put it right.”
- [Bid accepted. Silence before a restrained “successful bidder” notice.]
- Arkon: “Oh. I actually won.”

### S09 — THE TRANSPORTER (APPROVED CHAPTER ENDING)
**Setting:** Canal Yard after dark; same black RWB lowered from transporter. Long silent establishing shot. Arkon is waiting; Sayaka arrives after a long school day and recognises the car. Car is currently non-operational / not safe to drive; arrives as a restoration project, not a garage-ready racer.
**Suggested dialogue, preserve playful rhythm:**
- Sayaka: “No.”
- Arkon: “Hello to you too.”
- Sayaka: “Arkon. Please tell me you didn't.”
- Arkon: “I didn't.”
- Sayaka: “...”
- Arkon: “I may have bought a Porsche.”
- Sayaka: “Does it run?”
- Arkon: “Not currently.”
- Sayaka: “How much money do you have left?”
- Arkon: “Define money.”
- [She looks from the bent car to him. Then unexpectedly laughs.]
- Sayaka: “You're impossible.”
- Arkon: “I'm starting to think so.”
- [She walks around the Porsche, pauses by the same fender as in S02.]
- Sayaka: “What are you going to do with it?”
- Arkon: “Make it right. Eventually.”
- [He waits until she has gone inside for food / coffee; returns to look at the car alone.]
- Arkon [under his breath]: “What have I done?”
- [Fade to black.]
**End title:** `CHAPTER 04 COMPLETE — THE PRICE OF TRUST`. **Do not** reveal a restoration success, Ginza, Sayaka's later RWB ownership, or an immediate contract windfall.

## End-state and Chapter 05 bridge
- Chapter 04 ends with the Porsche **owned by Arkon but subject to a real funding obligation**, potentially not yet roadworthy, not race-selectable and not available for normal paid car sales. No free-power garage upgrade and no false player-car inventory assignment. Precisely how story inventory represents it is an implementation decision.
- Arkon has preserved integrity but lost a client and substantial income, with negative liquidity and fresh risk. Sayaka's regard has deepened through watching his behaviour; they remain close friends with playful unresolved affection.
- **Independent appraiser witnessed the refusal**. In early Chapter 05, a collector asks them for a talented restorer who will not overlook faults. They give Arkon's number; the first truly high-fee restoration arrives at an ordinary, still-struggling Canal Yard. This is a direct causal payoff of Chapter 04, not a magical reward.
- Sayaka remains full-time driving instructor. Later ambition for racing management and old friend/father teasing should NOT be introduced as a Chapter 04 spoiler.
- Canon Career player chronology remains later: Gallery founded, Arkon rich, Sayaka curator, RWB her personal car (unless sold through player action). The Chapter 04 car is the origin of that later object.

## Suggested game-production approach (separate from approved plot)
1. **Script pass:** Lock this scene order, client/appraiser voices, repair facts and realistic auction finance model.
2. **MVP cutscene:** Reuse Stage/Hold/Manga/Phone/Choice logic and the actual `rwbStellaPorsche` hero car asset; avoid custom interaction systems until story pacing works.
3. **Optional inspection UI:** Two close-up interactables (geometry / damaged seam) only if asset production and director engine support it; do not assume existing.
4. **Auction UI:** A maximum-bid confirmation plus separate ledger of deposit/debt (or a cutscene-only transaction until a safe financial model exists).
5. **Persistence tests:** save/reload before and after every wait/branch; no double-charged auction bids, duplicate repo cars, lost current selected vehicle or accidental collision with ordinary Career Ginza unlocks.
6. **Accessibility / presentation:** Main stage readable on tablet and phone; RWB wide body visible and not covered by character sprites or overlapping prompts.
7. **Chapter 04 hand-off:** New story flag(s) are proposed only. Never write into existing Career RWB ownership/sale flags.

## Outstanding decisions for owner
- Exact Porsche generation and artwork-linked visuals; whether body is visibly scratched or simply *internally* unsafe.
- Client name, credibility and motives; independent appraiser's identity and whether they recur.
- Primary defect specificity and engine issue (avoid unverified repair details); choose an independent structural specialist for final sign-off.
- How Arkon finances the real auction purchase under game's cash economy, and how Chapter 05 revenue services the debt.
- Whether to include a *fully optional* Civic meet race while waiting on the recovery sale; no result should rewrite the moral decision or auction fate.
- Dialogue details, specific beats, number of scenes and precise in-game triggers.

**Implementation status:** Story draft only. This document deliberately makes **no** runtime changes.
