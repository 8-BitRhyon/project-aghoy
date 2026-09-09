// components/Dojo.levelUp.test.tsx - when a drill raises the learner's shield
// level, the UI must surface a level-up reward. Regression for the audit: the
// ladder (masteryShieldLevel) advances but nothing told the learner, so the
// progression was invisible.

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

let loadedProgress: unknown = null;
const saveTrainingProgressMock = vi.fn(async (_p: unknown, _a?: unknown[]) => {});
vi.mock('../src/api/storageClient', () => ({
  saveTrainingProgress: (p: unknown, a?: unknown[]) => saveTrainingProgressMock(p, a),
  loadTrainingProgress: async () => loadedProgress,
  saveSelfReport: async () => {},
}));
vi.mock('../services/aiService', () => ({
  createDojoChat: () => ({ sendMessage: async () => ({ response: { text: () => 'ok' }, health: 100 }) }),
}));
vi.mock('../utils/sound', () => ({ playSound: () => {} }));

const { scenario } = vi.hoisted(() => ({
  scenario: {
    id: 'ewallet-easy-000',
    title: 'ewallet drill',
    icon: 'ShieldCheck',
    difficulty: 'easy',
    family: 'ewallet',
    archetype: 'phishing',
    category: 'otp',
    setup: 'Setup',
    steps: [
      {
        id: 's1',
        channel: 'sms',
        senderLabel: 'GCash',
        message: 'Message',
        question: 'What do you do?',
        tip: 't',
        options: [
          { id: 'a', text: 'Open the link', correct: false, feedback: 'no' },
          { id: 'b', text: 'Ignore it', correct: true, feedback: 'yes' },
        ],
      },
    ],
    debrief: 'D',
    source: 'curated',
  },
}));

vi.mock('../src/dojo/scenarios.generated', () => ({ ALL_SCENARIOS: [scenario] }));
vi.mock('../src/dojo/scenarios.generated.tl', () => ({ ALL_SCENARIOS_TAGALOG: [scenario] }));
vi.mock('../src/dojo/scenarios.generated.ceb', () => ({ ALL_SCENARIOS_BISAYA: [scenario] }));
vi.mock('../src/dojo/scenarios.generated.ilo', () => ({ ALL_SCENARIOS_ILOCANO: [scenario] }));
vi.mock('../src/dojo/scenarios', () => ({ getScenario: () => scenario }));

import Dojo from './Dojo';
import { applyAnswer, emptyProgress, setDailyGoal } from '../src/dojo/progress';
import type { Scenario } from '../src/dojo/scenarios';

const asScenario = (s: unknown): Scenario => s as Scenario;

const answerCorrect = async () => {
  await act(async () => {
    render(<Dojo selectedLanguage="ENGLISH" />);
  });
  const familyBtn = screen.getAllByRole('button').find((b) => /E-wallet Scams/i.test(b.textContent || ''));
  fireEvent.click(familyBtn!);
  const drill = screen.getAllByRole('button').find((b) => !b.hasAttribute('disabled') && (b.textContent || '').includes('ewallet drill'));
  fireEvent.click(drill!);
  fireEvent.click(screen.getByText('Ignore it'));
};

describe('Dojo - shield level-up feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadedProgress = null;
  });

  it('records a level-up reward when an answer raises the shield level', async () => {
    // Build a progress where mastering ewallet + fake-reward (level 1) unlocks
    // level 2. Master fake-reward fully; give ewallet 3/5 corrects so one more
    // correct answer in the drill completes the pair and raises the shield.
    let p = emptyProgress();
    p = setDailyGoal(p, 3);
    const fakeReward = { ...scenario, id: 'fake-reward-2', family: 'fake-reward' as const, title: 'fr' };
    for (let i = 0; i < 4; i++) {
      p = applyAnswer(p, { scenario: asScenario(fakeReward), correct: true, atDay: '2026-08-01' });
    }
    // 3 ewallet corrects (not mastery - last5 has 3, needs 4).
    for (let i = 0; i < 3; i++) {
      p = applyAnswer(p, { scenario: asScenario(scenario), correct: true, atDay: '2026-08-01' });
    }
    expect(p.shieldLevel).toBe(1);
    expect(p.familyMastery['ewallet'].mastered).toBe(false);
    loadedProgress = p;

    // The drill's correct answer adds a 3rd ewallet correct; 3 more in the
    // drill complete mastery of ewallet -> shield rises to 2.
    await answerCorrect();
    const saved = saveTrainingProgressMock.mock.calls.at(-1)?.[0] as {
      shieldLevel: number;
      surpriseRewards: Array<{ id: string; kind: string }>;
    };
    expect(saved.shieldLevel).toBe(2);
    expect(saved.surpriseRewards.some((r) => r.kind === 'level-up')).toBe(true);
  });

  it('does not record a level-up reward when the shield level is unchanged', async () => {
    let p = emptyProgress();
    p = setDailyGoal(p, 3);
    // Some corrects but not enough to master both level-1 families.
    for (let i = 0; i < 2; i++) {
      p = applyAnswer(p, { scenario: asScenario(scenario), correct: true, atDay: '2026-08-01' });
    }
    expect(p.shieldLevel).toBe(1);
    loadedProgress = p;

    await answerCorrect();
    const saved = saveTrainingProgressMock.mock.calls.at(-1)?.[0] as {
      shieldLevel: number;
      surpriseRewards: Array<{ id: string; kind: string }>;
    };
    expect(saved.shieldLevel).toBe(1);
    expect(saved.surpriseRewards.some((r) => r.kind === 'level-up')).toBe(false);
  });
});
