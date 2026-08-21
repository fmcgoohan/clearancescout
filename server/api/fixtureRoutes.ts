import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const fixtureRouter = Router();

fixtureRouter.get('/fixtures/demo-screenplay', (req: Request, res: Response) => {
  try {
    // Look in root fixtures/ directory
    const fixturePath = path.resolve(__dirname, '../../fixtures/demo_screenplay.txt');
    
    if (fs.existsSync(fixturePath)) {
      const scriptText = fs.readFileSync(fixturePath, 'utf-8');
      return res.json({
        title: 'The Neon Horizon',
        sourceLabel: 'The Neon Horizon (Bundled Fictional Demo)',
        sourceType: 'DEMO_FIXTURE',
        format: 'PLAINTEXT',
        scriptText,
      });
    }

    // Fallback embedded string if file not accessible in bundle
    const embeddedScript = `TITLE: THE NEON HORIZON
AUTHOR: Entrant Studio Team
FORMAT: Feature Screenplay Excerpt (Fully Fictional Assets)

INT. PENTHOUSE WORKSPACE - NIGHT

Rain lashes against floor-to-ceiling glass overlooking the neon cityscape.

ALEX (30s) sits at a curved glass desk. He taps the illuminated keyboard of his AeroTech Prism Laptop. Data streams across the transparent display.

On the desk rests a chilled crimson can of Summit Cola. Alex pops the tab and takes a drink.

Across the room, an ambient holo-screen broadcasts an archival profile of Elena Vance delivering her landmark keynote on orbital power grids.

From the spatial audio system, the atmospheric synth-rock melody of Nocturne of the Wild plays softly in the background.

EXT. MIDTOWN SPIRE TOWER - NIGHT

Down on the wet asphalt, streetlights reflect in glistening puddles.

JORDAN (20s) steers a sleek metallic silver Veloce GT sports coupe into the private circular driveway directly beneath the soaring art-deco arches of the Midtown Spire Tower.

Jordan steps out, locking the car with a subtle chime.

INT. INDUSTRIAL SUB-LEVEL - NIGHT

Jordan walks through the reinforced maintenance corridor.

Along the heavy steel bulkhead, a weathered warning sign is bolted to the wall: a bold yellow-and-black Titan Industrial Hazard Placard flashing an active circuit warning.

Jordan inputs the security code. The hydraulic lock hisses open.`;

    return res.json({
      title: 'The Neon Horizon',
      sourceLabel: 'The Neon Horizon (Bundled Fictional Demo)',
      sourceType: 'DEMO_FIXTURE',
      format: 'PLAINTEXT',
      scriptText: embeddedScript,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load demo screenplay fixture' });
  }
});
