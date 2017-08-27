import Vue from 'vue';
import Component from 'vue-class-component';
import { CloudProviders } from './cloudProviders';
import Plotly, { ScatterData } from 'plotly.js/lib/core';
// /dist/plotly

@Component({
    template: require('./home.html')
})
export class HomeComponent extends Vue {
    providers = [
    ];
    mounted() {
        let cloudProviders = new CloudProviders();

        cloudProviders.GetProviders()
            .then((results) => {
                for (let i = 0; i < results.data.length; i++) {
                    let doc = results.data[i];
                    console.log(doc);
                    this.providers.push({
                        name: doc.name,
                        keyword: doc.keyword,
                        scores: this.getScores(doc.score)
                    });
                }

                
                let data: Partial<ScatterData>[] = this.providers.map<Partial<ScatterData>>(x => {
                    return { 
                        connectgaps: true,
                        y: x.scores.map(y => y.value),
                        x: x.scores.map(y => y.date),
                        name: x.name
                    };
                });
                console.log(data);
                Plotly.plot(
                    'chartbar',
                    data,
                    {
                        autosize: true,
                        title: 'Score over time',
                        dragmode: 'zoom',
                        
                    },
                    {
                        displaylogo: false,
                        displayModeBar: 'hover',
                        showLink: false
                    }
                );
                this.providers.sort((a, b) => b.scores[0].value - a.scores[0].value);
            });
    }
    package: string = 'vue-webpack-typescript';
    mode: string = process.env.ENV;


    private getScores(scores: any) {
        let currentDate = new Date().toISOString().slice(0, 10);
        return Object.keys(scores).map((key, index) => {
            let score = scores[key];
            let rawScore = Math.log1p(score.reedScore) + Math.log1p(score.trendsScore);
            return {
                value: rawScore,
                round: Math.round(rawScore),
                date: key
            };
        });
    }


}
