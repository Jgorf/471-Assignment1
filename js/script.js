const margin = { top: 80, right: 60, bottom: 60, left: 100 };
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

let allData = [];
let options = ['ALL', 'STREET', 'APARTMENT', 'PARKING LOT'];
let selected = 'STREET';
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
            primaryType: d["Primary Type"],
            location: d["Location Description"],
            count: 1 // tempoerary 
        };
    })
        .then(data => {
            allData = data;

            xScalebar = d3.scaleBand()
                .range([0, width]) // add domains
                .padding(0.2)

            yScalebar = d3.scaleLinear() // add domains
                .range([height, 0])

            xScaleline = d3.scaleLinear()
                .range([0, width]) // add domains

            yScaleline = d3.scaleLinear() // add domains
                .range([height, 0]);

            svgBar.append('text')
                .attr('class', 'axis-label')
                .attr('x', width / 2)
                .attr('y', height + margin.bottom - 4)
                .style('text-anchor', 'middle')
                .text('Primary Type');

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
                .text('Number of crimes');
            
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

    let currentData = allData;

    if (selected !== 'ALL') {
        currentData = allData.filter(d => d.location === selected);
    }

    svgBar.selectAll('rect').remove();
    svgBar.selectAll('.x-axis').remove();
    svgBar.selectAll('.y-axis').remove();

    svgBar.selectAll('rect')
        .data(currentData)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', (d, i) => xScalebar(d.primaryType))
        .attr('y', d => yScalebar(d.count))  /// need count variable
        .attr('width', xScalebar.bandwidth())
        .attr('height', d => height - yScalebar(d.count))
        .style('fill', 'steelblue')
        .style("stroke-width", 2)
        .style("stroke", "black")

    const xAxis = d3.axisBottom(xScalebar);

    svgBar.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis)

    const yAxis = d3.axisLeft(yScalebar);

    svgBar.append('g')
        .attr('class', 'y-axis')
        .call(yAxis);
}

function updateVisLine() { 

}

window.addEventListener('load', init);