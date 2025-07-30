import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.get('/ping', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`rating-api listening on port ${port}`);
});
