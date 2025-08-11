import express from "express";

const app = express();
const port = 3000; // TODO: IMPORT from ENV

app.get("/", (req, res) => res.send("Hello world"));
app.listen(port, () => console.log(`App listening to port: ${port}`));
