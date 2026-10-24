> **R679 UPDATE (24 October 2026) — supersedes the earlier two-car Chapter 10 finale.** Aruken voluntarily sells his actual modified Liberty Walk 240Z to fund the negotiated liabilities after one last friendly race. Sale is recorded once in the save and Car History, never confiscates Sayaka's gifted RWB. The last scenic drive is now a real moving road sequence: **Sayaka drives her own RWB Porsche with Aruken alongside as passenger**, warm in-car banter, then the single Porsche at Yokohama and the existing hand-holding artwork. Earlier R674 statements describing both cars arriving together or all liabilities already paid at Chapter 10's opening are superseded. See [ARKON_R679_RECIPROCITY_AND_FINALE.md](./ARKON_R679_RECIPROCITY_AND_FINALE.md).

# R674 — Arkon Story Chapter 10: THE ROAD AHEAD

**Owner-approved ending (23 October 2026).** This is the ending of Arkon's ten-chapter prequel, NOT an additional Career chapter. No post-credit cliffhanger.

## Narrative canon

- Chapter 9's questionable private car deals are not identified as Yakuza or a named criminal organisation. Arkon declined the unverifiable certification and left with Sayaka and advisers; the legal/financial consequences remained real.
- Chapter 10 opens several months later after a limited, negotiated financial settlement. The workshop survives. Arkon returns to honest mechanical work, not an instant miraculous recovery.
- Three customer projects offer interactive restoration checklists (AE86, GC8 collaboration, sympathetic R32 restoration), a friendly real-physics Daikoku test, and earned fees once only. Customer cars are temporary commissions, not free additions to the player's collection.
- Arkon and Sayaka establish Ginza Gallery conservatively. Sayaka is **50% co-owner AND curator**, not simply Arkon's employee. Do not alter the longstanding playful Ginza dev Easter egg; her irritation about the collection makes sense because the assets belong to her too.
- Sayaka is an ordinary family friend of the Career player's parents. Their child is simply into cars; their father is not secretly a professional racing driver. Daichi is a childhood friend. Arkon quietly restores an affordable starter AE86 or Civic EF, Sayaka arranges the introduction, and she and Arkon help Daichi's fledgling workshop. The child's talent is earned in Career, not inherited or manipulated.
- Arkon's black Porsche project was repaired, inspected, and gifted to Sayaka in Chapter 06. The gifted RWB is **not owned by Arkon**, transferred again or promised as a prize. The Liberty Walk 240Z belongs to Arkon.
- In the final scene, both cars are parked before the Yokohama wheel while Arkon and Sayaka hold hands, viewed from behind. No declaration, kiss, relationship label or sequel tease.

## Code and story commands

- \`src/data/arkonChapter10.js\`: authored scene flow and dialogue.
- \`src/data/arkonChapter10Work.js\`: chapter-only verified restoration milestones, fees, real race context, recovery settlement, gallery co-ownership, career-seed story flag and Yokohama setup.
- \`src/ui/ArkonChapter10Restoration.js\`: each customer car's three sequential inspection/repair/verification steps.
- \`src/ui/ArkonChapter10Finale.js\`: dedicated Yokohama image composition, final art, fade and completion.
- \`src/ui/StoryStage.js\`: two native full cars in separate Yokohama parking positions.
- \`src/story/StoryDirector.js\` and \`StoryScript.js\`: chapter-specific command integration and checkpoint resume.
- \`src/state/GameState.js\`: permanent Arkon-only chapter state; Career mode fields cleared.
- \`src/ui/ArkonStoryObjective.js\`, \`ArkonPlayableReplay.js\` and \`ArkonStoryArchivePanel.js\`: sequential Chapter 10 start, chapter goal text, isolated replay and scene archive.
- \`src/scenes/RaceScene.js\`: physical, non-staked Chapter 10 validation run without hidden power multipliers.
- Character sprite asset: **\`assets/Characters/Main/arkon_sayaka_holdinghands.png\`** (never regenerate or change during Chapter 10 deployment).

Run from a Chapter 09-complete Arkon Story profile at Warehouse HQ. Use the Story Objective to begin Chapter 10. Finish the project checklists, race and story scenes. The final button records the completed story. Replay from Office > Recount Story is sandboxed and restores the real profile.

## Scope

Changes to the Career opening and pro strategist reveal remove the father's racer/strategist storyline from their existing cutscenes. The current Ginza dev Easter egg is deliberately unchanged.

The ten-chapter Arkon prequel and its Career-completion unlock policy remain separate concerns: this revision implements the **Chapter 10 story and its local replay/progression**, not a comprehensive redesign of Career-mode unlock gating or the entire racing progression.

## Validation

\`node --test tests/arkon-chapter10-r674.mjs\`; CI: \`.github/workflows/arkon-chapter10-r674.yml\`.
Visual iPhone/iPad inspection is still advisable for both cars' final spacing, sprite size and keyboard/touch continuations.
