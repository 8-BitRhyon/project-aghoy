// components/Dojo.reviewSession.test.tsx - the SRS review queue must be
// surfaced. The audit found dueScenarios/scheduleMirror are never called, so
// spaced-repetition reviews were maintained but never offered to the learner.

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
import { emptyProgress, setDailyGoal } from '../src/dojo/progress';

describe('Dojo - SRS review sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadedProgress = null;
  });

  it('offers and plays a review session when scenarios are due for review', async () => {
    // Progress with one scenario due for review (srsQueue due today).
    let p = emptyProgress();
    p = setDailyGoal(p, 3);
    p.srsQueue = [{ scenarioId: 'ewallet-easy-000', box: 1, dueAt: '2026-08-01' }];
    loadedProgress = p;

    await act(async () => {
      render(<Dojo selectedLanguage="ENGLISH" />);
    });

    // The review affordance renders (i18n label via a REVIEW key).
    const reviewBtn = screen.getAllByRole('button').find((b) => /REVIEW/i.test(b.textContent || ''));
    expect(reviewBtn).toBeTruthy();
    fireEvent.click(reviewBtn!);

    // The due drill opened (its question is shown).
    expect(screen.getByText(/What do you do/i)).toBeTruthy();
  });

  it('hides the review affordance when nothing is due', async () => {
    let p = emptyProgress();
    p = setDailyGoal(p, 3);
    loadedProgress = p;

    await act(async () => {
      render(<Dojo selectedLanguage="ENGLISH" />);
    });
    expect(screen.queryByText(/REVIEW/i)).toBeNull();
  });
});
