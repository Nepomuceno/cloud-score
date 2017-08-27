var documentClient = require("documentdb").DocumentClient;
var url = require('url');
var axios = require('axios').default;
const googleTrends = require('google-trends-api');
// import {RetrievedDocument} from 'documentdb';

var config = {}

config.endpoint = "https://cloud-score.documents.azure.com:443/";
config.primaryKey = "6JYuSMTihETJCnGPDGBAfrBq03VYzguhVi75XUdb0DJedQyrEQ7FOE8ABNW6aoj8arXjYuAhRpw0v6WPEz5R1Q==";
var documents;


config.database = {
    "id": "Providers"
};

config.collection = {
    "id": "ProvidersData"
};

config.documents = {
    aws: {
        id: "aws",
        name: "Amazon web services",
        keyword: "aws",
        trendsId: "/m/05nrgx",
        area: "cloud"
    },
    gcp: {
        id: "gcp",
        name: "Google cloud computer",
        keyword: "gcp",
        trendsId: "/m/0105pbj4",
        area: "cloud"

    },
    azure: {
        id: "azure",
        name: "Micorosft azure",
        keyword: "azure",
        trendsId: "/m/04y7lrx",
        area: "cloud"
    },
    vmware: {
        id: "vmware",
        name: "VMware",
        keyword: "vmware",
        trendsId: "/m/01t9k5",
        area: "cloud"
    }
};

let reedUrl = 'https://www.reed.co.uk/api/1.0/search?keywords=';
var trendsUrl = `https://trends.google.com/trends/fetchComponent?date=today%201-m&geo=GB&cid=TIMESERIES_GRAPH_0&export=3&&q=`;
keyword = `/m/05nrgx`;

var client = new documentClient(config.endpoint, { "masterKey": config.primaryKey });

var HttpStatusCodes = { NOTFOUND: 404 };
var databaseUrl = `dbs/${config.database.id}`;
var collectionUrl = `${databaseUrl}/colls/${config.collection.id}`;

// ADD THIS PART TO YOUR CODE
function getDatabase() {
    console.log(`Getting database:\n${config.database.id}\n`);

    return new Promise((resolve, reject) => {
        client.readDatabase(databaseUrl, (err, result) => {
            if (err) {
                if (err.code == HttpStatusCodes.NOTFOUND) {
                    client.createDatabase(config.database, (err, created) => {
                        if (err) reject(err)
                        else resolve(created);
                    });
                } else {
                    reject(err);
                }
            } else {
                resolve(result);
            }
        });
    });
}
function getCollection() {
    console.log(`Getting collection:\n${config.collection.id}\n`);

    return new Promise((resolve, reject) => {
        client.readCollection(collectionUrl, (err, result) => {
            if (err) {
                if (err.code == HttpStatusCodes.NOTFOUND) {
                    client.createCollection(databaseUrl, config.collection, { offerThroughput: 400 }, (err, created) => {
                        if (err) reject(err)
                        else resolve(created);
                    });
                } else {
                    reject(err);
                }
            } else {
                resolve(result);
            }
        });
    });
}
/**
 * @returns {Promise<RetrievedDocument>}
 */
function getOrAddDocument(document) {
    let documentUrl = `${collectionUrl}/docs/${document.id}`;
    console.log(`Getting document:\n${document.id}\n`);

    return new Promise((resolve, reject) => {
        client.readDocument(documentUrl, (err, result) => {
            if (err) {
                if (err.code == HttpStatusCodes.NOTFOUND) {
                    client.createDocument(collectionUrl, document, (err, created) => {
                        if (err) reject(err)
                        else resolve(created);
                    });
                } else {
                    reject(err);
                }
            } else {
                resolve(result);
            }
        });
    });
};
/**
 * @returns {Promise<RetrievedDocument[]>}
 */
function getDocuments() {
    console.log(`Getting documents:\n${config.collection.id}\n`);

    return new Promise((resolve, reject) => {
        client.queryDocuments(collectionUrl, `SELECT * FROM ${config.collection.id}`)
            .toArray((err, results) => {
                if (err) reject(err)
                else {
                    console.log(`found: ${results.length}`);
                    documents = results;
                    resolve(documents);
                }
            });
    });
}
/**
 * @returns {Promise<void>}
 */
function deleteCollection() {
    console.log(`Delete collection ${config.collection.id}`);
    return new Promise((resolve, reject) => {
        client.deleteCollection(collectionUrl, (err, resource) => {
            if (err) reject(err);
            else resolve(resource);
        })
    });
}
/**
 * 
 * @param {RetrievedDocument[]} documents 
 * @return {Promise<RetrievedDocument[]>}
 */
function populateDocuments() {
    return new Promise((resolve, reject) => {
        let reedArray = documents.map(document => axios.get(reedUrl + document.keyword, {
            auth: {
                username: '91163f62-768b-4832-8981-dd0558e6aacd',
                password: ''
            }
        }));
        axios.all(reedArray)
            .then((results) => {
                results.forEach((element, i) => {
                    let documentUrl = `${collectionUrl}/docs/${element.request._headers['x-document-id']}`
                    var x = documents[i];
                    var date = new Date().toISOString().slice(0, 10);
                    if (!x.score)
                        x.score = {};
                    if (!x.score[date]) {
                        x.score[date] = {};
                    }
                    x.score[date].reedScore = element.data.totalResults;
                    
                }, this);
                resolve(documents);
            })
            .catch((error) => reject(error));

    });
}

function populateTrends() {
    var trends = documents.map(x => x.trendsId);
    console.log(trends);
    return googleTrends.interestOverTime(
        {
            keyword: trends,
            startTime: new Date(Date.now() - (10 * 24 * 60 * 60 * 1000)),
            geo: "GB"
        }).then((results) => {
            var date = new Date().toISOString().slice(0, 10);
            var data = JSON.parse(results).default.timelineData;
            var custom = documents.map((x, i) => {
                if (!x.score)
                    x.score = {};
                if (!x.score[date]) {
                    x.score[date] = {};
                }
                x.score[date]
                    .trendsScore = 
                    Math.round(data.map(d => d.value[i]).reduce((a, b) => a + b))
                return x;
            });
            documents = custom;
            console.log(documents);
            return custom;
        }).catch((err) => console.log(err));
}

function saveDocuments() {
        var promises = documents.map((doc) => {
            let documentUrl = `${collectionUrl}/docs/${doc.id}`;
            return new Promise((res,rej)=> {
                console.log(documentUrl);
                console.log(doc);
                client.replaceDocument(documentUrl,doc,(err,docr) =>{
                    if(err) {
                        console.log(err);
                        rej(err);
                    }
                    else  {
                        console.log(docr);
                        res(docr);
                    }
                });
            });
        });
        return Promise.all(promises);
}

function exit(message) {
    console.log(message);
    console.log('Press any key to exit');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', process.exit.bind(process, 0));
}

getDatabase()
    .then(() => getCollection())
    .then(() => getOrAddDocument(config.documents.aws))
    .then(() => getOrAddDocument(config.documents.gcp))
    .then(() => getOrAddDocument(config.documents.azure))
    .then(() => getOrAddDocument(config.documents.vmware))
    .then(() => getDocuments())
    .then(() => populateDocuments())
    .then(() => populateTrends())
    .then(() => saveDocuments())
    .then((results) => { console.log(`Content from npm: ${JSON.stringify({ documents }, null, 1)}`) })
    //.then(() => deleteCollection())
    .catch((err) => console.log(err))
    .then(() => { exit('All good :)') })
    .catch((err) => { console.error(err) });
