import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

async function loadEnvFile(filePath) {
  const text = await fs.readFile(filePath, 'utf8');

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    process.env[key] = value;
  }
}

function getContentType(extension) {
  const ext = extension.toLowerCase();

  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';

  return null;
}

async function main() {
  const projectRoot = process.cwd();
  const envPath = path.join(projectRoot, '.env.admin');

  await loadEnvFile(envPath);

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
  const imagesFolder = process.env.IMAGES_FOLDER;
  const testItem = process.env.TEST_ITEM;

  if (!supabaseUrl || !supabaseSecretKey || !imagesFolder) {
    throw new Error(
      'Faltan SUPABASE_URL, SUPABASE_SECRET_KEY o IMAGES_FOLDER en .env.admin'
    );
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseSecretKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const entries = await fs.readdir(imagesFolder, {
    withFileTypes: true,
  });

 const imageFiles = entries.filter((entry) => {
  if (!entry.isFile()) return false;

  const extension = path.extname(entry.name);
  const imageCode = path.basename(entry.name, extension);
  const itemNumber =
  imageCode.length === 7 && imageCode.startsWith('0')
    ? imageCode.slice(1)
    : imageCode;

  const isImage = Boolean(getContentType(extension));
  const matchesTestItem =
    !testItem || imageCode === testItem;

  return isImage && matchesTestItem;
  });

  console.log(
    `Se encontraron ${imageFiles.length} imágenes.`
  );

  let uploaded = 0;
  let linked = 0;
  let skipped = 0;
  let failed = 0;

  for (const entry of imageFiles) {
    const filename = entry.name;
    const extension = path.extname(filename);
    
    const imageCode = path.basename(filename, extension);
    
    const itemNumber =
    imageCode.length === 7 && imageCode.startsWith('0')
      ? imageCode.slice(1)
      : imageCode;
      
    const fullPath = path.join(
      imagesFolder,
      filename
    );

    try {
      const fileBuffer = await fs.readFile(fullPath);
      const contentType = getContentType(extension);

      const { error: uploadError } =
        await supabase.storage
          .from('product-images')
          .upload(filename, fileBuffer, {
            contentType,
            upsert: true,
          });

      if (uploadError) {
        throw uploadError;
      }

      uploaded += 1;

      const { data: publicUrlData } =
        supabase.storage
          .from('product-images')
          .getPublicUrl(filename);

      const publicUrl =
        publicUrlData.publicUrl;

      const { data: updatedRows, error: updateError } =
        await supabase
          .from('products')
          .update({
            image_url: publicUrl,
            image_name: filename,
            updated_at: new Date().toISOString(),
          })
          .eq('item_number', itemNumber)
          .select('item_number');

      if (updateError) {
        throw updateError;
      }

      if (!updatedRows || updatedRows.length === 0) {
        skipped += 1;
        console.log(
          `⚠ Sin producto coincidente: ${filename}`
        );
        continue;
      }

      linked += 1;
      console.log(
        `✓ ${filename} → ITEM ${itemNumber}`
      );
    } catch (error) {
      failed += 1;
      console.error(
        `✗ Error con ${filename}:`,
        error.message
      );
    }
  }

  console.log('\nProceso terminado:');
  console.log(`Subidas: ${uploaded}`);
  console.log(`Vinculadas: ${linked}`);
  console.log(
    `Sin producto coincidente: ${skipped}`
  );
  console.log(`Errores: ${failed}`);
}

main().catch((error) => {
  console.error('\nError general:', error.message);
  process.exitCode = 1;
});
