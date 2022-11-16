const { Model } = require("mongoose");
const { mongoose, User, Revision, Voiture } = require("./models.js");



async function updateUserInfos(userId, newUserinfos) {
    try {
        return await User.findOneAndUpdate(
            { _id: userId },
            {
                $set: newUserinfos
            },
            { new: true })
    } catch (err) {
        console.log("Problème lors de la mise à jour des informations de l'utilisateur");
        console.log(err.message);
        return null;
    }
}

async function checkUserIdExist(userId) {
    let userInfos;
    try {
        userInfos = await User.find({ _id: userId });
    } catch (err) {
        console.log(err.message);
        return null;
    }

    if (userInfos.length === 0)
        return null;

    return userInfos[0];
}

async function signIn(email, passwd) {
    const user = await User.find({ email, passwd });

    if (user.length === 0)
        return null;

    return user[0];
}

async function signUp({ nom, prenom, email, passwd, portable, adresse, ville, cp }) {
    const isExistEmail = await User.find({ email });
    if (isExistEmail.length !== 0) {
        console.log("Email déjà utilisé")
        return null;
    }

    await User.create({
        nom,
        prenom,
        email,
        passwd,
        portable,
        adresse,
        ville,
        cp,
    })
}

async function addCurrentRevision(userId, date, time) {
    if ((await User.find({ _id: userId, currentRevision: null })).length === 0) {
        console.log("addCurrentRevision() : Une révision est déjà en cours");
        return null;
    }

    const currentRevision = await Revision.create({
        dateProgrammer: new Date(`${date}T${time}Z`),
    });

    await User.findOneAndUpdate({
        _id: userId
    },
        {
            $set: {
                "currentRevision": currentRevision
            }
        },
        {
            new: true,
        })

    return currentRevision;
}

async function getCurrentRevision(userId) {
    const userInfos = await checkUserIdExist(userId);
    if (!userInfos) {
        throw new Error("Impossible de trouver un utilisateur avec cette userId");
    }

    const currentRevision = await Revision.find({ _id: userInfos.currentRevision });

    if (currentRevision.length === 0) {
        console.log("getCurrentRevision() : Impossible de trouver une révision courante");
        return null;
    }

    return currentRevision[0];
}

async function updateCurrentRevision(userId, intitule, newValue) {
    let currentRevision = null;
    try {
        currentRevision = await getCurrentRevision(userId);
    } catch (err) {
        // console.log(err.message);
        console.log(err.stack)
        return null;
    }

    try {
        currentRevision = await Revision.findOneAndUpdate({
            _id: currentRevision.id
        }, {
            $set: { [intitule]: newValue }
        }, {
            new: true,
        })
    } catch (err) {
        // console.log(err.stack);
        return null;
    }

    return currentRevision;
}

async function getVoiture(userId) {
    const userInfos = await checkUserIdExist(userId);
    if (!userInfos) {
        console.log("Impossible d'identifier l'utilisateur avec l'userId fournit")
        return null;
    }

    let userCar = userInfos.voiture;
    return (await Voiture.find({ _id: userCar }))[0]
}

async function addVoiture(userId, marque, model, motor, immat, km) {
    const userInfos = await checkUserIdExist(userId);
    if (!userInfos) {
        console.log("Impossible d'identifier l'utilisateur avec l'userId fournit")
        return null;
    }

    let currentVoiture = await Voiture.find({ id: userInfos.voiture });
    if (currentVoiture.length !== 0) {
        console.log("Une voiture est déjà enregistré");
        return null
    }

    let userCar = null;
    try {
        userCar = await Voiture.create({
            marque,
            model,
            motor,
            immat,
            km,
        })
    } catch (err) {
        console.log("Impossible d'ajouter une voiture");
        console.log(err.message);
        return null;
    }

    await User.findOneAndUpdate({ _id: userId }, { $set: { "voiture": userCar } })

    return userCar.id
}

async function toConnectBdd() {
    try {
        await mongoose.connect("mongodb+srv://bfssfb67:w5d85qa2@cluster0.7jbewlj.mongodb.net/carelec?retryWrites=true&w=majority");
    } catch (err) {
        console.log(err.message);
    }
}

if (process.argv[2] === "test")
    toConnectBdd()
        .then(async () => {
            console.log("Connection à la BDD ok")

            await signUp({
                nom: "Bozlak",
                prenom: "Fatih",
                email: "bozlak.fatih@gmail.com",
                passwd: "w5d85qa2",
                portable: "0636679200",
                adresse: "16 rue de macon",
                ville: "Strasbourg",
                cp: "67100"
            });

            console.log(await signIn("bozlak.fatih@gmail.com", "w5d85qa2"));
            console.log(await checkUserIdExist("6356a9eeb341c728095a2fab"));
            console.log(await addVoiture("6356a9eeb341c728095a2fab", "Renault", "Scénic 3", "Scénic 3 110ch", "CL644BL", 123456));
            console.log(await getVoiture("6356a9eeb341c728095a2fab"));
            console.log(await addCurrentRevision("6356a9eeb341c728095a2fab", "2022-08-05", "01:30"))
            console.log(await getCurrentRevision("6356a9eeb341c728095a2fab"));
            console.log(await updateCurrentRevision("6356a9eeb341c728095a2fab", "edlPickUp", { status: "start", default: [1,] }));

        })
        .catch(err => console.log(err));

module.exports = {
    toConnectBdd,
    signUp,
    signIn,
    updateUserInfos,
    addCurrentRevision,
}