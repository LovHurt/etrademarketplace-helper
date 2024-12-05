import app from "./app";
const apiId = process.env.API_ID;
const apiSecret = process.env.API_SECRET;
const baseUrl = process.env.BASE_URL;

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
