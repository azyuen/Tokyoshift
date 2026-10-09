# Character sprites

The game character roster lives in `src/data/characters.js`.

Upload each finished transparent PNG sprite into this folder using the exact file names below. The data is already wired with stable sprite keys and paths, so we can preload and render the images as soon as the files exist.

| Character | File name | Sprite key |
|---|---|---|
| Ren Mizuno | `ren_mizuno.png` | `characterRenMizuno` |
| Daichi Sakamoto | `daichi_sakamoto.png` | `characterDaichiSakamoto` |
| Aya Kurose | `aya_kurose.png` | `characterAyaKurose` |
| Kaito Fujimori | `kaito_fujimori.png` | `characterKaitoFujimori` |
| Haru Tachibana | `haru_tachibana.png` | `characterHaruTachibana` |
| Reina Shibata | `reina_shibata.png` | `characterReinaShibata` |
| Riku Akamine | `riku_akamine.png` | `characterRikuAkamine` |
| Emi Kanzaki | `emi_kanzaki.png` | `characterEmiKanzaki` |

The original eight principal illustrations are role-flexible, subject to the current roster's selectable and rival flags.

## Shinagawa strategist and recurring story cast (R457)

- **Reika Tachibana** (regional rival/recruit): `assets/Characters/Shinagawa/reika_tachibana_idle.png`, `reika_tachibana_win.png` and `reika_tachibana_loss.png`. These assets replace Sayaka in Shinagawa meet pools and the seventh-member regional team roster.
- **Sayaka Fujieda** (recurring non-rival): use `assets/Characters/Main/home_sayaka_fujieda_*.png` at the opening, `assets/Characters/Central/sayaka_fujieda_*.png` for Ginza, and `assets/Characters/Main/race_sayaka_fujieda_*.png` when the professional strategist reveal occurs. The old `assets/Characters/Shinagawa/sayaka_fujieda_*.png` files are legacy art, not active Shinagawa racing sprites.

See `docs/CHARACTER_BIBLE.md` for the two characters' distinct identities and staged Sayaka revelations.
