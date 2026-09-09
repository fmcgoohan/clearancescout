import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

export function generateSyntheticPdf(outputPath: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 72, bottom: 72, left: 72, right: 72 },
      compress: false,
      info: {
        Title: 'Glacier Brew Spec Screenplay',
        Author: 'ClearanceScout Synthetic Benchmark',
        Subject: 'Synthetic Screenplay Fixture',
        CreationDate: new Date('2026-01-01T00:00:00Z'),
        ModDate: new Date('2026-01-01T00:00:00Z'),
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const buffer = Buffer.concat(chunks);
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, buffer);
      resolve(buffer);
    });
    doc.on('error', reject);

    // Helpers for screenplay layout in Courier 12pt
    const leftMargin = 72;
    const pageWidth = 612;
    const contentWidth = pageWidth - leftMargin * 2; // 468
    const dialogueLeft = 144;
    const dialogueWidth = 288;
    const characterLeft = 216;

    // ==========================================
    // PAGE 1: SCENE 1
    // ==========================================
    doc.font('Courier').fontSize(12);
    let y = 72;

    doc.text('EXT. NEIGHBORHOOD - NIGHT', leftMargin, y);
    y += 28;

    doc.text('A quiet residential street lined with snow-dusted pine trees.', leftMargin, y, { width: contentWidth });
    y += 28;

    doc.text('Jimmy carries a cold can of Glacier Brew under his arm as he walks.', leftMargin, y, { width: contentWidth });
    y += 28;

    doc.text('Next to the porch sits a heavy metal cooler, the Glacier Brew logo embossed across the front lid.', leftMargin, y, { width: contentWidth });
    y += 28;

    doc.text('Overhead, glowing above the rooftops, a massive neon Glacier Brew billboard illuminates the street corner.', leftMargin, y, { width: contentWidth });
    y += 28;

    doc.text('Affixed to a nearby lamppost is a Coldpeak Safety Placard displaying municipal notices.', leftMargin, y, { width: contentWidth });
    y += 36;

    doc.text('JIMMY', characterLeft, y);
    y += 16;
    doc.text('Well, it certainly is a chilly night for a walk.', dialogueLeft, y, { width: dialogueWidth });
    y += 32;

    doc.text('JENNY', characterLeft, y);
    y += 16;
    doc.text('At least you brought your favorite refreshments along.', dialogueLeft, y, { width: dialogueWidth });
    y += 32;

    doc.text('JIMMY', characterLeft, y);
    y += 16;
    doc.text('You know I never head out without them.', dialogueLeft, y, { width: dialogueWidth });

    // ==========================================
    // PAGE 2: SCENE 2
    // ==========================================
    doc.addPage();
    y = 72;

    doc.font('Courier').fontSize(12);
    doc.text('EXT. NEIGHBORHOOD CORNER - CONTINUOUS', leftMargin, y);
    y += 28;

    doc.text('Jimmy and Jenny reach the busy intersection as a light fog rolls in.', leftMargin, y, { width: contentWidth });
    y += 28;

    doc.text('On the side of a parked news vehicle, a mounted screen displays archival footage of Senator Dana Whitlock addressing a press conference.', leftMargin, y, { width: contentWidth });
    y += 28;

    doc.text('Jimmy sets down the pack and reaches for another can of Glacier Brew to pass to Jenny.', leftMargin, y, { width: contentWidth });
    y += 36;

    doc.text('JENNY', characterLeft, y);
    y += 16;
    doc.text('Look at that screen. Is that the local broadcast?', dialogueLeft, y, { width: dialogueWidth });
    y += 32;

    doc.text('JIMMY', characterLeft, y);
    y += 16;
    doc.text('Looks like an archival clip from last year\'s campaign.', dialogueLeft, y, { width: dialogueWidth });
    y += 32;

    doc.text('JENNY', characterLeft, y);
    y += 16;
    doc.text('Things sure have changed since then.', dialogueLeft, y, { width: dialogueWidth });
    y += 32;

    doc.text('JIMMY', characterLeft, y);
    y += 16;
    doc.text('Some things change, but good beer stays the same.', dialogueLeft, y, { width: dialogueWidth });

    // ==========================================
    // PAGE 3: SCENE 3
    // ==========================================
    doc.addPage();
    y = 72;

    doc.font('Courier').fontSize(12);
    doc.text('INT. LIVING ROOM - LATER THAT NIGHT', leftMargin, y);
    y += 28;

    doc.text('A warm living room with a stone fireplace crackling gently.', leftMargin, y, { width: contentWidth });
    y += 28;

    doc.text('Through the floor-to-ceiling panoramic window, the Aurora Pavilion glows against the dark mountain ridge.', leftMargin, y, { width: contentWidth });
    y += 28;

    doc.text('From a vintage wooden radio in the corner, the soft orchestral melody of Northern Lights Waltz by The Frostline Quartet fills the room.', leftMargin, y, { width: contentWidth });
    y += 28;

    doc.text('Jimmy places a chilled can of Glacier Brew onto the coffee table beside a bowl of pretzels.', leftMargin, y, { width: contentWidth });
    y += 36;

    doc.text('JENNY', characterLeft, y);
    y += 16;
    doc.text('The view of the pavilion from here is spectacular.', dialogueLeft, y, { width: dialogueWidth });
    y += 32;

    doc.text('JIMMY', characterLeft, y);
    y += 16;
    doc.text('Nothing beats relaxing here after a long trek.', dialogueLeft, y, { width: dialogueWidth });
    y += 32;

    doc.text('JENNY', characterLeft, y);
    y += 16;
    doc.text('Pass me one of those, would you?', dialogueLeft, y, { width: dialogueWidth });

    // ==========================================
    // PAGE 4: SCENE 3 (CONTINUED) & CONCLUSION
    // ==========================================
    doc.addPage();
    y = 72;

    doc.font('Courier').fontSize(12);
    doc.text('Jenny catches the can smoothly and pops the tab with a satisfying hiss.', leftMargin, y, { width: contentWidth });
    y += 28;

    doc.text('She takes a slow sip of the cold Glacier Brew, leaning back into the sofa cushions.', leftMargin, y, { width: contentWidth });
    y += 36;

    doc.text('JENNY', characterLeft, y);
    y += 16;
    doc.text('Now that hits the spot. Crisp and refreshing.', dialogueLeft, y, { width: dialogueWidth });
    y += 32;

    doc.text('JIMMY', characterLeft, y);
    y += 16;
    doc.text('That is the mountain taste right there.', dialogueLeft, y, { width: dialogueWidth });
    y += 32;

    doc.text('Jimmy raises his can in a quiet toast. Jenny clinks hers against it.', leftMargin, y, { width: contentWidth });
    y += 28;

    doc.text('JIMMY (CONT\'D)', characterLeft, y);
    y += 16;
    doc.text('Here is to smooth clearances and clean scripts.', dialogueLeft, y, { width: dialogueWidth });
    y += 32;

    doc.text('JENNY', characterLeft, y);
    y += 16;
    doc.text('I will drink to that.', dialogueLeft, y, { width: dialogueWidth });
    y += 36;

    doc.text('They sit in comfortable silence as the fire flickers and the snow falls softly outside the window.', leftMargin, y, { width: contentWidth });
    y += 36;

    doc.text('FADE OUT.', leftMargin, y);

    // Deterministic metadata padding stream to satisfy file size > 20,000 bytes
    const pad = 'SCREENPLAY_SYNTHETIC_FIXTURE_PADDING_'.repeat(700);
    doc.ref({ Type: 'Metadata' }).end(pad);

    doc.end();
  });
}

// When executed directly via CLI
if (process.argv[1] && (process.argv[1].endsWith('generate_synthetic_fixture.ts') || process.argv[1].endsWith('generate_synthetic_fixture.js'))) {
  const targetPath = path.resolve(process.cwd(), 'tests/fixtures/glacier_brew_4page.pdf');
  console.log(`Generating synthetic PDF fixture at: ${targetPath}`);
  generateSyntheticPdf(targetPath)
    .then((buf) => {
      console.log(`Successfully generated ${targetPath}`);
      console.log(`Size: ${buf.length} bytes (must be > 20000 bytes)`);
    })
    .catch((err) => {
      console.error('Failed to generate synthetic fixture:', err);
      process.exit(1);
    });
}
