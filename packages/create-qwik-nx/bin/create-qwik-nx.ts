import { execSync } from 'child_process';

execSync(`npx -y create-nx-workspace@latest --preset=qwik-nx`, {
  stdio: [0, 1, 2],
});
