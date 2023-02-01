#!/usr/bin/env node

import { execSync } from 'child_process';

// Delegating to create-nx-workspace

execSync(`npx -y create-nx-workspace@latest --preset=qwik-nx`, {
  stdio: [0, 1, 2],
});
