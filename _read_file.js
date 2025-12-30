import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function searchFiles(dir, pattern) {
  const files = readdirSync(dir);
  for (const file of files) {
    const fullPath = join(dir, file);
    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
        searchFiles(fullPath, pattern);
      } else if (file.endsWith('.vue')) {
        const content = readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (line.includes('success') && line.includes('审批')) {
            console.log(`${fullPath}:${i + 1}: ${line.trim()}`);
          }
        });
      }
    } catch (e) {}
  }
}

searchFiles('src', 'success');
