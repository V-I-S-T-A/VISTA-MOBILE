// PDF encoding shared with the verified Web approval workflow; input is JPEG bytes.
const PAGE_WIDTH = 595.28, PAGE_HEIGHT = 841.89;
function encode(text) {
  return Uint8Array.from(text, character => character.charCodeAt(0));
}

function joinBytes(parts) {
  const result = new Uint8Array(
    parts.reduce((size, part) => size + part.length, 0),
  );
  let offset = 0;
  parts.forEach((part) => {
    result.set(part, offset);
    offset += part.length;
  });
  return result;
}

function buildImagePdf(images) {
  if (!images.length) throw new Error("Choose at least one image to convert.");
  const pageCount = images.length;
  const objectCount = 2 + pageCount * 3;
  const objects = new Array(objectCount + 1);
  const kids = images.map((_, index) => `${3 + index * 3} 0 R`).join(" ");
  objects[1] = encode("<< /Type /Catalog /Pages 2 0 R >>");
  objects[2] = encode(`<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>`);

  images.forEach((image, index) => {
    const pageId = 3 + index * 3;
    const contentId = pageId + 1;
    const imageId = pageId + 2;
    const scale = Math.min(
      PAGE_WIDTH / image.width,
      PAGE_HEIGHT / image.height,
    );
    const width = image.width * scale;
    const height = image.height * scale;
    const x = (PAGE_WIDTH - width) / 2;
    const y = (PAGE_HEIGHT - height) / 2;
    const content = encode(
      `q\n${width.toFixed(2)} 0 0 ${height.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/Im${index + 1} Do\nQ\n`,
    );

    objects[pageId] = encode(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /XObject << /Im${index + 1} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    objects[contentId] = joinBytes([
      encode(`<< /Length ${content.length} >>\nstream\n`),
      content,
      encode("endstream"),
    ]);
    objects[imageId] = joinBytes([
      encode(
        `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.bytes.length} >>\nstream\n`,
      ),
      image.bytes,
      encode("\nendstream"),
    ]);
  });

  const chunks = [encode("%PDF-1.4\n")];
  const offsets = new Array(objectCount + 1).fill(0);
  let byteLength = chunks[0].length;
  for (let id = 1; id <= objectCount; id += 1) {
    const objectChunk = joinBytes([
      encode(`${id} 0 obj\n`),
      objects[id],
      encode("\nendobj\n"),
    ]);
    offsets[id] = byteLength;
    chunks.push(objectChunk);
    byteLength += objectChunk.length;
  }

  const xrefOffset = byteLength;
  let xref = `xref\n0 ${objectCount + 1}\n0000000000 65535 f \n`;
  for (let id = 1; id <= objectCount; id += 1) {
    xref += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  chunks.push(
    encode(
      `${xref}trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
    ),
  );

  return joinBytes(chunks);
}

module.exports = { buildImagePdf };
