
var Charts = function() {
    this.__constructor.apply(this, arguments);
  }
  
Charts.prototype.__constructor = function () {
}

Charts.prototype.collect = function (agents) { 
    var data = {}

    // collect data
    var keys = Object.keys(agents[0].infos[0])
    for (const key of keys) {
        if (key === 'x') continue
        data[key] = []
        for (let i = 0; i < agents.length; i++) {
            const infos = agents[i].infos;
            // var borderColor = "hsl("+agents[i].walkerhue+",45%,"+(100-15*agents[i].walker.health/config.walker_health)+"%)";
            // build dataset
            var dataset = {
                label: 'Agent ' + i, data: [], fill: false,
                // borderColor
            }
            for (const info of infos) {
                // a datapoint
                dataset.data.push({
                    x: info['x'],
                    y: info[key]
                })
            }
            data[key].push(dataset)
        }
    }
    for (let i = 0; i < agents.length; i++) {
        agents[i].infos = [] // empty it
    }
    
    return data
}

Charts.prototype.init = function (agents) {
    
    var data = this.collect(agents)
    var div = document.getElementById('charts');

    // make charts
    this.charts = []
    for (const key in data) {
        var canvas = document.createElement("canvas"); 
        div.appendChild(canvas)
        var ctx = canvas.getContext('2d');
        var lineChart = new Chart(ctx, {
            type: 'scatter',
            data: { datasets: data[key] },
            options: {
                title: { text: key, display: true },
                scales: {
                    xAxes: [{
                        type: 'linear',
                        position: 'bottom'
                    }]
                }
            }
        });    
        this.charts.push(lineChart)
    }

}

Charts.prototype.update = function (agents) {
    var data = this.collect(agents)
    var maxLen = 10000
    for (const chart of this.charts) {
        var newDatasets = data[chart.config.options.title.text]
        chart.data.datasets.forEach((dataset) => {
            var dat = newDatasets.filter(d=>d.label==dataset.label)[0].data
            dataset.data.push(...dat);
            if (dataset.data.length>maxLen) dataset.data.splice(0, dataset.data.length-maxLen)
        });
        chart.update();
    }
}

