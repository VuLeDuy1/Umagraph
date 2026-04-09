import charas from '../data/characters.json';
import { duoAffinityMatrix, trioAffinityMatrix } from '../functions/Affinity';
const characterImages = import.meta.glob(
'/src/assets/character_sprites/*.png',
{ eager: true, import: 'default' }
);
type Character = {
    id: number;
    name: string;
    image: string;
  };
export type NodeDatum = d3.SimulationNodeDatum & {
    id: string;
    name: string;
    image: string;
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
};
export type LinkDatum = d3.SimulationLinkDatum<NodeDatum> & {
    source: string;
    target: string;
    weight: number;
};

const Characters: Character[] = charas
    .filter((c: any) => c.released === 1)
    .map((c: any) => {
    const imagePath = `/src/assets/character_sprites/${c.name}.png`;

    return {
        id: c.id,
        name: c.name,
        image: characterImages[imagePath] as string
    };
    });
const allCharacterIds = Characters.map(c => c.id);
const Nodes: NodeDatum[] = Characters.map(c => ({
    id: c.id.toString(),
    name: c.name,
    image: c.image,
}));
//find max affinity in duoAffinityMatrix
const MaxAffinity = Math.max(...duoAffinityMatrix(allCharacterIds).flat());
const Norm = (affinity: number): number => {
    return 1-affinity/MaxAffinity;
}
let Links: LinkDatum[] = [];
for (let i = 0; i < allCharacterIds.length; i++) {
    for (let j = i + 1; j < allCharacterIds.length; j++) {
        const weight = Norm(duoAffinityMatrix(allCharacterIds)[i][j] ?? 0);
        if (weight > 0) {
            Links.push({
                source: allCharacterIds[i].toString(),
                target: allCharacterIds[j].toString(),
                weight
            });
        }
    }
}


export { Nodes, Links };

