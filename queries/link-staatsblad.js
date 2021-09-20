import path from 'path'
import fs from 'fs/promises'
import { updateSudo } from '@lblod/mu-auth-sudo';

async function linkStaatsblad (subject, graphs) {
  const queryString = await fs.readFile(path.join(__dirname, 'link-staatsblad.sparql'), 'utf-8');
  return updateSudo(queryString);
}

export default linkStaatsblad;
