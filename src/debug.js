/*
// debug charts
const labels = ["Send Meter"]
const data = {
    labels: labels,
    datasets: [{
        label: 'test',
        data: [0],
        backgroundColor: ['white'],
        borderColor: ['white'],
        borderWidth: 1
    }]
};

const config = {
    type: 'bar',
    data: data,
    options: {
        scales: {
            y: {
                beginAtZero: true,
                min: 0,
                max: 100
            }
        },
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        }
    },
};


// perlin graph
const data2 = {
    labels: [0, 0, 0],
    datasets: [{
        label: '',
        data: [],
        fill: false,
        borderColor: ['white'],
        borderWidth: 1,
        tension: 0.2,
        pointRadius: 0
    }]
};

const config2 = {
    type: 'line',
    data: data2,
    options: {
        animation:false,
        scales: {
            x: {
                ticks: { display: false }
            },
            y: {

            }
        },
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            annotation: {
                annotations: {
                    line1: {
                        type: 'line',
                        yMin: 0,
                        yMax: 0,
                        borderColor: 'red',
                        borderWidth: 2,
                        label: { enabled: false }
                    }
                }
            }
        }
    },
};

const canvasBar = document.getElementById('sendChanceBar');
const chart = new Chart(canvasBar, config);

const canvasPerl = document.getElementById('perlin');
const chart2 = new Chart(canvasPerl, config2);
*/
export function updateBar(val) {
    return;
    chart.data.datasets[0].data[0] = val;
    chart.update();
}


export function updatePerlin(val) {
    return;
    const newIndex = chart2.data.labels.length
    chart2.data.labels.push(0)
    chart2.data.datasets[0].data.push(val);
    if (newIndex > 50) {
        chart2.data.labels.shift();
        chart2.data.datasets[0].data.shift();
    }
    chart2.update();
}