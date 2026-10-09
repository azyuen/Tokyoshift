# Character sprites

The game character roster lives in `src/data/characters.js`.

Upload each finished transparent PNG sprite into this folder using the exact file names below. The data is already wired with stable sprite keys and paths, so we can preload and render the images as soon as the files exist.

| Character | File name | Sprite key |
|---|---|---|
| Ren Mizuno | `ren_mizuno.png` | `characterRenMizuno` |
| Daichi Sakamoto | `Main/home_daichi_sakamoto.png` | `characterDaichiSakamoto` |
| Aya Kurose | `aya_kurose.png` | `characterAyaKurose` |
| Kaito Fujimori | `kaito_fujimori.png` | `characterKaitoFujimori` |
| Haru Tachibana | `haru_tachibana.png` | `characterHaruTachibana` |
| Reina Shibata | `reina_shibata.png` | `characterReinaShibata` |
| Riku Akamine | `riku_akamine.png` | `characterRikuAkamine` |
| Emi Kanzaki | `emi_kanzaki.png` | `characterEmiKanzaki` |

The seven playable lead racers have selectable appearances; Daichi is the non-selectable workshop companion.

## Regional and recurring story cast (R458)

- **Reika Tachibana** (regional rival/recruit): `assets/Characters/Shinagawa/reika_tachibana_idle.png`, `reika_tachibana_win.png` and `reika_tachibana_loss.png`. These assets replace Sayaka in Shinagawa meet pools and the seventh-member regional team roster.
- **Sayaka Fujieda** (recurring non-rival): use `assets/Characters/Main/home_sayaka_fujieda_*.png` at the opening, `assets/Characters/Main/ginza_sayaka_fujieda_*.png` for Ginza, and `assets/Characters/Main/race_sayaka_fujieda_*.png` when the professional strategist reveal occurs. Retired Shinagawa Sayaka artwork is consolidated into the identical `Main/race_sayaka_*.png` files.

Daichi's workshop action poses (`home_daichi_engine_inspect.png`, `home_daichi_chassis_tools.png`, `home_daichi_exhaust_crouch.png`) also live in `Main` and apply to Home, Canal Yard and Warehouse HQ. His future professional racing outfit has not been supplied yet. Emi Kanzaki is the selectable Odaiba **main rival**, and her idle/win/loss files live in the `assets/Characters` root.

See `docs/CHARACTER_BIBLE.md` for Reika and Sayaka's distinct identities and staged revelations.

## Shibuya sprite naming (R459)

Six regional rivals (Haru Sakurai, Miu Tanaka, Renji Aoki, Kento Fujisawa, Rina Tachibana, Itsuki Kuroda) use `assets/Characters/Shibuya/<character_name>_<idle|win|loss>.png`, **without a redundant `shibuya_` filename prefix**. The `Shibuya` directory supplies the region. These are byte-identical renames of the prior 18 files and keep the same character IDs, sprite keys, and gameplay roles.
