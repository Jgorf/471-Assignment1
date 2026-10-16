const margin = { top: 30, right: 30, bottom: 60, left: 200 };
const chartHeight = 450;
const chartWidthBar = document.querySelector('#visBar').clientWidth;
const chartWidthLine = document.querySelector('#visLine').clientWidth;
const widthBar = chartWidthBar - margin.left - margin.right;
const widthLine = chartWidthLine - margin.left - margin.right;
const height = chartHeight - margin.top - margin.bottom;

let allData = [];
let options;
let selected = 'ALL';
let xScalebar, yScalebar;
let xScaleline, yScaleline;
let brushedYears = null;

const svgBar = d3.select('#visBar')
    .append('svg')
    .attr('width', chartWidthBar)
    .attr('height', chartHeight + 20)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

const svgLine = d3.select('#visLine')
    .append('svg')
    .attr('width', chartWidthLine)
    .attr('height', chartHeight + 20)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);


function init() {
    d3.csv("https://huggingface.co/datasets/aajello/ChicagoCrimeData/resolve/main/Crime_2020-2026.csv?download=true", (d) => {
        return {
            year: +d.Year,
            month: +d.Month,
            day: +d.Day,
            time: d.Time,
            period: (+d.Year - 2020) * 4 + Math.ceil(+d.Month / 3) - 1,
            crimeType: d["Crime Type"],
            location: d.Location,
            arrestRate: d["Arrest Rate"],
            count: 1
        };
    })
        .then(data => {
            allData = data;

            svgBar.append('text')
                .attr('class', 'axis-label')
                .attr('x', widthBar / 2)
                .attr('y', height + margin.bottom - 4)
                .style('text-anchor', 'middle')
                .text('Number of Crimes');

            svgBar.append('text')
                .attr('class', 'axis-label')
                .attr('transform', 'rotate(-90)')
                .attr('x', -height / 2)
                .attr('y', -margin.left + 15)
                .style('text-anchor', 'middle')
                .text('Crime Type');

            svgLine.append('text')
                .attr('class', 'axis-label')
                .attr('x', widthLine / 2)
                .attr('y', height + margin.bottom - 4)
                .style('text-anchor', 'middle')
                .text('Year');

            svgLine.append('text')
                .attr('class', 'axis-label')
                .attr('transform', 'rotate(-90)')
                .attr('x', -height / 2)
                .attr('y', -margin.left + 100)
                .style('text-anchor', 'middle')
                .text('Number of Crimes');

            setupSelector();
            updateVisBar();
            updateVisLine();
        })
        .catch(error => console.error('Error loading data:', error));
}


function setupSelector() {
    options = [
        'ALL',
        'STREET',
        'APARTMENT',
        'RESIDENCE',
        'SIDEWALK',
        'PARKING LOT / GARAGE (NON RESIDENTIAL)'
    ];

    d3.select('#locationVar')
        .selectAll('option')
        .data(options)
        .enter()
        .append('option')
        .text(d => d)
        .attr('value', d => d);

    d3.select('#locationVar')
        .on('change', function () {
            selected = d3.select(this).property('value');
            brushedYears = null;
            updateVisBar();
            updateVisLine();
        });
}


