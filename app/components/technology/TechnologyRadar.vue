<script lang="ts">
  import type { Technology } from "~~/shared/types/schema";
  import * as d3 from "d3";

  interface Props {
    technologies: Technology[];
  }

  interface RadarPoint {
    id: string;
    name: string;
    ring: string;
    sector: string;
    x: number;
    y: number;
    technology: Technology;
  }
</script>

<script lang="ts" setup>
  const props = defineProps<Props>();

  const radarContainer = ref<HTMLDivElement>();
  const hoveredTechnology = ref<Technology | null>(null);
  const hoveredPoint = ref<{ x: number; y: number } | null>(null);

  // Configuration - responsive sizing
  const config = {
    maxWidth: 400,
    maxHeight: 400,
    margin: 20,
    rings: [
      { name: "adopt", radius: 0.25, color: "#5b9bd5", label: "ADOPT" },
      { name: "trial", radius: 0.5, color: "#70ad47", label: "TRIAL" },
      { name: "assess", radius: 0.75, color: "#ffc000", label: "ASSESS" },
      { name: "hold", radius: 1.0, color: "#c55a5a", label: "HOLD" },
    ],
    sectors: [
      { name: "technique", angle: 0, label: "Techniques" },
      { name: "tool", angle: 90, label: "Tools" },
      { name: "platform", angle: 180, label: "Platforms" },
      { name: "framework", angle: 270, label: "Frameworks" },
    ],
  };

  const drawRadar = () => {
    if (!radarContainer.value) return;

    // Clear previous content
    d3.select(radarContainer.value).selectAll("*").remove();

    // Calculate responsive dimensions
    const containerWidth = radarContainer.value.clientWidth || config.maxWidth;
    const size = Math.min(containerWidth, config.maxWidth, config.maxHeight);
    const radius = (size - 2 * config.margin) / 2;
    const center = { x: size / 2, y: size / 2 };

    // Create SVG
    const svg = d3
      .select(radarContainer.value)
      .append("svg")
      .attr("width", size)
      .attr("height", size)
      .style("background", "rgb(17 24 39)") // dark bg for dark mode
      .style("border-radius", "12px")
      .style("border", "1px solid rgb(55 65 81)");

    // Create defs for gradients and patterns
    const defs = svg.append("defs");

    // Add radial gradient for rings (dark mode)
    const gradient = defs
      .append("radialGradient")
      .attr("id", "ringGradient")
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "50%");

    gradient.append("stop").attr("offset", "0%").attr("stop-color", "rgba(31, 41, 55, 0.9)");

    gradient.append("stop").attr("offset", "100%").attr("stop-color", "rgba(31, 41, 55, 0.1)");

    const g = svg.append("g").attr("transform", `translate(${center.x}, ${center.y})`);

    // Draw rings
    config.rings.forEach((ring, i) => {
      const ringRadius = radius * ring.radius;

      g.append("circle")
        .attr("r", ringRadius)
        .attr("fill", "none")
        .attr("stroke", ring.color)
        .attr("stroke-width", 2)
        .attr("stroke-opacity", 0.3);

      // Ring labels
      g.append("text")
        .attr("x", 0)
        .attr("y", -ringRadius + 15)
        .attr("text-anchor", "middle")
        .attr("font-family", "Inter, system-ui, sans-serif")
        .attr("font-size", "10px")
        .attr("font-weight", "600")
        .attr("fill", ring.color)
        .style("letter-spacing", "1px")
        .text(ring.label);
    });

    // Draw sector lines
    config.sectors.forEach(sector => {
      const angle = ((sector.angle - 90) * Math.PI) / 180; // Adjust for top start
      const x1 = Math.cos(angle) * radius * 0.15;
      const y1 = Math.sin(angle) * radius * 0.15;
      const x2 = Math.cos(angle) * radius;
      const y2 = Math.sin(angle) * radius;

      g.append("line")
        .attr("x1", x1)
        .attr("y1", y1)
        .attr("x2", x2)
        .attr("y2", y2)
        .attr("stroke", "#4b5563")
        .attr("stroke-width", 1)
        .attr("stroke-opacity", 0.3);
    });

    // Add sector labels in actual corners of the diagram
    const cornerLabels = [
      { label: "TECHNIQUES", x: radius * 0.75, y: -radius * 0.75 }, // top-right
      { label: "TOOLS", x: radius * 0.75, y: radius * 0.75 }, // bottom-right
      { label: "PLATFORMS", x: -radius * 0.75, y: radius * 0.75 }, // bottom-left
      { label: "FRAMEWORKS", x: -radius * 0.75, y: -radius * 0.75 }, // top-left
    ];

    cornerLabels.forEach(corner => {
      g.append("text")
        .attr("x", corner.x)
        .attr("y", corner.y)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-family", "Inter, system-ui, sans-serif")
        .attr("font-size", "11px")
        .attr("font-weight", "700")
        .attr("fill", "#d1d5db")
        .style("text-transform", "uppercase")
        .style("letter-spacing", "1px")
        .text(corner.label);
    });

    // Prepare technology points
    const publishedTechnologies = props.technologies.filter(tech => tech.status === "published" && tech.ring);

    const radarPoints: RadarPoint[] = publishedTechnologies
      .map(tech => {
        const ring = config.rings.find(r => r.name === tech.ring);
        const sector = config.sectors.find(s => s.name === tech.category);

        if (!ring || !sector) return null;

        // Calculate position with some randomness within the ring/sector
        const ringIndex = config.rings.findIndex(r => r.name === tech.ring);
        const minRadius = ringIndex === 0 ? radius * 0.2 : radius * (config.rings[ringIndex - 1]?.radius || 0) + 10;
        const maxRadius = radius * ring.radius - 15;
        const techRadius = minRadius + Math.random() * (maxRadius - minRadius);

        // Add more spread for better visibility
        const sectorStartAngle = ((sector.angle - 90 - 35) * Math.PI) / 180;
        const sectorEndAngle = ((sector.angle - 90 + 35) * Math.PI) / 180;
        const techAngle = sectorStartAngle + Math.random() * (sectorEndAngle - sectorStartAngle);

        const x = Math.cos(techAngle) * techRadius;
        const y = Math.sin(techAngle) * techRadius;

        return {
          id: tech.id,
          name: tech.name,
          ring: tech.ring,
          sector: tech.category,
          x,
          y,
          technology: tech,
        };
      })
      .filter(Boolean) as RadarPoint[];

    // Draw technology points
    const points = g
      .selectAll(".tech-point")
      .data(radarPoints)
      .enter()
      .append("g")
      .attr("class", "tech-point")
      .attr("transform", d => `translate(${d.x}, ${d.y})`)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        hoveredTechnology.value = d.technology;
        // Store relative position within the container
        hoveredPoint.value = {
          x: center.x + d.x,
          y: center.y + d.y,
        };
        d3.select(this)
          .select("circle")
          .transition()
          .duration(200)
          .attr("r", 9)
          .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.4))");
      })
      .on("mouseout", function (event, d) {
        hoveredTechnology.value = null;
        hoveredPoint.value = null;
        d3.select(this)
          .select("circle")
          .transition()
          .duration(200)
          .attr("r", 6)
          .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.3))");
      });

    // Technology circles
    points
      .append("circle")
      .attr("r", 6)
      .attr("fill", d => {
        const ring = config.rings.find(r => r.name === d.ring);
        return ring?.color || "#6b7280";
      })
      .attr("stroke", "rgb(17 24 39)")
      .attr("stroke-width", 2)
      .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.3))");

    // Technology logos (if available)
    points.each(function (d) {
      if (d.technology.logoUrl) {
        d3.select(this)
          .append("image")
          .attr("href", d.technology.logoUrl)
          .attr("x", -4)
          .attr("y", -4)
          .attr("width", 8)
          .attr("height", 8)
          .style("pointer-events", "none")
          .style("border-radius", "2px");
      }
    });

    // Technology labels
    points
      .append("text")
      .attr("x", 0)
      .attr("y", 16)
      .attr("text-anchor", "middle")
      .attr("font-family", "Inter, system-ui, sans-serif")
      .attr("font-size", "9px")
      .attr("font-weight", "500")
      .attr("fill", "#e5e7eb")
      .style("pointer-events", "none")
      .text(d => d.name);
  };

  onMounted(() => {
    drawRadar();

    // Add resize observer for responsiveness
    if (radarContainer.value) {
      const resizeObserver = new ResizeObserver(() => {
        drawRadar();
      });
      resizeObserver.observe(radarContainer.value);

      onUnmounted(() => {
        resizeObserver.disconnect();
      });
    }
  });

  watch(
    () => props.technologies,
    () => {
      drawRadar();
    },
    { deep: true },
  );

  // Computed positioning for tooltip
  const tooltipPosition = computed(() => {
    if (!hoveredPoint.value) return { left: "1rem", top: "1rem" };

    // Position tooltip to the right and slightly up from the point
    return {
      left: `${hoveredPoint.value.x + 20}px`,
      top: `${hoveredPoint.value.y - 40}px`,
    };
  });
</script>

<template>
  <div class="w-full relative">
    <div ref="radarContainer" />

    <!-- Technology details tooltip -->
    <div v-if="hoveredTechnology" class="absolute z-50 bg-zinc-800 rounded-lg shadow-xl w-80" :style="tooltipPosition">
      <TechnologyCard :technology="hoveredTechnology" />
    </div>
  </div>
</template>
