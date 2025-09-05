<script lang="ts">
  import type { Technology } from "~~/shared/types/schema";
  import { initials } from "~~/shared/utils/initials";
  import * as d3 from "d3";

  interface Props {
    technologies: Technology[];
  }

  interface RadarRing {
    name: string;
    color: string;
    label: string;
  }

  interface RadarSector {
    name: string;
    label: string;
  }

  interface Config {
    margin: number;
    minSize: number;
    ringWidth: number;
    ringOpacity: number;
    pointSize: number;
    imageSize: number;
    hoverScaleMultiplier: number;
    rings: RadarRing[];
    sectors: RadarSector[];
  }

  interface Point {
    x: number;
    y: number;
  }

  interface TechnologyPoint extends Point {
    technology: Technology;
  }
</script>

<script lang="ts" setup>
  const props = defineProps<Props>();

  const radarContainer = useTemplateRef("radarContainer");
  const hoveredTechnology = ref<Technology | null>(null);
  const hoveredPoint = ref<{ x: number; y: number } | null>(null);

  // Configuration - responsive sizing
  const config: Config = {
    margin: 20,
    minSize: 200,
    ringWidth: 3,
    ringOpacity: 0.3,
    pointSize: 14,
    imageSize: 18,
    hoverScaleMultiplier: 1.3,
    rings: [
      { name: "adopt", color: "var(--ui-success)", label: "ADOPT" },
      { name: "trial", color: "var(--ui-info)", label: "TRIAL" },
      { name: "assess", color: "var(--ui-warning)", label: "ASSESS" },
      { name: "hold", color: "var(--ui-error)", label: "HOLD" },
    ],
    sectors: [
      { name: "technique", label: "Techniques" },
      { name: "tool", label: "Tools" },
      { name: "platform", label: "Platforms" },
      { name: "framework", label: "Frameworks" },
    ],
  };

  const drawRadar = () => {
    if (!radarContainer.value) {
      console.error("Radar container not found");
      return;
    }

    // Clear previous content
    d3.select(radarContainer.value).selectAll("*").remove();

    // Calculate responsive dimensions based on parent container
    const parentElement = radarContainer.value.parentElement;
    if (!parentElement) {
      console.error("Radar container has no parent element");
      return;
    }

    const parentRect = parentElement.getBoundingClientRect();
    const availableWidth = parentRect.width;

    // Use the width to calculate radar size, with some padding
    // Ensure minimum size to prevent negative radius
    const outerSize = Math.max(availableWidth, config.minSize);
    const innerSize = outerSize - config.margin * 2;
    const radius = innerSize / 2;

    const getRingRadius = (index: number) => {
      return radius * (1 / config.rings.length) * (index + 1);
    };

    // Ensure radius is positive
    if (radius <= 0) {
      console.error("Calculated radius is non-positive:", radius);
      return;
    }

    const center: Point = {
      x: outerSize / 2,
      y: outerSize / 2,
    };

    // Create the background
    const backgroundSvg = d3
      .select(radarContainer.value)
      .append("svg")
      .attr("width", outerSize)
      .attr("height", outerSize)
      .style("background", "var(--color-zinc-800)")
      .style("border-radius", "12px")
      .style("border", "1px solid rgb(55 65 81)");

    // Main group at the center
    const group = backgroundSvg.append("g").attr("transform", `translate(${center.x}, ${center.y})`);

    // Create clip paths for rounded images (normal and scaled)
    const defs = backgroundSvg.append("defs");
    defs
      .append("clipPath")
      .attr("id", "image-clip")
      .append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", config.imageSize / 2);

    defs
      .append("clipPath")
      .attr("id", "image-clip-hover")
      .append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", (config.imageSize * config.hoverScaleMultiplier) / 2);

    // Draw rings
    for (let i = 0; i < config.rings.length; i++) {
      const ring = config.rings[i]!;
      const ringRadius = getRingRadius(i);

      // The circle
      group
        .append("circle")
        .attr("r", ringRadius)
        .attr("fill", "none")
        .attr("stroke", ring.color)
        .attr("stroke-width", config.ringWidth)
        .attr("stroke-opacity", config.ringOpacity);

      // Ring label
      group
        .append("text")
        .attr("x", 0) // Centered
        .attr("y", -ringRadius + 15) // Slightly inside the ring
        .attr("text-anchor", "middle")
        .attr("font-size", "11px")
        .attr("font-weight", "600")
        .attr("fill", ring.color)
        .style("letter-spacing", "1px")
        .text(ring.label);
    }

    // Draw sector lines
    const sectorAngle = (2 * Math.PI) / config.sectors.length;
    for (let i = 0; i < config.sectors.length; i++) {
      const sector = config.sectors[i]!;
      const angle = sectorAngle * i;

      const x1 = 0;
      const y1 = 0;

      const x2 = Math.cos(angle) * radius;
      const y2 = Math.sin(angle) * radius;

      // Separator line
      group
        .append("line")
        .attr("x1", x1)
        .attr("y1", y1)
        .attr("x2", x2)
        .attr("y2", y2)
        .attr("stroke", "var(--color-zinc-500)")
        .attr("stroke-width", 2)
        .attr("stroke-opacity", 0.4);

      // Sector label at the edge
      const multiplier = 1.07;
      const labelX = Math.cos(angle + sectorAngle / 2) * radius * multiplier;
      const labelY = Math.sin(angle + sectorAngle / 2) * radius * multiplier;

      group
        .append("text")
        .attr("x", labelX)
        .attr("y", labelY)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("font-weight", "500")
        .attr("fill", "var(--color-zinc-300)")
        .style("letter-spacing", "1px")
        .text(sector.label);
    }

    // Add the technologies
    const technologyPoints: TechnologyPoint[] = [];
    for (const technology of props.technologies) {
      if (technology.status !== "published") {
        continue;
      }

      const ringIndex = config.rings.findIndex(r => r.name === technology.ring);
      const sectorIndex = config.sectors.findIndex(s => s.name === technology.category);

      if (ringIndex == -1 || sectorIndex == -1) {
        console.warn(`Technology ${technology.name} has invalid ring or category`, technology);
        continue;
      }

      const minRadius = ringIndex === 0 ? 0 : getRingRadius(ringIndex - 1) + 15;
      const maxRadius = getRingRadius(ringIndex) - 15;

      const sectorStartAngle = sectorAngle * sectorIndex;
      const sectorEndAngle = sectorStartAngle + sectorAngle;

      const techRadius = minRadius + Math.random() * (maxRadius - minRadius);
      const techAngle = sectorStartAngle + Math.random() * (sectorEndAngle - sectorStartAngle);

      const x = Math.cos(techAngle) * techRadius;
      const y = Math.sin(techAngle) * techRadius;

      technologyPoints.push({
        x,
        y,
        technology,
      });
    }

    // Draw technology points
    const points = group
      .selectAll(".tech-point")
      .data(technologyPoints)
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
        const selection = d3.select(this);
        const scaledPointSize = config.pointSize * config.hoverScaleMultiplier;
        const scaledImageSize = config.imageSize * config.hoverScaleMultiplier;

        // Scale the circle
        selection
          .select("circle")
          .transition()
          .duration(200)
          .attr("r", scaledPointSize)
          .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.4))");

        // Scale the image if it exists
        selection
          .select("image")
          .transition()
          .duration(200)
          .attr("x", -scaledImageSize / 2)
          .attr("y", -scaledImageSize / 2)
          .attr("width", scaledImageSize)
          .attr("height", scaledImageSize)
          .attr("clip-path", "url(#image-clip-hover)");

        // Scale the text if it exists
        selection
          .select("text")
          .transition()
          .duration(200)
          .attr("font-size", 10 * config.hoverScaleMultiplier);
      })
      .on("mouseout", function (event, d) {
        hoveredTechnology.value = null;
        hoveredPoint.value = null;
        const selection = d3.select(this);

        // Reset circle scale
        selection
          .select("circle")
          .transition()
          .duration(200)
          .attr("r", config.pointSize)
          .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.3))");

        // Reset image scale
        selection
          .select("image")
          .transition()
          .duration(200)
          .attr("x", -config.imageSize / 2)
          .attr("y", -config.imageSize / 2)
          .attr("width", config.imageSize)
          .attr("height", config.imageSize)
          .attr("clip-path", "url(#image-clip)");

        // Reset text scale
        selection.select("text").transition().duration(200).attr("font-size", 10);
      });

    // Technology circles
    points
      .append("circle")
      .attr("r", config.pointSize)
      .attr("fill", d => {
        const ring = config.rings.find(r => r.name === d.technology.ring)!;
        return ring.color;
      })
      .attr("stroke", "var(--color-zinc-900)")
      .attr("stroke-width", 1)
      .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.3))");

    // Technology logos (if available) or initials
    points.each(function (d) {
      const selection = d3.select(this);

      if (d.technology.logoUrl) {
        // Add logo image
        selection
          .append("image")
          .attr("href", d.technology.logoUrl)
          .attr("x", -config.imageSize / 2)
          .attr("y", -config.imageSize / 2)
          .attr("width", config.imageSize)
          .attr("height", config.imageSize)
          .attr("clip-path", "url(#image-clip)")
          .style("pointer-events", "none");
      } else {
        // Add initials text
        selection
          .append("text")
          .attr("x", 0)
          .attr("y", 0)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "central")
          .attr("font-size", 10)
          .attr("font-weight", "600")
          .attr("fill", "white")
          .style("pointer-events", "none")
          .text(initials(d.technology.name));
      }
    });
  };

  onMounted(() => {
    drawRadar();

    // Add resize observer for responsiveness - observe parent container
    if (radarContainer.value?.parentElement) {
      const resizeObserver = new ResizeObserver(() => {
        drawRadar();
      });
      resizeObserver.observe(radarContainer.value.parentElement);

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
  );

  window.addEventListener("resize", useDebounceFn(drawRadar, 200));

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
    <div
      v-if="hoveredTechnology"
      class="absolute z-50 border border-primary bg-zinc-800 rounded-lg shadow-xl w-80"
      :style="tooltipPosition"
    >
      <TechnologyCard :technology="hoveredTechnology" />
    </div>
  </div>
</template>
