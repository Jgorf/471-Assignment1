const margin = { top: 80, right: 60, bottom: 60, left: 200 };
const width = 800 - margin.left - margin.right;
const height = 900 - margin.top - margin.bottom;
let allData = [];
let options = ['ALL', 'STREET', 'APARTMENT', 'ALLEY'];
let selected = 'ALL';
let xScalebar, yScalebar;
let xScaleline, yScaleline;

const svgBar = d3.select('#visBar')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

const svgLine = d3.select('#visLine')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)


function init() {

    d3.csv("Crime_2020-2026.csv", (d) => {
        return {
            year: +d.Year,
            month: +d.Month,
            day: +d.Day,
            time: d.Time,
            crimeType: d["Crime Type"],
            location: d.Location,
            arrestRate: d["Arrest Rate"],
            count: 1 
        };
    })
        .then(data => {
            allData = data;
            console.log(allData);

            svgBar.append('text')
                .attr('class', 'axis-label')
                .attr('x', width / 2)
                .attr('y', height + margin.bottom - 4)
                .style('text-anchor', 'middle')
                .text('Number of crimes');

            svgBar.append('text')
                .attr('class', 'axis-label')
                .attr('transform', 'rotate(-90)')
                .attr('x', -height / 2)
                .attr('y', -margin.left + 15)
                .style('text-anchor', 'middle')
                .text('Crime Type');

            svgLine.append('text')
                .attr('class', 'axis-label')
                .attr('x', width / 2)
                .attr('y', height + margin.bottom - 4)
                .style('text-anchor', 'middle')
                .text('Year');

            svgLine.append('text')
                .attr('class', 'axis-label')
                .attr('transform', 'rotate(-90)')
                .attr('x', -height / 2)
                .attr('y', -margin.left + 15)
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
            updateVisBar();
            updateVisLine();
        });
}

function updateVisBar() {
    
    let currentData = allData;
    
    if (selected !== 'ALL') {
        currentData = allData.filter(d => d.location === selected);
    }
    
    // count number of crime records per crime type
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
        .domain([0, d3.max(countedData, d => d.count) * 1.15]) // * 1.15 to leave space past longest bar
        .range([0, width]);

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
        .on('mouseover', function(event, d) {
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
        .on('mousemove', function(event) {
            d3.select('#tooltip')
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY + 10) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this).attr('fill', 'steelblue');
            d3.select('#tooltip').style('display', 'none');
        });


    // Add count labels to bars
    // Add count labels
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
        .call(d3.axisBottom(xScalebar)
                .ticks(6))

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
            if (countedData[i].year === d.year) {
                countedData[i].count++;
                there = true;
                break;
            }
        }

        if (!there) {
            countedData.push({
                year: d.year,
                count: 1
            })
        }
    })

    xScaleline = d3.scaleLinear()
        .domain([d3.min(countedData, d => d.year), d3.max(countedData, d => d.year)])
        .range([0, width]);

    yScaleline = d3.scaleLinear()
        .domain([0, d3.max(countedData, d => d.count) * 1.4])
        .range([height, 0]);

    const line = d3.line()
        .x(d => xScaleline(d.year))
        .y(d => yScaleline(d.count));

    svgLine.selectAll('.linemade').remove()
    svgLine.selectAll('.axis').remove()

    svgLine.append('path')
        .attr('d', line(countedData))
        .attr('class', 'linemade')
        .attr('fill', 'none')
        .style('stroke', 'steelblue')
        .style('stroke-width', 2);

    const xAxis = d3.axisBottom(xScaleline)
        .tickValues(countedData.map(d => d.year))
        .tickFormat(d => Number(d));

    const yAxis = d3.axisLeft(yScaleline);

    svgLine.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis);

    svgLine.append('g')
        .attr('class', 'axis')
        .call(yAxis);
}

window.addEventListener('load', init);