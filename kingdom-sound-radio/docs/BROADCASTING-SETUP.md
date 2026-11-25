# Broadcasting setup (AzuraCast + Icecast + Liquidsoap)

The radio runs on its own server so the website can be updated, restarted or even go down without interrupting the broadcast.

## 1. Server

- A VPS with 2–4 vCPU, 4–8 GB RAM, 80+ GB SSD (recordings), Ubuntu LTS, and bandwidth sized to the audience (100 listeners × 128 kbps ≈ 12.8 Mbps ≈ 4.15 TB/month).
- Install AzuraCast with its official Docker installer. Put `studio.<domain>` and `stream.<domain>` on it with HTTPS (AzuraCast can manage Let's Encrypt).
- Lock down the control panel (strong admin password, 2FA in AzuraCast, firewall SSH to known IPs).

## 2. Station configuration

1. Create the station (short name e.g. `kingdom_sound`), time zone **America/New_York** (match the website).
2. **Mount points / bitrates**: low (~64 kbps AAC or MP3), standard (128 kbps MP3), high (192 kbps MP3). Enable HTTPS mounts.
3. **AutoDJ**: upload licensed music, build playlists (worship, general rotation), schedule playlists by time block.
4. **Fallback**: configure a fallback file/playlist so dead air never happens if a presenter disconnects.
5. **Streamers/DJs**: one account per presenter (unique credentials); enable "record live broadcasts" so each live show is saved.
6. **Jingles / station IDs / ads**: create interval playlists (e.g. every 4 songs) for IDs and approved sponsor spots.
7. **Emergency override**: keep an admin streamer account for urgent broadcasts.

Presenters connect with broadcasting software (e.g. BUTT, Mixxx, or OBS audio output) using their streamer credentials. Video simulcasts go from **OBS directly to YouTube via RTMPS** — not through the website.

## 3. Connect the website

In **Admin → Broadcasting**:

1. **Stream endpoints**: add each public HTTPS mount URL with its bitrate; mark the 128 kbps one as default. Test with "Listen live" on the site.
2. **Broadcasting engine**: provider *AzuraCast*, base URL `https://studio.<domain>`, station short name. The dashboard then shows online/offline, current listeners, live presenter and current track — all read from AzuraCast's public now-playing API.
3. Optional: in AzuraCast add a **Generic Web Hook** to `https://<domain>/api/v1/webhooks/radio` with header `X-Webhook-Token: <RADIO_WEBHOOK_SECRET>` so online/offline and DJ connect events land in the audit log.

## 4. Recordings → replays

Current build: staff download a recording from AzuraCast and upload it on **Admin → Episodes & media → New episode**. It starts as *awaiting review*, stays private, and can only be published after the rights checkbox is confirmed.

Planned (worker phase): import AzuraCast recordings automatically, normalise loudness with FFmpeg (EBU R128), transcribe, draft chapters, and create the draft episode linked to its broadcast occurrence.

## 5. Directories

Submit the default HTTPS stream URL, square artwork and description to TuneIn, Radio Garden, Radio.net and Zeno.FM. Acceptance is each directory's decision. Once a listing is live, add its URL in **Admin → Integrations** and click **I tested it**.

## 6. Licensing reminder

Internet streaming of music requires licences (e.g. SoundExchange for sound recordings in the US; ASCAP/BMI/SESAC/GMR for compositions), and live-broadcast licences do **not** automatically cover podcasts or downloads. Confirm before launch.
