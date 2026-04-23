// LEGACY — V0.4 no longer wires up these endpoints. Kept commented for reference.
// The underlying prompts now live at:
//   prompts/legacy/cue-cards/prompt.md
//   prompts/legacy/rewrite-speech/prompt.md
// To revive: also uncomment the matching service functions in
// services/gemini.service.js and the routes in routes/ai.routes.js.

// import { streamCueCards, rewriteSpeech } from '../services/gemini.service.js';
//
// const writeSse = (res, event, payload) => {
//   res.write(`event: ${event}\n`);
//   res.write(`data: ${JSON.stringify(payload)}\n\n`);
// };
//
// export async function createCueCardsStream(req, res, next) {
//   res.writeHead(200, {
//     'Content-Type': 'text/event-stream',
//     'Cache-Control': 'no-cache, no-transform',
//     Connection: 'keep-alive'
//   });
//
//   try {
//     for await (const event of streamCueCards(req.body)) {
//       writeSse(res, event.type, event.payload);
//     }
//
//     writeSse(res, 'done', { ok: true });
//     res.end();
//   } catch (error) {
//     writeSse(res, 'error', { message: error.message });
//     res.end();
//     next(error);
//   }
// }
//
// export async function reviewSpeech(req, res, next) {
//   try {
//     const review = await rewriteSpeech(req.body);
//     res.json(review);
//   } catch (error) {
//     next(error);
//   }
// }
