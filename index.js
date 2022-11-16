const express = require('express');
const app = express();
const https = require("https");  // import du module HTTPS
const fs = require("fs");
const path = require("path");
const options = {
  key: fs.readFileSync(path.join(__dirname, './cert/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, './cert/cert.pem'))
}
require('dotenv').config({ path: './config/.env' });  // module sans dépendance qui charge les variables d'environnement d'un .env fichier dans process.env

app.use((req, resp, next) => {
  console.log("bonjour");
  resp.setHeader('Access-Control-Allow-Origin', '*');
  resp.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// const cors = require("cors"); 
// app.use(cors()); ne fonctionne plus avec httpsServer
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// initialiser notre structure de donnée pour les préconisations constructeurs
const { initCarnetsEntretiensSdd } = require("./mesModules/carnetsEntretiens/initCarnetsEntretiensSdd");
initCarnetsEntretiensSdd();

app.get('/', (req, resp) => {
  resp.json("ok");
})

const carnetsEntretiensRoute = require("./routes/carnetsEntretiens/carnetsEntretiens");
app.use("/api/carnetsEntretiens", carnetsEntretiensRoute);

const toStandardiserRoute = require("./routes/toStandardiser/toStandardiser");
app.use("/api/toStandardiser", toStandardiserRoute);

const bdd = require("./routes/bdd/bdd");
app.use("/api/bdd", bdd);

app.get("/*", (_, resp) => {
  return resp.status(404).json({ message: "rien à voir ici..." });
})

const httpsServer = https.createServer(options, app);  // création du serveur HTTPS
httpsServer.listen(process.env.PORT, () => {  // écoute du port
  console.log(`https server listening on port ${process.env.PORT}`);  // message de confirmation de l'écoute du port
});
