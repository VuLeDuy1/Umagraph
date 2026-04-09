<script lang="ts">
  import * as d3 from "d3";
  import { Nodes, Links } from "./Graph";
  import type { NodeDatum, LinkDatum } from "./Graph";

  type ExtendedNodeDatum = NodeDatum & { hovered?: boolean; dragging?: boolean };

  let width = $state(0);
  let height = $state(0);
  let currentTransform = d3.zoomIdentity;
  let graphSvg = $state<SVGSVGElement | null>(null);
  let zoom: d3.ZoomBehavior<SVGSVGElement, unknown>;
  let prevWidth = 0;
  let prevHeight = 0;

  let simulation: d3.Simulation<ExtendedNodeDatum, LinkDatum>;
  let linkForce: d3.ForceLink<ExtendedNodeDatum, LinkDatum>;

  let {pow, allowDrag, characters} = $props();

  const nodeScale = 1;
  const nodeVisualScale = 30;

  let nodeSelection: d3.Selection<SVGGElement, ExtendedNodeDatum, SVGGElement, unknown>;
  const dragBehavior = d3.drag<SVGGElement, ExtendedNodeDatum>()
    .on("start", (event, d) => {
      if (!allowDrag) return;
      d.fx = d.x;
      d.fy = d.y;
      d.dragging = true;
    })
    .on("drag", (event, d) => {
      if (!allowDrag) return;
      d.fx = event.x;
      d.fy = event.y;
    })
    .on("end", (event, d) => {
      if (!allowDrag) return;
      d.fx = null;
      d.fy = null;
      d.dragging = false;
    });
  let visibleIDs = $derived(new Set(characters.map(c => c.id.toString())));
  function updateNodesAndLinks() {
    // Remove images for hidden nodes, set images for non-hidden nodes
    nodeSelection.select("image")
      .attr("href", d => visibleIDs.has(d.id.toString()) ? d.image : "")
      .attr("pointer-events", d => visibleIDs.has(d.id.toString()) ? "auto" : "none");
    
    // Zero out link forces for hidden nodes, set force for non-hidden nodes
    updateLinkForce();
  }
  function updateLinkForce() {
    linkForce
      .distance(d => 500*nodeScale * Math.pow(d.weight, pow) * pow)
      .strength(d => {
      const sourceId = typeof d.source === 'string' ? d.source : (d.source as any).id;
      const targetId = typeof d.target === 'string' ? d.target : (d.target as any).id;
      if (visibleIDs.has(sourceId) && visibleIDs.has(targetId)) {
        return Math.pow(1 - d.weight, pow) * pow * .02*nodeScale;
      }
      return 0;
    });
    simulation.alpha(1).restart();
  }
  $effect(() => {
    characters;
    if (!simulation || !linkForce) return;
    updateNodesAndLinks();
  });
  $effect(() => {
    pow;
    if (!simulation || !linkForce) return;
    updateLinkForce();
  });
  $effect(() => {
  if (!graphSvg || simulation) return; // ← prevents re-init

  const nodes = Nodes.map(d => ({ ...d, hovered: false } as ExtendedNodeDatum));
  const links = Links.map(d => ({ ...d }));

  // reset positions
  nodes.forEach(node => {
    node.x = width ? width / 2 : 400;
    node.y = height ? height / 2 : 300;
  });

  const root = d3.select(graphSvg);
  root.selectAll("*").remove();

  const g = root.append("g");

  nodeSelection = g.selectAll("g.node")
    .data(nodes)
    .enter()
    .append("g")
    .attr("class", "node")
    .call(dragBehavior)
    .on("mouseenter", function(event, d) {
      d.hovered = true;
      d3.select(this).select("image").attr("filter", "url(#node-hover-outline)");
      // show label
      d3.select(this).select("text").attr("opacity", 1.0);
    })
    .on("mouseleave", function(event, d) {
      //check if is dragging
      if (d.dragging) return;
      d.hovered = false;
      d3.select(this).select("image").attr("filter", null);
      // hide label
      d3.select(this).select("text").transition().duration(200).attr("opacity", 0.0);
    });

  nodeSelection.append("image")
      .attr("width", nodeScale*nodeVisualScale)
      .attr("height", nodeScale*nodeVisualScale)
      .attr("href", d => d.image)
      .attr("x", -nodeScale*nodeVisualScale/2)
      .attr("y", -nodeScale*nodeVisualScale/2);

  //Add node labels
  nodeSelection.append("text")
    .text(d => d.name)
    .attr("font-size", 20)
    .attr("dominant-baseline", "hanging")
    .attr("text-anchor", "middle")
    .attr("pointer-events", "none")
    .attr("fill", "#fff")
    .attr("stroke", "#000")
    .attr("stroke-width", 0.2)
    .attr("opacity", 0.0);

  zoom = d3.zoom<SVGSVGElement, unknown>()
  .scaleExtent([0.1, 50])
  .on("zoom", (event) => {
    const t = event.transform;
    currentTransform = t;

    const nonLinearScale = Math.pow(1/t.k, .3);

    g.attr("transform", t);
    g.selectAll("g.node image")
      .attr("transform", `scale(${nonLinearScale})`);

    // cancel zoom scaling for all labels
    g.selectAll("g.node text")
    .attr("transform", `scale(${1 / t.k})`)
    .attr("y", nodeScale * nodeVisualScale * t.k * nonLinearScale * .6);
  });

  root.call(zoom);

  linkForce = d3
    .forceLink<NodeDatum, LinkDatum>(links)
    .id(d => d.id);
  simulation = d3
    .forceSimulation(nodes)
    .alpha(1)
    .alphaDecay(0.000)
    .alphaMin(0.001)
    .restart()
    .force("link", linkForce)
    .force("center", d3.forceCenter(width / 2, height / 2).strength(nodeScale*1))
    .force("collision", d3.forceCollide(6*nodeScale).strength(nodeScale*1));

const observer = new ResizeObserver((entries) => {
  if (!simulation) return; // safety check
  const rect = entries[0].contentRect;

  const newWidth = rect.width;
  const newHeight = rect.height;

  if (newWidth === 0 || newHeight === 0) return;

  const sx = newWidth / (prevWidth || newWidth);
  const sy = newHeight / (prevHeight || newHeight);

  // preserve zoom/pan
  currentTransform = d3.zoomIdentity
    .translate(currentTransform.x * sx, currentTransform.y * sy)
    .scale(currentTransform.k);

  width = newWidth;
  height = newHeight;

  const root = d3.select(graphSvg!);

  // update viewport
  root.attr("viewBox", `0 0 ${width} ${height}`);

  // reapply zoom without triggering loops
  root.call(zoom.transform, currentTransform);

  // gently update simulation center
  simulation
    .force("center", d3.forceCenter(width / 2, height / 2))

  prevWidth = newWidth;
  prevHeight = newHeight;
});
  observer.observe(graphSvg!);
    
  simulation.on("tick", () => {
    nodeSelection
      .sort((a: ExtendedNodeDatum, b: ExtendedNodeDatum) => {
        if (a.hovered && !b.hovered) return 1;
        if (!a.hovered && b.hovered) return -1;
        const yDiff = Math.abs((a.y ?? 0) - (b.y ?? 0));
        const threshold = 5; // pixels
        
        if (yDiff < threshold) {
          return  (a.x ?? 0) - (b.x ?? 0);
        }
        return (a.y ?? 0) - (b.y ?? 0);
      })
      .attr("transform", d => `translate(${d.x ?? 0},${d.y ?? 0})`);
  });
  // apply initial force config
  updateLinkForce();
});
</script>

<!-- SVG filter for node hover outline -->
<svg width="0" height="0" style="position:absolute">
  <defs>
    <filter id="node-hover-outline" x="-50%" y="-50%" width="200%" height="200%">
      <feMorphology in="SourceAlpha" operator="dilate" radius="1.3" result="dilated"/>
      
      <feFlood flood-color="#ffffff" flood-opacity="0.9" result="color"/>
      
      <feComposite in="color" in2="dilated" operator="in" result="outline"/>
      
      <feComposite in="outline" in2="SourceAlpha" operator="out" result="stroke"/>
      
      <feMerge>
        <feMergeNode in="stroke"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
</svg>

<svg bind:this={graphSvg} width="100%" height="100%"></svg>


