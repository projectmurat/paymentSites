firebase.initializeApp({
     "apiKey": "AIzaSyAyDSJ0AwuVtIltNNlAl9r8jeJ7un5fagA",
     "authDomain": "paymentamount-1c238.firebaseapp.com",
     "projectId": "paymentamount-1c238",
     "storageBucket": "paymentamount-1c238.appspot.com",
     "messagingSenderId": "798570014752",
     "appId": "1:798570014752:web:5f477337fb0c83a8143445",
     "measurementId": "G-Q6D9DPXLYL"
});
var db = firebase.database()
let PocketRealtimeGeneric = (
     function () {
          function get(args) {
               let path = args.path;
               let params = args.params;
               let options = args.options;
               let done = args.done;
               let fail = args.fail;
               try {
                    let ref = db.ref(path);
                    if(options)
                    db.ref(path).on("value", (snapshot) => {
                         done(snapshot.val());
                    })

               } catch (error) {
                    fail(error);
               }
          }

          function put(args) {
               let path = args.path;
               let params = args.params;
               let options = args.options
               let done = args.done;
               let fail = args.fail;
               try {
                    if(options.unique){
                         db.ref(path).push().set(params, error => {
                              if (error) {
                                  fail(error);
                              }
                              else {
                                  done(true);
                              }
                          })
                    }
                    else{
                         db.ref(path).set(params, (error) => {
                              if (error) {
                                   fail(error);
                              } else {
                                   done(true);
                              }
                          })
                    }
               } catch (error) {
                    fail(error);
               }
          }
          function update(args) {

          }

          return {
               get: get,
          }
     }
)();