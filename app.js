
const margin = { top: 50, right: 30, bottom: 100, left: 60 };
const width = 960 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;
const svg = d3.select("#map")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("#tooltip");

// getting the data and manipulating it
d3.csv("Drugs.csv").then(data => {
    // Filter and clean data
    const cleanedData = data
    .filter(d => {
        const hasValidValue = d["Data Value"] && !isNaN(+d["Data Value"]) || d["Predicted Value"] && !isNaN(+d["Predicted Value"]);
        if (!hasValidValue) console.log("Filtered out:", d); 
        return hasValidValue;
    })
    .map(d => ({
        state: d["State Name"],
        drug: d["Indicator"], 
        deaths: +d["Data Value"] || +d["Predicted Value"],
        year: +d["Year"]
    }));


    console.log("Cleaned Data:", cleanedData); 

    // Get unique drug types and years
    const drugTypes = Array.from(new Set(cleanedData.map(d => d.drug)));
    const years = Array.from(new Set(cleanedData.map(d => d.year))).sort();

    console.log("Drug Types:", drugTypes);  // Should list all unique drug types
    console.log("Years:", years);  // Should list all unique years

    // Create dropdown for selecting drug types
    d3.select("body")
        .append("label")
        .text("Select Drug Type: ")
        .append("select")
        .attr("id", "drug-select")
        .selectAll("option")
        .data(drugTypes)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);

    // Create dropdown for selecting years
    d3.select("body")
        .append("label")
        .text("Select Year: ")
        .append("select")
        .attr("id", "year-select")
        .selectAll("option")
        .data(years)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);

    // Function to update the bar chart based on selected drug type and year
    function updateChart(selectedDrug, selectedYear) {
        const drugData = cleanedData.filter(d => d.drug === selectedDrug && d.year === selectedYear);

        const x = d3.scaleBand()
            .domain(drugData.map(d => d.state))
            .range([0, width])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, d3.max(drugData, d => d.deaths)])
            .nice()
            .range([height, 0]);

        // Clear previous bars and axes
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

    // Initialize with the first drug type and year in the list
    updateChart(drugTypes[0], years[0]);

    // Update on drug type or year selection change
    d3.select("#drug-select").on("change", function() {
        const selectedDrug = d3.select("#drug-select").property("value");
        const selectedYear = +d3.select("#year-select").property("value");
        updateChart(selectedDrug, selectedYear);
    });

    d3.select("#year-select").on("change", function() {
        const selectedDrug = d3.select("#drug-select").property("value");
        const selectedYear = +d3.select("#year-select").property("value");
        updateChart(selectedDrug, selectedYear);
    });

}).catch(error => console.error("Error loading CSV file:", error));
