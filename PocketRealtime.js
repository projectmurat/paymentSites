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
                firebase.database().ref("UserLoggedActivity/").orderByChild('timestamp').limitToLast(params.lastRecordCount).once('value', snapshot => {
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

        function insertFundStatistic(args) {
            let fail = args.fail;
            try {
                let done = args.done;
                let params = args.params;
                firebase.database().ref("FonStatistics/").push().set(params, error => {
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

        function deleteFundStatistic(args) {
            waitMe(true);
            let fail = args.fail;
            try {
                let path = args.path;
                let done = args.done;
                firebase.database().ref("FonStatistics/" + path).remove((error) => {
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

        function getFundStatistic(args) {
            waitMe(true);
            let fail = args.fail;

            try {
                let done = args.done;

                firebase.database().ref("FonStatistics/")
                    .on("value", (snapshot) => {
                        waitMe(false);
                        done(snapshot.val());
                    });
            } catch (error) {
                waitMe(false);
                fail(error);
            }
        }

        function getRefData(args) {
            waitMe(true);
            let fail = args.fail;

            try {
                let done = args.done;
                let refDataPath = args.params.path;
                firebase.database().ref("ReferenceData/" + refDataPath)
                    .on("value", (snapshot) => {
                        waitMe(false);
                        done(snapshot.val());
                    });
            } catch (error) {
                waitMe(false);
                fail(error);
            }
        }


        // Notları Firebase'den çeken fonksiyon
        function getNotes(args) {
            waitMe(true);
            let fail = args.fail;

            try {
                let done = args.done;
                firebase.database().ref("Notes/")
                    .once("value", (snapshot) => {
                        waitMe(false);
                        const notesObject = snapshot.val(); // Firebase'den obje olarak gelir
                        const notesArray = [];

                        // Objeyi diziye dönüştürüyoruz, Firebase'in push anahtarlarını da tutuyoruz
                        for (let key in notesObject) {
                            if (notesObject.hasOwnProperty(key)) {
                                notesArray.push({
                                    firebaseId: key, // Firebase'in otomatik ID'si
                                    ...notesObject[key] // Notun diğer bilgileri (id, title, content, created)
                                });
                            }
                        }
                        done(notesArray); // Diziyi geri döndür
                    }, (error) => { // Hata durumunu da yakala
                        waitMe(false);
                        fail(error);
                    });
            } catch (error) {
                waitMe(false);
                fail(error);
            }
        }

        // Yeni not ekleyen fonksiyon
        function addNotes(args) {
            waitMe(true);
            let fail = args.fail;
            try {
                let done = args.done;
                let noteData = args.params; // Artık params tek bir not objesi olacak

                const rawCreatedDate = new Date().toISOString(); // Firebase'e göndermeden önceki ham tarih
                noteData.created = fundsLastCallbackTime(rawCreatedDate); // Metodu uygulayıp sonucu atıyoruz
                noteData.updated = fundsLastCallbackTime(rawCreatedDate); // Metodu uygulayıp sonucu atıyoruz

                // Eğer not objesinde 'id' alanı yoksa ekleyebilirsiniz
                if (!noteData.id) {
                    noteData.id = Date.now();
                }

                // firebase.database().ref("Notes/").push() ile yeni bir referans oluşturup set ediyoruz
                firebase.database().ref("Notes/").push().set(noteData, error => {
                    if (error) {
                        waitMe(false);
                        fail(error);
                    } else {
                        waitMe(false);
                        done(true); // Başarılı olduğunu belirt
                    }
                });
            } catch (error) {
                waitMe(false);
                throw new Error(error).stack;
            }
        }

        // Not güncelleyen fonksiyon (YENİ)
        function updateNotes(args) {
            waitMe(true);
            let fail = args.fail;
            try {
                let done = args.done;
                let firebaseId = args.params.firebaseId; // Güncellenecek notun Firebase ID'si
                let updatedData = args.params.data;     // Güncellenecek notun verileri (title, content, created)

                if (!firebaseId) {
                    throw new Error("Güncellenecek notun Firebase ID'si belirtilmedi.");
                }

                // Belirli bir firebaseId altındaki veriyi güncelliyoruz
                firebase.database().ref("Notes/" + firebaseId).update(updatedData, error => {
                    if (error) {
                        waitMe(false);
                        fail(error);
                    } else {
                        waitMe(false);
                        done(true); // Başarılı olduğunu belirt
                    }
                });
            } catch (error) {
                waitMe(false);
                throw new Error(error).stack;
            }
        }

        // Not silen fonksiyon (YENİ)
        function deleteNotes(args) {
            waitMe(true);
            let fail = args.fail;
            try {
                let done = args.done;
                let firebaseId = args.params.firebaseId; // Silinecek notun Firebase ID'si

                if (!firebaseId) {
                    throw new Error("Silinecek notun Firebase ID'si belirtilmedi.");
                }

                // Belirli bir firebaseId altındaki veriyi siliyoruz
                firebase.database().ref("Notes/" + firebaseId).remove(error => {
                    if (error) {
                        waitMe(false);
                        fail(error);
                    } else {
                        waitMe(false);
                        done(true); // Başarılı olduğunu belirt
                    }
                });
            } catch (error) {
                waitMe(false);
                throw new Error(error).stack;
            }
        }

        function getNotifications(args) {
            // waitMe(true); // Sürekli dinlemede olduğu için bu kancayı kaldırabiliriz
            let fail = args.fail;
            let done = args.done; // Done callback'i her veri değişiminde çağrılacak

            try {
                // .on("value") ile gerçek zamanlı dinleme
                // ! Önemli: Bu dinleyiciyi uygulamanız kapandığında veya kullanıcı çıkış yaptığında kapatmanız gerekebilir.
                // Örneğin: firebase.database().ref("notifications/").off("value")
                firebase.database().ref("notifications/")
                    .on("value", (snapshot) => {
                        // waitMe(false); // Her değişimde waitMe çalıştırmayız
                        const notificationsObject = snapshot.val();
                        const notificationsArray = [];

                        for (let key in notificationsObject) {
                            if (notificationsObject.hasOwnProperty(key)) {
                                notificationsArray.push({
                                    firebaseId: key,
                                    ...notificationsObject[key]
                                });
                            }
                        }
                        done(notificationsArray); // Gelen veriyi callback'e gönder
                    }, (error) => {
                        // waitMe(false);
                        console.error("Firebase bildirim dinleyicisinde hata:", error);
                        fail(error);
                    });
            } catch (error) {
                // waitMe(false);
                fail(error);
            }
        }

        // Yeni bildirim ekleyen fonksiyon (Öncekiyle aynı kalır)
        function addNotification(args) {
            waitMe(true);
            let fail = args.fail;
            try {
                let done = args.done;
                let notificationData = args.params;

                notificationData.createdAt = new Date().toISOString();
                // scheduledTime zaten ISO formatında gelmeli inputtan

                firebase.database().ref("notifications/").push().set(notificationData, error => {
                    if (error) {
                        waitMe(false);
                        fail(error);
                    } else {
                        waitMe(false);
                        done(true);
                    }
                });
            } catch (error) {
                waitMe(false);
                throw new Error(error).stack;
            }
        }

        // Bildirim güncelleyen fonksiyon (Öncekiyle aynı kalır, isTriggered güncellenecek)
        function updateNotification(args) {
            waitMe(true);
            let fail = args.fail;
            try {
                let done = args.done;
                let firebaseId = args.params.firebaseId;
                let updatedData = args.params.data;

                if (!firebaseId) {
                    throw new Error("Güncellenecek bildirimin Firebase ID'si belirtilmedi.");
                }

                firebase.database().ref("notifications/" + firebaseId).update(updatedData, error => {
                    if (error) {
                        waitMe(false);
                        fail(error);
                    } else {
                        waitMe(false);
                        done(true);
                    }
                });
            } catch (error) {
                waitMe(false);
                throw new Error(error).stack;
            }
        }

        // Bildirim silen fonksiyon (Öncekiyle aynı kalır)
        function deleteNotification(args) {
            waitMe(true);
            let fail = args.fail;
            try {
                let done = args.done;
                let firebaseId = args.params.firebaseId;

                if (!firebaseId) {
                    throw new Error("Silinecek bildirimin Firebase ID'si belirtilmedi.");
                }

                firebase.database().ref("notifications/" + firebaseId).remove(error => {
                    if (error) {
                        waitMe(false);
                        fail(error);
                    } else {
                        waitMe(false);
                        done(true);
                    }
                });
            } catch (error) {
                waitMe(false);
                throw new Error(error).stack;
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
            getFamilyRoutinMoneyOut: getFamilyRoutinMoneyOut,
            insertFundStatistic: insertFundStatistic,
            deleteFundStatistic: deleteFundStatistic,
            getFundStatistic: getFundStatistic,
            getRefData: getRefData,
            getNotes: getNotes,
            addNotes: addNotes,
            deleteNotes: deleteNotes,
            updateNotes: updateNotes,
            getNotifications:getNotifications,
            addNotification:addNotification,
            updateNotification:updateNotification,
            deleteNotification:deleteNotification
        }
    }
)();