import app from "./app";
import { SERVER_PORT } from "../../global-config";

app.listen(SERVER_PORT, () => console.log(`Listening on port ${SERVER_PORT}.`));