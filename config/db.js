const mongoose = require("mongoose");


/* fonction de connexion à la base de donnée (BDD) */
async function toConnectBdd() {
    try {
        console.log("Tentative de connexion à la BDD...")
        await mongoose.connect("mongodb+srv://" + process.env.DB_USER_PASS + "@cluster0.7jbewlj.mongodb.net/carelec?retryWrites=true&w=majority");
        console.log("Connexion à la BDD ok")
    } catch (err) {
        throw err;
    }

    return true;
}

/* fonction de déconnexion de la BDD */
async function toDisconnectBdd() {
    await mongoose.disconnect();
    console.log("Déconnexion de la BDD ok");
}

module.exports = { toConnectBdd, toDisconnectBdd }