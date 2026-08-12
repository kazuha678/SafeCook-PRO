const { spawn } = require('child_process');  
function startTunnel() {  
  const lt = spawn('npx', ['-y', 'localtunnel', '--port', '8080'], { shell: true, stdio: ['ignore', 'pipe', 'pipe'] });  
  lt.stdout.on('data', (d) => process.stdout.write('[tunnel] ' + d));  
  lt.on('close', (c) => { console.log('[tunnel] Disconnected. Restarting...'); setTimeout(startTunnel, 3000); });  
}  
startTunnel();  
