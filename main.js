const {app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path');
const fs = require("fs");
const request = require('request');
const {spawn} = require("child_process");

let mainWindow;
let urlInstance = "/.TyroServ/";
let urlInstanceLauncher = urlInstance + "Launcher/";

function createWindow () {
    mainWindow = new BrowserWindow({
        frame: false,
        title: "TyroServ Loader",
        width: 419,
        height: 572,
        resizable: false,
        icon: path.join(__dirname, "/asset/logo.png"),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        }
    })

    mainWindow.loadFile('module/index.html')
    mainWindow.setMenuBarVisibility(false);

}

// CREATION DE L'ONGLET PRINCIPAL
app.whenReady().then(() => {
    createWindow()

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0){
            createWindow()
        }
    })

})

ipcMain.on("start", (event, data) =>{


    let TyroServInstance = path.join(app.getPath("appData"), urlInstance);
    let TyroServInstanceLauncher = path.join(app.getPath("appData"), urlInstanceLauncher);



    /*
    *
    * GESTION DES FICHIER
    *
    * */



    // VERIFIER SI LA S2 EST INSTALLER
    let oldTyroServFile = path.join(app.getPath("appData"), urlInstance + "minecraft.jar");
    let oldTempDirTyroServ = path.join(app.getPath("appData"), ".TyroServ-S2/");
    let oldNewDirTyroServ = path.join(app.getPath("appData"), urlInstance + "TyroServ-S2/");
    if (fs.existsSync(oldTyroServFile)) {
        const moveFolderRecursive = function (source, destination) {
            if (fs.existsSync(source)) {
                fs.mkdirSync(destination, { recursive: true }); // Créer le répertoire de destination s'il n'existe pas
                fs.readdirSync(source).forEach((file, index) => {
                    const currentPath = path.join(source, file);
                    const newPath = path.join(destination, file);
                    if (fs.lstatSync(currentPath).isDirectory()) {
                        // Récursivement, déplacer les sous-dossiers
                        moveFolderRecursive(currentPath, newPath);
                    } else {
                        // Déplacer le fichier
                        fs.renameSync(currentPath, newPath);
                    }
                });
                // Supprimer le répertoire une fois vide
                fs.rmdirSync(source);
                console.log(`Le contenu du repertoire ${source} a ete déplace vers ${destination}.`);
            } else {
                console.log(`Le repertoire ${source} n'existe pas.`);
            }
        };

        const deleteFolderRecursive = function (directory) {
            if (fs.existsSync(directory)) {
                fs.readdirSync(directory).forEach((file, index) => {
                    const currentPath = path.join(directory, file);
                    if (fs.lstatSync(currentPath).isDirectory()) {
                        // Récursivement, supprimer les sous-dossiers
                        deleteFolderRecursive(currentPath);
                    } else {
                        // Supprimer le fichier
                        fs.unlinkSync(currentPath);
                    }
                });
                // Supprimer le répertoire une fois vide
                fs.rmdirSync(directory);
                console.log(`Le repertoire ${directory} a ete supprime.`);
            } else {
                console.log(`Le repertoire ${directory} n'existe pas.`);
            }
        };


        moveFolderRecursive(TyroServInstance, oldTempDirTyroServ)
        deleteFolderRecursive(TyroServInstance);
        moveFolderRecursive(oldTempDirTyroServ, oldNewDirTyroServ)

    }

    // Si il existe déjà un tyroserv
    if (!fs.existsSync(TyroServInstance)) {
        console.log("a creer");

        fs.mkdir(TyroServInstance, (err) => {
            if (err) {
                showErrorDialog("Erreur", 'Une erreur s\'est produite. Veuillez réessayer.');
            } else {
                console.log("Repertoire 'Launcher' cree avec succes.");
            }
        });



    }

    // Si il existe déjà tyroserv/launcher
    if (!fs.existsSync(TyroServInstanceLauncher)){

        fs.mkdir(TyroServInstanceLauncher, (err) => {
            if (err) {
                showErrorDialog("Erreur", 'Une erreur s\'est produite. Veuillez réessayer.');
            } else {
                console.log("Repertoire 'Launcher' cree avec succes.");
            }
        });

    }

    /*
    *
    * SAVOIR LA DERNIER VERSION
    * @avec une api a créer
    *
    * */

    function getInfoLoaderServer(ip) {
        return new Promise((resolve, reject) => {
            request(ip, (error, response, body) => {
                if (error) {
                    reject(error);
                } else {
                    try {
                        const data = JSON.parse(body);
                        resolve(data);
                    } catch (parseError) {
                        reject(parseError);
                    }
                }
            });
        });
    }

    getInfoLoaderServer("http://tyrolium.fr/Download/TyroServS3/launcher/index.php")
        .then(InfoLoaderServer => {
            console.log(InfoLoaderServer)

            let versionName = InfoLoaderServer.latest;
            let linkDownload  = InfoLoaderServer.download;
            let pathLaunch = path.join(app.getPath("appData"), '/.TyroServ/Launcher/' + versionName +'/');

            if (!fs.existsSync(pathLaunch)){
                updatedLauncher(linkDownload, pathLaunch, versionName);
            } else {
                lancement(versionName);
                // showErrorDialog("Erreur Internet", 'Une erreur s\'est produite. Veuillez réessayer.');
            }
        })
        .catch(error => {
            console.log(error);
            showErrorDialog("Erreur Internet", 'Une erreur s\'est produite. Veuillez réessayer.');
        });


    /*
    *
    * INSTALLATION DU LAUNCHER
    *
    * */

    function updatedLauncher(linkDownload, pathLaunch, versionName){

        const http = require('http');
        const AdmZip = require('adm-zip');

        // URL du fichier ZIP à télécharger
        const zipUrl = linkDownload;

        // Emplacement où extraire le contenu du fichier ZIP
        const extractDir = pathLaunch;

        // Fonction pour télécharger et extraire le fichier ZIP
        function downloadAndExtractZip(zipUrl, extractDir) {
            return new Promise((resolve, reject) => {
                const file = fs.createWriteStream('temp.zip');
                http.get(zipUrl, (response) => {
                    response.pipe(file);
                    file.on('finish', () => {
                        file.close(() => {
                            const zip = new AdmZip('temp.zip');
                            zip.extractAllTo(extractDir, /*overwrite*/ true);
                            fs.unlink('temp.zip', (err) => {
                                if (err) reject(err);
                                resolve();
                            });
                        });
                    });
                }).on('error', (err) => {
                    fs.unlink('temp.zip', () => {
                        reject(err);
                    });
                });
            });
        }

        // Appeler la fonction pour télécharger et extraire le fichier ZIP
        downloadAndExtractZip(zipUrl, extractDir)
            .then(() => {
                console.log('Fichier ZIP telecharge et extrait avec succes.');
                lancement(versionName);
            })
            .catch((error) => {
                console.error('Erreur lors du telechargement ou de l\'extraction du fichier ZIP :', error);
                showErrorDialog("Erreur", 'Une erreur s\'est produite. Veuillez réessayer.');
            });

    }

    /*
    *
    * LANCEMENT DU LAUNCHER
    *
    * */

    function lancement(versionName){

        const { spawn} = require('child_process');

        const executablePath = TyroServInstanceLauncher + versionName + '/tyroserv-launcher.exe';

        const options = {
            detached: true,
        };

        const childProcess = spawn(executablePath, [], options);

        childProcess.on('error', (err) => {
            console.error('Erreur lors du lancement de l\'executable :', err);
            showErrorDialog("Erreur", 'Une erreur s\'est produite. Veuillez réessayer.');
        });

        childProcess.on('close', (code) => {
            console.log('L\'executable s\'est termine avec le code de sortie :', code);
            app.quit();
        });

        childProcess.stdout.on('data', function (data) {
            console.log("Launcher talk");
            mainWindow.hide();
        });

    }

});

function showErrorDialog(context, message) {
    dialog.showErrorBox(context, message);
    app.quit();
}
