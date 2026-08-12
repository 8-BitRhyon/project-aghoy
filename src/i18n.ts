// === AGHOY LOCALIZATION ===
// The language toggle was cosmetic: it only affected the AI chat, not the UI,
// consent, or recovery copy. This module makes the critical, life-saving copy
// actually localizable. Covers the strings a panicking user must understand
// immediately. Keyed by string id; falls back to Taglish (the de-facto PH
// safety language) when a dialect lacks an entry.

export type AghoyLang = 'TAGALOG' | 'BISAYA' | 'ILOCANO' | 'ENGLISH';

export type CopyKey =
  | 'oneRule'
  | 'consentTitle'
  | 'consentBody'
  | 'consentAccept'
  | 'consentDecline'
  | 'scanButton'
  | 'pasteHere'
  | 'freezeFunds'
  | 'freezeSub'
  | 'saveEvidence'
  | 'reportIt'
  | 'iLostMoney'
  | 'didYouSendMoney'
  | 'yesSent'
  | 'noNotYet'
  | 'callNow'
  | 'callScript'
  | 'deletedEvidence'
  | 'timeFrameNow'
  | 'timeFrameToday'
  | 'timeFrameThisWeek'
  | 'reportedTimes'
  | 'dontReply';

export const COPY: Record<AghoyLang, Partial<Record<CopyKey, string>>> = {
  TAGALOG: {
    oneRule: "SCAM 'YAN. WAG MAG-REPLY. WAG IBIGAY ANG OTP (ang 6-digit code). Walang bangko, walang GCash, walang gobyerno na hihingi ng OTP mo. KAILANMAN.",
    consentTitle: 'PROTEKTAHAN ANG PAMILYA MO. PROTEKTAHAN ANG PRIVACY MO.',
    consentBody: 'Para ma-check ang text mo, ipapadala ito sa AI scanner. Tinatanggal ang numero mo, ID, at OTP bago ipadala. Walang account, walang ibinebenta. Ever.',
    consentAccept: 'OO, TULOY',
    consentDecline: 'HINDI MUNA',
    scanButton: 'I-CHECK ANG TEXT',
    pasteHere: 'May text ka na kahina-hinala? I-paste o kunan ng larawan dito.',
    freezeFunds: 'I-LOCK ANG ACCOUNT KO',
    freezeSub: 'Tawagan ang bangko/wallet ngayon. Sabihin: i-lock ang lahat ng account ko.',
    saveEvidence: 'MAG-SAVE NG EVIDENCE',
    reportIt: 'ISUMBONG',
    iLostMoney: 'NA-SCAM NA PO AKO / NALOKO NA AKO',
    didYouSendMoney: 'Nagpadala ka na ba ng pera o nagbigay ng code?',
    yesSent: 'OO, nagpadala ako',
    noNotYet: 'HINDI PA',
    callNow: 'TAWAGAN NGAYON',
    callScript: "Sabihin sa hotline: 'Na-scam po ako. Pakilock po ang lahat ng account ko at i-report ang transaction. Humihingi po ako ng reference number.'",
    deletedEvidence: 'Na-delete mo na ang text? OK lang. Ipakita pa rin sa bank app mo ang transfer, at nasa call log mo ang numero. I-screenshot ang dalawang iyon.',
    timeFrameNow: 'NGAYON NA',
    timeFrameToday: 'NGAYONG ARAW',
    timeFrameThisWeek: 'SA WEEK NA ITO',
    reportedTimes: 'ang numero na ito ay na-report na',
    dontReply: 'WAG KA MAG-REPLY. WAG KANG MANINIWALA.',
  },
  ENGLISH: {
    oneRule: "This is a scam. Do not reply. Do not give your OTP (the 6-digit code). No bank, no wallet, no government office ever asks for your OTP. Ever.",
    consentTitle: 'PROTECT YOUR FAMILY. PROTECT YOUR PRIVACY.',
    consentBody: 'To check your text, it is sent to an AI scanner. Your number, ID, and OTP are removed before sending. No account, no data sold. Ever.',
    consentAccept: 'YES, CONTINUE',
    consentDecline: 'NOT NOW',
    scanButton: 'CHECK THE MESSAGE',
    pasteHere: 'Got a suspicious message? Paste it or take a photo here.',
    freezeFunds: 'FREEZE MY ACCOUNT',
    freezeSub: 'Call your bank/wallet now. Say: lock all my accounts.',
    saveEvidence: 'SAVE EVIDENCE',
    reportIt: 'REPORT IT',
    iLostMoney: "I ALREADY LOST MONEY",
    didYouSendMoney: 'Did you already send money or share a code?',
    yesSent: 'YES, I SENT MONEY',
    noNotYet: 'NOT YET',
    callNow: 'CALL NOW',
    callScript: "Tell the hotline: 'I have been scammed. Please lock all my accounts and report the transaction. I want a reference number.'",
    deletedEvidence: 'You deleted the text? That is okay. Your bank app still shows the transfer, and your call log still shows the number. Screenshot those two.',
    timeFrameNow: 'NOW',
    timeFrameToday: 'TODAY',
    timeFrameThisWeek: 'THIS WEEK',
    reportedTimes: 'this number has been reported',
    dontReply: 'DO NOT REPLY. DO NOT TRUST IT.',
  },
  BISAYA: {
    oneRule: "SCAM NA. AYAW MOTO TUBAGAN. AYAW IHATAG ANG OTP (ang 6-digit code). WALAY bangko, walay GCash, walay gobyerno nga mangayo sa imong OTP. KANUS-ON MAN.",
    consentTitle: 'PANALIPUD ANG PAMILYA. PANALIPUD ANG PRIVACY.',
    consentBody: 'Para ma-check ang text, ipadala kini sa AI scanner. Tangtangon ang numero, ID, ug OTP una ipadala. Walay account, walay baligya. Ever.',
    consentAccept: 'OO, PADAYON',
    consentDecline: 'DILI PA',
    scanButton: 'I-CHECK ANG TEXT',
    pasteHere: 'Naay text nga kadudahan? I-paste o kuhaan og litrato diri.',
    freezeFunds: 'I-LOCK ANG AKONG ACCOUNT',
    freezeSub: 'Tawagi ang bangko/wallet karon. Isulti: i-lock ang akong account.',
    saveEvidence: 'MAG-SAVE NG EVIDENCE',
    reportIt: 'ISUMBONG',
    iLostMoney: 'NA-SCAM NA KO / NA-LOKO NA KO',
    didYouSendMoney: 'Nagpadala ka na ba ug kwarta o naghatag ug code?',
    yesSent: 'OO, nagpadala ko',
    noNotYet: 'WALA PA',
    callNow: 'TAWAGI KARON',
    callScript: "Isulti sa hotline: 'Na-scam ko. Palihug i-lock ang akong account ug i-report ang transaction. Gusto ko ug reference number.'",
    deletedEvidence: 'Na-delete na nimo ang text? OK ra. Makita pa sa bank app ang transfer, ug naa sa call log ang numero. I-screenshot kana duha.',
    timeFrameNow: 'KARON',
    timeFrameToday: 'KARON ADLAWA',
    timeFrameThisWeek: 'NIINING SEMANAHA',
    reportedTimes: 'kini nga numero gi-report na',
    dontReply: 'AYAW TUBAGI. AYAW TUOHI.',
  },
  ILOCANO: {
    oneRule: "SCAM DAYTA. DIAK AGSUBONG. DIAK ITED TI OTP (ti 6-digit a code). Awan bangko, awan GCash, awan gobyerno nga agdawdawat ti OTP mo. Saan koman.",
    consentTitle: 'PROTEKTAHAM TI PAMILIAM. PROTEKTAHAM TI PRIVACY.',
    consentBody: 'Tapno ma-check ti text, maipatulod iti AI scanner. Maikkat ti numero, ID, ken OTP sakbay nga maipatulod. Awan account, awan mailako. Ever.',
    consentAccept: 'WEN, TULOY',
    consentDecline: 'SAAN PAY',
    scanButton: 'I-CHECK TI TEXT',
    pasteHere: 'Adda text a nakadudua? I-paste wenno alaen ti retrato ditoy.',
    freezeFunds: 'I-LOCK TI ACCOUNT KO',
    freezeSub: 'Tawagen ti bangko/wallet itan. Ibaga: i-lock ti account ko.',
    saveEvidence: 'AG-SAVE TI EVIDENCE',
    reportIt: 'ISUMBONG',
    iLostMoney: 'NA-SCAM AKON / NA-LOKO AKON',
    didYouSendMoney: 'Nangipatulod kan ti kuarta wenno nangted ti code?',
    yesSent: 'WEN, nangipatulod ak',
    noNotYet: 'SAAN PAY',
    callNow: 'TAWAGEN ITAN',
    callScript: "Ibaga iti hotline: 'Na-scam ak. Pangngaasi nga i-lock ti account ken i-report ti transaction. Kayat ko ti reference number.'",
    deletedEvidence: 'Na-delete mo ti text? OK la. Makita pay iti bank app ti transfer, ken adda iti call log ti numero. I-screenshot dagita dua.',
    timeFrameNow: 'ITAN',
    timeFrameToday: 'ITA NGA ALDAW',
    timeFrameThisWeek: 'ITI DAYTAY A LAVAS',
    reportedTimes: 'daytoy a numero na-reporten',
    dontReply: 'DI AGSUBONG. DI PAGTALINAWAN.',
  },
};

