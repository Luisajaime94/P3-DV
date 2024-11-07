const margin = { top: 50, right: 30, bottom: 100, left: 60 };
const width = 960 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

// Append SVG to the container
const svg = d3.select("#chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Create tooltip
const tooltip = d3.select("#tooltip");

// Load and process data
d3.csv("Drugs.csv", d3.autoType).then(rawData => {
    console.log("Data loaded:", rawData);

    // Rename "Number of Drug Overdose Deaths" to "Unspecified"
    rawData.forEach(d => {
        if (d["Indicator"] === "Number of Drug Overdose Deaths") {
            d["Indicator"] = "Unspecified";
        }
    });

    // Extract unique years for the dropdown
    const years = Array.from(new Set(rawData.map(d => d["Year"])));
    const yearSelect = d3.select("#year-select");
    yearSelect.selectAll("option")
        .data(years)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);

    // Function to update the chart based on the selected year
    function updateChart(selectedYear) {
        const filteredData = rawData.filter(d => d["Year"] === selectedYear && d["Indicator"] !== "Number of Drugs Specified" && d["Indicator"] !== "Percent with drugs specified");

        // Aggregate data to annual totals for each state and drug type
        const data = d3.rollups(
            filteredData,
            v => d3.sum(v, d => d["Data Value"] || d["Predicted Value"]),
            d => d["State Name"],
            d => d["Indicator"]
        );

        // Transform the data to the format needed for stacking
        const transformedData = [];
        for (const [state, drugs] of data) {
            const entry = { state };
            drugs.forEach(([drug, deaths]) => entry[drug] = deaths);
            transformedData.push(entry);
        }

        // Extract unique drugs for stacking keys
        const drugs = Array.from(new Set(filteredData.map(d => d["Indicator"])));

        // Set up scales
        const x = d3.scaleBand()
            .domain(transformedData.map(d => d.state))
            .range([0, width])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(transformedData, d => d3.sum(drugs, drug => d[drug] || 0))])
            .nice()
            .range([height, 0]);

        const color = d3.scaleOrdinal()
            .domain(drugs)
            .range(d3.schemeCategory10);

        // Clear previous chart
        svg.selectAll("*").remove();

        // Add x-axis
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        // Add y-axis
        svg.append("g")
            .call(d3.axisLeft(y));

        // Add y-axis title
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Number of Deaths");

        // Add bars
        const bars = svg.append("g")
            .selectAll("g")
            .data(d3.stack().keys(drugs)(transformedData))
            .enter().append("g")
            .attr("fill", d => color(d.key))
            .selectAll("rect")
            .data(d => d)
            .enter().append("rect")
            .attr("x", d => x(d.data.state))
            .attr("y", d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1]))
            .attr("width", x.bandwidth())
            .on("mouseover", function(event, d) {
                const state = d.data.state;
                const totalDeaths = d3.sum(drugs, drug => d.data[drug] || 0);
                const drugName = d3.select(this.parentNode).datum().key;
                const deaths = d.data[drugName];

                tooltip.transition().duration(200).style("opacity", .9);
                tooltip.html(`State: ${state}<br>Total Deaths: ${totalDeaths}<br>Drug: ${drugName}<br>Deaths: ${deaths}`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                tooltip.transition().duration(500).style("opacity", 0);
            });
    }

    // Initial chart display
    updateChart(years[0]);

    // Update chart when a new year is selected
    yearSelect.on("change", function() {
        const selectedYear = +this.value;
        updateChart(selectedYear);
    });

}).catch(error => {
    console.error("Error loading or processing data:", error);
});