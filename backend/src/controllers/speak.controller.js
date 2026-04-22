import { analyzePromptInput, buildSpeakingPlan } from '../services/gemini.service.js';
import { transcribeAudio } from '../services/stt.service.js';
import { createAttempt, createSession, getBridge, getSession, updateSession } from '../services/session.service.js';
import { decodeBase64Payload, estimateDurationSecFromBase64 } from '../utils/media.js';

export async function prepareSpeak(req, res, next) {
  try {
    console.log('\n========== [prepareSpeak] REQUEST ==========');
    console.log('  entryType:', req.body.entryType);
    console.log('  answerApproach:', JSON.stringify(req.body.answerApproach));
    console.log('  appLanguage:', req.body.appLanguage, '| targetLanguage:', req.body.targetLanguage);

    const appLanguage = req.body.appLanguage || 'zh-CN';
    const targetLanguage = req.body.targetLanguage || 'en';
    const answerApproach = req.body.answerApproach || null;
    let promptSummary = '';
    let taskType = 'answer_prompt';
    let bridge = null;

    if (req.body.entryType === 'bridge') {
      bridge = getBridge(req.body.bridgeId);
      if (!bridge) {
        res.status(404).json({ error: 'Bridge not found.' });
        return;
      }
      const selectedPrompt =
        req.body.selectedPrompt ||
        bridge.recommendedPrompts?.find((prompt) => prompt.id === req.body.selectedPromptId);
      promptSummary = selectedPrompt?.questionText || bridge.practiceQuestion;
      bridge = {
        ...bridge,
        selectedPrompt: selectedPrompt
          ? {
              id: selectedPrompt.id,
              angleLabel: selectedPrompt.angleLabel,
              questionText: selectedPrompt.questionText
            }
          : null
      };
    } else {
      const taskInput = req.body.taskInput || {};
      const audioTranscript = taskInput.audioBase64
        ? await transcribeAudio({
            audioBuffer: decodeBase64Payload(taskInput.audioBase64),
            languageCode: appLanguage
          })
        : null;
      const analysis = await analyzePromptInput({
        taskType,
        appLanguage,
        targetLanguage,
        text: [taskInput.text, audioTranscript?.transcript].filter(Boolean).join('\n'),
        imageBase64: taskInput.imageBase64,
        audioBase64: taskInput.audioBase64
      });
      promptSummary = analysis.promptSummary;
      taskType = analysis.suggestedTaskType || taskType;
    }

    const plan = await buildSpeakingPlan({
      taskType,
      promptSummary,
      appLanguage,
      targetLanguage,
      answerApproach,
      userIntentNotes: bridge
        ? `${bridge.summary}\n${bridge.speakingAngle}\nSelected practice angle: ${bridge.selectedPrompt?.angleLabel || 'default'}`
        : req.body.taskInput?.text
    });

    const session = createSession({
      speakSessionId: '',
      entryType: req.body.entryType || 'direct',
      bridgeId: bridge?.bridgeId,
      promptSource: bridge ? 'bridge' : 'direct',
      selectedPrompt: bridge?.selectedPrompt,
      recommendedApproaches: plan.recommendedApproaches,
      selectedApproach: plan.selectedApproach,
      allApproachPlans: plan.allApproachPlans,
      taskType: plan.taskType || taskType,
      promptSummary: plan.promptSummary || promptSummary,
      appLanguage,
      targetLanguage,
      speakingPlan: plan.speakingPlan,
      roundGoal: plan.roundGoal,
      round: 1,
      hintLevel: 'phrases'
    });
    const updated = updateSession(session.sessionId, { speakSessionId: session.sessionId });

    console.log('\n========== [prepareSpeak] FINAL RESPONSE ==========');
    console.log('  recommendedApproaches (normalized):');
    updated.recommendedApproaches?.forEach((a, i) => {
      console.log(`    [${i}] id=${a.id} label=${a.label}`);
    });
    console.log('  selectedApproach.id:', updated.selectedApproach?.id);
    console.log('  speakingPlan (top-level):');
    updated.speakingPlan?.forEach((item, i) => {
      console.log(`    [${i}] ${item.text}`);
    });
    console.log('  allApproachPlans:');
    updated.allApproachPlans?.forEach((p, i) => {
      console.log(`    [${i}] approachId=${p.approachId}`);
      p.speakingPlan?.forEach((item, j) => {
        console.log(`        item[${j}]: ${item.text}`);
      });
    });
    console.log('========== END ==========\n');

    res.json({
      speakSessionId: updated.sessionId,
      promptSummary: updated.promptSummary,
      promptSource: updated.promptSource,
      selectedPrompt: updated.selectedPrompt,
      recommendedApproaches: updated.recommendedApproaches,
      selectedApproach: updated.selectedApproach,
      allApproachPlans: updated.allApproachPlans,
      taskType: updated.taskType,
      speakingPlan: updated.speakingPlan,
      roundGoal: updated.roundGoal
    });
  } catch (error) {
    next(error);
  }
}

export async function submitSpeak(req, res, next) {
  try {
    const speakSessionId = req.body.speakSessionId || req.body.sessionId;
    const transcriptResult = req.body.transcript
      ? { transcript: req.body.transcript }
      : await transcribeAudio({
          audioBuffer: decodeBase64Payload(req.body.audioBase64),
          languageCode: req.body.targetLanguage || 'en-US'
        });

    const attempt = createAttempt({
      sessionId: speakSessionId,
      round: req.body.round || 1,
      hintLevel: req.body.hintLevel || 'phrases',
      transcript: transcriptResult.transcript,
      durationSec: req.body.durationSec || estimateDurationSecFromBase64(req.body.audioBase64)
    });

    res.json({
      attemptId: attempt.attemptId,
      transcript: attempt.transcript,
      durationSec: attempt.durationSec
    });
  } catch (error) {
    next(error);
  }
}

export async function takeTwo(req, res, next) {
  try {
    const speakSessionId = req.body.speakSessionId || req.body.sessionId;
    const session = getSession(speakSessionId);
    const nextRound = (req.body.previousRound || session?.round || 1) + 1;
    const hintLevel = req.body.recommendedHintLevel || session?.latestReview?.recommendedHintLevel || 'keywords';
    const take2Goal = session?.latestReview?.take2Goal || 'Add one concrete example.';

    updateSession(speakSessionId, {
      round: nextRound,
      hintLevel,
      take2Goal
    });

    res.json({
      speakSessionId,
      nextRound,
      hintLevel,
      take2Goal
    });
  } catch (error) {
    next(error);
  }
}
