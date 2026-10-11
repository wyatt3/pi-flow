# ESP32 Feasibility Spike — Plan

**Status:** proposed
**Target decision:** can `pi-flow` be ported from Raspberry Pi Zero W (Node.js) to an
ESP32 (ESP-IDF / C) with equivalent functionality, and is it worth it?
**Branch convention:** throwaway. Everything lives in `spike/esp32/`. Nothing in
`src/`, `client/`, or `package.json` is touched, so `master` stays exactly as-is and
`git checkout master && rm -rf spike/` is a clean exit.

---

## Scope

In scope:

1. A feasibility study document (`FEASIBILITY.md`).
2. A natively-tested C domain core (`pf_core/`), compiled and tested with the `gcc`
   and `make` already present on the dev box.
3. A Vue bundle-size measurement, run in a scratch directory outside the repo, to
   decide "keep Vue" vs "minimal hand-written UI".

Explicitly **out of scope**:

- No ESP-IDF firmware, no `platformio.ini`, no `CMakeLists.txt` for the ESP target.
- No pin definitions in source, no partition CSV.
- No Wi-Fi provisioning implementation.
- No ESP-IDF toolchain install (no ~2-3 GB download into `~/.espressif`).

The pin table and relay-driver guidance are prose in the study, not code.

---

## Confirmed decisions

| Question | Choice |
| --- | --- |
| Firmware stack | ESP-IDF (C) |
| Front-end strategy | Keep Vue, drop socket.io, serve gzipped from flash |
| Relationship to repo | Feasibility study first (no in-place rewrite yet) |
| Zone count | 5-8 zones |
| Firmware half of spike | Skipped — study + tested C core only |

---

## Environment findings (verified on this machine)

| Tool | Present? | Consequence |
| --- | --- | --- |
| `idf.py` / ESP-IDF | No | ESP-IDF firmware written here would be uncompilable. N/A — firmware skipped. |
| `cmake`, `ninja` | No | Same. N/A. |
| xtensa toolchain, QEMU | No | Same. N/A. |
| `gcc` 13.3, `make` 4.3 | **Yes** | The pure C domain core **can be compiled and tested right now**. |
| `node` v25.9.0 | Yes | `package.json` pins `engines: node >=20 <21`. Mismatch. |
| `node_modules` | Absent | Vue bundle size is currently unmeasured. |
| `public/` build | Absent | No prior bundle to measure. |

Note: a plain `npm install` will likely trip on the node-v25 vs `engines` mismatch and
on `better-sqlite3` native bindings. The bundle-budget step avoids both by installing
only vite-side deps in a scratch directory.

---

## Deliverable 1 — `FEASIBILITY.md` (the study)

Sections, all grounded in the code as read:

1. **Cost reality check** — Pi Zero W build vs ESP32 build, side by side, itemized
   from the README's own BOM. Headline: you save the SD card plus roughly 2 W idle
   (about 17.5 kWh/yr); it is not a dramatic BOM drop.

2. **Feature-mapping matrix** — the table below, with file/line references.

   | Pi Flow feature | ESP32 equivalent |
   | --- | --- |
   | Express + `express.static` | `esp_http_server` (ESP-IDF core) |
   | Socket.IO push | `CONFIG_HTTPD_WS_SUPPORT` WebSocket + native `WebSocket` in browser |
   | `better-sqlite3` | LittleFS + one JSON doc, atomic write (data volume tiny) |
   | `onoff` + `pinToLineMap.json` | `driver/gpio.h` — the libgpiod V1/V2 hack disappears |
   | `node-cron('* * * * *')` | FreeRTOS task + `xTaskDelayUntil` |
   | `moment-timezone` + `TIMEZONE` | `setenv("TZ","EST5EDT,M3.2.0,M11.1.0",1); tzset();` + lwIP SNTP |
   | `.env` + `dotenv` | `network_provisioning` SoftAP/BLE + NVS |
   | `recoverRunningSchedules()` | Same logic, replayed from persisted JSON at boot |
   | `checkForScheduleOverlap()` | Ported 1:1 |
   | Vue/Vite build | Unchanged; built on host, served from LittleFS |