export const t = (lang: AghoyLang, key: CopyKey): string =>
  COPY[lang]?.[key] ?? COPY.TAGALOG[key] ?? key;

export const normalizeLang = (s: string): AghoyLang =>
  s === 'ENGLISH' ? 'ENGLISH' : s === 'BISAYA' ? 'BISAYA' : s === 'ILOCANO' ? 'ILOCANO' : 'TAGALOG';

// === DOJO LOCALIZATION ===
// The Training Dojo was English-only. These keys cover its UI strings and the
// 18 scam-family labels/blurbs. Same fallback rule as COPY: unknown key falls
// back to Tagalog, then to the key itself.

export type DojoKey =
  | 'dojoTitle'
  | 'dojoSubtitle'
  | 'oneRuleLabel'
  | 'oneRuleBody'
  | 'startDrills'
  | 'reviewDrills'
  | 'pickFamily'
  | 'drills'
  | 'status'
  | 'advancedLive'
  | 'families'
  | 'lockedFamily'
  | 'showLess'
  | 'showMore'
  | 'session'
  | 'hp'
  | 'score'
  | 'correct'
  | 'shieldUp'
  | 'tryAgain'
  | 'youAnswered'
  | 'of'
  | 'correctly'
  | 'rank'
  | 'familyPracticed'
  | 'nextDrill'
  | 'moreScenarios'
  | 'retry'
  | 'nextSituation'
  | 'correctShort'
  | 'notQuite'
  | 'almostTryAgain'
  | 'transferLabel'
  | 'transferNewDrills'
  | 'transferCorrect'
  | 'transferHint'
  | 'surpriseTitle'
  | 'surpriseMastery'
  | 'surprisePerfect'
  | 'surpriseLevelUp'
  | 'caughtRealScam'
  | 'surpriseStreak'
  | 'challengeLabel'
  | 'challengeHint'
  | 'claimReward'
  | 'freeze'
  | 'freezeBuy'
  | 'goalLabel'
  | 'ringLabel'
  | 'ringNew'
  | 'ringSpot'
  | 'ringEmpty'
  | 'ringHint'
  | 'remember'
  | 'message'
  | 'liveScammer'
  | 'liveSubtitle'
  | 'replyPlaceholder'
  | 'youCaught'
  | 'scammerGotInfo'
  | 'aiTooMany'
  | 'aiQuota'
  | 'aiNetwork'
  | 'aiGeneric'
  | 'streak'
  | 'day'
  | 'days'
  | 'todayProgress'
  | 'drillsAday'
  | 'messageChannel'
  // Family labels + blurbs (18 families).
  | 'f_ewallet'
  | 'f_ewallet_blurb'
  | 'f_bank'
  | 'f_bank_blurb'
  | 'f_telco'
  | 'f_telco_blurb'
  | 'f_delivery'
  | 'f_delivery_blurb'
  | 'f_customs'
  | 'f_customs_blurb'
  | 'f_job'
  | 'f_job_blurb'
  | 'f_romance'
  | 'f_romance_blurb'
  | 'f_investment'
  | 'f_investment_blurb'
  | 'f_government'
  | 'f_government_blurb'
  | 'f_quishing'
  | 'f_quishing_blurb'
  | 'f_vishing'
  | 'f_vishing_blurb'
  | 'f_sim'
  | 'f_sim_blurb'
  | 'f_familyEmergency'
  | 'f_familyEmergency_blurb'
  | 'f_remittance'
  | 'f_remittance_blurb'
  | 'f_loanApp'
  | 'f_loanApp_blurb'
  | 'f_charity'
  | 'f_charity_blurb'
  | 'f_fakeReward'
  | 'f_fakeReward_blurb'
  | 'f_goodMessage'
  | 'f_goodMessage_blurb';

