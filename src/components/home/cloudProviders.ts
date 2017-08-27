import axios, { AxiosResponse } from 'axios';
import http, { RequestOptions } from 'http';

export class CloudProviders {
    name: string;
    keyword: string;
    score: string;
    

    constructor() {
        this.name = name;
    }

    public GetProviders() {
        return axios.get(`https://cloud-score.azurewebsites.net/api/GetDocuments`);
        /*return new Promise((resolve, reject) => {
            let databaseUrl = `dbs/${this._config.database}`;
            let collectionUrl = `${databaseUrl}/colls/${this._config.collection}`;
            this._client.queryDocuments(collectionUrl, `SELECT * FROM ${this._config.collection}`)
                .toArray((err, results) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(results);
                });
        });*/
    }
}