3. **What the port *deletes*** — `src/config/pinToLineMap.js` and its 61-line test
   (`tests/pinToLineMap.error.test.js`) vanish entirely; so does `tests/config.test.js`.
   libgpiod V1/V2 is an ESP-IDF non-problem.

4. **Flash partition math** — the finding that **OTA and serving a Vue SPA are
   mutually exclusive on 4 MB**: two ~1.9 MB OTA slots consume the whole die.
   Recommendation: single-factory app, no OTA, since a sprinkler controller bricked by
   a bad flash is worse than one you re-flash over USB. This constraint decides whether
   "keep Vue" survives.

5. **Safe-pin table for 8 zones** — GPIO 13, 14, 16, 17, 18, 19, 21, 22, with the
   excluded set enumerated. Replaces the free-form GPIO picker in
   `client/components/zones/NewZone.vue` with a fixed channel map.

   | GPIO | Usable as relay output? | Reason if excluded |
   | --- | --- | --- |
   | 0 | No | Boot strapping + boot mode |
   | 1, 3 | No | UART0 TX/RX |
   | 2 | No | Boot strapping + onboard LED |
   | 4, 5 | Avoid | Tied to SD card on WROVER variants |
   | 6-11 | No | SPI flash |
   | 12 | No | Boot strapping (MTDI, must be LOW at boot) |
   | 13, 14 | **Yes** | — |
   | 15 | No | Boot strapping (MTDO, must be HIGH at boot) |
   | 16, 17, 18, 19 | **Yes** | — |
   | 21, 22 | **Yes** | — |
   | 23, 25, 26, 27, 32, 33 | **Yes** | Reserve / spare |
   | 34-39 | No | Input only, no output driver |

   Recommended 8-zone assignment: **13, 14, 16, 17, 18, 19, 21, 22**.

6. **Relay driver options** — MOSFET + flyback diode, ULN2003, or TPIC6B595
   (16 channels off 3 pins). Cite the measured failure mode: 5 V opto boards *mostly*
   work at 3.3 V logic (about 1 mA draw, 4.16 V at collector vs 3.75 V max-operate
   threshold), while 12 V-coil boards do not switch reliably without a resistor change.
   Never power relay coils from the ESP32 3.3 V pin.

7. **Test-coverage disclosure** — roughly 1,000 of the 2,708 jest lines are
   host-portable; roughly 1,700 (controllers, api, websocketService, zoneService) have
   no on-target equivalent without Unity. Stated plainly rather than buried.

   | Test file | Lines | Portability |
   | --- | --- | --- |
   | `tests/scheduleService.test.js` | 594 | **Portable** (overlap + recovery cases) |
   | `tests/models.test.js` | 419 | Partially portable (day handling) |
   | `tests/zoneService.test.js` | 232 | On-target only |
   | `tests/zoneController.test.js` | 327 | On-target only |
   | `tests/scheduleController.test.js` | 782 | On-target only |
   | `tests/websocketService.test.js` | 120 | On-target only |
   | `tests/api.test.js` | 85 | On-target only |
   | `tests/config.test.js` | 31 | Obsolete (config file disappears) |
   | `tests/pinToLineMap.error.test.js` | 61 | Obsolete (map disappears) |

8. **Bonus upside** — ADC for the soil-moisture / rain-skip goal already stated in the
   README; non-latching relays mean valve-closes-on-reboot is fail-safe.

---

## Deliverable 2 — `pf_core`, a natively-tested C domain core

The part that can be verified today. Pure C, zero ESP-IDF headers, builds with the
`gcc` and `make` already on this box.

Proposed layout:

