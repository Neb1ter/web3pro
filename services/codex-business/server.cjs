const { buildApp, TEAMXZ_BASE_URL } = require("./app");

const PORT = Number(process.env.PORT || 3100);
const app = buildApp();

app.listen(PORT, () => {
  console.log(`codex-business listening on http://localhost:${PORT}`);
  console.log(`proxying upstream ${TEAMXZ_BASE_URL}`);
});
