import app from "./app.js";

// TODO: import port and serverUrl from env
const port = 3000;
const serverUrl = `http://localhost:${port}`;

app.listen(port, () => onListening());

function onListening() {
  console.log(`App listening to port: ${port}`);
  console.log(`Available on: ${serverUrl}`);
}
