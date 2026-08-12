import React, { useState, useEffect, useRef } from 'react';
import {
  Send, RefreshCw, Trophy, HelpCircle, ShieldCheck, ShieldAlert, Shield, Smartphone,
  Target,
  Briefcase, Phone, Package, Zap, Users, ChevronRight, Bot, ArrowLeft,
  Landmark, Truck, FileSearch, Heart, TrendingUp, Scale, ScanLine, PhoneCall,
  Fingerprint, Banknote, HandCoins, HeartHandshake, Gift, CheckCheck, ChevronDown, Flame,
  RotateCcw, Repeat,
  type LucideIcon,
} from 'lucide-react';
import { playSound } from '../utils/sound';
import DrillRenderer from './DrillRenderer';
import { setDocumentLang } from '../src/utils/lang';
import { td, normalizeLang, type DojoKey } from '../src/i18n';
import { type Scenario, type ScenarioStep, type ScenarioDifficulty, type ScenarioFamily } from '../src/dojo/scenarios';
import { ALL_SCENARIOS } from '../src/dojo/scenarios.generated';
import { type LearnerProgress, emptyProgress, applyAnswer, sessionPlan, dueScenarios, recordDailyGoal, streakStatus, familyMasteryState, isFamilyUnlocked, isTierUnlocked, transferFromLog, challengeProgress, CHALLENGE_DEFS, detectSurpriseReward, claimChallenge, challengeReward, buyStreakFreeze, STREAK_FREEZE_COST, setDailyGoal, DAILY_GOAL_OPTIONS } from '../src/dojo/progress';
import { saveTrainingProgress, loadTrainingProgress, saveSelfReport } from '../src/api/storageClient';
import { type GameState, startScenario, answerStep, advanceFromFeedback, rankFor } from '../src/dojo/engine';
import { createDojoChat } from '../services/aiService';

interface DojoProps {
  selectedLanguage: string;
}

type View = 'select' | 'family' | 'scenario' | 'ai';

const DIFF_COLOR: Record<Scenario['difficulty'], string> = {
  easy: 'text-green-400 border-green-700',
  medium: 'text-yellow-400 border-yellow-700',
  hard: 'text-red-400 border-red-700',
};

// Curated display order for the family-select screen.
const FAMILY_ORDER: ScenarioFamily[] = [
  'ewallet', 'bank', 'telco', 'delivery', 'customs', 'job', 'romance', 'investment',
  'government', 'quishing', 'vishing', 'sim-pretext', 'family-emergency', 'remittance',
  'loan-app', 'charity', 'fake-reward', 'good-message',
];

interface FamilyMeta {
  icon: LucideIcon;
  labelKey: DojoKey;
  blurbKey: DojoKey;
}

const FAMILY_META: Record<ScenarioFamily, FamilyMeta> = {
  ewallet: { icon: Smartphone, labelKey: 'f_ewallet', blurbKey: 'f_ewallet_blurb' },
  bank: { icon: Landmark, labelKey: 'f_bank', blurbKey: 'f_bank_blurb' },
  telco: { icon: Phone, labelKey: 'f_telco', blurbKey: 'f_telco_blurb' },
  delivery: { icon: Truck, labelKey: 'f_delivery', blurbKey: 'f_delivery_blurb' },
  customs: { icon: FileSearch, labelKey: 'f_customs', blurbKey: 'f_customs_blurb' },
  job: { icon: Briefcase, labelKey: 'f_job', blurbKey: 'f_job_blurb' },
  romance: { icon: Heart, labelKey: 'f_romance', blurbKey: 'f_romance_blurb' },
  investment: { icon: TrendingUp, labelKey: 'f_investment', blurbKey: 'f_investment_blurb' },
  government: { icon: Scale, labelKey: 'f_government', blurbKey: 'f_government_blurb' },
  quishing: { icon: ScanLine, labelKey: 'f_quishing', blurbKey: 'f_quishing_blurb' },
  vishing: { icon: PhoneCall, labelKey: 'f_vishing', blurbKey: 'f_vishing_blurb' },
  'sim-pretext': { icon: Fingerprint, labelKey: 'f_sim', blurbKey: 'f_sim_blurb' },
  'family-emergency': { icon: Users, labelKey: 'f_familyEmergency', blurbKey: 'f_familyEmergency_blurb' },
  remittance: { icon: Banknote, labelKey: 'f_remittance', blurbKey: 'f_remittance_blurb' },
  'loan-app': { icon: HandCoins, labelKey: 'f_loanApp', blurbKey: 'f_loanApp_blurb' },
  charity: { icon: HeartHandshake, labelKey: 'f_charity', blurbKey: 'f_charity_blurb' },
  'fake-reward': { icon: Gift, labelKey: 'f_fakeReward', blurbKey: 'f_fakeReward_blurb' },
  'good-message': { icon: CheckCheck, labelKey: 'f_goodMessage', blurbKey: 'f_goodMessage_blurb' },
};

// Language-aware scenario library, LAZY-LOADED so only the selected language's
// scenario set ships to the device (English + curated is eager; localized sets
// are ~880KB each and are code-split by Vite). Falls back to English ids so
// saved session plans stay valid across language switches.
const loadScenarios = (lang: string): Promise<Scenario[]> => {
  if (lang === "ENGLISH") return Promise.resolve(ALL_SCENARIOS);
  const mod = lang === "TAGALOG"
    ? import('../src/dojo/scenarios.generated.tl').then((m) => m.ALL_SCENARIOS_TAGALOG)
    : lang === "BISAYA"
      ? import('../src/dojo/scenarios.generated.ceb').then((m) => m.ALL_SCENARIOS_BISAYA)
      : lang === "ILOCANO"
        ? import('../src/dojo/scenarios.generated.ilo').then((m) => m.ALL_SCENARIOS_ILOCANO)
        : Promise.resolve(ALL_SCENARIOS);
  return mod;
};

