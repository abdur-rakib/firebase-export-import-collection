const firebase = require("firebase-admin");

var serviceAccountSource = require("./source.json"); // source DB key
var serviceAccountDestination = require("./destination.json"); // destiny DB key

const sourceAdmin = firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccountSource),
});

const destinationAdmin = firebase.initializeApp(
  {
    credential: firebase.credential.cert(serviceAccountDestination),
  },
  "destination"
);

/* this schema is how your DB is organized in a tree structure. You don't have to care about the Documents
  but you do need to inform the name of your collections and any subcollections, in this
  case we have two collections called users and groups, the all have their documents, but 
  the collection users has its own subcollections, friends and groups, which again have their
  own subcollection, messages.
*/
const aux = {
  tasks: {},
  Categories: {},
  UserLevels: {},
};

var source = sourceAdmin.firestore();
var destination = destinationAdmin.firestore();

const copy = (sourceDBrep, destinationDBref, aux) => {
  return Promise.all(
    Object.keys(aux).map((collection) => {
      return sourceDBrep
        .collection(collection)
        .get()
        .then((data) => {
          let promises = [];
          data.forEach((doc) => {
            const data = doc.data();
            promises.push(
              destinationDBref
                .collection(collection)
                .doc(doc.id)
                .set(data)
                .then((data) => {
                  return copy(
                    sourceDBrep.collection(collection).doc(doc.id),
                    destinationDBref.collection(collection).doc(doc.id),
                    aux[collection]
                  );
                })
            );
          });
          return Promise.all(promises);
        });
    })
  );
};

copy(source, destination, aux).then(() => {
  console.log("copied");
});
