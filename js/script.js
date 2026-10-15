const margin = { top: 80, right: 60, bottom: 60, left: 100 };
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

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
            primaryType: d["Crime Type"],
            location: d.Location,
            count: 1 // tempoerary 
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
                .text('Crime Type');

            svgBar.append('text')
                .attr('class', 'axis-label')
                .attr('transform', 'rotate(-90)')
                .attr('x', -height / 2)
                .attr('y', -margin.left + 15)
                .style('text-anchor', 'middle')
                .text('Number of crimes');

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
    d3.selectAll('#locationVar')
        .each(function () {
            d3.select(this).selectAll('myOptions')
                .data(options)
                .enter()
                .append('option')
                .text(d => d) // The displayed text
                .attr("value", d => d) // The actual value used in the code
        })
        .on("change", function (event) {
            selected = d3.select(this).property("value");
            updateVisBar();
            updateVisLine();
        })
}

function updateVisBar() {

    // let currentData = allData;
    // if (selected !== 'ALL') {
    //     currentData = allData.filter(d => d.location === selected);
    // }

    // svgBar.selectAll('rect').remove();
    // svgBar.selectAll('.x-axis').remove();
    // svgBar.selectAll('.y-axis').remove();

    // svgBar.selectAll('rect')
    //     .data(currentData)
    //     .enter()
    //     .append('rect')
    //     .attr('class', 'bar')
    //     .attr('x', (d, i) => xScalebar(d.primaryType))
    //     .attr('y', d => yScalebar(d.count))  /// need count variable
    //     .attr('width', xScalebar.bandwidth())
    //     .attr('height', d => height - yScalebar(d.count))
    //     .style('fill', 'steelblue')
    //     .style("stroke-width", 2)
    //     .style("stroke", "black")

    // const xAxis = d3.axisBottom(xScalebar);

    // svgBar.append('g')
    //     .attr('class', 'x-axis')
    //     .attr('transform', `translate(0,${height})`)
    //     .call(xAxis)

    // const yAxis = d3.axisLeft(yScalebar);

    // svgBar.append('g')
    //     .attr('class', 'y-axis')
    //     .call(yAxis);
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