const { toConnectBdd, toDisconnectBdd } = require("../../config/db.js");
const {
    signIn,
    signUp,
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
    addImgForTache
} = require("./controllersBdd.js");
const { User, Voiture, Revision } = require("./models.js");


jest.setTimeout(100000)
const usersData = [];
const nbCreationCompte = 1;
const randNb = (max) => Math.floor(Math.random() * max);
const randNbXXStr = (DayOrMouth) => {
    let nb = null;
    switch (DayOrMouth) {
        case "Day":
            nb = randNb(32);
            break;
        case "Month":
            nb = randNb(13);
            break;
        case "Hour":
            nb = randNb(24);
            break;
        case "Minute":
        case "Second":
            nb = randNb(60);
            break;
    }

    if (nb === 0)
        return "0" + ++nb;

    if (nb < 10)
        return ("0" + nb);

    return "" + nb;
}

beforeAll(async () => {
    jest.spyOn(console, 'error');
    console.error.mockImplementation(() => null);
    for (let i = 0; i < nbCreationCompte; i++) {
        usersData.push({
            nom: "Bozlak",
            prenom: "Fatih",
            email: "bozlak.fatih." + Math.floor(Math.random() * 1E20) + "@gmail.com",
            passwd: "w5d85qa2",
            portable: "0636679200",
            adresse: "16 rue de macon",
            ville: "Strasbourg",
            cp: "67100"
        })
    }
    console.log(usersData)

    await toConnectBdd();
    await User.deleteMany({});
    await Voiture.deleteMany({});
    await Revision.deleteMany({});
});
afterAll(async () => await toDisconnectBdd());

describe("Création de compte", () => {
    test("Tester la création de nouveau compte", async () => {
        for (let i = 0; i < nbCreationCompte; i++) {
            let retourSignUp = await signUp(usersData[i]);
            expect(retourSignUp).toEqual(expect.objectContaining({
                ...usersData[i],
            }));
        }
    });

    test("Tester l'impossibilité de créer un compte avec un email déjà existant", async () => {
        for (let i = 0; i < nbCreationCompte; i++) {
            let retourSignUp = await signUp(usersData[i]);
            expect(retourSignUp).toBeNull();
        }
    });
});

describe("Se connecter à un compte", () => {
    test("Test avec des identifiants correcte", async () => {
        for (item of usersData) {
            let retourSignIn = await signIn(item.email, item.passwd);
            expect(retourSignIn).toEqual(expect.objectContaining({
                ...item,
            }));
        }
    })

    test("Test avec des identifiants incorrecte", async () => {
        const dataForTest = [{
            email: "bozlak@.com",
            passwd: "w5d85qa2"
        }, {
            email: "",
            passwd: "w5d85qa2"
        }, {
            email: null,
            passwd: null
        }];

        for (let data of dataForTest) {
            let retourSignIn = await signIn(data.email, data.passwd);
            expect(retourSignIn).toBeNull();
        }
    })
});

describe("Mettre à jours les informations principale d'un compte", () => {
    test("Tester des changement (sauf email et passwd pour le moment)", async () => {
        const dataUpdated = [];
        usersData.map(item => {
            let newItem = Object.assign({}, item);
            newItem.nom = Math.floor(Math.random() * 1E10).toString();
            newItem.prenom = Math.floor(Math.random() * 1E10).toString();
            newItem.portable = Math.floor(Math.random() * 1E10).toString();
            newItem.adresse = Math.floor(Math.random() * 1E10).toString();
            newItem.ville = Math.floor(Math.random() * 1E10).toString();
            newItem.cp = Math.floor(Math.random() * 1E10).toString();
            dataUpdated.push(newItem);
        })

        for (let newData of dataUpdated) {
            let retourUpdateUserInfos = await updateUserInfos(newData.email, newData);
            expect(retourUpdateUserInfos).toEqual(expect.objectContaining({ ...newData }))
        }
    });
});

