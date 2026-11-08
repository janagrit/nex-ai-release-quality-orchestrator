import { writeFile } from 'node:fs/promises';
import { baseline, candidate } from './profiles.js';
import { orchestrate } from './quality.js';
const result=orchestrate(baseline,candidate);
await writeFile('comparison-report.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