```
spike/esp32/
  PLAN.md                 # this file
  FEASIBILITY.md          # deliverable 1
  README.md               # spike overview + go/no-go + delete instructions
  pf_core/
    Makefile
    include/pf_core.h
    src/pf_schedule.c     # overlap + due-at-minute
    src/pf_recovery.c     # recovery math
    tests/pf_test.h       # tiny assert harness
    tests/main.c
    tests/test_overlap.c
    tests/test_due.c
    tests/test_recovery.c
  bundle-budget/
    measure.sh            # runs in /tmp, never touches the repo
```

Modules:

- `pf_core.h` — `schedule_t`, 7-bit day mask, status enum, and the **polarity split**
  that kills the `active` confusion: `pf_relay_state_t` (pin energized) and
  `pf_valve_state_t` (water flowing) as separate types joined by one explicit invert
  flag. This makes it impossible to misread
  `ZoneService.turnOffAllZones()` calling `save(zone, 1)` the way the current code can
  (`src/services/zoneService.js:35`).
- `pf_overlap()` — port of `checkForScheduleOverlap`
  (`src/services/scheduleService.js:244-293`): interval intersection gated on day-set
  intersection.
- `pf_due_at_minute()` — port of the `start_time = 'HH:mm'` plus day filter
  (`src/services/scheduleService.js:95-108`).
- `pf_recovery_remaining_ms()` — port of the elapsed/remaining math
  (`src/services/scheduleService.js:138-179`).
- `tests/` — assertions ported from the overlap and recovery cases in
  `tests/scheduleService.test.js`, compiled with `-Wall -Wextra -Werror`, run via
  `make test`. This proves the trickiest-to-port logic before committing to a C
  rewrite.

---

## Deliverable 3 — Vue bundle budget measurement

Runs in `/tmp/opencode`, not the repo, so `package.json` is never modified. Copies
`client/` there with a minimal manifest listing only vite-side dependencies, which
sidesteps the node-v25 vs `engines: <21` mismatch and the `better-sqlite3` native-build
failure that a plain `npm install` would hit. Reports raw and gzipped totals for the
bundle with socket.io removed. Feeds the partition math in the study.

---

## Three decisions the study surfaces (need your call)

1. **Missed windows on reboot.** `runSchedules()` matches the *exact current minute*,
   so a boot at 06:01 never fires a 06:00 schedule; only `recoverRunningSchedules()`
   rescues schedules already marked `running`. Rare on a Pi, realistic on an ESP32 that
   brownout-resets or sits in a Wi-Fi reconnect loop. Recommend a grace window; needs
   a decision.

2. **DST fall-back double-fires.** Local `HH:mm` matching means the repeated 01:00 hour
   fires twice. `moment-timezone` does not prevent this either, so it is pre-existing
   and a faithful port reproduces it. Flag it; do not silently fix.

3. **Polling vs absolute next-fire epoch.** A minute-poll task can drift or skip;
   per-schedule epoch sleeping is more robust but is a behavior change. Recommend
   preserving poll semantics in the port, with epoch sleeping as a later upgrade.

---

## Go / no-go criteria

- **Go** if the gzipped Vue bundle is roughly <= 400 KB (keeps single-app + FS
  partition viable) **and** the ported core tests pass against the jest expectations.
- **Fall back to a minimal hand-written UI** if the bundle blows the budget. This is
  the one finding that would overturn the "keep Vue" choice.
- **Do not proceed** if the recovery/overlap logic cannot be expressed cleanly in pure
  C, since that would mean the rewrite is larger than the entire current codebase.

---

## Known limitation of this spike

The `pf_core` tests prove the *logic* ports cleanly, not that ESP-IDF will behave. In
particular, whether a slow WebSocket client can stall the HTTP server task — mirroring
the synchronous `broadcastUpdate()` call at `src/services/scheduleService.js:107` —
remains unverified and would be the first thing to test in phase two.