describe("Gestion d'une voiture d'un client : ajout, maj", () => {
    const carsData = [];
    const usersCar = [];

    beforeAll(() => {
        usersData.map(() => {
            carsData.push({
                immat: Math.floor(Math.random() * 1E10).toString(),
                marque: Math.floor(Math.random() * 1E10).toString(),
                model: Math.floor(Math.random() * 1E10).toString(),
                motor: Math.floor(Math.random() * 1E10).toString(),
                km: Math.floor(Math.random() * 1E10)
            })
        });
    })

    test("Création d'une voiture dans la bdd", async () => {
        for (let carData of carsData) {
            let userCar = await createCar(carData);
            expect(userCar).toEqual(expect.objectContaining({ ...carData }));
            usersCar.push(userCar);
        }
    });

    test("Associer une voiture à un user", async () => {
        for (let i = 0; i < usersData.length; i++) {
            let userInfosWithCarRef = await addCarToUser(usersData[i].email, usersCar[i]);
            expect(userInfosWithCarRef.voiture).toEqual(usersCar[i]._id);
        }
    });

    test("Associer une voiture à un user qui n'existe pas", async () => {
        for (let i = 0; i < usersData.length; i++) {
            let noExistEmail = Math.floor(Math.random() * 1E10).toString();
            let userInfosWithCarRef = await addCarToUser(noExistEmail, usersCar[i]);
            expect(userInfosWithCarRef).toBeNull()
        }
    });

    test("Tenter d'associer une voiture qui n'existe pas, ou avec des valeurs non conforme à un User", async () => {
        let userInfosBefore = await signIn(usersData[0].email, "w5d85qa2");
        let userInfosWithCarRef = await addCarToUser(usersData[0].email, null);
        let userInfosAfter = await signIn(usersData[0].email, "w5d85qa2");
        expect(userInfosWithCarRef).toBeNull();
        expect(userInfosBefore).toEqual(userInfosAfter);

        userInfosBefore = await signIn(usersData[0].email, "w5d85qa2");
        userInfosWithCarRef = await addCarToUser(usersData[0].email, { lol: "mdr" });
        userInfosAfter = await signIn(usersData[0].email, "w5d85qa2");
        expect(userInfosWithCarRef).toBeNull();
        expect(userInfosBefore).toEqual(userInfosAfter);

        userInfosBefore = await signIn(usersData[0].email, "w5d85qa2");
        userInfosWithCarRef = await addCarToUser(usersData[0].email);
        userInfosAfter = await signIn(usersData[0].email, "w5d85qa2");
        expect(userInfosWithCarRef).toBeNull();
        expect(userInfosBefore).toEqual(userInfosAfter);

        userInfosBefore = await signIn(usersData[0].email, "w5d85qa2");
        userInfosWithCarRef = await addCarToUser(usersData[0].email, "ptdr");
        userInfosAfter = await signIn(usersData[0].email, "w5d85qa2");
        expect(userInfosWithCarRef).toBeNull();
        expect(userInfosBefore).toEqual(userInfosAfter);
    });

    test("Modifier le km d'une voiture d'un user et tester qu'elle est prise en compte dans les informations d'un user", async () => {
        for (let i = 0; i < usersData.length; i++) {
            let newKmUserCar = Math.floor(Math.random() * 1E10);
            let retourUpdateKmUserCar = await updateKmUserCar(usersData[i].email, newKmUserCar);
            let userInfos = await signIn(usersData[i].email, usersData[i].passwd);
            let userCar = await getUserCar(userInfos.voiture);
            expect(retourUpdateKmUserCar.km).toEqual(newKmUserCar);
            expect(newKmUserCar).toEqual(userCar.km);
        }
    });
});

