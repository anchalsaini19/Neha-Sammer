// Royale - the invitation's config: the single source of truth for everything
// a host can edit. Loads their saved edits over the template defaults and
// exposes the shared helpers render.js / editor.js / ceremonies.js use.
//
// Modes (from the URL), as papercut and rose-invitation:
//   ?edit=1     - the host edits the invitation in place
//   ?preview=1  - the host previews it as a guest sees it
//   (nothing)   - the final invitation; ?to=Guest%20Name personalises it
(function () {
  const params = new URLSearchParams(location.search);
  const mode = params.has('edit') ? 'edit' : params.has('preview') ? 'preview' : 'view';

  // Trial (?trial=1) - the "try before you buy" sandbox on the marketplace.
  // The shopper gets the real editor, but only the opening card is unlocked:
  // the invocation and the couple's names. Everything past them is visible and
  // locked - enough to prove the experience, not enough to walk away with a
  // finished invitation. TRIAL_EDITABLE is the whole allowlist, and canEdit
  // below is the only thing that consults it.
  const trial = params.has('trial');
  const TRIAL_EDITABLE = ['invocation.religion', 'brideName', 'groomName'];

  // The trial gets its own storage key: it still has to persist (tapping
  // Preview navigates the page and the config is re-read on load), but it must
  // not write over the real key, or a shopper's trial edits would bleed into
  // the marketplace preview everyone else sees.
  const STORAGE_KEY = trial ? 'noorTrialConfig' : 'noorConfig';

  // ---- Opening invocation ----------------------------------------------
  // The same table papercut and rose-invitation offer, so a host meets the
  // identical choice in every template. Add a tradition, script or symbol in
  // one and add it to the others.
  const SYMBOLS = [
    { id: 'ganesha', label: 'Ganesha', src: 'symbols/_ganesha.svg' },
    { id: 'buddha', label: 'Buddha', src: '../symbols/_buddha.svg' },
    { id: 'sindhi', label: 'Jhulelal', src: '../symbols/_sindhi.svg' },
    { id: 'sikh', label: 'Ik Onkar', src: '../symbols/_sikh.svg' },
    { id: 'jain', label: 'Ahimsa symbol', src: '../symbols/_jain.svg' },
    { id: 'buddhist', label: 'Dharma wheel', src: '../symbols/_buddhist.svg' },
    { id: 'parsi', label: 'Faravahar', src: '../symbols/_parsi.svg' },
    { id: 'christian', label: 'Cross', src: 'symbols/_christian.svg' },
    { id: 'none', label: 'None', src: '' },
  ];

  const INVOCATIONS = {
    hindu: {
      label: 'Hindu',
      english: 'Shri Ganeshaya Namah',
      scripts: {
        devanagari: { label: 'Devanagari (Hindi/Marathi/Sanskrit/Nepali)', text: 'श्री गणेशाय नमः', font: 'Tiro Devanagari Sanskrit' },
        bengali: { label: 'Bengali', text: 'শ্রী গণেশায় নমঃ', font: 'Noto Sans Bengali' },
        gujarati: { label: 'Gujarati', text: 'શ્રી ગણેશાય નમઃ', font: 'Noto Sans Gujarati' },
        gurmukhi: { label: 'Gurmukhi (Punjabi)', text: 'ਸ਼੍ਰੀ ਗਣੇਸ਼ਾਯ ਨਮਃ', font: 'Noto Sans Gurmukhi' },
        odia: { label: 'Odia', text: 'ଶ୍ରୀ ଗଣେଶାୟ ନମଃ', font: 'Noto Sans Oriya' },
        tamil: { label: 'Tamil', text: 'ஸ்ரீ கணேசாய நமஹ', font: 'Noto Sans Tamil' },
        telugu: { label: 'Telugu', text: 'శ్రీ గణేశాయ నమః', font: 'Noto Sans Telugu' },
        kannada: { label: 'Kannada', text: 'ಶ್ರೀ ಗಣೇಶಾಯ ನಮಃ', font: 'Noto Sans Kannada' },
        malayalam: { label: 'Malayalam', text: 'ശ്രീ ഗണേശായ നമഃ', font: 'Noto Sans Malayalam' },
      },
    },
    sikh: {
      label: 'Sikh',
      english: 'Ik Onkar, Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh',
      scripts: {
        gurmukhi: { label: 'Gurmukhi', text: 'ੴ ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖ਼ਾਲਸਾ, ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫ਼ਤਹਿ', font: 'Noto Sans Gurmukhi' },
      },
    },
    sindhi: {
      label: 'Sindhi',
      english: 'Jay Jhulelal',
      scripts: {
        devanagari: { label: 'Devanagari', text: 'जय झूलेलाल', font: 'Tiro Devanagari Sanskrit' },
        sindhi: { label: 'Sindhi', text: 'جھولےلال جي', font: 'Noto Naskh Arabic', rtl: true },
      },
    },
    jain: {
      label: 'Jain',
      english: 'Namo Arihantanam',
      scripts: {
        devanagari: { label: 'Devanagari', text: 'णमो अरिहंताणं', font: 'Tiro Devanagari Sanskrit' },
      },
    },
    buddhist: {
      label: 'Buddhist',
      english: 'Buddham Sharanam Gachhami',
      scripts: {
        devanagari: { label: 'Devanagari', text: 'बुद्धं शरणं गच्छामि', font: 'Tiro Devanagari Sanskrit' },
      },
    },
    christian: {
      label: 'Christian',
      english: 'In the name of the Father, the Son, and the Holy Spirit',
      scripts: {},
    },
    muslim: {
      label: 'Muslim',
      english: 'Bismillah ir-Rahman ir-Raheem',
      scripts: {
        arabic: { label: 'Arabic', text: 'بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', font: 'Noto Naskh Arabic', rtl: true },
      },
    },
    parsi: {
      label: 'Parsi',
      english: 'Humata, Hukhta, Hvarshta',
      scripts: {},
    },
  };

  function symbolById(id) {
    for (let i = 0; i < SYMBOLS.length; i++) if (SYMBOLS[i].id === id) return SYMBOLS[i];
    return SYMBOLS[SYMBOLS.length - 1]; // 'none' - never the first artwork
  }

  /**
   * The one line the opening card shows, resolved from { religion, script }.
   * 'custom' is the host's own words; 'blank' is no line at all. A saved
   * religion or script that no longer exists falls back to the tradition's
   * first script rather than breaking the card.
   */
  function invocationLines(inv) {
    const sel = inv && inv.script;

    if (sel === 'custom') {
      return {
        religion: (inv && inv.religion) || 'hindu', script: 'custom',
        text: (inv && inv.custom) || '', font: '', rtl: false, isEnglish: false, isCustom: true,
      };
    }
    if (sel === 'blank') {
      return {
        religion: (inv && inv.religion) || 'hindu', script: 'blank',
        text: '', font: '', rtl: false, isEnglish: false, isBlank: true,
      };
    }

    const religion = INVOCATIONS[(inv && inv.religion)] ? inv.religion : 'hindu';
    const rel = INVOCATIONS[religion];
    const scriptKeys = Object.keys(rel.scripts);

    let chosen;
    if (sel === 'english') chosen = 'english';
    else if (sel && rel.scripts[sel]) chosen = sel;
    else chosen = scriptKeys.length ? scriptKeys[0] : 'english';

    if (chosen === 'english') {
      return { religion: religion, script: 'english', text: rel.english || '', font: '', rtl: false, isEnglish: true };
    }
    const scr = rel.scripts[chosen];
    return { religion: religion, script: chosen, text: scr.text, font: scr.font, rtl: !!scr.rtl, isEnglish: false };
  }

  // ---- Default wedding date ---------------------------------------------
  // 15 days out from whenever the invitation is created, as papercut: a fixed
  // date would eventually be in the past, and the date reveal and the ceremony
  // schedule would both open looking stale.
  function isoDaysFromNow(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // Pure calendar-component arithmetic (Date.UTC/getUTC*, no timezone
  // conversion): `new Date(iso)` reads a bare yyyy-mm-dd as UTC and lands a
  // day early anywhere west of Greenwich.
  function addDaysISO(iso, days) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return iso;
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    d.setUTCDate(d.getUTCDate() + days);
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
  }

  // The wedding date IS the Vivaah date - every other rite is scheduled
  // relative to it, in the order the rites actually run (the same offsets the
  // editor re-applies when the host moves the date).
  const VIVAAH_ISO = isoDaysFromNow(15);

  /**
   * The frames a gallery starts with. How many of them are taken depends on who
   * is looking, and the two readers want opposite things.
   *
   * A HOST opening the editor gets the first three - one portrait, one
   * landscape, one words card. Eight frames read as a fixed layout to be filled
   * in; three read as "these are the kinds, add what you want", which is what
   * the Add tile on the rail is for. The order below is why the cut is a plain
   * slice: the first three are already one of each.
   *
   * A SHOPPER previewing the template gets the lot. They are not filling
   * anything in - they are deciding whether they like it - and a full rope
   * shows the gallery doing what it was designed to do. Nobody edits this set,
   * so the generosity costs the host nothing: the moment they start editing,
   * their own three are what load.
   */
  const GALLERY_STARTERS = [
    { type: 'portrait', image: 'photos/couple_standing.jpg', placeholder: false, caption: '#HolyMatrimony', hang: 118 },
    { type: 'landscape', image: 'photos/couple_cake.jpg', placeholder: false, caption: '#SweetMoments', hang: 150 },
    { type: 'story', text: '“To whom God hath joined together, let no man put asunder.” (Matthew 19:6)', hang: 86 },
    { type: 'portrait', image: 'photos/couple_hands.jpg', placeholder: false, caption: '#BlessedTogether', hang: 132 },
    { type: 'landscape', image: 'photos/couple_candid.jpg', placeholder: false, caption: '#JoyAndLaughter', hang: 100 },
    { type: 'story', text: '“Love is patient, love is kind. It does not envy, it does not boast... Love never fails.” (1 Corinthians 13:4-8)', hang: 120 },
    { type: 'portrait', image: 'photos/couple_sunglasses.jpg', placeholder: false, caption: '#NehaAndSameer', hang: 150 },
    { type: 'landscape', image: 'photos/couple_casual.jpg', placeholder: false, caption: '#ForeverBegins', hang: 92 },
  ];

  const DEFAULTS = {
    version: 2,
    finalized: true,

    invocation: {
      symbol: 'christian',
      religion: 'christian',
      script: 'custom',
      custom: '“To whom God hath joined together, Let no man put asunder.” (Matthew 19:6)'
    },

    brideName: 'Neha',
    groomName: 'Sameer',
    title: 'Neha & Sameer',
    hostNames: ['Neha', 'Sameer'],

    introNote: 'Solicit your gracious presence with family on the auspicious occasion of the Holy Matrimony of…',

    eventISO: '2027-01-08',
    revealButton: 'Reveal the Wedding Date',
    revealAfter: 'Friday, 8th January 2027',

    groomFamily: {
      enabled: true,
      name: 'Sameer',
      relLabel: '1st Son of',
      parentA: 'Mrs. Teresa Tete',
      parentB: 'Late Mr. Devnish Tete',
      parentJoin: '&',
      grandLabel: 'Residence:',
      grandA: 'At - Bandarchuan, P.O. - Barwadihi, P.S. - Kolebira',
      grandB: 'Dist. - Simdega (Jharkhand)',
      grandJoin: ', ',
    },
    brideFamily: {
      enabled: true,
      name: 'Neha',
      relLabel: '3rd Daughter of',
      parentA: 'Mr. Sunil Bara',
      parentB: 'Mrs. Sunita / Monika Bara',
      parentJoin: '&',
      grandLabel: 'Residence:',
      grandA: 'At- Lungai, Tungritola, P.O. - Vedvyas, Rourkela - 769004',
      grandB: 'Dist. - Sundargarh (Odisha)',
      grandJoin: ', ',
    },

    gallery: {
      enabled: true,
      items: GALLERY_STARTERS,
    },

    ceremonies: [
      {
        name: 'Church Holy Marriage',
        art: 'photos/couple_standing.jpg',
        date: '2027-01-08',
        time: '10:00',
        venue: 'R. C. Church, Kalunga Parish',
        mapUrl: 'https://www.google.com/maps/search/?api=1&query=R+C+Church+Kalunga+Parish',
        enabled: true
      },
      {
        name: 'Chuman (Blessing Ceremony)',
        art: 'photos/couple_hands.jpg',
        date: '2027-01-08',
        time: '12:00',
        venue: 'At Residence, Lungai, Vedvyas',
        mapUrl: 'https://www.google.com/maps/search/?api=1&query=Lungai+Tungritola+Vedvyas+Rourkela',
        enabled: true
      },
      {
        name: 'Pritibhoj (Wedding Feast)',
        art: 'photos/couple_cake.jpg',
        date: '2027-01-08',
        time: '13:00',
        venue: 'At Residence, Lungai, Vedvyas',
        mapUrl: 'https://www.google.com/maps/search/?api=1&query=Lungai+Tungritola+Vedvyas+Rourkela',
        enabled: true
      }
    ],

    compliments: {
      enabled: true,
      lead: 'With Best Compliments From:',
      lines: [
        'Khusboo, Anchal, Mahek, Palak, Smit',
        'and All Bara Family',
        'R.S.V.P.: Mr. Sunil Bara & Mrs. Sunita / Monika Bara',
        'Phone: 9348174434, 6370820388'
      ],
    },

    note: {
      enabled: true,
      lead: 'A Scripture of Love & Blessing',
      text: '“Above all, love each other deeply, because love covers over a multitude of sins.” (1 Peter 4:8)\n\nWe warmly invite you and your family to join us as we pledge our holy covenant before God and celebrate this blessed day.',
    },

    farewell: {
      line: 'Your Presence Means the World to Us'
    },

    social: { instagram: false, instagramUrl: '' },

    music: { enabled: true, src: 'music/Jashn-e-bahara Instrumental.mp3', volume: 0.5 },
  };

  // Arrays are replaced wholesale rather than merged index by index, so an
  // invitation that has saved its own gallery or ceremonies keeps exactly what
  // it saved and never inherits a later default.
  function deepMerge(base, over) {
    if (Array.isArray(base) || Array.isArray(over)) return over !== undefined ? over : base;
    if (typeof base !== 'object' || base === null) return over !== undefined ? over : base;
    if (typeof over !== 'object' || over === null) return base;
    const out = {};
    Object.keys(base).forEach((k) => { out[k] = deepMerge(base[k], over[k]); });
    Object.keys(over).forEach((k) => { if (!(k in base)) out[k] = over[k]; });
    return out;
  }

  // Trial editing persists to the SERVER (a trial_drafts row keyed by the
  // shopper's browser), injected synchronously as window.__balconyTrial by
  // /try/noor/draft.js. Non-trial standalone editing uses localStorage
  // (dev/preview only; a purchased host saves over the platform bridge, which
  // platform-adapter.js installs in place of save() below).
  function load() {
    try {
      localStorage.removeItem('noorTrialConfig');
      localStorage.removeItem('noorConfig');
    } catch (_) {}
    return deepMerge(DEFAULTS, {});
  }

  // The flat fields the platform reads (see RoyaleRuntime) are derived from
  // the couple's names on every save, so they can never drift from them.
  function syncDerived() {
    const cfg = window.Royale.config;
    const bride = (cfg.brideName || '').trim();
    const groom = (cfg.groomName || '').trim();
    cfg.title = [bride, groom].filter(Boolean).join(' & ');
    cfg.hostNames = [bride, groom].filter(Boolean);
  }

  function save() {
    syncDerived();
    if (trial) {
      const t = window.__balconyTrial;
      if (!t || !t.saveUrl) return Promise.resolve(false);
      // `config`, and an Accept of JSON: the endpoint validates on that field
      // name, and without the header a validation failure comes back as a
      // redirect rather than a 422 - a silent no-save.
      return fetch(t.saveUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': t.csrf || '',
        },
        body: JSON.stringify({ config: window.Royale.config }),
        credentials: 'same-origin',
      }).then((r) => r.ok).catch(() => false);
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(window.Royale.config));
      return true;
    } catch (_) {
      return false;
    }
  }

  function reset() {
    if (trial) {
      const t = window.__balconyTrial;
      if (t && t.saveUrl) {
        fetch(t.saveUrl, {
          method: 'DELETE',
          headers: { 'X-CSRF-TOKEN': t.csrf || '' },
          credentials: 'same-origin',
        }).catch(() => {});
      }
      return;
    }
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) { /* ignore */ }
  }

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));

  const nl2br = (s) => esc(s).replace(/\n/g, '<br />');

  function guestName() {
    return (params.get('to') || '').trim().slice(0, 80);
  }

  // '2026-02-08' -> 'Sun, 8 Feb 2026' / '19:30' -> '7:30 PM', for the ceremony
  // cards and anything else that prints one of them.
  function fmtDate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return '';
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  function fmtTime(hhmm) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || ''));
    if (!m) return '';
    return new Date(2000, 0, 1, +m[1], +m[2])
      .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  /** An explicit maps link if the host set one, else a search for the venue. */
  function mapLink(c) {
    const own = ((c && c.mapUrl) || '').trim();
    if (own) return own;
    const venue = ((c && c.venue) || '').trim();
    return venue ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(venue) : '';
  }

  // ---- Ceremonies the couple adds themselves -------------------------------
  // Beyond the six rites the template ships with, a host may add up to this
  // many of their own (custom: true), each with a photo they upload in place
  // of the template's artwork. Keep in step with CUSTOM_CEREMONY_MAX in
  // EventEditorController, which refuses a save carrying more.
  //
  // An added ceremony carries a permanent `id`, which is its RSVP key (see
  // RoyaleRuntime::rsvpEvents). The six built-in ones keep the array position
  // they have always been keyed by, so nothing already replied to moves.
  const CUSTOM_CEREMONY_MAX = 5;

  // How far an added ceremony's photo may be zoomed out: below 1 it no
  // longer covers its area, so a cut-out picture can be shown whole. (Zooming
  // in stops at 3, as a gallery picture's does.)
  const CEREMONY_ZOOM_MIN = 0.3;

  /**
   * Does a guest see this ceremony? A built-in one unless the host switched it
   * off. An added one also needs its name and its photo: it has no artwork of
   * its own to fall back on, so until both are in it stays on the host's side.
   * The cards, the locations and calendar popups and the RSVP list all ask
   * this same question (the last in RoyaleRuntime, in PHP).
   */
  function ceremonyLive(c) {
    if (!c || c.enabled === false) return false;
    if (!c.custom) return true;
    return !!((c.art || '').trim() && (c.name || '').trim());
  }

  /**
   * The ceremonies in the order they happen - by date, then time - which is
   * how they are drawn. A copy: the stored array keeps its own order, since
   * that order is what the built-in ceremonies' RSVP keys are. No date sorts
   * last, no time first on its day; equal ones keep their stored order.
   */
  function ceremoniesByDate(list) {
    const when = (c) => (/^\d{4}-\d{2}-\d{2}$/.test(c.date || '') ? c.date : '9999-99-99') + ' ' + (c.time || '');
    return (Array.isArray(list) ? list : []).slice().sort((a, b) => when(a).localeCompare(when(b)));
  }

  window.Royale = {
    mode,
    trial,
    TRIAL_EDITABLE,
    /** Can this config path be edited in the current mode? */
    canEdit: function (path) {
      if (mode !== 'edit') return false;
      return trial ? TRIAL_EDITABLE.indexOf(path) !== -1 : true;
    },
    config: load(),
    DEFAULTS,
    SYMBOLS,
    INVOCATIONS,
    symbolById,
    invocationLines,
    STORAGE_KEY,
    addDaysISO,
    save,
    reset,
    syncDerived,
    esc,
    nl2br,
    guestName,
    fmtDate,
    fmtTime,
    mapLink,
    CUSTOM_CEREMONY_MAX,
    CEREMONY_ZOOM_MIN,
    ceremonyLive,
    ceremoniesByDate,
  };

  if (mode === 'edit') document.body.classList.add('is-editing');
  if (mode === 'preview') document.body.classList.add('is-previewing');
  if (trial) document.body.classList.add('is-trial');
})();
