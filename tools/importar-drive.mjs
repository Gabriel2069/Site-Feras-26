#!/usr/bin/env node
/**
 * FERAS 26 · publicação seletiva de fotos do Drive
 *
 * Uso: GOOGLE_ACCESS_TOKEN=... node tools/importar-drive.mjs [--publish]
 *
 * Fonte privada: private/aprovadas.json, nunca versionar.
 * Saída pública: media/... + content/acervo.json.
 * Depende apenas do Node.js 20+.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "private", "aprovadas.json");
const catalogFile = resolve(root, "content", "acervo.json");
const publish = process.argv.includes("--publish");
const TOKEN = process.env.GOOGLE_ACCESS_TOKEN || "";
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"]
]);
const MAX = 20 * 1024 * 1024;

function fail(message) { throw new Error(message); }
function safeSlug(s) {
  const v = String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (!v) fail("Nome de arquivo ou slug de evento vazio.");
  return v.slice(0, 80);
}
function approved(item) {
  return item && item.autorizadoParaMemorial === true
    && item.revisadoPor && item.alt && item.legenda
    && (item.menor !== true || item.responsavelAutorizou === true);
}
async function fetchDriveMedia(fileId) {
  if (!/^[a-zA-Z0-9_-]{10,}$/.test(fileId)) fail("ID do Drive inválido.");
  const url = "https://www.googleapis.com/drive/v3/files/" + encodeURIComponent(fileId) + "?alt=media";
  const res = await fetch(url, { headers: { Authorization: "Bearer " + TOKEN } });
  if (!res.ok) fail("Google Drive retornou " + res.status + " para a mídia informada.");
  const type = (res.headers.get("content-type") || "").split(";")[0].toLowerCase();
  if (!ALLOWED.has(type)) fail("Formato não permitido: " + type);
  const contentLength = Number(res.headers.get("content-length") || 0);
  if (contentLength > MAX) fail("Imagem maior que 20 MB.");
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength === 0 || buf.byteLength > MAX) fail("Imagem vazia ou maior que 20 MB.");
  return { buf, type };
}

async function main() {
  const approvalData = JSON.parse(await readFile(source, "utf8"));
  if (!Array.isArray(approvalData)) fail("private/aprovadas.json deve ser uma lista.");
  const catalog = JSON.parse(await readFile(catalogFile, "utf8"));
  const ids = new Set((catalog.eventos || []).map(e => e.id));
  const seen = new Set();
  const destinations = new Set();
  const batch = approvalData.map((item, index) => {
    if (!approved(item)) fail("Item " + (index + 1) + " sem autorização completa ou revisão.");
    if (!ids.has(item.evento)) fail("Evento desconhecido: " + item.evento);
    if (!/^[a-zA-Z0-9_-]{10,}$/.test(item.driveFileId || "")) fail("ID ausente/errado no item " + (index + 1));
    if (seen.has(item.driveFileId)) fail("Arquivo repetido na lista: item " + (index + 1));
    seen.add(item.driveFileId);
    const destination = item.evento + "/" + safeSlug(item.nomePublicacao || item.alt);
    if (destinations.has(destination)) fail("Nome público repetido: " + destination);
    destinations.add(destination);
    return item;
  });

  console.log("FERAS 26 · " + batch.length + " arquivos explicitamente aprovados.");
  if (!publish) {
    console.log("Validação concluída. Nada foi publicado. Use --publish para exportar.");
    return;
  }
  if (!TOKEN) fail("Defina GOOGLE_ACCESS_TOKEN com escopo drive.readonly.");

  const updated = new Map();
  for (const item of batch) {
    const { buf, type } = await fetchDriveMedia(item.driveFileId);
    const ext = ALLOWED.get(type);
    const name = safeSlug(item.nomePublicacao || item.alt);
    const folder = join(root, "media", item.evento);
    await mkdir(folder, { recursive: true });
    const target = join(folder, name + "." + ext);
    await writeFile(target, buf);
    const media = {
      src: "./media/" + item.evento + "/" + name + "." + ext,
      alt: String(item.alt).trim(),
      legenda: String(item.legenda).trim()
    };
    if (!updated.has(item.evento)) updated.set(item.evento, []);
    updated.get(item.evento).push(media);
    console.log("Preparado: " + item.evento + " / " + name + "." + ext);
  }

  catalog.eventos = catalog.eventos.map(event => {
    if (!updated.has(event.id)) return event;
    return { ...event, midias: updated.get(event.id), estado: "publicado" };
  });
  await writeFile(catalogFile, JSON.stringify(catalog, null, 2) + "\n");
  console.log("Manifesto público atualizado. Revise as fotos exportadas antes de fazer commit.");
}
main().catch(error => {
  console.error("Não foi possível publicar: " + error.message);
  process.exitCode = 1;
});
