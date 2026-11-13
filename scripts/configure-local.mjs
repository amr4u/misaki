import { copyFile, constants } from 'node:fs/promises';

// This only supplies a local manifest. Sites registration supplies the real
// project_id; never overwrite an existing account's hosting configuration.
try {
  await copyFile(
    new URL('../.openai/hosting.example.json', import.meta.url),
    new URL('../.openai/hosting.json', import.meta.url),
    constants.COPYFILE_EXCL,
  );
  console.log('Created local hosting configuration. No Site has been registered.');
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  console.log('Kept existing hosting configuration.');
}
