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
            waitMe(true);
            let fail = args.fail;
            try {
                let path = args.path;
                let done = args.done;
                if (path == "root") {
                    firebase.database().ref("Odemeler/").on("value", (snapshot) => {
                        waitMe(false);
                        done(snapshot.val())
                    })
                }
                else if (path.trim() != "root") {
                    firebase.database().ref("Odemeler/" + path + "/").on("value", (snapshot) => {
                        waitMe(false);
                        done(snapshot.val())
                    })
                }
            }
            catch (error) {
                waitMe(false);
                fail(error);
            }

        }
        function setValue(args) {
            waitMe(true);
            let fail = args.fail;
            try {
                let path = args.path;
                let done = args.done;
                let params = args.params;
                firebase.database().ref("Odemeler/" + path).set(params, (error) => {
                    if (error) {
                        waitMe(false);
                        fail(error);
                    } else {
                        waitMe(false);
                        done(true);
                    }
                })
            }
            catch (error) {
                waitMe(false);
                throw new Error(error).stack;
            }
        }

        function deleteValue(args) {
            waitMe(true);
            let fail = args.fail;
            try {
                let path = args.path;
                let done = args.done;
                firebase.database().ref("Odemeler/" + path).remove((error) => {
                    if (error) {
                        waitMe(false);
                        fail(error);
                    } else {
                        waitMe(false);
                        done(true);
                    }
                })
            }
            catch (error) {
                waitMe(false);
                throw new Error(error).stack;
            }
        }

        function getFunds(args) {
            waitMe(true);
            let fail = args.fail;
            try {
                let done = args.done;
                firebase.database().ref("Fonlar/").on("value", (snapshot) => {
                    waitMe(false);
                    done(snapshot.val())
                })
            }
            catch (error) {
                waitMe(false);
                fail(error);
            }
        }

        function setFunds(args) {
            waitMe(true);
            let fail = args.fail;
            try {
                let done = args.done;
                let params = args.params;
                firebase.database().ref("Fonlar/").set(params, (error) => {
                    if (error) {
                        waitMe(false);
                        fail(error);
                    } else {
                        waitMe(false);
                        done(true);
                    }
                })
            }
            catch (error) {
                throw new Error(error).stack;
            }
        }

        function getInstallments(args) {
            waitMe(true);
            let fail = args.fail;
            let status = "1";
            if (args.status != undefined) {
                status = args.status;
            }
            try {
                let done = args.done;

                firebase.database().ref("Installments/")
                    .orderByChild("status") // "status" alanına göre sırala
                    .equalTo(status) // "status" değeri "1" olanları getir
                    .on("value", (snapshot) => {
                        waitMe(false);
                        done(snapshot.val());
                    });
            } catch (error) {
                waitMe(false);
                fail(error);
            }
        }

        function pushInstallments(args) {
            waitMe(true);
            let fail = args.fail;
            try {
                let done = args.done;
                let params = args.params;
                firebase.database().ref("Installments/").push().set(params, error => {
                    if (error) {
                        waitMe(false);
                        fail(error);
                    }
                    else {
                        waitMe(false);
                        done(true);
                    }
                })
            }
            catch (error) {
                waitMe(false);
                throw new Error(error).stack;
            }
        }

        function updateInstallments(args) {
            waitMe(true);
            let fail = args.fail;
            try {
                let done = args.done;
                let params = args.params;
                let updateKey = args.where;
                firebase.database().ref("Installments/" + updateKey.key).update(params, (error) => {
                    if (error) {
                        waitMe(false);
                        fail(error);
                    } else {
                        waitMe(false);
                        done(true);
                    }
                })
            }
            catch (error) {
                waitMe(false);
                throw new Error(error).stack;
            }
        }
        function deleteInstallments(args) {
            waitMe(true);
            let fail = args.fail;
            try {
                let done = args.done;
                let updateKey = args.where;
                firebase.database().ref("Installments/" + updateKey.key).remove()
                    .then(function () {
                        waitMe(false);
                        done(true);
                    })
                    .catch(function (error) {
                        waitMe(false);
                        fail(false);
                    });
            }
            catch (error) {
                waitMe(false);
                throw new Error(error).stack;
            }
        }

        function insertFundsHistory(args) {
            waitMe(true);
            let fail = args.fail;
            try {
                let done = args.done;
                let params = args.params;
                firebase.database().ref("FonTarihce/").push().set(params, error => {
                    if (error) {
                        waitMe(false);
                        fail(error);
                    }
                    else {
                        waitMe(false);
                        done(true);
                    }
                })
            }
            catch (error) {
                waitMe(false);
                throw new Error(error).stack;
            }
        }
        function getFundsHistory(args) {
            waitMe(true);
            let fail = args.fail;
            try {
                let done = args.done;
                firebase.database().ref("FonTarihce/").on("value", (snapshot) => {
                    waitMe(false);
                    done(snapshot.val())
                })
            }
            catch (error) {
                waitMe(false);
                fail(error);
            }
        }
        function insertPaymentDate(args) {
            let fail = args.fail;
            try {
                let done = args.done;
                let params = args.params;
                firebase.database().ref("OdemeTarihleri/").push().set(params, error => {
                    if (error) {
                        waitMe(false);
                        fail(error);
                    }
                    else {
                        waitMe(false);
                        done(true);
                    }
                })
            }
            catch (error) {
                waitMe(false);
                throw new Error(error).stack;
            }
        }
        function getPaymentDates(args) {
            waitMe(true);
            let fail = args.fail;
            try {
                let done = args.done;
                firebase.database().ref("OdemeTarihleri/").on("value", (snapshot) => {
                    waitMe(false);
                    done(snapshot.val())
                })
            }
            catch (error) {
                waitMe(false);
                fail(error);
            }
        }
        function deletePaymentDates(args) {
            waitMe(true);
            let fail = args.fail;
            try {
                let path = args.path;
                let done = args.done;
                firebase.database().ref("OdemeTarihleri/" + path).remove((error) => {
                    if (error) {
                        waitMe(false);
                        fail(error);
                    } else {
                        waitMe(false);
                        done(true);
                    }
                })
            }
            catch (error) {
                waitMe(false);
                throw new Error(error).stack;
            }
        }
        function saveUserLoggedActivity(args) {
            waitMe(true);
            let fail = args.fail;
            try {
                let done = args.done;
                let params = args.params;
                firebase.database().ref("UserLoggedActivity/").push().set(params, error => {
                    if (error) {
                        waitMe(false);
                        fail(error);
                    }
                    else {
                        waitMe(false);
                        done(true);
                    }
                })
            }
            catch (error) {
                waitMe(false);
                throw new Error(error).stack;
            }
        }

        function getserLoggedActivity(args) {
            waitMe(true);
            let fail = args.fail;
            try {
                let done = args.done;
                let params = args.params;
                firebase.database().ref("UserLoggedActivity/").orderByChild('loginDate').limitToLast(params.lastRecordCount).once('value', snapshot => {
                    const latestTenRecords = [];
                    snapshot.forEach(childSnapshot => {
                        const key = childSnapshot.key;
                        const childData = childSnapshot.val();
                        latestTenRecords.push({ key, ...childData });
                    });
                    waitMe(false);
                    done(latestTenRecords);
                });
            }
            catch (error) {
                waitMe(false);
                fail(error);
            }
        }

        function getStatistics(args) {
            waitMe(true);
            let fail = args.fail;
            try {
                let done = args.done;
                firebase.database().ref("Odemeler/").on("value", (snapshot) => {
                    waitMe(false);
                    done(snapshot.val())
                })
            }
            catch (error) {
                waitMe(false);
                fail(error);
            }
        }

        function getFamilyIncome(args) {
            waitMe(true);
            let fail = args.fail;

            try {
                let done = args.done;

                firebase.database().ref("AileGeliri/")
                    .orderByChild("status")
                    .equalTo("1")
                    .on("value", (snapshot) => {
                        waitMe(false);
                        done(snapshot.val());
                    });
            } catch (error) {
                waitMe(false);
                fail(error);
            }
        }
        function insertFamilyIncome(args) {
            waitMe(true);
            let fail = args.fail;
            let done = args.done;
            let params = args.params;
            try {
                firebase.database().ref("AileGeliri/").push().set(params, error => {
                    if (error) {
                        waitMe(false);
                        fail(error);
                    }
                    else {
                        waitMe(false);
                        done(true);
                    }
                })
            }
            catch (error) {
                waitMe(false);
                fail(error);
            }
        }

        function getFamilyRoutinMoneyOut(args) {
            waitMe(true);
            let fail = args.fail;

            try {
                let done = args.done;

                firebase.database().ref("RutinGider/")
                    .on("value", (snapshot) => {
                        waitMe(false);
                        done(snapshot.val());
                    });
            } catch (error) {
                waitMe(false);
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
            deleteInstallments: deleteInstallments,
            insertFundsHistory: insertFundsHistory,
            getFundsHistory: getFundsHistory,
            insertPaymentDate: insertPaymentDate,
            getPaymentDates: getPaymentDates,
            deletePaymentDates: deletePaymentDates,
            saveUserLoggedActivity: saveUserLoggedActivity,
            getserLoggedActivity: getserLoggedActivity,
            getStatistics: getStatistics,
            getFamilyIncome: getFamilyIncome,
            insertFamilyIncome: insertFamilyIncome,
            getFamilyRoutinMoneyOut:getFamilyRoutinMoneyOut
        }
    }
)();