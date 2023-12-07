firebase.initializeApp({
    "apiKey": "AIzaSyAyDSJ0AwuVtIltNNlAl9r8jeJ7un5fagA",
    "authDomain": "paymentamount-1c238.firebaseapp.com",
    "projectId": "paymentamount-1c238",
    "storageBucket": "paymentamount-1c238.appspot.com",
    "messagingSenderId": "798570014752",
    "appId": "1:798570014752:web:5f477337fb0c83a8143445",
    "measurementId": "G-Q6D9DPXLYL"
});
let PocketRealtime = (
    function () {
        /**
         * @param {Object} args
         */
        function getValue(args) {
            let fail = args.fail;
            try {
                let path = args.path;
                let done = args.done;
                if (path == "root") {
                    firebase.database().ref("Odemeler/").on("value", (snapshot) => {
                        done(snapshot.val())
                    })
                }
                else if (path.trim() != "root") {
                    firebase.database().ref("Odemeler/" + path + "/").on("value", (snapshot) => {
                        done(snapshot.val())
                    })
                }
            }
            catch (error) {
                fail(error);
            }

        }
        function setValue(args) {
            let fail = args.fail;
            try {
                let path = args.path;
                let done = args.done;
                let params = args.params;
                firebase.database().ref("Odemeler/" + path).set(params, (error) => {
                    if (error) {
                        fail(error);
                    } else {
                        done(true);
                    }
                })
            }
            catch (error) {
                throw new Error(error).stack;
            }
        }

        function deleteValue(args) {
            let fail = args.fail;
            try {
                let path = args.path;
                let done = args.done;
                firebase.database().ref("Odemeler/" + path).remove((error) => {
                    if (error) {
                        fail(error);
                    } else {
                        done(true);
                    }
                })
            }
            catch (error) {
                throw new Error(error).stack;
            }
        }

        function getFunds(args) {
            let fail = args.fail;
            try {
                let done = args.done;
                firebase.database().ref("Fonlar/").on("value", (snapshot) => {
                    done(snapshot.val())
                })
            }
            catch (error) {
                fail(error);
            }
        }

        function setFunds(args) {
            let fail = args.fail;
            try {
                let done = args.done;
                let params = args.params;
                firebase.database().ref("Fonlar/").set(params, (error) => {
                    if (error) {
                        fail(error);
                    } else {
                        done(true);
                    }
                })
            }
            catch (error) {
                throw new Error(error).stack;
            }
        }

        function getInstallments(args) {
            let fail = args.fail;
            try {
                let done = args.done;
                firebase.database().ref("Installments/").on("value", (snapshot) => {
                    done(snapshot.val())
                })
            }
            catch (error) {
                fail(error);
            }
        }
        function pushInstallments(args) {
            let fail = args.fail;
            try {
                let done = args.done;
                let params = args.params;
                firebase.database().ref("Installments/").push().set(params, error => {
                    if (error) {
                        fail(error);
                    }
                    else {
                        done(true);
                    }
                })
            }
            catch (error) {
                throw new Error(error).stack;
            }
        }

        function updateInstallments(args) {
            let fail = args.fail;
            try {
                let done = args.done;
                let params = args.params;
                let updateKey = args.where;
                firebase.database().ref("Installments/" + updateKey.key).update(params, (error) => {
                    if (error) {
                        fail(error);
                    } else {
                        done(true);
                    }
                })
            }
            catch (error) {
                throw new Error(error).stack;
            }
        }
        function deleteInstallments(args) {
            let fail = args.fail;
            try {
                let done = args.done;
                let updateKey = args.where;
                firebase.database().ref("Installments/" + updateKey.key).remove()
                    .then(function () {
                        done(true);
                    })
                    .catch(function (error) {
                        fail(false);
                    });
            }
            catch (error) {
                throw new Error(error).stack;
            }
        }

        function insertFundsHistory(args) {
            let fail = args.fail;
            try {
                let done = args.done;
                let params = args.params;
                firebase.database().ref("FonTarihce/").push().set(params, error => {
                    if (error) {
                        fail(error);
                    }
                    else {
                        done(true);
                    }
                })
            }
            catch (error) {
                throw new Error(error).stack;
            }
        }
        function getFundsHistory(args) {
            let fail = args.fail;
            try {
                let done = args.done;
                firebase.database().ref("FonTarihce/").on("value", (snapshot) => {
                    done(snapshot.val())
                })
            }
            catch (error) {
                fail(error);
            }
        }

        return {
            getValue: getValue,
            setValue: setValue,
            deleteValue: deleteValue,
            getFunds: getFunds,
            setFunds: setFunds,
            getInstallments: getInstallments,
            pushInstallments: pushInstallments,
            updateInstallments: updateInstallments,
            deleteInstallments:deleteInstallments,
            insertFundsHistory:insertFundsHistory,
            getFundsHistory:getFundsHistory
        }
    }
)();