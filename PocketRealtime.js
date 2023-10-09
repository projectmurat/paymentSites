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
    function(){
        /**
         * @param {Object} args
         */
        function getValue(args){
            let fail = args.fail;
            try
            {
                let path = args.path;
                let done = args.done;
                if(path == "root"){
                    firebase.database().ref("Odemeler/").on("value",(snapshot)=>{
                        done(snapshot.val())
                    })
                }
                else if(path.trim() != "root"){
                    firebase.database().ref("Odemeler/"+path+"/").on("value",(snapshot)=>{
                        done(snapshot.val())
                    })
                }
            }
            catch (error) {
                fail(error);
            }

        }
        function setValue(args){
           let fail = args.fail;
           try
           {
                let path = args.path;
                let done = args.done;
                let params = args.params;
                firebase.database().ref("Odemeler/"+path).set(params, (error) => {
                    if (error) {
                        fail(error);
                    } else {
                        done(true);
                    }
                })
           }
           catch (error)
           {
                throw new Error(error).stack;
           }
        }

        function deleteValue(args) {
            let fail = args.fail;
            try
            {
                    let path = args.path;
                    let done = args.done;
                    firebase.database().ref("Odemeler/"+path).remove((error) => {
                        if (error) {
                            fail(error);
                        } else {
                            done(true);
                        }
                    })
            }
            catch (error)
            {
                    throw new Error(error).stack;
            }
        }

        function getFunds(args) {
            let fail = args.fail;
            try
            {
                let done = args.done;
                firebase.database().ref("Fonlar/").on("value",(snapshot)=>{
                    done(snapshot.val())
                })
            }
            catch (error) {
                fail(error);
            }
        }

        function setFunds(args) {
            let fail = args.fail;
            try
            {
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
            catch (error)
            {
                 throw new Error(error).stack;
            }
        }

        return {
            getValue:getValue,
            setValue:setValue,
            deleteValue:deleteValue,
            getFunds:getFunds,
            setFunds:setFunds
        }
    }
)();