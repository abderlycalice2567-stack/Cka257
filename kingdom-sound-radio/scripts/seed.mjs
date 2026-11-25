// Seeds clearly-labelled SAMPLE content for development and previews.
// Every row created here has is_sample = true (or lives in a sample-only
// table row) and can be removed from Admin → Launch readiness → "Remove sample
// content". Never run against production.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import postgres from "postgres";
import { loadEnv } from "./env.mjs";

loadEnv();
if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed sample content in production");
const urlIdx = process.argv.indexOf("--url");
const url = urlIdx >= 0 ? process.argv[urlIdx + 1] : process.env.DATABASE_URL;
const withAudio = !process.argv.includes("--no-audio");
const sql = postgres(url, { onnotice: () => {} });
const MEDIA_DIR = path.resolve(process.env.MEDIA_DIR || "./data/media");

const tr = (en, fr, ht) => ({ en, fr, ...(ht ? { ht } : {}) });

async function main() {
  const existing = await sql`SELECT count(*)::int AS n FROM stations`;
  if (existing[0].n > 0) {
    console.log("database already seeded — run `npm run db:reset` to start over");
    return;
  }

  const [station] = await sql`
    INSERT INTO stations (slug, name, tagline, timezone, default_locale)
    VALUES ('kingdom-sound', 'The Kingdom Sound Radio',
      ${sql.json(tr("Broadcasting Faith. Connecting Communities. Transforming Lives.",
                    "Diffuser la foi. Unir les communautés. Transformer des vies.",
                    "Nou difize lafwa. Nou konekte kominote. Nou transfòme lavi."))},
      'America/New_York', 'en')
    RETURNING id`;
  void station;

  // ------------------------------------------------------------ categories
  const cats = [
    ["evangelism", "Evangelism & Sermons", "Évangélisation et prédications", "Evanjelizasyon ak Prèch"],
    ["prayer", "Prayer & Intercession", "Prière et intercession", "Lapriyè ak Entèsesyon"],
    ["worship", "Praise & Worship", "Louange et adoration", "Lwanj ak Adorasyon"],
    ["bible-study", "Bible Study", "Étude biblique", "Etid Biblik"],
    ["society", "Society & Culture", "Société et culture", "Sosyete ak Kilti"],
    ["family", "Marriage & Family", "Couple et famille", "Maryaj ak Fanmi"],
    ["youth", "Youth & Education", "Jeunesse et éducation", "Jèn ak Edikasyon"],
    ["business", "Christian Entrepreneurship", "Entrepreneuriat chrétien", "Antreprenarya Kretyen"],
    ["news", "News & Current Affairs", "Actualités", "Nouvèl ak Aktyalite"],
    ["health", "Health & Wellness", "Santé et bien-être", "Sante ak Byennèt"],
    ["testimonies", "Testimonies", "Témoignages", "Temwayaj"],
    ["interviews", "Interviews", "Entretiens", "Entèvyou"],
    ["community", "Community Development", "Développement communautaire", "Devlopman Kominotè"],
    ["leadership", "Leadership", "Leadership", "Lidèchip"],
    ["music", "Christian Music", "Musique chrétienne", "Mizik Kretyen"],
    ["special", "Special Events", "Événements spéciaux", "Evènman Espesyal"],
  ];
  const catId = {};
  for (const [i, [slug, en, fr, ht]] of cats.entries()) {
    const [r] = await sql`INSERT INTO categories (slug, name, sort) VALUES (${slug}, ${sql.json(tr(en, fr, ht))}, ${i}) RETURNING id`;
    catId[slug] = r.id;
  }

  // ------------------------------------------------------------ presenters
  // Placeholder profiles only — real presenter names, photos and biographies
  // must come from the station.
  const presenters = [
    ["morning-host", "Morning Host", tr("Morning show host", "Animateur du matin", "Animatè maten")],
    ["teaching-host", "Bible Teacher", tr("Bible teaching", "Enseignement biblique", "Ansèyman biblik")],
    ["prayer-host", "Prayer Ministry Lead", tr("Prayer ministry", "Ministère de prière", "Ministè lapriyè")],
    ["culture-host", "Talk Show Host", tr("Society & culture", "Société et culture", "Sosyete ak kilti")],
    ["youth-host", "Youth Host", tr("Youth programming", "Programmes jeunesse", "Pwogram jèn")],
  ];
  const sampleBio = tr(
    "Sample profile. Replace with the presenter's approved name, photograph and biography before launch.",
    "Profil d'exemple. À remplacer par le nom, la photo et la biographie approuvés de l'animateur avant le lancement.",
    "Pwofil egzanp. Ranplase l ak non, foto ak biyografi animatè a apwouve anvan lansman."
  );
  const presId = {};
  for (const [slug, name, title] of presenters) {
    const [r] = await sql`INSERT INTO presenters (slug, display_name, title, bio, is_sample)
      VALUES (${slug}, ${name}, ${sql.json(title)}, ${sql.json(sampleBio)}, true) RETURNING id`;
    presId[slug] = r.id;
  }

  // ------------------------------------------------------------ programs
  const programs = [
    {
      slug: "morning-light", cat: "worship", host: "morning-host", featured: true, langs: ["en", "fr"],
      title: tr("Morning Light", "Lumière du matin", "Limyè Maten"),
      summary: tr("Start the day with worship, scripture and encouragement.", "Commencez la journée avec la louange, la Parole et l'encouragement.", "Kòmanse jounen an ak lwanj, Pawòl la ak ankourajman."),
    },
    {
      slug: "the-word-today", cat: "bible-study", host: "teaching-host", featured: true, langs: ["en"],
      title: tr("The Word Today", "La Parole aujourd'hui", "Pawòl la Jodi a"),
      summary: tr("Verse-by-verse Bible teaching applied to everyday life.", "Un enseignement biblique verset par verset, appliqué au quotidien.", "Ansèyman biblik vèsè pa vèsè pou lavi chak jou."),
    },
    {
      slug: "midday-prayer", cat: "prayer", host: "prayer-host", featured: false, langs: ["en", "fr", "ht"],
      title: tr("Midday Prayer", "Prière de midi", "Lapriyè Midi"),
      summary: tr("A daily hour of prayer and intercession for listeners and nations.", "Une heure quotidienne de prière et d'intercession pour les auditeurs et les nations.", "Yon èdtan lapriyè chak jou pou moun k ap koute yo ak nasyon yo."),
    },
    {
      slug: "kingdom-conversations", cat: "society", host: "culture-host", featured: true, langs: ["en", "fr"],
      title: tr("Kingdom Conversations", "Conversations du Royaume", "Konvèsasyon Wayòm nan"),
      summary: tr("Faith-centred discussion on the social and cultural questions of our time.", "Des échanges ancrés dans la foi sur les questions sociales et culturelles de notre temps.", "Diskisyon ki baze sou lafwa sou kesyon sosyal ak kiltirèl tan nou an."),
    },
    {
      slug: "family-matters", cat: "family", host: "culture-host", featured: false, langs: ["en"],
      title: tr("Family Matters", "Affaires de famille", "Zafè Fanmi"),
      summary: tr("Practical, biblical conversations for couples and parents.", "Des conversations pratiques et bibliques pour les couples et les parents.", "Konvèsasyon pratik ak biblik pou koup ak paran."),
    },
    {
      slug: "night-worship", cat: "music", host: "morning-host", featured: false, langs: ["en", "fr", "ht"],
      title: tr("Night Worship", "Adoration du soir", "Adorasyon Leswa"),
      summary: tr("An evening of uninterrupted praise and worship music.", "Une soirée de louange et d'adoration sans interruption.", "Yon aswè lwanj ak adorasyon san rete."),
    },
    {
      slug: "next-generation", cat: "youth", host: "youth-host", featured: true, langs: ["en", "fr"],
      title: tr("Next Generation", "Nouvelle génération", "Nouvo Jenerasyon"),
      summary: tr("Faith, purpose and real questions from young listeners.", "La foi, la vocation et les vraies questions des jeunes auditeurs.", "Lafwa, objektif ak vrè kesyon jèn yo."),
    },
    {
      slug: "faith-at-work", cat: "business", host: "teaching-host", featured: false, langs: ["en"],
      title: tr("Faith at Work", "La foi au travail", "Lafwa nan Travay"),
      summary: tr("Integrity, stewardship and calling in business and careers.", "Intégrité, gestion et vocation dans les affaires et la carrière.", "Entegrite, jesyon ak vokasyon nan biznis ak karyè."),
    },
    {
      slug: "sunday-service", cat: "evangelism", host: "teaching-host", featured: false, langs: ["en", "fr"],
      title: tr("Sunday Service Broadcast", "Culte du dimanche", "Kilt Dimanch"),
      summary: tr("A weekly broadcast of worship and preaching.", "Une diffusion hebdomadaire de louange et de prédication.", "Yon emisyon chak semèn ak lwanj ak predikasyon."),
    },
  ];
  const progId = {};
  for (const p of programs) {
    const desc = tr(
      `${p.summary.en} (Sample program description — replace with the station's approved copy.)`,
      `${p.summary.fr} (Description d'exemple — à remplacer par le texte approuvé de la station.)`,
      `${p.summary.ht} (Deskripsyon egzanp — ranplase l ak tèks estasyon an apwouve.)`
    );
    const [r] = await sql`INSERT INTO programs
      (slug, title, summary, description, category_id, languages, featured, status, podcast_enabled, podcast_author, is_sample)
      VALUES (${p.slug}, ${sql.json(p.title)}, ${sql.json(p.summary)}, ${sql.json(desc)}, ${catId[p.cat]},
              ${p.langs}, ${p.featured}, 'published', true, 'The Kingdom Sound Radio', true)
      RETURNING id`;
    progId[p.slug] = r.id;
    await sql`INSERT INTO program_presenters (program_id, presenter_id) VALUES (${r.id}, ${presId[p.host]})`;
  }

  // ------------------------------------------------------------ schedule (station local time)
  const sched = [
    ["morning-light", [1, 2, 3, 4, 5], "06:00", 120, false],
    ["the-word-today", [1, 2, 3, 4, 5], "09:00", 60, false],
    ["midday-prayer", [1, 2, 3, 4, 5, 6], "12:00", 60, false],
    ["kingdom-conversations", [1, 3, 5], "18:00", 60, false],
    ["family-matters", [2, 4], "18:00", 60, false],
    ["night-worship", [0, 1, 2, 3, 4, 5, 6], "21:00", 120, false],
    ["next-generation", [6], "10:00", 90, false],
    ["faith-at-work", [6], "15:00", 60, false],
    ["sunday-service", [0], "09:00", 180, false],
    ["kingdom-conversations", [0], "18:00", 60, true],
  ];
  for (const [slug, days, start, dur, rebroadcast] of sched) {
    await sql`INSERT INTO broadcast_schedules (program_id, weekdays, start_time, duration_minutes, valid_from, is_rebroadcast)
      VALUES (${progId[slug]}, ${days}, ${start}, ${dur}, CURRENT_DATE - 30, ${rebroadcast})`;
  }
  const n = await sql`SELECT materialize_occurrences(NULL, 21) AS n`;
  console.log("occurrences", n[0].n);

  // ------------------------------------------------------------ sample audio
  const audioIds = [];
  if (withAudio) {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
    const chords = [[220, 277.18, 329.63], [196, 246.94, 293.66], [174.61, 220, 261.63]];
    for (const [i, freqs] of chords.entries()) {
      const key = `audio/sample-tone-${i + 1}-${crypto.randomBytes(4).toString("hex")}.mp3`;
      const out = path.join(MEDIA_DIR, key);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      const inputs = freqs.flatMap((f) => ["-f", "lavfi", "-i", `sine=f=${f}:d=75`]);
      execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...inputs, "-filter_complex",
        `amix=inputs=${freqs.length},volume=0.18,tremolo=f=0.25:d=0.4,afade=t=in:d=4,afade=t=out:st=68:d=7`,
        "-c:a", "libmp3lame", "-b:a", "96k", out]);
      const bytes = fs.statSync(out).size;
      const [a] = await sql`INSERT INTO media_assets (kind, storage_key, mime_type, bytes, duration_seconds, original_name)
        VALUES ('audio', ${key}, 'audio/mpeg', ${bytes}, 75, ${`sample-tone-${i + 1}.mp3`}) RETURNING id`;
      audioIds.push(a.id);
    }
  }

  // ------------------------------------------------------------ episodes
  const day = 86400000;
  const eps = [
    ["the-word-today", "walking-in-faith", "Walking in Faith — Hebrews 11", "en", "published", ["Hebrews 11:1-6"], ["faith"], 2],
    ["the-word-today", "the-good-shepherd", "The Good Shepherd — Psalm 23", "en", "published", ["Psalm 23"], ["comfort", "trust"], 5],
    ["kingdom-conversations", "faith-in-difficult-times", "Faith in Difficult Times", "en", "published", ["Romans 8:28"], ["hope", "society"], 3],
    ["kingdom-conversations", "foi-et-societe", "Foi et société", "fr", "published", ["Matthieu 5:13-16"], ["société"], 7],
    ["family-matters", "building-a-praying-home", "Building a Praying Home", "en", "published", ["Joshua 24:15"], ["family", "prayer"], 4],
    ["next-generation", "purpose-and-calling", "Purpose and Calling", "en", "published", ["Jeremiah 29:11"], ["youth", "calling"], 6],
    ["faith-at-work", "stewardship-in-business", "Stewardship in Business", "en", "published", ["Colossians 3:23"], ["work"], 9],
    ["midday-prayer", "priere-pour-les-nations", "Prière pour les nations", "fr", "published", ["1 Timothée 2:1-2"], ["prière"], 1],
    ["morning-light", "new-mercies", "New Mercies Every Morning", "en", "awaiting_review", ["Lamentations 3:22-23"], ["worship"], 0],
    ["sunday-service", "the-sower", "The Parable of the Sower", "en", "processing", ["Matthew 13:1-23"], ["sermon"], 0],
  ];
  for (const [i, [prog, slug, title, lang, status, refs, topics, ago]] of eps.entries()) {
    const published = status === "published";
    const audio = published && audioIds.length ? audioIds[i % audioIds.length] : null;
    const air = new Date(Date.now() - (ago || 1) * day);
    const description = lang === "fr"
      ? "Épisode d'exemple. L'audio est une tonalité d'essai générée — à remplacer par l'enregistrement réel après vérification des droits."
      : "Sample episode. The audio is a generated test tone — replace it with the real recording after the rights review.";
    const [e] = await sql`INSERT INTO episodes
      (program_id, number, slug, title, description, language, status, original_air_date, published_at,
       audio_asset_id, duration_seconds, scripture_refs, topics, rights_confirmed, is_sample, transcript)
      VALUES (${progId[prog]}, ${i + 1}, ${slug}, ${title}, ${description}, ${lang}, ${status}, ${air},
              ${published ? air : null}, ${audio}, ${audio ? 75 : null}, ${refs}, ${topics}, ${published}, true,
              ${published ? "Sample transcript placeholder. Transcripts are generated or uploaded per episode and reviewed before publication." : null})
      RETURNING id`;
    if (audio) {
      await sql`INSERT INTO episode_chapters (episode_id, start_seconds, title) VALUES
        (${e.id}, 0, 'Opening'), (${e.id}, 25, 'Scripture reading'), (${e.id}, 50, 'Reflection')`;
    }
  }

  // ------------------------------------------------------------ devotionals (public-domain texts)
  const verses = [
    ["Psalm 46:1", "God is our refuge and strength, a very present help in trouble.", "Psaume 46:2", "Dieu est pour nous un refuge et un appui, Un secours qui ne manque jamais dans la détresse.", "Sòm 46:1"],
    ["Isaiah 40:31", "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.", "Ésaïe 40:31", "Mais ceux qui se confient en l'Éternel renouvellent leur force. Ils prennent le vol comme les aigles; Ils courent, et ne se lassent point, Ils marchent, et ne se fatiguent point.", "Ezayi 40:31"],
    ["Philippians 4:6", "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.", "Philippiens 4:6", "Ne vous inquiétez de rien; mais en toute chose faites connaître vos besoins à Dieu par des prières et des supplications, avec des actions de grâces.", "Filipyen 4:6"],
    ["Joshua 1:9", "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.", "Josué 1:9", "Ne t'ai-je pas donné cet ordre: Fortifie-toi et prends courage? Ne t'effraie point et ne t'épouvante point, car l'Éternel, ton Dieu, est avec toi dans tout ce que tu entreprendras.", "Jozye 1:9"],
    ["Romans 15:13", "Now the God of hope fill you with all joy and peace in believing, that ye may abound in hope, through the power of the Holy Ghost.", "Romains 15:13", "Que le Dieu de l'espérance vous remplisse de toute joie et de toute paix dans la foi, pour que vous abondiez en espérance, par la puissance du Saint-Esprit!", "Women 15:13"],
    ["Lamentations 3:22-23", "It is of the LORD's mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.", "Lamentations 3:22-23", "Les bontés de l'Éternel ne sont pas épuisées, Ses compassions ne sont pas à leur terme; Elles se renouvellent chaque matin. Oh! que ta fidélité est grande!", "Lamantasyon 3:22-23"],
    ["Psalm 119:105", "Thy word is a lamp unto my feet, and a light unto my path.", "Psaume 119:105", "Ta parole est une lampe à mes pieds, Et une lumière sur mon sentier.", "Sòm 119:105"],
  ];
  for (let d = -7; d <= 7; d++) {
    const v = verses[(d + 70) % verses.length];
    const date = new Date(Date.now() + d * day).toISOString().slice(0, 10);
    await sql`INSERT INTO devotionals (day, locale, title, scripture_ref, scripture_text, translation, body, is_sample) VALUES
      (${date}, 'en', 'Daily encouragement', ${v[0]}, ${v[1]}, 'KJV (public domain)',
       'Sample devotional text. The station''s editorial team writes and approves each daily reflection.', true),
      (${date}, 'fr', 'Encouragement du jour', ${v[2]}, ${v[3]}, 'Louis Segond 1910 (domaine public)',
       'Texte de méditation d''exemple. L''équipe éditoriale de la station rédige et approuve chaque méditation.', true),
      (${date}, 'ht', 'Ankourajman jodi a', ${v[4]}, '', '',
       'Tèks egzanp. Ekip editoryal estasyon an ap ekri epi apwouve chak meditasyon. Tèks vèsè an kreyòl la ap tann yon tradiksyon ki gen lisans.', true)`;
  }

  // ------------------------------------------------------------ articles
  const arts = [
    ["welcome-to-the-kingdom-sound", "en", "Welcome to The Kingdom Sound Radio", "announcements", "A first look at the new home of our broadcasts, podcasts and community.", 1],
    ["how-to-listen-everywhere", "en", "How to listen on any device", "guides", "Listen live in the browser, install the app on your phone, or follow our podcasts.", 3],
    ["community-prayer-network", "en", "Building a community prayer network", "community", "How listeners can submit requests and how our prayer team handles them confidentially.", 6],
    ["bienvenue", "fr", "Bienvenue sur The Kingdom Sound Radio", "announcements", "Un premier aperçu de la nouvelle maison de nos émissions, podcasts et communauté.", 1],
    ["ecouter-partout", "fr", "Écouter sur tous vos appareils", "guides", "Écoutez en direct dans le navigateur, installez l'application ou suivez nos podcasts.", 3],
    ["byenveni", "ht", "Byenveni sou The Kingdom Sound Radio", "announcements", "Yon premye koudèy sou nouvo kay emisyon, podkas ak kominote nou an.", 1],
  ];
  for (const [slug, locale, title, category, excerpt, ago] of arts) {
    const body = locale === "en"
      ? `${excerpt}\n\n## Sample article\n\nThis is placeholder editorial content created for the preview. The station's editors replace it with approved articles from **Admin → Content**.\n\n- Articles support headings, lists, **bold** text and links.\n- Each article is written per language.`
      : locale === "fr"
        ? `${excerpt}\n\n## Article d'exemple\n\nContenu éditorial provisoire créé pour l'aperçu. Les éditeurs de la station le remplacent depuis **Admin → Contenu**.`
        : `${excerpt}\n\n## Atik egzanp\n\nKontni pwovizwa pou apèsi a. Editè estasyon an ap ranplase l nan **Admin → Kontni**.`;
    await sql`INSERT INTO articles (slug, locale, title, excerpt, body, category, status, published_at, is_sample)
      VALUES (${slug}, ${locale}, ${title}, ${excerpt}, ${body}, ${category}, 'published', ${new Date(Date.now() - ago * day)}, true)`;
  }

  // ------------------------------------------------------------ events
  const evs = [
    ["community-worship-night", tr("Community Worship Night", "Soirée de louange communautaire", "Swa Lwanj Kominotè"), "concert", 12, true],
    ["family-conference", tr("Family & Marriage Conference", "Conférence couple et famille", "Konferans Fanmi ak Maryaj"), "conference", 26, true],
    ["special-broadcast-prayer", tr("24-Hour Prayer Broadcast", "Diffusion spéciale : 24 h de prière", "Emisyon Espesyal: 24 èdtan Lapriyè"), "special", 40, false],
  ];
  for (const [slug, title, kind, inDays, reg] of evs) {
    await sql`INSERT INTO events (slug, title, description, kind, starts_at, ends_at, location, registration_enabled, capacity, status, is_sample)
      VALUES (${slug}, ${sql.json(title)},
        ${sql.json(tr("Sample event. Dates, venue and details are placeholders.", "Événement d'exemple. Dates, lieu et détails provisoires.", "Evènman egzanp. Dat, kote ak detay yo pwovizwa."))},
        ${kind}, ${new Date(Date.now() + inDays * day)}, ${new Date(Date.now() + inDays * day + 3 * 3600000)},
        'Location to be announced', ${reg}, ${reg ? 150 : null}, 'published', true)`;
  }

  // ------------------------------------------------------------ pages (templates needing owner review)
  const pages = {
    about: ["About us", "À propos", "Konsènan nou",
      "The Kingdom Sound Radio is a socio-evangelical digital broadcasting network sharing the Gospel, strengthening communities and connecting listeners worldwide.\n\n## Listen · Discover · Connect\n\n- **Listen** — continuous live radio, Christian music, prayer and worship.\n- **Discover** — programs, podcasts, previous broadcasts and educational content.\n- **Connect** — faith, community, testimonies and fellowship.\n\n*Sample page — the station's approved story, history and leadership replace this text.*"],
    mission: ["Mission & vision", "Mission et vision", "Misyon ak vizyon",
      "## Mission\n\nTo spread the Gospel, promote Christian values and address the social questions facing families and communities.\n\n## Vision\n\nA modern, internationally accessible Christian media network with radio as its foundation.\n\n*Sample page — to be confirmed by station leadership.*"],
    leadership: ["Leadership", "Direction", "Lidèchip",
      "Leadership profiles will be published once names, roles and photographs are approved by the station.\n\n*No leadership information has been invented for this preview.*"],
    faq: ["Frequently asked questions", "Questions fréquentes", "Kesyon yo poze souvan",
      "## Do I need an account to listen?\n\nNo. Live radio, schedules and public replays are free and open to everyone. An account lets you save episodes, follow programs and resume where you left off.\n\n## Can I listen on my phone?\n\nYes. Open the site in your phone's browser and use \"Add to Home Screen\" to install it like an app.\n\n## How are prayer requests handled?\n\nPrivate requests are only visible to authorised prayer team members. Nothing is published without your choice and moderation.\n\n*Sample answers — to be reviewed by the station.*"],
    privacy: ["Privacy policy", "Politique de confidentialité", "Politik konfidansyalite",
      "**Template — requires review by the station and, where appropriate, legal counsel before launch.**\n\n## What we collect\n\n- Account details you provide (name, email, language).\n- Listening activity when you are signed in (favorites, progress, history).\n- Submissions you choose to send (prayer requests, testimonies, contact messages).\n\n## How we protect it\n\nSensitive submissions are restricted to authorised staff and kept only as long as needed. Payments are processed by our payment provider; we never store card numbers.\n\n## Your rights\n\nYou can export your data or delete your account from **Account → Privacy** at any time."],
    terms: ["Terms and conditions", "Conditions d'utilisation", "Kondisyon itilizasyon",
      "**Template — requires review by the station and legal counsel before launch.**\n\nBy using this website you agree to use community features respectfully. Content may be moderated. Broadcast content remains the property of its respective rights holders."],
    accessibility: ["Accessibility statement", "Déclaration d'accessibilité", "Deklarasyon aksesibilite",
      "We aim to meet WCAG 2.2 level AA. The site supports keyboard navigation, screen readers, reduced motion, light and dark themes, and transcripts where available.\n\nIf you encounter a barrier, please tell us through the contact page.\n\n*Formal accessibility testing has not yet been completed for this preview.*"],
  };
  for (const [slug, [en, fr, ht, body]] of Object.entries(pages)) {
    await sql`INSERT INTO pages (slug, locale, title, body, is_sample) VALUES
      (${slug}, 'en', ${en}, ${body}, true),
      (${slug}, 'fr', ${fr}, ${"*Traduction française à fournir par la station.*\n\n" + body}, true),
      (${slug}, 'ht', ${ht}, ${"*Tradiksyon kreyòl la ap vini.*\n\n" + body}, true)`;
  }

  await sql`INSERT INTO fundraising_campaigns (slug, title, goal_cents, is_sample)
    VALUES ('studio-equipment', ${sql.json(tr("Studio equipment fund", "Fonds d'équipement du studio", "Fon ekipman estidyo"))}, NULL, true)`;

  console.log("sample content seeded");
}

try {
  await main();
} finally {
  await sql.end();
}
