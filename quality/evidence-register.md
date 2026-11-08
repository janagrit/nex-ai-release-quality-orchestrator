# Evidence register

Public signals that motivated the test design. None of them is a verified root cause.

| ID | Public signal to investigate | Source category | Maps to | Supports | Does not prove |
|---|---|---|---|---|---|
| E-01 | Nex help center: a background update can reduce game performance because the CPU cannot dedicate full resources to gameplay; initial update downloads can take 30–45 minutes; players are advised to wait for updates to finish | Official support | `background-update` condition, RG-001..RG-008 | Update activity and gameplay performance are a relevant, vendor-acknowledged test dimension | A confirmed defect in any particular build |
| E-02 | BoxFlow: after an update, previously successful movements are randomly missed | User report, Nex bug forum (~Oct 2026) | RG-001 recognition, RG-003 dropped events | Motion-recognition regression after updates merits investigation | Root cause, prevalence, or link to background updates |
| E-03 | Home Run Hero: black screen on launch after an update; restart did not help | User report, Nex bug forum (Oct 17) | RG-005 startup, RG-006 crash | Launch failure after a game update is a regression class to gate | Root cause or prevalence |
| E-04 | Starri: second player stuck on Easy after an update | User report, Nex bug forum (~Oct 2026) | MP-005 (designed, not simulated) | Multiplayer configuration can regress across updates | Not covered by the performance simulator; this is a functional defect |
| E-05 | TMNT: ~6–10 FPS drop in busy areas after a major update | User report, Nex bug forum (Apr 2026) | RG-004 FPS | Frame-rate regression after updates merits a gate | Hardware, scene, or build attribution |
| E-06 | Nex help center: computer vision tracks 18 body points in real time, up to four players depending on the game, processed on device | Official support | MP-001..MP-004 | Multi-player tracking reliability is a product-specific risk area | Any tracking defect |
| E-07 | QA Manager job description: OTA testing, interrupted updates, compatibility, responsiveness, latency, frame-rate stability, release gates | Official job description | Whole project | These are role-relevant test areas | Internal incident priority |

**Before sharing:** add the exact source URL and access date to each row. Dates marked "~" are approximate, calculated back from "N days ago" labels. Treat user reports as unverified until independently reproduced.
