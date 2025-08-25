import app from "./app.js";

// TODO: import port from env
const port = 3000;

app.listen(port, () => onListening());

function onListening() {
  console.log(`App listening to port: ${port}`);
}
