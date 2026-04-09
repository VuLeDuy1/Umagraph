<script lang="ts">
  import "./CharacterPicker.css";
  export type CharacterOption = {
    id: number;
    name: string;
    image: string;
  };

  // Props
  let {
    open,
    options = [],
    selectedOptions = [],
    onSelect,
  }: {
    open: boolean;
    options: CharacterOption[];
    selectedOptions: CharacterOption[];
    onSelect: (characters: CharacterOption[]) => void;
  } = $props();

  // Local state
  let search = $state("");
    let localSelected = $state<CharacterOption[]>([]);

    $effect(() => {
    if (open) {
        localSelected = [...selectedOptions];
    }
    });


  // Derived filtered list
  const filtered = $derived.by(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) =>
      o.name.toLowerCase().includes(q)
    );
  });

  // Toggle individual selection
  function toggleCharacter(c: CharacterOption) {
    const exists = localSelected.some((x) => x.id === c.id);
    if (exists) {
      localSelected = localSelected.filter((x) => x.id !== c.id);
    } else {
      localSelected = [...localSelected, c];
    }
  }

  // Select all / unselect all
  const allSelected = $derived(
    options.length > 0 &&
    localSelected.length === options.length
  );

  function toggleAll() {
    if (allSelected) {
      localSelected = [];
    } else {
      localSelected = [...options];
    }
    confirmSelection();
  }

  function confirmSelection() {
    onSelect(localSelected);
  }
</script>

{#if open}
  <div class="modalOverlay" role="dialog" aria-modal="true">
    <div class="modalCard">

      <div class="modalBody">
        <div class="modalSearchRow">
            <input
              class="modalSearch"
              placeholder="Search..."
              bind:value={search}
            />
          <!-- Select All / Unselect All -->
          <button
            type="button"
            class="modalBtn modalBtn--ghost"
            style="max-width: 120px;"
            onclick={toggleAll}
          >
            {allSelected ? "Unselect All" : "Select All"}
          </button>
        </div>

        <div class="modalGridWrap">
          <div class="modalGrid">

            {#each filtered as c (c.id)}
              <button
                type="button"
                class="charTile {localSelected.some(x => x.id === c.id) ? 'charTile--selected' : ''}"
                onclick={() => {toggleCharacter(c); confirmSelection()}}
              >
                <div class="charCircle">
                  <img
                    class="charImg"
                    src={c.image}
                    alt={c.name}
                  />
                </div>

                <div class="charName">{c.name}</div>
              </button>
            {/each}

          </div>
        </div>
      </div>
    </div>
  </div>
{/if}