function updateVisBar() {
    let currentData = allData;

    if (selected !== 'ALL') {
        currentData = allData.filter(d => d.location === selected);
    }

    if (brushedYears != null) {
        currentData = currentData.filter(
            d => d.period >= brushedYears[0] && d.period <= brushedYears[1]
        );
    }

    // Count number of crime records per crime type
    let countedData = [];

    currentData.forEach(d => {
        let there = false;

        for (let i = 0; i < countedData.length; i++) {
            if (countedData[i].crimeType === d.crimeType) {
                countedData[i].count++;
                there = true;
                break;
            }
        }

        if (!there) {
            countedData.push({
                crimeType: d.crimeType,
                count: 1,
                arrestRate: +(Number(d.arrestRate).toFixed(2))
            });
        }
    });

    // Sort from most to fewest incidents
    countedData.sort((a, b) => b.count - a.count);

    // Show only the 10 most common crime types
    countedData = countedData.slice(0, 10);

    // X scale: number of incidents
    xScalebar = d3.scaleLinear()
        .domain([0, d3.max(countedData, d => d.count) * 1.15])
        .range([0, widthBar]);

    // Y scale: crime types
    yScalebar = d3.scaleBand()
        .domain(countedData.map(d => d.crimeType))
        .range([0, height])
        .padding(0.15);

    // Remove old bars, count labels, and axes
    svgBar.selectAll('.bar, .bar-count').remove();
    svgBar.selectAll('.x-axis, .y-axis, .axis').remove();

    svgBar.selectAll('.bar')
        .data(countedData)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', 0)
        .attr('y', d => yScalebar(d.crimeType))
        .attr('width', d => xScalebar(d.count))
        .attr('height', yScalebar.bandwidth())
        .attr('fill', 'steelblue')
        .on('mouseover', function (event, d) {
            d3.select(this).attr('fill', '#0056b3');

            d3.select('#tooltip')
                .style('display', 'block')
                .html(
                    `<strong>${d.crimeType}</strong><br>
                    Incidents: ${d.count.toLocaleString()}<br>
                    Arrest Rate: ${d.arrestRate}%<br>
                    Location: ${selected}`
                );
        })
        .on('mousemove', function (event) {
            d3.select('#tooltip')
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY + 10) + 'px');
        })
        .on('mouseout', function () {
            d3.select(this).attr('fill', 'steelblue');
            d3.select('#tooltip').style('display', 'none');
        });

    // Add count labels to bars
    svgBar.selectAll('.bar-count')
        .data(countedData)
        .enter()
        .append('text')
        .attr('class', 'bar-count')
        .attr('x', d => xScalebar(d.count) + 5)
        .attr('y', d => yScalebar(d.crimeType) + yScalebar.bandwidth() / 2)
        .attr('dy', '0.35em')
        .style('fill', 'black')
        .style('font-size', '11px')
        .text(d => d.count.toLocaleString());

    // X axis
    svgBar.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScalebar).ticks(6));

    // Y axis
    svgBar.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(yScalebar));
}


function updateVisLine() {
    let currentData = allData;

    if (selected !== 'ALL') {
        currentData = allData.filter(d => d.location === selected);
    }

    let countedData = [];

    currentData.forEach(d => {
        let there = false;

        for (let i = 0; i < countedData.length; i++) {
            if (countedData[i].period === d.period) {
                countedData[i].count++;
                there = true;
                break;
            }
        }

        if (!there) {
            countedData.push({
                period: d.period,
                count: 1
            });
        }
    });

    countedData.sort((a, b) => a.period - b.period);

    xScaleline = d3.scaleLinear()
        .domain([
            d3.min(countedData, d => d.period),
            d3.max(countedData, d => d.period)
        ])
        .range([0, widthLine]);

    yScaleline = d3.scaleLinear()
        .domain([0, d3.max(countedData, d => d.count) * 1.4])
        .range([height, 0]);

    const line = d3.line()
        .x(d => xScaleline(d.period))
        .y(d => yScaleline(d.count));

    svgLine.selectAll('.linemade').remove();
    svgLine.selectAll('.axis').remove();

    svgLine.append('path')
        .attr('d', line(countedData))
        .attr('class', 'linemade')
        .attr('fill', 'none')
        .style('stroke', 'steelblue')
        .style('stroke-width', 2);

    const xAxis = d3.axisBottom(xScaleline)
        .tickValues(countedData.map(d => d.period))
        .tickFormat(d => {
            let y = 2020 + Math.floor(d / 4);
            let q = (d % 4) + 1;

            if (q == 1) {
                return `${y} Q${q}`;
            }

            return `Q${q}`;
        });

    const yAxis = d3.axisLeft(yScaleline);

    svgLine.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis)
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end')
        .attr('dy', '.35em')
        .attr('dx', '-0.5em');

    svgLine.append('g')
        .attr('class', 'axis')
        .call(yAxis);

    const brush = d3.brushX()
        .extent([[0, 0], [widthLine, height]])
        .on('brush', brushed)
        .on('end', brushend);

    svgLine.selectAll('.brushed').remove();

    svgLine.append('g')
        .attr('class', 'brushed')
        .call(brush);

    function brushed({ selection }) {
        if (selection) {
            brushedYears = [
                Math.round(xScaleline.invert(selection[0])),
                Math.round(xScaleline.invert(selection[1]))
            ];
        }
    }

    function brushend({ selection }) {
        if (!selection) {
            brushedYears = null;
        }

        updateVisBar();
    }
}

window.addEventListener('load', init);