describe("Gestion d'une révision", () => {
    const revisionsData = [];
    const usersRevision = [];
    const status = ["noStart", "enCours", "Terminé"];
    const fields = ["pickUp", "edlPickUp", "backToGarage", "dropUp", "edlDropUp"];
    const intitulesTache = ["Changement filtre à huile", "Remplacement courroie de distri", "Niveau huile", "Remplacement disque de frein"];

    beforeAll(() => {
        for (let userData of usersData) {
            let day = randNbXXStr("Day");
            let month = randNbXXStr("Month");
            let hour = randNbXXStr("Hour");
            let minute = randNbXXStr("Minute");
            let second = randNbXXStr("Second");

            revisionsData.push({
                dateProgrammer: new Date(`2022-${month}-${day}T${hour}:${minute}:${second}Z`)
            })
        }
    });

    test("Création d'une révision intitial dans la bdd", async () => {
        for (revisionData of revisionsData) {
            let retCreateRevision = await createRevision(revisionData);
            usersRevision.push(retCreateRevision);
            let revisionInBdd = await Revision.findById(retCreateRevision.id);
            expect(revisionInBdd).toEqual(expect.objectContaining(revisionData));
        }
    });

    test("Lier une révision existante dans la bdd à un user", async () => {
        for (i = 0; i < usersData.length; i++) {
            let retAddRevisionToUser = await addRevisionToUser(usersData[i].email, usersRevision[i]);
            let userInfos = await signIn(usersData[i].email, usersData[i].passwd);
            expect(userInfos.currentRevision).toEqual(retAddRevisionToUser)
        }
    });

    test("Modifier une révision -> changer l'état de 'status' des différents champs", async () => {
        for (let i = 0; i < usersData.length; i++) {
            let newStatus = status[randNb(3)];
            for (field of fields) {
                let retUpdateRevisionStatus = await updateRevisionStatus(usersRevision[i].id, field, newStatus);
                let userInfos = await signIn(usersData[i].email, usersData[i].passwd);
                let userRevision = await Revision.findById(userInfos.currentRevision);
                expect(retUpdateRevisionStatus[field].status).toEqual(userRevision[field].status);
            }
        }
    });

    test("Rajouter des defaults (edl) {commentaire: blabla, posX: Xpx, posY: Ypx} dans edlPickUp ou edlDropUp", async () => {
        const typesEdl = ["edlPickUp", "edlDropUp"];
        for (let i = 0; i < usersData.length; i++) {
            let userInfos = await signIn(usersData[i].email, usersData[i].passwd);
            let typeEdl = typesEdl[randNb(2)];
            let currentRevisionInBdd = await Revision.findById(userInfos.currentRevision);
            let edlsInBdd = currentRevisionInBdd[typeEdl].default;
            let edls = [];
            for (let nbDefaults = 0; nbDefaults < randNb(10); nbDefaults++) {
                let edl = {}
                edl.commentaire = randNb(1E10) + "";
                edl.posX = randNb(1E5);
                edl.posY = randNb(1E5);
                edls.push(edl);
            }

            let retUpdateRevisionEdl = await updateRevisionEdl(userInfos.currentRevision, typeEdl, edls);
            edlsInBdd = (await Revision.findById(userInfos.currentRevision))[typeEdl].default;
            expect(edlsInBdd.sort()).toEqual(retUpdateRevisionEdl[typeEdl].default.sort())
        }
    });

    test("Ajouter des tâches dans 'entretien' sous la forme {status: '', intitulé: '' imgs: ['', '']}", async () => {
        for (let i = 0; i < usersData.length; i++) {
            for (let j = 0; j < 1; j++) {
                const statusChoisie = status[randNb(status.length)]
                const intituleChoisie = intitulesTache[randNb(intitulesTache.length)];

                let userInfos = await signIn(usersData[i].email, usersData[i].passwd);
                let allTachesInBdd = (await Revision.findById(userInfos.currentRevision)).entretien;

                let newTache = {
                    status: statusChoisie,
                    intitule: intituleChoisie,
                }

                let allTachesInBddWithNewTache = allTachesInBdd.concat(newTache);

                const retAddTacheInRevision = await addTacheInRevision(userInfos.currentRevision, newTache);

                expect(retAddTacheInRevision.entretien).toEqual(allTachesInBddWithNewTache);
            }
        }
    });

    test("Ajouter des images pour une tâche donnée", async () => {
        const libellesImg = ["avant", "après"];
        for (let i = 0; i < usersData.length; i++) {
            const userInfos = await signIn(usersData[i].email, usersData[i].passwd);
            let currentRevision = await Revision.findById(userInfos.currentRevision);

            for (let tache of currentRevision.entretien) {
                const libelleImg = libellesImg[randNb(libellesImg.length)];
                const path = randNb(1E10) + ".png";
                const newImg = { libelleImg, path };

                let imgsInBddForTache = currentRevision[tache]?.imgs;
                let imgsInBddForTacheWithNewImg = null;
                if (imgsInBddForTache)
                    imgsInBddForTacheWithNewImg = imgsInBddForTache.concat(newImg);
                else
                    imgsInBddForTacheWithNewImg = [newImg]

                let retAddImgForTache = await addImgForTache(userInfos.currentRevision, tache.intitule, newImg);
                currentRevision = await Revision.findById(userInfos.currentRevision);

                expect(retAddImgForTache[tache]?.imgs).toEqual(currentRevision[tache]?.imgs);
            }
        }
    });
});