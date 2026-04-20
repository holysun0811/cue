import app from './app.js';

const port = process.env.PORT || 8787;

app.listen(port, () => {
  console.log(`Cue backend listening on http://localhost:${port}`);
});
