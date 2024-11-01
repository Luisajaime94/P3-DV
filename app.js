// Set up dimensions and margins
const margin = { top: 50, right: 30, bottom: 100, left: 60 };
const width = 960 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

const svg = d3.select("#map")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("#tooltip");

// Load CSV data
d3.csv("Drugs.csv").then(data => {
    // Filter and clean data
    const cleanedData = data
        .filter(d => d["Data Value"] && !isNaN(+d["Data Value"]))  // Filter out rows with missing or invalid Data Value
        .map(d => ({
            state: d["State Name"],
            drug: d["Indicator"].split(" ")[0],  // Extract primary drug type
            deaths: +d["Data Value"]
        }));

    // Create a dropdown for selecting drug types
    const drugTypes = Array.from(new Set(cleanedData.map(d => d.drug)));
    const dropdown = d3.select("body")
        .append("select")
        .attr("id", "drug-select")
        .selectAll("option")
        .data(drugTypes)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);

    // Function to update the bar chart based on selected drug type
    function updateChart(selectedDrug) {
        const drugData = cleanedData.filter(d => d.drug === selectedDrug);

        // Scale setup
        const x = d3.scaleBand()
            .domain(drugData.map(d => d.state))
            .range([0, width])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, d3.max(drugData, d => d.deaths)])
            .nice()
            .range([height, 0]);

        // Clear previous bars
        svg.selectAll(".bar").remove();
        svg.selectAll(".x-axis").remove();
        svg.selectAll(".y-axis").remove();

        // X-axis
        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        // Y-axis
        svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y));

        // Bars
        svg.selectAll(".bar")
            .data(drugData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.state))
            .attr("width", x.bandwidth())
            .attr("y", d => y(d.deaths))
            .attr("height", d => height - y(d.deaths))
            .attr("fill", "#377eb8")
            .on("mouseover", (event, d) => {
                tooltip.style("opacity", 1)
                    .html(`<strong>${d.state}</strong><br>Overdose Deaths: ${d.deaths}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mousemove", event => {
                tooltip.style("left", (event.pageX + 10) + "px")
                       .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", () => tooltip.style("opacity", 0));
    }

    // Initialize chart with the first drug type in the list
    updateChart(drugTypes[0]);

    // Update chart on drug type selection change
    d3.select("#drug-select").on("change", function() {
        const selectedDrug = d3.select(this).property("value");
        updateChart(selectedDrug);
    });

}).catch(error => console.error("Error loading CSV file:", error));
