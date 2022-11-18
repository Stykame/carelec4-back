const mongoose = require("mongoose");
const { User, Revision, Voiture } = require("./models.js");


/* fonction de vérification de l'existance d'une adresse email dans la BDD */
async function isEmailExist(email) {
    let userInfos = null;
    try {
        userInfos = await User.findOne({ email, })
    } catch (err) {
        console.error(err.message);
        return null;
    }

    if (userInfos) {
        console.error("isEmailExist() : Un user existe déjà avec cette email");
        return userInfos
    }

    console.error(`isEmailExiste() : Aucun user avec l'email ${email}`);
    return null;
}

/* fonction d'inscription d'un nouvel utilisateur */
async function signUp(newUserInfos) {
    if (await isEmailExist(newUserInfos.email)) {  // si l'email existe déjà
        return null;  // on quitte la fonction
    }

    let userInfos = null;
    try {
        userInfos = await User.create(newUserInfos);
    } catch (err) {
        console.error(err.message);
        return null;
    }

    return userInfos;
}

/* fonction de connexion d'un utilisateur */
async function signIn(email, passwd) {
    let userInfos = null;
    try {
        userInfos = await User.login(email, passwd);  // email et mot de passe nécessaires pour la connexion
    } catch (err) {
        console.error(err.message);
        return null;
    }

    if (!userInfos) {
        console.error("signIn() : Erreur dans l'email ou passwd");
        return null;
    }

    return userInfos;
}

/* fonction de mise à jour des infos d'un utilisateur */
async function updateUserInfos(email, newUserInfos) {
    if (!(await isEmailExist(email)))  // si l'email existe déjà
        return null;  // on quitte la fonction

    const userInfosUpdated = await User.findOneAndUpdate({ email, }, { $set: newUserInfos }, { new: true })

    return userInfosUpdated;
}

/* fonction de création d'un véhicule */
async function createCar(carData) {
    let userCar = null;

    try {
        userCar = await Voiture.create(carData);
    } catch (err) {
        console.error(err.message);
        return null;
    }

    return userCar;
}

/* fonction d'enregistrement d'un véhicule relié à un utilisateur */
async function addCarToUser(email, carData) {
    if (!(carData instanceof Voiture)) {
        console.error("La voiture (2ème argument) n'est pas une instance de Voiture");
        return null;
    }

    let userInfos = await isEmailExist(email);
    if (!userInfos) {
        console.error("Impossible d'ajouter cette voiture pour l'utilisateur");
        return null;
    }

    userInfos = await updateUserInfos(email, { voiture: carData })

    return userInfos;
}

/* fonction de recherche d'un véhicule utilisateur */
async function getUserCar(carId) {
    if (!mongoose.isValidObjectId(carId)) {
        console.error("Identifiant incorrecte");
        return null;
    }

    let userCar = null;
    try {
        userCar = await Voiture.findById(carId);
        return userCar;
    } catch (err) {
        console.error("getUserCar(): Impossible de trouver la voiture avec cette identifiant");
        return null;
    }
}

/* fonction de mise à jour des kilomètres (km) d'un véhicule utilisateur */
async function updateKmUserCar(email, newKm) {
    if (typeof (newKm) !== "number") {
        console.error("udpateKmUserCar(): le km doit être un entier");
        return null;
    }

    let userInfos = await isEmailExist(email);
    if (!userInfos) {
        console.error("updateKmUserCar(): Impossible de modifier le km, l'user n'existe pas");
        return null;
    }

    let carUserId = userInfos.voiture;
    const userCar = await Voiture.findByIdAndUpdate(carUserId, { $set: { km: newKm } }, { new: true });

    return userCar;
}

async function createRevision(revisionObj) {
    if (!revisionObj) {
        console.error("createRevision(): Aucun objet révision en argument !");
        return null;
    }

    let revision = null;
    try {
        revision = await Revision.create(revisionObj);
    } catch (err) {
        console.error(err.message);
        return null;
    }

    return revision;
}

async function addRevisionToUser(email, revisionObj) {
    // PAS NECESSAIRE, dans updateUserInfos déjà vérifié
    // const userInfos = await User.findOne({email,});
    // if(!userInfos) {
    //     console.error("Impossible d'ajouter une révision, car l'utilisateur n'existe pas");
    //     return null;
    // }

    let userInfosUpdated = null;
    try {
        userInfosUpdated = await updateUserInfos(email, { currentRevision: revisionObj })
    } catch (err) {
        console.error(err.message);
        return null;
    }

    return userInfosUpdated.currentRevision;
}

async function updateRevisionStatus(revisionId, field, newStatus) {
    let currentRevision = await Revision.findById(revisionId);
    if (!currentRevision) {
        console.error("updateRevisionStatus() : Impossible de trouver la révision rechercher par id");
        return null;
    }

    currentRevision[field].status = newStatus;

    try {
        await currentRevision.save();
    } catch (err) {
        console.error(err.message);
        console.error("updateRevisionStatus() : Impossible de mettre à jours la révision");
        return null;
    }

    return currentRevision;
}

async function updateRevisionEdl(revisionId, typeEdl, edls) {
    let currentRevision = await Revision.findById(revisionId);
    if (!currentRevision) {
        console.error("updateRevisionEdl() : Impossible de trouver la révision rechercher par id");
        return null;
    }

    currentRevision[typeEdl].default = currentRevision[typeEdl].default.concat(edls);

    try {
        await currentRevision.save();
    } catch (err) {
        console.error(err.message);
        console.error("updateRevisionEdl() : Impossible de mettre à jours la révision");
        return null;
    }

    return currentRevision;
}

async function addTacheInRevision(revisionId, newTache) {
    let currentRevision = await Revision.findById(revisionId);
    if (!currentRevision) {
        console.error("addTacheInRevision() : Impossible de trouver la révision rechercher par id");
        return null;
    }

    currentRevision.entretien = currentRevision.entretien.concat(newTache);

    try {
        currentRevision.markModified("entretien");
        await currentRevision.save();
    } catch (err) {
        console.error(err.message);
        console.error("addTacheInRevision() : Impossible de mettre à jours la révision");
        return null;
    }

    return currentRevision;
}

async function addImgForTache(revisionId, tacheIntitule, newImg) {
    const currentRevision = await Revision.findById(revisionId);
    if (!currentRevision) {
        console.error("addImgForTache() : Impossible de trouver la révision rechercher par id");
        return null;
    }

    for (tache of currentRevision.entretien) {
        if (tache.intitule === tacheIntitule) {
            if (tache.imgs)
                tache.imgs = tache.imgs.concat(newImg);
            else
                tache.imgs = [newImg];
        }
    }

    try {
        currentRevision.markModified("entretien");
        await currentRevision.save();
    } catch (err) {
        console.error(err.message);
        console.error("addImgForTache() : Impossible de mettre à jours la révision");
        return null;
    }

    return currentRevision;
}

module.exports = {
    signUp,
    signIn,
    updateUserInfos,
    createCar,
    addCarToUser,
    getUserCar,
    updateKmUserCar,
    createRevision,
    addRevisionToUser,
    updateRevisionStatus,
    updateRevisionEdl,
    addTacheInRevision,
    addImgForTache,
    isEmailExist,
}