# Tokyo SHIFT narrative authoring

Read [CHARACTER_BIBLE.md](CHARACTER_BIBLE.md) before writing character dialogue, cutscenes, character interactions, magazine narrative, phone conversations or story content.

## Current foundation

The owner approved Character Bible v1 for individualised Career scenes on 7 October 2026, with deeper Story Mode to be designed much later. The repository is the continuity source; do not depend on a previous chat.

V1 supports future additions of concealed pasts, underground affiliations, antagonists and mysteries without requiring those plots now. Such additions must fit explicit existing facts and track who knows them.

This is an authoring contract, not a runtime branch engine. Existing scenes will not automatically acquire new personality just because these documents exist.

## Scene preparation

Before implementing or drafting a scene, identify:
- Character IDs and actual actors; sprites alone are not identity.
- Which facts are established, adopted foundation, conditional, provisional or merely seeds.
- Current save facts needed: meeting history, race results, crew membership, car ownership and disclosures.
- Each speaker's known facts, suspicions and false beliefs.
- Private information that must not enter public dialogue.
- Individual voice, stakes and reason for this interaction.
- Whether the scene creates a new fact or changes a relationship.

Use ordinary short language. Distinct personalities do not require catchphrases in every line. A player character's default tendencies must leave future decisions open.

Do not use a professional skill label to grant secret physics multipliers. Do not canonise a test preview, generated opponent, borrowed-looking car or developer cameo as history.

## Disclosure planning

These are suggested authoring fields for future facts/scenes, not implemented data APIs:

| Field | Meaning |
|---|---|
| fact ID | Stable identifier for a truth or belief |
| status | Approved truth, proposed, unknown or false belief |
| time | Before game, or a particular save event |
| subjects | Characters involved |
| public account | What the scene generally believes |
| private truth | What actually happened, if already designed |
| knows | Explicit knowers and information source |
| suspects | Suspicion and supporting evidence |
| believes incorrectly | Holder and mistaken belief |
| reveal condition | Event/choice needed to learn it |
| continuity constraints | Facts that must survive later writing |
| future outcomes | Explicitly undecided branches |

A document reader knows more than an actor. Gameplay dialogue must not leak private truth without the appropriate actor knowledge and reveal condition.

Do not use a seeded mystery as if its answer is already chosen. Missing history is unknown, not an implicit denial of deeper history.

## Unresolved matters

Consult the bible's issue register. In particular:
- Career currently uses a custom driver name with selectable appearances.
- Canonical protagonist identity and the rival-slot implications remain unresolved.
- Moving the common opening history to Ren is conditional, not implemented.
- Substitute sprites do not yet carry independent named biographies in this bible.
- Some added demographics remain provisional.

These do not block ordinary greetings, race reactions or workshop scenes that avoid deciding them. Do not silently resolve them as a side effect of authoring a scene.

## Updating canon

When an authorised scene introduces a durable fact, record it in the bible or an explicitly linked extension. Preserve provenance and update relevant knowledge/relationship entries together. Record any deliberate revision in the change record.

A twist can recontextualise a public impression. If it contradicts an explicit approved fact, call out the conflict for a deliberate owner decision. The fact that a character is friendly is not proof they cannot have darker history; it also does not justify assigning that history without a story-design request.

Verify that new dialogue agrees with actual save state and existing gameplay conditions. Check the actor's voice and knowledge, then check that the scene leaves intended future branches open.
