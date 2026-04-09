<script lang="ts">
  import Graph from './components/Graph.svelte'
  import filterIcon from './assets/filter.png';
  import gearIcon from './assets/Gear-icon.png';
  import "./GraphPage.css";
  import CharacterPickerMulti from './components/CharacterPickerMulti.svelte';
  import { baseOptions } from './GraphPage';

  let showAdvancedControls = $state(false);
  let showFilter = $state(false);
  let pow = $state(2.5);
  let allowDrag = $state(false);
  let selectedCharacters = $state(baseOptions);

</script>

<div class="graph-svg">
  <Graph {pow} {allowDrag} characters={selectedCharacters} />
</div>

<button class="filter-toggle" onclick={() => showFilter = !showFilter}>
  <img src={filterIcon} alt="Filter"/>
</button>

{#if showFilter}
<div class="filter-div">
  <CharacterPickerMulti
    open={showFilter}
    options={baseOptions}
    selectedOptions={selectedCharacters}
    onSelect={(chars) => {
      selectedCharacters = chars;
    }}
  />
</div>
{/if}

<button class="advanced-toggle" onclick={() => showAdvancedControls = !showAdvancedControls}>
  <img src={gearIcon} alt="Advanced"/>
</button>

{#if showAdvancedControls}
<div class= "advanced-div">
  <div class="advanced-control" >
    <label for="pow-slider">Power: {pow.toFixed(1)}</label>
    <input id="pow-slider" type="range" min="0.1" max="5" step="0.1" bind:value={pow} />
  </div>
  <div class="advanced-control" >
    <label for="drag-toggle">Allow dragging:</label>
    <input id="drag-toggle" type="checkbox" bind:checked={allowDrag} />
  </div>

</div>
{/if}