export const DOJO_COPY: Record<AghoyLang, Partial<Record<DojoKey, string>>> = {
  TAGALOG: {
    dojoTitle: 'Protektahan ang Pamilya mo sa Scam',
    dojoSubtitle: "Ang mga scammer ay nagta-target sa pinagkakatiwalaan mo: mga lola at lolo, magulang, OFW family. Isang 3-minutong drill ngayon ay makakapigil sa kanilang mawalan ng ipon bukas. Walang tech experience na kailangan - ginawa para sa mga lolo't lola.",
    oneRuleLabel: 'Ang isang patakaran na nakakapigil sa karamihan ng scam:',
    oneRuleBody: 'walang bangko, walang wallet, walang gobyerno na humihingi ng OTP mo. I-practice ang iba sa ibaba.',
    startDrills: "SIMULAN ANG DRILLS NGAYONG ARAW",
    reviewDrills: "REVIEW ANG MGA DUE DRILLS",
    pickFamily: 'Pumili ng scam family',
    drills: 'DRILLS',
    status: 'STATUS:',
    advancedLive: 'ADVANCED: MAG-PRACTICE LABAN SA LIVE AI SCAMMER',
    families: 'MGA FAMILY',
    lockedFamily: 'Naka-lock ang family na ito. I-master muna ang mga naunang family (mag-unlock ang vishing pagkatapos i-master ang bank; mag-unlock ang hard drills pagkatapos ng 4 na mastered family). Ang progress mo ang magbubukas ng pinto.',
    showLess: 'IPAKITA ANG MASA KAUNTI',
    showMore: 'IPAKITA ANG ',
    session: 'SESSION',
    hp: 'HP',
    score: 'SCORE',
    correct: 'TAMA',
    shieldUp: 'SHIELD UP!',
    tryAgain: 'SUBUKAN MULI',
    youAnswered: 'Sumagot ka ng',
    of: 'sa',
    correctly: 'ng tama. Rank:',
    rank: 'Rank:',
    familyPracticed: 'Family na na-practice:',
    nextDrill: 'SUNOD NA DRILL',
    moreScenarios: 'MGA KARAGDAGANG SCENARIO',
    retry: 'ULITIN',
    nextSituation: 'SUNOD NA SITWASYON',
    correctShort: 'TAMA',
    notQuite: 'HINDI GANUN',
    almostTryAgain: 'HALOS NA! SUBUKAN MULI',
    transferLabel: 'NAGBABAGONG-BAGO',
    transferNewDrills: 'mga bagong drill',
    transferCorrect: 'tama',
    transferHint: 'Ang tunay na pagsusulit ay ang mga bagong scam na hindi mo pa nakita. Tumaas ang iyong score? Lumalaki ang proteksyon mo.',
    surpriseTitle: 'BONUS! 🎉',
    surpriseMastery: 'Nakabisado mo ang isang scam family. Magaling!',
    surprisePerfect: 'Perpektong drill! Walang kamali-mali.',
    surpriseLevelUp: 'LEVEL UP! Tumataas ang iyong shield. Bagong scam families ang nabuksan!',
    caughtRealScam: 'Nakasalamuha ka na ba ng totoong scam na ganito? Sabihin sa amin.',
    surpriseStreak: 'Umabot ka sa streak milestone!',
    challengeLabel: 'ACTIVE CHALLENGE',
    challengeHint: 'Tapusin ang 3 drill para sa shield coins.',
    claimReward: 'I-CLAIM',
    freeze: 'FREEZE',
    freezeBuy: 'BIHAS NG FREEZE',
    goalLabel: 'Daily goal mo:',
    ringLabel: 'ANG IYONG PAGPROTEKTA RING',
    ringNew: 'nakita mong bagong scam:',
    ringSpot: 'nang tama',
    ringHint: 'Kumpletuhin ang ring sa pamamagitan ng pag-spot ng mga bagong scam. Ganito lumalaki ang proteksyon mo.',
    ringEmpty: 'Walang sapat na bagong drill pa. Gumawa ng ilan para makita ang iyong ring.',
    remember: 'TANDAAN:',
    message: 'message',
    liveScammer: 'LIVE AI SCAMMER',
    liveSubtitle: 'Ang AI ay nagpapanggap na scammer. Sumagot at hanapin ang kanilang kasinungalingan. I-type ang BLOCK o SCAM kapag nahuli mo sila.',
    replyPlaceholder: 'Sumagot sa scammer...',
    youCaught: 'NAHULI MO ANG SCAMMER! Magaling.',
    scammerGotInfo: 'Nakakuha ng impormasyon sayo ang scammer. Alamin ang red flags at subukan ulit.',
    aiTooMany: 'Masyadong maraming requests. Maghintay sandali.',
    aiQuota: 'Naabot na ang AI quota para ngayong araw.',
    aiNetwork: 'Error sa connection. I-check ang internet mo.',
    aiGeneric: 'Hindi makapagsimula ang AI simulator ngayon.',
    streak: 'STREAK',
    day: 'ARAW',
    days: 'ARAW',
    todayProgress: 'NGAYON',
    drillsAday: '3 drills a day keeps the scammer away.',
    messageChannel: 'channel message',
    f_ewallet: 'Scam sa E-wallet',
    f_ewallet_blurb: 'GCash, Maya, GoTyme at wallet app tricks.',
    f_bank: 'Scam sa Bangko',
    f_bank_blurb: 'Banking calls, emails, at OTP traps.',
    f_telco: 'Scam sa Telco',
    f_telco_blurb: 'SIM at telco account takeover tricks.',
    f_delivery: 'Scam sa Delivery',
    f_delivery_blurb: 'Fake parcel fees at delivery links.',
    f_customs: 'Customs at Parcel',
    f_customs_blurb: 'Demand ng parcel clearance fee.',
    f_job: 'Scam sa Trabaho',
    f_job_blurb: 'Fake jobs na magbabayad ka para magtrabaho.',
    f_romance: 'Scam sa Pag-ibig',
    f_romance_blurb: 'Catfishers na humihingi ng pera.',
    f_investment: 'Scam sa Investment',
    f_investment_blurb: 'Masyadong magandang crypto at stock offers.',
    f_government: 'Gobyernong Peke',
    f_government_blurb: 'Fake officials, fines, at threats.',
    f_quishing: 'Scam sa QR Code',
    f_quishing_blurb: 'Fake QR codes na dinidikit sa totoong QR.',
    f_vishing: 'Scam sa Tawag',
    f_vishing_blurb: 'Scam calls na nagpapanggap na bangko mo.',
    f_sim: 'Scam sa SIM Swap',
    f_sim_blurb: 'Mga magnanakaw na kinukuha ang SIM mo.',
    f_familyEmergency: 'Emergency ng Pamilya',
    f_familyEmergency_blurb: 'Fake relatives na nagsasabing may problema.',
    f_remittance: 'Scam sa Remittance',
    f_remittance_blurb: 'Money transfer at payout tricks.',
    f_loanApp: 'Scam sa Loan App',
    f_loanApp_blurb: 'Predatory loan apps at fake lenders.',
    f_charity: 'Scam sa Charity',
    f_charity_blurb: 'Fake donation pleas pagkatapos ng disaster.',
    f_fakeReward: 'Pekeng Premyo',
    f_fakeReward_blurb: 'Premyo na hindi ka sumali.',
    f_goodMessage: 'Totoong o Pekeng Mensahe?',
    f_goodMessage_blurb: 'Alamin kung ano ang hitsura ng totoong alerts.',
  },
  ENGLISH: {
    dojoTitle: 'Protect Your Family from Scams',
    dojoSubtitle: 'Scammers target the people who trust you most: lolas and lolos, parents, OFW families. One 3-minute drill today can stop them losing a lifetime of savings tomorrow. No tech experience needed - built for grandparents.',
    oneRuleLabel: 'The one rule that stops most scams:',
    oneRuleBody: 'no bank, no wallet, no government office ever asks for your OTP. Practice the rest below.',
    startDrills: "START TODAY'S DRILLS",
    reviewDrills: "REVIEW DUE DRILLS",
    pickFamily: 'Pick a scam family',
    drills: 'DRILLS',
    status: 'STATUS:',
    advancedLive: 'ADVANCED: PRACTICE VS LIVE AI SCAMMER',
    families: 'FAMILIES',
    lockedFamily: 'This family is locked. Master the earlier families first (vishing unlocks after you master bank; hard drills unlock after 4 mastered families). Your progress is what opens the door.',
    showLess: 'SHOW LESS',
    showMore: 'SHOW ',
    session: 'SESSION',
    hp: 'HP',
    score: 'SCORE',
    correct: 'CORRECT',
    shieldUp: 'SHIELD UP!',
    tryAgain: 'TRY AGAIN',
    youAnswered: 'You answered',
    of: 'of',
    correctly: 'correctly. Rank:',
    rank: 'Rank:',
    familyPracticed: 'Family practiced:',
    nextDrill: 'NEXT DRILL',
    moreScenarios: 'MORE SCENARIOS',
    retry: 'RETRY',
    nextSituation: 'NEXT SITUATION',
    correctShort: 'CORRECT',
    notQuite: 'NOT QUITE',
    almostTryAgain: 'ALMOST! TRY AGAIN',
    transferLabel: 'NEW LURE TRANSFER',
    transferNewDrills: 'new drills',
    transferCorrect: 'correct',
    transferHint: 'The real test is scams you have never seen. Is your score climbing? Your protection is growing.',
    surpriseTitle: 'BONUS! 🎉',
    surpriseMastery: 'You mastered a scam family. Well done!',
    surprisePerfect: 'Perfect drill! No mistakes.',
    surpriseLevelUp: 'LEVEL UP! Your shield grew. New scam families are unlocked!',
    caughtRealScam: 'Seen a real scam like this? Tell us.',
    surpriseStreak: 'You hit a streak milestone!',
    challengeLabel: 'ACTIVE CHALLENGE',
    challengeHint: 'Finish 3 drills for shield coins.',
    claimReward: 'CLAIM',
    freeze: 'FREEZE',
    freezeBuy: 'BUY FREEZE',
    goalLabel: 'Your daily goal:',
    ringLabel: 'YOUR PROTECTION RING',
    ringNew: 'new scams you caught:',
    ringSpot: 'correct',
    ringHint: 'Close the ring by spotting NEW scams you have never seen. This is how your protection grows.',
    ringEmpty: 'Not enough new drills yet. Do a few to reveal your ring.',
    remember: 'REMEMBER:',
    message: 'message',
    liveScammer: 'LIVE AI SCAMMER',
    liveSubtitle: 'The AI pretends to be a scammer. Reply and spot their lies. Type BLOCK or SCAM when you catch them.',
    replyPlaceholder: 'Reply to the scammer...',
    youCaught: 'YOU CAUGHT THE SCAMMER! Good instinct.',
    scammerGotInfo: 'The scammer got info from you. Learn the red flags and try again.',
    aiTooMany: 'Too many requests. Wait a moment.',
    aiQuota: 'AI quota reached for today.',
    aiNetwork: 'Connection error. Check your internet.',
    aiGeneric: 'The AI simulator could not start right now.',
    streak: 'STREAK',
    day: 'DAY',
    days: 'DAYS',
    todayProgress: 'TODAY',
    drillsAday: '3 drills a day keeps the scammer away.',
    messageChannel: 'message',
    f_ewallet: 'E-wallet Scams',
    f_ewallet_blurb: 'GCash, Maya, GoTyme and wallet app tricks.',
    f_bank: 'Bank Scams',
    f_bank_blurb: 'Banking calls, emails, and OTP traps.',
    f_telco: 'Telco Scams',
    f_telco_blurb: 'SIM and telco account takeover tricks.',
    f_delivery: 'Delivery Scams',
    f_delivery_blurb: 'Fake parcel fees and delivery links.',
    f_customs: 'Customs & Parcel',
    f_customs_blurb: 'Parcel clearance fee demands.',
    f_job: 'Job Scams',
    f_job_blurb: 'Fake jobs that ask you to pay to work.',
    f_romance: 'Romance Scams',
    f_romance_blurb: 'Catfishers who ask you for money.',
    f_investment: 'Investment Scams',
    f_investment_blurb: 'Too-good crypto and stock offers.',
    f_government: 'Government Impersonation',
    f_government_blurb: 'Fake officials, fines, and threats.',
    f_quishing: 'QR Code Scams',
    f_quishing_blurb: 'Fake QR codes stuck over real ones.',
    f_vishing: 'Phone Call Scams',
    f_vishing_blurb: 'Scam calls that fake your bank.',
    f_sim: 'SIM Swap Scams',
    f_sim_blurb: 'Thieves who take over your SIM.',
    f_familyEmergency: 'Family Emergency',
    f_familyEmergency_blurb: 'Fake relatives claiming to be in trouble.',
    f_remittance: 'Remittance Scams',
    f_remittance_blurb: 'Money transfer and payout tricks.',
    f_loanApp: 'Loan App Scams',
    f_loanApp_blurb: 'Predatory loan apps and fake lenders.',
    f_charity: 'Charity Scams',
    f_charity_blurb: 'Fake donation pleas after disasters.',
    f_fakeReward: 'Fake Rewards',
    f_fakeReward_blurb: 'Prizes you never entered.',
    f_goodMessage: 'Real or Fake?',
    f_goodMessage_blurb: 'Learn what real alerts look like.',
  },
  BISAYA: {
    dojoTitle: 'Pananalipod sa Pamilya mo sa Scam',
    dojoSubtitle: 'Ang mga scammer nag-target sa mga nagasalig nimo: mga lola ug lolo, ginikanan, OFW family. Usa ka 3-minutos nga drill karon makapugong sa ilang mawala ang naipon ugma. Wala kinahanglan tech experience - para sa mga lolo ug lola.',
    oneRuleLabel: 'Ang usa ka lagda nga makapugong sa daghang scam:',
    oneRuleBody: 'walay bangko, walay wallet, walay gobyerno nga mangayo sa imong OTP. I-practice ang uban sa ubos.',
    startDrills: 'SUGOD ANG DRILLS KARON',
    reviewDrills: 'REVIEW ANG MGA DUE DRILLS',
    pickFamily: 'Pilia ang scam family',
    drills: 'DRILLS',
    status: 'STATUS:',
    advancedLive: 'ADVANCED: MAG-PRACTICE BATOK SA LIVE AI SCAMMER',
    families: 'MGA FAMILY',
    lockedFamily: 'Naka-lock ang family. I-master una ang mga naunang family (ma-unlock ang vishing human ma-master ang bank; ma-unlock ang hard drills human sa 4 ka mastered family). Ang progress mo ang mag-abli sa pultahan.',
    showLess: 'IPAKITA ANG MASA GAMAY',
    showMore: 'IPAKITA ANG ',
    session: 'SESSION',
    hp: 'HP',
    score: 'SCORE',
    correct: 'SAKTO',
    shieldUp: 'SHIELD UP!',
    tryAgain: 'SULAYI USAB',
    youAnswered: 'Nitubag ka og',
    of: 'sa',
    correctly: 'og sakto. Rank:',
    rank: 'Rank:',
    familyPracticed: 'Family nga na-practice:',
    nextDrill: 'SUNOD NGA DRILL',
    moreScenarios: 'DAGHAN PA NGA SCENARIO',
    retry: 'USBA',
    nextSituation: 'SUNOD NGA SITWASYON',
    correctShort: 'SAKTO',
    notQuite: 'DILI GYUD',
    almostTryAgain: 'HALOS NA! SULAYI USAB',
    transferLabel: 'BAG-ONG LURES',
    transferNewDrills: 'bag-ong drills',
    transferCorrect: 'sakto',
    transferHint: 'Ang tinuod nga pagsulay mao ang bag-ong scam nga wala pa nimo makita. Nisaka ba ang score? Nagtubo ang proteksyon nimo.',
    surpriseTitle: 'BONUS! 🎉',
    surpriseMastery: 'Na-master nimo ang scam family. Maayo!',
    surprisePerfect: 'Perpekto nga drill! Wala sayop.',
    surpriseLevelUp: 'LEVEL UP! Nagtubo ang imong shield. Bag-ong scam families ang naabli!',
    caughtRealScam: 'Nakasugat ka na ba og tinuod nga scam nga sama ani? Sultihi mi.',
    surpriseStreak: 'Naabot nimo ang streak milestone!',
    challengeLabel: 'ACTIVE CHALLENGE',
    challengeHint: 'Tapusa ang 3 drills para sa shield coins.',
    claimReward: 'I-CLAIM',
    freeze: 'FREEZE',
    freezeBuy: 'PALITI NG FREEZE',
    goalLabel: 'Imong daily goal:',
    ringLabel: 'IMONG PROTECTION RING',
    ringNew: 'bag-ong scam nga nadakpan nimo:',
    ringSpot: 'sakto',
    ringHint: 'Isira ang ring pinaagi sa pag-ila sa BAG-ONG scam nga wala nimo makita. Ingon ani nagtubo ang proteksyon nimo.',
    ringEmpty: 'Wala pay bag-ong drills. Buhata ang pipila para makita ang imong ring.',
    remember: 'HINUMDOMI:',
    message: 'mensahi',
    liveScammer: 'LIVE AI SCAMMER',
    liveSubtitle: 'Ang AI nagpakaaron-ingnon nga scammer. Tubag ug pangitaa ang ilang bakak. I-type ang BLOCK o SCAM kung nahuli nimo sila.',
    replyPlaceholder: 'Tubag sa scammer...',
    youCaught: 'NAHULI MO ANG SCAMMER! Maayong instinct.',
    scammerGotInfo: 'Nakuha sa scammer ang info nimo. Tun-i ang red flags ug sulayi usab.',
    aiTooMany: 'Daghan kaayo og requests. Paghulat.',
    aiQuota: 'Naabot na ang AI quota karong adlawa.',
    aiNetwork: 'Error sa connection. I-check ang internet.',
    aiGeneric: 'Dili makasugod ang AI simulator karon.',
    streak: 'STREAK',
    day: 'ADLAW',
    days: 'ADLAW',
    todayProgress: 'KARON',
    drillsAday: '3 drills a day keeps the scammer away.',
    messageChannel: 'channel message',
    f_ewallet: 'Scam sa E-wallet',
    f_ewallet_blurb: 'GCash, Maya, GoTyme ug wallet app tricks.',
    f_bank: 'Scam sa Bangko',
    f_bank_blurb: 'Banking calls, emails, ug OTP traps.',
    f_telco: 'Scam sa Telco',
    f_telco_blurb: 'SIM ug telco account takeover tricks.',
    f_delivery: 'Scam sa Delivery',
    f_delivery_blurb: 'Fake parcel fees ug delivery links.',
    f_customs: 'Customs ug Parcel',
    f_customs_blurb: 'Demand sa parcel clearance fee.',
    f_job: 'Scam sa Trabaho',
    f_job_blurb: 'Fake jobs nga mobayad ka para magtrabaho.',
    f_romance: 'Scam sa Gugma',
    f_romance_blurb: 'Catfishers nga nangayo og kwarta.',
    f_investment: 'Scam sa Investment',
    f_investment_blurb: 'Too-good crypto ug stock offers.',
    f_government: 'Peke nga Gobyerno',
    f_government_blurb: 'Fake officials, fines, ug threats.',
    f_quishing: 'Scam sa QR Code',
    f_quishing_blurb: 'Fake QR codes nga gipilit sa tinuod.',
    f_vishing: 'Scam sa Tawag',
    f_vishing_blurb: 'Scam calls nga nagpakaaron-ingnon nga bangko nimo.',
    f_sim: 'Scam sa SIM Swap',
    f_sim_blurb: 'Mga kawatan nga mokuha sa imong SIM.',
    f_familyEmergency: 'Emergency sa Pamilya',
    f_familyEmergency_blurb: 'Fake relatives nga nagsulti nga naa silay problema.',
    f_remittance: 'Scam sa Remittance',
    f_remittance_blurb: 'Money transfer ug payout tricks.',
    f_loanApp: 'Scam sa Loan App',
    f_loanApp_blurb: 'Predatory loan apps ug fake lenders.',
    f_charity: 'Scam sa Charity',
    f_charity_blurb: 'Fake donation pleas human sa disaster.',
    f_fakeReward: 'Pekeng Premyo',
    f_fakeReward_blurb: 'Premyo nga wala ka moapil.',
    f_goodMessage: 'Tinuod o Pekeng Mensahe?',
    f_goodMessage_blurb: 'Tun-i unsa ang hitsura sa tinuod nga alerts.',
  },
  ILOCANO: {
    dojoTitle: 'Protektaan ti Pamilyam iti Scam',
    dojoSubtitle: 'Dagiti scammer agtarget kadagiti agtaltalek kenka: lola ken lolo, nagannak, OFW family. Maysa nga 3-minuto a drill ita ket makapasardeng kadakuada nga mapukaw ti naurnong inton bigat. Awan tech experience a kasapulan - naaramid para kadagiti lolo ken lola.',
    oneRuleLabel: 'Ti maysa a pagannurotan a mangpatingga iti kaaduan a scam:',
    oneRuleBody: 'awan bangko, awan wallet, awan gobyerno nga agdawdawat ti OTP mo. I-practice ti dadduma iti baba.',
    startDrills: 'RUGI TI DRILLS ITA',
    reviewDrills: 'REVIEW DAGITI DUE DRILLS',
    pickFamily: 'Piliem ti scam family',
    drills: 'DRILLS',
    status: 'STATUS:',
    advancedLive: 'ADVANCED: AG-PRACTICE KADAKITI LIVE AI SCAMMER',
    families: 'DAGITI FAMILY',
    lockedFamily: 'Na-lock ti family. I-master nga umuna dagiti nauna a family (ma-unlock ti vishing kalpasan ti master ti bank; ma-unlock ti hard drills kalpasan ti 4 a mastered family). Ti progress mo ti manglukat ti ridaw.',
    showLess: 'IPAKITA TI BASSIT',
    showMore: 'IPAKITA TI ',
    session: 'SESSION',
    hp: 'HP',
    score: 'SCORE',
    correct: 'USTO',
    shieldUp: 'SHIELD UP!',
    tryAgain: 'PADASEN MANEN',
    youAnswered: 'Simmungbat ka iti',
    of: 'iti',
    correctly: 'nga usto. Rank:',
    rank: 'Rank:',
    familyPracticed: 'Family a na-practice:',
    nextDrill: 'SUMUNOD NGA DRILL',
    moreScenarios: 'DADDUMA PAY A SCENARIO',
    retry: 'ULITEN',
    nextSituation: 'SUMUNOD A SITWASYON',
    correctShort: 'USTO',
    notQuite: 'SAAN NGA USTO',
    almostTryAgain: 'NGARUD! PADASEN MANEN',
    transferLabel: 'BARO A LURES',
    transferNewDrills: 'baro a drills',
    transferCorrect: 'usto',
    transferHint: 'Ti pudno a subok ket dagiti baro a scam a saan mo pay nakita. Ngumatngato ti score? Dumakdakkel ti proteksyonam.',
    surpriseTitle: 'BONUS! 🎉',
    surpriseMastery: 'Na-master mo ti scam family. Nasayaat!',
    surprisePerfect: 'Perpekto a drill! Awan biddut.',
    surpriseLevelUp: 'LEVEL UP! Immaysa ti shield mo. Nabuksan dagiti baro a scam families!',
    caughtRealScam: 'Nakasabatka kadi iti pudno a scam a kasdaytoy? Ibagam kadakami.',
    surpriseStreak: 'Naabot mo ti streak milestone!',
    challengeLabel: 'ACTIVE CHALLENGE',
    challengeHint: 'Lektoen dagiti 3 drills para iti shield coins.',
    claimReward: 'I-CLAIM',
    freeze: 'FREEZE',
    freezeBuy: 'GATANG TI FREEZE',
    goalLabel: 'Ti daily goal mo:',
    ringLabel: 'TI PROTECTION RING MO',
    ringNew: 'baro a scam a naawanam:',
    ringSpot: 'usto',
    ringHint: 'Iserra ti ring babaen ti panang-ila iti BARO a scam a saan mo pay nakita. Kastoy ti dumakdakkel a proteksyonam.',
    ringEmpty: 'Awan pay baro a drills. Aramidem dagiti sumagmamano tapos makita ti ring mo.',
    remember: 'MALAGIPMO:',
    message: 'mensahe',
    liveScammer: 'LIVE AI SCAMMER',
    liveSubtitle: 'Agpaka-asino ti AI nga scammer. Sumungbat ken biruken dagiti ulbod da. I-type ti BLOCK wenno SCAM no maawatan mo ida.',
    replyPlaceholder: 'Sumungbat iti scammer...',
    youCaught: 'NATANOM MO TI SCAMMER! Naimbag nga instinct.',
    scammerGotInfo: 'Nakaala ti scammer ti info kenka. Adalen ti red flags ken padasen manen.',
    aiTooMany: 'Adu unay a requests. Aguray bassit.',
    aiQuota: 'Naabot ti AI quota ita nga aldaw.',
    aiNetwork: 'Error iti connection. I-check ti internet.',
    aiGeneric: 'Saan a makarugi ti AI simulator itan.',
    streak: 'STREAK',
    day: 'ALDAW',
    days: 'ALALDAW',
    todayProgress: 'ITA',
    drillsAday: '3 drills a day keeps the scammer away.',
    messageChannel: 'channel message',
    f_ewallet: 'Scam iti E-wallet',
    f_ewallet_blurb: 'GCash, Maya, GoTyme ken wallet app tricks.',
    f_bank: 'Scam iti Bangko',
    f_bank_blurb: 'Banking calls, emails, ken OTP traps.',
    f_telco: 'Scam iti Telco',
    f_telco_blurb: 'SIM ken telco account takeover tricks.',
    f_delivery: 'Scam iti Delivery',
    f_delivery_blurb: 'Fake parcel fees ken delivery links.',
    f_customs: 'Customs ken Parcel',
    f_customs_blurb: 'Demand iti parcel clearance fee.',
    f_job: 'Scam iti Trabaho',
    f_job_blurb: 'Fake jobs nga agbayad ka tapos agtrabaho.',
    f_romance: 'Scam iti Ay-ayam',
    f_romance_blurb: 'Catfishers nga agdawdawat ti kuarta.',
    f_investment: 'Scam iti Investment',
    f_investment_blurb: 'Too-good crypto ken stock offers.',
    f_government: 'Peke a Gobyerno',
    f_government_blurb: 'Fake officials, fines, ken threats.',
    f_quishing: 'Scam iti QR Code',
    f_quishing_blurb: 'Fake QR codes nga naidikit kadagiti pudno.',
    f_vishing: 'Scam iti Tawag',
    f_vishing_blurb: 'Scam calls nga agpaka-asino ti bangko mo.',
    f_sim: 'Scam iti SIM Swap',
    f_sim_blurb: 'Dagiti mannanakaw nga alaen ti SIM mo.',
    f_familyEmergency: 'Emergency iti Pamilya',
    f_familyEmergency_blurb: 'Fake relatives nga agsasao nga adda problemada.',
    f_remittance: 'Scam iti Remittance',
    f_remittance_blurb: 'Money transfer ken payout tricks.',
    f_loanApp: 'Scam iti Loan App',
    f_loanApp_blurb: 'Predatory loan apps ken fake lenders.',
    f_charity: 'Scam iti Charity',
    f_charity_blurb: 'Fake donation pleas kalpasan ti disaster.',
    f_fakeReward: 'Pekeng Premyo',
    f_fakeReward_blurb: 'Premyo nga saan ka a simrek.',
    f_goodMessage: 'Pudno wenno Pekeng Mensahe?',
    f_goodMessage_blurb: 'Adalen no kasano ti langa dagiti pudno nga alerts.',
  },
};

export const td = (lang: AghoyLang, key: DojoKey): string =>
  DOJO_COPY[lang]?.[key] ?? DOJO_COPY.TAGALOG[key] ?? key;
