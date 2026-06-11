import app from './app';

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Express API server running at http://localhost:${port}`);
});
