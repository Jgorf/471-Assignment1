const margin = { top: 80, right: 60, bottom: 60, left: 100 };
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

let allData = [];
let xVar = 'income';
let yVar = 'lifeExp';
let sizeVar = 'population';
let targetYear = 2005;

let xScale, yScale, sizeScale;

const continents = ['Africa', 'Asia', 'Oceania', 'Americas', 'Europe'];
const colorScale = d3.scaleOrdinal(continents, d3.schemeSet2);

const options = ['income', 'lifeExp', 'gdp', 'population', 'childDeaths'];


// Create SVG
const svg = d3.select('#vis')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);


// Load data
function init() {

    d3.csv("./data/gapminder_subset.csv", (d) => {
        return {
            country: d.country,
            continent: d.continent,
            year: +d.year,
            lifeExp: +d.life_expectancy,
            income: +d.income_per_person,
            gdp: +d.gdp_per_capita,
            childDeaths: +d.number_of_child_deaths,
            population: +d.population
        };
    })

    .then(data => {

        console.log(data);

        allData = data;

        // Create scales AFTER data has loaded
        xScale = d3.scaleLinear()
            .domain([0, d3.max(allData, d => d[xVar])])
            .range([0, width]);

        yScale = d3.scaleLinear()
            .domain([0, d3.max(allData, d => d[yVar])])
            .range([height, 0]);

        sizeScale = d3.scaleSqrt()
            .domain([0, d3.max(allData, d => d[sizeVar])])
            .range([2, 40]);

        setupSelector();

        updateAxes();
        updateVis();
        addLegend();

    })

    .catch(error => console.error('Error loading data:', error));
}


function setupSelector() {

    var slider = d3
        .sliderHorizontal()
        .min(d3.min(allData, d => d.year))
        .max(d3.max(allData, d => d.year))
        .step(1)
        .width(300)
        .displayValue(false)
        .on('onchange', (val) => {

            targetYear = +val;

            d3.select('#value')
                .text(targetYear);

            updateVis();
        });

    d3.select('#slider')
        .append('svg')
        .attr('width', 500)
        .attr('height', 100)
        .append('g')
        .attr('transform', 'translate(30,30)')
        .call(slider);

    d3.select('#value')
        .text(targetYear);


    d3.selectAll('.variable')
        .each(function() {

            d3.select(this)
                .selectAll('myOptions')
                .data(options)
                .enter()
                .append('option')
                .text(d => {
                    switch (d) {
                        case 'income':
                            return 'Income per Person';
                        case 'lifeExp':
                            return 'Life Expectancy';
                        case 'gdp':
                            return 'GDP per Capita';
                        case 'population':
                            return 'Population';
                        case 'childDeaths':
                            return 'Child Deaths';
                    }
                })
                .attr("value", d => d)
        })

        .on("change", function(event) {

            console.log(d3.select(this).property("id"));
            console.log(d3.select(this).property("value"));

            switch (d3.select(this).property("id")) {

                case 'xVariable':
                    xVar = d3.select(this).property("value");
                    break;

                case 'yVariable':
                    yVar = d3.select(this).property("value");
                    break;

                case 'sizeVariable':
                    sizeVar = d3.select(this).property("value");
                    break;
            }

            // Update scale domains
            xScale.domain([
                0,
                d3.max(allData, d => d[xVar])
            ]);

            yScale.domain([
                0,
                d3.max(allData, d => d[yVar])
            ]);

            sizeScale.domain([
                0,
                d3.max(allData, d => d[sizeVar])
            ]);

            updateAxes();
            updateVis();
        });


    d3.select('#xVariable').property('value', xVar);
    d3.select('#yVariable').property('value', yVar);
    d3.select('#sizeVariable').property('value', sizeVar);
}


function updateAxes() {

    // Remove old axes and labels preventing duplicates when variables change
    svg.selectAll('.axis').remove();
    svg.selectAll('.labels').remove();


    // X axis
    const xAxis = d3.axisBottom(xScale);

    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .attr('class', 'axis')
        .call(xAxis);


    // X-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 20)
        .attr("text-anchor", "middle")
        .text(xVar)
        .attr('class', 'labels');


    // Y axis
    const yAxis = d3.axisLeft(yScale);

    svg.append('g')
        .attr('class', 'axis')
        .call(yAxis);


    // Y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 40)
        .attr("text-anchor", "middle")
        .text(yVar)
        .attr('class', 'labels');
}


function updateVis() {

    // Filter data for the current year
    let currentData = allData.filter(d => d.year === targetYear);


    svg.selectAll('.points')
        .data(currentData, d => d.country)
        .join(
            function(enter) {
                return enter
                    .append('circle')
                    .attr('class', 'points')
                    .attr('cx', d => xScale(d[xVar]))
                    .attr('cy', d => yScale(d[yVar]))
                    .attr('r', d => sizeScale(d[sizeVar]))
                    .style('fill', d => colorScale(d.continent))
                    .style('opacity', .5)

                    // TOOLTIP
                    .on('mouseover', function(event, d) {

                        d3.select('#tooltip')
                            .style('display', 'block')
                            .html(`
                                <strong>${d.country}</strong><br>
                                Continent: ${d.continent}<br>
                            `);

                    })
                    .on('mousemove', function(event) {

                        d3.select('#tooltip')
                            .style('left', (event.pageX + 10) + 'px')
                            .style('top', (event.pageY + 10) + 'px');

                    })
                    .on('mouseout', function() {

                        d3.select('#tooltip')
                            .style('display', 'none');

                    });
            },

            function(update) {

                return update
                    .transition()
                    .duration(500)
                    .attr('cx', d => xScale(d[xVar]))
                    .attr('cy', d => yScale(d[yVar]))
                    .attr('r', d => sizeScale(d[sizeVar]));
            },



            function(exit) {

                return exit
                    .transition()
                    .duration(500)
                    .style('opacity', 0)
                    .remove();

            }
        );
}

function addLegend() {
    let size = 10;

    // Draw the colored squares
    svg.selectAll('continentSquare')
        .data(continents)
        .enter()
        .append('rect')
        .attr('y', -margin.top / 2)
        .attr('x', (d, i) => i * (size + 100) + 100)
        .attr('width', size)
        .attr('height', size)
        .style('fill', d => colorScale(d));

    // Add the continent names
    svg.selectAll('continentName')
        .data(continents)
        .enter()
        .append('text')
        .attr('y', -margin.top / 2 + size)
        .attr('x', (d, i) => i * (size + 100) + 120)
        .style('fill', d => colorScale(d))
        .text(d => d)
        .attr('text-anchor', 'left')
        .style('font-size', '13px');
}

window.addEventListener('load', init);