// One pool per family, fed to the progression engine's sessionPlan. IDs are
// language-identical (the generator dedups by id), so the English pool is the
// canonical set of scenario ids.
const POOL_BY_FAMILY: Record<ScenarioFamily, string[]> = FAMILY_ORDER.reduce((acc, family) => {
  acc[family] = ALL_SCENARIOS.filter((s) => s.family === family).map((s) => s.id);
  return acc;
}, {} as Record<ScenarioFamily, string[]>);

// Local calendar day (YYYY-MM-DD), not UTC: the streak resets at the user's
// midnight, not Greenwich.
const dayKey = (): string => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

const DIFFICULTIES: ScenarioDifficulty[] = ['easy', 'medium', 'hard'];
// Daily goal is user-chosen (3/5/7) - agency, not obligation (streak-trap fix).
const DAILY_GOAL_DEFAULT = 3;

const Dojo: React.FC<DojoProps> = ({ selectedLanguage }) => {
  const lang = normalizeLang(selectedLanguage);
  const D = (key: DojoKey): string => td(lang, key);
  const [library, setLibrary] = useState<Scenario[]>(ALL_SCENARIOS);
  const [view, setView] = useState<View>('select');
  const [familyView, setFamilyView] = useState<ScenarioFamily | null>(null);
  const [lockedFamily, setLockedFamily] = useState<ScenarioFamily | null>(null);
  const [expanded, setExpanded] = useState<Record<ScenarioDifficulty, boolean>>({ easy: false, medium: false, hard: false });
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const [step, setStep] = useState<ScenarioStep | null>(null);
  const [feedbackTip, setFeedbackTip] = useState<string | null>(null);
  // "I caught a real scam like this" self-report (anonymous, best-effort).
  const [selfReported, setSelfReported] = useState(false);

  // Progression engine state, persisted server-side (pseudonymous learner_key).
  const [progress, setProgress] = useState<LearnerProgress>(emptyProgress);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [sessionIds, setSessionIds] = useState<string[]>([]);
  const [today, setToday] = useState<string>(dayKey);
  const [todayCorrect, setTodayCorrect] = useState(0);

  // AI live-simulator mode (optional advanced tab).
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiHealth, setAiHealth] = useState(100);
  const [aiStatus, setAiStatus] = useState<'active' | 'won' | 'lost' | 'error'>('active');
  const [aiError, setAiError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  useEffect(() => {
    setDocumentLang(selectedLanguage);
  }, [selectedLanguage]);

  // Load the scenario library for the selected language (lazy: localized sets
  // are code-split). Defaults to English while loading.
  useEffect(() => {
    let cancelled = false;
    setLibrary(ALL_SCENARIOS);
    loadScenarios(lang).then((lib) => {
      if (!cancelled) setLibrary(lib);
    });
    return () => { cancelled = true; };
  }, [lang]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiBusy]);

  // Reset the daily counter when the calendar day rolls over.
  useEffect(() => {
    const key = dayKey();
    if (key !== today) {
      setToday(key);
      setTodayCorrect(0);
    }
  }, [today]);

  // Load persisted progress once on mount (best-effort; offline stays local).
  useEffect(() => {
    let cancelled = false;
    loadTrainingProgress<LearnerProgress>().then((loaded) => {
      if (cancelled || !loaded) return;
      setProgress(loaded);
      setTodayCorrect(0);
    }).finally(() => { if (!cancelled) setProgressLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  // ---- Scenario mode ----
  const openScenario = (id: string) => {
    playSound('click');
    const s = library.find((x) => x.id === id) ?? ALL_SCENARIOS.find((x) => x.id === id);
    if (!s) return;
    const started = startScenario(s);
    setScenario(s);
    setGame(started.state);
    setStep(started.step);
    setFeedbackTip(null);
    setView('scenario');
  };

  // Manual pick from a family list: ignore any queued session plan.
  const openFromFamily = (id: string) => {
    playSound('click');
    const s = library.find((x) => x.id === id) ?? ALL_SCENARIOS.find((x) => x.id === id);
    if (!s) return;
    // Respect the unlock gate even when a locked family's list is somehow
    // reachable (defense in depth; the buttons are also disabled).
    if (!isFamilyUnlocked(progress, s.family)) {
      setLockedFamily(s.family);
      return;
    }
    setSessionIds([]);
    openScenario(id);
  };

  // Progression-aware session: mix 2-3 drills across unlocked families.
  const startSession = () => {
    playSound('click');
    const plan = sessionPlan(progress, today, POOL_BY_FAMILY);
    if (plan.length === 0) {
      openFamily('ewallet');
      return;
    }
    setSessionIds(plan.slice(1));
    openScenario(plan[0]);
  };

  // SRS review session: spaced-repetition picks the due (forgotten-adjacent)
  // drills + a weak-family warmup, so learned material actually comes back.
  const startReviewSession = () => {
    playSound('click');
    const plan = dueScenarios(progress, today, ALL_SCENARIOS.map((s) => s.id));
    if (plan.length === 0) {
      openFamily('ewallet');
      return;
    }
    setSessionIds(plan.slice(1));
    openScenario(plan[0]);
  };

  const nextDrill = () => {
    playSound('click');
    if (sessionIds.length === 0) return;
    const [nextId, ...rest] = sessionIds;
    setSessionIds(rest);
    openScenario(nextId);
  };

  const openFamily = (family: ScenarioFamily) => {
    playSound('click');
    // Gate manual selection too: a locked family shows its lock state instead
    // of opening drills the learner is not ready for (consistent with
    // sessionPlan, which only picks unlocked families).
    const unlocked = isFamilyUnlocked(progress, family);
    setFamilyView(family);
    setExpanded({ easy: false, medium: false, hard: false });
    if (unlocked) setLockedFamily(null);
    else setLockedFamily(family);
    setView('family');
  };

  const toggleExpand = (difficulty: ScenarioDifficulty) => {
    playSound('click');
    setExpanded((prev) => ({ ...prev, [difficulty]: !prev[difficulty] }));
  };

  const choose = (choiceId: string) => {
    if (!scenario || !game || !step) return;
    playSound('click');
    // Capture the CURRENT step's tip before the engine advances, so the
    // feedback panel shows the rule for the step just answered.
    setFeedbackTip(step.tip);
    const result = answerStep(scenario, game, choiceId);
    setGame(result.state);
    setStep(result.step);
    // Compute the next progress OUTSIDE the state updater: pure computation,
    // then setState + a single save. (Calling saveTrainingProgress inside the
    // updater was impure - StrictMode double-invokes updaters, causing a
    // duplicate POST per answer in dev.)
    const stepIndex = scenario.steps.findIndex((s) => s.id === step.id);
    const withAnswer = applyAnswer(progress, {
      scenario,
      correct: result.correct,
      atDay: today,
      stepIndex,
      optionId: choiceId,
      retriedWrong: game.retriedWrong,
    });
    const nextTodayCorrect = todayCorrect + (result.correct ? 1 : 0);
    const withGoal = recordDailyGoal(withAnswer, nextTodayCorrect, progress.streakAgency.dailyGoal, today);
    // Award a surprise reward when a milestone is hit (first mastery,
    // streak 3/7/14). The reward is persisted so it shows once and
    // survives reload. Positive-only, never shaming.
    const reward = detectSurpriseReward(withGoal, today);
    let saved = reward
      ? { ...withGoal, surpriseRewards: [...withGoal.surpriseRewards, reward] }
      : withGoal;
    // Shield level-up: the ladder advanced (masteryShieldLevel) - surface it as
    // a reward so the learner SEES their progression (it was silent before).
    if (saved.shieldLevel > progress.shieldLevel) {
      saved = {
        ...saved,
        surpriseRewards: [
          ...saved.surpriseRewards,
          { id: `level-up:${saved.shieldLevel}`, kind: 'level-up', awardedAt: today },
        ],
      };
    }
    setTodayCorrect(nextTodayCorrect);
    setProgress(saved);
    // Persist the per-answer analytics batch (training_answers rows) alongside
    // the progress: the worker's /training/progress route records each answer
    // for the coaching dashboard. Previously the batch was never sent, so the
    // answers table stayed empty.
    saveTrainingProgress(saved, [
      {
        scenarioId: scenario.id,
        stepIndex,
        optionId: choiceId,
        correct: result.correct,
        responseMs: 0,
      },
    ]);
    if (result.state.phase === 'feedback') playSound('hover');
    if (result.won) playSound('success');
    if (result.lost) playSound('alert');
  };

  // Anonymous "I caught a real scam like this" report: feeds the training
  // loop's self-report table (Rejects-sanitized server-side). Best-effort -
  // never blocks or errors the user.
  const reportRealScam = () => {
    if (!scenario || selfReported) return;
    setSelfReported(true);
    void saveSelfReport({ vector: scenario.family, narrative: `${scenario.family} drill matched a real encounter` }).catch(() => {});
  };

  const nextStep = () => {    if (!scenario || !game) return;
    playSound('click');
    const advanced = advanceFromFeedback(scenario, game);
    setGame(advanced);
    if (advanced.phase === 'step') {
      setStep(scenario.steps[advanced.stepIndex] ?? null);
    } else {
      setStep(null);
    }
  };

  const backToSelect = () => {
    playSound('click');
    setView('select');
    setFamilyView(null);
    setScenario(null);
    setGame(null);
    setStep(null);
  };

  // ---- AI live mode ----
  const startAi = async () => {
    playSound('click');
    setAiStatus('active');
    setMessages([]);
    setAiHealth(100);
    setAiError('');
    setView('ai');
    try {
      const chat = createDojoChat(selectedLanguage);
      chatRef.current = chat;
      const result = await chat.sendMessage('Start simulation.');
      const text = result.response.text();
      if (typeof result.health === 'number') setAiHealth(result.health);
      setMessages([{ role: 'model', text: text || 'Hello!' }]);
      playSound('scan');
    } catch (error: any) {
      handleAiError(error);
    }
  };

  const sendAi = async () => {
    if (!input.trim() || aiBusy || aiStatus !== 'active') return;
    playSound('typing');
    const msg = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: msg }]);
    setAiBusy(true);
    try {
      const result = await chatRef.current.sendMessage(msg);
      const text = result.response.text() || '...';
      if (typeof result.health === 'number') setAiHealth(result.health);
      setMessages((prev) => [...prev, { role: 'model', text }]);
      if (result.gameOver || /GAME OVER|Nahuli mo/i.test(text)) {
        playSound('success');
        setAiStatus('won');
      } else if (/FAILURE|Huli ka|Naloko/i.test(text)) {
        playSound('alert');
        setAiStatus('lost');
      } else {
        playSound('hover');
      }
    } catch (error: any) {
      handleAiError(error);
    } finally {
      setAiBusy(false);
    }
  };

  const handleAiError = (error: any) => {
    const s = String(error?.message || error || '');
    setAiStatus('error');
    setAiError(
      /429/.test(s) ? D('aiTooMany')
      : /quota|exhausted/i.test(s) ? D('aiQuota')
      : /network|fetch/i.test(s) ? D('aiNetwork')
      : D('aiGeneric')
    );
    playSound('alert');
  };

  const masteryLabel = (family: ScenarioFamily): string => familyMasteryState(progress, family).toUpperCase();

  const renderStreakBar = () => {
    const streak = streakStatus(progress);
    const goal = progress.streakAgency.dailyGoal;
    const buyFreeze = () => {
      playSound('click');
      setProgress((p) => {
        const saved = buyStreakFreeze(p);
        saveTrainingProgress(saved);
        return saved;
      });
    };
    return (
      <div className="mb-4 border-2 border-slate-700 bg-slate-900/80 p-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-400" />
          <span className="font-['Press_Start_2P'] text-[10px] text-orange-300">
            {D('streak')} {streak.current} {streak.current === 1 ? D('day') : D('days')}
          </span>
          {progress.streakAgency.freezesLeft > 0 && (
            <span className="text-[9px] font-['Press_Start_2P'] text-sky-300 border border-sky-700 px-1.5 py-0.5">
              {progress.streakAgency.freezesLeft} {D('freeze')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Shield className="w-4 h-4 text-yellow-400" />
            <span className="font-['Press_Start_2P'] text-[10px] text-yellow-300">{progress.shieldCoins}</span>
          </div>
          <span className="font-['Press_Start_2P'] text-[10px] text-cyan-300">{D('todayProgress')} {todayCorrect}/{goal}</span>
          <button
            onClick={buyFreeze}
            disabled={progress.shieldCoins < STREAK_FREEZE_COST}
            className="text-[9px] font-['Press_Start_2P'] text-sky-300 border border-sky-700 px-1.5 py-1 hover:bg-sky-900/40 disabled:opacity-40 disabled:cursor-not-allowed"
            title={D('freezeBuy')}
          >
            {D('freezeBuy')} {STREAK_FREEZE_COST}
          </button>
        </div>
        <p className="w-full md:w-auto text-cyan-200/80 font-['VT323'] text-lg leading-none">{D('drillsAday')}</p>
      </div>
    );
  };

  // Surprise-reward banner: a one-time delight moment on a milestone (first
  // mastery, a 3/7/14-day streak). Positive-only for this age group.
  const renderSurprise = () => {
    if (progress.surpriseRewards.length === 0) return null;
    const last = progress.surpriseRewards[progress.surpriseRewards.length - 1];
    const kind = last.kind;
    const label = kind === "first-mastery" ? D('surpriseMastery') : kind === "first-perfect" ? D('surprisePerfect') : kind === "level-up" ? D('surpriseLevelUp') : D('surpriseStreak');
    return (
      <div className="mb-4 border-2 border-yellow-500 bg-yellow-950/30 p-3 flex items-center gap-3 animate-fade-in">
        <Trophy className="w-6 h-6 text-yellow-400 shrink-0" />
        <div>
          <p className="font-['Press_Start_2P'] text-[10px] text-yellow-300">{D('surpriseTitle')}</p>
          <p className="font-['VT323'] text-lg text-slate-100 leading-tight">{label}</p>
        </div>
      </div>
    );
  };

  // Active challenge chip: a non-timed mission ("master 3 ewallet drills")
  // with a progress bar. No pressure timers - self-paced for older learners.
  // Selection order: a complete-but-unclaimed challenge (so the claim button
  // renders), then one in progress, then the first not yet started. The chip
  // disappears only once every challenge is claimed.
  const renderChallengeChip = () => {
    const isClaimed = (id: string): boolean => progress.challenges[id]?.claimedAt !== null;
    const isComplete = (id: string): boolean => {
      const st = progress.challenges[id];
      return !!st && st.progress >= st.target;
    };
    const isInProgress = (id: string): boolean => {
      const st = progress.challenges[id];
      return !!st && st.progress > 0;
    };
    const active =
      CHALLENGE_DEFS.find((d) => !isClaimed(d.id) && isComplete(d.id)) ??
      CHALLENGE_DEFS.find((d) => !isClaimed(d.id) && isInProgress(d.id)) ??
      CHALLENGE_DEFS.find((d) => !isClaimed(d.id));
    if (!active) return null;
    const prog = challengeProgress(progress, active.id);
    const pct = Math.round((prog.progress / prog.target) * 100);
    const complete = prog.progress >= prog.target && !prog.claimed;
    const claim = () => {
      playSound('success');
      setProgress((p) => {
        const saved = claimChallenge(p, active.id);
        saveTrainingProgress(saved);
        return saved;
      });
    };
    return (
      <div className="mb-4 border-2 border-indigo-700 bg-indigo-950/30 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-400" />
            <span className="font-['Press_Start_2P'] text-[10px] text-indigo-300">{D('challengeLabel')}</span>
          </div>
          <span className="font-['VT323'] text-lg text-slate-300">{prog.progress}/{prog.target}</span>
        </div>
        <div className="mt-2 h-2 bg-slate-800 rounded overflow-hidden">
          <div className="h-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="font-['VT323'] text-sm text-slate-400">{D('challengeHint')}</p>
          {complete && (
            <button onClick={claim} className="px-3 py-1 bg-indigo-700 hover:bg-indigo-600 text-white font-['Press_Start_2P'] text-[10px] border-b-2 border-indigo-900 active:border-b-0 active:translate-y-px min-h-[36px]">
              {D('claimReward')} +{challengeReward(active.id)}
            </button>
          )}
        </div>
      </div>
    );
  };

  // User-chosen daily goal (agency, not obligation): a small 3/5/7 chooser.
  // Per the streak-trap finding, the learner controls the commitment.
  const renderGoalChooser = () => (
    <div className="mb-3 flex items-center justify-center gap-2">
      <span className="font-['VT323'] text-lg text-slate-400">{D('goalLabel')}</span>
      {DAILY_GOAL_OPTIONS.map((g) => (
        <button
          key={g}
          onClick={() => {
            playSound('click');
            setProgress((p) => {
              const saved = setDailyGoal(p, g);
              saveTrainingProgress(saved);
              return saved;
            });
          }}
          className={`px-3 py-1 font-['Press_Start_2P'] text-[10px] border ${
            progress.streakAgency.dailyGoal === g ? 'bg-cyan-700 text-white border-cyan-400' : 'bg-slate-800 text-slate-400 border-slate-600 hover:text-white'
          }`}
        >
          {g}
        </button>
      ))}
    </div>
  );

  // The COMPETENCE ring (the mission signal): accuracy on novel scams the
  // learner has NEVER seen. This is the Dojo's real measure - a learner who
  // spots unfamiliar lures is genuinely protected. Built like Apple Watch's
  // completion rings (Gestalt closure): a filled ring the brain wants to close.
  const renderCompetenceRing = () => {
    const t = transferFromLog(progress.transferLog);
    const pct = t.firstTimeCount > 0 ? Math.round(t.firstTime.accuracy * 100) : 0;
    const c = 2 * Math.PI * 40; // circumference of an r=40 ring
    return (
      <div className="mb-4 border-2 border-cyan-700 bg-cyan-950/20 p-3 flex items-center gap-4">
        <div className="relative w-24 h-24 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#155e75" strokeWidth="10" />
            <circle
              cx="50" cy="50" r="40" fill="none" stroke="#22d3ee" strokeWidth="10"
              strokeLinecap="round" strokeDasharray={`${c * (pct / 100)} ${c}`}
              className="transition-all duration-700"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-['Press_Start_2P'] text-sm text-cyan-300">{pct}%</span>
        </div>
        <div>
          <p className="font-['Press_Start_2P'] text-[10px] text-cyan-300 mb-1">{D('ringLabel')}</p>
          <p className="font-['VT323'] text-lg text-slate-100 leading-tight">
            {t.firstTimeCount > 0
              ? D('ringNew') + ' ' + t.firstTime.correct + '/' + t.firstTime.total + ' ' + D('ringSpot')
              : D('ringEmpty')}
          </p>
          <p className="font-['VT323'] text-sm text-slate-400 leading-tight">{D('ringHint')}</p>
        </div>
      </div>
    );
  };

  const renderSelect = () => (
    <div className="w-full max-w-3xl mx-auto">
      {renderStreakBar()}
      {renderGoalChooser()}
      {renderCompetenceRing()}
      {renderSurprise()}
      {renderChallengeChip()}

      <div className="mb-6 border-4 border-cyan-600 bg-cyan-900/20 p-4 animate-fade-in font-['VT323']">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-cyan-600 text-black shrink-0 border-2 border-cyan-400 hidden md:block">
            <HelpCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-cyan-400 font-bold text-lg md:text-xl font-['Press_Start_2P'] mb-2 uppercase">{D('dojoTitle')}</h3>
            <p className="text-cyan-100/90 text-lg md:text-xl">
              {D('dojoSubtitle')}
            </p>
            <p className="mt-3 text-cyan-300 text-lg md:text-xl">
              <span className="text-white font-bold">{D('oneRuleLabel')}</span>{" "}
              {D('oneRuleBody')}
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={startSession}
        className="w-full mb-6 px-5 py-4 bg-cyan-700 hover:bg-cyan-600 text-white font-['Press_Start_2P'] text-xs md:text-sm border-b-4 border-cyan-900 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 min-h-[44px]"
      >
        <Zap className="w-4 h-4" /> {D('startDrills')}
      </button>

      {dueScenarios(progress, today, ALL_SCENARIOS.map((s) => s.id)).length > 0 && (
        <button
          onClick={startReviewSession}
          className="w-full mb-6 px-5 py-3 bg-indigo-800 hover:bg-indigo-700 text-white font-['Press_Start_2P'] text-xs md:text-sm border-b-4 border-indigo-950 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 min-h-[44px]"
        >
          <Repeat className="w-4 h-4" /> {D('reviewDrills')}
        </button>
      )}

      <h4 className="text-slate-300 font-['Press_Start_2P'] text-xs mb-3 uppercase">{D('pickFamily')}</h4>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FAMILY_ORDER.map((family) => {
          const meta = FAMILY_META[family];
          const Icon = meta.icon;
          const total = library.filter((s) => s.family === family).length;
          return (
            <button
              key={family}
              onClick={() => openFamily(family)}
              className="text-left bg-slate-900 border-4 border-slate-700 hover:border-cyan-500 p-4 min-h-[44px] transition-all shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] hover:translate-x-0.5 hover:translate-y-0.5 group"
            >
              <div className="flex items-start justify-between mb-2 gap-3">
                <span className="p-2 bg-slate-800 border-2 border-slate-600 text-cyan-400 group-hover:border-cyan-500 transition-colors">
                  <Icon className="w-6 h-6" />
                </span>
                <span className="text-[10px] font-['Press_Start_2P'] px-2 py-1 border border-cyan-700 text-cyan-300 whitespace-nowrap">{total} {D('drills')}</span>
              </div>
              <h4 className="text-white font-['Press_Start_2P'] text-xs mb-1">{td(lang, meta.labelKey)}</h4>
              <p className="text-slate-400 font-['VT323'] text-lg leading-tight">{td(lang, meta.blurbKey)}</p>
              <p className="mt-2 text-[10px] font-['Press_Start_2P'] text-slate-400">
                {D('status')} <span className="text-cyan-300">{masteryLabel(family)}</span>
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={startAi}
          className="px-5 py-3 bg-indigo-700 hover:bg-indigo-600 text-white font-['Press_Start_2P'] text-xs border-b-4 border-indigo-900 active:border-b-0 active:translate-y-1 transition-all inline-flex items-center gap-2 min-h-[44px]"
        >
          <Bot className="w-4 h-4" /> {D('advancedLive')}
        </button>
      </div>
    </div>
  );

  const renderFamily = () => {
    if (!familyView) return null;
    const meta = FAMILY_META[familyView];
    const Icon = meta.icon;
    const familyScenarios = library.filter((s) => s.family === familyView);
    const total = familyScenarios.length;
    const familyLocked = lockedFamily === familyView && !isFamilyUnlocked(progress, familyView);

    return (
      <div className="w-full max-w-3xl mx-auto">
        {renderStreakBar()}

        <div className="mb-4 flex items-center justify-between">
          <button onClick={backToSelect} className="flex items-center gap-1 text-slate-400 hover:text-white font-['VT323'] text-lg min-h-[44px]">
            <ArrowLeft className="w-4 h-4" /> {D('families')}
          </button>
          <span className="text-[10px] text-slate-400 font-['Press_Start_2P']">{total} {D('drills')}</span>
        </div>

        {lockedFamily === familyView && !isFamilyUnlocked(progress, familyView) && (
          <div className="mb-4 border-2 border-amber-700 bg-amber-950/40 px-3 py-2 font-['VT323'] text-lg text-amber-200">
            {D('lockedFamily')}
          </div>
        )}
        <div className="mb-6 border-4 border-cyan-600 bg-cyan-900/20 p-4 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-cyan-600 text-black shrink-0 border-2 border-cyan-400">
              <Icon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-cyan-400 font-bold text-lg md:text-xl font-['Press_Start_2P'] mb-2 uppercase">{td(lang, meta.labelKey)}</h3>
              <p className="text-cyan-100/90 text-lg md:text-xl">{td(lang, meta.blurbKey)}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {DIFFICULTIES.map((d) => {
              const n = familyScenarios.filter((s) => s.difficulty === d).length;
              if (n === 0) return null;
              return (
                <span key={d} className={`text-[10px] font-['Press_Start_2P'] px-2 py-1 border ${DIFF_COLOR[d]}`}>
                  {d.toUpperCase()} {n}
                </span>
              );
            })}
            <span className="text-[10px] font-['Press_Start_2P'] px-2 py-1 border border-cyan-700 text-cyan-300">
              {D('status')} {masteryLabel(familyView)}
            </span>
          </div>
        </div>

        {DIFFICULTIES.map((d) => {
          const items = familyScenarios.filter((s) => s.difficulty === d);
          if (items.length === 0) return null;
          const visible = expanded[d] ? items : items.slice(0, 6);
          return (
            <div key={d} className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-['Press_Start_2P'] px-2 py-1 border ${DIFF_COLOR[d]}`}>{d.toUpperCase()}</span>
                <span className="text-slate-400 font-['VT323'] text-lg">{items.length} {D('drills')}</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {visible.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => openFromFamily(s.id)}
                    disabled={familyLocked}
                    className="text-left bg-slate-900 border-4 border-slate-700 hover:border-cyan-500 p-4 min-h-[44px] transition-all shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] hover:translate-x-0.5 hover:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-700"
                  >
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h4 className="text-white font-['Press_Start_2P'] text-xs">{s.title}</h4>
                      <span className={`text-[10px] font-['Press_Start_2P'] px-2 py-1 border shrink-0 ${DIFF_COLOR[s.difficulty]}`}>
                        {s.difficulty.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-400 font-['VT323'] text-lg leading-tight">{s.category}</p>
                    <p className="text-slate-300 text-base font-['VT323'] leading-tight mt-1 line-clamp-2">{s.setup}</p>
                  </button>
                ))}
              </div>
              {items.length > 6 && (
                <button
                  onClick={() => toggleExpand(d)}
                  className="mt-2 w-full py-3 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-['Press_Start_2P'] text-[10px] border-2 border-slate-600 min-h-[44px] flex items-center justify-center gap-2"
                >
                  {expanded[d] ? (
                    <><ChevronDown className="w-4 h-4 rotate-180" /> {D('showLess')}</>
                  ) : (
                    <><ChevronDown className="w-4 h-4" /> {D('showMore')}{items.length - 6} MORE</>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderScenario = () => {
    if (!scenario || !game) return null;
    const inFeedback = game.phase === 'feedback';
    const finished = game.phase === 'won' || game.phase === 'lost';
    const rank = rankFor(game.correctCount, game.totalSteps);
    const transfer = transferFromLog(progress.transferLog);

    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={backToSelect} className="flex items-center gap-1 text-slate-400 hover:text-white font-['VT323'] text-lg min-h-[44px]">
            <ArrowLeft className="w-4 h-4" /> {D('families')}
          </button>
          <div className="flex items-center gap-3">
            {sessionIds.length > 0 && (
              <span className="text-[10px] text-slate-400 font-['Press_Start_2P']">{D('session')} {sessionIds.length + 1}</span>
            )}
            <span className="text-[10px] text-slate-400 font-['Press_Start_2P']">{D('hp')}</span>
            <div className="w-24 h-3 bg-slate-950 border border-slate-600">
              <div className={`h-full transition-all duration-500 ${game.hp > 60 ? 'bg-green-500' : game.hp > 30 ? 'bg-yellow-500' : 'bg-red-500'}`}
                   style={{ width: `${game.hp}%` }} />
            </div>
            <span className="text-slate-300 font-['VT323'] text-sm">{game.hp}/100</span>
          </div>
        </div>

        <div className={`bg-slate-900 border-4 ${finished ? (game.phase === 'won' ? 'border-green-600' : 'border-red-600') : 'border-slate-700'} transition-all shadow-[8px_8px_0_0_rgba(0,0,0,0.5)]`}>
          <div className="p-4 border-b-4 border-slate-700 bg-slate-800/50">
            <h2 className="text-white font-['Press_Start_2P'] text-sm md:text-base mb-1">{scenario.title}</h2>
            <p className="text-slate-300 font-['VT323'] text-lg">{scenario.setup}</p>
            <div className="mt-1 text-[10px] text-slate-400 font-['Press_Start_2P']">
              {D('score')} {game.score} &middot; {game.correctCount}/{game.totalSteps} {D('correct')}
            </div>
          </div>

          <div className="p-4 space-y-4">
            {finished ? (
              <div className={`text-center py-6 animate-fade-in ${game.phase === 'won' ? 'text-green-300' : 'text-red-300'}`}>
                {game.phase === 'won' ? <Trophy className="w-14 h-14 mx-auto mb-3 text-yellow-400" /> : <ShieldAlert className="w-14 h-14 mx-auto mb-3 text-red-400 animate-pulse" />}
                <h3 className="text-xl md:text-2xl font-['Press_Start_2P'] mb-3 text-white">
                  {game.phase === 'won' ? `${D('shieldUp')} (${rank})` : D('tryAgain')}
                </h3>
                <p className="font-['VT323'] text-lg md:text-xl max-w-lg mx-auto leading-tight">
                  {scenario.debrief}
                </p>
                <p className="mt-3 font-['VT323'] text-lg text-slate-300">
                  {D('youAnswered')} {game.correctCount} {D('of')} {game.totalSteps} {D('correctly')} <span className="text-white">{rank}</span>
                </p>
                <p className="mt-2 font-['VT323'] text-lg text-slate-300">
                  {D('familyPracticed')} <span className="text-white">{td(lang, FAMILY_META[scenario.family].labelKey)}</span> - {D('status')} <span className="text-cyan-300">{masteryLabel(scenario.family)}</span>
                </p>
                {transfer.firstTimeCount > 0 && (
                  <div className="mt-4 max-w-md mx-auto border-2 border-cyan-700 bg-cyan-950/20 p-3">
                    <p className="font-['Press_Start_2P'] text-[10px] text-cyan-300 mb-1">{D('transferLabel')}</p>
                    <p className="font-['VT323'] text-lg text-slate-200 leading-tight">
                      {D('transferNewDrills')} {transfer.firstTime.total} - {D('transferCorrect')} {transfer.firstTime.correct} ({Math.round(transfer.firstTime.accuracy * 100)}%)
                    </p>
                    <p className="font-['VT323'] text-sm text-slate-400 leading-tight">{D('transferHint')}</p>
                  </div>
                )}
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  {sessionIds.length > 0 && (
                    <button onClick={nextDrill} className="px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white font-['Press_Start_2P'] text-[10px] border-b-4 border-yellow-900 active:border-b-0 active:translate-y-1 min-h-[44px]">
                      {D('nextDrill')} ({sessionIds.length} LEFT)
                    </button>
                  )}
                  {game.phase === 'won' && (
                    <button
                      onClick={reportRealScam}
                      disabled={selfReported}
                      className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-['Press_Start_2P'] text-[10px] border-b-4 border-emerald-950 active:border-b-0 active:translate-y-1 min-h-[44px] disabled:opacity-50 disabled:cursor-default"
                    >
                      {selfReported ? D('surprisePerfect') : D('caughtRealScam')}
                    </button>
                  )}
                  <button onClick={backToSelect} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-['Press_Start_2P'] text-[10px] border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 min-h-[44px]">
                    {D('moreScenarios')}
                  </button>
                  <button onClick={() => openScenario(scenario.id)} className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white font-['Press_Start_2P'] text-[10px] border-b-4 border-cyan-900 active:border-b-0 active:translate-y-1 min-h-[44px]">
                    {D('retry')}
                  </button>
                </div>
              </div>
            ) : inFeedback ? (
              <div className="animate-fade-in">
                {game.retriedWrong ? (
                  // Errorless-loop retry: calm, normalizing, never shaming.
                  // Older adults learn less from punishment (Frank & Kong 2008)
                  // and shame triggers stereotype threat (Hess 2003), so this
                  // panel re-frames the mistake and invites an immediate retry.
                  <div className="border-4 border-amber-600 bg-amber-950/30 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldAlert className="w-6 h-6 text-amber-400" />
                      <span className="font-['Press_Start_2P'] text-xs text-amber-300">{D('almostTryAgain')}</span>
                    </div>
                    <p className="font-['VT323'] text-xl text-slate-100 leading-tight">{game.lastFeedback}</p>
                    <p className="mt-3 font-['VT323'] text-lg text-cyan-300 leading-tight border-t-2 border-slate-700 pt-2">
                      <span className="text-white font-bold">{D('remember')} </span>{feedbackTip ?? ''}
                    </p>
                  </div>
                ) : (
                  <div className={`border-4 p-4 ${game.lastCorrect ? 'border-green-600 bg-green-950/30' : 'border-slate-600 bg-slate-900/60'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {game.lastCorrect ? <ShieldCheck className="w-6 h-6 text-green-400" /> : <ShieldAlert className="w-6 h-6 text-slate-400" />}
                      <span className={`font-['Press_Start_2P'] text-xs ${game.lastCorrect ? 'text-green-400' : 'text-slate-300'}`}>
                        {game.lastCorrect ? D('correctShort') : D('notQuite')}
                      </span>
                    </div>
                    <p className="font-['VT323'] text-xl text-slate-100 leading-tight">{game.lastFeedback}</p>
                    <p className="mt-3 font-['VT323'] text-lg text-cyan-300 leading-tight border-t-2 border-slate-700 pt-2">
                      <span className="text-white font-bold">{D('remember')} </span>{feedbackTip ?? ''}
                    </p>
                  </div>
                )}
                <button onClick={nextStep} className="mt-4 w-full py-3 bg-cyan-700 hover:bg-cyan-600 text-white font-['Press_Start_2P'] text-xs border-b-4 border-cyan-900 active:border-b-0 active:translate-y-1 flex items-center justify-center gap-2 min-h-[44px]">
                  {game.retriedWrong ? D('tryAgain') : D('nextSituation')} {game.retriedWrong ? <RotateCcw className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            ) : step ? (
              <div className="animate-fade-in">
                {/* The incoming message - rendered as its real device UI so
                    the learner recognizes the PATTERN, not just the words. */}
                <DrillRenderer
                  step={step}
                  onDeclineCall={
                    scenario.family === 'vishing'
                      ? () => {
                          const correct = step.options.find((o) => o.correct);
                          if (correct) choose(correct.id);
                        }
                      : undefined
                  }
                />

                <p className="mt-4 font-['Press_Start_2P'] text-xs text-cyan-300 mb-3">{step.question}</p>
                <div className="space-y-3">
                  {step.options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => choose(opt.id)}
                      className="w-full text-left bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 hover:border-cyan-500 text-slate-100 p-3 min-h-[44px] font-sans text-sm md:text-base transition-colors"
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  const renderAi = () => (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-4">
        <button onClick={backToSelect} className="flex items-center gap-1 text-slate-400 hover:text-white font-['VT323'] text-lg min-h-[44px]">
          <ArrowLeft className="w-4 h-4" /> {D('families')}
        </button>
      </div>
      <div className={`bg-slate-900 border-4 ${aiStatus === 'won' ? 'border-green-600' : aiStatus === 'lost' ? 'border-red-600' : aiStatus === 'error' ? 'border-orange-500' : 'border-indigo-600'}`}>
        <div className="p-4 border-b-4 border-slate-700 bg-indigo-900/50 flex justify-between items-center">
          <div>
            <h2 className="text-white font-['Press_Start_2P'] text-sm">{D('liveScammer')}</h2>
            <p className="text-slate-300 font-['VT323'] text-lg">{D('liveSubtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-['Press_Start_2P']">{D('hp')}</span>
            <div className="w-20 h-3 bg-slate-950 border border-slate-600">
              <div className={`h-full ${aiHealth > 60 ? 'bg-green-500' : aiHealth > 30 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${aiHealth}%` }} />
            </div>
          </div>
        </div>
        <div className="h-[480px] bg-slate-950 overflow-y-auto p-4 space-y-4 font-sans">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700'}`}>
                {m.text}
              </div>
            </div>
          ))}
          {aiBusy && (
            <div className="flex justify-start">
              <div className="bg-slate-800 border border-slate-700 px-4 py-3 rounded-2xl flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          {aiStatus === 'won' && (
            <div className="text-center text-green-300 font-['VT323'] text-xl border-2 border-green-600 bg-green-950/40 p-4">
              <Trophy className="w-10 h-10 mx-auto mb-2 text-yellow-400" />
              {D('youCaught')}
            </div>
          )}
          {aiStatus === 'lost' && (
            <div className="text-center text-red-300 font-['VT323'] text-xl border-2 border-red-600 bg-red-950/40 p-4">
              {D('scammerGotInfo')}
            </div>
          )}
          {aiStatus === 'error' && (
            <div className="text-center text-orange-300 font-['VT323'] text-lg border-2 border-orange-500 bg-orange-950/40 p-4">
              {aiError}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-3 border-t-4 border-slate-700 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendAi()}
            disabled={aiStatus !== 'active'}
            placeholder={D('replyPlaceholder')}
            className="flex-1 bg-slate-800 text-white border border-slate-600 rounded-full px-4 py-2 font-sans text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-40"
          />
          <button onClick={sendAi} disabled={aiStatus !== 'active' || !input.trim()} aria-label="Send"
            className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-full disabled:opacity-40 transition-all min-h-[44px] min-w-[44px]">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  if (view === 'scenario') return renderScenario();
  if (view === 'ai') return renderAi();
  if (view === 'family') return renderFamily();
  return renderSelect();
};

export default Dojo;
